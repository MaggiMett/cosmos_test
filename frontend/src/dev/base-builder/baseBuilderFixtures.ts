import { deepClone, deepFreeze } from "../../theme-engine/immutable";
import {
  cosmosMainRoomCatalogObjects,
  cosmosMainRoomFunctionContainers,
} from "../../theme-engine/roomCompositionFixtures";
import {
  cosmosMainRoomStandardCompositionFixture,
  cosmosMainRoomStandardPresetFixture,
  emptyRoomShellFixture,
  roomShadowCatalogObjectsFixture,
} from "../../theme-engine/roomShadowFixtures";
import type {
  CatalogObject,
  CatalogObjectFamily,
  FunctionContainer,
  ObjectInstance,
  PlacementProfile,
  RoomComposition,
  RoomPreset,
} from "../../theme-engine/roomCompositionTypes";
import type { BoundsShape, NamespacedId, Point } from "../../theme-engine/types";

export type BaseBuilderCatalogCategory =
  | "architecture"
  | "workspace"
  | "furniture"
  | "lighting"
  | "decoration"
  | "companion";

export interface BaseBuilderCatalogEntry {
  entryId: NamespacedId;
  label: string;
  category: BaseBuilderCatalogCategory;
  description: string;
  object: Readonly<CatalogObject>;
  defaultFunctionContainer?: Readonly<FunctionContainer>;
  defaultPlacementPoint: Point;
  placeholderTone: "slate" | "blue" | "amber" | "green" | "violet";
}

export const BASE_BUILDER_STANDARD_PRESET_ID =
  "dev.room-preset.base-builder-standard";
export const BASE_BUILDER_ROOM_ID = "dev.room.base-builder-preview";

const compatibilityBySuffix = (suffix: string): CatalogObject =>
  deepClone(
    cosmosMainRoomCatalogObjects.find((entry) =>
      entry.catalogObjectId.endsWith(suffix),
    )!,
  );

const functionBySuffix = (suffix: string): FunctionContainer =>
  deepClone(
    cosmosMainRoomFunctionContainers.find((entry) =>
      entry.containerId.endsWith(suffix),
    )!,
  );

const door = compatibilityBySuffix("left-door");
const workspace = compatibilityBySuffix("left-workspace");
const companion = compatibilityBySuffix("companion");
const ceilingLight = technicalObject({
  id: "dev.catalog.builder.ceiling-light",
  label: "Ceiling Light",
  family: "light",
  size: { x: 92, y: 48 },
  profile: placementProfile("ceiling"),
});
const table = technicalObject({
  id: "dev.catalog.builder.table",
  label: "Table",
  family: "furniture",
  size: { x: 190, y: 112 },
  profile: placementProfile("floor"),
});
const shelf = technicalObject({
  id: "dev.catalog.builder.shelf",
  label: "Shelf",
  family: "furniture",
  size: { x: 190, y: 160 },
  profile: placementProfile("floor"),
  anchors: true,
});
const plant = technicalObject({
  id: "dev.catalog.builder.plant",
  label: "Plant",
  family: "plant",
  size: { x: 84, y: 118 },
  profile: placementProfile("plant"),
});
const floorLamp = technicalObject({
  id: "dev.catalog.builder.floor-lamp",
  label: "Floor Lamp",
  family: "light",
  size: { x: 74, y: 174 },
  profile: placementProfile("floor"),
});
const wallLight = technicalObject({
  id: "dev.catalog.builder.wall-light",
  label: "Wall Light",
  family: "light",
  size: { x: 74, y: 92 },
  profile: placementProfile("wall"),
});
const picture = technicalObject({
  id: "dev.catalog.builder.picture",
  label: "Picture",
  family: "decoration",
  size: { x: 150, y: 112 },
  profile: placementProfile("wall"),
});
const decoration = technicalObject({
  id: "dev.catalog.builder.decoration",
  label: "Decoration",
  family: "decoration",
  size: { x: 72, y: 72 },
  profile: placementProfile("decoration"),
});

export const baseBuilderCatalogEntries: readonly Readonly<BaseBuilderCatalogEntry>[] =
  deepFreeze([
    catalogEntry(
      "dev.catalog-entry.door",
      "Door",
      "architecture",
      "Wall-bound room transition",
      door,
      { x: 180, y: 500 },
      "blue",
      functionBySuffix("left-door"),
    ),
    catalogEntry(
      "dev.catalog-entry.workspace",
      "Workspace Furniture",
      "workspace",
      "Replaceable visual around a stable Workspace function",
      workspace,
      { x: 500, y: 610 },
      "violet",
      functionBySuffix("left-workspace"),
    ),
    catalogEntry(
      "dev.catalog-entry.table",
      "Table",
      "furniture",
      "Floor-bound work surface",
      table,
      { x: 680, y: 640 },
      "slate",
    ),
    catalogEntry(
      "dev.catalog-entry.shelf",
      "Shelf",
      "furniture",
      "Floor furniture with a compatible top anchor",
      shelf,
      { x: 920, y: 560 },
      "slate",
    ),
    catalogEntry(
      "dev.catalog-entry.plant",
      "Plant",
      "decoration",
      "Floor object that may attach to a Shelf",
      plant,
      { x: 1040, y: 620 },
      "green",
    ),
    catalogEntry(
      "dev.catalog-entry.floor-lamp",
      "Floor Lamp",
      "lighting",
      "Floor-bound technical light",
      floorLamp,
      { x: 1160, y: 540 },
      "amber",
    ),
    catalogEntry(
      "dev.catalog-entry.wall-light",
      "Wall Light",
      "lighting",
      "Wall-only technical light",
      wallLight,
      { x: 560, y: 330 },
      "amber",
    ),
    catalogEntry(
      "dev.catalog-entry.ceiling-light",
      "Ceiling Light",
      "lighting",
      "Ceiling-only technical light",
      ceilingLight,
      { x: 800, y: 80 },
      "amber",
    ),
    catalogEntry(
      "dev.catalog-entry.picture",
      "Picture",
      "decoration",
      "Wall-only technical frame",
      picture,
      { x: 790, y: 330 },
      "blue",
    ),
    catalogEntry(
      "dev.catalog-entry.decoration",
      "Decoration",
      "decoration",
      "Small floor or Shelf-anchor placeholder",
      decoration,
      { x: 760, y: 650 },
      "slate",
    ),
    catalogEntry(
      "dev.catalog-entry.companion",
      "Companion Visual",
      "companion",
      "Replaceable presentation around a stable Companion function",
      companion,
      { x: 760, y: 500 },
      "green",
      functionBySuffix("companion"),
    ),
  ].sort((left, right) => compareText(left.label, right.label)));

export const baseBuilderCatalogObjects: readonly Readonly<CatalogObject>[] =
  deepFreeze(
    uniqueById([
      ...roomShadowCatalogObjectsFixture.map((entry) => deepClone(entry)),
      ...baseBuilderCatalogEntries.map((entry) => deepClone(entry.object)),
    ]).sort((left, right) =>
      compareText(left.catalogObjectId, right.catalogObjectId),
    ),
  );

export const baseBuilderFunctionContainers:
  readonly Readonly<FunctionContainer>[] = deepFreeze(
    cosmosMainRoomFunctionContainers
      .map((entry) => deepClone(entry))
      .sort((left, right) => compareText(left.containerId, right.containerId)),
  );

const standardInstances = cosmosMainRoomStandardCompositionFixture.objectInstances
  .filter(
    (instance) => instance.instanceId !== "core.scene.base.exit",
  )
  .map((instance) => withBuilderPresetOrigin(deepClone(instance)));
const standardFunctions =
  cosmosMainRoomStandardCompositionFixture.functionContainers
    .filter(
      (instance) =>
        instance.attachedObjectInstanceId !== "core.scene.base.exit",
    )
    .map((instance) => deepClone(instance));

export const baseBuilderStandardPresetFixture: Readonly<RoomPreset> = deepFreeze({
  ...deepClone(cosmosMainRoomStandardPresetFixture),
  presetId: BASE_BUILDER_STANDARD_PRESET_ID,
  displayName: "Base Builder Neutral Standard",
  shellRef: {
    id: emptyRoomShellFixture.shellId,
    versionRange: `^${emptyRoomShellFixture.version}`,
  },
  objectInstances: standardInstances,
  functionContainers: standardFunctions,
  decorations: standardInstances
    .filter(
      (instance) =>
        !instance.functionContainerInstanceId,
    )
    .map((instance) => instance.instanceId)
    .sort(compareText),
});

export const baseBuilderStandardCompositionFixture:
  Readonly<RoomComposition> = deepFreeze({
    schemaVersion: 1,
    roomId: BASE_BUILDER_ROOM_ID,
    version: "1.0.0",
    shellRef: {
      id: emptyRoomShellFixture.shellId,
      versionRange: `^${emptyRoomShellFixture.version}`,
    },
    presetOrigin: {
      presetId: BASE_BUILDER_STANDARD_PRESET_ID,
      version: "1.0.0",
    },
    objectInstances: standardInstances,
    functionContainers: standardFunctions,
    decorations: baseBuilderStandardPresetFixture.decorations,
    connections: [],
    deletedPresetItemIds: [],
    revision: { revisionId: "dev-base-builder-standard" },
  });

export const baseBuilderEmptyCompositionFixture:
  Readonly<RoomComposition> = deepFreeze({
    ...deepClone(baseBuilderStandardCompositionFixture),
    objectInstances: [],
    functionContainers: [],
    decorations: [],
    presetOrigin: undefined,
    revision: { revisionId: "dev-base-builder-empty" },
  });

export const BASE_BUILDER_SKINS = deepFreeze([
  {
    id: "core.skin.base.default",
    versionRange: "^1.0.0",
    label: "Core neutral",
  },
  {
    id: "dev.skin.builder.cool",
    versionRange: "^1.0.0",
    label: "Preview cool",
  },
  {
    id: "dev.skin.builder.warm",
    versionRange: "^1.0.0",
    label: "Preview warm",
  },
] as const);

function catalogEntry(
  entryId: NamespacedId,
  label: string,
  category: BaseBuilderCatalogCategory,
  description: string,
  object: CatalogObject,
  defaultPlacementPoint: Point,
  placeholderTone: BaseBuilderCatalogEntry["placeholderTone"],
  defaultFunctionContainer?: FunctionContainer,
): BaseBuilderCatalogEntry {
  return {
    entryId,
    label,
    category,
    description,
    object,
    defaultPlacementPoint,
    placeholderTone,
    ...(defaultFunctionContainer ? { defaultFunctionContainer } : {}),
  };
}

function technicalObject(options: {
  id: NamespacedId;
  label: string;
  family: CatalogObjectFamily;
  size: Point;
  profile: PlacementProfile;
  anchors?: boolean;
}): CatalogObject {
  const slotId = `${options.id}.visual`;
  return {
    schemaVersion: 1,
    catalogObjectId: options.id,
    version: "1.0.0",
    displayName: options.label,
    family: options.family,
    compatibility: { themeEngine: "^1.0.0" },
    visualSlots: [
      {
        slotId,
        purpose: "Neutral Base Builder placeholder",
        acceptedKinds: ["image", "vector"],
        acceptedFormats: ["png", "webp", "svg"],
        required: true,
        fallbackPolicy: "core-emergency",
        states: ["default", "hover", "focus-visible", "active"],
      },
    ],
    defaultBounds: objectBounds(options.size),
    pivot: { x: 0.5, y: 0.5 },
    placementProfile: options.profile,
    attachmentAnchors: options.anchors
      ? [
          {
            anchorId: `${options.id}.anchor.top`,
            role: "shelf-top",
            position: { x: options.size.x / 2, y: 0 },
            normal: { x: 0, y: -1, z: 0 },
            compatibleFamilies: ["plant", "decoration"],
            acceptedAttachmentRoles: ["shelf-top"],
            priority: 120,
          },
        ]
      : [],
    collisionProfile: {
      mode: "solid",
      boundsRole: "layout",
      blocksPlacement: true,
    },
    states: [
      { stateId: "default", source: "core", fallbackStateId: "default" },
      { stateId: "hover", source: "core", fallbackStateId: "default" },
      {
        stateId: "focus-visible",
        source: "core",
        fallbackStateId: "hover",
      },
      { stateId: "active", source: "core", fallbackStateId: "hover" },
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
    scale: {
      defaultX: 1,
      defaultY: 1,
      minimum: options.profile.scalePolicy.minimum,
      maximum: options.profile.scalePolicy.maximum,
    },
    layerCompatibility: ["scene"],
  };
}

function placementProfile(
  kind: "floor" | "wall" | "ceiling" | "plant" | "decoration",
): PlacementProfile {
  const wall = kind === "wall";
  const ceiling = kind === "ceiling";
  const attachment = kind === "plant" || kind === "decoration";
  return {
    allowedSurfaces: attachment
      ? ["floor", "object-anchor"]
      : [wall ? "wall" : ceiling ? "ceiling" : "floor"],
    requiredSurfaceContact: kind !== "wall" && kind !== "ceiling",
    allowedNormals: attachment
      ? ["up", "horizontal"]
      : [wall ? "horizontal" : ceiling ? "down" : "up"],
    wallStop: !wall && !ceiling,
    floorLock: !wall && !ceiling && !attachment,
    ceilingLock: ceiling,
    snapTargets: attachment
      ? ["surface", "edge", "object-anchor"]
      : ["surface", "edge"],
    attachmentTargets: attachment ? ["shelf-top"] : [],
    rotationPolicy: {
      mode: wall || ceiling ? "surface-normal" : "steps",
      ...(wall || ceiling ? {} : { stepDegrees: 15 }),
      alignToSurfaceNormal: wall || ceiling,
      upright: true,
    },
    scalePolicy: { minimum: 0.5, maximum: 2, uniform: true },
    collisionPolicy: "solid",
    clearance: 8,
    preferredDistance: 28,
    hysteresis: 18,
    priority: 80,
  };
}

function objectBounds(size: Point): {
  visual: BoundsShape;
  layout: BoundsShape;
  effect: BoundsShape;
  label: BoundsShape;
} {
  return {
    visual: { type: "rect", x: 0, y: 0, width: size.x, height: size.y },
    layout: {
      type: "rect",
      x: -4,
      y: -4,
      width: size.x + 8,
      height: size.y + 8,
    },
    effect: {
      type: "rect",
      x: -12,
      y: -12,
      width: size.x + 24,
      height: size.y + 24,
    },
    label: {
      type: "rect",
      x: 0,
      y: size.y + 8,
      width: size.x,
      height: 28,
    },
  };
}

function withBuilderPresetOrigin(instance: ObjectInstance): ObjectInstance {
  return {
    ...instance,
    origin: {
      presetId: BASE_BUILDER_STANDARD_PRESET_ID,
      version: "1.0.0",
      presetItemId:
        instance.origin?.presetItemId ??
        `dev.preset-item.${instance.instanceId.replaceAll(".", "-")}`,
    },
    surfaceBinding: {
      ...instance.surfaceBinding,
      shellVersion: emptyRoomShellFixture.version,
    },
  };
}

function uniqueById(values: readonly CatalogObject[]): CatalogObject[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value.catalogObjectId)) return false;
    seen.add(value.catalogObjectId);
    return true;
  });
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
