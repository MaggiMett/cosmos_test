import type { ObjectTemplate } from "./types";

const nodeStates = [
  { stateId: "default", source: "core", fallbackStateId: "default" },
  { stateId: "hover", source: "core", fallbackStateId: "default" },
  { stateId: "selected", source: "core", fallbackStateId: "hover" },
  { stateId: "focused", source: "core", fallbackStateId: "selected" },
] as const;

const nodeLayerBands = [
  { bandId: "body", minimum: 0, maximum: 19, owner: "object" },
  { bandId: "content", minimum: 20, maximum: 39, owner: "object" },
  { bandId: "effects", minimum: 40, maximum: 59, owner: "object" },
] as const;

function nodeTemplate(input: {
  templateId: string;
  displayName: string;
  targetRole: string;
  scale: number;
}): ObjectTemplate {
  return {
    schemaVersion: 1,
    templateId: input.templateId,
    version: "1.0.0",
    templateKind: "object",
    displayName: input.displayName,
    description:
      "Clear Cosmos Map node template. Visual hierarchy may change with Theme and zoom, while Object identity and Node interaction remain Core-owned.",
    targetRole: input.targetRole,
    compatibility: { themeEngine: ">=1.0.0", cosmos: ">=1.0.0" },
    referenceViewport: { width: 256, height: 256 },
    coordinateMapping: {
      origin: "top-left",
      decorativeFit: "contain",
      functionalFit: "contain",
    },
    functionalRoles: [
      {
        roleId: "node.open",
        actionRoles: ["node.open", "node.select", "node.context-menu", "node.drag"],
        required: true,
        interactionBoundsId: "node.hitbox",
        visualAnchorId: "node.center",
        labelAnchorId: "node.label",
        critical: true,
      },
    ],
    states: nodeStates,
    statePriority: ["focused", "selected", "hover", "default"],
    anchors: [
      { anchorId: "node.center", x: 0.5, y: 0.5 },
      { anchorId: "node.icon", x: 0.5, y: 0.43 },
      { anchorId: "node.label", x: 0.5, y: 0.82 },
      { anchorId: "connection.north", x: 0.5, y: 0.08 },
      { anchorId: "connection.east", x: 0.92, y: 0.5 },
      { anchorId: "connection.south", x: 0.5, y: 0.92 },
      { anchorId: "connection.west", x: 0.08, y: 0.5 },
    ],
    bounds: [
      {
        boundsId: "node.hitbox",
        shape: "ellipse",
        x: 0.08,
        y: 0.08,
        width: 0.84,
        height: 0.84,
      },
      {
        boundsId: "node.body",
        shape: "ellipse",
        x: 0.12,
        y: 0.12,
        width: 0.76,
        height: 0.76,
      },
    ],
    assetSlots: [
      {
        slotId: "node.body",
        purpose: "Primary node silhouette and surface artwork",
        acceptedKinds: ["image", "vector"],
        acceptedFormats: ["png", "webp", "svg"],
        required: true,
        fallbackPolicy: "core-emergency",
        boundsId: "node.body",
        states: ["default", "hover", "selected", "focused"],
      },
      {
        slotId: "node.icon",
        purpose: "Role icon or emblem",
        acceptedKinds: ["image", "vector"],
        acceptedFormats: ["png", "webp", "svg"],
        required: false,
        fallbackPolicy: "skin-chain",
        states: ["default", "hover", "selected", "focused"],
      },
      {
        slotId: "node.effect",
        purpose: "Glow, halo or selection effect",
        acceptedKinds: ["image", "vector", "video"],
        acceptedFormats: ["png", "webp", "svg", "webm", "mp4"],
        required: false,
        fallbackPolicy: "none",
        states: ["hover", "selected", "focused"],
      },
    ],
    layerBands: nodeLayerBands,
    rendererCompatibility: [],
    coreFallbackSkinRef: {
      id: `cosmos.skin.clear.${input.targetRole}`,
      versionRange: "^1.0.0",
    },
    scaleRules: {
      universalScale: input.scale,
      minimum: input.scale * 0.6,
      maximum: input.scale * 1.5,
      hierarchy: {},
      autoScale: true,
    },
    metadata: {
      owner: "cosmos-core",
      notes:
        "Derived from the Product Bible Node contract and CosmosMap visual direction. ProjectRoot is the constellation root; Domain, Cluster, Object and Detail nodes reuse this interaction grammar at smaller visual hierarchy levels.",
    },
  };
}

export const projectRootNodeTemplate = nodeTemplate({
  templateId: "cosmos.object-template.node.project-root.standard-v1",
  displayName: "Project Root Node — Clear",
  targetRole: "node.project-root",
  scale: 1,
});

export const domainNodeTemplate = nodeTemplate({
  templateId: "cosmos.object-template.node.domain.standard-v1",
  displayName: "Domain Node — Clear",
  targetRole: "node.domain",
  scale: 0.78,
});

export const clusterNodeTemplate = nodeTemplate({
  templateId: "cosmos.object-template.node.cluster.standard-v1",
  displayName: "Cluster Node — Clear",
  targetRole: "node.cluster",
  scale: 0.64,
});

export const objectNodeTemplate = nodeTemplate({
  templateId: "cosmos.object-template.node.object.standard-v1",
  displayName: "Object Node — Clear",
  targetRole: "node.object",
  scale: 0.52,
});

export const detailNodeTemplate = nodeTemplate({
  templateId: "cosmos.object-template.node.detail.standard-v1",
  displayName: "Detail Node — Clear",
  targetRole: "node.detail",
  scale: 0.42,
});

export const coreNodeTemplates = [
  projectRootNodeTemplate,
  domainNodeTemplate,
  clusterNodeTemplate,
  objectNodeTemplate,
  detailNodeTemplate,
] as const;
