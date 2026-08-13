import {
  clusterNodeTemplate,
  detailNodeTemplate,
  domainNodeTemplate,
  objectNodeTemplate,
  projectRootNodeTemplate,
} from "./nodeTemplates";
import { cosmosConnectionTemplate } from "./connectionTemplate";
import type { ObjectTemplate, SkinDefinition, SkinPack } from "./types";

export const CORE_COSMOS_GRAPH_PACK_ID = "cosmos.skin-pack.graph.core-v1";

const hierarchy = [
  [projectRootNodeTemplate, "project-root", "Project Root", "#62d9ff", "#a67cff"],
  [domainNodeTemplate, "domain", "Domain", "#62d9ff", "#5f8fff"],
  [clusterNodeTemplate, "cluster", "Cluster", "#77cfff", "#817cff"],
  [objectNodeTemplate, "object", "Object", "#8edcff", "#9b8cff"],
  [detailNodeTemplate, "detail", "Detail", "#a8e6ff", "#b39cff"],
] as const satisfies readonly (readonly [ObjectTemplate, string, string, string, string])[];

function nodeSkin(
  template: ObjectTemplate,
  slug: string,
  label: string,
  primary: string,
  accent: string,
): SkinDefinition {
  return {
    skinId: `cosmos.skin.node.${slug}.core-v1`,
    version: "1.0.0",
    displayName: `Cosmos Core — ${label} Node`,
    target: {
      presentationGroup: "node",
      templateRef: { id: template.templateId, versionRange: "^1.0.0" },
      targetRoles: [template.targetRole],
    },
    assetBindings: [],
    tokens: {
      "cosmos.node.primary": { type: "color", value: primary },
      "cosmos.node.accent": { type: "color", value: accent },
      "cosmos.node.core": { type: "color", value: "#f4fbff" },
      "cosmos.node.label": { type: "color", value: "#f4f8ff" },
      "cosmos.node.label-muted": { type: "color", value: "#a9b8cc" },
      "cosmos.node.glow-opacity": { type: "number", value: slug === "project-root" ? 0.9 : 0.68 },
    },
    materials: [],
    stateVariants: [
      {
        stateId: "hover",
        tokenOverrides: {
          "cosmos.node.glow-opacity": { type: "number", value: 0.86 },
        },
      },
      {
        stateId: "selected",
        tokenOverrides: {
          "cosmos.node.glow-opacity": { type: "number", value: 1 },
          "cosmos.node.core": { type: "color", value: "#ffffff" },
        },
      },
      {
        stateId: "focused",
        tokenOverrides: {
          "cosmos.node.glow-opacity": { type: "number", value: 1 },
          "cosmos.node.accent": { type: "color", value: "#c59cff" },
        },
      },
    ],
  };
}

const connectionSkin: SkinDefinition = {
  skinId: "cosmos.skin.connection.core-v1",
  version: "1.0.0",
  displayName: "Cosmos Core — Connection",
  target: {
    presentationGroup: "connection",
    templateRef: {
      id: cosmosConnectionTemplate.templateId,
      versionRange: "^1.0.0",
    },
    targetRoles: [cosmosConnectionTemplate.targetRole],
  },
  assetBindings: [],
  tokens: {
    "cosmos.connection.core": { type: "color", value: "#68cfff" },
    "cosmos.connection.glow": { type: "color", value: "#557cff" },
    "cosmos.connection.opacity": { type: "number", value: 0.56 },
    "cosmos.connection.width": { type: "number", value: 2 },
  },
  materials: [],
  stateVariants: [
    {
      stateId: "active",
      tokenOverrides: {
        "cosmos.connection.opacity": { type: "number", value: 0.76 },
      },
    },
    {
      stateId: "highlighted",
      tokenOverrides: {
        "cosmos.connection.opacity": { type: "number", value: 1 },
        "cosmos.connection.width": { type: "number", value: 3 },
      },
    },
    {
      stateId: "search-result",
      tokenOverrides: {
        "cosmos.connection.core": { type: "color", value: "#a67cff" },
        "cosmos.connection.opacity": { type: "number", value: 1 },
      },
    },
  ],
};

/**
 * Token-first Core graph look. Final node silhouettes, emblems and animated
 * connection artwork will bind to the Clear Template slots once production
 * assets are authored from CosmosMap.png.
 */
export const coreCosmosGraphSkinPack = {
  schemaVersion: 1,
  packId: CORE_COSMOS_GRAPH_PACK_ID,
  version: "1.0.0",
  packageKind: "skin-pack",
  displayName: "Cosmos Core — Project Graph",
  description:
    "Official hierarchy-aware Node and Connection look for the Cosmos Project Map.",
  compatibility: { themeEngine: ">=1.0.0", cosmos: ">=1.0.0" },
  assets: [],
  skins: [
    ...hierarchy.map(([template, slug, label, primary, accent]) =>
      nodeSkin(template, slug, label, primary, accent),
    ),
    connectionSkin,
  ],
  license: "Internal",
  author: "Cosmos Core",
} satisfies SkinPack;
