import type {
  VisualAsset,
} from "./assetCatalogTypes";
import { createCanonicalAssetImportFixtures } from "./assetImportFixtures";
import { AssetImportService } from "./assetImportService";
import type { DraftVisualAsset } from "./assetImportTypes";
import type {
  CatalogDraftMetadata,
  CatalogPromotionTarget,
} from "./catalogCompletionTypes";
import { cloneAndFreeze } from "./immutable";

export interface CatalogCompletionFixture {
  draftVisualAsset: Readonly<DraftVisualAsset>;
  registeredVisualAsset: Readonly<VisualAsset>;
  target: Readonly<CatalogPromotionTarget>;
  completeMetadata: Readonly<CatalogDraftMetadata>;
  incompleteMetadata: Readonly<CatalogDraftMetadata>;
}

export async function createCatalogCompletionFixture():
Promise<Readonly<CatalogCompletionFixture>> {
  const imported = await new AssetImportService().importFiles(
    [createCanonicalAssetImportFixtures().png],
    { sessionId: "catalog-completion-fixture" },
  );
  const draftVisualAsset = imported.items[0]?.draftVisualAsset;
  if (draftVisualAsset === undefined) {
    throw new Error("Canonical Catalog Completion import fixture was rejected.");
  }

  const target: CatalogPromotionTarget = {
    assetCatalogEntryId: "personal.asset-catalog.imported-swatch",
    version: "1.0.0",
    visualAssetRef: {
      id: "personal.visual-asset.imported-swatch",
      version: "1.0.0",
    },
  };
  const registeredVisualAsset: VisualAsset = {
    schemaVersion: 1,
    id: target.visualAssetRef.id,
    version: target.visualAssetRef.version,
    kind: draftVisualAsset.kind,
    format: draftVisualAsset.format,
    mimeType: draftVisualAsset.mimeType,
    path: "personal/imported-swatch.png",
    sha256: draftVisualAsset.sha256,
    byteSize: draftVisualAsset.byteSize,
    width: draftVisualAsset.width,
    height: draftVisualAsset.height,
    alpha: draftVisualAsset.alpha,
  };
  const completeMetadata: CatalogDraftMetadata = {
    displayName: "Imported Swatch",
    description: "A technically validated imported visual swatch.",
    category: "personal.category.reference",
    scope: "personal",
    origin: "imported",
    systemTags: ["personal.tag.imported", "personal.tag.reference"],
    userTags: ["swatch"],
    perspective: "front",
    orientation: "upright",
    scaleClass: "reference-small",
    creator: {
      id: "personal.creator.fixture-artist",
      name: "Fixture Artist",
    },
    provenance: {
      kind: "imported",
      source: "Canonical Catalog Completion fixture",
    },
    license: {
      expression: "CC0-1.0",
    },
    compatibility: {
      compatibleTemplates: [],
      compatibleSurfaceTypes: [],
      compatibleVisualObjectTypes: [],
    },
  };
  const incompleteMetadata: CatalogDraftMetadata = {
    displayName: completeMetadata.displayName,
    scope: "personal",
    origin: "imported",
  };

  return Object.freeze({
    draftVisualAsset,
    registeredVisualAsset: cloneAndFreeze(registeredVisualAsset),
    target: cloneAndFreeze(target),
    completeMetadata: cloneAndFreeze(completeMetadata),
    incompleteMetadata: cloneAndFreeze(incompleteMetadata),
  });
}
