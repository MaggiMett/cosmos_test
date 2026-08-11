import {
  projectBaseRuntimeState,
  type BaseRoomPresentation,
} from "../base-runtime/baseRuntimeProjection";
import {
  projectBaseRoomToRoomCompositionShadow,
  type BaseRuntimeSnapshotReadModel,
  type BaseRuntimeShadowBinding,
} from "../../theme-engine/baseRuntimeRoomShadowProjection";
import { cloneAndFreeze, deepClone } from "../../theme-engine/immutable";
import type { RoomParityStatus } from "../../theme-engine/roomParity";
import type {
  ImmutableRoomSnapshot,
  ResolvedRoomFunctionContainer,
  ResolvedRoomObjectInstance,
} from "../../theme-engine/roomSnapshotResolver";
import type { FunctionType } from "../../theme-engine/roomCompositionTypes";
import type { BoundsShape, Point } from "../../theme-engine/types";

export type RoomShadowDiagnosticMode = "visual" | "interaction" | "focus";

export interface RoomShadowInteractionTarget {
  containerInstanceId: string;
  objectInstanceId: string;
  functionRole: FunctionType;
  descriptorRole: string;
  bindingKind: BaseRuntimeShadowBinding["kind"] | "unbound";
  bindingId: string;
  bindingTargetId: string | null;
  visualBounds: BoundsShape;
  interactionBounds: BoundsShape;
  position: Point;
  available: boolean;
  focusable: boolean;
  focusOrder: number;
  semanticLabel: string;
}

export interface RoomShadowFocusTarget {
  order: number;
  containerInstanceId: string;
  functionRole: FunctionType;
  bindingId: string;
  bindingTargetId: string | null;
  available: boolean;
  semanticLabel: string;
}

export interface RoomCompositionInteractionProjection {
  targets: readonly Readonly<RoomShadowInteractionTarget>[];
  focusPlan: readonly Readonly<RoomShadowFocusTarget>[];
}

export interface RoomInteractionParityDifference {
  category:
    | "container"
    | "function-role"
    | "runtime-binding"
    | "interaction-bounds"
    | "position"
    | "availability"
    | "focus-order"
    | "semantic-label";
  expectedId?: string;
  actualId?: string;
  message: string;
}

export interface RoomInteractionParityResult {
  status: RoomParityStatus;
  differences: readonly Readonly<RoomInteractionParityDifference>[];
  expectedTargetCount: number;
  actualTargetCount: number;
}

export interface RoomCompositionInteractionDiagnostics {
  expected: Readonly<RoomCompositionInteractionProjection>;
  actual: Readonly<RoomCompositionInteractionProjection>;
  parity: Readonly<RoomInteractionParityResult>;
}

/**
 * Projects only resolved Function Container contracts. Interaction geometry is
 * never inferred from artwork or visual bounds.
 */
export function projectRoomCompositionInteractions(
  snapshot: Readonly<ImmutableRoomSnapshot>,
  runtimeBindings: readonly Readonly<BaseRuntimeShadowBinding>[],
  semanticLabels: Readonly<Record<string, string>> = {},
): Readonly<RoomCompositionInteractionProjection> {
  const objects = new Map(
    snapshot.objectInstances.map((object) => [object.instanceId, object]),
  );
  const bindings = new Map(
    runtimeBindings.map((binding) => [binding.containerInstanceId, binding]),
  );
  const targets = snapshot.functionContainers.map((container) => {
    const object = objects.get(container.attachedObjectInstanceId);
    if (!object) {
      throw new Error(
        `Function Container "${container.instance.containerInstanceId}" has no resolved Object`,
      );
    }
    return interactionTarget(
      object,
      container,
      bindings.get(container.instance.containerInstanceId) ?? null,
      semanticLabels[container.instance.containerInstanceId],
    );
  });
  const ordered = orderShadowFocusTargets(targets);
  return freezeProjection(ordered);
}

/** Reuses the productive Base presenter projection and legacy parity geometry. */
export function projectBasePresenterInteractionExpectations(
  snapshot: BaseRuntimeSnapshotReadModel,
  roomId = snapshot.rooms.find((room) => room.slug === "main")?.objectId ?? "",
): Readonly<RoomCompositionInteractionProjection> {
  const presenter = projectBaseRuntimeState("ready", snapshot, null, roomId);
  if (presenter.phase !== "success") {
    return freezeProjection([]);
  }
  const compatibility = projectBaseRoomToRoomCompositionShadow(snapshot, roomId);
  const records = new Map(
    compatibility.compatibility.parity.objects.map((record) => [
      record.objectInstanceId,
      record,
    ]),
  );
  const bindings = new Map(
    compatibility.runtimeBindings.map((binding) => [binding.objectInstanceId, binding]),
  );
  const orderedIds = [
    ...presenter.room.doorTargets.map((door) => door.objectId),
    ...presenter.room.workspaceSlots.map((slot) => slot.slotObjectId),
    ...(presenter.room.companion ? [presenter.room.companion.objectId] : []),
    presenter.room.baseObjectId,
  ];
  const labels = presenterLabels(presenter.room, compatibility.runtimeBindings);
  const targets = orderedIds.flatMap((objectId, index) => {
    const binding = bindings.get(objectId);
    const record = records.get(objectId);
    if (!binding || !record) return [];
    return [{
      containerInstanceId: binding.containerInstanceId,
      objectInstanceId: binding.objectInstanceId,
      functionRole: binding.functionContainerRole,
      descriptorRole: binding.descriptorRole,
      bindingKind: binding.kind,
      bindingId: bindingIdentity(binding),
      bindingTargetId: bindingTarget(binding),
      visualBounds: cloneShape(record.visualBounds),
      interactionBounds: cloneShape(record.interactionBounds),
      position: boundsOrigin(record.visualBounds),
      available: bindingAvailable(binding),
      focusable: true,
      focusOrder: index + 1,
      semanticLabel:
        labels[binding.containerInstanceId] ?? defaultSemanticLabel(binding.functionContainerRole),
    } satisfies RoomShadowInteractionTarget];
  });
  return freezeProjection(targets);
}

export function createRoomCompositionInteractionDiagnostics(
  baseSnapshot: BaseRuntimeSnapshotReadModel,
  roomSnapshot: Readonly<ImmutableRoomSnapshot>,
  runtimeBindings: readonly Readonly<BaseRuntimeShadowBinding>[],
  roomId = roomSnapshot.roomId,
): Readonly<RoomCompositionInteractionDiagnostics> {
  const expected = projectBasePresenterInteractionExpectations(baseSnapshot, roomId);
  const semanticLabels = Object.fromEntries(
    expected.targets.map((target) => [target.containerInstanceId, target.semanticLabel]),
  );
  const actual = projectRoomCompositionInteractions(
    roomSnapshot,
    runtimeBindings,
    semanticLabels,
  );
  return cloneAndFreeze({
    expected,
    actual,
    parity: compareRoomCompositionInteractionParity(expected, actual),
  });
}

export function compareRoomCompositionInteractionParity(
  expected: Readonly<RoomCompositionInteractionProjection>,
  actual: Readonly<RoomCompositionInteractionProjection>,
): Readonly<RoomInteractionParityResult> {
  const differences: RoomInteractionParityDifference[] = [];
  reportDuplicates(actual.targets, "containerInstanceId", differences);
  reportDuplicates(actual.targets, "bindingId", differences);

  const actualByContainer = new Map(
    actual.targets.map((target) => [target.containerInstanceId, target]),
  );
  for (const expectedTarget of expected.targets) {
    const actualTarget = actualByContainer.get(expectedTarget.containerInstanceId);
    if (!actualTarget) {
      differences.push({
        category: "container",
        expectedId: expectedTarget.containerInstanceId,
        message: `Interactive container "${expectedTarget.containerInstanceId}" is missing`,
      });
      continue;
    }
    compareTarget(expectedTarget, actualTarget, differences);
  }
  const expectedIds = new Set(
    expected.targets.map((target) => target.containerInstanceId),
  );
  for (const actualTarget of actual.targets) {
    if (expectedIds.has(actualTarget.containerInstanceId)) continue;
    differences.push({
      category: "container",
      actualId: actualTarget.containerInstanceId,
      message: `Shadow projection adds unknown focus target "${actualTarget.containerInstanceId}"`,
    });
  }
  differences.sort(compareDifference);
  return cloneAndFreeze({
    status: differences.length > 0 ? "blocking-difference" : "equal",
    differences,
    expectedTargetCount: expected.targets.length,
    actualTargetCount: actual.targets.length,
  });
}

function interactionTarget(
  object: Readonly<ResolvedRoomObjectInstance>,
  container: Readonly<ResolvedRoomFunctionContainer>,
  binding: Readonly<BaseRuntimeShadowBinding> | null,
  semanticLabel?: string,
): RoomShadowInteractionTarget {
  return {
    containerInstanceId: container.instance.containerInstanceId,
    objectInstanceId: object.instanceId,
    functionRole: container.definition.functionType,
    descriptorRole: container.descriptorRole,
    bindingKind: binding?.kind ?? "unbound",
    bindingId: binding ? bindingIdentity(binding) : object.instanceId,
    bindingTargetId: binding ? bindingTarget(binding) : null,
    visualBounds: transformBounds(
      object.catalogObject.defaultBounds.visual,
      object.position,
      object.scale,
    ),
    interactionBounds: transformBounds(
      container.definition.interactionBounds,
      object.position,
      object.scale,
    ),
    position: { ...object.position },
    available: binding ? bindingAvailable(binding) : false,
    focusable: container.definition.focusBehavior.focusable,
    focusOrder: 0,
    semanticLabel: semanticLabel ?? defaultSemanticLabel(container.definition.functionType),
  };
}

function orderShadowFocusTargets(
  targets: readonly RoomShadowInteractionTarget[],
): RoomShadowInteractionTarget[] {
  const ordered = [...targets].sort(
    (left, right) =>
      focusRoleOrder(left.functionRole) - focusRoleOrder(right.functionRole) ||
      compareText(left.objectInstanceId, right.objectInstanceId) ||
      compareText(left.containerInstanceId, right.containerInstanceId),
  );
  return ordered.map((target, index) => ({ ...target, focusOrder: index + 1 }));
}

function freezeProjection(
  targets: readonly RoomShadowInteractionTarget[],
): Readonly<RoomCompositionInteractionProjection> {
  const frozenTargets = targets.map((target) => cloneAndFreeze(target));
  return cloneAndFreeze({
    targets: frozenTargets,
    focusPlan: frozenTargets
      .filter((target) => target.focusable)
      .map((target) => ({
        order: target.focusOrder,
        containerInstanceId: target.containerInstanceId,
        functionRole: target.functionRole,
        bindingId: target.bindingId,
        bindingTargetId: target.bindingTargetId,
        available: target.available,
        semanticLabel: target.semanticLabel,
      })),
  });
}

function presenterLabels(
  room: Readonly<BaseRoomPresentation>,
  runtimeBindings: readonly Readonly<BaseRuntimeShadowBinding>[],
): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const binding of runtimeBindings) {
    if (binding.kind === "workspace") {
      const slot = room.workspaceSlots.find(
        (candidate) => candidate.slotObjectId === binding.workspaceSlotId,
      );
      labels[binding.containerInstanceId] = slot?.displayName ?? "Workspace unavailable";
    } else if (binding.kind === "room-transition") {
      const door = room.doorTargets.find((candidate) => candidate.objectId === binding.doorId);
      labels[binding.containerInstanceId] = door?.targetRoomName
        ? `${door.displayName} to ${door.targetRoomName}`
        : `${door?.displayName ?? "Door"}, destination unavailable`;
    } else if (binding.kind === "companion") {
      labels[binding.containerInstanceId] = `Open ${room.companion?.displayName ?? "Companion"}`;
    } else {
      labels[binding.containerInstanceId] = "Return to Cosmos";
    }
  }
  return labels;
}

function compareTarget(
  expected: Readonly<RoomShadowInteractionTarget>,
  actual: Readonly<RoomShadowInteractionTarget>,
  differences: RoomInteractionParityDifference[],
): void {
  const identity = expected.containerInstanceId;
  if (
    expected.functionRole !== actual.functionRole ||
    expected.descriptorRole !== actual.descriptorRole
  ) {
    differences.push({
      category: "function-role",
      expectedId: identity,
      actualId: actual.containerInstanceId,
      message: `Function role differs for "${identity}"`,
    });
  }
  if (
    expected.bindingKind !== actual.bindingKind ||
    expected.bindingId !== actual.bindingId ||
    expected.bindingTargetId !== actual.bindingTargetId
  ) {
    differences.push({
      category: "runtime-binding",
      expectedId: identity,
      actualId: actual.bindingId,
      message: `Runtime binding differs for "${identity}"`,
    });
  }
  if (!sameValue(expected.interactionBounds, actual.interactionBounds)) {
    differences.push({
      category: "interaction-bounds",
      expectedId: identity,
      actualId: actual.containerInstanceId,
      message: `Interaction Bounds differ for "${identity}"`,
    });
  }
  if (!sameValue(expected.position, actual.position)) {
    differences.push({
      category: "position",
      expectedId: identity,
      actualId: actual.containerInstanceId,
      message: `Position differs for "${identity}"`,
    });
  }
  if (expected.available !== actual.available) {
    differences.push({
      category: "availability",
      expectedId: identity,
      actualId: actual.containerInstanceId,
      message: `Availability differs for "${identity}"`,
    });
  }
  if (
    expected.focusable !== actual.focusable ||
    expected.focusOrder !== actual.focusOrder
  ) {
    differences.push({
      category: "focus-order",
      expectedId: identity,
      actualId: actual.containerInstanceId,
      message: `Focus contract differs for "${identity}"`,
    });
  }
  if (expected.semanticLabel !== actual.semanticLabel) {
    differences.push({
      category: "semantic-label",
      expectedId: identity,
      actualId: actual.containerInstanceId,
      message: `Semantic label differs for "${identity}"`,
    });
  }
}

function reportDuplicates(
  targets: readonly Readonly<RoomShadowInteractionTarget>[],
  field: "containerInstanceId" | "bindingId",
  differences: RoomInteractionParityDifference[],
): void {
  const seen = new Set<string>();
  const reported = new Set<string>();
  for (const target of targets) {
    const value = target[field];
    if (!seen.has(value)) {
      seen.add(value);
      continue;
    }
    if (reported.has(value)) continue;
    reported.add(value);
    differences.push({
      category: "focus-order",
      actualId: value,
      message: `Duplicate focus target "${value}"`,
    });
  }
}

function bindingIdentity(binding: Readonly<BaseRuntimeShadowBinding>): string {
  if (binding.kind === "workspace") return binding.workspaceSlotId;
  if (binding.kind === "room-transition") return binding.doorId;
  if (binding.kind === "companion") return binding.companionId;
  return binding.baseId;
}

function bindingTarget(binding: Readonly<BaseRuntimeShadowBinding>): string | null {
  if (binding.kind === "workspace") return binding.workspaceId;
  if (binding.kind === "room-transition") return binding.targetRoomId;
  if (binding.kind === "companion") return binding.companionId;
  return binding.baseId;
}

function bindingAvailable(binding: Readonly<BaseRuntimeShadowBinding>): boolean {
  return binding.kind !== "workspace" || binding.workspaceId !== null;
}

function defaultSemanticLabel(role: FunctionType): string {
  if (role === "knowledge-workspace") return "Knowledge Workspace";
  if (role === "creation-workspace") return "Creation Workspace";
  if (role === "room-transition") return "Open connected room";
  if (role === "companion-interaction") return "Open Companion";
  if (role === "base-exit") return "Return to Cosmos";
  return "Open Tool";
}

function focusRoleOrder(role: FunctionType): number {
  if (role === "room-transition") return 0;
  if (role === "knowledge-workspace") return 1;
  if (role === "creation-workspace") return 2;
  if (role === "companion-interaction") return 3;
  if (role === "tool-entry") return 4;
  return 5;
}

function transformBounds(shape: BoundsShape, position: Point, scale: Point): BoundsShape {
  if (shape.type === "rect") {
    return {
      ...shape,
      x: position.x + shape.x * scale.x,
      y: position.y + shape.y * scale.y,
      width: shape.width * scale.x,
      height: shape.height * scale.y,
      ...(shape.radius !== undefined
        ? { radius: shape.radius * Math.min(scale.x, scale.y) }
        : {}),
    };
  }
  if (shape.type === "ellipse") {
    return {
      ...shape,
      cx: position.x + shape.cx * scale.x,
      cy: position.y + shape.cy * scale.y,
      rx: shape.rx * scale.x,
      ry: shape.ry * scale.y,
    };
  }
  return {
    ...shape,
    points: shape.points.map((point) => ({
      x: position.x + point.x * scale.x,
      y: position.y + point.y * scale.y,
    })),
  };
}

function cloneShape(shape: BoundsShape): BoundsShape {
  return deepClone(shape);
}

function boundsOrigin(shape: BoundsShape): Point {
  if (shape.type === "rect") return { x: shape.x, y: shape.y };
  if (shape.type === "ellipse") return { x: shape.cx - shape.rx, y: shape.cy - shape.ry };
  return {
    x: Math.min(...shape.points.map((point) => point.x)),
    y: Math.min(...shape.points.map((point) => point.y)),
  };
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function compareDifference(
  left: RoomInteractionParityDifference,
  right: RoomInteractionParityDifference,
): number {
  return (
    compareText(left.category, right.category) ||
    compareText(left.expectedId ?? "", right.expectedId ?? "") ||
    compareText(left.actualId ?? "", right.actualId ?? "") ||
    compareText(left.message, right.message)
  );
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
