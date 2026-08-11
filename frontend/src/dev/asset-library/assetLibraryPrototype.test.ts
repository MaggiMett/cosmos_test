import { describe, expect, it } from "vitest";

import {
  canonicalAssetCatalogEntries,
  canonicalVisualAssets,
} from "../../theme-engine";
import type { PersistedAssetCatalogRecord } from "../../runtime/assetCatalogApi";
import {
  AssetLibraryStatus,
  cardAccessibleLabel,
  catalogContextsFor,
  nextAssetGridIndex,
  projectAssetLibrary,
  queryAssetLibrary,
  type AssetLibraryFilters,
  type AssetLibraryPrototype,
  type AssetLibraryViewId,
} from "./assetLibraryPrototype";

const noFilters: AssetLibraryFilters = {
  category: "",
  scope: "",
  origin: "",
  status: "",
};

describe("Asset Library persistent projection", () => {
  const prototype = projectAssetLibrary(persistedRecords());

  it("loads real Runtime records into the existing Registry projection", () => {
    const cataloged = query(prototype, "all-assets");

    expect(cataloged).toHaveLength(2);
    expect(cataloged.every((item) => item.kind === "cataloged")).toBe(true);
    expect(query(prototype, "drafts")).toEqual([]);
    expect(query(prototype, "my-assets").map((item) => item.name))
      .toEqual(["Personal Bookshelf"]);
    expect(query(prototype, "current-theme").map((item) => item.name))
      .toEqual(["Theme Door"]);
  });

  it("uses persisted previews and exposes a missing Resource as attention", () => {
    const personal = query(prototype, "my-assets")[0];
    const theme = query(prototype, "current-theme")[0];

    expect(personal?.previewUrl).toBe("/api/asset/personal-bookshelf");
    expect(personal?.issues).toEqual([]);
    expect(theme?.previewUrl).toBeUndefined();
    expect(theme?.issues[0]?.code).toBe("resource_missing");
    expect(theme?.issues[0]?.severity).toBe("error");
  });

  it("searches and filters persisted metadata without mixing drafts", () => {
    expect(search(prototype, "all-assets", "green").map((item) => item.name))
      .toEqual(["Personal Bookshelf"]);
    expect(filtered(prototype, "all-assets", {
      ...noFilters,
      scope: "theme",
      origin: "imported",
      status: AssetLibraryStatus.Cataloged,
    }).map((item) => item.name)).toEqual(["Theme Door"]);
  });

  it("exposes exact Catalog contexts and no downstream behavior records", () => {
    const bookshelf = query(prototype, "my-assets")[0];
    if (bookshelf?.kind !== "cataloged") throw new Error("Catalog record missing.");

    expect(catalogContextsFor(prototype, bookshelf).map((entry) => entry.id))
      .toEqual(["personal.asset-catalog.bookshelf"]);
    expect(cardAccessibleLabel(bookshelf)).toContain(
      "Personal Bookshelf, cataloged asset",
    );
    const serialized = JSON.stringify(prototype.items).toLocaleLowerCase();
    expect(serialized).not.toContain("visualobjectdefinition");
    expect(serialized).not.toContain("interactionzone");
    expect(serialized).not.toContain("functionbinding");
  });
});

describe("Asset Library keyboard navigation", () => {
  it("moves through a roving grid without leaving its bounds", () => {
    expect(nextAssetGridIndex(0, "ArrowLeft", 3, 8)).toBe(0);
    expect(nextAssetGridIndex(0, "ArrowRight", 3, 8)).toBe(1);
    expect(nextAssetGridIndex(1, "ArrowDown", 3, 8)).toBe(4);
    expect(nextAssetGridIndex(4, "ArrowUp", 3, 8)).toBe(1);
    expect(nextAssetGridIndex(7, "ArrowDown", 3, 8)).toBe(7);
    expect(nextAssetGridIndex(4, "Home", 3, 8)).toBe(0);
    expect(nextAssetGridIndex(4, "End", 3, 8)).toBe(7);
    expect(nextAssetGridIndex(0, "Home", 3, 0)).toBe(-1);
  });
});

function persistedRecords(): readonly Readonly<PersistedAssetCatalogRecord>[] {
  const firstAsset = canonicalVisualAssets[0]!;
  const secondAsset = canonicalVisualAssets[1]!;
  const firstEntry = canonicalAssetCatalogEntries[0]!;
  const secondEntry = canonicalAssetCatalogEntries[1]!;
  const { theme: _theme, ...personalEntry } = firstEntry;
  return [
    {
      visualAsset: firstAsset,
      catalogEntry: {
        ...personalEntry,
        id: "personal.asset-catalog.bookshelf",
        visualAssetRef: { id: firstAsset.id, version: firstAsset.version },
        displayName: "Personal Bookshelf",
        scope: "personal",
        origin: "imported",
        userTags: ["green"],
      },
      resourceAvailable: true,
      previewUrl: "/api/asset/personal-bookshelf",
    },
    {
      visualAsset: secondAsset,
      catalogEntry: {
        ...secondEntry,
        id: "personal.asset-catalog.theme-door",
        visualAssetRef: { id: secondAsset.id, version: secondAsset.version },
        displayName: "Theme Door",
        scope: "theme",
        origin: "imported",
        theme: "personal.theme.studio",
      },
      resourceAvailable: false,
    },
  ];
}

function query(
  prototype: Readonly<AssetLibraryPrototype>,
  view: AssetLibraryViewId,
) {
  return queryAssetLibrary(prototype, {
    view,
    search: "",
    filters: noFilters,
  });
}

function search(
  prototype: Readonly<AssetLibraryPrototype>,
  view: AssetLibraryViewId,
  searchValue: string,
) {
  return queryAssetLibrary(prototype, {
    view,
    search: searchValue,
    filters: noFilters,
  });
}

function filtered(
  prototype: Readonly<AssetLibraryPrototype>,
  view: AssetLibraryViewId,
  filters: Readonly<AssetLibraryFilters>,
) {
  return queryAssetLibrary(prototype, {
    view,
    search: "",
    filters,
  });
}
