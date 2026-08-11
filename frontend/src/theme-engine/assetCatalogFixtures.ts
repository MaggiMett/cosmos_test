import type {
  AssetCatalogEntry,
  ExactVersionedRef,
  VisualAsset,
} from "./assetCatalogTypes";
import { cloneAndFreeze } from "./immutable";

const VERSION = "1.0.0";
const CREATOR = {
  id: "core.creator.cosmos",
  name: "Cosmos Core Team",
} as const;
const PROVENANCE = {
  kind: "original",
  source: "Cosmos canonical Asset Catalog fixture",
} as const;
const LICENSE = {
  expression: "CC0-1.0",
} as const;
const STANDARD_ROOM_TEMPLATE = {
  id: "core.room-shell.standard",
  versionRange: "^1.0.0",
} as const;

function assetRef(id: string): ExactVersionedRef {
  return { id, version: VERSION };
}

function visualAsset(
  id: string,
  fileName: string,
  digestCharacter: string,
  width: number,
  height: number,
): VisualAsset {
  return {
    schemaVersion: 1,
    id,
    version: VERSION,
    kind: "vector",
    format: "svg",
    mimeType: "image/svg+xml",
    path: `fixtures/asset-catalog/${fileName}.svg`,
    sha256: digestCharacter.repeat(64),
    byteSize: 1024,
    width,
    height,
    colorSpace: "srgb",
    alpha: true,
    accessibilityDescription: `${fileName} canonical metadata fixture`,
  };
}

export const canonicalVisualAssets: readonly Readonly<VisualAsset>[] =
  cloneAndFreeze([
    visualAsset(
      "core.visual-asset.bookshelf",
      "bookshelf",
      "1",
      640,
      960,
    ),
    visualAsset(
      "core.visual-asset.wooden-door",
      "wooden-door",
      "2",
      480,
      960,
    ),
    visualAsset(
      "core.visual-asset.steel-door",
      "steel-door",
      "3",
      480,
      960,
    ),
    visualAsset("core.visual-asset.plant", "plant", "4", 480, 640),
    visualAsset(
      "core.visual-asset.workbench",
      "workbench",
      "5",
      960,
      640,
    ),
  ]);

const bookshelfAssetRef = assetRef("core.visual-asset.bookshelf");
const woodenDoorAssetRef = assetRef("core.visual-asset.wooden-door");
const steelDoorAssetRef = assetRef("core.visual-asset.steel-door");
const plantAssetRef = assetRef("core.visual-asset.plant");
const workbenchAssetRef = assetRef("core.visual-asset.workbench");

export const canonicalAssetCatalogEntries: readonly Readonly<AssetCatalogEntry>[] =
  cloneAndFreeze([
    {
      schemaVersion: 1,
      id: "core.asset-catalog.bookshelf",
      version: VERSION,
      visualAssetRef: bookshelfAssetRef,
      displayName: "Bookshelf",
      description: "A neutral reusable bookshelf visual.",
      category: "core.category.furniture",
      subCategory: "core.category.furniture.storage",
      scope: "core",
      origin: "built-in",
      systemTags: [
        "core.tag.furniture",
        "core.tag.storage",
        "core.tag.wood",
      ],
      userTags: ["books", "shelf"],
      perspective: "illustrated-fixed",
      orientation: "front",
      scaleClass: "room-medium",
      theme: "core.theme.cosmos",
      creator: CREATOR,
      provenance: PROVENANCE,
      license: LICENSE,
      thumbnailRef: bookshelfAssetRef,
      previewRef: bookshelfAssetRef,
      layerPreviewRef: bookshelfAssetRef,
      compatibleTemplates: [STANDARD_ROOM_TEMPLATE],
      compatibleSurfaceTypes: ["floor", "object-anchor"],
      compatibleVisualObjectTypes: ["furniture", "room-object"],
      deprecated: false,
    },
    {
      schemaVersion: 1,
      id: "core.asset-catalog.wooden-door",
      version: VERSION,
      visualAssetRef: woodenDoorAssetRef,
      displayName: "Wooden Door",
      description: "A neutral wooden door visual.",
      category: "core.category.architecture",
      subCategory: "core.category.architecture.doors",
      scope: "core",
      origin: "built-in",
      systemTags: [
        "core.tag.architecture",
        "core.tag.door",
        "core.tag.wood",
      ],
      userTags: ["door", "wooden"],
      perspective: "illustrated-fixed",
      orientation: "front",
      scaleClass: "room-large",
      theme: "core.theme.cosmos",
      creator: CREATOR,
      provenance: PROVENANCE,
      license: LICENSE,
      thumbnailRef: woodenDoorAssetRef,
      previewRef: woodenDoorAssetRef,
      compatibleTemplates: [STANDARD_ROOM_TEMPLATE],
      compatibleSurfaceTypes: ["wall"],
      compatibleVisualObjectTypes: ["door"],
      deprecated: false,
    },
    {
      schemaVersion: 1,
      id: "core.asset-catalog.steel-door",
      version: VERSION,
      visualAssetRef: steelDoorAssetRef,
      displayName: "Steel Door",
      description: "A neutral steel door visual.",
      category: "core.category.architecture",
      subCategory: "core.category.architecture.doors",
      scope: "core",
      origin: "built-in",
      systemTags: [
        "core.tag.architecture",
        "core.tag.door",
        "core.tag.metal",
      ],
      userTags: ["door", "steel"],
      perspective: "illustrated-fixed",
      orientation: "front",
      scaleClass: "room-large",
      theme: "core.theme.cosmos",
      creator: CREATOR,
      provenance: PROVENANCE,
      license: LICENSE,
      thumbnailRef: steelDoorAssetRef,
      previewRef: steelDoorAssetRef,
      compatibleTemplates: [STANDARD_ROOM_TEMPLATE],
      compatibleSurfaceTypes: ["wall"],
      compatibleVisualObjectTypes: ["door"],
      deprecated: false,
    },
    {
      schemaVersion: 1,
      id: "core.asset-catalog.plant",
      version: VERSION,
      visualAssetRef: plantAssetRef,
      displayName: "Plant",
      description: "A neutral decorative plant visual.",
      category: "core.category.decoration",
      subCategory: "core.category.decoration.plants",
      scope: "core",
      origin: "built-in",
      systemTags: [
        "core.tag.decoration",
        "core.tag.nature",
        "core.tag.plant",
      ],
      userTags: ["greenery", "plant"],
      perspective: "illustrated-fixed",
      orientation: "front",
      scaleClass: "room-small",
      theme: "core.theme.cosmos",
      creator: CREATOR,
      provenance: PROVENANCE,
      license: LICENSE,
      thumbnailRef: plantAssetRef,
      previewRef: plantAssetRef,
      compatibleTemplates: [STANDARD_ROOM_TEMPLATE],
      compatibleSurfaceTypes: ["floor", "object-anchor"],
      compatibleVisualObjectTypes: ["decoration", "plant"],
      deprecated: false,
    },
    {
      schemaVersion: 1,
      id: "core.asset-catalog.workbench",
      version: VERSION,
      visualAssetRef: workbenchAssetRef,
      displayName: "Workbench",
      description: "A neutral reusable workbench visual.",
      category: "core.category.furniture",
      subCategory: "core.category.furniture.work-surfaces",
      scope: "core",
      origin: "built-in",
      systemTags: [
        "core.tag.furniture",
        "core.tag.utility",
        "core.tag.workspace",
      ],
      userTags: ["bench", "work"],
      perspective: "illustrated-fixed",
      orientation: "front",
      scaleClass: "room-large",
      theme: "core.theme.cosmos",
      creator: CREATOR,
      provenance: PROVENANCE,
      license: LICENSE,
      thumbnailRef: workbenchAssetRef,
      previewRef: workbenchAssetRef,
      compatibleTemplates: [STANDARD_ROOM_TEMPLATE],
      compatibleSurfaceTypes: ["floor"],
      compatibleVisualObjectTypes: [
        "furniture",
        "workspace-furniture",
      ],
      deprecated: false,
    },
  ]);
