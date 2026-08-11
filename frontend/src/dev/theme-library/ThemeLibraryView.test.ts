import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { compileScript, compileTemplate, parse } from "vue/compiler-sfc";
import { describe, expect, it } from "vitest";

const files = [
  "./ThemeLibraryView.vue",
  "./components/ThemeLibrarySystemHeader.vue",
  "./components/ThemeLibraryHero.vue",
  "./components/ThemeLibraryFilters.vue",
  "./components/ThemeLibraryGallery.vue",
  "./components/ThemeLibraryDetails.vue",
  "./components/ThemeLibraryEmptyState.vue",
  "./components/ThemeLibraryRuntimeState.vue",
  "./components/ThemeLibraryVisual.vue",
  "./components/ThemePackageImportReview.vue",
] as const;

function sourceFor(path: (typeof files)[number]): string {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
}

const appSource = readFileSync(fileURLToPath(new URL("../../App.vue", import.meta.url)), "utf8");

describe("Cosmos Theme Library vertical slice", () => {
  it.each(files)("compiles %s without script or template errors", (path) => {
    const source = sourceFor(path);
    const descriptor = parse(source, { filename: path }).descriptor;
    if (descriptor.scriptSetup) compileScript(descriptor, { id: `theme-library-${path}` });
    const template = descriptor.template;
    expect(template).toBeDefined();
    if (template === null) throw new Error(`${path} template missing.`);

    const compiled = compileTemplate({
      id: `theme-library-${path}`,
      filename: path,
      source: template.content,
    });
    expect(compiled.errors).toEqual([]);
  });

  it("reuses the normal Cosmos navigation and excludes Builder infrastructure", () => {
    const combined = files.map(sourceFor).join("\n");
    const header = sourceFor("./components/ThemeLibrarySystemHeader.vue");

    expect(header).toContain("<CosmosNavigation");
    expect(combined.match(/<CosmosNavigation/g)).toHaveLength(1);
    expect(header).toContain("@travel=\"$emit('travel', $event)\"");
    expect(sourceFor("./ThemeLibraryView.vue")).toContain('@travel="travelFromLibrary"');
    expect(appSource.match(/<ApplicationShell/g)).toHaveLength(1);
    expect(appSource).toContain('v-if="route.meta.developmentPreview || route.meta.standaloneExperience"');
    expect(combined).not.toContain("ThemeBuilderShell");
    expect(combined).not.toContain("StudioRail");
    expect(combined).not.toContain("BuilderTopNavigation");
    expect(combined).not.toContain("themeBuilder.css");
  });

  it("renders active Theme identity from projection props and keeps actions inert", () => {
    const hero = sourceFor("./components/ThemeLibraryHero.vue");

    expect(hero).toContain("Active Theme");
    expect(hero).toContain("theme.name");
    expect(hero).toContain("theme.themeId");
    expect(hero).toContain("Version");
    expect(hero).toContain("Author");
    expect(hero).toContain("Core fallback");
    expect(hero).toContain("Open Theme Builder");
    expect(hero).toContain("Preview");
    expect(hero).toContain("Duplicate");
    expect(hero).toContain("Export");
  });

  it("contains search and the complete filter set", () => {
    const filters = sourceFor("./components/ThemeLibraryFilters.vue");

    expect(filters).toContain("Search installed themes");
    for (const label of ["Category", "Installed", "Favorites", "Recently Used", "Creator"]) {
      expect(filters).toContain(label);
    }
  });

  it("loads ThemeRuntime and renders only the projected registered Themes", () => {
    const view = sourceFor("./ThemeLibraryView.vue");
    const gallery = sourceFor("./components/ThemeLibraryGallery.vue");

    expect(view).toContain("useCosmosRuntime");
    expect(view).toContain("loadThemeLibrarySnapshot(runtime.themes)");
    expect(view).toContain("projectThemeLibrarySnapshot(snapshot)");
    expect(gallery).toContain('v-for="theme in themes"');
    expect(gallery).toContain(':data-theme-id="theme.themeId"');
    for (const label of ["Cosmos Reference", "Minimal", "Nebula Garden", "Industrial", "Fantasy", "Pixel"]) {
      expect(view).not.toContain(label);
    }
  });

  it("contains selected-theme details and actions", () => {
    const details = sourceFor("./components/ThemeLibraryDetails.vue");

    for (const label of ["Screenshots", "Included Content", "Version", "Author", "Changes", "Compatibility"]) {
      expect(details).toContain(label);
    }
    for (const action of ["Activate", "Open Builder", "Duplicate", "Export"]) {
      expect(details).toContain(action);
    }
  });

  it("binds Activate to ThemeRuntime and Builder entry points only", () => {
    const view = sourceFor("./ThemeLibraryView.vue");
    const gallery = sourceFor("./components/ThemeLibraryGallery.vue");
    const details = sourceFor("./components/ThemeLibraryDetails.vue");
    const hero = sourceFor("./components/ThemeLibraryHero.vue");

    expect(view).toContain("useThemeLibraryActivation(runtime.themes)");
    expect(view).toContain('@activate="activateTheme"');
    expect(view).toContain("current.activeTheme.themeId === themeId");
    expect(gallery).toContain("activatingThemeId !== null");
    expect(gallery).toContain("theme.status === 'Active'");
    expect(gallery).toContain("$emit('activate', theme.themeId)");
    expect(details).toContain("$emit('activate', theme.themeId)");
    expect(hero).toContain("defineEmits<{ builder: [] }>()");
    expect(view).toContain('name: "theme-builder"');
    expect(gallery).toContain("$emit('builder')");
    expect(details).toContain("$emit('builder')");
    expect(gallery).not.toContain("$emit('preview'");
    expect(gallery).not.toContain("$emit('open-builder'");
    expect(details).not.toContain("$emit('customize'");
    expect(details).not.toContain("$emit('duplicate'");
    expect(details).not.toContain("$emit('export'");
  });

  it("shows activation failures locally while keeping the Library presentation mounted", () => {
    const view = sourceFor("./ThemeLibraryView.vue");

    expect(view).toContain('v-if="activationError"');
    expect(view).toContain('role="alert"');
    expect(view).toContain("activationError.message");
    expect(view).not.toContain("throw activationError");
  });

  it("uses the empty state only for an actually empty Runtime projection", () => {
    const view = sourceFor("./ThemeLibraryView.vue");
    const empty = sourceFor("./components/ThemeLibraryEmptyState.vue");

    expect(view).toContain("presentation.phase === 'empty'");
    expect(view).not.toContain("route.query.state");
    expect(empty).toContain("Create your first world.");
    expect(empty).toContain("New Theme");
    expect(empty).toContain("Import Theme Pack");
    expect(empty).toContain("$emit('import')");
  });

  it("routes header and empty-state import actions through one real ZIP file input", () => {
    const view = sourceFor("./ThemeLibraryView.vue");
    const header = sourceFor("./components/ThemeLibrarySystemHeader.vue");
    const empty = sourceFor("./components/ThemeLibraryEmptyState.vue");
    const review = sourceFor("./components/ThemePackageImportReview.vue");

    expect(header).toContain("$emit('import')");
    expect(empty).toContain("$emit('import')");
    expect(view).toContain('@import="openImportPicker"');
    expect(view).toContain('type="file"');
    expect(view).toContain('accept=".zip,application/zip"');
    expect(view).not.toContain("multiple");
    expect(view).toContain('tabindex="-1"');
    expect(view).toContain("new ThemePackageImportApi(runtime.api)");
    expect(review).toContain("Ready to inspect");
    expect(review).toContain("Importing…");
    expect(review.split("<style scoped>")[0]).not.toMatch(/\d+%/);
  });

  it("returns through canonical Cosmos routes without a parallel navigation state", () => {
    const view = sourceFor("./ThemeLibraryView.vue");

    expect(view).toContain("useRouter()");
    expect(view).toContain('destinationId === "cosmos"');
    expect(view).toContain('router.push({ name: "cosmos" })');
    expect(view).toContain('destinationId === "base"');
    expect(view).toContain('router.push({ name: "base" })');
    expect(view).not.toMatch(/\buseRoute\b/);
    expect(view).not.toContain("route.query.state");
  });

  it("shows real success metadata and explicitly defers registration until reload", () => {
    const view = sourceFor("./ThemeLibraryView.vue");
    const review = sourceFor("./components/ThemePackageImportReview.vue");

    for (const field of [
      "result.themeName",
      "result.themeId",
      "result.packageId",
      "result.packageVersion",
      "result.installStatus",
      "result.assets.total",
      "result.integrity.status",
    ]) {
      expect(review).toContain(field);
    }
    expect(review).toContain("Theme installed. Reload Cosmos to make it available.");
    expect(view).not.toContain("readSnapshot()");
    expect(view).not.toContain("register(");
    expect(view).not.toContain("activateTheme(import");
  });

  it("contains quiet loading, error and active-Theme inconsistency states", () => {
    const view = sourceFor("./ThemeLibraryView.vue");
    const state = sourceFor("./components/ThemeLibraryRuntimeState.vue");

    expect(view).toContain('ref<ThemeLibraryPresentation>({ phase: "loading" })');
    expect(view).toContain('phase: "error"');
    expect(state).toContain("Loading your themes");
    expect(state).toContain("Theme Library is unavailable");
    expect(state).toContain("Active theme unavailable");
  });

  it("remains asset-free and keeps raw HTTP details outside the UI", () => {
    const combined = files.map(sourceFor).join("\n");

    expect(combined).not.toContain("fetch(");
    expect(combined).not.toContain("/api");
    expect(combined).not.toContain("localStorage");
    expect(combined).not.toContain("sessionStorage");
    expect(combined).not.toContain("ApiThemeActivationPersistence");
    expect(combined).not.toContain("/runtime-state/theme");
    expect(combined).not.toContain("ApiThemePackageRecordSource");
    expect(combined).not.toContain("/theme-packages");
    expect(combined).not.toContain("<img");
    expect(combined).not.toContain("Marketplace");
    expect(combined).not.toContain("Community");
  });
  it("links the productive Theme Library into the real Theme Builder V1", () => {
    const view = sourceFor("./ThemeLibraryView.vue");
    const header = sourceFor("./components/ThemeLibrarySystemHeader.vue");
    const hero = sourceFor("./components/ThemeLibraryHero.vue");
    const empty = sourceFor("./components/ThemeLibraryEmptyState.vue");
    expect(view).toContain('name: "theme-builder"');
    expect(header).toContain("Theme Builder");
    expect(hero).toContain("Open Theme Builder");
    expect(empty).toContain("New Theme");
  });

});
