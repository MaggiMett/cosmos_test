import { describe, expect, it } from "vitest";

import { COSMOS_MAP_TEMPLATE_ID } from "./cosmosMapTemplate";
import { coreCosmosMapSkinPack } from "./coreCosmosMapSkin";
import { validateSkinPack } from "./validation";

describe("Cosmos Core Map skin", () => {
  it("targets the canonical Clear Map template", () => {
    const skin = coreCosmosMapSkinPack.skins[0];
    expect(skin.target).toMatchObject({
      presentationGroup: "map",
      templateRef: { id: COSMOS_MAP_TEMPLATE_ID },
    });
  });

  it("captures the approved CosmosMap art direction as theme tokens", () => {
    const tokens = coreCosmosMapSkinPack.skins[0].tokens;
    expect(tokens["cosmos.map.background"]).toEqual({ type: "color", value: "#030711" });
    expect(tokens["cosmos.map.node-cyan"]).toEqual({ type: "color", value: "#62d9ff" });
    expect(tokens["cosmos.map.node-violet"]).toEqual({ type: "color", value: "#a67cff" });
    expect(tokens["cosmos.map.connection"]).toEqual({ type: "color", value: "#68cfff" });
  });

  it("is structurally valid before production artwork is registered", () => {
    expect(() => validateSkinPack(coreCosmosMapSkinPack)).not.toThrow();
  });
});
