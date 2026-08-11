import type { CatalogObject, RoomShell } from "./roomCompositionTypes";
import type { ExactVersionedRef } from "./assetCatalogTypes";
import type { SkinPack, ThemeManifest } from "./types";
import { cloneAndFreeze } from "./immutable";
import { validateCatalogObject, validateRoomShell, validateSkinPack } from "./validation";

export interface ThemeBuilderProjectMetadata {
  name: string;
  description: string;
  author: string;
}

export interface ThemeBuilderProjectArtifacts {
  skinPacks: readonly SkinPack[];
  roomShells: readonly RoomShell[];
  catalogObjects: readonly CatalogObject[];
}

export interface ThemeBuilderProject {
  schemaVersion: 1;
  builderProjectId: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  contractVersions: Readonly<{ themeBuilder: string; themeEngine: string }>;
  themeId: string;
  packageId: string;
  name: string;
  description: string;
  author: string;
  packageType: "full-theme" | "group-pack";
  themeVersion: string;
  packageVersion: string;
  manifestDraft: ThemeManifest;
  artifacts: ThemeBuilderProjectArtifacts;
  assetRefs: readonly ExactVersionedRef[];
}

export function validateThemeBuilderProject(value: unknown): Readonly<ThemeBuilderProject> {
  if (!isRecord(value) || value.schemaVersion !== 1) invalid();
  const project = value as unknown as ThemeBuilderProject;
  for (const key of ["builderProjectId", "themeId", "packageId", "name"] as const) {
    if (typeof project[key] !== "string" || !project[key].trim()) invalid();
  }
  for (const key of ["description", "author", "createdAt", "updatedAt"] as const) {
    if (typeof project[key] !== "string") invalid();
  }
  if (!Number.isInteger(project.revision) || project.revision < 1) invalid();
  if (!isRecord(project.contractVersions)) invalid();
  if (!isRecord(project.manifestDraft) || !isRecord(project.artifacts)) invalid();
  if (
    !Array.isArray(project.artifacts.skinPacks) ||
    !Array.isArray(project.artifacts.roomShells) ||
    !Array.isArray(project.artifacts.catalogObjects) ||
    !Array.isArray(project.assetRefs) ||
    !validAssetReferences(project.assetRefs)
  ) invalid();
  try {
    project.artifacts.skinPacks.forEach(validateSkinPack);
    project.artifacts.roomShells.forEach(validateRoomShell);
    project.artifacts.catalogObjects.forEach(validateCatalogObject);
  } catch {
    invalid();
  }
  if (
    project.manifestDraft.themeId !== project.themeId ||
    project.manifestDraft.displayName !== project.name ||
    project.manifestDraft.version !== project.themeVersion
  ) invalid();
  return cloneAndFreeze(project);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validAssetReferences(value: readonly unknown[]): boolean {
  const seen = new Set<string>();
  return value.every((item) => {
    if (!isRecord(item) || Object.keys(item).length !== 2) return false;
    if (typeof item.id !== "string" || typeof item.version !== "string") return false;
    const identity = `${item.id}@${item.version}`;
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

function invalid(): never {
  throw new Error("Theme Builder Project response is invalid.");
}
