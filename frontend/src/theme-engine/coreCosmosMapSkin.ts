import { COSMOS_MAP_SLOT_IDS, COSMOS_MAP_TEMPLATE_ID } from "./cosmosMapTemplate";
import type { SkinPack } from "./types";

export const CORE_COSMOS_MAP_PACK_ID = "cosmos.skin-pack.map.core-v1";
export const CORE_COSMOS_MAP_SKIN_ID = "cosmos.skin.map.core-v1";

const mapAssets = [
  {
    assetId: "cosmos.asset.map.core.background",
    kind: "vector",
    format: "svg",
    mimeType: "image/svg+xml",
    path: "assets/cosmos-map/background.svg",
    sha256: "0000000000000000000000000000000000000000000000000000000000000001",
    byteSize: 1,
    width: 1600,
    height: 900,
    colorSpace: "srgb",
    alpha: false,
    accessibilityDescription: "Deep navy-to-black Cosmos map field",
  },
  {
    assetId: "cosmos.asset.map.core.constellation-field",
    kind: "vector",
    format: "svg",
    mimeType: "image/svg+xml",
    path: "assets/cosmos-map/constellation-field.svg",
    sha256: "0000000000000000000000000000000000000000000000000000000000000002",
    byteSize: 1,
    width: 1600,
    height: 900,
    colorSpace: "srgb",
    alpha: true,
    accessibilityDescription: "Sparse nebula and star field for project constellations",
  },
  {
    assetId: "cosmos.asset.map.core.ambient",
    kind: "vector",
    format: "svg",
    mimeType: "image/svg+xml",
    path: "assets/cosmos-map/ambient.svg",
    sha256: "0000000000000000000000000000000000000000000000000000000000000003",
    byteSize: 1,
    width: 1600,
    height: 900,
    colorSpace: "srgb",
    alpha: true,
    accessibilityDescription: "Subtle blue and violet ambient haze",
  },
] as const;

/**
 * First authored Cosmos Map look. Asset records intentionally describe the
 * approved art direction before final production artwork is cut from the
 * CosmosMap reference; they must not be registered as runtime assets until
 * those files and real hashes exist.
 */
export const coreCosmosMapSkinPack = {
  schemaVersion: 1,
  packId: CORE_COSMOS_MAP_PACK_ID,
  version: "1.0.0",
  packageKind: "single-skin",
  displayName: "Cosmos Core — Map",
  description:
    "Official Cosmos Map look derived from CosmosMap.png and Visual Specifications V1.",
  compatibility: { themeEngine: ">=1.0.0", cosmos: ">=1.0.0" },
  assets: mapAssets,
  skins: [
    {
      skinId: CORE_COSMOS_MAP_SKIN_ID,
      version: "1.0.0",
      displayName: "Cosmos Core Map",
      target: {
        presentationGroup: "map",
        templateRef: { id: COSMOS_MAP_TEMPLATE_ID, versionRange: "^1.0.0" },
      },
      assetBindings: [
        {
          bindingId: "cosmos.binding.map.background",
          slotId: COSMOS_MAP_SLOT_IDS.background,
          assetId: "cosmos.asset.map.core.background",
          fit: "cover",
        },
        {
          bindingId: "cosmos.binding.map.constellation-field",
          slotId: COSMOS_MAP_SLOT_IDS.constellationField,
          assetId: "cosmos.asset.map.core.constellation-field",
          fit: "cover",
        },
        {
          bindingId: "cosmos.binding.map.ambient",
          slotId: COSMOS_MAP_SLOT_IDS.ambient,
          assetId: "cosmos.asset.map.core.ambient",
          fit: "cover",
        },
      ],
      tokens: {
        "cosmos.map.background": { type: "color", value: "#030711" },
        "cosmos.map.space-blue": { type: "color", value: "#07162d" },
        "cosmos.map.nebula-blue": { type: "color", value: "#245ca8" },
        "cosmos.map.nebula-violet": { type: "color", value: "#7048a8" },
        "cosmos.map.node-cyan": { type: "color", value: "#62d9ff" },
        "cosmos.map.node-violet": { type: "color", value: "#a67cff" },
        "cosmos.map.connection": { type: "color", value: "#68cfff" },
        "cosmos.map.label": { type: "color", value: "#f4f8ff" },
        "cosmos.map.label-muted": { type: "color", value: "#a9b8cc" },
      },
      materials: [],
      stateVariants: [],
      systemTerms: {},
    },
  ],
  license: "Internal",
  author: "Cosmos Core",
} as const satisfies SkinPack;
