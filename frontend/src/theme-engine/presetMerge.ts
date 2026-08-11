import type { ObjectInstancePresentationValues } from "./instanceOverrides";
import { applyInheritedPresentation } from "./instanceOverrides";
import type {
  ObjectInstance,
  PresetMergeConflict,
  PresetMergeItem,
  PresetMergeResult,
  RoomComposition,
  RoomPreset,
} from "./roomCompositionTypes";

export interface MergeRoomPresetInput {
  originalPreset: RoomPreset;
  updatedPreset: RoomPreset;
  userComposition: RoomComposition;
}

export function mergeRoomPreset(input: MergeRoomPresetInput): PresetMergeResult {
  const originalByItem = indexPreset(input.originalPreset);
  const updatedByItem = indexPreset(input.updatedPreset);
  const userByItem = indexUserInstances(input.userComposition.objectInstances);
  const deleted = new Set(input.userComposition.deletedPresetItemIds ?? []);
  const output: ObjectInstance[] = [];
  const items: PresetMergeItem[] = [];
  const conflicts: PresetMergeConflict[] = [];

  for (const [presetItemId, original] of originalByItem) {
    if (!userByItem.has(presetItemId)) deleted.add(presetItemId);
    const updated = updatedByItem.get(presetItemId);
    const user = userByItem.get(presetItemId);

    if (!user) {
      items.push({
        presetItemId,
        state: "user-deleted",
        message: "User deletion is preserved; the preset item was not restored",
      });
      continue;
    }
    if (!updated) {
      output.push(user);
      items.push({
        presetItemId,
        state: "conflict",
        instanceId: user.instanceId,
        message: "Updated preset removed an existing user instance",
      });
      conflicts.push({
        presetItemId,
        code: "preset-item-removed",
        message: "The preset item was removed; the user instance is preserved pending an explicit transaction",
      });
      continue;
    }

    const userChangedCatalog = !sameRef(user.catalogObjectRef, original.catalogObjectRef);
    const presetChangedCatalog = !sameRef(updated.catalogObjectRef, original.catalogObjectRef);
    if (userChangedCatalog && presetChangedCatalog && !sameRef(user.catalogObjectRef, updated.catalogObjectRef)) {
      output.push(user);
      items.push({
        presetItemId,
        state: "conflict",
        instanceId: user.instanceId,
        message: "User and preset changed the Catalog Object reference differently",
      });
      conflicts.push({
        presetItemId,
        code: "catalog-reference-changed",
        message: "Catalog Object reference requires explicit conflict resolution",
      });
      continue;
    }

    const merged = applyInheritedPresentation(user, presentationOf(updated));
    output.push({
      ...merged,
      catalogObjectRef: userChangedCatalog ? user.catalogObjectRef : updated.catalogObjectRef,
      surfaceBinding:
        user.propertyOverrides.position.mode === "pinned"
          ? user.surfaceBinding
          : updated.surfaceBinding,
      origin: {
        presetId: input.updatedPreset.presetId,
        version: input.updatedPreset.version,
        presetItemId,
      },
    });
    const changed = JSON.stringify(merged) !== JSON.stringify(user);
    items.push({
      presetItemId,
      state: changed ? "updated" : "unchanged",
      instanceId: user.instanceId,
      message: changed
        ? "Inherited properties accepted the updated preset baseline"
        : "No inherited property changed",
    });
  }

  for (const [presetItemId, updated] of updatedByItem) {
    if (originalByItem.has(presetItemId) || deleted.has(presetItemId)) continue;
    output.push(updated);
    items.push({
      presetItemId,
      state: "added",
      instanceId: updated.instanceId,
      message: "New preset item was detected and added deterministically",
    });
  }

  for (const instance of input.userComposition.objectInstances) {
    if (!instance.origin?.presetItemId) output.push(instance);
  }

  output.sort((left, right) => compareText(left.instanceId, right.instanceId));
  items.sort((left, right) => compareText(left.presetItemId, right.presetItemId));
  conflicts.sort((left, right) => compareText(left.presetItemId, right.presetItemId));

  const presentInstanceIds = new Set(output.map((instance) => instance.instanceId));
  const functionContainers = [
    ...input.userComposition.functionContainers.filter((container) =>
      presentInstanceIds.has(container.attachedObjectInstanceId),
    ),
    ...input.updatedPreset.functionContainers.filter(
      (container) =>
        presentInstanceIds.has(container.attachedObjectInstanceId) &&
        !input.userComposition.functionContainers.some(
          (current) => current.containerInstanceId === container.containerInstanceId,
        ),
    ),
  ].sort((left, right) =>
    compareText(left.containerInstanceId, right.containerInstanceId),
  );

  return {
    composition: {
      ...input.userComposition,
      presetOrigin: {
        presetId: input.updatedPreset.presetId,
        version: input.updatedPreset.version,
      },
      objectInstances: output,
      functionContainers,
      deletedPresetItemIds: [...deleted].sort(compareText),
    },
    items,
    conflicts,
  };
}

function indexPreset(preset: RoomPreset): Map<string, ObjectInstance> {
  const result = new Map<string, ObjectInstance>();
  for (const instance of preset.objectInstances) {
    const itemId = instance.origin?.presetItemId;
    if (!itemId || result.has(itemId)) continue;
    result.set(itemId, instance);
  }
  return result;
}

function indexUserInstances(
  instances: readonly ObjectInstance[],
): Map<string, ObjectInstance> {
  const result = new Map<string, ObjectInstance>();
  for (const instance of instances) {
    const itemId = instance.origin?.presetItemId;
    if (itemId && !result.has(itemId)) result.set(itemId, instance);
  }
  return result;
}

function presentationOf(instance: ObjectInstance): ObjectInstancePresentationValues {
  return {
    position: instance.position,
    rotation: instance.rotation,
    scale: instance.scale,
    skin: instance.skinRef,
    animation: instance.animationRef ?? null,
    material: instance.materialRef ?? null,
    layer: instance.layer,
    depth: instance.depth,
  };
}

function sameRef(
  left: ObjectInstance["catalogObjectRef"],
  right: ObjectInstance["catalogObjectRef"],
): boolean {
  return left.id === right.id && left.versionRange === right.versionRange;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
