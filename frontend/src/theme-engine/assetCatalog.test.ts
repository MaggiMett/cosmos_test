import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";

import assetCatalogEntrySchema from "../../../docs/theme-engine/schemas/asset-catalog-entry.schema.json";
import visualAssetSchema from "../../../docs/theme-engine/schemas/visual-asset.schema.json";
import {
  canonicalAssetCatalogEntries,
  canonicalVisualAssets,
} from "./assetCatalogFixtures";
import {
  AssetCatalogRegistry,
  AssetCatalogRegistryError,
} from "./assetCatalogRegistry";
import type {
  AssetCatalogEntry,
  VisualAsset,
} from "./assetCatalogTypes";
import {
  ThemeValidationError,
  validateAssetCatalogEntry,
  validateVisualAsset,
} from "./validation";

describe("Asset Catalog schemas and validators", () => {
  it("validates both public schemas against Draft 2020-12", () => {
    const ajv = new Ajv2020({ strict: false });
    expect(
      ajv.validateSchema(visualAssetSchema),
      JSON.stringify(ajv.errors),
    ).toBe(true);
    expect(
      ajv.validateSchema(assetCatalogEntrySchema),
      JSON.stringify(ajv.errors),
    ).toBe(true);
  });

  it("accepts all canonical Visual Assets and Asset Catalog entries", () => {
    expect(canonicalVisualAssets.map(validateVisualAsset)).toHaveLength(5);
    expect(
      canonicalAssetCatalogEntries.map(validateAssetCatalogEntry),
    ).toHaveLength(5);
  });

  it("keeps Visual Assets free from placement, hitbox, function and runtime data", () => {
    const asset = clone(canonicalVisualAssets[0]!);
    for (const forbidden of [
      { position: { x: 1, y: 2 } },
      { hitbox: { width: 10, height: 10 } },
      { function: "workspace.open" },
      { runtimeRole: "interactive" },
    ]) {
      expect(() => validateVisualAsset({ ...asset, ...forbidden })).toThrow(
        ThemeValidationError,
      );
    }
  });

  it("keeps Catalog entries separate from Visual Objects, Interaction Zones and Function Bindings", () => {
    const entry = clone(canonicalAssetCatalogEntries[0]!);
    for (const forbidden of [
      { visualBounds: { type: "rect", x: 0, y: 0, width: 10, height: 10 } },
      { placementRules: { surface: "floor" } },
      { interactionZone: { shape: "rect" } },
      { interactionZoneProfile: "core.interaction-zone.standard" },
      { functionBinding: { functionDefinition: "core.function.workspace" } },
      { runtimeTarget: "workspace-1" },
    ]) {
      expect(() =>
        validateAssetCatalogEntry({ ...entry, ...forbidden }),
      ).toThrow(ThemeValidationError);
    }
  });

  it("rejects missing fields, unknown fields and mismatched media without defaults", () => {
    const missingTags = clone(canonicalAssetCatalogEntries[0]!) as Partial<AssetCatalogEntry>;
    delete missingTags.userTags;
    expect(() => validateAssetCatalogEntry(missingTags)).toThrow(
      /required property "userTags"/,
    );
    expect(missingTags).not.toHaveProperty("userTags");

    const missingScope = clone(canonicalAssetCatalogEntries[0]!) as Partial<AssetCatalogEntry>;
    delete missingScope.scope;
    expect(() => validateAssetCatalogEntry(missingScope)).toThrow(
      /required property "scope"/,
    );

    expect(() =>
      validateAssetCatalogEntry({
        ...clone(canonicalAssetCatalogEntries[0]!),
        origin: "uploaded",
      }),
    ).toThrow(ThemeValidationError);

    expect(() =>
      validateAssetCatalogEntry({
        ...clone(canonicalAssetCatalogEntries[0]!),
        interactionBounds: { type: "rect", x: 0, y: 0, width: 1, height: 1 },
      }),
    ).toThrow(/unknown property "interactionBounds"/);

    expect(() =>
      validateVisualAsset({
        ...clone(canonicalVisualAssets[0]!),
        format: "png",
      }),
    ).toThrow(/must be equal to constant|validation failed/);
  });

  it("validates semantic versions, references and supported version ranges", () => {
    expect(() =>
      validateAssetCatalogEntry({
        ...clone(canonicalAssetCatalogEntries[0]!),
        version: "v1",
      }),
    ).toThrow(ThemeValidationError);

    expect(() =>
      validateAssetCatalogEntry({
        ...clone(canonicalAssetCatalogEntries[0]!),
        compatibleTemplates: [
          { id: "core.room-shell.standard", versionRange: "banana" },
        ],
      }),
    ).toThrow(/unsupported semantic version range/);

    const entry = canonicalAssetCatalogEntries[0]!;
    expect(() =>
      validateAssetCatalogEntry({
        ...clone(entry),
        deprecated: true,
        replacement: { id: entry.id, version: entry.version },
      }),
    ).toThrow(/must not reference the same catalog entry version/);
  });
});

describe("Asset Catalog Registry", () => {
  it("registers canonical metadata atomically and returns immutable values", () => {
    const registry = createCanonicalRegistry();
    expect(registry.listVisualAssets()).toHaveLength(5);
    expect(registry.list()).toHaveLength(5);
    expect(Object.isFrozen(registry.list())).toBe(true);
    expect(Object.isFrozen(registry.list()[0])).toBe(true);
    expect(
      registry.getVisualAsset(canonicalAssetCatalogEntries[0]!.visualAssetRef)
        ?.id,
    ).toBe("core.visual-asset.bookshelf");
  });

  it("supports exact ID/version lookup and highest compatible version resolution", () => {
    const registry = createCanonicalRegistry();
    const source = canonicalAssetCatalogEntries[0]!;
    const version110 = {
      ...clone(source),
      version: "1.1.0",
      displayName: "Bookshelf 1.1",
    };
    const version120 = {
      ...clone(source),
      version: "1.2.0",
      displayName: "Bookshelf 1.2",
    };
    registry.registerMany([version120, version110]);

    expect(registry.getById(source.id).map((entry) => entry.version)).toEqual([
      "1.0.0",
      "1.1.0",
      "1.2.0",
    ]);
    expect(registry.getByVersion(source.id, "1.1.0")?.displayName).toBe(
      "Bookshelf 1.1",
    );
    expect(registry.resolve(source.id, "^1.0.0").version).toBe("1.2.0");
    expect(() => registry.resolve(source.id, "^2.0.0")).toThrow(
      /no version compatible/,
    );
  });

  it("protects Visual Asset and entry duplicates without partial registration", () => {
    const registry = createCanonicalRegistry();
    const beforeAssets = registry.listVisualAssets().length;
    const beforeEntries = registry.list().length;

    expect(() =>
      registry.registerVisualAssets([
        {
          ...clone(canonicalVisualAssets[0]!),
          id: "test.visual-asset.new",
        },
        clone(canonicalVisualAssets[0]!),
      ]),
    ).toThrow(AssetCatalogRegistryError);
    expect(registry.listVisualAssets()).toHaveLength(beforeAssets);

    expect(() =>
      registry.registerMany([
        {
          ...clone(canonicalAssetCatalogEntries[0]!),
          id: "test.asset-catalog.new",
        },
        clone(canonicalAssetCatalogEntries[0]!),
      ]),
    ).toThrow(AssetCatalogRegistryError);
    expect(registry.list()).toHaveLength(beforeEntries);
  });

  it("rejects missing Visual Asset and replacement references", () => {
    const registry = createCanonicalRegistry();
    expect(() =>
      registry.register({
        ...clone(canonicalAssetCatalogEntries[0]!),
        id: "test.asset-catalog.missing-visual",
        visualAssetRef: {
          id: "missing.visual-asset",
          version: "1.0.0",
        },
      }),
    ).toThrow(/references missing Visual Asset/);

    expect(() =>
      registry.register({
        ...clone(canonicalAssetCatalogEntries[0]!),
        id: "test.asset-catalog.missing-preview",
        layerPreviewRef: {
          id: "missing.visual-asset.preview",
          version: "1.0.0",
        },
      }),
    ).toThrow(/layerPreviewRef references missing Visual Asset/);

    expect(() =>
      registry.register({
        ...clone(canonicalAssetCatalogEntries[0]!),
        id: "test.asset-catalog.deprecated",
        deprecated: true,
        replacement: {
          id: "missing.asset-catalog",
          version: "1.0.0",
        },
      }),
    ).toThrow(/replacement references missing entry/);
  });

  it("accepts forward replacement references in one atomic batch", () => {
    const registry = new AssetCatalogRegistry();
    const asset = clone(canonicalVisualAssets[0]!);
    const current = clone(canonicalAssetCatalogEntries[0]!);
    const replacement = {
      ...clone(current),
      version: "2.0.0",
      displayName: "Bookshelf 2",
    };
    const deprecated = {
      ...current,
      deprecated: true,
      replacement: { id: current.id, version: replacement.version },
    };

    registry.registerCatalog({
      visualAssets: [asset],
      entries: [deprecated, replacement],
    });
    expect(registry.getById(current.id).map((entry) => entry.version)).toEqual([
      "1.0.0",
      "2.0.0",
    ]);
  });

  it("answers every required query deterministically", () => {
    const forward = createCanonicalRegistry();
    const reverse = new AssetCatalogRegistry();
    reverse.registerCatalog({
      visualAssets: [...canonicalVisualAssets].reverse(),
      entries: [...canonicalAssetCatalogEntries].reverse(),
    });

    const queryResults = (registry: AssetCatalogRegistry) => ({
      category: registry
        .findByCategory("core.category.architecture")
        .map(identity),
      tagsAll: registry
        .findByTags(["core.tag.door", "door"], "all")
        .map(identity),
      tagsAny: registry
        .findByTags(["core.tag.plant", "core.tag.workspace"], "any")
        .map(identity),
      theme: registry.findByTheme("core.theme.cosmos").map(identity),
      perspective: registry
        .findByPerspective("illustrated-fixed")
        .map(identity),
      template: registry
        .findByCompatibleTemplate({
          id: "core.room-shell.standard",
          version: "1.3.0",
        })
        .map(identity),
      surface: registry.findByCompatibleSurfaceType("wall").map(identity),
      visualObject: registry
        .findByCompatibleVisualObjectType("workspace-furniture")
        .map(identity),
    });

    expect(queryResults(reverse)).toEqual(queryResults(forward));
    expect(queryResults(forward).category).toEqual([
      "core.asset-catalog.steel-door@1.0.0",
      "core.asset-catalog.wooden-door@1.0.0",
    ]);
    expect(queryResults(forward).tagsAll).toEqual(
      queryResults(forward).category,
    );
    expect(queryResults(forward).surface).toEqual(
      queryResults(forward).category,
    );
    expect(queryResults(forward).visualObject).toEqual([
      "core.asset-catalog.workbench@1.0.0",
    ]);
    expect(
      forward
        .list()
        .flatMap((entry) => entry.compatibleVisualObjectTypes),
    ).not.toContain("catalog-object");
  });

  it("defensively isolates registered data from caller mutation", () => {
    const registry = new AssetCatalogRegistry();
    const asset = clone(canonicalVisualAssets[0]!) as VisualAsset;
    const entry = clone(canonicalAssetCatalogEntries[0]!) as AssetCatalogEntry;
    registry.registerCatalog({ visualAssets: [asset], entries: [entry] });

    entry.displayName = "Mutated caller value";
    asset.path = "mutated.svg";
    expect(registry.getByVersion(entry.id, entry.version)?.displayName).toBe(
      "Bookshelf",
    );
    expect(registry.getVisualAsset(entry.visualAssetRef)?.path).toBe(
      "fixtures/asset-catalog/bookshelf.svg",
    );
  });
});

function createCanonicalRegistry(): AssetCatalogRegistry {
  const registry = new AssetCatalogRegistry();
  registry.registerCatalog({
    visualAssets: canonicalVisualAssets,
    entries: canonicalAssetCatalogEntries,
  });
  return registry;
}

function identity(entry: Readonly<AssetCatalogEntry>): string {
  return `${entry.id}@${entry.version}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
