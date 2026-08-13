import type { ObjectTemplate } from "./types";

export const COSMOS_CONNECTION_TEMPLATE_ID =
  "cosmos.object-template.connection.standard-v1";

/**
 * Clear visual contract for a Core-owned relationship between exactly two Nodes.
 * Geometry endpoints and relationship semantics come from the Project model;
 * Theme only owns the rendered beam/effect between those endpoints.
 */
export const cosmosConnectionTemplate = {
  schemaVersion: 1,
  templateId: COSMOS_CONNECTION_TEMPLATE_ID,
  version: "1.0.0",
  templateKind: "object",
  displayName: "Connection — Clear",
  description:
    "Themeable visual connection between two Core-owned Node endpoints. Direction and relationship semantics are intentionally outside the Theme contract.",
  targetRole: "connection",
  compatibility: { themeEngine: ">=1.0.0", cosmos: ">=1.0.0" },
  referenceViewport: { width: 512, height: 96 },
  coordinateMapping: {
    origin: "top-left",
    decorativeFit: "stretch",
    functionalFit: "stretch",
  },
  functionalRoles: [
    {
      roleId: "connection.inspect",
      actionRoles: ["connection.inspect", "connection.context-menu"],
      required: false,
      interactionBoundsId: "connection.hitbox",
      visualAnchorId: "connection.center",
      critical: false,
    },
  ],
  states: [
    { stateId: "default", source: "core", fallbackStateId: "default" },
    { stateId: "active", source: "core", fallbackStateId: "default" },
    { stateId: "highlighted", source: "core", fallbackStateId: "active" },
    { stateId: "search-result", source: "core", fallbackStateId: "highlighted" },
  ],
  statePriority: ["search-result", "highlighted", "active", "default"],
  anchors: [
    { anchorId: "connection.start", x: 0, y: 0.5 },
    { anchorId: "connection.center", x: 0.5, y: 0.5 },
    { anchorId: "connection.end", x: 1, y: 0.5 },
  ],
  bounds: [
    {
      boundsId: "connection.hitbox",
      shape: "rect",
      x: 0,
      y: 0.25,
      width: 1,
      height: 0.5,
    },
    {
      boundsId: "connection.visual",
      shape: "rect",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    },
  ],
  assetSlots: [
    {
      slotId: "connection.beam",
      purpose: "Primary flowing connection beam",
      acceptedKinds: ["image", "vector", "video"],
      acceptedFormats: ["png", "webp", "svg", "webm", "mp4"],
      required: true,
      fallbackPolicy: "core-emergency",
      boundsId: "connection.visual",
      states: ["default", "active", "highlighted", "search-result"],
    },
    {
      slotId: "connection.glow",
      purpose: "Subtle secondary glow beneath the beam",
      acceptedKinds: ["image", "vector", "video"],
      acceptedFormats: ["png", "webp", "svg", "webm", "mp4"],
      required: false,
      fallbackPolicy: "none",
      boundsId: "connection.visual",
      states: ["default", "active", "highlighted", "search-result"],
    },
  ],
  layerBands: [
    { bandId: "glow", minimum: 0, maximum: 9, owner: "object" },
    { bandId: "beam", minimum: 10, maximum: 19, owner: "object" },
    { bandId: "effects", minimum: 20, maximum: 29, owner: "object" },
  ],
  rendererCompatibility: [],
  coreFallbackSkinRef: {
    id: "cosmos.skin.clear.connection",
    versionRange: "^1.0.0",
  },
  scaleRules: {
    universalScale: 1,
    minimum: 0.5,
    maximum: 2,
    hierarchy: {},
    autoScale: true,
  },
  metadata: {
    owner: "cosmos-core",
    notes:
      "Visual Specification V1: exactly two endpoints, straight interaction geometry, no visible direction, no hover state; visible beam may wave independently of the hitbox.",
  },
} as const satisfies ObjectTemplate;
