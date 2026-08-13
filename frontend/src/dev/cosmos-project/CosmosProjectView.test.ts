import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { compileScript, compileTemplate, parse } from "vue/compiler-sfc";
import { describe, expect, it } from "vitest";

const files = [
  "./CosmosProjectView.vue",
  "./components/ProjectCosmosChrome.vue",
  "./components/ProjectCosmosControls.vue",
  "./components/AsteriaConstellation.vue",
] as const;

function sourceFor(path: (typeof files)[number]): string {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
}

describe("Project Cosmos visual slice", () => {
  it.each(files)("compiles %s without script or template errors", (path) => {
    const source = sourceFor(path);
    const descriptor = parse(source, { filename: path }).descriptor;
    if (descriptor.scriptSetup) compileScript(descriptor, { id: `cosmos-project-${path}` });
    const template = descriptor.template;
    expect(template).toBeDefined();
    if (template === null) throw new Error(`${path} template missing.`);
    const compiled = compileTemplate({
      id: `cosmos-project-${path}`,
      filename: path,
      source: template.content,
    });
    expect(compiled.errors).toEqual([]);
  });

  it("reuses Cosmos navigation and excludes Builder infrastructure", () => {
    const combined = files.map(sourceFor).join("\n");
    const chrome = sourceFor("./components/ProjectCosmosChrome.vue");
    const view = sourceFor("./CosmosProjectView.vue");

    expect(chrome).toContain("<CosmosNavigation");
    expect(view).toContain("<ObjectInteractionHost");
    expect(combined).not.toContain("ThemeBuilderShell");
    expect(combined).not.toContain("StudioRail");
    expect(combined).not.toContain("BuilderTopNavigation");
    expect(combined).not.toContain("themeBuilder.css");
  });

  it("projects the requested real Project context into the existing edge chrome", () => {
    const view = sourceFor("./CosmosProjectView.vue");
    const chrome = sourceFor("./components/ProjectCosmosChrome.vue");
    const controls = sourceFor("./components/ProjectCosmosControls.vue");

    expect(view).toContain("route.query.projectId");
    expect(view).toContain("projectIdFromQuery");
    expect(chrome).toContain(":current-location=\"projectName\"");
    expect(chrome).toContain(':left-neighbor="leftNeighbor"');
    expect(chrome).toContain(':right-neighbor="rightNeighbor"');
    expect(chrome).toContain("@travel=\"$emit('travel-project', $event)\"");
    expect(chrome).toContain('aria-label="Return to Global Cosmos"');
    expect(chrome).toContain('title="Return to Global Cosmos"');
    expect(view).toContain('@back-to-global="backToGlobal"');
    expect(view).toContain("navigateToGlobal(router, props.navigationScope)");
    expect(chrome).toContain("Local · Synced");
    expect(chrome).toContain("objectStatus");
    expect(controls).toContain("zoomLabel");
    expect(controls).toContain("projectName");
    expect(controls).toContain("Fit");
    expect(controls).not.toContain("Search / Focus");
    expect(controls).toContain("Themes");
    expect(controls).toContain("$emit('zoom-out')");
    expect(controls).toContain("$emit('zoom-in')");
    expect(controls).toContain("$emit('fit')");
  });

  it("renders only projected Project, Node and Selection data", () => {
    const constellation = sourceFor("./components/AsteriaConstellation.vue");

    expect(constellation).toContain("project.displayName");
    expect(constellation).toContain('v-for="node in project.nodes"');
    expect(constellation).toContain("node.isSelected");
    expect(constellation).toContain("project.isFocused");
    expect(constellation).toContain('type="button"');
    expect(constellation).toContain(':aria-label="`${node.displayName} node`"');
    expect(constellation).toContain(':aria-pressed="node.isSelected"');
    expect(constellation).toContain("@click=\"$emit('select-node', node.objectId)\"");
    expect(constellation).toContain(".project-node:focus-visible::after");
    expect(constellation).toContain("Inspect");
    expect(constellation).toContain("@click=\"$emit('open-node', node.objectId)\"");
    for (const name of ["Research", "Design", "Assets", "Build", "Notes", "Archive"]) {
      expect(constellation).not.toContain(name);
    }
  });

  it("uses native Node buttons for click and Enter/Space activation with distinct focus", () => {
    const constellation = sourceFor("./components/AsteriaConstellation.vue");
    const projection = sourceFor("./projectCosmosProjection.ts");

    expect(constellation).toContain("<button");
    expect(constellation).toContain('type="button"');
    expect(constellation).toContain("@click=\"$emit('select-node', node.objectId)\"");
    expect(constellation).toContain(':aria-pressed="node.isSelected"');
    expect(constellation).toContain(".project-node:focus-visible::after");
    expect(constellation).toContain(".project-node--selected > i");
    expect(constellation).toContain("node.hierarchyLevel.toLowerCase()");
    expect(constellation).toContain(".project-node--domain > i");
    expect(constellation).toContain(".project-node--cluster > i");
    expect(constellation).toContain('class="project-node__label"');
    expect(constellation).toContain(".project-node--domain > .project-node__label");
    expect(constellation).toContain(".project-node:hover > .project-node__label");
    expect(constellation).toContain(".project-node--selected > .project-node__label");
    expect(projection).toContain("hierarchyLevel: node.hierarchyLevel");
    expect(projection).toContain("`M${round(start.x)} ${round(start.y)} L${round(end.x)} ${round(end.y)}`");
    expect(projection).not.toContain(" C${controlX}");
  });

  it("projects real SVG connection paths and Node move gestures without connection editing", () => {
    const constellation = sourceFor("./components/AsteriaConstellation.vue");

    expect(constellation).toContain("<svg");
    expect(constellation).toContain('v-for="connection in project.connections"');
    expect(constellation).toContain(":d=\"connection.path\"");
    expect(constellation).toContain("project-connection--structural");
    expect(constellation).toContain(".project-connection--semantic,");
    expect(constellation).toContain(".project-connection--discovery {");
    expect(constellation).toContain("@click");
    expect(constellation).toContain("@pointerdown.stop");
    expect(constellation).not.toContain("connection-edit");
  });

  it("loads, selects, moves and opens through existing Runtime paths", () => {
    const combined = files.map(sourceFor).join("\n");
    const view = sourceFor("./CosmosProjectView.vue");

    expect(combined).not.toContain("fetch(");
    expect(combined).not.toContain("/api");
    expect(view).toContain("useCosmosRuntime");
    expect(view).toContain("loadProjectCosmosSnapshot(runtime.cosmosMap)");
    expect(view).toContain("selectProjectCosmosNode(runtime.cosmosMap, project, objectId)");
    expect(view).toContain("openSelectedProjectCosmosNode(host, project, objectId)");
    expect(view).toContain("moveProjectNode(");
    expect(view).toContain("persistProjectNodeMove(runtime.cosmosMap, gesture)");
    expect(view).toContain("useCosmosCameraPresenter(runtime.cosmosMap, requestedProjectId)");
    expect(view).toContain("mapState.selectedObjectId");
    expect(view).toContain("if (objectId === project.objectId) fit()");
    expect(view).not.toContain(".setCamera(");
    expect(view).not.toContain(".moveNodeLocally(");
    expect(combined).not.toContain("localStorage");
    expect(combined).not.toContain("sessionStorage");
    expect(combined).not.toContain("<img");
    expect(combined).toContain("@contextmenu.prevent.stop");
    expect(view).toContain("host.openContextMenu(objectId");
    expect(view).toContain("<CosmosQuickTravel");
    expect(view).toContain("<CompanionWindowHost");
    expect(view).toContain("navigateToBase(router, visibleProject.value?.objectId ?? null)");
    expect(view).toContain('@open-themes="openThemes"');
    expect(view).toContain('router.push({ name: "theme-library" })');
    expect(view).not.toContain("selectedObjectId = ref");
  });

  it("contains quiet Loading, Error, Not Found and Empty Project states", () => {
    const view = sourceFor("./CosmosProjectView.vue");

    expect(view).toContain("Loading project cosmos");
    expect(view).toContain("Project cosmos is temporarily unavailable");
    expect(view).toContain("Project not found");
    expect(view).toContain("No project nodes are available yet.");
  });
});
