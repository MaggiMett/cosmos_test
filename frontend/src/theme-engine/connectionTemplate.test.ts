import { describe, expect, it } from "vitest";

import { cosmosConnectionTemplate } from "./connectionTemplate";

describe("Clear Cosmos Connection template", () => {
  it("models presentation without encoding relationship direction or hierarchy", () => {
    expect(cosmosConnectionTemplate.targetRole).toBe("connection");
    expect(cosmosConnectionTemplate.anchors.map((anchor) => anchor.anchorId)).toEqual([
      "connection.start",
      "connection.center",
      "connection.end",
    ]);
    expect(cosmosConnectionTemplate.states.map((state) => state.stateId)).not.toContain(
      "hover",
    );
    expect(cosmosConnectionTemplate.metadata.notes).toContain("no visible direction");
  });

  it("separates the straight interaction corridor from themeable beam artwork", () => {
    expect(cosmosConnectionTemplate.bounds).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ boundsId: "connection.hitbox" }),
        expect.objectContaining({ boundsId: "connection.visual" }),
      ]),
    );
    expect(cosmosConnectionTemplate.assetSlots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slotId: "connection.beam", required: true }),
        expect.objectContaining({ slotId: "connection.glow", required: false }),
      ]),
    );
  });
});
