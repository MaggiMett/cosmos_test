import { describe, expect, it } from "vitest";

import { validateThemeBuilderProject } from "../../theme-engine";
import { projectBuilderAssets } from "./themeBuilderAssetReferences";

describe("Builder Asset presentation", () => {
  it("uses Catalog name, category and Resource preview without copying them into the draft", () => {
    const project = validateThemeBuilderProject({
      ...projectFixture(),
      assetRefs: [{ id: "personal.visual-asset.real", version: "1.0.0" }],
    });
    const items = projectBuilderAssets(project, [{
      visualAsset: { id: "personal.visual-asset.real", version: "1.0.0" },
      catalogEntry: { displayName: "Catalog Name", category: "personal.category.decor", deprecated: false },
      resourceAvailable: true,
      previewUrl: "/api/asset-catalog/visual-assets/real/versions/1.0.0/content",
    } as never]);
    expect(items[0]).toMatchObject({
      name: "Catalog Name",
      category: "personal.category.decor",
      status: "available",
      previewUrl: "/api/asset-catalog/visual-assets/real/versions/1.0.0/content",
    });
    expect(project.assetRefs[0]).toEqual({ id: "personal.visual-asset.real", version: "1.0.0" });
  });

  it("keeps missing and unavailable references visible", () => {
    const project = validateThemeBuilderProject({
      ...projectFixture(),
      assetRefs: [{ id: "personal.visual-asset.missing", version: "1.0.0" }],
    });
    expect(projectBuilderAssets(project, [])[0]?.status).toBe("missing");
    expect(projectBuilderAssets(project, [], false)[0]?.status).toBe("unavailable");
    expect(project.assetRefs).toHaveLength(1);
  });
});

function projectFixture() {
  return {
    schemaVersion: 1, builderProjectId: "user.theme-builder-project.test", revision: 1,
    createdAt: "2026-08-09T10:00:00+00:00", updatedAt: "2026-08-09T10:00:00+00:00",
    contractVersions: { themeBuilder: "1.0.0", themeEngine: "1.0.0" }, themeId: "user.theme.test",
    packageId: "user.theme-package.test", name: "Test Theme", description: "", author: "",
    packageType: "full-theme", themeVersion: "0.1.0", packageVersion: "0.1.0",
    manifestDraft: { schemaVersion: 1, themeId: "user.theme.test", version: "0.1.0",
      displayName: "Test Theme", description: "", packageKind: "full-theme",
      compatibility: { themeEngine: "^1.0.0" }, groups: [], packRefs: [], tokens: {}, systemTerms: {} },
    artifacts: { skinPacks: [], roomShells: [], catalogObjects: [] }, assetRefs: [],
  };
}
