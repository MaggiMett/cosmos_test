import { describe, expect, it } from "vitest";

import { createCanonicalAssetImportFixtures } from "./assetImportFixtures";
import { AssetImportService } from "./assetImportService";
import {
  createImportedCatalogTarget,
  prepareCatalogPersistence,
} from "./catalogPersistenceHandoff";
import { CatalogPromotionService } from "./catalogPromotionService";

describe("persistent Catalog promotion handoff", () => {
  it("turns a validated static import into strict records plus original bytes only explicitly", async () => {
    const source = createCanonicalAssetImportFixtures().svg;
    const imported = await new AssetImportService().importFiles([source]);
    const technicalDraft = imported.items[0]?.draftVisualAsset;
    if (technicalDraft === undefined) throw new Error("Import draft missing.");

    const completion = new CatalogPromotionService();
    const catalogDraft = completion.createDraft({
      flow: "user-import",
      sourceVisualAsset: technicalDraft,
      target: createImportedCatalogTarget(technicalDraft),
      metadata: {
        displayName: "Persistent Vector",
        description: "A real validated SVG prepared for Runtime persistence.",
        category: "personal.category.decoration",
        scope: "personal",
        origin: "imported",
        systemTags: ["cosmos.asset.visual"],
        userTags: ["green"],
        perspective: "unspecified",
        orientation: "square",
        scaleClass: "small",
        creator: { name: "Cosmos Tester" },
        provenance: { kind: "imported", source: source.fileName },
        license: { expression: "CC0-1.0" },
        compatibility: {
          compatibleTemplates: [],
          compatibleSurfaceTypes: [],
          compatibleVisualObjectTypes: [],
        },
      },
    });

    expect(catalogDraft.status).toBe("ready-for-catalog");
    const prepared = prepareCatalogPersistence(catalogDraft);

    expect(prepared.originalBytes).toEqual(source.bytes);
    expect(prepared.visualAsset.sha256).toBe(technicalDraft.sha256);
    expect(prepared.visualAsset.path).toBe(
      `visual-assets/${prepared.visualAsset.id}/1.0.0/original.svg`,
    );
    expect(prepared.catalogEntry.visualAssetRef).toEqual({
      id: prepared.visualAsset.id,
      version: prepared.visualAsset.version,
    });
    expect(JSON.stringify(prepared).toLocaleLowerCase()).not.toContain(
      "interactionzone",
    );
    expect(JSON.stringify(prepared).toLocaleLowerCase()).not.toContain(
      "functionbinding",
    );
    expect(JSON.stringify(prepared).toLocaleLowerCase()).not.toContain(
      "placement",
    );
  });

  it("cannot prepare persistence before required metadata is complete", async () => {
    const source = createCanonicalAssetImportFixtures().png;
    const imported = await new AssetImportService().importFiles([source]);
    const technicalDraft = imported.items[0]?.draftVisualAsset;
    if (technicalDraft === undefined) throw new Error("Import draft missing.");
    const completion = new CatalogPromotionService();
    const incomplete = completion.createDraft({
      flow: "user-import",
      sourceVisualAsset: technicalDraft,
      target: createImportedCatalogTarget(technicalDraft),
      metadata: { origin: "imported" },
    });

    expect(() => prepareCatalogPersistence(incomplete)).toThrow(
      /not ready for promotion/,
    );
  });
});
