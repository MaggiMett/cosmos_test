import type { RouteRecordRaw } from "vue-router";

import EnvironmentView from "../views/EnvironmentView";

const ThemeLibraryView = () => import("../dev/theme-library/ThemeLibraryView.vue");

const ThemeBoardView = () => import("../dev/theme-builder/ThemeBoardView.vue");
const ThemeBuilderAssetLibraryView = () => import("../dev/asset-library/AssetLibraryView.vue");
const RoomShellStudioView = () => import("../dev/theme-builder/RoomShellStudioView.vue");
const ObjectStudioView = () => import("../dev/theme-builder/ObjectStudioView.vue");
const LooksStudioView = () => import("../dev/theme-builder/LooksStudioView.vue");
const ShowcaseView = () => import("../dev/theme-builder/ShowcaseView.vue");
const ReleaseStudioView = () => import("../dev/theme-builder/ReleaseStudioView.vue");

export type EnvironmentKind =
  | "cosmos"
  | "base"
  | "room"
  | "workspace"
  | "development";

export const routeRecords = [
  {
    path: "/",
    name: "cosmos",
    component: EnvironmentView,
    meta: { title: "Cosmos", environment: "cosmos" },
  },
  {
    path: "/base",
    name: "base",
    component: EnvironmentView,
    meta: { title: "Base", environment: "base" },
  },
  {
    path: "/base/rooms/:roomId",
    name: "room",
    component: EnvironmentView,
    meta: { title: "Room", environment: "room" },
  },
  {
    path: "/workspaces/:workspaceId",
    name: "workspace",
    component: EnvironmentView,
    meta: { title: "Workspace", environment: "workspace" },
  },
  {
    path: "/themes",
    name: "theme-library",
    component: ThemeLibraryView,
    meta: { title: "Theme Library", environment: "cosmos" },
  },
  {
    path: "/theme-builder",
    name: "theme-builder",
    component: ThemeBoardView,
    meta: { title: "Theme Builder", environment: "development", standaloneExperience: true },
  },
  {
    path: "/theme-builder/assets",
    name: "theme-builder-assets",
    component: ThemeBuilderAssetLibraryView,
    meta: { title: "Theme Builder Assets", environment: "development", standaloneExperience: true },
  },
  {
    path: "/theme-builder/room-shells",
    name: "theme-builder-room-shell",
    component: RoomShellStudioView,
    meta: { title: "Room Shell Studio", environment: "development", standaloneExperience: true },
  },
  {
    path: "/theme-builder/objects",
    name: "theme-builder-object",
    component: ObjectStudioView,
    meta: { title: "Object Studio", environment: "development", standaloneExperience: true },
  },
  {
    path: "/theme-builder/looks",
    name: "theme-builder-looks",
    component: LooksStudioView,
    meta: { title: "Looks Studio", environment: "development", standaloneExperience: true },
  },
  {
    path: "/theme-builder/preview",
    name: "theme-builder-preview",
    component: ShowcaseView,
    meta: { title: "Theme Preview", environment: "development", standaloneExperience: true },
  },
  {
    path: "/theme-builder/release",
    name: "theme-builder-release",
    component: ReleaseStudioView,
    meta: { title: "Theme Release", environment: "development", standaloneExperience: true },
  },
  {
    path: "/dev/base-builder",
    name: "dev-base-builder",
    component: () => import("../dev/base-builder/BaseBuilderView.vue"),
    meta: {
      title: "Base Builder Development Preview",
      environment: "development",
      developmentPreview: true,
    },
  },
  {
    path: "/dev/asset-library",
    name: "dev-asset-library",
    component: ThemeBuilderAssetLibraryView,
    meta: {
      title: "Asset Library Development Preview",
      environment: "development",
      developmentPreview: true,
    },
  },
  {
    path: "/dev/theme-board",
    name: "dev-theme-board",
    component: ThemeBoardView,
    meta: {
      title: "Theme Board Development Preview",
      environment: "development",
      developmentPreview: true,
    },
  },
  {
    path: "/dev/room-shell-studio",
    name: "dev-room-shell-studio",
    component: RoomShellStudioView,
    meta: {
      title: "Room Shell Studio Development Preview",
      environment: "development",
      developmentPreview: true,
    },
  },
  {
    path: "/dev/object-studio",
    name: "dev-object-studio",
    component: ObjectStudioView,
    meta: {
      title: "Object Studio Development Preview",
      environment: "development",
      developmentPreview: true,
    },
  },
  {
    path: "/dev/looks-studio",
    name: "dev-looks-studio",
    component: LooksStudioView,
    meta: {
      title: "Looks Studio Development Preview",
      environment: "development",
      developmentPreview: true,
    },
  },
  {
    path: "/dev/showcase",
    name: "dev-showcase",
    component: ShowcaseView,
    meta: {
      title: "Showcase Development Preview",
      environment: "development",
      developmentPreview: true,
    },
  },
  {
    path: "/dev/release-studio",
    name: "dev-release-studio",
    component: ReleaseStudioView,
    meta: {
      title: "Release Studio Development Preview",
      environment: "development",
      developmentPreview: true,
    },
  },
  {
    path: "/dev/base-runtime",
    name: "dev-base-runtime",
    component: () => import("../dev/base-runtime/BaseRuntimeView.vue"),
    meta: {
      title: "Base Runtime",
      environment: "base",
    },
  },
  {
    path: "/dev/room-composition-preview",
    name: "dev-room-composition-preview",
    component: () => import("../dev/room-composition-preview/RoomCompositionPreviewView.vue"),
    meta: {
      title: "Room Composition Shadow Preview",
      environment: "base",
    },
  },
  {
    path: "/dev/cosmos-project",
    name: "dev-cosmos-project",
    component: () => import("../dev/cosmos-project/CosmosProjectView.vue"),
    meta: {
      title: "Project Cosmos",
      environment: "cosmos",
    },
  },
  {
    path: "/dev/cosmos-global",
    name: "dev-cosmos-global",
    component: () => import("../dev/cosmos-global/CosmosGlobalView.vue"),
    meta: {
      title: "Global Cosmos View",
      environment: "cosmos",
    },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
] satisfies RouteRecordRaw[];
