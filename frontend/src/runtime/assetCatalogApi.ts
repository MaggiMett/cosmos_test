import type {
  AssetCatalogEntry,
  PreparedCatalogPromotion,
  VisualAsset,
} from "../theme-engine";
import { CosmosApiClient, cosmosApiClient } from "./apiClient";
import type { ApiResult } from "./contracts";

interface AssetCatalogResourcePayload {
  available: boolean;
  contentPath: string;
}

interface AssetCatalogRecordPayload {
  visualAsset: VisualAsset;
  catalogEntry: AssetCatalogEntry;
  resource: AssetCatalogResourcePayload;
}

interface AssetCatalogListPayload {
  items: AssetCatalogRecordPayload[];
}

export interface PersistedAssetCatalogRecord {
  visualAsset: Readonly<VisualAsset>;
  catalogEntry: Readonly<AssetCatalogEntry>;
  resourceAvailable: boolean;
  previewUrl?: string;
}

export class AssetCatalogApi {
  constructor(private readonly client: CosmosApiClient = cosmosApiClient) {}

  async list(): Promise<ApiResult<readonly Readonly<PersistedAssetCatalogRecord>[]>> {
    const result = await this.client.get<AssetCatalogListPayload>("/asset-catalog");
    return result.ok
      ? {
          ok: true,
          data: Object.freeze(result.data.items.map((item) => this.project(item))),
        }
      : result;
  }

  async promote(
    promotion: Readonly<PreparedCatalogPromotion>,
  ): Promise<ApiResult<Readonly<PersistedAssetCatalogRecord>>> {
    const result = await this.client.post<AssetCatalogRecordPayload>(
      "/asset-catalog",
      {
        visualAsset: promotion.visualAsset,
        catalogEntry: promotion.catalogEntry,
        originalBytesBase64: encodeBase64(promotion.originalBytes),
      },
    );
    return result.ok
      ? { ok: true, data: this.project(result.data) }
      : result;
  }

  private project(
    item: AssetCatalogRecordPayload,
  ): Readonly<PersistedAssetCatalogRecord> {
    return Object.freeze({
      visualAsset: Object.freeze(item.visualAsset),
      catalogEntry: Object.freeze(item.catalogEntry),
      resourceAvailable: item.resource.available,
      ...(item.resource.available
        ? {
            previewUrl:
              `${this.client.configuredBaseUrl}${item.resource.contentPath}`,
          }
        : {}),
    });
  }
}

export const assetCatalogApi = new AssetCatalogApi();

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let start = 0; start < bytes.length; start += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
  }
  return btoa(binary);
}
