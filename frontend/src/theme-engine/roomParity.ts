import type {
  BaseRoomCompatibilityProjection,
  CompatibilityBoundsRecord,
} from "./baseRoomCompatibilityAdapter";
import type { BoundsShape, Point } from "./types";
import type {
  ImmutableRoomSnapshot,
  ResolvedRoomFunctionContainer,
  ResolvedRoomObjectInstance,
} from "./roomSnapshotResolver";

export type RoomParityStatus =
  | "equal"
  | "compatible-difference"
  | "blocking-difference";

export interface RoomParityDifference {
  severity: Exclude<RoomParityStatus, "equal">;
  category:
    | "functional-object"
    | "function-binding"
    | "bounds"
    | "position"
    | "layer"
    | "visible-role"
    | "workspace-assignment"
    | "room-transition"
    | "companion"
    | "base-exit"
    | "skin"
    | "decoration";
  legacyId?: string;
  snapshotId?: string;
  message: string;
}

export interface RoomParityResult {
  status: RoomParityStatus;
  differences: readonly RoomParityDifference[];
  comparedFunctionalObjects: number;
}

export function compareLegacyBaseToRoomSnapshot(
  legacy: Readonly<BaseRoomCompatibilityProjection>,
  snapshot: Readonly<ImmutableRoomSnapshot>,
): Readonly<RoomParityResult> {
  const differences: RoomParityDifference[] = [];
  const objects = new Map(
    snapshot.objectInstances.map((object) => [object.instanceId, object]),
  );
  const functions = new Map(
    snapshot.functionContainers.map((container) => [
      container.attachedObjectInstanceId,
      container,
    ]),
  );

  comparePassivePresentation(legacy, snapshot, differences);

  for (const record of legacy.parity.objects) {
    compareFunctionalRecord(
      record,
      objects.get(record.objectInstanceId),
      functions.get(record.objectInstanceId),
      differences,
    );
  }

  const legacyIds = new Set(
    legacy.parity.objects.map((record) => record.objectInstanceId),
  );
  for (const object of snapshot.objectInstances) {
    if (legacyIds.has(object.instanceId)) continue;
    const container = functions.get(object.instanceId);
    differences.push({
      severity: container ? "blocking-difference" : "compatible-difference",
      category: container ? "functional-object" : "decoration",
      snapshotId: object.instanceId,
      message: container
        ? `Snapshot adds functional Object "${object.instanceId}"`
        : `Snapshot adds pointer-passive/non-functional Object "${object.instanceId}"`,
    });
  }

  differences.sort(
    (left, right) =>
      severityOrder(left.severity) - severityOrder(right.severity) ||
      compareText(left.category, right.category) ||
      compareText(left.legacyId ?? "", right.legacyId ?? "") ||
      compareText(left.snapshotId ?? "", right.snapshotId ?? "") ||
      compareText(left.message, right.message),
  );
  const status: RoomParityStatus = differences.some(
    (difference) => difference.severity === "blocking-difference",
  )
    ? "blocking-difference"
    : differences.length > 0
      ? "compatible-difference"
      : "equal";
  return Object.freeze({
    status,
    differences: Object.freeze(differences.map((entry) => Object.freeze(entry))),
    comparedFunctionalObjects: legacy.parity.objects.length,
  });
}

function comparePassivePresentation(
  legacy: Readonly<BaseRoomCompatibilityProjection>,
  snapshot: Readonly<ImmutableRoomSnapshot>,
  differences: RoomParityDifference[],
): void {
  const legacyPassive = legacy.parity.surfaces.filter(isPassivePresentationRecord);
  const expectedIds = new Set(legacyPassive.map((surface) => surface.legacySurfaceId));
  const snapshotById = new Map(
    snapshot.surfaces.map((surface) => [surface.surfaceId, surface]),
  );

  for (const expected of legacyPassive) {
    const actual = snapshotById.get(expected.legacySurfaceId);
    if (!actual) {
      differences.push({
        severity: "compatible-difference",
        category: "decoration",
        legacyId: expected.legacySurfaceId,
        message: `Passive presentation Surface "${expected.legacySurfaceId}" is missing`,
      });
      continue;
    }
    if (
      actual.pointerPolicy !== "passive" ||
      actual.layerBandId !== expected.layer ||
      !sameValue(actual.geometry, expected.geometry)
    ) {
      differences.push({
        severity: "compatible-difference",
        category: "decoration",
        legacyId: expected.legacySurfaceId,
        snapshotId: actual.surfaceId,
        message: `Passive presentation Surface "${expected.legacySurfaceId}" differs without changing function`,
      });
    }
  }

  for (const actual of snapshot.surfaces) {
    if (!isPassivePresentationLayer(actual.layerBandId) || expectedIds.has(actual.surfaceId)) {
      continue;
    }
    differences.push({
      severity: "compatible-difference",
      category: "decoration",
      snapshotId: actual.surfaceId,
      message: `Snapshot adds passive presentation Surface "${actual.surfaceId}"`,
    });
  }
}

function isPassivePresentationRecord(
  surface: BaseRoomCompatibilityProjection["parity"]["surfaces"][number],
): boolean {
  return isPassivePresentationLayer(surface.layer);
}

function isPassivePresentationLayer(layer: string): boolean {
  return layer === "foreground" || layer.startsWith("ambient");
}

function compareFunctionalRecord(
  legacy: CompatibilityBoundsRecord,
  object: ResolvedRoomObjectInstance | undefined,
  container: ResolvedRoomFunctionContainer | undefined,
  differences: RoomParityDifference[],
): void {
  const category = roleCategory(legacy);
  if (!object) {
    differences.push({
      severity: "blocking-difference",
      category,
      legacyId: legacy.legacyNodeId,
      message: `Legacy functional Object "${legacy.legacyNodeId}" is missing`,
    });
    return;
  }
  if (!container) {
    differences.push({
      severity: "blocking-difference",
      category: "function-binding",
      legacyId: legacy.legacyNodeId,
      snapshotId: object.instanceId,
      message: `Object "${object.instanceId}" has no resolved Function Container`,
    });
    return;
  }

  const resolvedBounds = resolveBounds(object, container);
  for (const [name, legacyBounds, snapshotBounds] of [
    ["Visual", legacy.visualBounds, resolvedBounds.visual],
    ["Interaction", legacy.interactionBounds, resolvedBounds.interaction],
    ["Layout", legacy.layoutBounds, resolvedBounds.layout],
    ["Effect", legacy.effectBounds, resolvedBounds.effect],
    ["Label", legacy.labelBounds, resolvedBounds.label],
  ] as const) {
    if (!sameValue(legacyBounds, snapshotBounds)) {
      differences.push({
        severity: "blocking-difference",
        category: "bounds",
        legacyId: legacy.legacyNodeId,
        snapshotId: object.instanceId,
        message: `${name} Bounds differ for "${object.instanceId}"`,
      });
    }
  }
  const legacyPosition = boundsOrigin(legacy.visualBounds);
  if (!sameValue(legacyPosition, object.position)) {
    differences.push({
      severity: "blocking-difference",
      category: "position",
      legacyId: legacy.legacyNodeId,
      snapshotId: object.instanceId,
      message: `Position differs: legacy ${formatPoint(legacyPosition)}, snapshot ${formatPoint(object.position)}`,
    });
  }
  if (legacy.layer !== object.layer || legacy.depth !== object.depth) {
    differences.push({
      severity: "blocking-difference",
      category: "layer",
      legacyId: legacy.legacyNodeId,
      snapshotId: object.instanceId,
      message: `Layer/depth differs: legacy ${legacy.layer}/${legacy.depth}, snapshot ${object.layer}/${object.depth}`,
    });
  }
  if (
    legacy.descriptorRole !== container.descriptorRole ||
    legacy.descriptorRole !== container.actionRole
  ) {
    differences.push({
      severity: "blocking-difference",
      category: "function-binding",
      legacyId: legacy.legacyNodeId,
      snapshotId: object.instanceId,
      message: `Function Binding differs: legacy "${legacy.descriptorRole}", snapshot "${container.descriptorRole}/${container.actionRole}"`,
    });
  }
  if (!familyMatchesLegacyRole(object, legacy)) {
    differences.push({
      severity: "blocking-difference",
      category: "visible-role",
      legacyId: legacy.legacyNodeId,
      snapshotId: object.instanceId,
      message: `Catalog family "${object.catalogObject.family}" does not preserve the legacy visible role`,
    });
  }
  if (object.resolvedSkin.id !== "core.skin.base.default") {
    differences.push({
      severity: "compatible-difference",
      category: "skin",
      legacyId: legacy.legacyNodeId,
      snapshotId: object.instanceId,
      message: `Skin changed to "${object.resolvedSkin.id}@${object.resolvedSkin.version}" without changing function`,
    });
  }
}

function resolveBounds(
  object: ResolvedRoomObjectInstance,
  container: ResolvedRoomFunctionContainer,
): {
  visual: BoundsShape;
  interaction: BoundsShape;
  layout: BoundsShape;
  effect: BoundsShape;
  label?: BoundsShape;
} {
  return {
    visual: transformBounds(
      object.catalogObject.defaultBounds.visual,
      object.position,
      object.scale,
    ),
    interaction: transformBounds(
      container.definition.interactionBounds,
      object.position,
      object.scale,
    ),
    layout: transformBounds(
      object.catalogObject.defaultBounds.layout,
      object.position,
      object.scale,
    ),
    effect: transformBounds(
      object.catalogObject.defaultBounds.effect,
      object.position,
      object.scale,
    ),
    ...(object.catalogObject.defaultBounds.label
      ? {
          label: transformBounds(
            object.catalogObject.defaultBounds.label,
            object.position,
            object.scale,
          ),
        }
      : {}),
  };
}

function transformBounds(
  shape: BoundsShape,
  position: Point,
  scale: Point,
): BoundsShape {
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

function roleCategory(
  record: CompatibilityBoundsRecord,
): RoomParityDifference["category"] {
  if (record.descriptorRole === "workspace.open") return "workspace-assignment";
  if (record.descriptorRole === "companion.open") return "companion";
  if (record.descriptorRole === "base.close") return "base-exit";
  if (
    record.descriptorRole === "base.open" ||
    record.descriptorRole === "room.transition"
  ) {
    return "room-transition";
  }
  return "functional-object";
}

function familyMatchesLegacyRole(
  object: ResolvedRoomObjectInstance,
  legacy: CompatibilityBoundsRecord,
): boolean {
  if (legacy.descriptorRole === "workspace.open") {
    return object.catalogObject.family === "workspace-furniture";
  }
  if (legacy.descriptorRole === "companion.open") {
    return object.catalogObject.family === "companion-visual";
  }
  if (legacy.descriptorRole === "base.close") {
    return object.catalogObject.family === "architecture-object";
  }
  return object.catalogObject.family === "door";
}

function boundsOrigin(shape: BoundsShape): Point {
  if (shape.type === "rect") return { x: shape.x, y: shape.y };
  if (shape.type === "ellipse") {
    return { x: shape.cx - shape.rx, y: shape.cy - shape.ry };
  }
  return {
    x: Math.min(...shape.points.map((point) => point.x)),
    y: Math.min(...shape.points.map((point) => point.y)),
  };
}

function formatPoint(point: Point): string {
  return `${point.x},${point.y}`;
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function severityOrder(
  severity: RoomParityDifference["severity"],
): number {
  return severity === "blocking-difference" ? 0 : 1;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
