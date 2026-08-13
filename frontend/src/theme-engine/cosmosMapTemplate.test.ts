import { describe, expect, it } from "vitest";

import { cosmosMapTemplate } from "./cosmosMapTemplate";

describe("Clear Cosmos Map template", () => {
  it("keeps project semantics out of the presentation environment", () => {
    expect(cosmosMapTemplate.environmentKind).toBe("map");
    expect(cosmosMapTemplate.functionalZones).toHaveLength(0);
    expect(cosmosMapTemplate.metadata).toBeUndefined();
  });

  it("provides distinct layers for hierarchy nodes and their Core-owned connections", () => {
    expect(cosmosMapTemplate.layerBands).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ bandId: "connections", owner: "objects" }),
        expect.objectContaining({ bandId: "nodes", owner: "objects" }),
        expect.objectContaining({ bandId: "labels", owner: "objects" }),
      ]),
    );
    expect(cosmosMapTemplate.sceneRoots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rootId: "cosmos.map.scene.constellation" }),
        expect.objectContaining({ rootId: "cosmos.map.scene.connections" }),
      ]),
    );
  });

  it("reserves a safe constellation field while leaving layout to project data", () => {
    expect(cosmosMapTemplate.safeAreas).toContainEqual(
      expect.objectContaining({
        safeAreaId: "cosmos.map.safe-area.constellation",
        purpose: "functional-content",
        critical: true,
      }),
    );
    expect(cosmosMapTemplate.cardinality).toEqual({});
  });
});
