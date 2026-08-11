import { afterEach, describe, expect, it, vi } from "vitest";

import {
  canonicalAssetCatalogEntries,
  canonicalVisualAssets,
  type PreparedCatalogPromotion,
} from "../theme-engine";
import { CosmosApiClient } from "./apiClient";
import { AssetCatalogApi } from "./assetCatalogApi";

describe("AssetCatalogApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads persistent records and resolves real preview URLs", async () => {
    const record = backendRecord(true);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ items: [record] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const result = await new AssetCatalogApi(
      new CosmosApiClient("http://127.0.0.1:8000"),
    ).list();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0]?.previewUrl).toBe(
        "http://127.0.0.1:8000/asset-catalog/visual-assets/example/content",
      );
    }
  });

  it("sends the exact original bytes with immutable promotion metadata", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(backendRecord(true)), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const promotion: PreparedCatalogPromotion = {
      visualAsset: canonicalVisualAssets[0]!,
      catalogEntry: canonicalAssetCatalogEntries[0]!,
      originalBytes: new Uint8Array([0, 1, 2, 255]),
    };

    const result = await new AssetCatalogApi(
      new CosmosApiClient("http://127.0.0.1:8000"),
    ).promote(promotion);

    expect(result.ok).toBe(true);
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toMatchObject({
      originalBytesBase64: "AAEC/w==",
      visualAsset: { id: promotion.visualAsset.id },
      catalogEntry: { id: promotion.catalogEntry.id },
    });
  });

  it("keeps a missing Resource visible without an unusable preview URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ items: [backendRecord(false)] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const result = await new AssetCatalogApi(new CosmosApiClient("/api")).list();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0]?.resourceAvailable).toBe(false);
      expect(result.data[0]?.previewUrl).toBeUndefined();
    }
  });
});

function backendRecord(available: boolean) {
  return {
    visualAsset: canonicalVisualAssets[0],
    catalogEntry: canonicalAssetCatalogEntries[0],
    resource: {
      available,
      contentPath: "/asset-catalog/visual-assets/example/content",
    },
  };
}
