import type {
  EnvironmentTemplate,
  FunctionalZone,
  NamespacedId,
  TemplateAssetSlot,
} from "./types";

export const BASE_MAIN_ROOM_TEMPLATE_ID = "base.main-room.v1";
export const CORE_DEFAULT_BASE_SKIN_ID = "core.skin.base.default";

export const BASE_SLOT_IDS = {
  background: "base.slot.background",
  rearWall: "base.slot.rear-wall",
  leftWall: "base.slot.left-wall",
  rightWall: "base.slot.right-wall",
  floor: "base.slot.floor",
  ceiling: "base.slot.ceiling",
  foreground: "base.slot.foreground",
  ambient: "base.slot.ambient",
  leftDoor: "base.slot.left-door",
  rightDoor: "base.slot.right-door",
  leftWorkspace: "base.slot.left-workspace",
  rightWorkspace: "base.slot.right-workspace",
  companion: "base.slot.companion",
} as const;

export type BaseSlotName = keyof typeof BASE_SLOT_IDS;

export const BASE_FUNCTIONAL_ZONE_IDS = {
  leftDoor: "base.zone.left-door",
  rightDoor: "base.zone.right-door",
  leftWorkspace: "base.zone.left-workspace",
  rightWorkspace: "base.zone.right-workspace",
  companion: "base.zone.companion",
  baseExit: "base.zone.exit",
} as const;

const allStates = [
  "default",
  "hover",
  "focus-visible",
  "active",
  "disabled",
  "unavailable",
] as const;

function surfaceSlot(
  slotId: NamespacedId,
  purpose: string,
  video = false,
): TemplateAssetSlot {
  return {
    slotId,
    purpose,
    acceptedKinds: video ? ["image", "vector", "video"] : ["image", "vector"],
    acceptedFormats: video
      ? ["png", "webp", "svg", "webm", "mp4"]
      : ["png", "webp", "svg"],
    required: true,
    fallbackPolicy: "core-emergency",
    states: [...allStates],
  };
}

function zone(
  zoneId: NamespacedId,
  role: FunctionalZone["role"],
  actionRoles: readonly NamespacedId[],
  x: number,
  y: number,
  width: number,
  height: number,
  options: { critical?: boolean; label?: boolean } = {},
): FunctionalZone {
  return {
    zoneId,
    role,
    actionRoles,
    shape: { type: "rect", x, y, width, height },
    required: true,
    critical: options.critical ?? false,
    mutableBy: options.critical ? "core" : "composition",
    layerBandId: role === "base.exit" ? "navigation" : "scene",
    visualAnchorId: `${zoneId}.visual`,
    interactionAnchorId: `${zoneId}.interaction`,
    ...(options.label ? { labelAnchorId: `${zoneId}.label` } : {}),
    minimumTarget: { width: 44, height: 44 },
  };
}

export const baseMainRoomTemplate = {
  schemaVersion: 1,
  templateId: BASE_MAIN_ROOM_TEMPLATE_ID,
  version: "1.0.0",
  templateKind: "environment",
  displayName: "Base Main Room v1",
  description: "Canonical technical Base environment for the first Theme Engine vertical slice.",
  environmentKind: "base-interior",
  compatibility: {
    themeEngine: "^1.0.0",
  },
  referenceViewport: {
    width: 1600,
    height: 900,
    unit: "du",
    origin: "top-left",
  },
  coordinateMapping: {
    decorativeFit: "cover",
    functionalFit: "contain",
    alignment: "center",
  },
  surfaces: [
    {
      surfaceId: "base.surface.background",
      surfaceRole: "background",
      required: true,
      assetSlotId: BASE_SLOT_IDS.background,
      layerBandId: "background",
      pointerPolicy: "passive",
      shape: { type: "rect", x: 0, y: 0, width: 1600, height: 900 },
      allowedFit: ["contain", "cover", "stretch"],
    },
    {
      surfaceId: "base.surface.rear-wall",
      surfaceRole: "rear",
      required: true,
      assetSlotId: BASE_SLOT_IDS.rearWall,
      layerBandId: "architecture-rear",
      pointerPolicy: "passive",
      shape: { type: "rect", x: 320, y: 120, width: 960, height: 600 },
      allowedFit: ["contain", "cover", "stretch"],
    },
    {
      surfaceId: "base.surface.left-wall",
      surfaceRole: "left",
      required: true,
      assetSlotId: BASE_SLOT_IDS.leftWall,
      layerBandId: "architecture-rear",
      pointerPolicy: "passive",
      shape: { type: "rect", x: 0, y: 120, width: 320, height: 600 },
      allowedFit: ["contain", "cover", "stretch"],
    },
    {
      surfaceId: "base.surface.right-wall",
      surfaceRole: "right",
      required: true,
      assetSlotId: BASE_SLOT_IDS.rightWall,
      layerBandId: "architecture-rear",
      pointerPolicy: "passive",
      shape: { type: "rect", x: 1280, y: 120, width: 320, height: 600 },
      allowedFit: ["contain", "cover", "stretch"],
    },
    {
      surfaceId: "base.surface.floor",
      surfaceRole: "floor",
      required: true,
      assetSlotId: BASE_SLOT_IDS.floor,
      layerBandId: "architecture-rear",
      pointerPolicy: "passive",
      shape: { type: "rect", x: 320, y: 720, width: 960, height: 180 },
      allowedFit: ["contain", "cover", "stretch"],
    },
    {
      surfaceId: "base.surface.ceiling",
      surfaceRole: "ceiling",
      required: true,
      assetSlotId: BASE_SLOT_IDS.ceiling,
      layerBandId: "architecture-rear",
      pointerPolicy: "passive",
      shape: { type: "rect", x: 320, y: 0, width: 960, height: 120 },
      allowedFit: ["contain", "cover", "stretch"],
    },
    {
      surfaceId: "base.surface.foreground",
      surfaceRole: "foreground",
      required: true,
      assetSlotId: BASE_SLOT_IDS.foreground,
      layerBandId: "foreground",
      pointerPolicy: "passive",
      shape: { type: "rect", x: 0, y: 0, width: 1600, height: 900 },
      allowedFit: ["contain", "cover", "stretch"],
    },
    {
      surfaceId: "base.surface.ambient",
      surfaceRole: "ambient",
      required: true,
      assetSlotId: BASE_SLOT_IDS.ambient,
      layerBandId: "ambient-front",
      pointerPolicy: "passive",
      shape: { type: "rect", x: 0, y: 0, width: 1600, height: 900 },
      allowedFit: ["contain", "cover", "stretch"],
    },
  ],
  functionalZones: [
    zone(BASE_FUNCTIONAL_ZONE_IDS.leftDoor, "door", ["base.open", "room.transition"], 100, 260, 260, 430, {
      label: true,
    }),
    zone(BASE_FUNCTIONAL_ZONE_IDS.rightDoor, "door", ["base.open", "room.transition"], 1240, 260, 260, 430, {
      label: true,
    }),
    zone(
      BASE_FUNCTIONAL_ZONE_IDS.leftWorkspace,
      "workspace.entry",
      ["workspace.open"],
      400,
      420,
      300,
      260,
      { label: true },
    ),
    zone(
      BASE_FUNCTIONAL_ZONE_IDS.rightWorkspace,
      "workspace.entry",
      ["workspace.open"],
      900,
      420,
      300,
      260,
      { label: true },
    ),
    zone(
      BASE_FUNCTIONAL_ZONE_IDS.companion,
      "companion.anchor",
      ["companion.open"],
      710,
      500,
      180,
      220,
      { label: true },
    ),
    zone(BASE_FUNCTIONAL_ZONE_IDS.baseExit, "base.exit", ["base.close"], 20, 20, 120, 56, {
      critical: true,
      label: true,
    }),
  ],
  safeAreas: [
    {
      safeAreaId: "base.safe-area.art-documentation",
      purpose: "art-documentation",
      shape: { type: "rect", x: 40, y: 120, width: 1520, height: 700 },
      critical: false,
      mutableBy: "template",
    },
    {
      safeAreaId: "base.safe-area.functional",
      purpose: "functional-content",
      shape: { type: "rect", x: 20, y: 20, width: 1560, height: 840 },
      critical: true,
      mutableBy: "template",
    },
    {
      safeAreaId: "base.safe-area.window-recovery",
      purpose: "window-recovery",
      shape: { type: "rect", x: 0, y: 0, width: 1600, height: 900 },
      critical: true,
      mutableBy: "core",
    },
  ],
  anchors: [
    ...Object.values(BASE_FUNCTIONAL_ZONE_IDS).flatMap((zoneId) => [
      {
        anchorId: `${zoneId}.visual`,
        x: 0.5,
        y: 0.5,
        owner: "visual" as const,
        mutableBy: zoneId === BASE_FUNCTIONAL_ZONE_IDS.baseExit ? ("core" as const) : ("composition" as const),
      },
      {
        anchorId: `${zoneId}.interaction`,
        x: 0.5,
        y: 0.5,
        owner: "interaction" as const,
        mutableBy: zoneId === BASE_FUNCTIONAL_ZONE_IDS.baseExit ? ("core" as const) : ("composition" as const),
      },
      {
        anchorId: `${zoneId}.label`,
        x: 0.5,
        y: 1,
        owner: "label" as const,
        mutableBy: zoneId === BASE_FUNCTIONAL_ZONE_IDS.baseExit ? ("core" as const) : ("composition" as const),
      },
    ]),
  ],
  layerBands: [
    { bandId: "background", minimum: -1000, maximum: -801, owner: "environment" },
    { bandId: "architecture-rear", minimum: -800, maximum: -601, owner: "environment" },
    { bandId: "ambient-rear", minimum: -600, maximum: -501, owner: "environment" },
    { bandId: "scene", minimum: -200, maximum: 199, owner: "objects" },
    { bandId: "ambient-front", minimum: 500, maximum: 699, owner: "environment" },
    { bandId: "foreground", minimum: 700, maximum: 799, owner: "environment" },
    { bandId: "navigation", minimum: 850, maximum: 899, owner: "objects" },
    { bandId: "window", minimum: 900, maximum: 939, owner: "windows" },
    { bandId: "surface", minimum: 940, maximum: 969, owner: "surface" },
    { bandId: "modal", minimum: 970, maximum: 999, owner: "modal" },
    { bandId: "emergency", minimum: 1000, maximum: 1000, owner: "emergency" },
  ],
  sceneRoots: [
    {
      rootId: "base.scene.root",
      layerBandId: "scene",
      allowedNodeKinds: [
        "group",
        "surface",
        "asset",
        "functional-object",
        "renderer",
        "label",
        "ambient",
      ],
    },
  ],
  states: allStates.map((stateId) => ({
    stateId,
    source: "core" as const,
    fallbackStateId: "default",
  })),
  assetSlots: [
    surfaceSlot(BASE_SLOT_IDS.background, "Full Base background", true),
    surfaceSlot(BASE_SLOT_IDS.rearWall, "Rear wall surface"),
    surfaceSlot(BASE_SLOT_IDS.leftWall, "Left wall surface"),
    surfaceSlot(BASE_SLOT_IDS.rightWall, "Right wall surface"),
    surfaceSlot(BASE_SLOT_IDS.floor, "Floor surface"),
    surfaceSlot(BASE_SLOT_IDS.ceiling, "Ceiling surface"),
    surfaceSlot(BASE_SLOT_IDS.foreground, "Foreground surface", true),
    surfaceSlot(BASE_SLOT_IDS.ambient, "Ambient surface", true),
    surfaceSlot(BASE_SLOT_IDS.leftDoor, "Left Door visual"),
    surfaceSlot(BASE_SLOT_IDS.rightDoor, "Right Door visual"),
    surfaceSlot(BASE_SLOT_IDS.leftWorkspace, "Left Workspace visual"),
    surfaceSlot(BASE_SLOT_IDS.rightWorkspace, "Right Workspace visual"),
    surfaceSlot(BASE_SLOT_IDS.companion, "Companion visual"),
  ],
  cardinality: {
    "base.role.door": { minimum: 2, maximum: 2 },
    "base.role.workspace-entry": { minimum: 2, maximum: 2 },
    "base.role.companion": { minimum: 1, maximum: 1 },
  },
  portalPolicy: {
    windowPortal: "geometry-neutral",
    geometryOwner: "window-system",
    forbiddenAncestorEffects: [
      "transform",
      "filter",
      "backdrop-filter",
      "perspective",
      "contain",
      "overflow-clipping",
    ],
    focusLayerBandId: "window",
  },
  coreFallbackSkinRef: {
    id: CORE_DEFAULT_BASE_SKIN_ID,
    versionRange: "^1.0.0",
  },
} as const satisfies EnvironmentTemplate;
