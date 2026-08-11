import {
  compareVersions,
  type ExactVersionedRef,
  type ThemeBuilderProject,
} from "../../theme-engine";
import type { PersistedAssetCatalogRecord } from "../../runtime/assetCatalogApi";

export type BuilderAssetPresentationStatus = "available" | "unavailable" | "missing";

export interface BuilderAssetPresentation {
  reference: Readonly<ExactVersionedRef>;
  status: BuilderAssetPresentationStatus;
  name: string;
  category: string;
  previewUrl?: string;
}

export class BuilderAssetReferenceError extends Error {
  constructor(readonly code: "unknown" | "unavailable" | "duplicate" | "missing-reference", message: string) {
    super(message);
    this.name = "BuilderAssetReferenceError";
  }
}

export class BuilderAssetCatalogIndex {
  readonly records: readonly Readonly<PersistedAssetCatalogRecord>[];

  constructor(records: readonly Readonly<PersistedAssetCatalogRecord>[]) {
    const newestFirst = [...records].sort((left, right) => {
      if (left.visualAsset.id !== right.visualAsset.id) {
        return left.visualAsset.id.localeCompare(right.visualAsset.id);
      }
      return compareVersions(right.visualAsset.version, left.visualAsset.version);
    });
    this.records = Object.freeze(newestFirst.filter((record, index) =>
      newestFirst.findIndex((candidate) => candidate.visualAsset.id === record.visualAsset.id) === index,
    ));
  }

  referenceFor(assetId: string): Readonly<ExactVersionedRef> {
    const selected = this.records.find((record) => record.visualAsset.id === assetId);
    if (!selected) {
      throw new BuilderAssetReferenceError("unknown", `Asset ${assetId} is not cataloged.`);
    }
    if (selected.catalogEntry.deprecated || !selected.resourceAvailable) {
      throw new BuilderAssetReferenceError("unavailable", `Asset ${assetId} is not currently usable.`);
    }
    return Object.freeze({ id: selected.visualAsset.id, version: selected.visualAsset.version });
  }

  recordFor(reference: Readonly<ExactVersionedRef>): Readonly<PersistedAssetCatalogRecord> | undefined {
    return this.records.find((record) =>
      record.visualAsset.id === reference.id && record.visualAsset.version === reference.version,
    );
  }
}

export function projectBuilderAssets(
  project: Readonly<ThemeBuilderProject>,
  catalog: readonly Readonly<PersistedAssetCatalogRecord>[],
  catalogLoaded = true,
): readonly Readonly<BuilderAssetPresentation>[] {
  return Object.freeze(project.assetRefs.map((reference) => {
    if (!catalogLoaded) {
      return Object.freeze({
        reference,
        status: "unavailable" as const,
        name: reference.id,
        category: "Catalog unavailable",
      });
    }
    const record = catalog.find((candidate) =>
      candidate.visualAsset.id === reference.id && candidate.visualAsset.version === reference.version,
    );
    if (!record) {
      return Object.freeze({
        reference,
        status: "missing" as const,
        name: reference.id,
        category: "Missing catalog entry",
      });
    }
    const available = record.resourceAvailable && !record.catalogEntry.deprecated;
    return Object.freeze({
      reference,
      status: available ? "available" as const : "unavailable" as const,
      name: record.catalogEntry.displayName,
      category: record.catalogEntry.category,
      ...(record.previewUrl ? { previewUrl: record.previewUrl } : {}),
    });
  }));
}
