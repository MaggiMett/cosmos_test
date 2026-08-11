import { describe, expect, it } from "vitest";

import type { RendererSafeAssetReference } from "./activeThemePresentationSnapshot";
import { resolveRendererAssetResourceUrl } from "./assetResourceUrl";

describe("renderer Asset Resource URL boundary", () => {
  it.each([
    ["png", "image", "image/png"],
    ["webp", "image", "image/webp"],
    ["svg", "vector", "image/svg+xml"],
  ] as const)("addresses a validated %s through the existing content endpoint", (
    format,
    kind,
    mimeType,
  ) => {
    expect(resolveRendererAssetResourceUrl(reference({ format, kind, mimeType }), "/api")).toBe(
      "/api/asset-catalog/visual-assets/max.asset.room-shell/versions/1.2.3/content",
    );
  });

  it("supports an explicit secure API origin", () => {
    expect(
      resolveRendererAssetResourceUrl(reference(), "https://cosmos.test/api/"),
    ).toBe(
      "https://cosmos.test/api/asset-catalog/visual-assets/max.asset.room-shell/versions/1.2.3/content",
    );
  });

  it.each([
    "C:\\Cosmos\\Resources",
    "file:///Cosmos/Resources",
    "\\\\server\\share",
    "//untrusted.test/api",
    "/api/../files",
    "javascript:alert(1)",
  ])("never turns a filesystem or unsafe base into a browser URL: %s", (baseUrl) => {
    expect(resolveRendererAssetResourceUrl(reference(), baseUrl)).toBeNull();
  });

  it("rejects unsupported media and incomplete references", () => {
    expect(
      resolveRendererAssetResourceUrl(
        reference({ format: "mp4", kind: "video", mimeType: "video/mp4" }),
        "/api",
      ),
    ).toBeNull();
    expect(
      resolveRendererAssetResourceUrl(reference({ version: null }), "/api"),
    ).toBeNull();
    expect(
      resolveRendererAssetResourceUrl(
        reference({ assetId: "../../room.png" }),
        "/api",
      ),
    ).toBeNull();
  });
});

function reference(
  overrides: Partial<RendererSafeAssetReference> = {},
): RendererSafeAssetReference {
  return {
    assetId: "max.asset.room-shell",
    version: "1.2.3",
    kind: "image",
    format: "png",
    mimeType: "image/png",
    sha256: "a".repeat(64),
    byteSize: 1024,
    width: 1600,
    height: 900,
    catalogEntryId: "max.catalog.room-shell",
    catalogEntryVersion: "1.2.3",
    ...overrides,
  };
}
