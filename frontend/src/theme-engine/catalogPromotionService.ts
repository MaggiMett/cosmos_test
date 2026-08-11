import type {
  AssetCatalogEntry,
  VisualAsset,
} from "./assetCatalogTypes";
import { AssetCatalogRegistry } from "./assetCatalogRegistry";
import type { DraftVisualAsset } from "./assetImportTypes";
import type {
  AutomaticCatalogPreviewDescriptor,
  AutomaticCatalogPreviewDescriptors,
  AutomaticCatalogPreviewRole,
  CatalogCompletionFlow,
  CatalogCompletionIssue,
  CatalogCompletionValidationResult,
  CatalogDraft,
  CatalogDraftMetadata,
  CatalogPromotionResult,
  CatalogPromotionTarget,
  CatalogRequiredMetadataField,
  CreateCatalogDraftInput,
} from "./catalogCompletionTypes";
import { CatalogCompletionStatus } from "./catalogCompletionTypes";
import { cloneAndFreeze } from "./immutable";
import {
  ThemeValidationError,
  validateAssetCatalogEntry,
} from "./validation";

const REQUIRED_METADATA_FIELDS: readonly CatalogRequiredMetadataField[] = [
  "displayName",
  "description",
  "category",
  "perspective",
  "orientation",
  "scaleClass",
  "scope",
  "origin",
  "creator",
  "provenance",
  "license",
  "compatibility",
  "systemTags",
];

const THUMBNAIL_MAXIMUM_SIZE = 256;
const DETAIL_PREVIEW_MAXIMUM_SIZE = 1024;

export class CatalogPromotionServiceError extends Error {
  constructor(
    readonly code:
      | "catalog_draft_incomplete"
      | "draft_visual_asset_invalid"
      | "visual_asset_not_registered"
      | "visual_asset_mismatch",
    message: string,
    readonly validation?: Readonly<CatalogCompletionValidationResult>,
  ) {
    super(message);
    this.name = "CatalogPromotionServiceError";
  }
}

/**
 * Pure draft construction and validation plus one explicit registry mutation:
 * promote(). No draft is promoted as a side effect of creation or completion.
 */
export class CatalogPromotionService {
  createDraft(
    input: Readonly<CreateCatalogDraftInput>,
  ): Readonly<CatalogDraft> {
    const sourceVisualAsset = copyDraftVisualAsset(input.sourceVisualAsset);
    const target = cloneAndFreeze(input.target);
    const metadata = cloneAndFreeze(input.metadata ?? {});
    return createCatalogDraft(
      input.flow,
      sourceVisualAsset,
      target,
      metadata,
    );
  }

  setMetadata(
    draft: Readonly<CatalogDraft>,
    metadata: Readonly<CatalogDraftMetadata>,
  ): Readonly<CatalogDraft> {
    return this.createDraft({
      flow: draft.flow,
      sourceVisualAsset: draft.sourceVisualAsset,
      target: draft.target,
      metadata,
    });
  }

  validate(
    draft: Readonly<CatalogDraft>,
  ): Readonly<CatalogCompletionValidationResult> {
    return validateCatalogDraft(draft.flow, draft.target, draft.metadata);
  }

  /**
   * The only Catalog Completion operation allowed to change the registry.
   * It registers one entry and never registers or creates a VisualAsset.
   */
  promote(
    draft: Readonly<CatalogDraft>,
    registry: AssetCatalogRegistry,
  ): Readonly<CatalogPromotionResult> {
    const validation = this.validate(draft);
    if (validation.status !== CatalogCompletionStatus.ReadyForCatalog) {
      throw new CatalogPromotionServiceError(
        "catalog_draft_incomplete",
        `Catalog draft "${draft.catalogDraftId}" is not ready for promotion.`,
        validation,
      );
    }

    const sourceVisualAsset = copyDraftVisualAsset(draft.sourceVisualAsset);
    const registeredVisualAsset = registry.getVisualAsset(
      draft.target.visualAssetRef,
    );
    if (registeredVisualAsset === undefined) {
      throw new CatalogPromotionServiceError(
        "visual_asset_not_registered",
        `VisualAsset "${formatReference(draft.target.visualAssetRef)}" is not registered.`,
      );
    }
    assertVisualAssetMatchesDraft(
      registeredVisualAsset,
      sourceVisualAsset,
    );

    const candidate = buildEntryCandidate(draft.target, draft.metadata);
    const assetCatalogEntry = registry.register(candidate);
    return Object.freeze({
      assetCatalogEntry,
      automaticPreviews: deriveAutomaticPreviews(sourceVisualAsset),
    });
  }
}

function createCatalogDraft(
  flow: CatalogCompletionFlow,
  sourceVisualAsset: Readonly<DraftVisualAsset>,
  target: Readonly<CatalogPromotionTarget>,
  metadata: Readonly<CatalogDraftMetadata>,
): Readonly<CatalogDraft> {
  const validation = validateCatalogDraft(flow, target, metadata);
  const automaticPreviews = deriveAutomaticPreviews(sourceVisualAsset);
  return Object.freeze({
    lifecycle: "catalog-draft",
    catalogDraftId:
      `${sourceVisualAsset.draftId}:catalog:`
      + `${target.assetCatalogEntryId}@${target.version}`,
    flow,
    sourceVisualAsset,
    target,
    metadata,
    automaticPreviews,
    status: validation.status,
    validation,
  });
}

function validateCatalogDraft(
  flow: CatalogCompletionFlow,
  target: Readonly<CatalogPromotionTarget>,
  metadata: Readonly<CatalogDraftMetadata>,
): Readonly<CatalogCompletionValidationResult> {
  const missingFields = REQUIRED_METADATA_FIELDS.filter(
    (field) => metadata[field] === undefined,
  );
  const issues: CatalogCompletionIssue[] = missingFields.map((field) => ({
    code: "missing-required-metadata",
    field,
    message: `Required catalog metadata "${field}" is missing.`,
  }));

  if (metadata.scope !== undefined) {
    const scopeAllowed = flow === "user-import"
      ? metadata.scope === "personal" || metadata.scope === "theme"
      : metadata.scope === "core";
    if (!scopeAllowed) {
      issues.push({
        code: "scope-not-allowed",
        field: "scope",
        message: flow === "user-import"
          ? 'User import allows only "personal" or "theme" scope.'
          : 'The internal Core flow requires "core" scope.',
      });
    }
  }

  if (metadata.origin !== undefined) {
    const originAllowed = flow === "user-import"
      ? metadata.origin === "imported"
      : metadata.origin === "built-in";
    if (!originAllowed) {
      issues.push({
        code: "origin-not-allowed",
        field: "origin",
        message: flow === "user-import"
          ? 'User file import requires "imported" origin.'
          : 'The internal Core flow requires "built-in" origin.',
      });
    }
  }

  try {
    validateAssetCatalogEntry(buildEntryCandidate(target, metadata));
  } catch (cause) {
    if (!(cause instanceof ThemeValidationError)) {
      throw cause;
    }
    for (const schemaIssue of cause.issues) {
      issues.push({
        code: "invalid-metadata",
        field: fieldFromPath(schemaIssue.path),
        message: schemaIssue.message,
      });
    }
  }

  const frozenIssues = Object.freeze(
    deduplicateIssues(issues).map((issue) => Object.freeze(issue)),
  );
  const status = frozenIssues.length === 0
    ? CatalogCompletionStatus.ReadyForCatalog
    : CatalogCompletionStatus.NeedsMetadata;
  return Object.freeze({
    status,
    missingFields: Object.freeze([...missingFields]),
    issues: frozenIssues,
  });
}

function buildEntryCandidate(
  target: Readonly<CatalogPromotionTarget>,
  metadata: Readonly<CatalogDraftMetadata>,
): AssetCatalogEntry {
  const compatibility = metadata.compatibility;
  return {
    schemaVersion: 1,
    id: target.assetCatalogEntryId,
    version: target.version,
    visualAssetRef: { ...target.visualAssetRef },
    displayName: metadata.displayName ?? "Missing display name",
    description: metadata.description ?? "Missing description",
    category: metadata.category ?? "cosmos.category.missing",
    ...(metadata.subCategory === undefined
      ? {}
      : { subCategory: metadata.subCategory }),
    scope: metadata.scope ?? "personal",
    origin: metadata.origin ?? "imported",
    systemTags: metadata.systemTags ?? [],
    userTags: metadata.userTags ?? [],
    perspective: metadata.perspective ?? "unspecified",
    orientation: metadata.orientation ?? "unspecified",
    scaleClass: metadata.scaleClass ?? "unspecified",
    ...(metadata.theme === undefined ? {} : { theme: metadata.theme }),
    creator: metadata.creator ?? { name: "Missing creator" },
    provenance: metadata.provenance ?? { kind: "unknown" },
    license: metadata.license ?? { expression: "UNSPECIFIED" },
    compatibleTemplates: compatibility?.compatibleTemplates ?? [],
    compatibleSurfaceTypes:
      compatibility?.compatibleSurfaceTypes ?? [],
    compatibleVisualObjectTypes:
      compatibility?.compatibleVisualObjectTypes ?? [],
    deprecated: false,
  };
}

function deriveAutomaticPreviews(
  source: Readonly<DraftVisualAsset>,
): Readonly<AutomaticCatalogPreviewDescriptors> {
  return Object.freeze({
    thumbnail: deriveAutomaticPreview(
      source,
      "thumbnail",
      THUMBNAIL_MAXIMUM_SIZE,
    ),
    detailPreview: deriveAutomaticPreview(
      source,
      "detail-preview",
      DETAIL_PREVIEW_MAXIMUM_SIZE,
    ),
  });
}

function deriveAutomaticPreview(
  source: Readonly<DraftVisualAsset>,
  role: AutomaticCatalogPreviewRole,
  maximumSize: number,
): Readonly<AutomaticCatalogPreviewDescriptor> {
  const dimensions = fitDimensions(
    source.width,
    source.height,
    maximumSize,
  );
  return Object.freeze({
    descriptorVersion: 1,
    resourceKind: "derived-catalog-resource",
    role,
    descriptorId:
      `catalog-derivative:${source.sha256}:${role}:contain-source:v1`,
    sourceDraftId: source.draftId,
    sourceSha256: source.sha256,
    sourceFormat: source.format,
    derivation: "contain-source",
    width: dimensions.width,
    height: dimensions.height,
  });
}

function fitDimensions(
  width: number,
  height: number,
  maximumSize: number,
): { width: number; height: number } {
  const scale = Math.min(1, maximumSize / width, maximumSize / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function copyDraftVisualAsset(
  source: Readonly<DraftVisualAsset>,
): Readonly<DraftVisualAsset> {
  if (
    source.lifecycle !== "draft"
    || source.draftId.trim() === ""
    || !/^[0-9a-f]{64}$/.test(source.sha256)
    || !Number.isFinite(source.width)
    || !Number.isFinite(source.height)
    || source.width <= 0
    || source.height <= 0
    || !Number.isSafeInteger(source.byteSize)
    || source.byteSize <= 0
  ) {
    throw new CatalogPromotionServiceError(
      "draft_visual_asset_invalid",
      "Catalog completion requires a technically valid DraftVisualAsset.",
    );
  }

  const ownedBytes = source.read();
  if (ownedBytes.byteLength !== source.byteSize) {
    throw new CatalogPromotionServiceError(
      "draft_visual_asset_invalid",
      "DraftVisualAsset bytes do not match the declared byte size.",
    );
  }
  return Object.freeze({
    lifecycle: "draft",
    draftId: source.draftId,
    sourceFileName: source.sourceFileName,
    kind: source.kind,
    format: source.format,
    mimeType: source.mimeType,
    sha256: source.sha256,
    byteSize: source.byteSize,
    width: source.width,
    height: source.height,
    ...(source.alpha === undefined ? {} : { alpha: source.alpha }),
    read: () => ownedBytes.slice(),
  });
}

function assertVisualAssetMatchesDraft(
  visualAsset: Readonly<VisualAsset>,
  draft: Readonly<DraftVisualAsset>,
): void {
  const mismatch = visualAsset.sha256 !== draft.sha256
    || visualAsset.kind !== draft.kind
    || visualAsset.format !== draft.format
    || visualAsset.mimeType !== draft.mimeType
    || visualAsset.byteSize !== draft.byteSize
    || visualAsset.width !== draft.width
    || visualAsset.height !== draft.height
    || (
      draft.alpha !== undefined
      && visualAsset.alpha !== draft.alpha
    );
  if (mismatch) {
    throw new CatalogPromotionServiceError(
      "visual_asset_mismatch",
      `Registered VisualAsset "${formatReference({
        id: visualAsset.id,
        version: visualAsset.version,
      })}" does not match the technical draft.`,
    );
  }
}

function fieldFromPath(path: string): string {
  const normalized = path.replace(/^\/+/, "");
  return normalized === "" ? "catalogEntry" : normalized.split("/")[0];
}

function deduplicateIssues(
  issues: readonly CatalogCompletionIssue[],
): CatalogCompletionIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.code}:${issue.field}:${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatReference(reference: {
  id: string;
  version: string;
}): string {
  return `${reference.id}@${reference.version}`;
}
