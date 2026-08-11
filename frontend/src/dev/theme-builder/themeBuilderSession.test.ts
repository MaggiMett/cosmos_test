import { describe, expect, it } from "vitest";

import { validateThemeBuilderProject } from "../../theme-engine";
import { ThemeBuilderSession } from "./themeBuilderSession";
import { BuilderAssetCatalogIndex, BuilderAssetReferenceError } from "./themeBuilderAssetReferences";

describe("ThemeBuilderSession", () => {
  it("executes the one typed command with undo, redo and branch truncation", () => {
    const original = projectFixture();
    const session = new ThemeBuilderSession(original);
    session.execute({ type: "update-theme-metadata", metadata: { name: "One", description: "D1", author: "A1" } });
    expect(session.snapshot.project.name).toBe("One");
    expect(session.snapshot.project.manifestDraft.displayName).toBe("One");
    expect(session.snapshot.dirty).toBe(true);
    expect(original.name).toBe("Test Theme");
    session.undo();
    expect(session.snapshot.project.name).toBe("Test Theme");
    session.redo();
    expect(session.snapshot.project.name).toBe("One");
    session.undo();
    session.execute({ type: "update-theme-metadata", metadata: { name: "Branch", description: "", author: "" } });
    expect(session.snapshot.canRedo).toBe(false);
  });

  it("adopts the server revision only after save and reports stale conflicts", async () => {
    const session = new ThemeBuilderSession(projectFixture());
    session.execute({ type: "update-theme-metadata", metadata: { name: "Saved", description: "", author: "" } });
    const accepted = await session.save({
      saveDraft: async (_id, expectedRevision) => ({
        ok: true,
        data: validateThemeBuilderProject({ ...rawFixture(), revision: expectedRevision + 1, name: "Saved",
          description: "", author: "", manifestDraft: { ...rawFixture().manifestDraft,
            displayName: "Saved", description: "", author: undefined } }),
      }),
    });
    expect(accepted).toBe(true);
    expect(session.snapshot.project.revision).toBe(2);
    expect(session.snapshot.dirty).toBe(false);

    session.execute({ type: "update-theme-metadata", metadata: { name: "Conflict", description: "", author: "" } });
    await session.save({ saveDraft: async () => ({ ok: false, error: {
      kind: "http", status: 409, code: "theme_builder_project_revision_conflict", message: "Conflict",
    } }) });
    expect(session.snapshot.saveConflict?.status).toBe(409);
    expect(session.snapshot.project.name).toBe("Conflict");
  });

  it("keeps the authoritative revision when a new branch replaces saved history", async () => {
    const session = new ThemeBuilderSession(projectFixture());
    session.execute({ type: "update-theme-metadata", metadata: { name: "One", description: "", author: "" } });
    session.execute({ type: "update-theme-metadata", metadata: { name: "Two", description: "", author: "" } });
    await session.save({ saveDraft: async () => ({ ok: true, data: validateThemeBuilderProject({
      ...rawFixture(), revision: 2, name: "Two", description: "", author: "",
      manifestDraft: { ...rawFixture().manifestDraft, displayName: "Two", description: "" },
    }) }) });
    session.undo();
    session.undo();
    session.execute({ type: "update-theme-metadata", metadata: { name: "Branch", description: "", author: "" } });
    let sentRevision = 0;
    await session.save({ saveDraft: async (_id, revision) => {
      sentRevision = revision;
      return { ok: false, error: { kind: "http", message: "Stop" } };
    } });
    expect(sentRevision).toBe(2);
  });

  it("adds and removes validated exact references through the shared immutable history", () => {
    const session = new ThemeBuilderSession(projectFixture());
    const catalog = new BuilderAssetCatalogIndex([catalogRecord()]);
    session.execute({ type: "update-theme-metadata", metadata: { name: "Edited", description: "", author: "" } });
    session.execute({ type: "add-asset-reference", assetId: "personal.visual-asset.real" }, catalog);
    const added = session.snapshot.project;
    expect(added.assetRefs).toEqual([{ id: "personal.visual-asset.real", version: "1.0.0" }]);
    expect(Object.isFrozen(added.assetRefs)).toBe(true);
    expect(session.snapshot.dirty).toBe(true);
    session.execute({ type: "remove-asset-reference", reference: added.assetRefs[0]! });
    expect(session.snapshot.project.assetRefs).toEqual([]);
    session.undo();
    expect(session.snapshot.project.assetRefs).toHaveLength(1);
    session.undo();
    expect(session.snapshot.project.assetRefs).toEqual([]);
    expect(session.snapshot.project.name).toBe("Edited");
    session.redo();
    expect(session.snapshot.project.assetRefs).toHaveLength(1);
  });

  it("rejects unknown, unavailable and duplicate catalog references deterministically", () => {
    const session = new ThemeBuilderSession(projectFixture());
    const catalog = new BuilderAssetCatalogIndex([catalogRecord(), catalogRecord(false, "personal.visual-asset.offline")]);
    expect(() => session.execute({ type: "add-asset-reference", assetId: "unknown.asset" }, catalog))
      .toThrow(BuilderAssetReferenceError);
    expect(() => session.execute({ type: "add-asset-reference", assetId: "personal.visual-asset.offline" }, catalog))
      .toThrow("not currently usable");
    session.execute({ type: "add-asset-reference", assetId: "personal.visual-asset.real" }, catalog);
    expect(() => session.execute({ type: "add-asset-reference", assetId: "personal.visual-asset.real" }, catalog))
      .toThrow("already referenced");
  });

  it("saves current references in the same revision request and retains asset undo history", async () => {
    const session = new ThemeBuilderSession(projectFixture());
    session.execute(
      { type: "add-asset-reference", assetId: "personal.visual-asset.real" },
      new BuilderAssetCatalogIndex([catalogRecord()]),
    );
    let sentReferences: readonly { id: string; version: string }[] = [];
    await session.save({ saveDraft: async (_id, _revision, _metadata, assetRefs) => {
      sentReferences = assetRefs;
      return { ok: true, data: validateThemeBuilderProject({
        ...rawFixture(), revision: 2, assetRefs,
      }) };
    } });
    expect(sentReferences).toEqual([{ id: "personal.visual-asset.real", version: "1.0.0" }]);
    expect(session.snapshot.dirty).toBe(false);
    session.undo();
    expect(session.snapshot.project.assetRefs).toEqual([]);
    expect(session.snapshot.dirty).toBe(true);
    session.redo();
    expect(session.snapshot.project.assetRefs).toHaveLength(1);
  });
});

function catalogRecord(resourceAvailable = true, id = "personal.visual-asset.real") {
  return {
    visualAsset: { id, version: "1.0.0" },
    catalogEntry: { displayName: "Real Asset", category: "personal.category.decoration", deprecated: false },
    resourceAvailable,
    ...(resourceAvailable ? { previewUrl: `/api/assets/${id}` } : {}),
  } as never;
}

function projectFixture() { return validateThemeBuilderProject(rawFixture()); }
function rawFixture() {
  return {
    schemaVersion: 1, builderProjectId: "user.theme-builder-project.test", revision: 1,
    createdAt: "2026-08-09T10:00:00+00:00", updatedAt: "2026-08-09T10:00:00+00:00",
    contractVersions: { themeBuilder: "1.0.0", themeEngine: "1.0.0" }, themeId: "user.theme.test",
    packageId: "user.theme-package.test", name: "Test Theme", description: "A test draft.", author: "Tester",
    packageType: "full-theme", themeVersion: "0.1.0", packageVersion: "0.1.0",
    manifestDraft: { schemaVersion: 1, themeId: "user.theme.test", version: "0.1.0", displayName: "Test Theme",
      description: "A test draft.", packageKind: "full-theme", compatibility: { themeEngine: "^1.0.0" },
      groups: [], packRefs: [], tokens: {}, systemTerms: {}, author: { name: "Tester" } },
    artifacts: { skinPacks: [], roomShells: [], catalogObjects: [] }, assetRefs: [],
  };
}
