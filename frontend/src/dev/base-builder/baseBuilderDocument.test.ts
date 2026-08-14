import { describe, expect, it } from "vitest";

import { baseBuilderStandardCompositionFixture } from "./baseBuilderFixtures";
import { createBaseBuilderDocument, replaceBaseBuilderRoom } from "./baseBuilderDocument";

describe("Base Builder document contract", () => {
  it("wraps a validated Room Composition in an explicit Base Composition", () => {
    const document = createBaseBuilderDocument(baseBuilderStandardCompositionFixture);

    expect(document.activeRoomId).toBe(baseBuilderStandardCompositionFixture.roomId);
    expect(document.base.entryRoomId).toBe(baseBuilderStandardCompositionFixture.roomId);
    expect(document.base.rooms).toHaveLength(1);
    expect(document.base.rooms[0]).toEqual(baseBuilderStandardCompositionFixture);
  });

  it("replaces only the active Room and derives the Base revision", () => {
    const document = createBaseBuilderDocument(baseBuilderStandardCompositionFixture);
    const edited = structuredClone(baseBuilderStandardCompositionFixture);
    edited.revision.revisionId = "room-edit-2";
    edited.objectInstances = edited.objectInstances.slice(0, 1);

    const next = replaceBaseBuilderRoom(document, edited);

    expect(next.base.rooms[0].objectInstances).toHaveLength(1);
    expect(next.base.revision.revisionId).toBe("builder:room-edit-2");
    expect(document.base.rooms[0].objectInstances.length).toBeGreaterThan(1);
  });

  it("rejects replacing a different Room through the active Room contract", () => {
    const document = createBaseBuilderDocument(baseBuilderStandardCompositionFixture);
    const otherRoom = structuredClone(baseBuilderStandardCompositionFixture);
    otherRoom.roomId = "room.other";

    expect(() => replaceBaseBuilderRoom(document, otherRoom)).toThrow(/room mismatch/);
  });
});
