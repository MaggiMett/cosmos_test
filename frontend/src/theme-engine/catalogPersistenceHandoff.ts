import { AssetCatalogRegistry } from "./assetCatalogRegistry";
import type {
  AssetCatalogEntry,
  VisualAsset,
} from "./assetCatalogTypes";
import type { DraftVisualAsset } from "./assetImportTypes";
import type {
  CatalogDraft,
  CatalogPromotionTarget,
} from "./catalogCompletionTypes";
import { CatalogPromotionService } from "./catalogPromotionService";
import { cloneAndFreeze } from "./immutable";

export interface PreparedCatalogPromotion {
  visualAsset: Readonly<VisualAsset>;
  catalogEntry: Readonly<AssetCatalogEntry>;
  originalBytes: Uint8Array;
}

/**
 * Assigns deterministic first-version identities for the first static import
 * slice. This does not register, persist, publish, activate, place or add
 * behavior to the asset.
 */
export function createImportedCatalogTarget(
  draft: Readonly<DraftVisualAsset>,
): Readonly<CatalogPromotionTarget> {
  const identitySuffix = draft.sha256;
  return Object.freeze({
    assetCatalogEntryId: `personal.asset-catalog.${identitySuffix}`,
    version: "1.0.0",
    visualAssetRef: Object.freeze({
      id: `personal.visual-asset.${identitySuffix}`,
      version: "1.0.0",
    }),
  });
}

/**
 * Closes the existing Catalog Completion handoff without hiding promotion:
 * the caller invokes this only for the explicit Add to Catalog action, then
 * sends the validated immutable records and original bytes to ResourceService.
 */
export function prepareCatalogPersistence(
  draft: Readonly<CatalogDraft>,
): Readonly<PreparedCatalogPromotion> {
  const source = draft.sourceVisualAsset;
  const visualAsset: VisualAsset = {
    schemaVersion: 1,
    id: draft.target.visualAssetRef.id,
    version: draft.target.visualAssetRef.version,
    kind: source.kind,
    format: source.format,
    mimeType: source.mimeType,
    path:
      `visual-assets/${draft.target.visualAssetRef.id}/`
      + `${draft.target.visualAssetRef.version}/original.${source.format}`,
    sha256: source.sha256,
    byteSize: source.byteSize,
    width: source.width,
    height: source.height,
    ...(source.alpha === undefined ? {} : { alpha: source.alpha }),
  };
  const registry = new AssetCatalogRegistry();
  const storedVisualAsset = registry.registerVisualAsset(visualAsset);
  const promotion = new CatalogPromotionService().promote(draft, registry);
  return Object.freeze({
    visualAsset: storedVisualAsset,
    catalogEntry: promotion.assetCatalogEntry,
    originalBytes: source.read(),
  });
}

export function clonePreparedCatalogPromotion(
  promotion: Readonly<PreparedCatalogPromotion>,
): Readonly<PreparedCatalogPromotion> {
  const bytes = promotion.originalBytes.slice();
  return Object.freeze({
    visualAsset: cloneAndFreeze(promotion.visualAsset),
    catalogEntry: cloneAndFreeze(promotion.catalogEntry),
    originalBytes: bytes,
  });
}
