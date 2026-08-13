import type { EnvironmentTemplate, TemplateAssetSlot } from "./types";

export const WORKSPACE_ENVIRONMENT_TEMPLATE_ID = "cosmos.environment-template.workspace.standard-v1";
export const CORE_CLEAR_WORKSPACE_SKIN_ID = "cosmos.skin.workspace.clear-v1";

export const WORKSPACE_SLOT_IDS = {
  background: "workspace.slot.background",
  canvas: "workspace.slot.canvas",
  toolArea: "workspace.slot.tool-area",
  ambient: "workspace.slot.ambient",
  foreground: "workspace.slot.foreground",
} as const;

const workspaceStates = ["empty", "tool-opened", "multiple-tools", "focused"] as const;

function workspaceSlot(
  slotId: string,
  purpose: string,
  required = false,
): TemplateAssetSlot {
  return {
    slotId,
    purpose,
    acceptedKinds: ["image", "vector", "video"],
    acceptedFormats: ["png", "webp", "svg", "webm", "mp4"],
    required,
    fallbackPolicy: required ? "core-emergency" : "skin-chain",
    states: [...workspaceStates],
  };
}

/**
 * Clear Workspace Environment contract.
 *
 * The Workspace owns a calm canvas and a compact Tool Area. Tool identity,
 * Tool Window state and user data remain Runtime-owned. Themes can restyle the
 * environment and move the Tool Area inside the declared safe workspace, but
 * cannot turn permanent decoration into functionality.
 */
export const workspaceEnvironmentTemplate = {
  schemaVersion: 1,
  templateId: WORKSPACE_ENVIRONMENT_TEMPLATE_ID,
  version: "1.0.0",
  templateKind: "environment",
  displayName: "Workspace Environment — Clear",
  description:
    "Canonical Workspace canvas for focused work, Tool access and Runtime-owned Tool Windows.",
  environmentKind: "workspace",
  compatibility: { themeEngine: ">=1.0.0", cosmos: ">=1.0.0" },
  referenceViewport: {
    width: 1440,
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
      surfaceId: "workspace.surface.background",
      surfaceRole: "background",
      required: true,
      assetSlotId: WORKSPACE_SLOT_IDS.background,
      layerBandId: "background",
      pointerPolicy: "passive",
      shape: { type: "rect", x: 0, y: 0, width: 1440, height: 900 },
      allowedFit: ["contain", "cover", "stretch"],
    },
    {
      surfaceId: "workspace.surface.canvas",
      surfaceRole: "rear",
      required: true,
      assetSlotId: WORKSPACE_SLOT_IDS.canvas,
      layerBandId: "canvas",
      pointerPolicy: "passive",
      shape: { type: "rect", x: 150, y: 70, width: 1220, height: 770 },
      allowedFit: ["contain", "cover", "stretch"],
    },
    {
      surfaceId: "workspace.surface.tool-area",
      surfaceRole: "left",
      required: true,
      assetSlotId: WORKSPACE_SLOT_IDS.toolArea,
      layerBandId: "tool-area",
      pointerPolicy: "passive",
      shape: { type: "rect", x: 30, y: 120, width: 100, height: 660 },
      allowedFit: ["contain", "cover", "stretch"],
    },
    {
      surfaceId: "workspace.surface.ambient",
      surfaceRole: "ambient",
      required: false,
      assetSlotId: WORKSPACE_SLOT_IDS.ambient,
      layerBandId: "ambient",
      pointerPolicy: "passive",
      shape: { type: "rect", x: 0, y: 0, width: 1440, height: 900 },
      allowedFit: ["contain", "cover", "stretch"],
    },
    {
      surfaceId: "workspace.surface.foreground",
      surfaceRole: "foreground",
      required: false,
      assetSlotId: WORKSPACE_SLOT_IDS.foreground,
      layerBandId: "foreground",
      pointerPolicy: "passive",
      shape: { type: "rect", x: 0, y: 0, width: 1440, height: 900 },
      allowedFit: ["contain", "cover", "stretch"],
    },
  ],
  functionalZones: [
    {
      zoneId: "workspace.zone.tool-area",
      role: "tool.entry",
      actionRoles: ["workspace.tool.open"],
      shape: { type: "rect", x: 30, y: 120, width: 100, height: 660 },
      required: true,
      critical: true,
      mutableBy: "template",
      layerBandId: "tool-area",
      visualAnchorId: "workspace.anchor.tool-area",
      interactionAnchorId: "workspace.anchor.tool-area",
      minimumTarget: { width: 44, height: 44 },
    },
  ],
  safeAreas: [
    {
      safeAreaId: "workspace.safe-area.canvas",
      purpose: "functional-content",
      shape: { type: "rect", x: 150, y: 70, width: 1220, height: 770 },
      critical: true,
      mutableBy: "template",
    },
    {
      safeAreaId: "workspace.safe-area.window-recovery",
      purpose: "window-recovery",
      shape: { type: "rect", x: 0, y: 0, width: 1440, height: 900 },
      critical: true,
      mutableBy: "core",
    },
  ],
  anchors: [
    {
      anchorId: "workspace.anchor.canvas",
      x: 0.53,
      y: 0.5,
      owner: "layout",
      mutableBy: "template",
      safeAreaId: "workspace.safe-area.canvas",
    },
    {
      anchorId: "workspace.anchor.tool-area",
      x: 0.055,
      y: 0.5,
      owner: "interaction",
      mutableBy: "template",
    },
  ],
  layerBands: [
    { bandId: "background", minimum: -1000, maximum: -801, owner: "environment" },
    { bandId: "canvas", minimum: -800, maximum: -601, owner: "environment" },
    { bandId: "ambient", minimum: -600, maximum: -501, owner: "environment" },
    { bandId: "tool-area", minimum: -200, maximum: -101, owner: "objects" },
    { bandId: "tool-windows", minimum: 100, maximum: 699, owner: "windows" },
    { bandId: "foreground", minimum: 700, maximum: 799, owner: "environment" },
    { bandId: "surface", minimum: 940, maximum: 969, owner: "surface" },
    { bandId: "modal", minimum: 970, maximum: 999, owner: "modal" },
    { bandId: "emergency", minimum: 1000, maximum: 1000, owner: "emergency" },
  ],
  sceneRoots: [
    {
      rootId: "workspace.scene.tools",
      layerBandId: "tool-area",
      allowedNodeKinds: ["group", "functional-object", "renderer", "label"],
    },
    {
      rootId: "workspace.scene.windows",
      layerBandId: "tool-windows",
      allowedNodeKinds: ["group", "renderer", "label"],
    },
  ],
  states: workspaceStates.map((stateId) => ({
    stateId,
    source: "core" as const,
    fallbackStateId: stateId === "empty" ? "empty" : "empty",
  })),
  assetSlots: [
    workspaceSlot(WORKSPACE_SLOT_IDS.background, "Workspace background", true),
    workspaceSlot(WORKSPACE_SLOT_IDS.canvas, "Calm working canvas", true),
    workspaceSlot(WORKSPACE_SLOT_IDS.toolArea, "Compact Tool Area surface", true),
    workspaceSlot(WORKSPACE_SLOT_IDS.ambient, "Workspace ambient overlay"),
    workspaceSlot(WORKSPACE_SLOT_IDS.foreground, "Workspace foreground overlay"),
  ],
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
    focusLayerBandId: "tool-windows",
  },
  coreFallbackSkinRef: {
    id: CORE_CLEAR_WORKSPACE_SKIN_ID,
    versionRange: "^1.0.0",
  },
} as const satisfies EnvironmentTemplate;
