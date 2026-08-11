import {
  AssetImportStatus,
  type AssetImportFile,
  type AssetImportIssue,
  type AssetImportServiceOptions,
  type BatchImportCounts,
  type BatchImportItemResult,
  type BatchImportResult,
  type DraftVisualAsset,
  type DuplicateMatch,
  type ExistingVisualAssetDigest,
  type FileValidationResult,
  type ImportSessionOptions,
} from "./assetImportTypes";
import {
  DEFAULT_MAXIMUM_ASSET_BYTE_SIZE,
  DEFAULT_MAXIMUM_ASSET_DIMENSION,
  DEFAULT_RECOMMENDED_ASSET_DIMENSION,
  validateAssetImportFile,
  type AssetImportValidationLimits,
} from "./assetImportValidation";

export class AssetImportServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssetImportServiceError";
  }
}

/**
 * Stateless entry point for technical asset imports. Each batch either uses a
 * fresh session or an explicitly created ImportSession. No result is persisted
 * or registered in the Asset Catalog.
 */
export class AssetImportService {
  readonly limits: Readonly<AssetImportValidationLimits>;
  private nextSessionNumber = 1;

  constructor(options: Readonly<AssetImportServiceOptions> = {}) {
    this.limits = Object.freeze(validateLimits({
      maximumByteSize:
        options.maximumByteSize ?? DEFAULT_MAXIMUM_ASSET_BYTE_SIZE,
      maximumDimension:
        options.maximumDimension ?? DEFAULT_MAXIMUM_ASSET_DIMENSION,
      recommendedDimension:
        options.recommendedDimension ?? DEFAULT_RECOMMENDED_ASSET_DIMENSION,
    }));
  }

  createSession(
    options: Readonly<ImportSessionOptions> = {},
  ): ImportSession {
    let sessionId = options.sessionId;
    if (sessionId === undefined) {
      sessionId =
        `asset-import-${String(this.nextSessionNumber).padStart(4, "0")}`;
      this.nextSessionNumber += 1;
    }
    return new ImportSession(
      sessionId,
      this.limits,
      options.existingVisualAssets ?? [],
    );
  }

  validateFile(
    file: Readonly<AssetImportFile>,
  ): Promise<Readonly<FileValidationResult>> {
    return validateAssetImportFile(copyImportFile(file), this.limits);
  }

  importFiles(
    files: readonly Readonly<AssetImportFile>[],
    options: Readonly<ImportSessionOptions> = {},
  ): Promise<Readonly<BatchImportResult>> {
    return this.createSession(options).importFiles(files);
  }
}

/**
 * Session-local duplicate memory and deterministic draft identity. Imports are
 * serialized per session so overlapping callers produce the same result order.
 */
export class ImportSession {
  readonly sessionId: string;
  private readonly limits: Readonly<AssetImportValidationLimits>;
  private readonly duplicatesByHash = new Map<string, DuplicateMatch[]>();
  private nextDraftNumber = 1;
  private importQueue: Promise<void> = Promise.resolve();

  constructor(
    sessionId: string,
    limits: Readonly<AssetImportValidationLimits>,
    existingVisualAssets: readonly Readonly<ExistingVisualAssetDigest>[] = [],
  ) {
    if (sessionId.trim() === "") {
      throw new AssetImportServiceError("Import session id must not be empty.");
    }
    this.sessionId = sessionId;
    this.limits = Object.freeze(validateLimits({ ...limits }));

    for (const existing of existingVisualAssets) {
      const hash = normalizeSha256(existing.sha256);
      const matches = this.duplicatesByHash.get(hash) ?? [];
      matches.push(Object.freeze({
        source: "existing-visual-asset",
        visualAssetRef: Object.freeze({ ...existing.visualAssetRef }),
      }));
      this.duplicatesByHash.set(hash, matches);
    }
  }

  importFiles(
    files: readonly Readonly<AssetImportFile>[],
  ): Promise<Readonly<BatchImportResult>> {
    const ownedFiles = files.map(copyImportFile);
    const operation = this.importQueue.then(() => this.executeImport(ownedFiles));
    this.importQueue = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }

  private async executeImport(
    files: readonly Readonly<AssetImportFile>[],
  ): Promise<Readonly<BatchImportResult>> {
    const validations = await Promise.all(
      files.map((file) => validateAssetImportFile(file, this.limits)),
    );
    const items: BatchImportItemResult[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const validation = validations[index];
      if (
        validation.status === AssetImportStatus.Rejected
        || validation.metadata === undefined
        || validation.sha256 === undefined
      ) {
        items.push(Object.freeze({
          fileName: file.fileName,
          status: AssetImportStatus.Rejected,
          validation,
          issues: validation.issues,
        }));
        continue;
      }

      const duplicateMatches = this.duplicatesByHash.get(validation.sha256)
        ?.map(copyDuplicateMatch) ?? [];
      const draft = createDraftVisualAsset(
        this.sessionId,
        this.nextDraftNumber,
        file,
        validation.metadata,
        validation.sha256,
      );
      this.nextDraftNumber += 1;

      const ownMatch: DuplicateMatch = Object.freeze({
        source: "import-session",
        draftId: draft.draftId,
        sourceFileName: draft.sourceFileName,
      });
      this.duplicatesByHash.set(
        validation.sha256,
        [...duplicateMatches, ownMatch],
      );

      const issues: AssetImportIssue[] = validation.issues.map((issue) => ({
        ...issue,
      }));
      if (duplicateMatches.length > 0) {
        issues.push({
          code: "exact_duplicate",
          severity: "warning",
          message:
            "The file is an exact SHA-256 duplicate of an already known asset.",
        });
      }
      issues.push({
        code: "catalog_metadata_required",
        severity: "information",
        message:
          "Catalog metadata is required before this draft can become a catalog entry.",
      });

      const hasWarning = issues.some((issue) => issue.severity === "warning");
      items.push(Object.freeze({
        fileName: file.fileName,
        status: hasWarning
          ? AssetImportStatus.Warning
          : AssetImportStatus.NeedsInformation,
        validation,
        issues: Object.freeze(issues.map((issue) => Object.freeze(issue))),
        draftVisualAsset: draft,
        ...(duplicateMatches.length === 0
          ? {}
          : {
              duplicate: Object.freeze({
                sha256: validation.sha256,
                exact: true,
                matches: Object.freeze(duplicateMatches),
              }),
            }),
      }));
    }

    const counts = countStatuses(items);
    return Object.freeze({
      sessionId: this.sessionId,
      items: Object.freeze(items),
      counts: Object.freeze(counts),
    });
  }
}

function createDraftVisualAsset(
  sessionId: string,
  draftNumber: number,
  file: Readonly<AssetImportFile>,
  metadata: NonNullable<FileValidationResult["metadata"]>,
  sha256: string,
): Readonly<DraftVisualAsset> {
  const ownedBytes = file.bytes.slice();
  return Object.freeze({
    lifecycle: "draft",
    draftId: `${sessionId}:draft:${String(draftNumber).padStart(4, "0")}`,
    sourceFileName: file.fileName,
    kind: metadata.kind,
    format: metadata.format,
    mimeType: metadata.mimeType,
    sha256,
    byteSize: metadata.byteSize,
    width: metadata.width,
    height: metadata.height,
    ...(metadata.alpha === undefined ? {} : { alpha: metadata.alpha }),
    read: () => ownedBytes.slice(),
  });
}

function countStatuses(
  items: readonly Readonly<BatchImportItemResult>[],
): BatchImportCounts {
  const counts: BatchImportCounts = {
    total: items.length,
    ready: 0,
    needsInformation: 0,
    warning: 0,
    rejected: 0,
  };
  for (const item of items) {
    switch (item.status) {
      case AssetImportStatus.Ready:
        counts.ready += 1;
        break;
      case AssetImportStatus.NeedsInformation:
        counts.needsInformation += 1;
        break;
      case AssetImportStatus.Warning:
        counts.warning += 1;
        break;
      case AssetImportStatus.Rejected:
        counts.rejected += 1;
        break;
    }
  }
  return counts;
}

function copyImportFile(
  file: Readonly<AssetImportFile>,
): Readonly<AssetImportFile> {
  return Object.freeze({
    fileName: file.fileName,
    ...(file.declaredMimeType === undefined
      ? {}
      : { declaredMimeType: file.declaredMimeType }),
    bytes: file.bytes.slice(),
  });
}

function copyDuplicateMatch(
  match: Readonly<DuplicateMatch>,
): DuplicateMatch {
  return match.source === "existing-visual-asset"
    ? Object.freeze({
        source: match.source,
        visualAssetRef: Object.freeze({ ...match.visualAssetRef }),
      })
    : Object.freeze({ ...match });
}

function normalizeSha256(value: string): string {
  const normalized = value.toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(normalized)) {
    throw new AssetImportServiceError(
      `Invalid existing VisualAsset SHA-256 digest: "${value}".`,
    );
  }
  return normalized;
}

function validateLimits(
  limits: AssetImportValidationLimits,
): AssetImportValidationLimits {
  for (const [name, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new AssetImportServiceError(
        `${name} must be a positive safe integer.`,
      );
    }
  }
  if (limits.recommendedDimension > limits.maximumDimension) {
    throw new AssetImportServiceError(
      "recommendedDimension must not exceed maximumDimension.",
    );
  }
  return limits;
}
