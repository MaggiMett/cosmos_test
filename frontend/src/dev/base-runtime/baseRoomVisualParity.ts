import type { BaseSnapshot } from "../../runtime/baseRuntime";
import { cloneAndFreeze } from "../../theme-engine/immutable";
import type { RoomParityStatus } from "../../theme-engine/roomParity";
import type { ImmutableRoomSnapshot } from "../../theme-engine/roomSnapshotResolver";
import type { BoundsShape } from "../../theme-engine/types";
import { runBaseRoomShadowMode } from "../../theme-engine/roomShadowMode";
import {
  projectRoomCompositionForShadowRender,
  type RoomCompositionShadowRenderModel,
  type RoomShadowObjectItem,
  type RoomShadowSurfaceRole,
} from "../room-composition-preview/roomCompositionRenderProjection";
import {
  createRoomCompositionInteractionDiagnostics,
  type RoomCompositionInteractionProjection,
  type RoomShadowInteractionTarget,
} from "../room-composition-preview/roomCompositionInteractionProjection";
import {
  projectBaseRuntimeState,
  type BaseRoomPresentation,
} from "./baseRuntimeProjection";

export type BaseRoomVisualParityCategory =
  | "room-bounds"
  | "architecture"
  | "position"
  | "relative-size"
  | "layer-depth"
  | "function-visibility"
  | "availability"
  | "clipping"
  | "core-fallback"
  | "neutral-palette"
  | "decoration";

export interface BaseRoomVisualParityDifference {
  severity: Exclude<RoomParityStatus, "equal">;
  category: BaseRoomVisualParityCategory;
  message: string;
  expectedId?: string;
  actualId?: string;
}

export interface BaseRoomVisualObservation {
  category: "neutral-palette" | "decoration";
  message: string;
}

export interface BaseRoomVisualParityResult {
  roomId: string;
  roomType: BaseRoomPresentation["slug"];
  status: RoomParityStatus;
  differences: readonly Readonly<BaseRoomVisualParityDifference>[];
  roomBounds: Readonly<{ width: number; height: number }>;
  architectureRoles: readonly RoomShadowSurfaceRole[];
  expectedFunctionCount: number;
  visibleFunctionCount: number;
  coreFallbackComplete: boolean;
  overflowFree: boolean;
}

export interface BaseRoomVisualAcceptanceResult {
  roomId: string;
  roomType: BaseRoomPresentation["slug"];
  roomParity: RoomParityStatus;
  interactionParity: RoomParityStatus;
  visualParity: Readonly<BaseRoomVisualParityResult>;
}

export interface BaseRoomCompositionReadiness {
  decision: "READY" | "NOT READY";
  rooms: readonly Readonly<BaseRoomVisualAcceptanceResult>[];
  coverage: Readonly<{
    actualRoomTypes: readonly BaseRoomPresentation["slug"][];
    testedRoomTypes: readonly BaseRoomPresentation["slug"][];
    complete: boolean;
  }>;
  blockers: readonly string[];
}

export interface CompareBaseRoomVisualParityInput {
  room: Readonly<BaseRoomPresentation>;
  snapshot: Readonly<ImmutableRoomSnapshot>;
  interactions: Readonly<RoomCompositionInteractionProjection>;
  renderModel?: Readonly<RoomCompositionShadowRenderModel>;
  observations?: readonly Readonly<BaseRoomVisualObservation>[];
}

const REQUIRED_SURFACE_ROLES: readonly RoomShadowSurfaceRole[] = [
  "background",
  "architecture",
  "floor",
  "ceiling",
  "ambient",
  "foreground",
];

const CURRENT_PRODUCTIVE_ROOM_TYPES: readonly BaseRoomPresentation["slug"][] = [
  "main",
  "workshop",
];

/**
 * Read-only rollout diagnostic. It evaluates structural visibility and never
 * treats palette, texture or optional decoration as functional authority.
 */
export function compareBaseRoomVisualParity(
  input: Readonly<CompareBaseRoomVisualParityInput>,
): Readonly<BaseRoomVisualParityResult> {
  const renderModel = input.renderModel
    ?? projectRoomCompositionForShadowRender(input.snapshot);
  const differences: BaseRoomVisualParityDifference[] = [];
  const roomBounds = {
    width: input.snapshot.shell.referenceViewport.width,
    height: input.snapshot.shell.referenceViewport.height,
  };

  if (
    renderModel.width !== roomBounds.width
    || renderModel.height !== roomBounds.height
    || renderModel.width <= 0
    || renderModel.height <= 0
  ) {
    blocking(differences, "room-bounds", "Rendered Room Bounds differ from the resolved Room Shell.");
  }

  const surfaceItems = renderModel.items.filter((item) => item.kind === "surface");
  const architectureRoles = [...new Set(surfaceItems.map((item) => item.role))]
    .sort(compareText);
  for (const role of REQUIRED_SURFACE_ROLES) {
    if (!architectureRoles.includes(role)) {
      blocking(differences, "architecture", `Visible architecture role "${role}" is missing.`, role);
    }
  }
  if (surfaceItems.filter((item) => item.role === "architecture").length < 3) {
    blocking(differences, "architecture", "The resolved Room does not expose all wall architecture surfaces.");
  }

  const layerIds = new Set(input.snapshot.layers.map((layer) => layer.bandId));
  for (const item of renderModel.items) {
    if (!layerIds.has(item.layer) || !Number.isFinite(item.depth)) {
      blocking(
        differences,
        "layer-depth",
        `Visible item "${item.id}" has no valid resolved Layer/Depth.`,
        item.id,
      );
    }
    if (item.kind === "surface" && !shapeWithinRoom(item.shape, roomBounds)) {
      blocking(differences, "clipping", `Visible item "${item.id}" exceeds the resolved Room Bounds.`, item.id);
    }
  }

  const objects = new Map(
    renderModel.items
      .filter((item): item is RoomShadowObjectItem => item.kind === "object")
      .map((item) => [item.id, item]),
  );
  const expectedTargets = expectedFunctionIds(input.room);
  const targets = new Map(
    input.interactions.targets.map((target) => [target.objectInstanceId, target]),
  );
  let visibleFunctionCount = 0;
  let coreFallbackComplete = true;
  let overflowFree = !differences.some((difference) => difference.category === "clipping");

  for (const expected of expectedTargets) {
    const target = targets.get(expected.id);
    const object = objects.get(expected.id);
    if (!target || !object || !object.functionContainer) {
      blocking(
        differences,
        "function-visibility",
        `Presenter function "${expected.id}" has no visible Composition Function Container.`,
        expected.id,
        target?.objectInstanceId,
      );
      coreFallbackComplete = false;
      continue;
    }
    visibleFunctionCount += 1;
    if (!object.fallback) {
      blocking(
        differences,
        "core-fallback",
        `Function "${expected.id}" has no resolved Core fallback presentation.`,
        expected.id,
        object.id,
      );
      coreFallbackComplete = false;
    }
    compareFunctionGeometry(expected, target, roomBounds, differences);
    if (!shapeWithinRoom(target.visualBounds, roomBounds)) {
      overflowFree = false;
      blocking(
        differences,
        "clipping",
        `Function "${expected.id}" is visibly clipped by the Room Bounds.`,
        expected.id,
        target.objectInstanceId,
      );
    }
  }

  compareRelativeSizes(input.interactions.targets, differences);
  for (const observation of input.observations ?? []) {
    differences.push({
      severity: visualParitySeverity(observation.category),
      category: observation.category,
      message: observation.message,
    });
  }

  differences.sort(compareDifference);
  const status: RoomParityStatus = differences.some(
    (difference) => difference.severity === "blocking-difference",
  )
    ? "blocking-difference"
    : differences.length > 0
      ? "compatible-difference"
      : "equal";
  return cloneAndFreeze({
    roomId: input.room.objectId,
    roomType: input.room.slug,
    status,
    differences,
    roomBounds,
    architectureRoles,
    expectedFunctionCount: expectedTargets.length,
    visibleFunctionCount,
    coreFallbackComplete,
    overflowFree,
  });
}

export function evaluateBaseRoomVisualAcceptance(
  baseSnapshot: Readonly<BaseSnapshot>,
  roomId: string,
  observations: readonly Readonly<BaseRoomVisualObservation>[] = [],
): Readonly<BaseRoomVisualAcceptanceResult> {
  const presenter = projectBaseRuntimeState("ready", baseSnapshot, null, roomId);
  if (presenter.phase !== "success") {
    throw new Error(`Base Room "${roomId}" is unavailable for visual acceptance.`);
  }
  const shadow = runBaseRoomShadowMode({ baseSnapshot, roomId });
  const interactions = createRoomCompositionInteractionDiagnostics(
    baseSnapshot,
    shadow.snapshot,
    shadow.runtimeBindings ?? [],
    roomId,
  );
  return cloneAndFreeze({
    roomId,
    roomType: presenter.room.slug,
    roomParity: shadow.parity.status,
    interactionParity: interactions.parity.status,
    visualParity: compareBaseRoomVisualParity({
      room: presenter.room,
      snapshot: shadow.snapshot,
      interactions: interactions.actual,
      observations,
    }),
  });
}

export function evaluateBaseRoomCompositionReadiness(
  baseSnapshot: Readonly<BaseSnapshot>,
): Readonly<BaseRoomCompositionReadiness> {
  const actualRoomTypes = uniqueSorted(baseSnapshot.rooms.map((room) => room.slug));
  const rooms = baseSnapshot.rooms.map((room) =>
    evaluateBaseRoomVisualAcceptance(baseSnapshot, room.objectId),
  );
  const testedRoomTypes = uniqueSorted(rooms.map((room) => room.roomType));
  const coverageComplete = CURRENT_PRODUCTIVE_ROOM_TYPES.every(
    (roomType) => actualRoomTypes.includes(roomType) && testedRoomTypes.includes(roomType),
  ) && actualRoomTypes.every((roomType) => testedRoomTypes.includes(roomType));
  const blockers = rooms.flatMap((room) => {
    const values: string[] = [];
    if (room.roomParity === "blocking-difference") values.push(`${room.roomType}: Room parity blocks rollout.`);
    if (room.interactionParity === "blocking-difference") values.push(`${room.roomType}: Interaction parity blocks rollout.`);
    if (room.visualParity.status === "blocking-difference") values.push(`${room.roomType}: Visual parity blocks rollout.`);
    if (!room.visualParity.coreFallbackComplete) values.push(`${room.roomType}: Core fallback is incomplete.`);
    return values;
  });
  if (!coverageComplete) blockers.push("Current productive Room coverage is incomplete.");

  return cloneAndFreeze({
    decision: blockers.length === 0 ? "READY" as const : "NOT READY" as const,
    rooms,
    coverage: {
      actualRoomTypes,
      testedRoomTypes,
      complete: coverageComplete,
    },
    blockers: blockers.sort(compareText),
  });
}

export function visualParitySeverity(
  category: BaseRoomVisualParityCategory,
): Exclude<RoomParityStatus, "equal"> {
  return category === "neutral-palette" || category === "decoration"
    ? "compatible-difference"
    : "blocking-difference";
}

interface ExpectedFunctionVisual {
  id: string;
  kind: "workspace" | "door" | "companion" | "base-exit";
  horizontal: "left" | "center" | "right";
  vertical: "top" | "rear" | "front" | "any";
  available: boolean;
}

function expectedFunctionIds(room: Readonly<BaseRoomPresentation>): ExpectedFunctionVisual[] {
  return [
    ...room.doorTargets.map((door) => ({
      id: door.objectId,
      kind: "door" as const,
      horizontal: door.side,
      vertical: "any" as const,
      available: door.targetRoomId !== null,
    })),
    ...room.workspaceSlots.map((slot) => ({
      id: slot.slotObjectId,
      kind: "workspace" as const,
      horizontal: slot.side,
      vertical: slot.placement.toLocaleLowerCase().includes("front")
        ? "front" as const
        : "rear" as const,
      available: slot.occupied,
    })),
    ...(room.companion
      ? [{
          id: room.companion.objectId,
          kind: "companion" as const,
          horizontal: "center" as const,
          vertical: "front" as const,
          available: true,
        }]
      : []),
    {
      id: room.baseObjectId,
      kind: "base-exit",
      horizontal: "left",
      vertical: "top",
      available: true,
    },
  ];
}

function compareFunctionGeometry(
  expected: Readonly<ExpectedFunctionVisual>,
  actual: Readonly<RoomShadowInteractionTarget>,
  roomBounds: Readonly<{ width: number; height: number }>,
  differences: BaseRoomVisualParityDifference[],
): void {
  const box = shapeBox(actual.visualBounds);
  if (box.width < 44 || box.height < 44 || box.width > roomBounds.width * 0.65 || box.height > roomBounds.height * 0.85) {
    blocking(differences, "relative-size", `Function "${expected.id}" has a strongly incompatible visible size.`, expected.id, actual.objectInstanceId);
  }
  const center = {
    x: (box.x + box.width / 2) / roomBounds.width,
    y: (box.y + box.height / 2) / roomBounds.height,
  };
  const horizontalMatches = expected.horizontal === "left"
    ? center.x < 0.5
    : expected.horizontal === "right"
      ? center.x > 0.5
      : center.x >= 0.32 && center.x <= 0.68;
  const verticalMatches = expected.vertical === "top"
    ? center.y < 0.3
    : expected.vertical === "rear"
      ? center.y < 0.68
      : expected.vertical === "front"
        ? center.y > 0.55
        : true;
  if (!horizontalMatches || !verticalMatches) {
    blocking(differences, "position", `Function "${expected.id}" is outside its presenter-relative visual region.`, expected.id, actual.objectInstanceId);
  }
  if (expected.available !== actual.available) {
    blocking(differences, "availability", `Function availability differs for "${expected.id}".`, expected.id, actual.objectInstanceId);
  }
}

function compareRelativeSizes(
  targets: readonly Readonly<RoomShadowInteractionTarget>[],
  differences: BaseRoomVisualParityDifference[],
): void {
  const workspaces = targets.filter((target) => target.bindingKind === "workspace");
  const workspaceHeight = workspaces.length > 0
    ? workspaces.reduce((total, target) => total + shapeBox(target.visualBounds).height, 0) / workspaces.length
    : 0;
  const door = targets.find((target) => target.bindingKind === "room-transition");
  if (door && workspaceHeight > 0 && shapeBox(door.visualBounds).height < workspaceHeight) {
    blocking(differences, "relative-size", "The Room transition is not visually taller than its Workspace functions.", door.bindingId);
  }
  const companion = targets.find((target) => target.bindingKind === "companion");
  if (companion && workspaces.length > 0) {
    const companionBox = shapeBox(companion.visualBounds);
    const workspaceBox = shapeBox(workspaces[0]!.visualBounds);
    if (companionBox.width * companionBox.height >= workspaceBox.width * workspaceBox.height) {
      blocking(differences, "relative-size", "The Companion visual overwhelms the Workspace hierarchy.", companion.bindingId);
    }
  }
}

function shapeWithinRoom(
  shape: BoundsShape,
  room: Readonly<{ width: number; height: number }>,
): boolean {
  const box = shapeBox(shape);
  return box.x >= 0 && box.y >= 0 && box.x + box.width <= room.width && box.y + box.height <= room.height;
}

function shapeBox(shape: BoundsShape): { x: number; y: number; width: number; height: number } {
  if (shape.type === "rect") return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
  if (shape.type === "ellipse") return { x: shape.cx - shape.rx, y: shape.cy - shape.ry, width: shape.rx * 2, height: shape.ry * 2 };
  const xs = shape.points.map((point) => point.x);
  const ys = shape.points.map((point) => point.y);
  return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
}

function blocking(
  differences: BaseRoomVisualParityDifference[],
  category: BaseRoomVisualParityCategory,
  message: string,
  expectedId?: string,
  actualId?: string,
): void {
  differences.push({
    severity: "blocking-difference",
    category,
    message,
    ...(expectedId ? { expectedId } : {}),
    ...(actualId ? { actualId } : {}),
  });
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort(compareText);
}

function compareDifference(
  left: BaseRoomVisualParityDifference,
  right: BaseRoomVisualParityDifference,
): number {
  return compareText(left.severity, right.severity)
    || compareText(left.category, right.category)
    || compareText(left.expectedId ?? "", right.expectedId ?? "")
    || compareText(left.actualId ?? "", right.actualId ?? "")
    || compareText(left.message, right.message);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
