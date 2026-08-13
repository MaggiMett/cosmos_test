import {
  BASE_FUNCTIONAL_ZONE_IDS,
  BASE_MAIN_ROOM_TEMPLATE_ID,
  BASE_SLOT_IDS,
  CORE_DEFAULT_BASE_SKIN_ID,
} from "./baseTemplate";
import type {
  AssetRegistration,
} from "./assetRegistry";
import type {
  Composition,
  FunctionalObjectScenePayload,
  RectBounds,
  RuntimeFunctionBinding,
  SceneNode,
  SkinPack,
  ThemeManifest,
} from "./types";

const coreBaseSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><defs><linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#18222b"/><stop offset="1" stop-color="#0c1218"/></linearGradient><linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#252a2c"/><stop offset="1" stop-color="#111619"/></linearGradient><radialGradient id="cosmos"><stop stop-color="#214d68"/><stop offset=".45" stop-color="#101f35"/><stop offset="1" stop-color="#050811"/></radialGradient></defs><rect width="1600" height="900" fill="#070b10"/><path d="M320 110h960v610H320z" fill="url(#wall)"/><path d="M0 125l320-15v610L0 790zM1600 125l-320-15v610l320 70z" fill="#111920"/><path d="M320 720h960l240 180H80z" fill="url(#floor)"/><path d="M320 110h960L1450 0H150z" fill="#0c1319"/><path d="M610 105h380v330H610z" fill="#080d13" stroke="#6e8997" stroke-width="6"/><path d="M640 130h320v275H640z" fill="url(#cosmos)"/><g fill="#d9f5ff"><circle cx="690" cy="190" r="2"/><circle cx="870" cy="165" r="2"/><circle cx="920" cy="270" r="1.5"/><circle cx="745" cy="315" r="1.5"/></g><path d="M105 265h245v425H105zM1250 265h245v425h-245z" fill="#121b22" stroke="#526874" stroke-width="5"/><path d="M405 455h285v225H405zM910 455h285v225H910z" fill="#1b252b" stroke="#40545f" stroke-width="4"/><path d="M430 485h235v115H430zM935 485h235v115H935z" fill="#0a1720" stroke="#62b9d0" stroke-width="3"/><ellipse cx="800" cy="725" rx="105" ry="24" fill="#05080b" opacity=".7"/><circle cx="800" cy="610" r="48" fill="#1b2930" stroke="#7bc7d6" stroke-width="4"/><path d="M770 610h60M800 580v60" stroke="#7bc7d6" stroke-width="3" opacity=".65"/><g fill="none" stroke="#b48b5b" stroke-width="5" opacity=".7"><path d="M365 735h870"/><path d="M465 760h670"/></g></svg>\n';

export const CORE_DEFAULT_BASE_PACK_ID = "core.skin-pack.base.default";
export const CORE_DEFAULT_BASE_ASSET_ID = "core.asset.base.placeholder";
export const CORE_DEFAULT_BASE_THEME_ID = "core.theme.base-vertical-slice";
export const CORE_DEFAULT_BASE_COMPOSITION_ID = "core.composition.base.default";

const placeholderAsset = {
  assetId: CORE_DEFAULT_BASE_ASSET_ID,
  kind: "vector",
  format: "svg",
  mimeType: "image/svg+xml",
  path: "assets/base-core.svg",
  sha256: "4b7666c674da453394918c11aeee30a53dcfbb5977656d40074da3cd807d1124",
  byteSize: 1754,
  width: 1600,
  height: 900,
  colorSpace: "srgb",
  alpha: false,
  accessibilityDescription: "Cosmos Core Base interior with cockpit view, integrated workspaces and central Companion",
} as const;

export const coreDefaultBaseSkinPack = {
  schemaVersion: 1,
  packId: CORE_DEFAULT_BASE_PACK_ID,
  version: "1.0.0",
  packageKind: "single-skin",
  displayName: "Cosmos Core Base",
  description: "Canonical Cosmos Core presentation for the Base Main Room clear template.",
  compatibility: {
    themeEngine: "^1.0.0",
  },
  assets: [placeholderAsset],
  skins: [
    {
      skinId: CORE_DEFAULT_BASE_SKIN_ID,
      version: "1.0.0",
      displayName: "Cosmos Core Base",
      target: {
        presentationGroup: "base-interior",
        templateRef: {
          id: BASE_MAIN_ROOM_TEMPLATE_ID,
          versionRange: "^1.0.0",
        },
      },
      assetBindings: Object.entries(BASE_SLOT_IDS).map(([name, slotId]) => ({
        bindingId: `core.binding.base.${toKebabCase(name)}`,
        slotId,
        assetId: CORE_DEFAULT_BASE_ASSET_ID,
        fit: "fill" as const,
      })),
      tokens: {
        "core.token.base.background": { type: "color", value: "#0c1218" },
        "core.token.base.border": { type: "color", value: "#6e8997" },
        "core.token.base.label": { type: "color", value: "#e8f2f4" },
        "core.token.base.opacity": { type: "opacity", value: 1 },
      },
      materials: [],
      stateVariants: [],
      systemTerms: {
        "system.base": {
          en: "Base",
          de: "Base",
        },
      },
    },
  ],
  license: "Internal",
  author: "Cosmos Core",
} as const satisfies SkinPack;

export const coreDefaultBaseThemeManifest = {
  schemaVersion: 1,
  themeId: CORE_DEFAULT_BASE_THEME_ID,
  version: "1.0.0",
  displayName: "Core Base Vertical Slice",
  packageKind: "group-pack",
  compatibility: {
    themeEngine: "^1.0.0",
  },
  groups: ["base-interior"],
  packRefs: [{ id: CORE_DEFAULT_BASE_PACK_ID, versionRange: "^1.0.0" }],
  tokens: {},
  systemTerms: {
    "system.base": {
      en: "Base",
      de: "Base",
    },
  },
} as const satisfies ThemeManifest;

export const coreDefaultBaseAssetRegistration: AssetRegistration = {
  metadata: placeholderAsset,
  content: coreBaseSvg,
};

export const coreDefaultBaseComposition = {
  schemaVersion: 1,
  compositionId: CORE_DEFAULT_BASE_COMPOSITION_ID,
  version: "1.0.0",
  resolverVersion: "1.0.0",
  displayName: "Core Default Base Composition",
  activeThemeRef: {
    id: CORE_DEFAULT_BASE_THEME_ID,
    versionRange: "^1.0.0",
  },
  packRefs: [{ id: CORE_DEFAULT_BASE_PACK_ID, versionRange: "^1.0.0" }],
  parentCompositionRefs: [],
  scopes: [],
  overrides: [],
  environmentScenes: [
    {
      sceneId: "core.scene.base.default",
      environmentTemplateRef: {
        id: BASE_MAIN_ROOM_TEMPLATE_ID,
        versionRange: "^1.0.0",
      },
      scope: {
        level: "environment",
        scopeId: "base.main-room",
      },
      nodes: [
        functionalNode(
          "core.scene.base.left-door",
          BASE_FUNCTIONAL_ZONE_IDS.leftDoor,
          "base.open",
          rect(100, 240, 260, 460),
          rect(145, 300, 170, 340),
          rect(90, 230, 280, 480),
          rect(70, 210, 320, 520),
          rect(100, 705, 260, 44),
          10,
        ),
        functionalNode(
          "core.scene.base.right-door",
          BASE_FUNCTIONAL_ZONE_IDS.rightDoor,
          "base.open",
          rect(1240, 240, 260, 460),
          rect(1285, 300, 170, 340),
          rect(1230, 230, 280, 480),
          rect(1210, 210, 320, 520),
          rect(1240, 705, 260, 44),
          20,
        ),
        functionalNode(
          "core.scene.base.left-workspace",
          BASE_FUNCTIONAL_ZONE_IDS.leftWorkspace,
          "workspace.open",
          rect(400, 410, 300, 280),
          rect(440, 455, 220, 190),
          rect(385, 395, 330, 310),
          rect(365, 375, 370, 350),
          rect(400, 700, 300, 44),
          30,
        ),
        functionalNode(
          "core.scene.base.right-workspace",
          BASE_FUNCTIONAL_ZONE_IDS.rightWorkspace,
          "workspace.open",
          rect(900, 410, 300, 280),
          rect(940, 455, 220, 190),
          rect(885, 395, 330, 310),
          rect(865, 375, 370, 350),
          rect(900, 700, 300, 44),
          40,
        ),
        functionalNode(
          "core.scene.base.companion",
          BASE_FUNCTIONAL_ZONE_IDS.companion,
          "companion.open",
          rect(710, 490, 180, 240),
          rect(745, 535, 110, 160),
          rect(695, 475, 210, 270),
          rect(675, 455, 250, 310),
          rect(700, 740, 200, 44),
          50,
        ),
        functionalNode(
          "core.scene.base.exit",
          BASE_FUNCTIONAL_ZONE_IDS.baseExit,
          "base.close",
          rect(20, 20, 120, 56),
          rect(20, 20, 120, 56),
          rect(20, 20, 120, 56),
          rect(16, 16, 128, 64),
          rect(20, 80, 120, 36),
          0,
          "navigation",
        ),
      ],
    },
  ],
  portability: "distributable",
} as const satisfies Composition;

export const coreDefaultBaseFunctionBindings: readonly RuntimeFunctionBinding[] = [
  binding("core.function.base.left-door", BASE_FUNCTIONAL_ZONE_IDS.leftDoor, "base.open"),
  binding("core.function.base.right-door", BASE_FUNCTIONAL_ZONE_IDS.rightDoor, "base.open"),
  binding(
    "core.function.base.left-workspace",
    BASE_FUNCTIONAL_ZONE_IDS.leftWorkspace,
    "workspace.open",
  ),
  binding(
    "core.function.base.right-workspace",
    BASE_FUNCTIONAL_ZONE_IDS.rightWorkspace,
    "workspace.open",
  ),
  binding(
    "core.function.base.companion",
    BASE_FUNCTIONAL_ZONE_IDS.companion,
    "companion.open",
  ),
  binding("core.function.base.exit", BASE_FUNCTIONAL_ZONE_IDS.baseExit, "base.close"),
];

function functionalNode(
  nodeId: string,
  functionalZoneId: string,
  actionRole: string,
  visualBounds: RectBounds,
  interactionBounds: RectBounds,
  layoutBounds: RectBounds,
  effectBounds: RectBounds,
  labelBounds: RectBounds,
  localOrder: number,
  layerBand = "scene",
): SceneNode {
  const payload: FunctionalObjectScenePayload = {
    kind: "functional-object",
    functionalZoneId,
    actionRole,
    descriptorBinding: {
      source: "runtime-context",
      descriptorRole: actionRole,
    },
    visualBounds,
    interactionBounds,
    layoutBounds,
    effectBounds,
    labelBounds,
    anchorIds: [
      `${functionalZoneId}.visual`,
      `${functionalZoneId}.interaction`,
      `${functionalZoneId}.label`,
    ],
  };
  return {
    nodeId,
    kind: "functional-object",
    anchorId: `${functionalZoneId}.visual`,
    localOrder,
    layerBand,
    transform: {
      x: 0,
      y: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      pivotX: 0,
      pivotY: 0,
    },
    payload,
  };
}

function rect(x: number, y: number, width: number, height: number): RectBounds {
  return { type: "rect", x, y, width, height };
}

function binding(
  bindingId: string,
  functionalZoneId: string,
  descriptorRole: string,
): RuntimeFunctionBinding {
  return {
    bindingId,
    functionalZoneId,
    descriptorRole,
    descriptorId: `${bindingId}.descriptor`,
    source: "core",
  };
}

function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}
