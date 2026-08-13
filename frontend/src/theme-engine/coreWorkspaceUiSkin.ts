import { UI_WINDOW_TEMPLATE_ID } from "./windowTemplate";
import { WORKSPACE_ENVIRONMENT_TEMPLATE_ID } from "./workspaceTemplate";
import type { SkinPack } from "./types";

export const CORE_WORKSPACE_UI_PACK_ID = "cosmos.skin-pack.workspace-ui.core-v1";

/**
 * First official Cosmos presentation for the Workspace and universal Window
 * clear templates. It intentionally carries visual language only; Workspace
 * contents, Tool identity, geometry and Window behavior remain Runtime-owned.
 */
export const coreWorkspaceUiSkinPack = {
  schemaVersion: 1,
  packId: CORE_WORKSPACE_UI_PACK_ID,
  version: "1.0.0",
  packageKind: "skin-pack",
  displayName: "Cosmos Core — Workspace & Windows",
  description:
    "Calm dark working surfaces with restrained cyan focus accents, derived from WorkspaceWindow.png and Visual Specifications V1.",
  compatibility: { themeEngine: ">=1.0.0", cosmos: ">=1.0.0" },
  assets: [],
  skins: [
    {
      skinId: "cosmos.skin.workspace.core-v1",
      version: "1.0.0",
      displayName: "Cosmos Core Workspace",
      target: {
        presentationGroup: "workspace",
        templateRef: { id: WORKSPACE_ENVIRONMENT_TEMPLATE_ID, versionRange: "^1.0.0" },
      },
      assetBindings: [],
      tokens: {
        "cosmos.workspace.background": { type: "color", value: "#090e13" },
        "cosmos.workspace.canvas": { type: "color", value: "#10171d" },
        "cosmos.workspace.tool-area": { type: "color", value: "#151e25" },
        "cosmos.workspace.border": { type: "color", value: "#344652" },
        "cosmos.workspace.accent": { type: "color", value: "#62d9ff" },
        "cosmos.workspace.opacity": { type: "opacity", value: 1 },
      },
      materials: [],
      stateVariants: [
        {
          stateId: "focused",
          tokenOverrides: {
            "cosmos.workspace.border": { type: "color", value: "#557282" },
            "cosmos.workspace.accent": { type: "color", value: "#7de2ff" },
          },
        },
      ],
      systemTerms: {},
    },
    {
      skinId: "cosmos.skin.window.core-v1",
      version: "1.0.0",
      displayName: "Cosmos Core Window",
      target: {
        presentationGroup: "window",
        templateRef: { id: UI_WINDOW_TEMPLATE_ID, versionRange: "^1.0.0" },
        targetRoles: ["window"],
      },
      assetBindings: [],
      tokens: {
        "cosmos.window.surface": { type: "color", value: "#11181e" },
        "cosmos.window.header": { type: "color", value: "#182129" },
        "cosmos.window.content": { type: "color", value: "#0d1318" },
        "cosmos.window.border": { type: "color", value: "#405460" },
        "cosmos.window.accent": { type: "color", value: "#62d9ff" },
        "cosmos.window.label": { type: "color", value: "#eef7fa" },
        "cosmos.window.opacity": { type: "opacity", value: 0.98 },
      },
      materials: [],
      stateVariants: [
        {
          stateId: "active",
          tokenOverrides: {
            "cosmos.window.border": { type: "color", value: "#6490a3" },
          },
        },
        {
          stateId: "inactive",
          tokenOverrides: {
            "cosmos.window.opacity": { type: "opacity", value: 0.88 },
            "cosmos.window.border": { type: "color", value: "#2b3941" },
          },
        },
      ],
      systemTerms: {},
    },
  ],
  license: "Internal",
  author: "Cosmos Core",
} as const satisfies SkinPack;
