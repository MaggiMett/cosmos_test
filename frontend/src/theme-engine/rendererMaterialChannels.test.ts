import { describe, expect, it } from "vitest";

import type { Material } from "./types";
import { rendererMaterialChannelRegistry } from "./rendererMaterialChannels";

const safeAsset = Object.freeze({
  assetId: "max.asset.texture",
  version: "1.0.0",
  kind: "image",
  format: "png",
  mimeType: "image/png",
  sha256: "a".repeat(64),
  byteSize: 128,
  width: 32,
  height: 32,
  catalogEntryId: "max.catalog.texture",
  catalogEntryVersion: "1.0.0",
});

function resolve(material: Material) {
  return rendererMaterialChannelRegistry.resolve(material, (assetId) =>
    assetId === safeAsset.assetId ? safeAsset : null,
  );
}

describe("renderer material channel registry", () => {
  it("resolves the closed DOM surface channel with typed safe values", () => {
    expect(
      resolve({
        channelId: "core.material.dom-surface",
        parameters: {
          "core.material.fill": "#102030",
          "core.material.opacity": 0.8,
        },
      }),
    ).toEqual({
      status: "resolved",
      channelId: "core.material.dom-surface",
      reason: null,
      parameters: [
        { parameterId: "core.material.fill", kind: "color", value: "#102030" },
        { parameterId: "core.material.opacity", kind: "number", value: 0.8 },
      ],
    });
  });

  it("keeps unknown channels and parameters unavailable", () => {
    expect(resolve({ channelId: "max.material.unknown", parameters: { "max.value": 1 } })).toMatchObject({
      status: "unavailable",
      reason: "unknown-channel",
    });
    expect(
      resolve({
        channelId: "core.material.dom-surface",
        parameters: { "max.material.custom": "red" },
      }),
    ).toMatchObject({ status: "unavailable", reason: "unknown-parameter" });
  });

  it("rejects wrong types, unsafe color text and values outside the declared range", () => {
    expect(
      resolve({
        channelId: "core.material.dom-surface",
        parameters: { "core.material.opacity": "1" },
      }),
    ).toMatchObject({ status: "unavailable", reason: "invalid-parameter-type" });
    expect(
      resolve({
        channelId: "core.material.dom-surface",
        parameters: { "core.material.opacity": 1.1 },
      }),
    ).toMatchObject({ status: "unavailable", reason: "parameter-out-of-range" });
    expect(
      resolve({
        channelId: "core.material.dom-surface",
        parameters: { "core.material.fill": "red; background:url(javascript:alert(1))" },
      }),
    ).toMatchObject({ status: "unavailable", reason: "invalid-parameter-type" });
  });

  it("resolves texture parameters only through a safe Asset Catalog reference", () => {
    const resolved = resolve({
      channelId: "core.material.dom-surface",
      parameters: { "core.material.texture-ref": safeAsset.assetId },
    });
    expect(resolved).toMatchObject({
      status: "resolved",
      parameters: [{ parameterId: "core.material.texture-ref", kind: "asset-reference", value: safeAsset }],
    });
    expect(
      resolve({
        channelId: "core.material.dom-surface",
        parameters: { "core.material.texture-ref": "max.asset.missing" },
      }),
    ).toMatchObject({ status: "unavailable", reason: "asset-unavailable" });
  });

  it("exposes no CSS, shader, script or expression execution path", () => {
    expect(Object.getOwnPropertyNames(rendererMaterialChannelRegistry)).toEqual(["channels"]);
    expect(rendererMaterialChannelRegistry).not.toHaveProperty("apply");
    expect(rendererMaterialChannelRegistry).not.toHaveProperty("render");
    expect(rendererMaterialChannelRegistry).not.toHaveProperty("compile");
  });
});
