import { describe, expect, it } from "vitest";

import { deepClone } from "./immutable";
import {
  BaseCompositionRegistry,
  CatalogObjectRegistry,
  FunctionContainerRegistry,
  RoomPresetRegistry,
  RoomRegistryError,
  RoomShellRegistry,
  createRoomCompositionRegistries,
} from "./roomRegistries";
import {
  cosmosMainRoomStandardPresetFixture,
  emptyRoomShellFixture,
  registerRoomShadowFixtures,
  roomShadowBaseCompositionFixture,
  roomShadowCatalogObjectsFixture,
} from "./roomShadowFixtures";
import {
  cosmosMainRoomFunctionContainers,
  cosmosMainRoomShell,
} from "./roomCompositionFixtures";
import type { CatalogObject } from "./roomCompositionTypes";

describe("Room Composition registries", () => {
  it("creates five independent validated registries", () => {
    const registries = createRoomCompositionRegistries();
    registerRoomShadowFixtures(registries);
    expect(registries.shells).toBeInstanceOf(RoomShellRegistry);
    expect(registries.presets).toBeInstanceOf(RoomPresetRegistry);
    expect(registries.catalogObjects).toBeInstanceOf(CatalogObjectRegistry);
    expect(registries.functionContainers).toBeInstanceOf(
      FunctionContainerRegistry,
    );
    expect(registries.baseCompositions).toBeInstanceOf(BaseCompositionRegistry);
    expect(registries.shells.list()).toHaveLength(2);
    expect(registries.presets.list()).toHaveLength(1);
    expect(registries.catalogObjects.list()).toHaveLength(9);
    expect(registries.functionContainers.list()).toHaveLength(6);
    expect(registries.baseCompositions.list()).toHaveLength(1);
  });

  it("rejects an exact duplicate ID and version atomically", () => {
    const registry = new RoomShellRegistry();
    registry.register(cosmosMainRoomShell);
    expect(() => registry.register(cosmosMainRoomShell)).toThrow(
      RoomRegistryError,
    );
    expect(registry.list()).toHaveLength(1);
    try {
      registry.register(cosmosMainRoomShell);
    } catch (error) {
      expect((error as RoomRegistryError).code).toBe("room_registry_duplicate");
    }
  });

  it("distinguishes missing identities from incompatible versions", () => {
    const registry = new RoomPresetRegistry();
    registry.register(cosmosMainRoomStandardPresetFixture);
    expect(() =>
      registry.resolve({
        id: "missing.room-preset",
        versionRange: "^1.0.0",
      }),
    ).toThrow(/not registered/);
    try {
      registry.resolve({
        id: cosmosMainRoomStandardPresetFixture.presetId,
        versionRange: "^9.0.0",
      });
    } catch (error) {
      expect((error as RoomRegistryError).code).toBe(
        "room_registry_version_incompatible",
      );
    }
  });

  it("selects the highest compatible version deterministically", () => {
    const registry = new RoomShellRegistry();
    const v110 = {
      ...deepClone(emptyRoomShellFixture),
      version: "1.1.0",
    };
    const v120 = {
      ...deepClone(emptyRoomShellFixture),
      version: "1.2.0",
    };
    registry.registerMany([v120, emptyRoomShellFixture, v110]);
    expect(
      registry.resolve({
        id: emptyRoomShellFixture.shellId,
        versionRange: "^1.0.0",
      }).version,
    ).toBe("1.2.0");
    expect(registry.list().map((entry) => entry.version)).toEqual([
      "1.0.0",
      "1.1.0",
      "1.2.0",
    ]);
  });

  it("returns immutable copies without freezing or mutating caller input", () => {
    const input = deepClone(
      roomShadowCatalogObjectsFixture[0]!,
    ) as CatalogObject;
    const before = JSON.stringify(input);
    const registry = new CatalogObjectRegistry();
    const stored = registry.register(input);
    expect(Object.isFrozen(input)).toBe(false);
    expect(Object.isFrozen(stored)).toBe(true);
    input.displayName = "Changed after registration";
    expect(registry.list()[0]!.displayName).not.toBe(input.displayName);
    expect(before).not.toBe(JSON.stringify(input));
  });

  it("keeps deterministic list order independent from registration order", () => {
    const forward = new CatalogObjectRegistry();
    const reverse = new CatalogObjectRegistry();
    forward.registerMany(roomShadowCatalogObjectsFixture);
    reverse.registerMany([...roomShadowCatalogObjectsFixture].reverse());
    expect(
      forward.list().map((entry) => `${entry.catalogObjectId}@${entry.version}`),
    ).toEqual(
      reverse.list().map((entry) => `${entry.catalogObjectId}@${entry.version}`),
    );
  });

  it("validates Function and Base artifacts through their production schemas", () => {
    const functions = new FunctionContainerRegistry();
    const bases = new BaseCompositionRegistry();
    functions.registerMany(cosmosMainRoomFunctionContainers);
    bases.register(roomShadowBaseCompositionFixture);
    expect(functions.list()).toHaveLength(6);
    expect(bases.list()[0]!.entryRoomId).toBe(
      roomShadowBaseCompositionFixture.entryRoomId,
    );
    expect(() =>
      bases.register({ ...deepClone(roomShadowBaseCompositionFixture), rooms: "invalid" }),
    ).toThrow(/validation failed/);
  });
});
