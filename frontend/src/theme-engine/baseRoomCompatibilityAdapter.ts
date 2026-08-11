import {
  BASE_FUNCTIONAL_ZONE_IDS,
  BASE_MAIN_ROOM_TEMPLATE_ID,
  BASE_SLOT_IDS,
  CORE_DEFAULT_BASE_SKIN_ID,
  baseMainRoomTemplate,
} from "./baseTemplate";
import {
  coreDefaultBaseComposition,
  coreDefaultBaseFunctionBindings,
} from "./coreDefaultBaseSkin";
import type {
  BoundsShape,
  Composition,
  EnvironmentSurface,
  EnvironmentTemplate,
  FunctionalObjectScenePayload,
  Point,
  RuntimeFunctionBinding,
  SceneNode,
  TemplateState,
} from "./types";
import type {
  CatalogObject,
  CatalogObjectFamily,
  FunctionContainer,
  FunctionContainerInstance,
  FunctionType,
  ObjectInstance,
  PlacementProfile,
  PlacementSurfaceKind,
  RoomComposition,
  RoomPreset,
  RoomShell,
  SurfaceBinding,
} from "./roomCompositionTypes";

export const COMPATIBILITY_ROOM_SHELL_ID = "core.room-shell.base-main-room-compat";
export const COSMOS_MAIN_ROOM_PRESET_ID = "core.room-preset.cosmos-main-room";
export const COSMOS_MAIN_ROOM_ID = "core.room.cosmos-main-room";

export interface BaseRoomCompatibilityAdapterInput {
  template?: EnvironmentTemplate;
  composition?: Composition;
  functionBindings?: readonly RuntimeFunctionBinding[];
}

export interface CompatibilityBoundsRecord {
  legacyNodeId: string;
  objectInstanceId: string;
  functionContainerId: string;
  visualBounds: BoundsShape;
  interactionBounds: BoundsShape;
  layoutBounds: BoundsShape;
  effectBounds: BoundsShape;
  labelBounds?: BoundsShape;
  layer: string;
  depth: number;
  descriptorRole: string;
  descriptorId: string;
}

export interface BaseRoomCompatibilityProjection {
  shell: RoomShell;
  preset: RoomPreset;
  catalogObjects: readonly CatalogObject[];
  functionContainers: readonly FunctionContainer[];
  roomComposition: RoomComposition;
  parity: {
    surfaces: readonly {
      legacySurfaceId: string;
      assetSlotId: string;
      geometry: BoundsShape;
      layer: string;
    }[];
    objects: readonly CompatibilityBoundsRecord[];
  };
}

export class BaseRoomCompatibilityAdapterError extends Error {
  readonly code = "base_room_compatibility_invalid";
}

export function adaptBaseMainRoomV1(
  input: BaseRoomCompatibilityAdapterInput = {},
): Readonly<BaseRoomCompatibilityProjection> {
  const template = input.template ?? baseMainRoomTemplate;
  const composition = input.composition ?? coreDefaultBaseComposition;
  const functionBindings =
    input.functionBindings ?? coreDefaultBaseFunctionBindings;

  if (template.templateId !== BASE_MAIN_ROOM_TEMPLATE_ID) {
    throw new BaseRoomCompatibilityAdapterError(
      `Expected "${BASE_MAIN_ROOM_TEMPLATE_ID}", received "${template.templateId}"`,
    );
  }
  const scene = composition.environmentScenes.find(
    (candidate) => candidate.environmentTemplateRef.id === template.templateId,
  );
  if (!scene) {
    throw new BaseRoomCompatibilityAdapterError(
      `Composition has no scene for "${template.templateId}"`,
    );
  }

  const functionNodes = scene.nodes.filter(
    (node): node is SceneNode & { payload: FunctionalObjectScenePayload } =>
      node.kind === "functional-object" &&
      node.payload.kind === "functional-object",
  );
  if (functionNodes.length !== functionBindings.length) {
    throw new BaseRoomCompatibilityAdapterError(
      "Every legacy functional node requires one Core function binding",
    );
  }

  const placementSurfaceIds = new Set(
    template.surfaces
      .filter((surface) =>
        ["rear", "left", "right", "floor", "ceiling"].includes(
          surface.surfaceRole,
        ),
      )
      .map((surface) => surface.surfaceId),
  );
  const architectureSurfaces = template.surfaces
    .filter((surface) =>
      [
        "background",
        "rear",
        "left",
        "right",
        "floor",
        "ceiling",
        "foreground",
        "ambient",
      ].includes(
        surface.surfaceRole,
      ),
    )
    .map((surface) => ({
      surfaceId: surface.surfaceId,
      surfaceKind: architectureKind(surface),
      geometry: requiredShape(surface),
      normal: surfaceNormal(architectureKind(surface)),
      layerBandId: surface.layerBandId,
      depth: layerMinimum(template, surface.layerBandId),
      pointerPolicy: "passive" as const,
    }));

  const placementAreas = template.surfaces
    .filter((surface) => placementSurfaceIds.has(surface.surfaceId))
    .map((surface) => ({
      areaId: `${surface.surfaceId}.placement`,
      surfaceId: surface.surfaceId,
      bounds: requiredShape(surface),
      safe: true,
    }));
  const placementSurfaces = template.surfaces
    .filter((surface) => placementSurfaceIds.has(surface.surfaceId))
    .map((surface) => {
      const kind = placementKind(surface);
      return {
        surfaceId: surface.surfaceId,
        surfaceKind: kind,
        bounds: requiredShape(surface),
        normal: surfaceNormal(kind),
        basisX: { x: 1, y: 0, z: 0 },
        basisY: { x: 0, y: 1, z: 0 },
        placementAreaIds: [`${surface.surfaceId}.placement`],
        anchorIds: [],
        layerBandId: surface.layerBandId,
        depth: layerMinimum(template, surface.layerBandId),
        snapPriority: kind === "floor" ? 100 : 80,
      };
    });

  const shell: RoomShell = {
    schemaVersion: 1,
    shellId: COMPATIBILITY_ROOM_SHELL_ID,
    version: template.version,
    displayName: "Base Main Room Compatibility Shell",
    compatibility: { ...template.compatibility },
    referenceViewport: { ...template.referenceViewport },
    camera: {
      projection: "illustrated-fixed",
      angleDegrees: 0,
      horizon: 720,
      depthPolicy: "layer-depth",
      scaleReference: 1,
    },
    perspectiveProfile: "base.main-room.legacy-fixed",
    architectureSurfaces,
    placementSurfaces,
    placementAreas,
    attachmentAnchors: [],
    lightAnchors: [
      {
        anchorId: "base.light-anchor.ceiling-center",
        position: {
          x: template.referenceViewport.width / 2,
          y: template.referenceViewport.height * 0.1,
        },
        normal: { x: 0, y: 1, z: 0 },
        lightRole: "ambient",
      },
    ],
    safeAreas: template.safeAreas.map((area) => ({
      ...area,
      shape: cloneShape(area.shape),
    })),
    layerBands: template.layerBands.map((band) => ({ ...band })),
    coreFallbackShellRef: {
      id: COMPATIBILITY_ROOM_SHELL_ID,
      versionRange: `^${template.version}`,
    },
  };

  const catalogObjects: CatalogObject[] = [];
  const functionContainers: FunctionContainer[] = [];
  const objectInstances: ObjectInstance[] = [];
  const containerInstances: FunctionContainerInstance[] = [];
  const parityObjects: CompatibilityBoundsRecord[] = [];

  for (const node of functionNodes) {
    const binding = functionBindings.find(
      (candidate) =>
        candidate.functionalZoneId === node.payload.functionalZoneId &&
        candidate.descriptorRole === node.payload.descriptorBinding.descriptorRole,
    );
    if (!binding) {
      throw new BaseRoomCompatibilityAdapterError(
        `Missing Core binding for "${node.payload.functionalZoneId}"`,
      );
    }
    const suffix = zoneSuffix(node.payload.functionalZoneId);
    const catalogId = `core.catalog.compat.${suffix}`;
    const containerId = `core.function-container.compat.${suffix}`;
    const containerInstanceId = `core.function-container-instance.compat.${suffix}`;
    const family = familyFor(node.payload.functionalZoneId);
    const functionType = functionTypeFor(
      node.payload.descriptorBinding.descriptorRole,
      node.payload.functionalZoneId,
    );
    const origin = shapeOrigin(node.payload.visualBounds);
    const placement = placementFor(node.payload.functionalZoneId, origin);

    const object: CatalogObject = {
      schemaVersion: 1,
      catalogObjectId: catalogId,
      version: "1.0.0",
      displayName: `Compatibility ${suffix}`,
      family,
      compatibility: { themeEngine: "^1.0.0" },
      visualSlots: [
        {
          slotId: slotFor(node.payload.functionalZoneId),
          purpose: `Legacy ${suffix} visual`,
          acceptedKinds: ["image", "vector"],
          acceptedFormats: ["png", "webp", "svg"],
          required: node.payload.functionalZoneId !== BASE_FUNCTIONAL_ZONE_IDS.baseExit,
          fallbackPolicy: "core-emergency",
          states: allStateIds(template.states),
        },
      ],
      defaultBounds: {
        visual: localize(node.payload.visualBounds, origin),
        layout: localize(node.payload.layoutBounds, origin),
        effect: localize(node.payload.effectBounds, origin),
        ...(node.payload.labelBounds
          ? { label: localize(node.payload.labelBounds, origin) }
          : {}),
      },
      pivot: { x: 0.5, y: 0.5 },
      placementProfile: profileFor(family),
      attachmentAnchors: [],
      collisionProfile: {
        mode: "solid",
        boundsRole: "layout",
        blocksPlacement: family !== "companion-visual",
      },
      states: cloneStates(template.states),
      skinCompatibility: {
        presentationGroup: "room",
        requiredSlotIds:
          node.payload.functionalZoneId === BASE_FUNCTIONAL_ZONE_IDS.baseExit
            ? []
            : [slotFor(node.payload.functionalZoneId)],
        coreFallbackSkinRef: {
          id: CORE_DEFAULT_BASE_SKIN_ID,
          versionRange: "^1.0.0",
        },
      },
      perspectiveProfile: "base.main-room.legacy-fixed",
      scale: { defaultX: 1, defaultY: 1, minimum: 0.25, maximum: 4 },
      layerCompatibility: [node.layerBand],
      functionContainerCompatibility: [functionType],
    };
    const container: FunctionContainer = {
      schemaVersion: 1,
      containerId,
      version: "1.0.0",
      displayName: `Compatibility ${suffix} function`,
      functionId: `core.function.${suffix}`,
      functionType,
      interactionBounds: localize(node.payload.interactionBounds, origin),
      functionBinding: {
        source: "runtime-context",
        descriptorRole: binding.descriptorRole,
        actionRole: binding.descriptorRole,
      },
      allowedCatalogFamilies: [family],
      accessibilityLabel: { source: "runtime-context" },
      focusBehavior: {
        focusable: true,
        focusRing: "core",
        tabOrder: "core",
      },
      states: cloneStates(template.states),
      minimumTarget: { width: 44, height: 44 },
      requiredClearance: localize(node.payload.interactionBounds, origin),
      fallbackPresentationRef: {
        id: CORE_DEFAULT_BASE_SKIN_ID,
        versionRange: "^1.0.0",
      },
    };
    const instance: ObjectInstance = {
      instanceId: node.nodeId,
      catalogObjectRef: { id: catalogId, versionRange: "^1.0.0" },
      position: origin,
      rotation: node.transform.rotation,
      scale: { x: node.transform.scaleX, y: node.transform.scaleY },
      layer: node.layerBand,
      depth: node.localOrder,
      surfaceBinding: placement,
      functionContainerInstanceId: containerInstanceId,
      skinRef: { id: CORE_DEFAULT_BASE_SKIN_ID, versionRange: "^1.0.0" },
      propertyOverrides: inheritedOverrides(),
      origin: {
        presetId: COSMOS_MAIN_ROOM_PRESET_ID,
        version: "1.0.0",
        presetItemId: `core.preset-item.${suffix}`,
      },
      placementState: "valid",
    };

    catalogObjects.push(object);
    functionContainers.push(container);
    objectInstances.push(instance);
    containerInstances.push({
      containerInstanceId,
      definitionRef: { id: containerId, versionRange: "^1.0.0" },
      attachedObjectInstanceId: instance.instanceId,
      expectedDescriptorRole: binding.descriptorRole,
    });
    parityObjects.push({
      legacyNodeId: node.nodeId,
      objectInstanceId: instance.instanceId,
      functionContainerId: container.containerId,
      visualBounds: node.payload.visualBounds,
      interactionBounds: node.payload.interactionBounds,
      layoutBounds: node.payload.layoutBounds,
      effectBounds: node.payload.effectBounds,
      ...(node.payload.labelBounds ? { labelBounds: node.payload.labelBounds } : {}),
      layer: node.layerBand,
      depth: node.localOrder,
      descriptorRole: binding.descriptorRole,
      descriptorId: binding.descriptorId,
    });
  }

  sortById(catalogObjects, (entry) => entry.catalogObjectId);
  sortById(functionContainers, (entry) => entry.containerId);
  sortById(objectInstances, (entry) => entry.instanceId);
  sortById(containerInstances, (entry) => entry.containerInstanceId);
  sortById(parityObjects, (entry) => entry.legacyNodeId);

  const preset: RoomPreset = {
    schemaVersion: 1,
    presetId: COSMOS_MAIN_ROOM_PRESET_ID,
    version: "1.0.0",
    displayName: "Cosmos Main Room",
    origin: "core",
    shellRef: { id: shell.shellId, versionRange: "^1.0.0" },
    objectInstances,
    functionContainers: containerInstances,
    decorations: [],
    connections: [],
  };
  const roomComposition: RoomComposition = {
    schemaVersion: 1,
    roomId: COSMOS_MAIN_ROOM_ID,
    version: "1.0.0",
    shellRef: preset.shellRef,
    presetOrigin: {
      presetId: preset.presetId,
      version: preset.version,
    },
    objectInstances,
    functionContainers: containerInstances,
    decorations: [],
    connections: [],
    deletedPresetItemIds: [],
    revision: { revisionId: "compatibility-read-only" },
  };

  return deepFreeze({
    shell,
    preset,
    catalogObjects,
    functionContainers,
    roomComposition,
    parity: {
      surfaces: template.surfaces
        .map((surface) => ({
          legacySurfaceId: surface.surfaceId,
          assetSlotId: surface.assetSlotId,
          geometry: requiredShape(surface),
          layer: surface.layerBandId,
        }))
        .sort((left, right) => compareText(left.legacySurfaceId, right.legacySurfaceId)),
      objects: parityObjects,
    },
  });
}

export function resolveCompatibilityBounds(
  instance: ObjectInstance,
  object: CatalogObject,
  container: FunctionContainer,
): {
  visualBounds: BoundsShape;
  interactionBounds: BoundsShape;
  layoutBounds: BoundsShape;
  effectBounds: BoundsShape;
  labelBounds?: BoundsShape;
} {
  return {
    visualBounds: translate(object.defaultBounds.visual, instance.position),
    interactionBounds: translate(container.interactionBounds, instance.position),
    layoutBounds: translate(object.defaultBounds.layout, instance.position),
    effectBounds: translate(object.defaultBounds.effect, instance.position),
    ...(object.defaultBounds.label
      ? { labelBounds: translate(object.defaultBounds.label, instance.position) }
      : {}),
  };
}

function architectureKind(
  surface: EnvironmentSurface,
): Exclude<PlacementSurfaceKind, "object-anchor"> {
  if (surface.surfaceRole === "floor") return "floor";
  if (surface.surfaceRole === "ceiling") return "ceiling";
  if (surface.surfaceRole === "background") return "background-opening";
  if (["foreground", "ambient"].includes(surface.surfaceRole)) {
    return "architecture";
  }
  return "wall";
}

function placementKind(surface: EnvironmentSurface): PlacementSurfaceKind {
  return architectureKind(surface);
}

function requiredShape(surface: EnvironmentSurface): BoundsShape {
  if (!surface.shape) {
    throw new BaseRoomCompatibilityAdapterError(
      `Legacy surface "${surface.surfaceId}" has no geometry`,
    );
  }
  return cloneShape(surface.shape);
}

function layerMinimum(template: EnvironmentTemplate, bandId: string): number {
  return (
    template.layerBands.find((band) => band.bandId === bandId)?.minimum ?? 0
  );
}

function surfaceNormal(kind: PlacementSurfaceKind): { x: number; y: number; z: number } {
  if (kind === "floor") return { x: 0, y: -1, z: 0 };
  if (kind === "ceiling") return { x: 0, y: 1, z: 0 };
  return { x: 0, y: 0, z: 1 };
}

function familyFor(zoneId: string): CatalogObjectFamily {
  if (zoneId.includes("door")) return "door";
  if (zoneId.includes("workspace")) return "workspace-furniture";
  if (zoneId.includes("companion")) return "companion-visual";
  return "architecture-object";
}

function functionTypeFor(
  descriptorRole: string,
  functionalZoneId: string,
): FunctionType {
  if (descriptorRole === "workspace.open") {
    return functionalZoneId === BASE_FUNCTIONAL_ZONE_IDS.rightWorkspace
      ? "creation-workspace"
      : "knowledge-workspace";
  }
  if (descriptorRole === "companion.open") return "companion-interaction";
  if (descriptorRole === "base.close") return "base-exit";
  return "room-transition";
}

function profileFor(family: CatalogObjectFamily): PlacementProfile {
  const wall = family === "door" || family === "architecture-object";
  return {
    allowedSurfaces: wall ? ["wall"] : ["floor"],
    requiredSurfaceContact: family === "door",
    allowedNormals: wall ? ["horizontal"] : ["up"],
    wallStop: !wall,
    floorLock: !wall,
    ceilingLock: false,
    snapTargets: wall ? ["surface", "edge"] : ["surface", "edge", "anchor"],
    attachmentTargets: [],
    rotationPolicy: {
      mode: wall ? "surface-normal" : "fixed",
      ...(wall ? {} : { allowedDegrees: [0] }),
      alignToSurfaceNormal: wall,
      upright: true,
    },
    scalePolicy: { minimum: 0.25, maximum: 4, uniform: false },
    collisionPolicy: "solid",
    clearance: 0,
    preferredDistance: 24,
    hysteresis: 8,
    priority: 100,
  };
}

function placementFor(zoneId: string, position: Point): SurfaceBinding {
  const surfaceId =
    zoneId === BASE_FUNCTIONAL_ZONE_IDS.leftDoor
      ? "base.surface.left-wall"
      : zoneId === BASE_FUNCTIONAL_ZONE_IDS.rightDoor
        ? "base.surface.right-wall"
        : zoneId === BASE_FUNCTIONAL_ZONE_IDS.baseExit
          ? "base.surface.rear-wall"
          : "base.surface.floor";
  const wall =
    zoneId.includes("door") || zoneId === BASE_FUNCTIONAL_ZONE_IDS.baseExit;
  return {
    surfaceId,
    placementAreaId: `${surfaceId}.placement`,
    localPosition: position,
    normalOffset: 0,
    orientationMode: wall ? "surface-normal" : "room",
    shellVersion: "1.0.0",
  };
}

function slotFor(zoneId: string): string {
  const mapping: Record<string, string> = {
    [BASE_FUNCTIONAL_ZONE_IDS.leftDoor]: BASE_SLOT_IDS.leftDoor,
    [BASE_FUNCTIONAL_ZONE_IDS.rightDoor]: BASE_SLOT_IDS.rightDoor,
    [BASE_FUNCTIONAL_ZONE_IDS.leftWorkspace]: BASE_SLOT_IDS.leftWorkspace,
    [BASE_FUNCTIONAL_ZONE_IDS.rightWorkspace]: BASE_SLOT_IDS.rightWorkspace,
    [BASE_FUNCTIONAL_ZONE_IDS.companion]: BASE_SLOT_IDS.companion,
    [BASE_FUNCTIONAL_ZONE_IDS.baseExit]: "base.slot.exit-compat",
  };
  const slot = mapping[zoneId];
  if (!slot) {
    throw new BaseRoomCompatibilityAdapterError(
      `Unsupported functional zone "${zoneId}"`,
    );
  }
  return slot;
}

function allStateIds(states: readonly TemplateState[]): string[] {
  return states.map((state) => state.stateId);
}

function cloneStates(states: readonly TemplateState[]): TemplateState[] {
  return states.map((state) => ({ ...state }));
}

function shapeOrigin(shape: BoundsShape): Point {
  if (shape.type === "rect") return { x: shape.x, y: shape.y };
  if (shape.type === "ellipse") return { x: shape.cx - shape.rx, y: shape.cy - shape.ry };
  return {
    x: Math.min(...shape.points.map((point) => point.x)),
    y: Math.min(...shape.points.map((point) => point.y)),
  };
}

function localize(shape: BoundsShape, origin: Point): BoundsShape {
  return translate(shape, { x: -origin.x, y: -origin.y });
}

function translate(shape: BoundsShape, offset: Point): BoundsShape {
  if (shape.type === "rect") {
    return { ...shape, x: shape.x + offset.x, y: shape.y + offset.y };
  }
  if (shape.type === "ellipse") {
    return { ...shape, cx: shape.cx + offset.x, cy: shape.cy + offset.y };
  }
  return {
    ...shape,
    points: shape.points.map((point) => ({
      x: point.x + offset.x,
      y: point.y + offset.y,
    })),
  };
}

function cloneShape(shape: BoundsShape): BoundsShape {
  return translate(shape, { x: 0, y: 0 });
}

function inheritedOverrides(): ObjectInstance["propertyOverrides"] {
  return {
    position: { mode: "inherit" },
    rotation: { mode: "inherit" },
    scale: { mode: "inherit" },
    skin: { mode: "inherit" },
    animation: { mode: "inherit" },
    material: { mode: "inherit" },
    layer: { mode: "inherit" },
    depth: { mode: "inherit" },
  };
}

function zoneSuffix(zoneId: string): string {
  return zoneId.replace(/^base\.zone\./, "");
}

function sortById<T>(values: T[], identity: (value: T) => string): void {
  values.sort((left, right) => compareText(identity(left), identity(right)));
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const entry of Object.values(value as Record<string, unknown>)) {
      deepFreeze(entry);
    }
  }
  return value;
}
