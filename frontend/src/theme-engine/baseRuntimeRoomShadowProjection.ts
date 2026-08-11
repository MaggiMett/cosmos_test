import type {
  BaseRoom,
  BaseSnapshot,
  WorkspaceSlot,
} from "../runtime/baseRuntime";
import {
  adaptBaseMainRoomV1,
  type BaseRoomCompatibilityProjection,
  type CompatibilityBoundsRecord,
} from "./baseRoomCompatibilityAdapter";
import { cloneAndFreeze, deepClone } from "./immutable";
import type { RoomParityDifference, RoomParityResult } from "./roomParity";
import type { ImmutableRoomSnapshot } from "./roomSnapshotResolver";
import type {
  FunctionContainerInstance,
  FunctionType,
  ObjectInstance,
  RoomConnection,
} from "./roomCompositionTypes";

type ReadonlySnapshotValue<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly ReadonlySnapshotValue<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: ReadonlySnapshotValue<T[Key]> }
      : T;

export type BaseRuntimeSnapshotReadModel = ReadonlySnapshotValue<BaseSnapshot>;

interface BaseRuntimeShadowBindingBase {
  descriptorRole: string;
  objectInstanceId: string;
  containerInstanceId: string;
}

export interface BaseRuntimeWorkspaceBinding
  extends BaseRuntimeShadowBindingBase {
  kind: "workspace";
  descriptorRole: "workspace.open";
  functionContainerRole: Extract<
    FunctionType,
    "knowledge-workspace" | "creation-workspace"
  >;
  workspaceSlotId: string;
  workspaceId: string | null;
}

export interface BaseRuntimeRoomTransitionBinding
  extends BaseRuntimeShadowBindingBase {
  kind: "room-transition";
  descriptorRole: "base.open" | "room.transition";
  functionContainerRole: "room-transition";
  doorId: string;
  targetRoomId: string;
}

export interface BaseRuntimeCompanionBinding
  extends BaseRuntimeShadowBindingBase {
  kind: "companion";
  descriptorRole: "companion.open";
  functionContainerRole: "companion-interaction";
  companionId: string;
}

export interface BaseRuntimeBaseExitBinding
  extends BaseRuntimeShadowBindingBase {
  kind: "base-exit";
  descriptorRole: "base.close";
  functionContainerRole: "base-exit";
  baseId: string;
}

export type BaseRuntimeShadowBinding =
  | BaseRuntimeWorkspaceBinding
  | BaseRuntimeRoomTransitionBinding
  | BaseRuntimeCompanionBinding
  | BaseRuntimeBaseExitBinding;

export type BaseRuntimeShadowBindingKind = BaseRuntimeShadowBinding["kind"];

export interface BaseRuntimeRoomReference {
  baseObjectId: string;
  roomId: string;
  roomName: string;
  petId: string | null;
  bindings: readonly Readonly<BaseRuntimeShadowBinding>[];
}

export type BaseRuntimeMainRoomReference = BaseRuntimeRoomReference;

export interface BaseRuntimeRoomShadowProjection {
  source: Readonly<BaseRuntimeRoomReference>;
  compatibility: Readonly<BaseRoomCompatibilityProjection>;
  runtimeBindings: readonly Readonly<BaseRuntimeShadowBinding>[];
}

export type BaseRuntimeMainRoomShadowProjection = BaseRuntimeRoomShadowProjection;

export class BaseRuntimeRoomShadowProjectionError extends Error {
  readonly code = "base_runtime_room_shadow_projection_invalid";
}

interface BindingAssignment {
  record: CompatibilityBoundsRecord;
  binding: BaseRuntimeShadowBinding;
  positionOffset: Readonly<{ x: number; y: number }>;
}

interface WorkspaceTemplateAssignment {
  slot: ReadonlySnapshotValue<WorkspaceSlot>;
  record: CompatibilityBoundsRecord;
  positionOffset: Readonly<{ x: number; y: number }>;
}

/**
 * Projects authoritative Base identities onto the existing compatibility
 * geometry. The result is ephemeral, immutable and has no Runtime write path.
 */
export function projectBaseMainRoomToRoomCompositionShadow(
  snapshot: BaseRuntimeSnapshotReadModel,
): Readonly<BaseRuntimeMainRoomShadowProjection> {
  const room = snapshot.rooms.find((candidate) => candidate.slug === "main");
  if (!room) {
    throw new BaseRuntimeRoomShadowProjectionError(
      "The Base Snapshot has no Main Room",
    );
  }

  return projectBaseRoomToRoomCompositionShadow(snapshot, room.objectId);
}

export function projectBaseRoomToRoomCompositionShadow(
  snapshot: BaseRuntimeSnapshotReadModel,
  roomId: string,
): Readonly<BaseRuntimeRoomShadowProjection> {
  const room = snapshot.rooms.find((candidate) => candidate.objectId === roomId);
  if (!room) {
    throw new BaseRuntimeRoomShadowProjectionError(
      `The Base Snapshot has no Room "${roomId}"`,
    );
  }

  const compatibility = adaptBaseMainRoomV1();
  const assignments = assignRuntimeBindings(snapshot, room, compatibility);
  const projected = remapCompatibilityProjection(
    snapshot,
    room,
    compatibility,
    assignments,
  );
  const runtimeBindings = assignments.map((assignment) => assignment.binding);
  const sourceBindings = expectedRuntimeBindings(snapshot, room, compatibility);

  return cloneAndFreeze({
    source: {
      baseObjectId: snapshot.base.objectId,
      roomId: room.objectId,
      roomName: room.displayName,
      petId: room.slug === "main" ? snapshot.pet?.objectId ?? null : null,
      bindings: sourceBindings,
    },
    compatibility: projected,
    runtimeBindings,
  });
}

/** Adds Runtime identity parity to the existing geometry/function comparator. */
export function compareBaseRuntimeRoomShadowProjection(
  projection: Readonly<BaseRuntimeRoomShadowProjection>,
  snapshot: Readonly<ImmutableRoomSnapshot>,
  structuralParity: Readonly<RoomParityResult>,
): Readonly<RoomParityResult> {
  const differences: RoomParityDifference[] = structuralParity.differences.map(
    (difference) => ({ ...difference }),
  );
  if (projection.source.roomId !== snapshot.roomId) {
    differences.push({
      severity: "blocking-difference",
      category: "room-transition",
      legacyId: projection.source.roomId,
      snapshotId: snapshot.roomId,
      message: `Room identity differs: Runtime "${projection.source.roomId}", snapshot "${snapshot.roomId}"`,
    });
  }

  const projectedBindings = new Map(
    projection.runtimeBindings.map((binding) => [bindingIdentity(binding), binding]),
  );
  const snapshotFunctions = new Map(
    snapshot.functionContainers.map((container) => [
      container.instance.containerInstanceId,
      container,
    ]),
  );

  for (const expected of projection.source.bindings) {
    const expectedIdentity = bindingIdentity(expected);
    const actual = projectedBindings.get(expectedIdentity);
    if (!actual) {
      differences.push({
        severity: "blocking-difference",
        category: categoryFor(expected.kind),
        legacyId: expectedIdentity,
        message: `Runtime function "${expectedIdentity}" has no projected binding`,
      });
      continue;
    }
    if (!sameRuntimeBinding(expected, actual)) {
      differences.push({
        severity: "blocking-difference",
        category: categoryFor(expected.kind),
        legacyId: expectedIdentity,
        snapshotId: actual.objectInstanceId,
        message: `Runtime target differs for "${expectedIdentity}": expected "${formatBindingTarget(expected)}", projected "${formatBindingTarget(actual)}"`,
      });
    }
    const container = snapshotFunctions.get(actual.containerInstanceId);
    if (
      !container ||
      container.attachedObjectInstanceId !== actual.objectInstanceId ||
      container.descriptorRole !== expected.descriptorRole ||
      container.actionRole !== expected.descriptorRole ||
      container.definition.functionType !== expected.functionContainerRole
    ) {
      differences.push({
        severity: "blocking-difference",
        category: categoryFor(expected.kind),
        legacyId: expectedIdentity,
        snapshotId: actual.objectInstanceId,
        message: `Runtime binding for "${expectedIdentity}" is not preserved by the resolved Function Container`,
      });
    }
  }

  for (const binding of projection.runtimeBindings) {
    if (
      projection.source.bindings.some(
        (expected) => bindingIdentity(expected) === bindingIdentity(binding),
      )
    ) {
      continue;
    }
    differences.push({
      severity: "blocking-difference",
      category: categoryFor(binding.kind),
      snapshotId: binding.objectInstanceId,
      message: `Shadow projection adds unknown Runtime binding "${bindingIdentity(binding)}"`,
    });
  }

  differences.sort(compareDifference);
  return cloneAndFreeze({
    status: differences.some(
      (difference) => difference.severity === "blocking-difference",
    )
      ? "blocking-difference"
      : differences.length > 0
        ? "compatible-difference"
        : "equal",
    differences,
    comparedFunctionalObjects: projection.source.bindings.length,
  });
}

function assignRuntimeBindings(
  snapshot: BaseRuntimeSnapshotReadModel,
  room: ReadonlySnapshotValue<BaseRoom>,
  compatibility: Readonly<BaseRoomCompatibilityProjection>,
): BindingAssignment[] {
  const records = compatibility.parity.objects;
  const workspaces = records
    .filter((record) => record.descriptorRole === "workspace.open")
    .sort((left, right) => left.depth - right.depth);
  const slots = [...room.workspaceSlots].sort(compareWorkspaceSlots);
  const assignments: BindingAssignment[] = [];

  const workspaceTemplates = assignWorkspaceTemplates(
    slots,
    workspaces,
    compatibility.shell.referenceViewport.width,
  );
  for (const template of workspaceTemplates) {
    const record = translateCompatibilityRecord(
      template.record,
      template.positionOffset,
    );
    assignments.push({
      record,
      positionOffset: template.positionOffset,
      binding: workspaceBinding(
        record,
        compatibility,
        template.slot,
      ),
    });
  }

  const doorTargetRoomId = connectedDoorTarget(snapshot, room.objectId);
  const doorRecord = records.find((record) =>
    record.legacyNodeId.includes("right-door"),
  );
  if (doorTargetRoomId && doorRecord) {
    assignments.push({
      record: doorRecord,
      positionOffset: { x: 0, y: 0 },
      binding: roomTransitionBinding(snapshot.door.objectId, doorTargetRoomId),
    });
  }

  const companionRecord = records.find(
    (record) => record.descriptorRole === "companion.open",
  );
  if (room.slug === "main" && snapshot.companion && companionRecord) {
    assignments.push({
      record: companionRecord,
      positionOffset: { x: 0, y: 0 },
      binding: companionBinding(snapshot.companion.objectId),
    });
  }

  const exitRecord = records.find(
    (record) => record.descriptorRole === "base.close",
  );
  if (exitRecord) {
    assignments.push({
      record: exitRecord,
      positionOffset: { x: 0, y: 0 },
      binding: baseExitBinding(snapshot.base.objectId),
    });
  }
  return assignments;
}

function expectedRuntimeBindings(
  snapshot: BaseRuntimeSnapshotReadModel,
  room: ReadonlySnapshotValue<BaseRoom>,
  compatibility: Readonly<BaseRoomCompatibilityProjection>,
): BaseRuntimeShadowBinding[] {
  const projected = assignRuntimeBindings(snapshot, room, compatibility).map(
    (assignment) => assignment.binding,
  );
  const representedIds = new Set(
    projected.map(bindingIdentity),
  );
  for (const slot of room.workspaceSlots) {
    if (representedIds.has(slot.objectId)) continue;
    const fallbackRecord = compatibility.parity.objects.find(
      (record) => record.descriptorRole === "workspace.open",
    );
    if (!fallbackRecord) continue;
    projected.push(workspaceBinding(fallbackRecord, compatibility, slot));
  }
  return projected.sort((left, right) =>
    compareText(bindingIdentity(left), bindingIdentity(right)),
  );
}

function remapCompatibilityProjection(
  snapshot: BaseRuntimeSnapshotReadModel,
  room: ReadonlySnapshotValue<BaseRoom>,
  compatibility: Readonly<BaseRoomCompatibilityProjection>,
  assignments: readonly BindingAssignment[],
): BaseRoomCompatibilityProjection {
  const sourceObjects = new Map(
    compatibility.roomComposition.objectInstances.map((instance) => [
      instance.instanceId,
      instance,
    ]),
  );
  const sourceContainers = new Map(
    compatibility.roomComposition.functionContainers.map((container) => [
      container.attachedObjectInstanceId,
      container,
    ]),
  );
  const objectInstances: ObjectInstance[] = [];
  const containerInstances: FunctionContainerInstance[] = [];
  const parityObjects: CompatibilityBoundsRecord[] = [];

  for (const assignment of assignments) {
    const sourceObject = sourceObjects.get(assignment.record.objectInstanceId);
    const sourceContainer = sourceContainers.get(assignment.record.objectInstanceId);
    if (!sourceObject || !sourceContainer) {
      throw new BaseRuntimeRoomShadowProjectionError(
        `Compatibility record "${assignment.record.legacyNodeId}" is incomplete`,
      );
    }
    const instance = deepClone(sourceObject);
    instance.instanceId = assignment.binding.objectInstanceId;
    instance.functionContainerInstanceId = assignment.binding.containerInstanceId;
    instance.position = {
      x: instance.position.x + assignment.positionOffset.x,
      y: instance.position.y + assignment.positionOffset.y,
    };
    if (instance.origin) {
      instance.origin = {
        ...instance.origin,
        presetItemId: `${instance.origin.presetItemId}.${assignment.binding.objectInstanceId}`,
      };
    }
    objectInstances.push(instance);

    const container = deepClone(sourceContainer);
    container.containerInstanceId = assignment.binding.containerInstanceId;
    container.attachedObjectInstanceId = assignment.binding.objectInstanceId;
    containerInstances.push(container);

    parityObjects.push({
      ...deepClone(assignment.record),
      legacyNodeId: bindingIdentity(assignment.binding),
      objectInstanceId: assignment.binding.objectInstanceId,
      descriptorId: bindingTarget(assignment.binding) ?? bindingIdentity(assignment.binding),
    });
  }

  const usedCatalogIds = new Set(
    objectInstances.map((instance) => instance.catalogObjectRef.id),
  );
  const usedContainerIds = new Set(
    containerInstances.map((instance) => instance.definitionRef.id),
  );
  const roomConnections = roomConnection(snapshot, room.objectId);
  const preset = {
    ...deepClone(compatibility.preset),
    displayName: room.displayName,
    objectInstances,
    functionContainers: containerInstances,
    connections: roomConnections,
  };
  const roomComposition = {
    ...deepClone(compatibility.roomComposition),
    roomId: room.objectId,
    objectInstances,
    functionContainers: containerInstances,
    connections: roomConnections,
    revision: { revisionId: `shadow:${room.objectId}` },
  };

  return {
    shell: deepClone(compatibility.shell),
    preset,
    catalogObjects: compatibility.catalogObjects
      .filter((object) => usedCatalogIds.has(object.catalogObjectId))
      .map(deepClone),
    functionContainers: compatibility.functionContainers
      .filter((container) => usedContainerIds.has(container.containerId))
      .map(deepClone),
    roomComposition,
    parity: {
      surfaces: deepClone(compatibility.parity.surfaces),
      objects: parityObjects,
    },
  };
}

function workspaceBinding(
  record: CompatibilityBoundsRecord,
  compatibility: Readonly<BaseRoomCompatibilityProjection>,
  slot: ReadonlySnapshotValue<WorkspaceSlot>,
): BaseRuntimeWorkspaceBinding {
  const definition = compatibility.functionContainers.find(
    (container) => container.containerId === record.functionContainerId,
  );
  const functionContainerRole = definition?.functionType;
  if (
    functionContainerRole !== "knowledge-workspace" &&
    functionContainerRole !== "creation-workspace"
  ) {
    throw new BaseRuntimeRoomShadowProjectionError(
      `Workspace "${slot.objectId}" has no compatible Function Container role`,
    );
  }
  return {
    kind: "workspace",
    descriptorRole: "workspace.open",
    functionContainerRole,
    objectInstanceId: slot.objectId,
    containerInstanceId: `${slot.objectId}.shadow-function`,
    workspaceSlotId: slot.objectId,
    workspaceId: slot.workspace?.objectId ?? null,
  };
}

function roomTransitionBinding(
  doorId: string,
  targetRoomId: string,
): BaseRuntimeRoomTransitionBinding {
  return {
    kind: "room-transition",
    descriptorRole: "base.open",
    functionContainerRole: "room-transition",
    objectInstanceId: doorId,
    containerInstanceId: `${doorId}.shadow-function`,
    doorId,
    targetRoomId,
  };
}

function companionBinding(companionId: string): BaseRuntimeCompanionBinding {
  return {
    kind: "companion",
    descriptorRole: "companion.open",
    functionContainerRole: "companion-interaction",
    objectInstanceId: companionId,
    containerInstanceId: `${companionId}.shadow-function`,
    companionId,
  };
}

function baseExitBinding(baseId: string): BaseRuntimeBaseExitBinding {
  return {
    kind: "base-exit",
    descriptorRole: "base.close",
    functionContainerRole: "base-exit",
    objectInstanceId: baseId,
    containerInstanceId: `${baseId}.shadow-function`,
    baseId,
  };
}

function bindingIdentity(bindingValue: BaseRuntimeShadowBinding): string {
  if (bindingValue.kind === "workspace") return bindingValue.workspaceSlotId;
  if (bindingValue.kind === "room-transition") return bindingValue.doorId;
  if (bindingValue.kind === "companion") return bindingValue.companionId;
  return bindingValue.baseId;
}

function bindingTarget(bindingValue: BaseRuntimeShadowBinding): string | null {
  if (bindingValue.kind === "workspace") return bindingValue.workspaceId;
  if (bindingValue.kind === "room-transition") return bindingValue.targetRoomId;
  if (bindingValue.kind === "companion") return bindingValue.companionId;
  return bindingValue.baseId;
}

function sameRuntimeBinding(
  expected: BaseRuntimeShadowBinding,
  actual: BaseRuntimeShadowBinding,
): boolean {
  return (
    expected.kind === actual.kind &&
    expected.descriptorRole === actual.descriptorRole &&
    expected.functionContainerRole === actual.functionContainerRole &&
    expected.objectInstanceId === actual.objectInstanceId &&
    expected.containerInstanceId === actual.containerInstanceId &&
    bindingIdentity(expected) === bindingIdentity(actual) &&
    bindingTarget(expected) === bindingTarget(actual)
  );
}

function connectedDoorTarget(
  snapshot: BaseRuntimeSnapshotReadModel,
  roomId: string,
): string | null {
  if (!snapshot.door) return null;
  if (snapshot.door.roomAId === roomId) return snapshot.door.roomBId;
  if (snapshot.door.roomBId === roomId) return snapshot.door.roomAId;
  return null;
}

function roomConnection(
  snapshot: BaseRuntimeSnapshotReadModel,
  roomId: string,
): RoomConnection[] {
  const targetRoomId = connectedDoorTarget(snapshot, roomId);
  if (!targetRoomId) return [];
  return [{
    connectionId: `${snapshot.door.objectId}.shadow-connection`,
    fromRoomId: snapshot.door.roomAId,
    toRoomId: snapshot.door.roomBId,
    bidirectional: true,
    visualObjectInstanceIds: [snapshot.door.objectId],
  }];
}

function compareWorkspaceSlots(
  left: ReadonlySnapshotValue<WorkspaceSlot>,
  right: ReadonlySnapshotValue<WorkspaceSlot>,
): number {
  return (
    sideOrder(left.placement) - sideOrder(right.placement) ||
    placementDepthOrder(left.placement) - placementDepthOrder(right.placement) ||
    compareText(left.objectId, right.objectId)
  );
}

function assignWorkspaceTemplates(
  slots: readonly ReadonlySnapshotValue<WorkspaceSlot>[],
  records: readonly CompatibilityBoundsRecord[],
  viewportWidth: number,
): WorkspaceTemplateAssignment[] {
  if (records.length === 0) return [];

  const horizontallyOrdered = [...records].sort(
    (left, right) =>
      horizontalOrigin(left.visualBounds) - horizontalOrigin(right.visualBounds) ||
      compareText(left.legacyNodeId, right.legacyNodeId),
  );
  const assigned = slots.map((slot, index) => ({
    slot,
    record: workspaceTemplateForSlot(
      slot,
      index,
      horizontallyOrdered,
      viewportWidth,
    ),
  }));
  const grouped = new Map<string, typeof assigned>();
  for (const assignment of assigned) {
    const group = grouped.get(assignment.record.legacyNodeId) ?? [];
    group.push(assignment);
    grouped.set(assignment.record.legacyNodeId, group);
  }

  const offsets = new Map<string, Readonly<{ x: number; y: number }>>();
  for (const group of grouped.values()) {
    group.sort((left, right) => compareWorkspaceSlots(left.slot, right.slot));
    const spacing = boundsHeight(group[0]!.record.visualBounds) + 20;
    for (let index = 0; index < group.length; index += 1) {
      offsets.set(group[index]!.slot.objectId, {
        x: 0,
        y: (index - (group.length - 1) / 2) * spacing,
      });
    }
  }

  return assigned.map((assignment) => ({
    ...assignment,
    positionOffset: offsets.get(assignment.slot.objectId) ?? { x: 0, y: 0 },
  }));
}

function workspaceTemplateForSlot(
  slot: ReadonlySnapshotValue<WorkspaceSlot>,
  index: number,
  records: readonly CompatibilityBoundsRecord[],
  viewportWidth: number,
): CompatibilityBoundsRecord {
  const placement = slot.placement.toLocaleLowerCase();
  if (placement.includes("left")) return records[0]!;
  if (placement.includes("right")) return records[records.length - 1]!;

  const left = records.find(
    (record) => horizontalOrigin(record.visualBounds) < viewportWidth / 2,
  );
  const right = records.find(
    (record) => horizontalOrigin(record.visualBounds) >= viewportWidth / 2,
  );
  const fallback = [left, right].filter(
    (record): record is CompatibilityBoundsRecord => record !== undefined,
  );
  const pool = fallback.length > 0 ? fallback : records;
  return pool[index % pool.length]!;
}

function translateCompatibilityRecord(
  record: CompatibilityBoundsRecord,
  offset: Readonly<{ x: number; y: number }>,
): CompatibilityBoundsRecord {
  return {
    ...deepClone(record),
    visualBounds: translateBounds(record.visualBounds, offset),
    interactionBounds: translateBounds(record.interactionBounds, offset),
    layoutBounds: translateBounds(record.layoutBounds, offset),
    effectBounds: translateBounds(record.effectBounds, offset),
    ...(record.labelBounds
      ? { labelBounds: translateBounds(record.labelBounds, offset) }
      : {}),
  };
}

function translateBounds(
  bounds: CompatibilityBoundsRecord["visualBounds"],
  offset: Readonly<{ x: number; y: number }>,
): CompatibilityBoundsRecord["visualBounds"] {
  if (bounds.type === "rect") {
    return { ...bounds, x: bounds.x + offset.x, y: bounds.y + offset.y };
  }
  if (bounds.type === "ellipse") {
    return { ...bounds, cx: bounds.cx + offset.x, cy: bounds.cy + offset.y };
  }
  return {
    ...bounds,
    points: bounds.points.map((point) => ({
      x: point.x + offset.x,
      y: point.y + offset.y,
    })),
  };
}

function horizontalOrigin(bounds: CompatibilityBoundsRecord["visualBounds"]): number {
  if (bounds.type === "rect") return bounds.x;
  if (bounds.type === "ellipse") return bounds.cx - bounds.rx;
  return Math.min(...bounds.points.map((point) => point.x));
}

function boundsHeight(bounds: CompatibilityBoundsRecord["visualBounds"]): number {
  if (bounds.type === "rect") return bounds.height;
  if (bounds.type === "ellipse") return bounds.ry * 2;
  const ys = bounds.points.map((point) => point.y);
  return Math.max(...ys) - Math.min(...ys);
}

function sideOrder(placement: string): number {
  const normalized = placement.toLocaleLowerCase();
  if (normalized.includes("left")) return 0;
  if (normalized.includes("right")) return 1;
  return 2;
}

function placementDepthOrder(placement: string): number {
  const normalized = placement.toLocaleLowerCase();
  if (normalized.includes("rear")) return 0;
  if (normalized.includes("front")) return 1;
  return 2;
}

function categoryFor(
  kind: BaseRuntimeShadowBindingKind,
): RoomParityDifference["category"] {
  if (kind === "workspace") return "workspace-assignment";
  if (kind === "room-transition") return "room-transition";
  if (kind === "companion") return "companion";
  return "base-exit";
}

function formatBindingTarget(bindingValue: BaseRuntimeShadowBinding): string {
  return bindingTarget(bindingValue) ?? "unavailable";
}

function compareDifference(
  left: RoomParityDifference,
  right: RoomParityDifference,
): number {
  return (
    severityOrder(left.severity) - severityOrder(right.severity) ||
    compareText(left.category, right.category) ||
    compareText(left.legacyId ?? "", right.legacyId ?? "") ||
    compareText(left.snapshotId ?? "", right.snapshotId ?? "") ||
    compareText(left.message, right.message)
  );
}

function severityOrder(
  severity: RoomParityDifference["severity"],
): number {
  return severity === "blocking-difference" ? 0 : 1;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
