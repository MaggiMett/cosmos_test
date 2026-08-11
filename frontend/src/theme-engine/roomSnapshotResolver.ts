import { cloneAndFreeze } from "./immutable";
import type { RoomCompositionRegistries } from "./roomRegistries";
import type {
  CatalogObject,
  FunctionContainer,
  FunctionContainerInstance,
  ObjectInstance,
  PropertyOverrideMode,
  PropertyOverrideState,
  RoomComposition,
  RoomConnection,
  RoomPreset,
  RoomShell,
  SurfaceDefinition,
  SurfaceBinding,
} from "./roomCompositionTypes";
import type {
  LayerBand,
  NamespacedId,
  Point,
  VersionedRef,
} from "./types";
import { compareVersions, satisfiesVersionRange } from "./version";
import { validateRoomComposition } from "./validation";

export type RoomResolutionSource =
  | "user-composition"
  | "room-preset"
  | "room"
  | "active-theme"
  | "core-default";

export type RoomResolutionScope =
  | "instance"
  | "room"
  | "active-theme"
  | "core-default";

export interface AvailableRoomSkin {
  skinId: NamespacedId;
  version: string;
}

export interface RoomSkinAssignment {
  assignmentId: NamespacedId;
  targetCatalogObjectId: NamespacedId;
  skinRef: VersionedRef;
  source: "room" | "active-theme" | "core-default";
}

export interface RoomSkinResolutionInput {
  activeThemeId?: NamespacedId;
  availableSkins: readonly AvailableRoomSkin[];
  assignments: readonly RoomSkinAssignment[];
}

export interface ResolvedSkinReference {
  id: NamespacedId;
  version: string;
}

export interface RoomPropertyResolution<T> {
  property: RoomResolvedProperty;
  value: T;
  source: RoomResolutionSource;
  inheritedScope: RoomResolutionScope;
  overrideStatus: PropertyOverrideMode;
  fallback: boolean;
  warnings: readonly string[];
  conflicts: readonly string[];
}

export type RoomResolvedProperty =
  | "position"
  | "rotation"
  | "scale"
  | "skin"
  | "animation"
  | "material"
  | "layer"
  | "depth";

export interface ResolvedRoomObjectInstance {
  instanceId: NamespacedId;
  catalogObject: Readonly<CatalogObject>;
  position: Point;
  rotation: number;
  scale: Point;
  layer: string;
  depth: number;
  placementBinding: Readonly<SurfaceBinding>;
  resolvedSkin: ResolvedSkinReference;
  animationRef?: VersionedRef;
  materialRef?: VersionedRef;
  functionContainerInstanceId?: NamespacedId;
  propertyResolution: {
    position: RoomPropertyResolution<Point>;
    rotation: RoomPropertyResolution<number>;
    scale: RoomPropertyResolution<Point>;
    skin: RoomPropertyResolution<ResolvedSkinReference>;
    animation: RoomPropertyResolution<VersionedRef | null>;
    material: RoomPropertyResolution<VersionedRef | null>;
    layer: RoomPropertyResolution<string>;
    depth: RoomPropertyResolution<number>;
  };
}

export interface ResolvedRoomFunctionContainer {
  instance: Readonly<FunctionContainerInstance>;
  definition: Readonly<FunctionContainer>;
  attachedObjectInstanceId: NamespacedId;
  descriptorRole: NamespacedId;
  actionRole: NamespacedId;
}

export interface RoomResolutionTraceEntry {
  objectInstanceId: NamespacedId;
  property: RoomResolvedProperty;
  value: unknown;
  source: RoomResolutionSource;
  inheritedScope: RoomResolutionScope;
  overrideStatus: PropertyOverrideMode;
  fallback: boolean;
  warnings: readonly string[];
  conflicts: readonly string[];
}

export interface RoomResolutionTrace {
  resolverVersion: "1.0.0";
  shell: {
    requested: VersionedRef;
    resolved: { id: NamespacedId; version: string };
  };
  preset?: {
    requested: VersionedRef;
    resolved: { id: NamespacedId; version: string };
  };
  properties: readonly RoomResolutionTraceEntry[];
  warnings: readonly string[];
  conflicts: readonly string[];
}

export interface RoomSnapshotValidationStatus {
  valid: boolean;
  warnings: readonly string[];
  conflicts: readonly string[];
}

export interface ImmutableRoomSnapshot {
  snapshotId: string;
  snapshotVersion: 1;
  roomId: NamespacedId;
  shell: Readonly<RoomShell>;
  surfaces: readonly Readonly<SurfaceDefinition>[];
  objectInstances: readonly Readonly<ResolvedRoomObjectInstance>[];
  functionContainers: readonly Readonly<ResolvedRoomFunctionContainer>[];
  roomConnections: readonly Readonly<RoomConnection>[];
  layers: readonly Readonly<LayerBand>[];
  validationStatus: RoomSnapshotValidationStatus;
  resolutionTrace: RoomResolutionTrace;
}

export interface ResolveRoomSnapshotInput {
  roomComposition: RoomComposition;
  presetRef?: VersionedRef;
  skins: RoomSkinResolutionInput;
}

export class RoomResolutionError extends Error {
  constructor(
    readonly code:
      | "room_resolution_duplicate"
      | "room_resolution_reference_missing"
      | "room_resolution_reference_incompatible"
      | "room_resolution_cycle",
    message: string,
  ) {
    super(message);
    this.name = "RoomResolutionError";
  }
}

export class RoomCompositionResolver {
  constructor(private readonly registries: RoomCompositionRegistries) {}

  resolve(input: ResolveRoomSnapshotInput): Readonly<ImmutableRoomSnapshot> {
    const room = validateRoomComposition(input.roomComposition);
    const shell = this.resolveRegistryReference(
      () => this.registries.shells.resolve(room.shellRef),
      `Room Shell "${room.shellRef.id}"`,
    );
    const presetRef = input.presetRef ?? presetReferenceOf(room);
    const preset = presetRef
      ? this.resolveRegistryReference(
          () => this.registries.presets.resolve(presetRef),
          `Room Preset "${presetRef.id}"`,
        )
      : undefined;
    if (
      preset &&
      (preset.shellRef.id !== shell.shellId ||
        !satisfiesVersionRange(shell.version, preset.shellRef.versionRange))
    ) {
      throw new RoomResolutionError(
        "room_resolution_reference_incompatible",
        `Room Preset "${preset.presetId}@${preset.version}" is incompatible with Shell "${shell.shellId}@${shell.version}"`,
      );
    }

    assertUnique(room.objectInstances, (value) => value.instanceId, "Object Instance");
    assertUnique(
      room.functionContainers,
      (value) => value.containerInstanceId,
      "Function Container Instance",
    );
    assertNoAttachmentCycles(room.objectInstances);

    const presetByItem = new Map(
      (preset?.objectInstances ?? [])
        .filter((instance) => instance.origin?.presetItemId)
        .map((instance) => [instance.origin!.presetItemId!, instance]),
    );
    const warnings: string[] = [];
    const conflicts: string[] = [];
    const resolvedObjects = room.objectInstances
      .map((instance) =>
        this.resolveObject(
          instance,
          presetByItem.get(instance.origin?.presetItemId ?? ""),
          shell,
          input.skins,
          warnings,
          conflicts,
        ),
      )
      .sort((left, right) =>
        compareObjects(left, right, shell.layerBands),
      );
    const objectById = new Map(
      resolvedObjects.map((object) => [object.instanceId, object]),
    );
    const resolvedFunctions = room.functionContainers
      .map((instance) =>
        this.resolveFunction(instance, objectById, conflicts),
      )
      .sort((left, right) =>
        compareText(
          left.instance.containerInstanceId,
          right.instance.containerInstanceId,
        ),
      );

    const properties = resolvedObjects
      .flatMap((object) =>
        Object.values(object.propertyResolution).map((resolution) => ({
          objectInstanceId: object.instanceId,
          ...resolution,
        })),
      )
      .sort(
        (left, right) =>
          compareText(left.objectInstanceId, right.objectInstanceId) ||
          compareText(left.property, right.property),
      );
    const trace: RoomResolutionTrace = {
      resolverVersion: "1.0.0",
      shell: {
        requested: { ...room.shellRef },
        resolved: { id: shell.shellId, version: shell.version },
      },
      ...(preset && presetRef
        ? {
            preset: {
              requested: { ...presetRef },
              resolved: { id: preset.presetId, version: preset.version },
            },
          }
        : {}),
      properties,
      warnings: sortedUnique(warnings),
      conflicts: sortedUnique(conflicts),
    };
    const validationStatus: RoomSnapshotValidationStatus = {
      valid: conflicts.length === 0,
      warnings: trace.warnings,
      conflicts: trace.conflicts,
    };

    return cloneAndFreeze({
      snapshotId: [
        "shadow",
        room.roomId,
        room.version,
        shell.shellId,
        shell.version,
        room.revision.revisionId,
      ].join(":"),
      snapshotVersion: 1 as const,
      roomId: room.roomId,
      shell,
      surfaces: [...shell.architectureSurfaces].sort((left, right) =>
        compareText(left.surfaceId, right.surfaceId),
      ),
      objectInstances: resolvedObjects,
      functionContainers: resolvedFunctions,
      roomConnections: [...(room.connections ?? [])].sort((left, right) =>
        compareText(left.connectionId, right.connectionId),
      ),
      layers: [...shell.layerBands].sort(
        (left, right) =>
          left.minimum - right.minimum || compareText(left.bandId, right.bandId),
      ),
      validationStatus,
      resolutionTrace: trace,
    });
  }

  private resolveObject(
    instance: ObjectInstance,
    preset: ObjectInstance | undefined,
    shell: Readonly<RoomShell>,
    skins: RoomSkinResolutionInput,
    warnings: string[],
    conflicts: string[],
  ): ResolvedRoomObjectInstance {
    const catalogObject = this.resolveRegistryReference(
      () => this.registries.catalogObjects.resolve(instance.catalogObjectRef),
      `Catalog Object "${instance.catalogObjectRef.id}"`,
    );
    const surface = shell.placementSurfaces.find(
      (candidate) => candidate.surfaceId === instance.surfaceBinding.surfaceId,
    );
    if (!surface) {
      throw new RoomResolutionError(
        "room_resolution_reference_missing",
        `Object "${instance.instanceId}" references unknown Surface "${instance.surfaceBinding.surfaceId}"`,
      );
    }
    if (
      !surface.placementAreaIds.includes(
        instance.surfaceBinding.placementAreaId,
      )
    ) {
      throw new RoomResolutionError(
        "room_resolution_reference_missing",
        `Object "${instance.instanceId}" references unknown Placement Area "${instance.surfaceBinding.placementAreaId}"`,
      );
    }
    if (!catalogObject.layerCompatibility.includes(instance.layer)) {
      conflicts.push(
        `Object "${instance.instanceId}" uses incompatible layer "${instance.layer}"`,
      );
    }

    const position = resolveChannel(
      "position",
      instance.propertyOverrides.position,
      instance.position,
      preset?.position,
    );
    const rotation = resolveChannel(
      "rotation",
      instance.propertyOverrides.rotation,
      instance.rotation,
      preset?.rotation,
    );
    const scale = resolveChannel(
      "scale",
      instance.propertyOverrides.scale,
      instance.scale,
      preset?.scale,
    );
    const animation = resolveChannel(
      "animation",
      instance.propertyOverrides.animation,
      instance.animationRef ?? null,
      preset?.animationRef ?? null,
    );
    const material = resolveChannel(
      "material",
      instance.propertyOverrides.material,
      instance.materialRef ?? null,
      preset?.materialRef ?? null,
    );
    const layer = resolveChannel(
      "layer",
      instance.propertyOverrides.layer,
      instance.layer,
      preset?.layer,
    );
    const depth = resolveChannel(
      "depth",
      instance.propertyOverrides.depth,
      instance.depth,
      preset?.depth,
    );
    const skin = resolveSkin(instance, catalogObject, skins);
    for (const resolution of [
      position,
      rotation,
      scale,
      skin,
      animation,
      material,
      layer,
      depth,
    ]) {
      warnings.push(...resolution.warnings);
      conflicts.push(...resolution.conflicts);
    }

    return {
      instanceId: instance.instanceId,
      catalogObject,
      position: position.value,
      rotation: rotation.value,
      scale: scale.value,
      layer: layer.value,
      depth: depth.value,
      placementBinding: { ...instance.surfaceBinding },
      resolvedSkin: skin.value,
      ...(animation.value ? { animationRef: animation.value } : {}),
      ...(material.value ? { materialRef: material.value } : {}),
      ...(instance.functionContainerInstanceId
        ? {
            functionContainerInstanceId:
              instance.functionContainerInstanceId,
          }
        : {}),
      propertyResolution: {
        position,
        rotation,
        scale,
        skin,
        animation,
        material,
        layer,
        depth,
      },
    };
  }

  private resolveFunction(
    instance: FunctionContainerInstance,
    objects: ReadonlyMap<string, ResolvedRoomObjectInstance>,
    conflicts: string[],
  ): ResolvedRoomFunctionContainer {
    const definition = this.resolveRegistryReference(
      () =>
        this.registries.functionContainers.resolve(instance.definitionRef),
      `Function Container "${instance.definitionRef.id}"`,
    );
    const object = objects.get(instance.attachedObjectInstanceId);
    if (!object) {
      throw new RoomResolutionError(
        "room_resolution_reference_missing",
        `Function Container Instance "${instance.containerInstanceId}" references missing Object "${instance.attachedObjectInstanceId}"`,
      );
    }
    if (!definition.allowedCatalogFamilies.includes(object.catalogObject.family)) {
      conflicts.push(
        `Function Container "${instance.containerInstanceId}" is incompatible with Catalog family "${object.catalogObject.family}"`,
      );
    }
    if (
      instance.expectedDescriptorRole !==
      definition.functionBinding.descriptorRole
    ) {
      conflicts.push(
        `Function Container "${instance.containerInstanceId}" expected descriptor "${instance.expectedDescriptorRole}" but definition requires "${definition.functionBinding.descriptorRole}"`,
      );
    }
    if (
      object.functionContainerInstanceId !== instance.containerInstanceId
    ) {
      conflicts.push(
        `Object "${object.instanceId}" and Function Container "${instance.containerInstanceId}" do not reference each other stably`,
      );
    }
    return {
      instance: { ...instance },
      definition,
      attachedObjectInstanceId: instance.attachedObjectInstanceId,
      descriptorRole: definition.functionBinding.descriptorRole,
      actionRole: definition.functionBinding.actionRole,
    };
  }

  private resolveRegistryReference<T>(
    operation: () => T,
    label: string,
  ): T {
    try {
      return operation();
    } catch (error) {
      const registryError = error as { code?: string; message?: string };
      if (registryError.code === "room_registry_missing") {
        throw new RoomResolutionError(
          "room_resolution_reference_missing",
          `${label} could not be resolved: ${registryError.message}`,
        );
      }
      if (registryError.code === "room_registry_version_incompatible") {
        throw new RoomResolutionError(
          "room_resolution_reference_incompatible",
          `${label} is version-incompatible: ${registryError.message}`,
        );
      }
      throw error;
    }
  }
}

function resolveChannel<T>(
  property: RoomResolvedProperty,
  state: PropertyOverrideState<T>,
  currentValue: T,
  presetValue: T | undefined,
): RoomPropertyResolution<T> {
  if (state.mode === "pinned") {
    const conflicts = sameValue(state.value, currentValue)
      ? []
      : [
          `Pinned ${property} value differs from the denormalized instance value`,
        ];
    return {
      property,
      value: state.value,
      source: "user-composition",
      inheritedScope: "instance",
      overrideStatus: "pinned",
      fallback: false,
      warnings: [],
      conflicts,
    };
  }
  if (presetValue !== undefined) {
    return {
      property,
      value: presetValue,
      source: "room-preset",
      inheritedScope: "room",
      overrideStatus: state.mode,
      fallback: false,
      warnings: [],
      conflicts: [],
    };
  }
  return {
    property,
    value: currentValue,
    source: "user-composition",
    inheritedScope: "room",
    overrideStatus: state.mode,
    fallback: false,
    warnings: [],
    conflicts: [],
  };
}

function resolveSkin(
  instance: ObjectInstance,
  catalogObject: Readonly<CatalogObject>,
  input: RoomSkinResolutionInput,
): RoomPropertyResolution<ResolvedSkinReference> {
  const state = instance.propertyOverrides.skin;
  if (state.mode === "pinned") {
    const pinned = resolveAvailableSkin(state.value, input.availableSkins);
    if (pinned) {
      return skinResolution(
        pinned,
        "user-composition",
        "instance",
        "pinned",
        false,
      );
    }
    return resolveCoreFallback(
      catalogObject,
      input,
      state.mode,
      `Pinned Skin "${state.value.id}@${state.value.versionRange}" is unavailable`,
    );
  }

  const assignments = input.assignments
    .filter(
      (assignment) =>
        assignment.targetCatalogObjectId === catalogObject.catalogObjectId &&
        assignment.source !== "core-default",
    )
    .sort(
      (left, right) =>
        skinSourcePriority(left.source) - skinSourcePriority(right.source) ||
        compareText(left.assignmentId, right.assignmentId),
    );
  for (const assignment of assignments) {
    const resolved = resolveAvailableSkin(
      assignment.skinRef,
      input.availableSkins,
    );
    if (resolved) {
      return skinResolution(
        resolved,
        assignment.source,
        assignment.source,
        state.mode,
        false,
      );
    }
  }

  return resolveCoreFallback(
    catalogObject,
    input,
    state.mode,
    assignments.length > 0
      ? "Selected Theme/Room Skin is unavailable"
      : undefined,
  );
}

function resolveCoreFallback(
  catalogObject: Readonly<CatalogObject>,
  input: RoomSkinResolutionInput,
  overrideStatus: PropertyOverrideMode,
  warning?: string,
): RoomPropertyResolution<ResolvedSkinReference> {
  const declaredCoreAssignment = input.assignments
    .filter(
      (assignment) =>
        assignment.targetCatalogObjectId === catalogObject.catalogObjectId &&
        assignment.source === "core-default",
    )
    .sort((left, right) => compareText(left.assignmentId, right.assignmentId))[0];
  const reference =
    declaredCoreAssignment?.skinRef ??
    catalogObject.skinCompatibility.coreFallbackSkinRef;
  const resolved = resolveAvailableSkin(reference, input.availableSkins);
  if (!resolved) {
    return {
      property: "skin",
      value: { id: reference.id, version: "unresolved" },
      source: "core-default",
      inheritedScope: "core-default",
      overrideStatus,
      fallback: true,
      warnings: warning ? [warning] : [],
      conflicts: [
        `Core Default Skin "${reference.id}@${reference.versionRange}" is unavailable`,
      ],
    };
  }
  return skinResolution(
    resolved,
    "core-default",
    "core-default",
    overrideStatus,
    true,
    warning ? [warning] : [],
  );
}

function skinResolution(
  value: ResolvedSkinReference,
  source: RoomResolutionSource,
  inheritedScope: RoomResolutionScope,
  overrideStatus: PropertyOverrideMode,
  fallback: boolean,
  warnings: readonly string[] = [],
): RoomPropertyResolution<ResolvedSkinReference> {
  return {
    property: "skin",
    value,
    source,
    inheritedScope,
    overrideStatus,
    fallback,
    warnings,
    conflicts: [],
  };
}

function resolveAvailableSkin(
  reference: VersionedRef,
  available: readonly AvailableRoomSkin[],
): ResolvedSkinReference | undefined {
  const version = available
    .filter(
      (skin) =>
        skin.skinId === reference.id &&
        satisfiesVersionRange(skin.version, reference.versionRange),
    )
    .map((skin) => skin.version)
    .sort((left, right) => compareVersions(right, left))[0];
  return version ? { id: reference.id, version } : undefined;
}

function skinSourcePriority(
  source: RoomSkinAssignment["source"],
): number {
  if (source === "room") return 0;
  if (source === "active-theme") return 1;
  return 2;
}

function presetReferenceOf(
  room: RoomComposition,
): VersionedRef | undefined {
  return room.presetOrigin
    ? {
        id: room.presetOrigin.presetId,
        versionRange: room.presetOrigin.version,
      }
    : undefined;
}

function assertUnique<T>(
  values: readonly T[],
  identity: (value: T) => string,
  label: string,
): void {
  const seen = new Set<string>();
  for (const value of values) {
    const id = identity(value);
    if (seen.has(id)) {
      throw new RoomResolutionError(
        "room_resolution_duplicate",
        `${label} "${id}" appears more than once`,
      );
    }
    seen.add(id);
  }
}

function assertNoAttachmentCycles(instances: readonly ObjectInstance[]): void {
  const parents = new Map(
    instances
      .filter((instance) => instance.parentAttachment)
      .map((instance) => [
        instance.instanceId,
        instance.parentAttachment!.parentInstanceId,
      ]),
  );
  const known = new Set(instances.map((instance) => instance.instanceId));
  for (const [instanceId, parentId] of parents) {
    if (!known.has(parentId)) {
      throw new RoomResolutionError(
        "room_resolution_reference_missing",
        `Object "${instanceId}" references missing parent "${parentId}"`,
      );
    }
  }
  for (const start of parents.keys()) {
    const path = new Set<string>();
    let cursor: string | undefined = start;
    while (cursor) {
      if (path.has(cursor)) {
        throw new RoomResolutionError(
          "room_resolution_cycle",
          `Object attachment cycle detected at "${cursor}"`,
        );
      }
      path.add(cursor);
      cursor = parents.get(cursor);
    }
  }
}

function compareObjects(
  left: ResolvedRoomObjectInstance,
  right: ResolvedRoomObjectInstance,
  layers: readonly LayerBand[],
): number {
  const leftLayer =
    layers.find((layer) => layer.bandId === left.layer)?.minimum ?? 0;
  const rightLayer =
    layers.find((layer) => layer.bandId === right.layer)?.minimum ?? 0;
  return (
    leftLayer - rightLayer ||
    left.depth - right.depth ||
    compareText(left.instanceId, right.instanceId)
  );
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort(compareText);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
