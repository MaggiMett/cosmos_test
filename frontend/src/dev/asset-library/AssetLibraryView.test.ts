import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { compileTemplate, parse } from "vue/compiler-sfc";
import { describe, expect, it } from "vitest";

import { ASSET_LIBRARY_VIEWS } from "./assetLibraryPrototype";

const viewSource = readFileSync(
  fileURLToPath(new URL("./AssetLibraryView.vue", import.meta.url)),
  "utf8",
);
const appSource = readFileSync(
  fileURLToPath(new URL("../../App.vue", import.meta.url)),
  "utf8",
);
const descriptor = parse(viewSource, {
  filename: "AssetLibraryView.vue",
}).descriptor;

describe("Asset Library development rendering", () => {
  it("compiles the complete interactive template without rendering errors", () => {
    const template = descriptor.template;
    expect(template).toBeDefined();
    if (template === null) throw new Error("Asset Library template missing.");

    const compiled = compileTemplate({
      id: "asset-library-prototype",
      filename: "AssetLibraryView.vue",
      source: template.content,
    });

    expect(compiled.errors).toEqual([]);
    expect(compiled.code).toContain("asset-library__header");
    expect(compiled.code).toContain("asset-library-grid");
    expect(compiled.code).toContain("asset-library-detail");
  });

  it("renders the five binding views, grid hierarchy and filter controls", () => {
    expect(ASSET_LIBRARY_VIEWS.map((view) => view.label)).toEqual([
      "All Assets",
      "My Assets",
      "Current Theme",
      "Drafts",
      "Needs Attention",
    ]);
    expect(viewSource).toContain('role="grid"');
    expect(viewSource).toContain('role="gridcell"');
    expect(viewSource).toContain('data-testid="filter-category"');
    expect(viewSource).toContain('data-testid="filter-scope"');
    expect(viewSource).toContain('data-testid="filter-origin"');
    expect(viewSource).toContain('data-testid="filter-status"');
  });

  it("renders status as icon and text rather than color alone", () => {
    expect(viewSource).toContain("statusDetails(item.status).icon");
    expect(viewSource).toContain("statusDetails(item.status).label");
    expect(viewSource).toContain('data-status="item.status"');
    expect(viewSource).toContain("Status:");
  });

  it("renders preview controls, detail, metadata completion, and explicit promotion", () => {
    expect(viewSource).toContain("Fallback Preview");
    expect(viewSource).toContain("Checkerboard");
    expect(viewSource).toContain("Light neutral");
    expect(viewSource).toContain("Dark neutral");
    expect(viewSource).toContain("Creator and rights");
    expect(viewSource).toContain("Compatibility");
    expect(viewSource).toContain("Catalog contexts");
    expect(viewSource).toContain("File version");
    expect(viewSource).toContain("Catalog revision");
    expect(viewSource).toContain("Preview resources");
    expect(viewSource).toContain("Technical information");
    expect(viewSource).toContain("Apply catalog metadata");
    expect(viewSource).toContain("Add to Catalog");
    expect(viewSource).toContain('data-testid="catalog-metadata-editor"');
    expect(viewSource).toContain('data-testid="catalog-promote-action"');
  });

  it("wires keyboard focus, arrow navigation and focus restoration", () => {
    expect(viewSource).toContain(":tabindex=\"focusedIndex === index ? 0 : -1\"");
    expect(viewSource).toContain("@keydown=\"navigateCard($event, index)\"");
    expect(viewSource).toContain("nextAssetGridIndex");
    expect(viewSource).toContain("detailHeading.value?.focus()");
    expect(viewSource).toContain("searchInput.value?.focus()");
    expect(viewSource).toContain("Back to asset grid");
  });

  it("uses Runtime persistence while staying isolated from downstream models", () => {
    const script = descriptor.scriptSetup?.content ?? "";

    expect(script).toContain("../../runtime/assetCatalogApi");
    expect(script).toContain("AssetImportService");
    expect(script).toContain("prepareCatalogPersistence");
    expect(script).not.toContain("localStorage");
    expect(script).not.toContain("sessionStorage");
    expect(script).not.toContain("VisualObjectDefinition");
    expect(script).not.toContain("InteractionZone");
    expect(script).not.toContain("FunctionBinding");
    expect(appSource).toContain('v-if="route.meta.developmentPreview"');
    expect(appSource).not.toContain("AssetLibraryView");
  });
});
