import { describe, expect, it } from "vitest";

import { adaptBaseMainRoomV1 } from "./baseRoomCompatibilityAdapter";
import { baseMainRoomTemplate } from "./baseTemplate";
import {
  coreDefaultBaseComposition,
  coreDefaultBaseFunctionBindings,
} from "./coreDefaultBaseSkin";
import { deepClone } from "./immutable";
import { compareLegacyBaseToRoomSnapshot } from "./roomParity";
import {
  createRoomCompositionRegistries,
} from "./roomRegistries";
import {
  pinnedUserRoomCompositionFixture,
  registerRoomShadowFixtures,
  roomShadowSkinResolutionFixture,
  cosmosMainRoomStandardCompositionFixture,
} from "./roomShadowFixtures";
import { runBaseMainRoomShadowMode } from "./roomShadowMode";
import {
  RoomCompositionResolver,
  type ImmutableRoomSnapshot,
} from "./roomSnapshotResolver";

describe("Base Room Shadow Mode and legacy parity", () => {
  it("resolves the compatibility projection with exact legacy parity", () => {
    const result = runBaseMainRoomShadowMode();
    expect(result.mode).toBe("shadow");
    expect(result.authoritativeRuntime).toBe("legacy-base");
    expect(result.parity.status).toBe("equal");
    expect(result.parity.differences).toEqual([]);
    expect(result.parity.comparedFunctionalObjects).toBe(6);
    expect(result.snapshot.validationStatus.valid).toBe(true);
  });

  it("loads, resolves and compares without mutating legacy Runtime inputs", () => {
    const before = JSON.stringify({
      template: baseMainRoomTemplate,
      composition: coreDefaultBaseComposition,
      bindings: coreDefaultBaseFunctionBindings,
    });
    expect(Object.isFrozen(baseMainRoomTemplate)).toBe(false);
    const result = runBaseMainRoomShadowMode({
      legacy: {
        template: baseMainRoomTemplate,
        composition: coreDefaultBaseComposition,
        functionBindings: coreDefaultBaseFunctionBindings,
      },
    });
    expect(JSON.stringify({
      template: baseMainRoomTemplate,
      composition: coreDefaultBaseComposition,
      bindings: coreDefaultBaseFunctionBindings,
    })).toBe(before);
    expect(Object.isFrozen(baseMainRoomTemplate)).toBe(false);
    expect(result).not.toHaveProperty("apply");
    expect(result).not.toHaveProperty("activate");
  });

  it("classifies Skin-only changes as compatible differences", () => {
    const legacy = adaptBaseMainRoomV1();
    const skins = {
      activeThemeId: "test.theme.parity",
      availableSkins: [
        { skinId: "core.skin.base.default", version: "1.0.0" },
        { skinId: "test.skin.parity", version: "1.0.0" },
      ],
      assignments: legacy.catalogObjects.map((object) => ({
        assignmentId: `test.assignment.${object.catalogObjectId.replaceAll(".", "-")}`,
        targetCatalogObjectId: object.catalogObjectId,
        skinRef: { id: "test.skin.parity", versionRange: "^1.0.0" },
        source: "active-theme" as const,
      })),
    };
    const result = runBaseMainRoomShadowMode({ skins });
    expect(result.parity.status).toBe("compatible-difference");
    expect(result.parity.differences.every(
      (difference) =>
        difference.severity === "compatible-difference" &&
        difference.category === "skin",
    )).toBe(true);
  });

  it("classifies neutral lamps and decoration as compatible additions", () => {
    const legacy = adaptBaseMainRoomV1();
    const registries = createRoomCompositionRegistries();
    registerRoomShadowFixtures(registries);
    const snapshot = new RoomCompositionResolver(registries).resolve({
      roomComposition: cosmosMainRoomStandardCompositionFixture,
      skins: {
        availableSkins: [
          { skinId: "core.skin.base.default", version: "1.0.0" },
          { skinId: "core.skin.room-object.neutral", version: "1.0.0" },
        ],
        assignments: [],
      },
    });
    const parity = compareLegacyBaseToRoomSnapshot(legacy, snapshot);
    expect(parity.status).toBe("compatible-difference");
    expect(parity.differences.filter(
      (difference) => difference.category === "decoration",
    )).toHaveLength(3);
  });

  it("classifies changed functional position and Bounds as blocking", () => {
    const legacy = adaptBaseMainRoomV1();
    const registries = createRoomCompositionRegistries();
    registerRoomShadowFixtures(registries);
    const snapshot = new RoomCompositionResolver(registries).resolve({
      roomComposition: pinnedUserRoomCompositionFixture,
      skins: roomShadowSkinResolutionFixture,
    });
    const parity = compareLegacyBaseToRoomSnapshot(legacy, snapshot);
    expect(parity.status).toBe("blocking-difference");
    expect(parity.differences.map((difference) => difference.category)).toEqual(
      expect.arrayContaining(["position", "bounds"]),
    );
  });

  it("detects missing functional objects and binding changes as blocking", () => {
    const legacy = adaptBaseMainRoomV1();
    const registries = createRoomCompositionRegistries();
    registerRoomShadowFixtures(registries);
    const snapshot = new RoomCompositionResolver(registries).resolve({
      roomComposition: cosmosMainRoomStandardCompositionFixture,
      skins: roomShadowSkinResolutionFixture,
    });
    const altered = deepClone(snapshot) as ImmutableRoomSnapshot;
    altered.objectInstances = altered.objectInstances.filter(
      (object) => object.instanceId !== "core.scene.base.companion",
    );
    altered.functionContainers = altered.functionContainers.map((container) =>
      container.attachedObjectInstanceId === "core.scene.base.left-workspace"
        ? { ...container, descriptorRole: "tool.open" }
        : container,
    );
    const parity = compareLegacyBaseToRoomSnapshot(legacy, altered);
    expect(parity.status).toBe("blocking-difference");
    expect(parity.differences.map((difference) => difference.category)).toEqual(
      expect.arrayContaining(["companion", "function-binding"]),
    );
  });

  it("keeps Workspace, Door, Companion and Base Exit bindings stable", () => {
    const result = runBaseMainRoomShadowMode();
    const roles = result.snapshot.functionContainers.map(
      (container) => container.descriptorRole,
    );
    expect(roles.filter((role) => role === "workspace.open")).toHaveLength(2);
    expect(roles.filter((role) => role === "base.open")).toHaveLength(2);
    expect(roles).toContain("companion.open");
    expect(roles).toContain("base.close");
  });
});
