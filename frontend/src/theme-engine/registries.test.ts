import { describe, expect, it } from "vitest";

import {
  AssetRegistry,
  AssetRegistryError,
} from "./assetRegistry";
import { baseMainRoomTemplate } from "./baseTemplate";
import {
  CORE_DEFAULT_BASE_ASSET_ID,
  coreDefaultBaseAssetRegistration,
} from "./coreDefaultBaseSkin";
import {
  TemplateRegistry,
  TemplateRegistryError,
} from "./templateRegistry";
import type { AssetReference } from "./types";

describe("TemplateRegistry", () => {
  it("registers and resolves a validated Template version", () => {
    const registry = new TemplateRegistry();
    registry.register(baseMainRoomTemplate);

    expect(
      registry.resolveRef({ id: "base.main-room.v1", versionRange: "^1.0.0" }).version,
    ).toBe("1.0.0");
  });

  it("rejects duplicate identities and reports missing Templates", () => {
    const registry = new TemplateRegistry();
    registry.register(baseMainRoomTemplate);

    expect(() => registry.register(baseMainRoomTemplate)).toThrowError(
      TemplateRegistryError,
    );
    expect(() => registry.resolve("missing.template", "1.0.0")).toThrow(
      /not registered/,
    );
    expect(() =>
      registry.resolveRef({ id: "base.main-room.v1", versionRange: "^2.0.0" }),
    ).toThrow(/No version/);
  });
});

describe("AssetRegistry", () => {
  it("validates and registers the internal SVG fallback", async () => {
    const registry = new AssetRegistry();
    await registry.register(coreDefaultBaseAssetRegistration);
    registry.setFallbackAsset(CORE_DEFAULT_BASE_ASSET_ID);

    const resolved = registry.resolve("missing.asset");
    expect(resolved.usedFallback).toBe(true);
    expect(resolved.asset.metadata.assetId).toBe(CORE_DEFAULT_BASE_ASSET_ID);
    expect(resolved.asset.read()).toHaveLength(coreDefaultBaseAssetRegistration.metadata.byteSize);
  });

  it("rejects invalid MIME declarations", async () => {
    const registry = new AssetRegistry();
    const invalid: AssetReference = {
      ...coreDefaultBaseAssetRegistration.metadata,
      assetId: "test.asset.invalid-mime",
      mimeType: "image/png",
    };

    await expect(
      registry.register({
        metadata: invalid,
        content: coreDefaultBaseAssetRegistration.content,
      }),
    ).rejects.toMatchObject({ code: "asset_mime_mismatch" });
  });

  it("rejects path traversal before resource registration", async () => {
    const registry = new AssetRegistry();
    const invalid: AssetReference = {
      ...coreDefaultBaseAssetRegistration.metadata,
      assetId: "test.asset.traversal",
      path: "../outside.svg",
    };

    await expect(
      registry.register({
        metadata: invalid,
        content: coreDefaultBaseAssetRegistration.content,
      }),
    ).rejects.toMatchObject({ code: "asset_path_invalid" });
    expect(registry.list()).toHaveLength(0);
  });

  it("rejects scripts and HTML-capable content in SVG assets", async () => {
    const registry = new AssetRegistry();
    const content =
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
    const invalid: AssetReference = {
      ...coreDefaultBaseAssetRegistration.metadata,
      assetId: "test.asset.script",
      byteSize: new TextEncoder().encode(content).byteLength,
    };

    await expect(registry.register({ metadata: invalid, content })).rejects.toBeInstanceOf(
      AssetRegistryError,
    );
    expect(registry.list()).toHaveLength(0);
  });
});
