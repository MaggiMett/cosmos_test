import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { compileScript, compileTemplate, parse } from "vue/compiler-sfc";
import { describe, expect, it } from "vitest";

const files = [
  "./CosmosGlobalView.vue",
  "./components/GlobalCosmosChrome.vue",
  "./components/GlobalCosmosControls.vue",
  "./components/GlobalCosmosUniverse.vue",
] as const;

function sourceFor(path: (typeof files)[number]): string {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
}

function cameraSource(): string {
  return readFileSync(fileURLToPath(new URL("../useCosmosCameraPresenter.ts", import.meta.url)), "utf8");
}

describe("Global Cosmos visual slice", () => {
  it.each(files)("compiles %s without script or template errors", (path) => {
    const source = sourceFor(path);
    const descriptor = parse(source, { filename: path }).descriptor;
    if (descriptor.scriptSetup) compileScript(descriptor, { id: `cosmos-global-${path}` });
    const template = descriptor.template;
    expect(template).toBeDefined();
    if (template === null) throw new Error(`${path} template missing.`);
    const compiled = compileTemplate({
      id: `cosmos-global-${path}`,
      filename: path,
      source: template.content,
    });
    expect(compiled.errors).toEqual([]);
  });

  it("reuses Runtime chrome and excludes Builder infrastructure", () => {
    const combined = files.map(sourceFor).join("\n");
    const chrome = sourceFor("./components/GlobalCosmosChrome.vue");

    expect(chrome).toContain("<CosmosNavigation");
    expect(chrome).toContain("<CompanionAvatar");
    const navigation = sourceFor("../../components/cosmos/CosmosNavigation.vue");
    expect(navigation).toContain(':aria-label="`Travel to ${leftNeighbor.displayName}`"');
    expect(navigation).toContain(':aria-label="`Travel to ${rightNeighbor.displayName}`"');
    expect(navigation).toContain(':aria-label="`Open quick travel from ${currentLocation}`"');
    expect(combined).not.toContain("ThemeBuilderShell");
    expect(combined).not.toContain("StudioRail");
    expect(combined).not.toContain("BuilderTopNavigation");
    expect(combined).not.toContain("themeBuilder.css");
  });

  it("renders project regions and Nodes from presentation props without fixture Projects", () => {
    const universe = sourceFor("./components/GlobalCosmosUniverse.vue");

    expect(universe).toContain('v-for="region in regions"');
    expect(universe).toContain("<button");
    expect(universe).toContain('type="button"');
    expect(universe).toContain('v-for="star in region.stars"');
    expect(universe).toContain(':data-project-id="region.objectId"');
    expect(universe).toContain(':data-node-id="star.objectId"');
    expect(universe).toContain(':aria-label="regionLabel(region)"');
    expect(universe).toContain("@click=\"$emit('activate-project', region.objectId)\"");
    expect(universe).toContain(".project-region:focus-visible");
    for (const name of ["Asteria", "Forge", "Atlas", "Mettventures", "Archive", "Sandbox"]) {
      expect(universe).not.toContain(name);
    }
    expect(universe).toContain("project-region__selection");
  });

  it("provides the required edge controls and global orientation", () => {
    const chrome = sourceFor("./components/GlobalCosmosChrome.vue");
    const controls = sourceFor("./components/GlobalCosmosControls.vue");

    expect(chrome).toContain('current-location="Global Cosmos"');
    expect(sourceFor("./CosmosGlobalView.vue")).toContain('current-location="Global Cosmos"');
    expect(chrome).toContain("Local · Synced");
    expect(chrome).toContain("projectStatus");
    expect(chrome).toContain(':left-neighbor="leftNeighbor"');
    expect(chrome).toContain(':right-neighbor="rightNeighbor"');
    expect(chrome).toContain('@toggle-quick-travel="$emit(\'toggle-quick-travel\')"');
    for (const label of ["zoomLabel", "Fit", "Base", "Companion", "Themes"]) {
      expect(controls).toContain(label);
    }
    expect(controls).not.toContain("Search / Focus");
    expect(controls).not.toContain("Settings");
    expect(controls).toContain("$emit('zoom-out')");
    expect(controls).toContain("$emit('zoom-in')");
    expect(controls).toContain("$emit('fit')");
  });

  it("uses CSS and HTML primitives with camera gestures and the existing Context Menu host", () => {
    const combined = files.map(sourceFor).join("\n");

    expect(combined).not.toContain("<svg");
    expect(combined).toContain("@click");
    expect(combined).toContain('@pointerdown="startPan"');
    expect(combined).toContain('@wheel.prevent="zoomAtPointer"');
    expect(combined).toContain("@contextmenu.prevent.stop");
    expect(combined).toContain("openProjectContextMenu");
    expect(combined).toContain("host.openContextMenu(projectId");
    expect(combined).not.toContain("moveNodeLocally");
  });

  it("loads and applies only existing camera, focus and selection Runtime paths", () => {
    const combined = files.map(sourceFor).join("\n");
    const view = sourceFor("./CosmosGlobalView.vue");
    const camera = cameraSource();

    expect(combined).not.toContain("fetch(");
    expect(combined).not.toContain("/api");
    expect(view).toContain("useCosmosRuntime");
    expect(view).toContain("loadGlobalCosmosSnapshot(runtime.cosmosMap)");
    expect(view).toContain("navigateToProject(router, projectId, props.navigationScope)");
    expect(view).toContain("focusProject(projectId)");
    expect(view).toContain("runtime.cosmosMap.select(projectId)");
    expect(view).toContain("runtime.cosmosMap.persistSelection()");
    expect(view).toContain("<CosmosQuickTravel");
    expect(view).toContain("<CompanionWindowHost");
    expect(view).toContain("navigateToBase(router)");
    expect(view).toContain('@open-themes="openThemes"');
    expect(view).toContain('router.push({ name: "theme-library" })');
    expect(camera).toContain("runtime.setCamera");
    expect(camera).toContain("runtime.persistCamera()");
    expect(camera).toContain("runtime.focusCosmos");
    expect(camera).toContain("runtime.focusProject");
    expect(view).not.toContain("persistNodePosition");
    expect(view).not.toContain(".moveNodeLocally(");
    expect(combined).not.toContain("localStorage");
    expect(combined).not.toContain("sessionStorage");
    expect(combined).not.toContain("<img");
  });

  it("contains quiet loading, error and empty states in the same Runtime experience", () => {
    const view = sourceFor("./CosmosGlobalView.vue");

    expect(view).toContain("Loading your cosmos");
    expect(view).toContain("Cosmos is temporarily unavailable");
    expect(view).toContain("No projects are available yet.");
    expect(view).toContain("presentation.phase === 'success'");
  });
});
