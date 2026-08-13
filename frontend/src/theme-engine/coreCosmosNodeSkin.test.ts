import { describe, expect, it } from "vitest";

import { coreCosmosGraphSkinPack } from "./coreCosmosNodeSkin";
import { validateSkinPack } from "./validation";

describe("Cosmos Core Project Graph skin", () => {
  it("covers the complete Project hierarchy plus Connections", () => {
    expect(coreCosmosGraphSkinPack.skins.map((skin) => skin.target.targetRoles?.[0])).toEqual([
      "node.project-root",
      "node.domain",
      "node.cluster",
      "node.object",
      "node.detail",
      "connection.standard",
    ]);
  });

  it("keeps Project Root visually dominant without changing Node semantics", () => {
    const root = coreCosmosGraphSkinPack.skins[0];
    const detail = coreCosmosGraphSkinPack.skins[4];

    expect(root.tokens["cosmos.node.glow-opacity"]).toEqual({ type: "number", value: 0.9 });
    expect(detail.tokens["cosmos.node.glow-opacity"]).toEqual({ type: "number", value: 0.68 });
    expect(root.target.targetRoles).toEqual(["node.project-root"]);
    expect(detail.target.targetRoles).toEqual(["node.detail"]);
  });

  it("defines Connection emphasis states without inventing hover semantics", () => {
    const connection = coreCosmosGraphSkinPack.skins[5];
    expect(connection.stateVariants.map((variant) => variant.stateId)).toEqual([
      "active",
      "highlighted",
      "search-result",
    ]);
  });

  it("is a structurally valid token-first skin pack", () => {
    expect(() => validateSkinPack(coreCosmosGraphSkinPack)).not.toThrow();
  });
});
