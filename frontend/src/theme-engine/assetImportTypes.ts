import type {
  ExactVersionedRef,
} from "./assetCatalogTypes";

export const AssetImportStatus = {
  Ready: "Ready",
  NeedsInformation: "NeedsInformation",
  Warning: "Warning",
  Rejected: "Rejected",
} as const;

export type AssetImportStatus =
  (typeof AssetImportStatus)[keyof typeof AssetImportStatus];

export type StaticAssetFormat = "png" | "webp" | "svg";
export type StaticAssetKind = "image" | "vector";
export type StaticAssetMimeType =
  | "image/png"
  | "image/webp"
  | "image/svg+xml";

export type AssetImportIssueSeverity =
  | "information"
  | "warning"
  | "error";

export type AssetImportIssueCode =
  | "catalog_metadata_required"
  | "decode_failed"
  | "dimensions_exceeded"
  | "empty_file"
  | "exact_duplicate"
  | "file_extension_mismatch"
  | "file_too_large"
  | "generic_mime_type"
  | "hash_unavailable"
  | "large_dimensions"
  | "mime_mismatch"
  | "signature_mismatch"
  | "unsupported_animation"
  | "unsupported_format"
  | "unsafe_svg";

export interface AssetImportIssue {
  code: AssetImportIssueCode;
  severity: AssetImportIssueSeverity;
  message: string;
}

export interface AssetImportFile {
  fileName: string;
  declaredMimeType?: string;
  bytes: Uint8Array;
}

export interface DetectedStaticAssetMetadata {
  kind: StaticAssetKind;
  format: StaticAssetFormat;
  mimeType: StaticAssetMimeType;
  byteSize: number;
  width: number;
  height: number;
  alpha?: boolean;
}

export interface FileValidationResult {
  fileName: string;
  status:
    | typeof AssetImportStatus.Ready
    | typeof AssetImportStatus.Warning
    | typeof AssetImportStatus.Rejected;
  sha256?: string;
  metadata?: Readonly<DetectedStaticAssetMetadata>;
  issues: readonly Readonly<AssetImportIssue>[];
}

export interface DraftVisualAsset {
  lifecycle: "draft";
  draftId: string;
  sourceFileName: string;
  kind: StaticAssetKind;
  format: StaticAssetFormat;
  mimeType: StaticAssetMimeType;
  sha256: string;
  byteSize: number;
  width: number;
  height: number;
  alpha?: boolean;
  read(): Uint8Array;
}

export interface ExistingVisualAssetDigest {
  visualAssetRef: ExactVersionedRef;
  sha256: string;
}

export type DuplicateMatch =
  | {
      source: "existing-visual-asset";
      visualAssetRef: ExactVersionedRef;
    }
  | {
      source: "import-session";
      draftId: string;
      sourceFileName: string;
    };

export interface DuplicateDetection {
  sha256: string;
  exact: true;
  matches: readonly Readonly<DuplicateMatch>[];
}

export interface BatchImportItemResult {
  fileName: string;
  status: AssetImportStatus;
  validation: Readonly<FileValidationResult>;
  issues: readonly Readonly<AssetImportIssue>[];
  draftVisualAsset?: Readonly<DraftVisualAsset>;
  duplicate?: Readonly<DuplicateDetection>;
}

export interface BatchImportCounts {
  total: number;
  ready: number;
  needsInformation: number;
  warning: number;
  rejected: number;
}

export interface BatchImportResult {
  sessionId: string;
  items: readonly Readonly<BatchImportItemResult>[];
  counts: Readonly<BatchImportCounts>;
}

export interface AssetImportServiceOptions {
  maximumByteSize?: number;
  maximumDimension?: number;
  recommendedDimension?: number;
}

export interface ImportSessionOptions {
  sessionId?: string;
  existingVisualAssets?: readonly ExistingVisualAssetDigest[];
}
