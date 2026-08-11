import type {
  AssetCatalogCreator,
  AssetCatalogEntry,
  AssetCatalogOrigin,
  AssetCatalogScope,
  AssetLicense,
  AssetProvenance,
  ExactVersionedRef,
} from "./assetCatalogTypes";
import type { DraftVisualAsset } from "./assetImportTypes";
import type { VersionedRef } from "./types";

export const CatalogCompletionStatus = {
  NeedsMetadata: "needs-metadata",
  ReadyForCatalog: "ready-for-catalog",
} as const;

export type CatalogCompletionStatus =
  (typeof CatalogCompletionStatus)[keyof typeof CatalogCompletionStatus];

export type CatalogCompletionFlow = "user-import" | "core-internal";

export interface CatalogCompatibilityMetadata {
  compatibleTemplates: readonly VersionedRef[];
  compatibleSurfaceTypes: readonly string[];
  compatibleVisualObjectTypes: readonly string[];
}

/**
 * Progressive discovery metadata. Required catalog fields are optional here so
 * an incomplete import can remain an immutable CatalogDraft.
 */
export interface CatalogDraftMetadata {
  displayName?: string;
  description?: string;
  category?: string;
  subCategory?: string;
  scope?: AssetCatalogScope;
  origin?: AssetCatalogOrigin;
  systemTags?: readonly string[];
  userTags?: readonly string[];
  perspective?: string;
  orientation?: string;
  scaleClass?: string;
  theme?: string;
  creator?: AssetCatalogCreator;
  provenance?: AssetProvenance;
  license?: AssetLicense;
  compatibility?: CatalogCompatibilityMetadata;
}

export interface CatalogPromotionTarget {
  assetCatalogEntryId: string;
  version: string;
  visualAssetRef: ExactVersionedRef;
}

export type CatalogRequiredMetadataField =
  | "displayName"
  | "description"
  | "category"
  | "perspective"
  | "orientation"
  | "scaleClass"
  | "scope"
  | "origin"
  | "creator"
  | "provenance"
  | "license"
  | "compatibility"
  | "systemTags";

export type CatalogCompletionIssueCode =
  | "missing-required-metadata"
  | "invalid-metadata"
  | "scope-not-allowed"
  | "origin-not-allowed";

export interface CatalogCompletionIssue {
  code: CatalogCompletionIssueCode;
  field: string;
  message: string;
}

export interface CatalogCompletionValidationResult {
  status: CatalogCompletionStatus;
  missingFields: readonly CatalogRequiredMetadataField[];
  issues: readonly Readonly<CatalogCompletionIssue>[];
}

export type AutomaticCatalogPreviewRole = "thumbnail" | "detail-preview";

/**
 * A deterministic recipe for a future catalog resource. It is deliberately not
 * a VisualAsset identity or record and contains no media path or version.
 */
export interface AutomaticCatalogPreviewDescriptor {
  descriptorVersion: 1;
  resourceKind: "derived-catalog-resource";
  role: AutomaticCatalogPreviewRole;
  descriptorId: string;
  sourceDraftId: string;
  sourceSha256: string;
  sourceFormat: DraftVisualAsset["format"];
  derivation: "contain-source";
  width: number;
  height: number;
}

export interface AutomaticCatalogPreviewDescriptors {
  thumbnail: AutomaticCatalogPreviewDescriptor;
  detailPreview: AutomaticCatalogPreviewDescriptor;
}

export interface CatalogDraft {
  lifecycle: "catalog-draft";
  catalogDraftId: string;
  flow: CatalogCompletionFlow;
  sourceVisualAsset: Readonly<DraftVisualAsset>;
  target: Readonly<CatalogPromotionTarget>;
  metadata: Readonly<CatalogDraftMetadata>;
  automaticPreviews: Readonly<AutomaticCatalogPreviewDescriptors>;
  status: CatalogCompletionStatus;
  validation: Readonly<CatalogCompletionValidationResult>;
}

export interface CreateCatalogDraftInput {
  flow: CatalogCompletionFlow;
  sourceVisualAsset: Readonly<DraftVisualAsset>;
  target: Readonly<CatalogPromotionTarget>;
  metadata?: Readonly<CatalogDraftMetadata>;
}

export interface CatalogPromotionResult {
  assetCatalogEntry: Readonly<AssetCatalogEntry>;
  automaticPreviews: Readonly<AutomaticCatalogPreviewDescriptors>;
}
