import {
  cloneAndFreeze,
  type ThemeBuilderProject,
  type ThemeBuilderProjectMetadata,
  type ThemeBuilderProjectArtifacts,
  type ExactVersionedRef,
  type TemplateRegistry,
} from "../../theme-engine";
import type { ApiError, ApiResult } from "../../runtime/contracts";
import {
  BuilderAssetCatalogIndex,
  BuilderAssetReferenceError,
} from "./themeBuilderAssetReferences";
import { applySkinDraftCommand, type SkinDraftCommand } from "./themeBuilderSkinDraft";
import { applyBuilderArtifactDraftCommand, type BuilderArtifactDraftCommand } from "./themeBuilderArtifactDrafts";

export interface UpdateThemeMetadataCommand {
  type: "update-theme-metadata";
  metadata: ThemeBuilderProjectMetadata;
}

export interface AddAssetReferenceCommand {
  type: "add-asset-reference";
  assetId: string;
}

export interface RemoveAssetReferenceCommand {
  type: "remove-asset-reference";
  reference: Readonly<ExactVersionedRef>;
}

export type ThemeBuilderCommand =
  | UpdateThemeMetadataCommand
  | AddAssetReferenceCommand
  | RemoveAssetReferenceCommand
  | SkinDraftCommand
  | BuilderArtifactDraftCommand;

export interface ThemeBuilderSavePort {
  saveDraft(
    builderProjectId: string,
    expectedRevision: number,
    metadata: ThemeBuilderProjectMetadata,
    assetRefs: readonly ExactVersionedRef[],
    artifacts: Readonly<ThemeBuilderProjectArtifacts>,
  ): Promise<ApiResult<Readonly<ThemeBuilderProject>>>;
}

export interface ThemeBuilderSessionSnapshot {
  project: Readonly<ThemeBuilderProject>;
  dirty: boolean;
  saving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  saveError?: ApiError;
  saveConflict?: ApiError;
}

export class ThemeBuilderSession {
  private states: Readonly<ThemeBuilderProject>[];
  private cursor = 0;
  private savedCursor = 0;
  private authoritativeRevision: number;
  private saving = false;
  private saveError?: ApiError;
  private saveConflict?: ApiError;

  constructor(
    project: Readonly<ThemeBuilderProject>,
    private readonly templates?: TemplateRegistry,
  ) {
    this.states = [cloneAndFreeze(project)];
    this.authoritativeRevision = project.revision;
  }

  get snapshot(): Readonly<ThemeBuilderSessionSnapshot> {
    return Object.freeze({
      project: this.states[this.cursor]!,
      dirty: this.cursor !== this.savedCursor,
      saving: this.saving,
      canUndo: this.cursor > 0,
      canRedo: this.cursor < this.states.length - 1,
      ...(this.saveError ? { saveError: this.saveError } : {}),
      ...(this.saveConflict ? { saveConflict: this.saveConflict } : {}),
    });
  }

  execute(command: Readonly<ThemeBuilderCommand>, catalog?: BuilderAssetCatalogIndex): void {
    const current = this.snapshot.project;
    const next = this.applyCommand(current, command, catalog);
    if (this.savedCursor > this.cursor) this.savedCursor = -1;
    this.states = [...this.states.slice(0, this.cursor + 1), next];
    this.cursor += 1;
    this.saveError = undefined;
    this.saveConflict = undefined;
  }

  undo(): void {
    if (this.cursor > 0) this.cursor -= 1;
  }

  redo(): void {
    if (this.cursor < this.states.length - 1) this.cursor += 1;
  }

  async save(port: ThemeBuilderSavePort): Promise<boolean> {
    if (this.saving || !this.snapshot.dirty) return false;
    this.saving = true;
    this.saveError = undefined;
    this.saveConflict = undefined;
    const current = this.snapshot.project;
    const result = await port.saveDraft(
      current.builderProjectId,
      this.authoritativeRevision,
      metadataOf(current),
      current.assetRefs,
      current.artifacts,
    );
    this.saving = false;
    if (!result.ok) {
      if (result.error.code === "theme_builder_project_revision_conflict") {
        this.saveConflict = result.error;
      } else {
        this.saveError = result.error;
      }
      return false;
    }
    this.states = this.states.map((state, index) =>
      cloneAndFreeze({
        ...result.data,
        ...(index === this.cursor
          ? {}
          : { ...metadataOf(state), assetRefs: state.assetRefs, artifacts: state.artifacts }),
        manifestDraft: {
          ...result.data.manifestDraft,
          ...(index === this.cursor
            ? {}
            : {
                displayName: state.name,
                description: state.description,
                ...(state.author ? { author: { name: state.author } } : {}),
              }),
        },
      }),
    );
    this.authoritativeRevision = result.data.revision;
    this.savedCursor = this.cursor;
    return true;
  }

  private applyCommand(
    current: Readonly<ThemeBuilderProject>,
    command: Readonly<ThemeBuilderCommand>,
    catalog?: BuilderAssetCatalogIndex,
  ): Readonly<ThemeBuilderProject> {
    if (command.type === "update-theme-metadata") {
      const metadata = normalizedMetadata(command.metadata);
      const manifestDraft = {
        ...current.manifestDraft,
        displayName: metadata.name,
        description: metadata.description,
        ...(metadata.author ? { author: { name: metadata.author } } : {}),
      };
      if (!metadata.author) delete (manifestDraft as { author?: unknown }).author;
      return cloneAndFreeze({ ...current, ...metadata, manifestDraft });
    }
    if (command.type === "add-asset-reference") {
      if (!catalog) {
        throw new BuilderAssetReferenceError("unknown", "The Asset Catalog is unavailable.");
      }
      const reference = catalog.referenceFor(command.assetId);
      if (current.assetRefs.some((item) => sameReference(item, reference))) {
        throw new BuilderAssetReferenceError("duplicate", "This Asset is already referenced.");
      }
      return cloneAndFreeze({ ...current, assetRefs: [...current.assetRefs, reference] });
    }
    if (["create-room-shell-draft", "update-room-shell-draft", "remove-room-shell-draft", "create-catalog-object-draft", "update-catalog-object-draft", "remove-catalog-object-draft"].includes(command.type)) {
      return applyBuilderArtifactDraftCommand(current, command as BuilderArtifactDraftCommand);
    }
    if (command.type !== "remove-asset-reference") {
      if (!this.templates) throw new Error("The Template Registry is unavailable.");
      return applySkinDraftCommand(current, command as SkinDraftCommand, this.templates, catalog);
    }
    const existing = current.assetRefs.find((item) => sameReference(item, command.reference));
    if (!existing) {
      throw new BuilderAssetReferenceError("missing-reference", "The Asset Reference is not in this draft.");
    }
    const usedBySkin = current.artifacts.skinPacks.some((pack) => pack.skins.some((skin) =>
      skin.assetBindings.some((binding) => binding.assetId === existing.id) ||
      skin.materials.some((material) =>
        material.parameters["core.material.texture-ref"] === existing.id,
      ),
    ));
    if (usedBySkin) {
      throw new BuilderAssetReferenceError(
        "missing-reference",
        "Clear this Asset from every Skin slot and material before removing its Builder reference.",
      );
    }
    return cloneAndFreeze({
      ...current,
      assetRefs: current.assetRefs.filter((item) => !sameReference(item, command.reference)),
    });
  }
}

function metadataOf(project: Readonly<ThemeBuilderProject>): ThemeBuilderProjectMetadata {
  return { name: project.name, description: project.description, author: project.author };
}

function normalizedMetadata(metadata: ThemeBuilderProjectMetadata): ThemeBuilderProjectMetadata {
  return {
    name: metadata.name.trim(),
    description: metadata.description.trim(),
    author: metadata.author.trim(),
  };
}

function sameReference(left: Readonly<ExactVersionedRef>, right: Readonly<ExactVersionedRef>): boolean {
  return left.id === right.id && left.version === right.version;
}
