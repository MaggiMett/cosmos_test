import { describe, expect, it } from "vitest";

import {
  AssetCatalogRegistry,
  AssetCatalogRegistryError,
} from "./assetCatalogRegistry";
import { createCatalogCompletionFixture } from "./catalogCompletionFixtures";
import {
  CatalogPromotionService,
  CatalogPromotionServiceError,
} from "./catalogPromotionService";
import {
  CatalogCompletionStatus,
  type CatalogDraftMetadata,
  type CatalogPromotionTarget,
} from "./catalogCompletionTypes";
import {
  ThemeValidationError,
  validateVisualAsset,
} from "./validation";

describe("Catalog Completion validation", () => {
  it("keeps incomplete metadata as needs-metadata with explicit missing fields", async () => {
    const fixture = await createCatalogCompletionFixture();
    const draft = new CatalogPromotionService().createDraft({
      flow: "user-import",
      sourceVisualAsset: fixture.draftVisualAsset,
      target: fixture.target,
      metadata: fixture.incompleteMetadata,
    });

    expect(draft.status).toBe(CatalogCompletionStatus.NeedsMetadata);
    expect(draft.validation.missingFields).toEqual([
      "description",
      "category",
      "perspective",
      "orientation",
      "scaleClass",
      "creator",
      "provenance",
      "license",
      "compatibility",
      "systemTags",
    ]);
    expect(draft.validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "missing-required-metadata",
          field: "description",
        }),
      ]),
    );
  });

  it("accepts a technically valid draft with complete catalog metadata", async () => {
    const fixture = await createCatalogCompletionFixture();
    const draft = new CatalogPromotionService().createDraft({
      flow: "user-import",
      sourceVisualAsset: fixture.draftVisualAsset,
      target: fixture.target,
      metadata: fixture.completeMetadata,
    });

    expect(draft.sourceVisualAsset.lifecycle).toBe("draft");
    expect(draft.status).toBe(CatalogCompletionStatus.ReadyForCatalog);
    expect(draft.validation).toEqual({
      status: CatalogCompletionStatus.ReadyForCatalog,
      missingFields: [],
      issues: [],
    });
    expect(Object.isFrozen(draft)).toBe(true);
    expect(Object.isFrozen(draft.metadata)).toBe(true);
    expect(Object.isFrozen(draft.validation.issues)).toBe(true);
  });

  it("returns schema-backed errors for invalid supplied metadata", async () => {
    const fixture = await createCatalogCompletionFixture();
    const metadata: CatalogDraftMetadata = {
      ...fixture.completeMetadata,
      displayName: "",
      category: "Not a namespaced id",
      compatibility: {
        compatibleTemplates: [{
          id: "core.room.standard",
          versionRange: "not-a-version-range",
        }],
        compatibleSurfaceTypes: ["floor", "floor"],
        compatibleVisualObjectTypes: [],
      },
    };
    const draft = new CatalogPromotionService().createDraft({
      flow: "user-import",
      sourceVisualAsset: fixture.draftVisualAsset,
      target: fixture.target,
      metadata,
    });

    expect(draft.status).toBe(CatalogCompletionStatus.NeedsMetadata);
    expect(draft.validation.missingFields).toEqual([]);
    expect(draft.validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "invalid-metadata",
          field: "displayName",
        }),
        expect.objectContaining({
          code: "invalid-metadata",
          field: "category",
        }),
        expect.objectContaining({
          code: "invalid-metadata",
          field: "compatibleSurfaceTypes",
        }),
      ]),
    );

    const versionRangeDraft = new CatalogPromotionService().createDraft({
      flow: "user-import",
      sourceVisualAsset: fixture.draftVisualAsset,
      target: fixture.target,
      metadata: {
        ...fixture.completeMetadata,
        compatibility: {
          compatibleTemplates: [{
            id: "core.room.standard",
            versionRange: "not-a-version-range",
          }],
          compatibleSurfaceTypes: [],
          compatibleVisualObjectTypes: [],
        },
      },
    });
    expect(versionRangeDraft.validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "invalid-metadata",
          field: "compatibleTemplates",
        }),
      ]),
    );
  });

  it("allows personal and theme scopes for normal import", async () => {
    const fixture = await createCatalogCompletionFixture();
    const service = new CatalogPromotionService();

    for (const scope of ["personal", "theme"] as const) {
      const draft = service.createDraft({
        flow: "user-import",
        sourceVisualAsset: fixture.draftVisualAsset,
        target: fixture.target,
        metadata: { ...fixture.completeMetadata, scope },
      });
      expect(draft.status).toBe(CatalogCompletionStatus.ReadyForCatalog);
    }
  });

  it("rejects core scope and built-in origin in the user-import flow", async () => {
    const fixture = await createCatalogCompletionFixture();
    const draft = new CatalogPromotionService().createDraft({
      flow: "user-import",
      sourceVisualAsset: fixture.draftVisualAsset,
      target: fixture.target,
      metadata: {
        ...fixture.completeMetadata,
        scope: "core",
        origin: "built-in",
      },
    });

    expect(draft.status).toBe(CatalogCompletionStatus.NeedsMetadata);
    expect(draft.validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "scope-not-allowed", field: "scope" }),
        expect.objectContaining({ code: "origin-not-allowed", field: "origin" }),
      ]),
    );
  });

  it("requires imported origin for every normal file import", async () => {
    const fixture = await createCatalogCompletionFixture();
    const service = new CatalogPromotionService();

    for (const origin of ["built-in", "generated"] as const) {
      const draft = service.createDraft({
        flow: "user-import",
        sourceVisualAsset: fixture.draftVisualAsset,
        target: fixture.target,
        metadata: { ...fixture.completeMetadata, origin },
      });
      expect(draft.status).toBe(CatalogCompletionStatus.NeedsMetadata);
      expect(draft.validation.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "origin-not-allowed" }),
        ]),
      );
    }
  });

  it("reserves the core and built-in pair for the explicit internal flow", async () => {
    const fixture = await createCatalogCompletionFixture();
    const draft = new CatalogPromotionService().createDraft({
      flow: "core-internal",
      sourceVisualAsset: fixture.draftVisualAsset,
      target: {
        ...fixture.target,
        assetCatalogEntryId: "core.asset-catalog.internal-fixture",
      },
      metadata: {
        ...fixture.completeMetadata,
        scope: "core",
        origin: "built-in",
      },
    });

    expect(draft.status).toBe(CatalogCompletionStatus.ReadyForCatalog);
  });
});

describe("Catalog promotion", () => {
  it("never promotes automatically while creating or completing a draft", async () => {
    const fixture = await createCatalogCompletionFixture();
    const registry = new AssetCatalogRegistry();
    registry.registerVisualAsset(fixture.registeredVisualAsset);
    const service = new CatalogPromotionService();

    const incomplete = service.createDraft({
      flow: "user-import",
      sourceVisualAsset: fixture.draftVisualAsset,
      target: fixture.target,
      metadata: fixture.incompleteMetadata,
    });
    const ready = service.setMetadata(incomplete, fixture.completeMetadata);

    expect(incomplete.status).toBe(CatalogCompletionStatus.NeedsMetadata);
    expect(ready.status).toBe(CatalogCompletionStatus.ReadyForCatalog);
    expect(registry.list()).toHaveLength(0);
  });

  it("promotes only a complete draft", async () => {
    const fixture = await createCatalogCompletionFixture();
    const registry = new AssetCatalogRegistry();
    registry.registerVisualAsset(fixture.registeredVisualAsset);
    const service = new CatalogPromotionService();
    const draft = service.createDraft({
      flow: "user-import",
      sourceVisualAsset: fixture.draftVisualAsset,
      target: fixture.target,
      metadata: fixture.incompleteMetadata,
    });

    expect(() => service.promote(draft, registry)).toThrow(
      CatalogPromotionServiceError,
    );
    expect(registry.list()).toHaveLength(0);
  });

  it("creates and registers exactly one AssetCatalogEntry per promotion", async () => {
    const { fixture, registry, service, draft } = await readySetup();
    const result = service.promote(draft, registry);

    expect(registry.list()).toHaveLength(1);
    expect(result.assetCatalogEntry).toBe(registry.list()[0]);
    expect(result.assetCatalogEntry).toMatchObject({
      id: fixture.target.assetCatalogEntryId,
      version: fixture.target.version,
      visualAssetRef: fixture.target.visualAssetRef,
      scope: "personal",
      origin: "imported",
      userTags: ["swatch"],
      deprecated: false,
    });
    expect(result.assetCatalogEntry).not.toHaveProperty("thumbnailRef");
    expect(result.assetCatalogEntry).not.toHaveProperty("previewRef");
  });

  it("retains the registry duplicate guard for repeated promotion", async () => {
    const { registry, service, draft } = await readySetup();
    service.promote(draft, registry);

    expect(() => service.promote(draft, registry)).toThrow(
      AssetCatalogRegistryError,
    );
    expect(registry.list()).toHaveLength(1);
  });

  it("requires the registered VisualAsset to match the technical draft", async () => {
    const fixture = await createCatalogCompletionFixture();
    const registry = new AssetCatalogRegistry();
    registry.registerVisualAsset({
      ...fixture.registeredVisualAsset,
      sha256: "f".repeat(64),
    });
    const service = new CatalogPromotionService();
    const draft = service.createDraft({
      flow: "user-import",
      sourceVisualAsset: fixture.draftVisualAsset,
      target: fixture.target,
      metadata: fixture.completeMetadata,
    });

    expect(() => service.promote(draft, registry)).toThrow(
      /does not match the technical draft/,
    );
    expect(registry.list()).toHaveLength(0);
  });

  it("derives deterministic thumbnail and detail descriptors without VisualAssets", async () => {
    const fixture = await createCatalogCompletionFixture();
    const service = new CatalogPromotionService();
    const input = {
      flow: "user-import" as const,
      sourceVisualAsset: fixture.draftVisualAsset,
      target: fixture.target,
      metadata: fixture.completeMetadata,
    };
    const first = service.createDraft(input);
    const second = service.createDraft(input);

    expect(first.automaticPreviews).toEqual(second.automaticPreviews);
    expect(first.automaticPreviews.thumbnail).toMatchObject({
      resourceKind: "derived-catalog-resource",
      role: "thumbnail",
      sourceSha256: fixture.draftVisualAsset.sha256,
    });
    expect(first.automaticPreviews.detailPreview.role).toBe("detail-preview");
    expect(Object.isFrozen(first.automaticPreviews.thumbnail)).toBe(true);
    expect(() =>
      validateVisualAsset(first.automaticPreviews.thumbnail)
    ).toThrow(ThemeValidationError);
  });

  it("does not mutate caller metadata, target or source bytes", async () => {
    const fixture = await createCatalogCompletionFixture();
    const tags = ["personal.tag.mutable"];
    const creator = { name: "Mutable Artist" };
    const metadata: CatalogDraftMetadata = {
      ...fixture.completeMetadata,
      displayName: "Before",
      systemTags: tags,
      creator,
    };
    const target: CatalogPromotionTarget = {
      assetCatalogEntryId: fixture.target.assetCatalogEntryId,
      version: fixture.target.version,
      visualAssetRef: { ...fixture.target.visualAssetRef },
    };
    const service = new CatalogPromotionService();
    const draft = service.createDraft({
      flow: "user-import",
      sourceVisualAsset: fixture.draftVisualAsset,
      target,
      metadata,
    });

    metadata.displayName = "After";
    tags.push("personal.tag.changed");
    creator.name = "Changed Artist";
    target.assetCatalogEntryId = "personal.asset-catalog.changed";
    const read = draft.sourceVisualAsset.read();
    read[0] = 0;

    expect(draft.metadata.displayName).toBe("Before");
    expect(draft.metadata.systemTags).toEqual(["personal.tag.mutable"]);
    expect(draft.metadata.creator?.name).toBe("Mutable Artist");
    expect(draft.target.assetCatalogEntryId).toBe(
      fixture.target.assetCatalogEntryId,
    );
    expect(draft.sourceVisualAsset.read()[0]).not.toBe(0);
  });

  it("creates no visual, interaction, function or runtime model", async () => {
    const { registry, service, draft } = await readySetup();
    const visualAssetCount = registry.listVisualAssets().length;
    const result = service.promote(draft, registry);
    const serializedKeys = Object.keys(result.assetCatalogEntry);

    expect(registry.listVisualAssets()).toHaveLength(visualAssetCount);
    expect(serializedKeys).not.toEqual(expect.arrayContaining([
      "visualObjectDefinition",
      "visualObjectInstance",
      "interactionZone",
      "interactionZoneProfile",
      "functionBinding",
      "functionDefinitionPack",
      "runtimeTarget",
      "runtimeFunction",
    ]));
  });
});

async function readySetup() {
  const fixture = await createCatalogCompletionFixture();
  const registry = new AssetCatalogRegistry();
  registry.registerVisualAsset(fixture.registeredVisualAsset);
  const service = new CatalogPromotionService();
  const draft = service.createDraft({
    flow: "user-import",
    sourceVisualAsset: fixture.draftVisualAsset,
    target: fixture.target,
    metadata: fixture.completeMetadata,
  });
  return { fixture, registry, service, draft };
}
