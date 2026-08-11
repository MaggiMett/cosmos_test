import { describe, expect, it } from "vitest";

import {
  adaptBaseMainRoomV1,
  resolveCompatibilityBounds,
} from "./baseRoomCompatibilityAdapter";
import { baseMainRoomTemplate } from "./baseTemplate";
import {
  coreDefaultBaseComposition,
  coreDefaultBaseFunctionBindings,
} from "./coreDefaultBaseSkin";
import {
  applyThemeChange,
  resolvePropertyOverride,
} from "./instanceOverrides";
import { mergeRoomPreset } from "./presetMerge";
import {
  baseMainRoomCompatibilityProjection,
  cosmosMainRoomComposition,
  cosmosMainRoomPreset,
} from "./roomCompositionFixtures";
import type {
  ObjectInstance,
  RoomComposition,
  RoomPreset,
} from "./roomCompositionTypes";

describe("base.main-room.v1 read-only compatibility adapter", () => {
  it("preserves all legacy surfaces, layers, bounds and Function Bindings", () => {
    const projection = baseMainRoomCompatibilityProjection;
    expect(projection.parity.surfaces).toHaveLength(8);
    expect(projection.parity.objects).toHaveLength(6);
    expect(projection.catalogObjects).toHaveLength(6);
    expect(projection.functionContainers).toHaveLength(6);

    for (const parity of projection.parity.objects) {
      const instance = projection.roomComposition.objectInstances.find(
        (candidate) => candidate.instanceId === parity.objectInstanceId,
      )!;
      const object = projection.catalogObjects.find(
        (candidate) => candidate.catalogObjectId === instance.catalogObjectRef.id,
      )!;
      const container = projection.functionContainers.find(
        (candidate) => candidate.containerId === parity.functionContainerId,
      )!;
      const resolved = resolveCompatibilityBounds(instance, object, container);
      expect(resolved.visualBounds).toEqual(parity.visualBounds);
      expect(resolved.interactionBounds).toEqual(parity.interactionBounds);
      expect(resolved.layoutBounds).toEqual(parity.layoutBounds);
      expect(resolved.effectBounds).toEqual(parity.effectBounds);
      expect(resolved.labelBounds).toEqual(parity.labelBounds);
      expect(instance.layer).toBe(parity.layer);
      expect(instance.depth).toBe(parity.depth);
      expect(container.functionBinding.descriptorRole).toBe(parity.descriptorRole);
    }
  });

  it("does not mutate legacy artifacts or create write-back authority", () => {
    const templateBefore = JSON.stringify(baseMainRoomTemplate);
    const compositionBefore = JSON.stringify(coreDefaultBaseComposition);
    const bindingsBefore = JSON.stringify(coreDefaultBaseFunctionBindings);
    expect(Object.isFrozen(baseMainRoomTemplate)).toBe(false);
    expect(Object.isFrozen(coreDefaultBaseComposition)).toBe(false);

    const projection = adaptBaseMainRoomV1({
      template: baseMainRoomTemplate,
      composition: coreDefaultBaseComposition,
      functionBindings: coreDefaultBaseFunctionBindings,
    });

    expect(JSON.stringify(baseMainRoomTemplate)).toBe(templateBefore);
    expect(JSON.stringify(coreDefaultBaseComposition)).toBe(compositionBefore);
    expect(JSON.stringify(coreDefaultBaseFunctionBindings)).toBe(bindingsBefore);
    expect(Object.isFrozen(baseMainRoomTemplate)).toBe(false);
    expect(Object.isFrozen(coreDefaultBaseComposition)).toBe(false);
    expect(Object.isFrozen(projection)).toBe(true);
    expect(Object.isFrozen(projection.roomComposition.objectInstances)).toBe(true);
    expect(projection).not.toHaveProperty("writeBack");
  });

  it("keeps visual and interaction bounds independently transformable", () => {
    const projection = baseMainRoomCompatibilityProjection;
    const instance = projection.roomComposition.objectInstances[0]!;
    const object = projection.catalogObjects.find(
      (candidate) => candidate.catalogObjectId === instance.catalogObjectRef.id,
    )!;
    const container = projection.functionContainers.find(
      (candidate) =>
        candidate.containerId ===
        projection.roomComposition.functionContainers.find(
          (entry) => entry.containerInstanceId === instance.functionContainerInstanceId,
        )?.definitionRef.id,
    )!;
    expect(object.defaultBounds.visual).not.toEqual(container.interactionBounds);
  });
});

describe("property-specific override behavior", () => {
  it("resolves inherit and reset to the parent while preserving pinned values", () => {
    expect(resolvePropertyOverride({ mode: "inherit" }, 10)).toBe(10);
    expect(resolvePropertyOverride({ mode: "reset-to-parent" }, 20)).toBe(20);
    expect(resolvePropertyOverride({ mode: "pinned", value: 30 }, 40)).toBe(30);
  });

  it("changes only inherit channels during a global Theme switch", () => {
    const instance = clone(cosmosMainRoomComposition.objectInstances[0]!);
    instance.propertyOverrides.position = {
      mode: "pinned",
      value: { x: 321, y: 123 },
    };
    instance.position = { x: 321, y: 123 };
    instance.propertyOverrides.rotation = { mode: "reset-to-parent" };
    instance.rotation = 45;
    instance.propertyOverrides.skin = {
      mode: "pinned",
      value: { id: "user.skin.favorite", versionRange: "^1.0.0" },
    };
    instance.skinRef = { id: "user.skin.favorite", versionRange: "^1.0.0" };

    const changed = applyThemeChange(instance, {
      position: { x: 1, y: 2 },
      rotation: 90,
      scale: { x: 2, y: 2 },
      skin: { id: "theme.skin.new", versionRange: "^2.0.0" },
      animation: { id: "theme.animation.new", versionRange: "^1.0.0" },
      material: { id: "theme.material.new", versionRange: "^1.0.0" },
      layer: "scene-front",
      depth: 42,
    });

    expect(changed.position).toEqual({ x: 321, y: 123 });
    expect(changed.rotation).toBe(45);
    expect(changed.skinRef.id).toBe("user.skin.favorite");
    expect(changed.scale).toEqual({ x: 2, y: 2 });
    expect(changed.layer).toBe("scene-front");
    expect(changed.depth).toBe(42);
  });
});

describe("pure Room Preset three-way merge foundation", () => {
  it("preserves pinned values and updates inherited values", () => {
    const original = clone(cosmosMainRoomPreset);
    const updated = clone(cosmosMainRoomPreset);
    updated.version = "1.1.0";
    updated.objectInstances[0]!.position = { x: 999, y: 888 };
    updated.objectInstances[0]!.scale = { x: 1.5, y: 1.5 };

    const user = clone(cosmosMainRoomComposition);
    user.objectInstances[0]!.scale = { x: 3, y: 3 };
    user.objectInstances[0]!.propertyOverrides.scale = {
      mode: "pinned",
      value: { x: 3, y: 3 },
    };

    const result = mergeRoomPreset({
      originalPreset: original,
      updatedPreset: updated,
      userComposition: user,
    });
    const merged = byPresetItem(
      result.composition,
      original.objectInstances[0]!.origin!.presetItemId!,
    );
    expect(merged.position).toEqual({ x: 999, y: 888 });
    expect(merged.scale).toEqual({ x: 3, y: 3 });
    expect(result.conflicts).toHaveLength(0);
  });

  it("keeps user-deleted objects deleted and recognizes new preset objects", () => {
    const original = clone(cosmosMainRoomPreset);
    const updated = clone(cosmosMainRoomPreset);
    updated.version = "1.1.0";
    const deletedId = original.objectInstances[0]!.origin!.presetItemId!;
    const added = clone(original.objectInstances[1]!);
    added.instanceId = "core.scene.base.new-decoration";
    added.origin = {
      presetId: updated.presetId,
      version: updated.version,
      presetItemId: "core.preset-item.new-decoration",
    };
    updated.objectInstances = [...updated.objectInstances, added];

    const user = clone(cosmosMainRoomComposition);
    user.objectInstances = user.objectInstances.filter(
      (instance) => instance.origin?.presetItemId !== deletedId,
    );
    user.deletedPresetItemIds = [deletedId];

    const result = mergeRoomPreset({
      originalPreset: original,
      updatedPreset: updated,
      userComposition: user,
    });
    expect(
      result.composition.objectInstances.some(
        (instance) => instance.origin?.presetItemId === deletedId,
      ),
    ).toBe(false);
    expect(
      result.items.find((item) => item.presetItemId === deletedId)?.state,
    ).toBe("user-deleted");
    expect(
      result.items.find(
        (item) => item.presetItemId === "core.preset-item.new-decoration",
      )?.state,
    ).toBe("added");
  });

  it("reports divergent Catalog Object changes and removed preset items explicitly", () => {
    const original = clone(cosmosMainRoomPreset);
    const updated = clone(cosmosMainRoomPreset);
    updated.version = "2.0.0";
    const conflictItemId = updated.objectInstances[0]!.origin!.presetItemId!;
    updated.objectInstances[0]!.catalogObjectRef = {
      id: "core.catalog.updated-door",
      versionRange: "^2.0.0",
    };
    const removedItem = updated.objectInstances.at(-1)!;
    updated.objectInstances = updated.objectInstances.slice(0, -1);

    const user = clone(cosmosMainRoomComposition);
    byPresetItem(user, conflictItemId).catalogObjectRef = {
      id: "user.catalog.custom-door",
      versionRange: "^1.0.0",
    };

    const result = mergeRoomPreset({
      originalPreset: original,
      updatedPreset: updated,
      userComposition: user,
    });
    expect(result.conflicts.map((conflict) => conflict.code)).toEqual(
      expect.arrayContaining(["catalog-reference-changed", "preset-item-removed"]),
    );
    expect(
      result.composition.objectInstances.some(
        (instance) =>
          instance.origin?.presetItemId === removedItem.origin?.presetItemId,
      ),
    ).toBe(true);
  });

  it("is deterministic and does not mutate merge inputs", () => {
    const original = clone(cosmosMainRoomPreset);
    const updated = clone(cosmosMainRoomPreset);
    updated.version = "1.0.1";
    const user = clone(cosmosMainRoomComposition);
    const before = JSON.stringify({ original, updated, user });

    const first = mergeRoomPreset({
      originalPreset: original,
      updatedPreset: updated,
      userComposition: user,
    });
    const second = mergeRoomPreset({
      originalPreset: original,
      updatedPreset: updated,
      userComposition: user,
    });
    expect(second).toEqual(first);
    expect(JSON.stringify({ original, updated, user })).toBe(before);
  });
});

function byPresetItem(
  owner: RoomPreset | RoomComposition,
  presetItemId: string,
): ObjectInstance {
  const instance = owner.objectInstances.find(
    (candidate) => candidate.origin?.presetItemId === presetItemId,
  );
  if (!instance) throw new Error(`Missing preset item ${presetItemId}`);
  return instance;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
