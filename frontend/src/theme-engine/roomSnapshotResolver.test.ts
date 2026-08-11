import { describe, expect, it } from "vitest";

import { deepClone } from "./immutable";
import {
  createRoomCompositionRegistries,
  type RoomCompositionRegistries,
} from "./roomRegistries";
import {
  emptyRoomShellFixture,
  pinnedUserRoomCompositionFixture,
  registerRoomShadowFixtures,
  roomShadowBaseCompositionFixture,
  roomShadowCatalogObjectsFixture,
  roomShadowSkinResolutionFixture,
  cosmosMainRoomStandardCompositionFixture,
  cosmosMainRoomStandardPresetFixture,
} from "./roomShadowFixtures";
import {
  cosmosMainRoomFunctionContainers,
  cosmosMainRoomShell,
} from "./roomCompositionFixtures";
import {
  RoomCompositionResolver,
  RoomResolutionError,
  type RoomSkinResolutionInput,
} from "./roomSnapshotResolver";
import type { RoomComposition } from "./roomCompositionTypes";

describe("Room Composition Resolver and immutable snapshot", () => {
  it("resolves deterministically across input and Registry insertion order", () => {
    const first = resolverWithFixtures().resolve({
      roomComposition: cosmosMainRoomStandardCompositionFixture,
      skins: roomShadowSkinResolutionFixture,
    });

    const registries = createRoomCompositionRegistries();
    registerFixturesInReverse(registries);
    const reversedRoom = deepClone(
      cosmosMainRoomStandardCompositionFixture,
    ) as RoomComposition;
    reversedRoom.objectInstances = [...reversedRoom.objectInstances].reverse();
    reversedRoom.functionContainers = [
      ...reversedRoom.functionContainers,
    ].reverse();
    const second = new RoomCompositionResolver(registries).resolve({
      roomComposition: reversedRoom,
      skins: {
        ...roomShadowSkinResolutionFixture,
        assignments: [...roomShadowSkinResolutionFixture.assignments].reverse(),
        availableSkins: [
          ...roomShadowSkinResolutionFixture.availableSkins,
        ].reverse(),
      },
    });
    expect(second).toEqual(first);
  });

  it("produces a deeply immutable, write-method-free snapshot", () => {
    const snapshot = resolverWithFixtures().resolve({
      roomComposition: cosmosMainRoomStandardCompositionFixture,
      skins: roomShadowSkinResolutionFixture,
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.objectInstances)).toBe(true);
    expect(Object.isFrozen(snapshot.objectInstances[0]!.catalogObject)).toBe(true);
    expect(snapshot).not.toHaveProperty("save");
    expect(snapshot).not.toHaveProperty("apply");
    expect(snapshot).not.toHaveProperty("write");
  });

  it("records value, source, scope, override status, fallback, warnings and conflicts", () => {
    const snapshot = resolverWithFixtures().resolve({
      roomComposition: pinnedUserRoomCompositionFixture,
      skins: roomShadowSkinResolutionFixture,
    });
    const position = trace(
      snapshot,
      "core.scene.base.left-door",
      "position",
    );
    const skin = trace(snapshot, "core.scene.base.left-door", "skin");
    expect(position).toMatchObject({
      value: { x: 112, y: 248 },
      source: "user-composition",
      inheritedScope: "instance",
      overrideStatus: "pinned",
      fallback: false,
      warnings: [],
      conflicts: [],
    });
    expect(skin).toMatchObject({
      source: "active-theme",
      inheritedScope: "active-theme",
      overrideStatus: "inherit",
      fallback: false,
    });
  });

  it("preserves pinned position while inherited Skin follows the active Theme", () => {
    const snapshot = resolverWithFixtures().resolve({
      roomComposition: pinnedUserRoomCompositionFixture,
      skins: roomShadowSkinResolutionFixture,
    });
    const door = snapshot.objectInstances.find(
      (object) => object.instanceId === "core.scene.base.left-door",
    )!;
    expect(door.position).toEqual({ x: 112, y: 248 });
    expect(door.resolvedSkin).toEqual({
      id: "test.skin.room.theme-neutral",
      version: "2.0.0",
    });
  });

  it("falls back to Core Default when a selected Skin is missing", () => {
    const missingTheme: RoomSkinResolutionInput = {
      availableSkins: [
        { skinId: "core.skin.base.default", version: "1.0.0" },
        { skinId: "core.skin.room-object.neutral", version: "1.0.0" },
      ],
      assignments: roomShadowSkinResolutionFixture.assignments.map(
        (assignment) => ({
          ...assignment,
          skinRef: {
            id: "missing.skin.theme",
            versionRange: "^1.0.0",
          },
        }),
      ),
    };
    const snapshot = resolverWithFixtures().resolve({
      roomComposition: cosmosMainRoomStandardCompositionFixture,
      skins: missingTheme,
    });
    const door = snapshot.objectInstances.find(
      (object) => object.instanceId === "core.scene.base.left-door",
    )!;
    expect(door.resolvedSkin).toEqual({
      id: "core.skin.base.default",
      version: "1.0.0",
    });
    expect(door.propertyResolution.skin.fallback).toBe(true);
    expect(door.propertyResolution.skin.warnings[0]).toContain("unavailable");
  });

  it("reports missing and incompatible artifact references clearly", () => {
    const missing = deepClone(
      cosmosMainRoomStandardCompositionFixture,
    ) as RoomComposition;
    missing.objectInstances[0]!.catalogObjectRef = {
      id: "missing.catalog.object",
      versionRange: "^1.0.0",
    };
    expect(() =>
      resolverWithFixtures().resolve({
        roomComposition: missing,
        skins: roomShadowSkinResolutionFixture,
      }),
    ).toThrow(/could not be resolved/);

    const incompatible = deepClone(
      cosmosMainRoomStandardCompositionFixture,
    ) as RoomComposition;
    incompatible.shellRef = {
      ...incompatible.shellRef,
      versionRange: "^9.0.0",
    };
    try {
      resolverWithFixtures().resolve({
        roomComposition: incompatible,
        skins: roomShadowSkinResolutionFixture,
      });
    } catch (error) {
      expect((error as RoomResolutionError).code).toBe(
        "room_resolution_reference_incompatible",
      );
    }
  });

  it("rejects cyclic Object attachment references", () => {
    const cyclic = deepClone(
      cosmosMainRoomStandardCompositionFixture,
    ) as RoomComposition;
    const left = cyclic.objectInstances[0]!;
    const right = cyclic.objectInstances[1]!;
    left.parentAttachment = {
      parentInstanceId: right.instanceId,
      anchorId: "test.anchor.right",
    };
    right.parentAttachment = {
      parentInstanceId: left.instanceId,
      anchorId: "test.anchor.left",
    };
    expect(() =>
      resolverWithFixtures().resolve({
        roomComposition: cyclic,
        skins: roomShadowSkinResolutionFixture,
      }),
    ).toThrow(/cycle/i);
  });

  it("keeps stable Function Bindings and attachment identities", () => {
    const snapshot = resolverWithFixtures().resolve({
      roomComposition: cosmosMainRoomStandardCompositionFixture,
      skins: roomShadowSkinResolutionFixture,
    });
    expect(snapshot.functionContainers).toHaveLength(6);
    for (const container of snapshot.functionContainers) {
      expect(container.instance.expectedDescriptorRole).toBe(
        container.descriptorRole,
      );
      expect(
        snapshot.objectInstances.find(
          (object) =>
            object.instanceId === container.attachedObjectInstanceId &&
            object.functionContainerInstanceId ===
              container.instance.containerInstanceId,
        ),
      ).toBeDefined();
    }
  });

  it("does not change after mutable input data changes", () => {
    const input = deepClone(
      cosmosMainRoomStandardCompositionFixture,
    ) as RoomComposition;
    const snapshot = resolverWithFixtures().resolve({
      roomComposition: input,
      skins: roomShadowSkinResolutionFixture,
    });
    const before = JSON.stringify(snapshot);
    input.objectInstances[0]!.position = { x: 9999, y: 9999 };
    input.objectInstances = [];
    expect(JSON.stringify(snapshot)).toBe(before);
  });
});

function resolverWithFixtures(): RoomCompositionResolver {
  const registries = createRoomCompositionRegistries();
  registerRoomShadowFixtures(registries);
  return new RoomCompositionResolver(registries);
}

function registerFixturesInReverse(
  registries: RoomCompositionRegistries,
): void {
  registries.shells.registerMany([
    emptyRoomShellFixture,
    cosmosMainRoomShell,
  ]);
  registries.presets.register(cosmosMainRoomStandardPresetFixture);
  registries.catalogObjects.registerMany(
    [...roomShadowCatalogObjectsFixture].reverse(),
  );
  registries.functionContainers.registerMany(
    [...cosmosMainRoomFunctionContainers].reverse(),
  );
  registries.baseCompositions.register(roomShadowBaseCompositionFixture);
}

function trace(
  snapshot: ReturnType<RoomCompositionResolver["resolve"]>,
  objectId: string,
  property: string,
) {
  return snapshot.resolutionTrace.properties.find(
    (entry) =>
      entry.objectInstanceId === objectId && entry.property === property,
  )!;
}
