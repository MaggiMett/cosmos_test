import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { compileTemplate, parse } from "vue/compiler-sfc";
import { describe, expect, it } from "vitest";

const files = [
  "./ThemeBoardView.vue",
  "./components/ThemeBuilderShell.vue",
  "./components/BuilderTopNavigation.vue",
  "./components/StudioRail.vue",
  "./components/HeroCard.vue",
  "./components/MoodboardGrid.vue",
  "./components/ContinueWorking.vue",
  "./components/ThemeCoverage.vue",
  "./components/ThemeBoardAssets.vue",
  "./components/BuilderAssetPicker.vue",
] as const;

function sourceFor(path: (typeof files)[number]): string {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
}

describe("Theme Board vertical slice", () => {
  it.each(files)("compiles %s without template errors", (path) => {
    const source = sourceFor(path);
    const descriptor = parse(source, { filename: path }).descriptor;
    const template = descriptor.template;
    expect(template).toBeDefined();
    if (template === null) throw new Error(`${path} template missing.`);

    const compiled = compileTemplate({
      id: `theme-board-${path}`,
      filename: path,
      source: template.content,
    });

    expect(compiled.errors).toEqual([]);
  });

  it("composes the required visual architecture from reusable components", () => {
    const source = sourceFor("./ThemeBoardView.vue");

    expect(source).toContain("<ThemeBuilderShell");
    expect(source).toContain("<HeroCard");
    expect(source).toContain("<MoodboardGrid");
    expect(source).toContain("<ContinueWorking");
    expect(source).toContain("<ThemeCoverage");
    expect(source).toContain("<ThemeBoardAssets");
    expect(source).toContain("<BuilderAssetPicker");
    expect(source).toContain('studio-label="Theme Board"');
    expect(source).toContain('class="theme-board__hero-grid"');
    expect(source).toContain("<details class=\"theme-board__metadata\">");
  });

  it("refreshes the persistent catalog whenever the asset picker opens", () => {
    const source = sourceFor("./ThemeBoardView.vue");
    expect(source).toContain("function openAssetPicker(): void");
    expect(source).toContain("void loadCatalog();");
    expect(source).toContain('type: "add-asset-reference"');
  });

  it("offers repair for unavailable references by replacing them through the fresh picker", () => {
    const source = sourceFor("./ThemeBoardView.vue");
    const assets = sourceFor("./components/ThemeBoardAssets.vue");
    expect(assets).toContain("Find replacement");
    expect(assets).toContain("item.status !== 'available'");
    expect(source).toContain("function repairAsset");
    expect(source).toContain('type: "remove-asset-reference"');
    expect(source).toContain("openAssetPicker();");
  });

  it("keeps the Builder shell separate from Runtime navigation and state", () => {
    const source = sourceFor("./components/ThemeBuilderShell.vue");
    const railSource = sourceFor("./components/StudioRail.vue");
    const topbarSource = sourceFor("./components/BuilderTopNavigation.vue");

    expect(source).toContain('data-testid="theme-builder-shell"');
    expect(railSource).toContain('data-testid="studio-rail"');
    expect(topbarSource).toContain('data-testid="builder-top-navigation"');
    expect(source).toContain('data-testid="right-context-panel"');
    expect(source).not.toContain("ApplicationShell");
    expect(source).not.toContain("CosmosNavigation");
    expect(source).not.toContain("useCosmosRuntime");
    expect(source).toContain("onBeforeRouteLeave");
    expect(source).toContain('window.addEventListener("beforeunload", handleBeforeUnload)');
    expect(topbarSource).toContain("Revision conflict · Reload");
    expect(topbarSource).toContain("!canSave || saving || saveConflict");
  });

  it("loads an explicit persistent project and contains no fixture artifacts", () => {
    const source = sourceFor("./ThemeBoardView.vue");

    expect(source).toContain("route.query.builderProjectId");
    expect(source).toContain("themeBuilderProjectApi.get(projectId)");
    expect(source).toContain("ThemeBuilderSession");
    expect(source).toContain("Create a Theme Builder Project");
    expect(source).toContain("HeroCard unavailable");
    expect(source).toContain('MoodboardGrid :items="[]"');
    expect(source).not.toContain("Main Room Shell");
    expect(source).not.toContain("Orbital Window");
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("ThemeRuntime");
    expect(source).toContain("assetCatalogApi.list()");
    expect(source).toContain('type: "add-asset-reference"');
    expect(source).toContain('type: "remove-asset-reference"');
    expect(source).not.toContain("assetCatalogApi.promote");
  });
});
