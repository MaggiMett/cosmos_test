import {
  cloneAndFreeze,
  cosmosMainRoomCatalogObjects,
  cosmosMainRoomShell,
  validateCatalogObject,
  validateRoomShell,
  type CatalogObject,
  type RoomShell,
  type ThemeBuilderProject,
} from "../../theme-engine";

export type BuilderArtifactDraftCommand =
  | Readonly<{ type: "create-room-shell-draft"; name?: string }>
  | Readonly<{ type: "update-room-shell-draft"; shellId: string; displayName: string; perspectiveProfile: string }>
  | Readonly<{ type: "remove-room-shell-draft"; shellId: string }>
  | Readonly<{ type: "create-catalog-object-draft"; sourceCatalogObjectId?: string; name?: string }>
  | Readonly<{ type: "update-catalog-object-draft"; catalogObjectId: string; displayName: string; scale: number }>
  | Readonly<{ type: "remove-catalog-object-draft"; catalogObjectId: string }>;

export class BuilderArtifactDraftError extends Error {
  constructor(readonly code: "unknown-artifact" | "invalid-artifact" | "duplicate-artifact", message: string) {
    super(message);
    this.name = "BuilderArtifactDraftError";
  }
}

export function applyBuilderArtifactDraftCommand(
  project: Readonly<ThemeBuilderProject>,
  command: Readonly<BuilderArtifactDraftCommand>,
): Readonly<ThemeBuilderProject> {
  switch (command.type) {
    case "create-room-shell-draft": return createRoomShell(project, command.name);
    case "update-room-shell-draft": return updateRoomShell(project, command);
    case "remove-room-shell-draft": return cloneAndFreeze({
      ...project,
      artifacts: { ...project.artifacts, roomShells: project.artifacts.roomShells.filter((item) => item.shellId !== command.shellId) },
    });
    case "create-catalog-object-draft": return createCatalogObject(project, command.sourceCatalogObjectId, command.name);
    case "update-catalog-object-draft": return updateCatalogObject(project, command);
    case "remove-catalog-object-draft": return cloneAndFreeze({
      ...project,
      artifacts: { ...project.artifacts, catalogObjects: project.artifacts.catalogObjects.filter((item) => item.catalogObjectId !== command.catalogObjectId) },
    });
  }
}

function createRoomShell(project: Readonly<ThemeBuilderProject>, name?: string): Readonly<ThemeBuilderProject> {
  const suffix = project.builderProjectId.split(".").at(-1) ?? "draft";
  const ordinal = project.artifacts.roomShells.length + 1;
  const shellId = `user.room-shell.${suffix}.${ordinal}`;
  if (project.artifacts.roomShells.some((item) => item.shellId === shellId)) {
    throw new BuilderArtifactDraftError("duplicate-artifact", `Room Shell ${shellId} already exists.`);
  }
  const shell: RoomShell = validateRoomShell({
    ...structuredClone(cosmosMainRoomShell),
    shellId,
    version: project.themeVersion,
    displayName: name?.trim() || `Room Shell ${ordinal}`,
  });
  return cloneAndFreeze({
    ...project,
    artifacts: { ...project.artifacts, roomShells: [...project.artifacts.roomShells, shell] },
  });
}

function updateRoomShell(
  project: Readonly<ThemeBuilderProject>,
  command: Extract<BuilderArtifactDraftCommand, { type: "update-room-shell-draft" }>,
): Readonly<ThemeBuilderProject> {
  const existing = project.artifacts.roomShells.find((item) => item.shellId === command.shellId);
  if (!existing) throw new BuilderArtifactDraftError("unknown-artifact", `Room Shell ${command.shellId} is not in this draft.`);
  const displayName = command.displayName.trim();
  const perspectiveProfile = command.perspectiveProfile.trim();
  if (!displayName || !perspectiveProfile) throw new BuilderArtifactDraftError("invalid-artifact", "Room Shell name and perspective profile are required.");
  const updated = validateRoomShell({ ...structuredClone(existing), displayName, perspectiveProfile });
  return cloneAndFreeze({
    ...project,
    artifacts: {
      ...project.artifacts,
      roomShells: project.artifacts.roomShells.map((item) => item.shellId === command.shellId ? updated : item),
    },
  });
}

function createCatalogObject(
  project: Readonly<ThemeBuilderProject>,
  sourceCatalogObjectId?: string,
  name?: string,
): Readonly<ThemeBuilderProject> {
  const source = cosmosMainRoomCatalogObjects.find((item) => item.catalogObjectId === sourceCatalogObjectId)
    ?? cosmosMainRoomCatalogObjects[0];
  if (!source) throw new BuilderArtifactDraftError("invalid-artifact", "No Core Catalog Object template is available.");
  const suffix = project.builderProjectId.split(".").at(-1) ?? "draft";
  const ordinal = project.artifacts.catalogObjects.length + 1;
  const catalogObjectId = `user.catalog-object.${suffix}.${ordinal}`;
  const object: CatalogObject = validateCatalogObject({
    ...structuredClone(source),
    catalogObjectId,
    version: project.themeVersion,
    displayName: name?.trim() || `${source.displayName} ${ordinal}`,
  });
  return cloneAndFreeze({
    ...project,
    artifacts: { ...project.artifacts, catalogObjects: [...project.artifacts.catalogObjects, object] },
  });
}

function updateCatalogObject(
  project: Readonly<ThemeBuilderProject>,
  command: Extract<BuilderArtifactDraftCommand, { type: "update-catalog-object-draft" }>,
): Readonly<ThemeBuilderProject> {
  const existing = project.artifacts.catalogObjects.find((item) => item.catalogObjectId === command.catalogObjectId);
  if (!existing) throw new BuilderArtifactDraftError("unknown-artifact", `Catalog Object ${command.catalogObjectId} is not in this draft.`);
  const displayName = command.displayName.trim();
  if (!displayName || !Number.isFinite(command.scale) || command.scale < existing.scale.minimum || command.scale > existing.scale.maximum) {
    throw new BuilderArtifactDraftError("invalid-artifact", "Catalog Object name or scale is invalid.");
  }
  const updated = validateCatalogObject({
    ...structuredClone(existing),
    displayName,
    scale: { ...existing.scale, defaultX: command.scale, defaultY: command.scale },
  });
  return cloneAndFreeze({
    ...project,
    artifacts: {
      ...project.artifacts,
      catalogObjects: project.artifacts.catalogObjects.map((item) => item.catalogObjectId === command.catalogObjectId ? updated : item),
    },
  });
}
