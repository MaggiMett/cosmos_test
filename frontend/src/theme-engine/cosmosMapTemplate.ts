import type { EnvironmentTemplate, NamespacedId, TemplateAssetSlot } from "./types";

export const COSMOS_MAP_TEMPLATE_ID = "cosmos.map.standard-v1";
export const CORE_CLEAR_COSMOS_MAP_SKIN_ID = "cosmos.skin.map.clear-v1";

export const COSMOS_MAP_SLOT_IDS = {
  background: "cosmos.map.slot.background",
  constellationField: "cosmos.map.slot.constellation-field",
  connectionField: "cosmos.map.slot.connection-field",
  ambient: "cosmos.map.slot.ambient",
  foreground: "cosmos.map.slot.foreground",
} as const;

const mapStates = ["default", "navigating", "focused"] as const;

function mapSlot(
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
    required: false,
    fallbackPolicy: "skin-chain",
    states: [...mapStates],
  };
}

/**
 * Clear environment contract for the Cosmos Project Map.
 *
 * The map owns presentation space only. Project structure, filtered filesystem
 * projection, Node identity and Connections remain Core/project-model data.
 * Themes may style the field and its layers but must not encode project paths
 * or invent hierarchy.
 */
export const cosmosMapTemplate = {
  schemaVersion: 1,
  templateId: COSMOS_MAP_TEMPLATE_ID,
  version: "1.0.0",
  templateKind: "environment",
  displayName: "Cosmos Map — Clear",
  description:
    "Canonical clear canvas for ProjectRoot constellations, hierarchical Nodes and Core-owned Connections.",
  environmentKind: "map",
  compatibility: {
    themeEngine: ">=1.0.0",
    cosmos: ">=1.0.0",
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
      surfaceId: "cosmos.map.surface.background",
      surfaceRole: "background",
      required: true,
      assetSlotId: COSMOS_MAP_SLOT_IDS.background,
      layerBandId: "background",
      pointerPolicy: "passive",
      shape: { type: "rect", x: 0, y: 0, width: 1600, height: 900 },
      allowedFit: ["contain", "cover", "stretch"],
    },
    {
      surfaceId: "cosmos.map.surface.constellation-field",
      surfaceRole: "content",
      required: true,
      assetSlotId: COSMOS_MAP_SLOT_IDS.constellationField,
      layerBandId: "constellation-rear",
      pointerPolicy: "passive",
      shape: { type: "rect", x: 80, y: 80, width: 1440, height: 740 },
      allowedFit: ["contain", "cover", "stretch"],
    },
    {
      surfaceId: "cosmos.map.surface.connection-field",
      surfaceRole: "content",
      required: true,
      assetSlotId: COSMOS_MAP_SLOT_IDS.connectionField,
      layerBandId: "connections",
      pointerPolicy: "passive",
      shape: { type: "rect", x: 80, y: 80, width: 1440, height: 740 },
      allowedFit: ["contain", "cover", "stretch"],
    },
    {
      surfaceId: "cosmos.map.surface.ambient",
      surfaceRole: "ambient",
      required: false,
      assetSlotId: COSMOS_MAP_SLOT_IDS.ambient,
      layerBandId: "ambient-front",
      pointerPolicy: "passive",
      shape: { type: "rect", x: 0, y: 0, width: 1600, height: 900 },
      allowedFit: ["contain", "cover", "stretch"],
    },
    {
      surfaceId: "cosmos.map.surface.foreground",
      surfaceRole: "foreground",
      required: false,
      assetSlotId: COSMOS_MAP_SLOT_IDS.foreground,
      layerBandId: "foreground",
      pointerPolicy: "passive",
      shape: { type: "rect", x: 0, y: 0, width: 1600, height: 900 },
      allowedFit: ["contain", "cover", "stretch"],
    },
  ],
  functionalZones: [],
  safeAreas: [
    {
      safeAreaId: "cosmos.map.safe-area.constellation",
      purpose: "functional-content",
      shape: { type: "rect", x: 80, y: 80, width: 1440, height: 740 },
      critical: true,
      mutableBy: "template",
    },
    {
      safeAreaId: "cosmos.map.safe-area.window-recovery",
      purpose: "window-recovery",
      shape: { type: "rect", x: 0, y: 0, width: 1600, height: 900 },
      critical: true,
      mutableBy: "core",
    },
  ],
  anchors: [
    {
      anchorId: "cosmos.map.anchor.center",
      x: 0.5,
      y: 0.5,
      owner: "layout",
      mutableBy: "template",
      safeAreaId: "cosmos.map.safe-area.constellation",
    },
  ],
  layerBands: [
    { bandId: "background", minimum: -1000, maximum: -801, owner: "environment" },
    { bandId: "constellation-rear", minimum: -800, maximum: -601, owner: "environment" },
    { bandId: "connections", minimum: -400, maximum: -201, owner: "objects" },
    { bandId: "nodes", minimum: -200, maximum: 199, owner: "objects" },
    { bandId: "labels", minimum: 200, maximum: 299, owner: "objects" },
    { bandId: "ambient-front", minimum: 500, maximum: 699, owner: "environment" },
    { bandId: "foreground", minimum: 700, maximum: 799, owner: "environment" },
    { bandId: "window", minimum: 900, maximum: 939, owner: "windows" },
    { bandId: "surface", minimum: 940, maximum: 969, owner: "surface" },
    { bandId: "modal", minimum: 970, maximum: 999, owner: "modal" },
    { bandId: "emergency", minimum: 1000, maximum: 1000, owner: "emergency" },
  ],
  sceneRoots: [
    {
      rootId: "cosmos.map.scene.constellation",
      layerBandId: "nodes",
      allowedNodeKinds: ["group", "functional-object", "renderer", "label"],
    },
    {
      rootId: "cosmos.map.scene.connections",
      layerBandId: "connections",
      allowedNodeKinds: ["group", "asset", "renderer"],
    },
  ],
  states: mapStates.map((stateId) => ({
    stateId,
    source: "core" as const,
    fallbackStateId: "default",
  })),
  assetSlots: [
    mapSlot(COSMOS_MAP_SLOT_IDS.background, "Map background", true),
    mapSlot(COSMOS_MAP_SLOT_IDS.constellationField, "Constellation field decoration", true),
    mapSlot(COSMOS_MAP_SLOT_IDS.connectionField, "Connection field decoration", true),
    mapSlot(COSMOS_MAP_SLOT_IDS.ambient, "Ambient map overlay", true),
    mapSlot(COSMOS_MAP_SLOT_IDS.foreground, "Foreground map overlay", true),
  ],
  cardinality: {},
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
    id: CORE_CLEAR_COSMOS_MAP_SKIN_ID,
    versionRange: "^1.0.0",
  },
} as const satisfies EnvironmentTemplate;
