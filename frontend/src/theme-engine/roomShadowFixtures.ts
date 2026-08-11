import { deepClone, deepFreeze } from "./immutable";
import {
  baseMainRoomCompatibilityProjection,
  cosmosMainRoomCatalogObjects,
  cosmosMainRoomComposition,
  cosmosMainRoomFunctionContainers,
  cosmosMainRoomShell,
} from "./roomCompositionFixtures";
import type { RoomCompositionRegistries } from "./roomRegistries";
import type {
  BaseComposition,
  CatalogObject,
  CatalogObjectFamily,
  ObjectInstance,
  RoomComposition,
  RoomPreset,
  RoomShell,
} from "./roomCompositionTypes";
import type { RoomSkinResolutionInput } from "./roomSnapshotResolver";

export const EMPTY_ROOM_SHELL_ID = "core.room-shell.empty-technical";
export const STANDARD_ROOM_PRESET_ID =
  "core.room-preset.cosmos-main-room-standard";

export const emptyRoomShellFixture: Readonly<RoomShell> = deepFreeze({
  ...deepClone(cosmosMainRoomShell),
  shellId: EMPTY_ROOM_SHELL_ID,
  displayName: "Empty Technical Room Shell",
  attachmentAnchors: [],
  lightAnchors: [],
  coreFallbackShellRef: {
    id: cosmosMainRoomShell.shellId,
    versionRange: `^${cosmosMainRoomShell.version}`,
  },
});

const neutralObjects = [
  neutralCatalogObject(
    "core.catalog.neutral.ceiling-light-left",
    "light",
    "core.slot.neutral.ceiling-light-left",
    ["ceiling"],
  ),
  neutralCatalogObject(
    "core.catalog.neutral.ceiling-light-right",
    "light",
    "core.slot.neutral.ceiling-light-right",
    ["ceiling"],
  ),
  neutralCatalogObject(
    "core.catalog.neutral.floor-decoration",
    "decoration",
    "core.slot.neutral.floor-decoration",
    ["floor"],
  ),
] as const;

const addedInstances = [
  neutralInstance(
    "core.scene.base.ceiling-light-left",
    neutralObjects[0],
    { x: 520, y: 80 },
    "base.surface.ceiling",
    60,
    "core.preset-item.ceiling-light-left",
  ),
  neutralInstance(
    "core.scene.base.ceiling-light-right",
    neutralObjects[1],
    { x: 980, y: 80 },
    "base.surface.ceiling",
    61,
    "core.preset-item.ceiling-light-right",
  ),
  neutralInstance(
    "core.scene.base.floor-decoration",
    neutralObjects[2],
    { x: 760, y: 680 },
    "base.surface.floor",
    62,
    "core.preset-item.floor-decoration",
  ),
] as const;

const standardObjectInstances = [
  ...deepClone(baseMainRoomCompatibilityProjection.preset.objectInstances).map(
    (instance) => ({
      ...instance,
      origin: {
        presetId: STANDARD_ROOM_PRESET_ID,
        version: "1.0.0",
        presetItemId: instance.origin!.presetItemId!,
      },
    }),
  ),
  ...deepClone(addedInstances),
].sort((left, right) => compareText(left.instanceId, right.instanceId));

export const cosmosMainRoomStandardPresetFixture: Readonly<RoomPreset> =
  deepFreeze({
    schemaVersion: 1,
    presetId: STANDARD_ROOM_PRESET_ID,
    version: "1.0.0",
    displayName: "Cosmos Main Room Standard",
    origin: "core",
    shellRef: {
      id: cosmosMainRoomShell.shellId,
      versionRange: `^${cosmosMainRoomShell.version}`,
    },
    objectInstances: standardObjectInstances,
    functionContainers: deepClone(
      baseMainRoomCompatibilityProjection.preset.functionContainers,
    ),
    decorations: addedInstances.map((instance) => instance.instanceId),
    connections: [],
  });

export const cosmosMainRoomStandardCompositionFixture: Readonly<RoomComposition> =
  deepFreeze({
    ...deepClone(cosmosMainRoomComposition),
    version: "1.1.0",
    presetOrigin: {
      presetId: STANDARD_ROOM_PRESET_ID,
      version: "1.0.0",
    },
    objectInstances: deepClone(standardObjectInstances),
    revision: { revisionId: "standard-fixture" },
  });

const pinnedComposition = deepClone(
  cosmosMainRoomStandardCompositionFixture,
) as RoomComposition;
const pinnedDoor = pinnedComposition.objectInstances.find(
  (instance) => instance.instanceId === "core.scene.base.left-door",
)!;
pinnedDoor.position = { x: 112, y: 248 };
pinnedDoor.surfaceBinding.localPosition = { x: 112, y: 248 };
pinnedDoor.propertyOverrides.position = {
  mode: "pinned",
  value: { x: 112, y: 248 },
};
pinnedComposition.revision = { revisionId: "pinned-user-fixture" };

export const pinnedUserRoomCompositionFixture: Readonly<RoomComposition> =
  deepFreeze(pinnedComposition);

export const roomShadowCatalogObjectsFixture: readonly Readonly<CatalogObject>[] =
  deepFreeze([
    ...deepClone(cosmosMainRoomCatalogObjects),
    ...deepClone(neutralObjects),
  ].sort((left, right) =>
    compareText(left.catalogObjectId, right.catalogObjectId),
  ));

export const roomShadowSkinResolutionFixture: Readonly<RoomSkinResolutionInput> =
  deepFreeze({
    activeThemeId: "test.theme.shadow-neutral",
    availableSkins: [
      { skinId: "core.skin.base.default", version: "1.0.0" },
      { skinId: "core.skin.room-object.neutral", version: "1.0.0" },
      { skinId: "test.skin.room.theme-neutral", version: "2.0.0" },
    ],
    assignments: cosmosMainRoomCatalogObjects.map((object) => ({
      assignmentId: `test.assignment.${object.catalogObjectId.replaceAll(".", "-")}`,
      targetCatalogObjectId: object.catalogObjectId,
      skinRef: {
        id: "test.skin.room.theme-neutral",
        versionRange: "^2.0.0",
      },
      source: "active-theme" as const,
    })),
  });

export const roomShadowBaseCompositionFixture: Readonly<BaseComposition> =
  deepFreeze({
    schemaVersion: 1,
    baseId: "core.base.room-shadow-standard",
    version: "1.0.0",
    rooms: [cosmosMainRoomStandardCompositionFixture],
    connections: [],
    entryRoomId: cosmosMainRoomStandardCompositionFixture.roomId,
    presentationOverrides: [],
    revision: { revisionId: "room-shadow-standard" },
  });

export function registerRoomShadowFixtures(
  registries: RoomCompositionRegistries,
): void {
  registries.shells.registerMany([
    cosmosMainRoomShell,
    emptyRoomShellFixture,
  ]);
  registries.presets.register(cosmosMainRoomStandardPresetFixture);
  registries.catalogObjects.registerMany(roomShadowCatalogObjectsFixture);
  registries.functionContainers.registerMany(
    cosmosMainRoomFunctionContainers,
  );
  registries.baseCompositions.register(roomShadowBaseCompositionFixture);
}

function neutralCatalogObject(
  catalogObjectId: string,
  family: CatalogObjectFamily,
  slotId: string,
  allowedSurfaces: readonly ("floor" | "ceiling")[],
): CatalogObject {
  return {
    schemaVersion: 1,
    catalogObjectId,
    version: "1.0.0",
    displayName: `Neutral ${family}`,
    family,
    compatibility: { themeEngine: "^1.0.0" },
    visualSlots: [
      {
        slotId,
        purpose: "Neutral technical placeholder slot",
        acceptedKinds: ["image", "vector"],
        acceptedFormats: ["png", "webp", "svg"],
        required: true,
        fallbackPolicy: "core-emergency",
        states: ["default"],
      },
    ],
    defaultBounds: {
      visual: { type: "rect", x: 0, y: 0, width: 80, height: 80 },
      layout: { type: "rect", x: -8, y: -8, width: 96, height: 96 },
      effect: { type: "rect", x: -16, y: -16, width: 112, height: 112 },
    },
    pivot: { x: 0.5, y: 0.5 },
    placementProfile: {
      allowedSurfaces,
      requiredSurfaceContact: family === "decoration",
      allowedNormals: allowedSurfaces.includes("ceiling") ? ["down"] : ["up"],
      wallStop: family === "decoration",
      floorLock: allowedSurfaces.length === 1 && allowedSurfaces[0] === "floor",
      ceilingLock:
        allowedSurfaces.length === 1 && allowedSurfaces[0] === "ceiling",
      snapTargets: ["surface", "edge"],
      attachmentTargets: [],
      rotationPolicy: {
        mode: allowedSurfaces.includes("ceiling")
          ? "surface-normal"
          : "fixed",
        ...(allowedSurfaces.includes("ceiling")
          ? {}
          : { allowedDegrees: [0] }),
        alignToSurfaceNormal: allowedSurfaces.includes("ceiling"),
        upright: family !== "light",
      },
      scalePolicy: { minimum: 0.5, maximum: 2, uniform: true },
      collisionPolicy: family === "decoration" ? "solid" : "soft",
      clearance: 4,
      preferredDistance: 16,
      hysteresis: 6,
      priority: 20,
    },
    attachmentAnchors: [],
    collisionProfile: {
      mode: family === "decoration" ? "solid" : "soft",
      boundsRole: "layout",
      blocksPlacement: family === "decoration",
    },
    states: [
      { stateId: "default", source: "core", fallbackStateId: "default" },
    ],
    skinCompatibility: {
      presentationGroup: "room",
      requiredSlotIds: [slotId],
      coreFallbackSkinRef: {
        id: "core.skin.room-object.neutral",
        versionRange: "^1.0.0",
      },
    },
    perspectiveProfile: "base.main-room.legacy-fixed",
    scale: { defaultX: 1, defaultY: 1, minimum: 0.5, maximum: 2 },
    layerCompatibility: ["scene"],
  };
}

function neutralInstance(
  instanceId: string,
  object: CatalogObject,
  position: { x: number; y: number },
  surfaceId: string,
  depth: number,
  presetItemId: string,
): ObjectInstance {
  return {
    instanceId,
    catalogObjectRef: {
      id: object.catalogObjectId,
      versionRange: "^1.0.0",
    },
    position,
    rotation: 0,
    scale: { x: 1, y: 1 },
    layer: "scene",
    depth,
    surfaceBinding: {
      surfaceId,
      placementAreaId: `${surfaceId}.placement`,
      localPosition: position,
      normalOffset: 0,
      orientationMode: surfaceId.endsWith("ceiling")
        ? "surface-normal"
        : "room",
      shellVersion: "1.0.0",
    },
    skinRef: {
      id: "core.skin.room-object.neutral",
      versionRange: "^1.0.0",
    },
    propertyOverrides: {
      position: { mode: "inherit" },
      rotation: { mode: "inherit" },
      scale: { mode: "inherit" },
      skin: { mode: "inherit" },
      animation: { mode: "inherit" },
      material: { mode: "inherit" },
      layer: { mode: "inherit" },
      depth: { mode: "inherit" },
    },
    origin: {
      presetId: STANDARD_ROOM_PRESET_ID,
      version: "1.0.0",
      presetItemId,
    },
    placementState: "valid",
  };
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
