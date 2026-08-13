import type { ObjectTemplate } from "./types";

export const UI_WINDOW_TEMPLATE_ID = "cosmos.object-template.window.standard-v1";
export const CORE_CLEAR_WINDOW_SKIN_ID = "cosmos.skin.window.clear-v1";

const windowStates = [
  { stateId: "default", source: "core", fallbackStateId: "default" },
  { stateId: "active", source: "core", fallbackStateId: "default" },
  { stateId: "inactive", source: "core", fallbackStateId: "default" },
  { stateId: "opening", source: "core", fallbackStateId: "active" },
  { stateId: "closing", source: "core", fallbackStateId: "active" },
  { stateId: "moving", source: "core", fallbackStateId: "active" },
  { stateId: "resizing", source: "core", fallbackStateId: "active" },
] as const;

/**
 * Clear visual contract for Cosmos Windows.
 *
 * Runtime owns geometry, focus, close, dragging and resize capability. Theme
 * owns only the visible frame, header, content surface and control artwork.
 * Individual Window variants may disable Header, dragging or resizing without
 * changing this shared visual grammar.
 */
export const uiWindowTemplate = {
  schemaVersion: 1,
  templateId: UI_WINDOW_TEMPLATE_ID,
  version: "1.0.0",
  templateKind: "object",
  displayName: "Window — Clear",
  description:
    "Canonical visual container for Workspace and Tool Windows with optional Header and Runtime-owned geometry controls.",
  targetRole: "window",
  compatibility: { themeEngine: ">=1.0.0", cosmos: ">=1.0.0" },
  referenceViewport: { width: 960, height: 640 },
  coordinateMapping: {
    origin: "top-left",
    decorativeFit: "stretch",
    functionalFit: "stretch",
  },
  functionalRoles: [
    {
      roleId: "window.content",
      actionRoles: ["window.focus"],
      required: true,
      interactionBoundsId: "window.content",
      visualAnchorId: "window.center",
      critical: true,
    },
    {
      roleId: "window.close",
      actionRoles: ["window.close"],
      required: false,
      interactionBoundsId: "window.close-hitbox",
      visualAnchorId: "window.close",
      critical: true,
    },
    {
      roleId: "window.move",
      actionRoles: ["window.move"],
      required: false,
      interactionBoundsId: "window.header-hitbox",
      visualAnchorId: "window.header",
      critical: false,
    },
    {
      roleId: "window.resize",
      actionRoles: ["window.resize"],
      required: false,
      interactionBoundsId: "window.resize-hitbox",
      visualAnchorId: "window.center",
      critical: false,
    },
  ],
  states: windowStates,
  statePriority: ["closing", "opening", "resizing", "moving", "active", "inactive", "default"],
  anchors: [
    { anchorId: "window.center", x: 0.5, y: 0.5 },
    { anchorId: "window.header", x: 0.5, y: 0.05 },
    { anchorId: "window.title", x: 0.04, y: 0.05 },
    { anchorId: "window.close", x: 0.955, y: 0.05 },
    { anchorId: "window.content", x: 0.5, y: 0.55 },
  ],
  bounds: [
    { boundsId: "window.frame", shape: "rect", x: 0, y: 0, width: 1, height: 1 },
    { boundsId: "window.header", shape: "rect", x: 0, y: 0, width: 1, height: 0.1 },
    { boundsId: "window.header-hitbox", shape: "rect", x: 0, y: 0, width: 0.9, height: 0.1 },
    { boundsId: "window.close-hitbox", shape: "rect", x: 0.91, y: 0, width: 0.09, height: 0.1 },
    { boundsId: "window.content", shape: "rect", x: 0.02, y: 0.11, width: 0.96, height: 0.87 },
    { boundsId: "window.resize-hitbox", shape: "rect", x: 0, y: 0, width: 1, height: 1 },
  ],
  assetSlots: [
    {
      slotId: "window.frame",
      purpose: "Window glass, border and primary surface",
      acceptedKinds: ["image", "vector"],
      acceptedFormats: ["png", "webp", "svg"],
      required: true,
      fallbackPolicy: "core-emergency",
      boundsId: "window.frame",
      states: windowStates.map((state) => state.stateId),
    },
    {
      slotId: "window.header",
      purpose: "Optional Workspace or Tool Window header surface",
      acceptedKinds: ["image", "vector"],
      acceptedFormats: ["png", "webp", "svg"],
      required: false,
      fallbackPolicy: "skin-chain",
      boundsId: "window.header",
      states: windowStates.map((state) => state.stateId),
    },
    {
      slotId: "window.content-surface",
      purpose: "Content backing surface beneath Runtime-owned content",
      acceptedKinds: ["image", "vector"],
      acceptedFormats: ["png", "webp", "svg"],
      required: false,
      fallbackPolicy: "skin-chain",
      boundsId: "window.content",
      states: windowStates.map((state) => state.stateId),
    },
    {
      slotId: "window.close-control",
      purpose: "Close control artwork when the Window variant exposes Close",
      acceptedKinds: ["image", "vector"],
      acceptedFormats: ["png", "webp", "svg"],
      required: false,
      fallbackPolicy: "skin-chain",
      boundsId: "window.close-hitbox",
      states: windowStates.map((state) => state.stateId),
    },
    {
      slotId: "window.effect",
      purpose: "Shadow, glow or active-window emphasis",
      acceptedKinds: ["image", "vector", "video"],
      acceptedFormats: ["png", "webp", "svg", "webm", "mp4"],
      required: false,
      fallbackPolicy: "none",
      boundsId: "window.frame",
      states: windowStates.map((state) => state.stateId),
    },
  ],
  layerBands: [
    { bandId: "shadow", minimum: 0, maximum: 9, owner: "object" },
    { bandId: "frame", minimum: 10, maximum: 19, owner: "object" },
    { bandId: "content", minimum: 20, maximum: 39, owner: "object" },
    { bandId: "header", minimum: 40, maximum: 49, owner: "object" },
    { bandId: "controls", minimum: 50, maximum: 59, owner: "object" },
    { bandId: "effects", minimum: 60, maximum: 69, owner: "object" },
  ],
  rendererCompatibility: [],
  coreFallbackSkinRef: {
    id: CORE_CLEAR_WINDOW_SKIN_ID,
    versionRange: "^1.0.0",
  },
  scaleRules: {
    universalScale: 1,
    minimum: 0.5,
    maximum: 2,
    hierarchy: {},
    autoScale: false,
  },
  metadata: {
    owner: "cosmos-core",
    notes:
      "Visual Specification V1: Header is optional; Base/Room variants are borderless and fixed, Workspace Environment is fixed with Header, Tool Windows may move and resize. V1 exposes Close only; Minimize and Maximize are intentionally absent.",
  },
} as const satisfies ObjectTemplate;
