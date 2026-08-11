import {
  AssetCatalogRegistry,
  type AssetCatalogEntry,
  type AssetCatalogOrigin,
  type AssetCatalogScope,
  type BatchImportItemResult,
  type CatalogDraft,
  type DraftVisualAsset,
  type VisualAsset,
} from "../../theme-engine";
import {
  assetCatalogApi,
  type AssetCatalogApi,
  type PersistedAssetCatalogRecord,
} from "../../runtime/assetCatalogApi";

export const AssetLibraryStatus = {
  NeedsMetadata: "needs-metadata",
  ReadyForCatalog: "ready-for-catalog",
  Cataloged: "cataloged",
  Warning: "warning",
  Rejected: "rejected",
} as const;

export type AssetLibraryStatus =
  (typeof AssetLibraryStatus)[keyof typeof AssetLibraryStatus];

export type AssetLibraryViewId =
  | "all-assets"
  | "my-assets"
  | "current-theme"
  | "drafts"
  | "needs-attention";

export type AssetLibraryItemKind =
  | "cataloged"
  | "catalog-draft"
  | "technical-draft"
  | "rejected-import";

interface AssetLibraryItemBase {
  key: string;
  kind: AssetLibraryItemKind;
  name: string;
  description: string;
  category?: string;
  categoryLabel: string;
  scope?: AssetCatalogScope;
  origin?: AssetCatalogOrigin;
  theme?: string;
  status: AssetLibraryStatus;
  format?: string;
  systemTags: readonly string[];
  userTags: readonly string[];
  creatorName?: string;
  previewUrl?: string;
  previewFallbackReason?: string;
  issues: readonly Readonly<AssetLibraryIssue>[];
}

export interface AssetLibraryIssue {
  code: string;
  severity: "information" | "warning" | "error";
  message: string;
}

export interface CatalogedLibraryItem extends AssetLibraryItemBase {
  kind: "cataloged";
  status: typeof AssetLibraryStatus.Cataloged;
  catalogEntry: Readonly<AssetCatalogEntry>;
  visualAsset: Readonly<VisualAsset>;
}

export interface CatalogDraftLibraryItem extends AssetLibraryItemBase {
  kind: "catalog-draft";
  status:
    | typeof AssetLibraryStatus.NeedsMetadata
    | typeof AssetLibraryStatus.ReadyForCatalog
    | typeof AssetLibraryStatus.Warning;
  catalogDraft: Readonly<CatalogDraft>;
}

export interface TechnicalDraftLibraryItem extends AssetLibraryItemBase {
  kind: "technical-draft";
  status: typeof AssetLibraryStatus.NeedsMetadata;
  draftVisualAsset: Readonly<DraftVisualAsset>;
}

export interface RejectedImportLibraryItem extends AssetLibraryItemBase {
  kind: "rejected-import";
  status: typeof AssetLibraryStatus.Rejected;
  importResult: Readonly<BatchImportItemResult>;
}

export type AssetLibraryItem =
  | CatalogedLibraryItem
  | CatalogDraftLibraryItem
  | TechnicalDraftLibraryItem
  | RejectedImportLibraryItem;

export interface AssetLibraryFilters {
  category: string;
  scope: AssetCatalogScope | "";
  origin: AssetCatalogOrigin | "";
  status: AssetLibraryStatus | "";
}

export interface AssetLibraryQuery {
  view: AssetLibraryViewId;
  search: string;
  filters: Readonly<AssetLibraryFilters>;
}

export interface AssetLibraryPrototype {
  registry: AssetCatalogRegistry;
  items: readonly Readonly<AssetLibraryItem>[];
  currentTheme: string;
}

export const EMPTY_ASSET_LIBRARY_FILTERS: Readonly<AssetLibraryFilters> =
  Object.freeze({
    category: "",
    scope: "",
    origin: "",
    status: "",
  });

export const ASSET_LIBRARY_VIEWS: readonly Readonly<{
  id: AssetLibraryViewId;
  label: string;
  group: "Library" | "Work";
}>[] = Object.freeze([
  { id: "all-assets", label: "All Assets", group: "Library" },
  { id: "my-assets", label: "My Assets", group: "Library" },
  { id: "current-theme", label: "Current Theme", group: "Library" },
  { id: "drafts", label: "Drafts", group: "Work" },
  { id: "needs-attention", label: "Needs Attention", group: "Work" },
]);

export const ASSET_LIBRARY_STATUS_DETAILS: Readonly<
  Record<
    AssetLibraryStatus,
    Readonly<{ label: string; icon: string; explanation: string }>
  >
> = Object.freeze({
  [AssetLibraryStatus.NeedsMetadata]: Object.freeze({
    label: "Needs Metadata",
    icon: "!",
    explanation: "Required catalog information is incomplete.",
  }),
  [AssetLibraryStatus.ReadyForCatalog]: Object.freeze({
    label: "Ready for Catalog",
    icon: "✓",
    explanation: "Metadata is complete; catalog promotion remains explicit.",
  }),
  [AssetLibraryStatus.Cataloged]: Object.freeze({
    label: "Cataloged",
    icon: "◆",
    explanation: "Registered and discoverable in the Asset Catalog.",
  }),
  [AssetLibraryStatus.Warning]: Object.freeze({
    label: "Warning",
    icon: "△",
    explanation: "Usable media has a non-blocking concern.",
  }),
  [AssetLibraryStatus.Rejected]: Object.freeze({
    label: "Rejected",
    icon: "×",
    explanation: "Technical validation rejected the source file.",
  }),
});

/** Loads the rebuildable in-memory Registry projection from Runtime persistence. */
export async function createAssetLibraryPrototype(
  api: AssetCatalogApi = assetCatalogApi,
): Promise<Readonly<AssetLibraryPrototype>> {
  const result = await api.list();
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return projectAssetLibrary(result.data);
}

export function projectAssetLibrary(
  records: readonly Readonly<PersistedAssetCatalogRecord>[],
  sessionItems: readonly Readonly<AssetLibraryItem>[] = [],
): Readonly<AssetLibraryPrototype> {
  const registry = new AssetCatalogRegistry();
  registry.registerCatalog({
    visualAssets: records.map((record) => record.visualAsset),
    entries: records.map((record) => record.catalogEntry),
  });

  const catalogedItems = currentCatalogEntries(registry.list())
    .filter((entry) => !entry.deprecated)
    .map((entry) => {
      const record = records.find(
        (candidate) =>
          candidate.catalogEntry.id === entry.id
          && candidate.catalogEntry.version === entry.version,
      );
      if (record === undefined) {
        throw new Error(`Missing persisted record for "${entry.id}@${entry.version}".`);
      }
      return catalogedItem(entry, registry, record);
    });
  const items: readonly Readonly<AssetLibraryItem>[] = Object.freeze([
    ...catalogedItems,
    ...sessionItems,
  ]);
  const currentTheme =
    records.map((record) => record.catalogEntry)
      .find((entry) => entry.theme !== undefined)
      ?.theme ?? "";

  return Object.freeze({
    registry,
    items,
    currentTheme,
  });
}

export function replaceAssetLibrarySessionItems(
  prototype: Readonly<AssetLibraryPrototype>,
  sessionItems: readonly Readonly<AssetLibraryItem>[],
): Readonly<AssetLibraryPrototype> {
  const catalogedItems = prototype.items.filter((item) => item.kind === "cataloged");
  return Object.freeze({
    registry: prototype.registry,
    items: Object.freeze([...catalogedItems, ...sessionItems]),
    currentTheme: prototype.currentTheme,
  });
}

export function queryAssetLibrary(
  prototype: Readonly<AssetLibraryPrototype>,
  query: Readonly<AssetLibraryQuery>,
): readonly Readonly<AssetLibraryItem>[] {
  const normalizedSearch = normalizeSearch(query.search);
  return Object.freeze(
    prototype.items
      .filter((item) => belongsToView(item, query.view, prototype.currentTheme))
      .filter((item) => matchesSearch(item, normalizedSearch))
      .filter((item) => matchesFilters(item, query.filters))
      .sort(compareLibraryItems),
  );
}

export function countAssetLibraryView(
  prototype: Readonly<AssetLibraryPrototype>,
  view: AssetLibraryViewId,
): number {
  return queryAssetLibrary(prototype, {
    view,
    search: "",
    filters: EMPTY_ASSET_LIBRARY_FILTERS,
  }).length;
}

export function assetLibraryFacetValues(
  items: readonly Readonly<AssetLibraryItem>[],
  facet: "category" | "scope" | "origin",
): readonly string[] {
  return Object.freeze(
    [
      ...new Set(
        items
          .map((item) =>
            facet === "category" ? item.category : item[facet],
          )
          .filter((value): value is string => Boolean(value)),
      ),
    ].sort(compareText),
  );
}

export function catalogContextsFor(
  prototype: Readonly<AssetLibraryPrototype>,
  item: Readonly<AssetLibraryItem>,
): readonly Readonly<AssetCatalogEntry>[] {
  const reference = item.kind === "cataloged"
    ? item.catalogEntry.visualAssetRef
    : item.kind === "catalog-draft"
      ? item.catalogDraft.target.visualAssetRef
      : undefined;
  if (reference === undefined) return Object.freeze([]);
  return Object.freeze(
    prototype.registry
      .list()
      .filter(
        (entry) =>
          entry.visualAssetRef.id === reference.id
          && entry.visualAssetRef.version === reference.version,
      )
      .sort((left, right) =>
        compareText(left.id, right.id)
        || compareText(left.version, right.version),
      ),
  );
}

export function cardAccessibleLabel(item: Readonly<AssetLibraryItem>): string {
  const status = ASSET_LIBRARY_STATUS_DETAILS[item.status].label;
  const kind = item.kind === "cataloged" ? "cataloged asset" : "draft";
  const scope = item.scope === undefined ? "scope not assigned" : `${item.scope} scope`;
  const format = item.format === undefined ? "format unavailable" : item.format;
  return [
    item.name,
    kind,
    item.categoryLabel,
    scope,
    status,
    format,
  ].join(", ");
}

export type AssetGridNavigationKey =
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "ArrowDown"
  | "Home"
  | "End";

export function nextAssetGridIndex(
  currentIndex: number,
  key: AssetGridNavigationKey,
  columnCount: number,
  itemCount: number,
): number {
  if (itemCount <= 0) return -1;
  const current = Math.min(Math.max(currentIndex, 0), itemCount - 1);
  const columns = Math.max(1, Math.floor(columnCount));
  switch (key) {
    case "ArrowLeft":
      return Math.max(0, current - 1);
    case "ArrowRight":
      return Math.min(itemCount - 1, current + 1);
    case "ArrowUp":
      return Math.max(0, current - columns);
    case "ArrowDown":
      return Math.min(itemCount - 1, current + columns);
    case "Home":
      return 0;
    case "End":
      return itemCount - 1;
  }
}

export function humanizeAssetValue(value: string): string {
  const token = value.split(".").at(-1) ?? value;
  return token
    .split(/[-_]/u)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toLocaleUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function currentCatalogEntries(
  entries: readonly Readonly<AssetCatalogEntry>[],
): readonly Readonly<AssetCatalogEntry>[] {
  const current = new Map<string, Readonly<AssetCatalogEntry>>();
  for (const entry of entries) {
    const existing = current.get(entry.id);
    if (existing === undefined || compareSemver(existing.version, entry.version) < 0) {
      current.set(entry.id, entry);
    }
  }
  return [...current.values()];
}

function catalogedItem(
  entry: Readonly<AssetCatalogEntry>,
  registry: AssetCatalogRegistry,
  record: Readonly<PersistedAssetCatalogRecord>,
): Readonly<CatalogedLibraryItem> {
  const visualAsset = registry.getVisualAsset(entry.visualAssetRef);
  if (visualAsset === undefined) {
    throw new Error(
      `Catalog entry "${entry.id}@${entry.version}" has no VisualAsset record.`,
    );
  }
  return Object.freeze({
    key: `catalog:${entry.id}@${entry.version}`,
    kind: "cataloged",
    name: entry.displayName,
    description: entry.description,
    category: entry.category,
    categoryLabel: humanizeAssetValue(entry.category),
    scope: entry.scope,
    origin: entry.origin,
    theme: entry.theme,
    status: AssetLibraryStatus.Cataloged,
    format: visualAsset.format,
    systemTags: entry.systemTags,
    userTags: entry.userTags,
    creatorName: entry.creator.name,
    ...(record.previewUrl === undefined ? {} : { previewUrl: record.previewUrl }),
    ...(record.resourceAvailable
      ? {}
      : {
          previewFallbackReason:
            "The Catalog Entry is intact, but its original Resource is missing or invalid.",
        }),
    issues: record.resourceAvailable
      ? Object.freeze([])
      : Object.freeze([
          Object.freeze({
            code: "resource_missing",
            severity: "error" as const,
            message:
              "The original Resource is unavailable. Restore it and reload the Library.",
          }),
        ]),
    catalogEntry: entry,
    visualAsset,
  });
}

export function catalogDraftItem(
  draft: Readonly<CatalogDraft>,
  issues: readonly Readonly<AssetLibraryIssue>[],
): Readonly<CatalogDraftLibraryItem> {
  const metadata = draft.metadata;
  const status = draft.status !== "ready-for-catalog"
    ? AssetLibraryStatus.NeedsMetadata
    : issues.some((issue) => issue.severity === "warning")
      ? AssetLibraryStatus.Warning
      : AssetLibraryStatus.ReadyForCatalog;
  return Object.freeze({
    key: `draft:${draft.catalogDraftId}`,
    kind: "catalog-draft",
    name: metadata.displayName ?? draft.sourceVisualAsset.sourceFileName,
    description:
      metadata.description
      ?? "Technical validation passed; catalog metadata is incomplete.",
    category: metadata.category,
    categoryLabel:
      metadata.category === undefined
        ? "Uncategorized"
        : humanizeAssetValue(metadata.category),
    scope: metadata.scope,
    origin: metadata.origin,
    theme: metadata.theme,
    status,
    format: draft.sourceVisualAsset.format,
    systemTags: metadata.systemTags ?? Object.freeze([]),
    userTags: metadata.userTags ?? Object.freeze([]),
    creatorName: metadata.creator?.name,
    previewUrl: draftPreviewUrl(draft.sourceVisualAsset),
    issues: Object.freeze([...issues]),
    catalogDraft: draft,
  });
}

export function technicalDraftItem(
  draft: Readonly<DraftVisualAsset>,
  issues: readonly Readonly<AssetLibraryIssue>[],
): Readonly<TechnicalDraftLibraryItem> {
  return Object.freeze({
    key: `technical:${draft.draftId}`,
    kind: "technical-draft",
    name: draft.sourceFileName,
    description:
      "Technical validation passed. Catalog metadata has not been assigned.",
    categoryLabel: "Uncategorized",
    status: AssetLibraryStatus.NeedsMetadata,
    format: draft.format,
    systemTags: Object.freeze([]),
    userTags: Object.freeze([]),
    previewUrl: draftPreviewUrl(draft),
    issues: Object.freeze([...issues]),
    draftVisualAsset: draft,
  });
}

export function rejectedImportItem(
  result: Readonly<BatchImportItemResult>,
): Readonly<RejectedImportLibraryItem> {
  return Object.freeze({
    key: `rejected:${result.fileName}`,
    kind: "rejected-import",
    name: result.fileName,
    description:
      result.issues[0]?.message ?? "The source file cannot be imported.",
    categoryLabel: "Not an asset",
    status: AssetLibraryStatus.Rejected,
    systemTags: Object.freeze([]),
    userTags: Object.freeze([]),
    previewFallbackReason: "Rejected sources do not create a VisualAsset.",
    issues: result.issues,
    importResult: result,
  });
}

function belongsToView(
  item: Readonly<AssetLibraryItem>,
  view: AssetLibraryViewId,
  currentTheme: string,
): boolean {
  switch (view) {
    case "all-assets":
      return item.kind === "cataloged";
    case "my-assets":
      return item.kind === "cataloged" && item.scope === "personal";
    case "current-theme":
      return item.kind === "cataloged" && item.theme === currentTheme;
    case "drafts":
      return item.kind === "catalog-draft" || item.kind === "technical-draft";
    case "needs-attention":
      return item.status === AssetLibraryStatus.NeedsMetadata
        || item.status === AssetLibraryStatus.Warning
        || item.status === AssetLibraryStatus.Rejected;
  }
}

function matchesSearch(
  item: Readonly<AssetLibraryItem>,
  normalizedSearch: string,
): boolean {
  if (normalizedSearch === "") return true;
  const values = [
    item.name,
    item.description,
    item.category,
    item.categoryLabel,
    item.theme,
    item.creatorName,
    ...item.systemTags,
    ...item.userTags,
    item.kind === "cataloged" ? item.catalogEntry.id : undefined,
    item.kind === "cataloged" ? item.visualAsset.id : undefined,
    item.kind === "catalog-draft"
      ? item.catalogDraft.target.assetCatalogEntryId
      : undefined,
    item.kind === "catalog-draft"
      ? item.catalogDraft.target.visualAssetRef.id
      : undefined,
  ];
  return values.some(
    (value) =>
      value !== undefined && normalizeSearch(value).includes(normalizedSearch),
  );
}

function matchesFilters(
  item: Readonly<AssetLibraryItem>,
  filters: Readonly<AssetLibraryFilters>,
): boolean {
  return (filters.category === "" || item.category === filters.category)
    && (filters.scope === "" || item.scope === filters.scope)
    && (filters.origin === "" || item.origin === filters.origin)
    && (filters.status === "" || item.status === filters.status);
}

function compareLibraryItems(
  left: Readonly<AssetLibraryItem>,
  right: Readonly<AssetLibraryItem>,
): number {
  return compareText(left.name.toLocaleLowerCase(), right.name.toLocaleLowerCase())
    || compareText(left.key, right.key);
}

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function draftPreviewUrl(draft: Readonly<DraftVisualAsset>): string {
  const bytes = draft.read();
  let binary = "";
  for (let start = 0; start < bytes.length; start += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
  }
  return `data:${draft.mimeType};base64,${btoa(binary)}`;
}

function compareSemver(left: string, right: string): number {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return compareText(left, right);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
