import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { compileTemplate, parse } from "vue/compiler-sfc";
import { describe, expect, it } from "vitest";

const files = [
  "./LooksStudioView.vue",
  "./components/LooksStudioContextPanel.vue",
  "./components/LooksStudioCanvas.vue",
  "./components/LooksStudioInspector.vue",
] as const;

function sourceFor(path: (typeof files)[number]): string {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
}

describe("Looks Studio vertical slice", () => {
  it.each(files)("compiles %s without template errors", (path) => {
    const source = sourceFor(path);
    const descriptor = parse(source, { filename: path }).descriptor;
    const template = descriptor.template;
    expect(template).toBeDefined();
    if (template === null) throw new Error(`${path} template missing.`);

    const compiled = compileTemplate({
      id: `looks-studio-${path}`,
      filename: path,
      source: template.content,
    });

    expect(compiled.errors).toEqual([]);
  });

  it("uses the existing Builder shell and shared controls", () => {
    const source = sourceFor("./LooksStudioView.vue");
    const canvas = sourceFor("./components/LooksStudioCanvas.vue");
    const inspector = sourceFor("./components/LooksStudioInspector.vue");

    expect(source).toContain("<ThemeBuilderShell");
    expect(source).toContain("<AssetShelfBar");
    expect(source).toContain('active-studio="looks"');
    expect(source).toContain('studio-label="Looks Studio"');
    expect(canvas).toContain("<BuilderSegmentedControl");
    expect(canvas).toContain("<NeutralVisualPlaceholder");
    expect(inspector).toContain("<BuilderAccordionSection");
    expect(source).not.toContain("<StudioRail");
    expect(source).not.toContain("<BuilderTopNavigation");
  });

  it("renders real binding context groups, state controls, and material inspector sections", () => {
    const context = sourceFor("./components/LooksStudioContextPanel.vue");
    const canvas = sourceFor("./components/LooksStudioCanvas.vue");
    const inspector = sourceFor("./components/LooksStudioInspector.vue");

    expect(context).toContain("Current Template");
    expect(context).toContain("Parts");
    expect(context).toContain("Artwork");
    expect(context).toContain("Interaction");
    expect(context).toContain("slot.slotId");
    expect(canvas).toContain("slots");
    expect(canvas).not.toContain("Orbital Luminaire");
    expect(canvas).toContain("100%");
    expect(inspector).toContain('title="Look"');
    expect(inspector).toContain("Color & surface");
    expect(inspector).toContain("Outline / glow");
    expect(inspector).toContain("Finish");
    expect(inspector).not.toContain('title="Placement"');
    expect(inspector).toContain('title="Effects"');
    expect(inspector).toContain("Advanced");
    expect(inspector).toContain("Coming later");
  });

  it("closes the authoring flow from a saved Look into Showcase preview", () => {
    const source = sourceFor("./LooksStudioView.vue");
    expect(source).toContain("Create Look");
    expect(source).toContain("set-skin-material-channel");
    expect(source).toContain("Save this Look before previewing it in context.");
    expect(source).toContain("Preview in Showcase");
    expect(source).toContain("theme-builder-showcase");
    expect(source).toContain("skinId: resolved.skin.skinId");
  });

  it("provides dedicated comparisons for every implemented visual family", () => {
    const view = sourceFor("./LooksStudioView.vue");
    const canvas = sourceFor("./components/LooksStudioCanvas.vue");

    expect(canvas).toContain('"Clear", "Cosmos Core", "Your Theme"');
    expect(canvas).toContain("previewKind === 'map'");
    expect(canvas).toContain("previewKind === 'connection'");
    expect(canvas).toContain("previewKind === 'base'");
    expect(canvas).toContain("previewKind === 'workspace'");
    expect(canvas).toContain("previewKind === 'window'");
    expect(canvas).toContain('return "node"');
    expect(view).toContain('entry.catalogId === "workspace.environment"');
    expect(view).toContain('entry.catalogId === "ui.window"');
  });

  it("uses the canonical Builder session and project APIs without Runtime activation", () => {
    const combined = files.map(sourceFor).join("\n");

    expect(combined).not.toContain("fetch(");
    expect(combined).not.toContain("localStorage");
    expect(combined).not.toContain("sessionStorage");
    expect(combined).not.toContain("InteractionZone");
    expect(combined).not.toContain("FunctionBinding");
    expect(combined).not.toContain("background-image:");
    expect(combined).not.toContain("@drag");
    expect(sourceFor("./LooksStudioView.vue")).toContain("ThemeBuilderSession");
    expect(sourceFor("./LooksStudioView.vue")).toContain("themeBuilderProjectApi");
    expect(combined).not.toContain("ThemeRuntime");
    expect(combined).not.toContain("ActiveThemePresentationSnapshot");
  });
});
