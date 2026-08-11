import type {
  AssetCatalogEntry,
  AssetCatalogRegistrationBatch,
  ExactVersionedRef,
  VisualAsset,
} from "./assetCatalogTypes";
import { cloneAndFreeze } from "./immutable";
import {
  validateAssetCatalogEntry,
  validateVisualAsset,
} from "./validation";
import {
  compareVersions,
  satisfiesVersionRange,
} from "./version";

export type AssetCatalogTagMatch = "all" | "any";

export class AssetCatalogRegistryError extends Error {
  constructor(
    readonly code:
      | "asset_catalog_duplicate"
      | "asset_catalog_visual_asset_duplicate"
      | "asset_catalog_reference_missing"
      | "asset_catalog_missing"
      | "asset_catalog_version_incompatible",
    message: string,
  ) {
    super(message);
    this.name = "AssetCatalogRegistryError";
  }
}

/**
 * A definition-only registry for versioned Visual Assets and their discovery
 * metadata. Stored values are defensively cloned and recursively frozen.
 */
export class AssetCatalogRegistry {
  readonly #visualAssets = new Map<
    string,
    Map<string, Readonly<VisualAsset>>
  >();

  readonly #entries = new Map<
    string,
    Map<string, Readonly<AssetCatalogEntry>>
  >();

  registerVisualAsset(value: unknown): Readonly<VisualAsset> {
    return this.registerVisualAssets([value])[0]!;
  }

  registerVisualAssets(values: readonly unknown[]): readonly Readonly<VisualAsset>[] {
    const assets = values.map(validateVisualAsset);
    this.assertVisualAssetDuplicates(assets);
    const stored = assets.map((asset) => cloneAndFreeze(asset));
    for (const asset of stored) {
      setVersioned(this.#visualAssets, asset.id, asset.version, asset);
    }
    return frozenArray(stored);
  }

  register(value: unknown): Readonly<AssetCatalogEntry> {
    return this.registerMany([value])[0]!;
  }

  registerMany(values: readonly unknown[]): readonly Readonly<AssetCatalogEntry>[] {
    const entries = values.map(validateAssetCatalogEntry);
    this.assertEntryDuplicates(entries);
    const availableEntries = new Set(this.entryKeys());
    for (const entry of entries) availableEntries.add(versionKey(entry.id, entry.version));
    const availableAssets = new Set(this.visualAssetKeys());
    for (const entry of entries) {
      assertEntryReferences(entry, availableAssets, availableEntries);
    }

    const stored = entries.map((entry) => cloneAndFreeze(entry));
    for (const entry of stored) {
      setVersioned(this.#entries, entry.id, entry.version, entry);
    }
    return frozenArray(stored);
  }

  /**
   * Atomically registers a complete catalog batch, including forward
   * replacement references and Visual Assets introduced by the same batch.
   */
  registerCatalog(
    batch: AssetCatalogRegistrationBatch,
  ): {
    readonly visualAssets: readonly Readonly<VisualAsset>[];
    readonly entries: readonly Readonly<AssetCatalogEntry>[];
  } {
    const assets = batch.visualAssets.map(validateVisualAsset);
    const entries = batch.entries.map(validateAssetCatalogEntry);
    this.assertVisualAssetDuplicates(assets);
    this.assertEntryDuplicates(entries);

    const availableAssets = new Set(this.visualAssetKeys());
    for (const asset of assets) {
      availableAssets.add(versionKey(asset.id, asset.version));
    }
    const availableEntries = new Set(this.entryKeys());
    for (const entry of entries) {
      availableEntries.add(versionKey(entry.id, entry.version));
    }
    for (const entry of entries) {
      assertEntryReferences(entry, availableAssets, availableEntries);
    }

    const storedAssets = assets.map((asset) => cloneAndFreeze(asset));
    const storedEntries = entries.map((entry) => cloneAndFreeze(entry));
    for (const asset of storedAssets) {
      setVersioned(this.#visualAssets, asset.id, asset.version, asset);
    }
    for (const entry of storedEntries) {
      setVersioned(this.#entries, entry.id, entry.version, entry);
    }
    return Object.freeze({
      visualAssets: frozenArray(storedAssets),
      entries: frozenArray(storedEntries),
    });
  }

  getById(id: string): readonly Readonly<AssetCatalogEntry>[] {
    const versions = this.#entries.get(id);
    if (!versions) return frozenArray([]);
    return frozenArray(
      [...versions.values()].sort((left, right) =>
        compareVersions(left.version, right.version),
      ),
    );
  }

  getByVersion(
    id: string,
    version: string,
  ): Readonly<AssetCatalogEntry> | undefined {
    return this.#entries.get(id)?.get(version);
  }

  requireByVersion(id: string, version: string): Readonly<AssetCatalogEntry> {
    const versions = this.#entries.get(id);
    if (!versions) {
      throw new AssetCatalogRegistryError(
        "asset_catalog_missing",
        `Asset Catalog entry "${id}" is not registered.`,
      );
    }
    const entry = versions.get(version);
    if (!entry) {
      throw new AssetCatalogRegistryError(
        "asset_catalog_version_incompatible",
        `Asset Catalog entry "${id}" has no registered version "${version}".`,
      );
    }
    return entry;
  }

  resolve(
    id: string,
    versionRange: string,
  ): Readonly<AssetCatalogEntry> {
    const versions = this.#entries.get(id);
    if (!versions) {
      throw new AssetCatalogRegistryError(
        "asset_catalog_missing",
        `Asset Catalog entry "${id}" is not registered.`,
      );
    }
    const entry = [...versions.values()]
      .filter((candidate) =>
        satisfiesVersionRange(candidate.version, versionRange),
      )
      .sort((left, right) => compareVersions(right.version, left.version))[0];
    if (!entry) {
      throw new AssetCatalogRegistryError(
        "asset_catalog_version_incompatible",
        `Asset Catalog entry "${id}" has no version compatible with "${versionRange}".`,
      );
    }
    return entry;
  }

  getVisualAsset(
    reference: ExactVersionedRef,
  ): Readonly<VisualAsset> | undefined {
    return this.#visualAssets.get(reference.id)?.get(reference.version);
  }

  list(): readonly Readonly<AssetCatalogEntry>[] {
    return frozenArray(
      [...this.#entries.entries()]
        .sort(([left], [right]) => compareText(left, right))
        .flatMap(([, versions]) =>
          [...versions.values()].sort((left, right) =>
            compareVersions(left.version, right.version),
          ),
        ),
    );
  }

  listVisualAssets(): readonly Readonly<VisualAsset>[] {
    return frozenArray(
      [...this.#visualAssets.entries()]
        .sort(([left], [right]) => compareText(left, right))
        .flatMap(([, versions]) =>
          [...versions.values()].sort((left, right) =>
            compareVersions(left.version, right.version),
          ),
        ),
    );
  }

  findByCategory(category: string): readonly Readonly<AssetCatalogEntry>[] {
    return this.filter((entry) => entry.category === category);
  }

  findByTags(
    tags: readonly string[],
    match: AssetCatalogTagMatch,
  ): readonly Readonly<AssetCatalogEntry>[] {
    if (tags.length === 0) return frozenArray([]);
    const uniqueTags = new Set(tags);
    return this.filter((entry) => {
      const entryTags = new Set([...entry.systemTags, ...entry.userTags]);
      const matches = [...uniqueTags].map((tag) => entryTags.has(tag));
      return match === "all" ? matches.every(Boolean) : matches.some(Boolean);
    });
  }

  findByTheme(theme: string): readonly Readonly<AssetCatalogEntry>[] {
    return this.filter((entry) => entry.theme === theme);
  }

  findByPerspective(
    perspective: string,
  ): readonly Readonly<AssetCatalogEntry>[] {
    return this.filter((entry) => entry.perspective === perspective);
  }

  findByCompatibleTemplate(
    template: ExactVersionedRef,
  ): readonly Readonly<AssetCatalogEntry>[] {
    return this.filter((entry) =>
      entry.compatibleTemplates.some(
        (reference) =>
          reference.id === template.id &&
          satisfiesVersionRange(template.version, reference.versionRange),
      ),
    );
  }

  findByCompatibleSurfaceType(
    surfaceType: string,
  ): readonly Readonly<AssetCatalogEntry>[] {
    return this.filter((entry) =>
      entry.compatibleSurfaceTypes.includes(surfaceType),
    );
  }

  findByCompatibleVisualObjectType(
    objectType: string,
  ): readonly Readonly<AssetCatalogEntry>[] {
    return this.filter((entry) =>
      entry.compatibleVisualObjectTypes.includes(objectType),
    );
  }

  private filter(
    predicate: (entry: Readonly<AssetCatalogEntry>) => boolean,
  ): readonly Readonly<AssetCatalogEntry>[] {
    return frozenArray(this.list().filter(predicate));
  }

  private assertVisualAssetDuplicates(assets: readonly VisualAsset[]): void {
    const batchKeys = new Set<string>();
    for (const asset of assets) {
      const key = versionKey(asset.id, asset.version);
      if (
        batchKeys.has(key) ||
        this.#visualAssets.get(asset.id)?.has(asset.version)
      ) {
        throw new AssetCatalogRegistryError(
          "asset_catalog_visual_asset_duplicate",
          `Visual Asset "${asset.id}@${asset.version}" is already registered.`,
        );
      }
      batchKeys.add(key);
    }
  }

  private assertEntryDuplicates(entries: readonly AssetCatalogEntry[]): void {
    const batchKeys = new Set<string>();
    for (const entry of entries) {
      const key = versionKey(entry.id, entry.version);
      if (
        batchKeys.has(key) ||
        this.#entries.get(entry.id)?.has(entry.version)
      ) {
        throw new AssetCatalogRegistryError(
          "asset_catalog_duplicate",
          `Asset Catalog entry "${entry.id}@${entry.version}" is already registered.`,
        );
      }
      batchKeys.add(key);
    }
  }

  private visualAssetKeys(): readonly string[] {
    return [...this.#visualAssets.entries()].flatMap(([id, versions]) =>
      [...versions.keys()].map((version) => versionKey(id, version)),
    );
  }

  private entryKeys(): readonly string[] {
    return [...this.#entries.entries()].flatMap(([id, versions]) =>
      [...versions.keys()].map((version) => versionKey(id, version)),
    );
  }
}

function assertEntryReferences(
  entry: AssetCatalogEntry,
  availableAssets: ReadonlySet<string>,
  availableEntries: ReadonlySet<string>,
): void {
  const assetReferences: readonly [
    string,
    ExactVersionedRef | undefined,
  ][] = [
    ["visualAssetRef", entry.visualAssetRef],
    ["thumbnailRef", entry.thumbnailRef],
    ["previewRef", entry.previewRef],
    ["layerPreviewRef", entry.layerPreviewRef],
  ];
  for (const [field, reference] of assetReferences) {
    if (
      reference &&
      !availableAssets.has(versionKey(reference.id, reference.version))
    ) {
      throw new AssetCatalogRegistryError(
        "asset_catalog_reference_missing",
        `Asset Catalog entry "${entry.id}@${entry.version}" ${field} references missing Visual Asset "${reference.id}@${reference.version}".`,
      );
    }
  }

  if (
    entry.replacement &&
    !availableEntries.has(
      versionKey(entry.replacement.id, entry.replacement.version),
    )
  ) {
    throw new AssetCatalogRegistryError(
      "asset_catalog_reference_missing",
      `Asset Catalog entry "${entry.id}@${entry.version}" replacement references missing entry "${entry.replacement.id}@${entry.replacement.version}".`,
    );
  }
}

function setVersioned<T>(
  target: Map<string, Map<string, T>>,
  id: string,
  version: string,
  value: T,
): void {
  const versions = target.get(id) ?? new Map<string, T>();
  versions.set(version, value);
  target.set(id, versions);
}

function versionKey(id: string, version: string): string {
  return `${id}\u0000${version}`;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function frozenArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}
