import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { compileScript, compileTemplate, parse } from "vue/compiler-sfc";
import { describe, expect, it } from "vitest";

import { configuredCosmosPresenter, resolveCosmosPresenter } from "./cosmosPresenter";

const presenterPath = "./CosmosPresenterView.vue";
const presenterSource = readFileSync(
  fileURLToPath(new URL(presenterPath, import.meta.url)),
  "utf8",
);
const environmentSource = readFileSync(
  fileURLToPath(new URL("./EnvironmentView.ts", import.meta.url)),
  "utf8",
);
const legacySource = readFileSync(
  fileURLToPath(new URL("./CosmosView.vue", import.meta.url)),
  "utf8",
);
const globalSource = readFileSync(
  fileURLToPath(new URL("../dev/cosmos-global/CosmosGlobalView.vue", import.meta.url)),
  "utf8",
);
const projectSource = readFileSync(
  fileURLToPath(new URL("../dev/cosmos-project/CosmosProjectView.vue", import.meta.url)),
  "utf8",
);

describe("controlled Cosmos presenter cutover", () => {
  it("promotes New when the presenter variable is unset", () => {
    expect(resolveCosmosPresenter(undefined)).toBe("new");
    expect(configuredCosmosPresenter).toBe("new");
  });

  it("accepts the explicit New presenter value", () => {
    expect(resolveCosmosPresenter("new")).toBe("new");
  });

  it("keeps Legacy explicitly available as the rollback presenter", () => {
    expect(resolveCosmosPresenter("legacy")).toBe("legacy");
  });

  it("documents invalid values as New unless Legacy is explicitly requested", () => {
    expect(resolveCosmosPresenter("unexpected")).toBe("new");
    expect(resolveCosmosPresenter(42)).toBe("new");
    expect(resolveCosmosPresenter(null)).toBe("new");
  });

  it("compiles the promoted Global and Project Cosmos experiences", () => {
    const descriptor = parse(presenterSource, { filename: presenterPath }).descriptor;
    compileScript(descriptor, { id: "cosmos-presenter" });
    if (!descriptor.template) throw new Error("Presenter template missing.");
    expect(
      compileTemplate({
        id: "cosmos-presenter",
        filename: presenterPath,
        source: descriptor.template.content,
      }).errors,
    ).toEqual([]);
    expect(presenterSource).not.toContain("LegacyCosmosView");
    expect(presenterSource).toContain("CosmosGlobalView");
    expect(presenterSource).toContain("CosmosProjectView");
    expect(presenterSource).not.toContain("configuredCosmosPresenter");
    expect(presenterSource).not.toContain("presenter === 'legacy'");
  });

  it("uses Product query navigation for Global to Project to Global", () => {
    expect(presenterSource).toContain('navigation-scope="production"');
    expect(presenterSource).toContain("route.query.projectId");
    expect(presenterSource).not.toMatch(/["']\/dev\//u);
  });

  it("binds each production environment to exactly one presenter layer", () => {
    expect(environmentSource).toContain('route.meta.environment === "cosmos"');
    expect(environmentSource).toContain("return h(CosmosPresenterView)");
    expect(environmentSource).toContain("return h(BasePresenterView)");
    expect(environmentSource).toContain("return h(WorkspaceView)");
    expect(environmentSource).not.toContain("LegacyCosmosView");
    expect(environmentSource).not.toContain("backgroundOnly: true");
  });

  it("creates no second Runtime, graph engine, store, or selection state", () => {
    const combined = `${presenterSource}\n${environmentSource}`;
    expect(combined).not.toContain("createCosmosFrontendRuntime");
    expect(combined).not.toContain("new CosmosMapRuntime");
    expect(combined).not.toContain("createStore");
    expect(combined).not.toContain("selectedObjectId = ref");
  });

  it("keeps Legacy intact and lets both presenters inject the same installed Runtime", () => {
    expect(legacySource).toContain("useCosmosRuntime()");
    expect(globalSource).toContain("useCosmosRuntime()");
    expect(projectSource).toContain("useCosmosRuntime()");
    expect(legacySource).toContain("moveNodeLocally");
    expect(legacySource).toContain("persistNodePosition");
    expect(`${globalSource}\n${projectSource}`).not.toContain("createCosmosFrontendRuntime");
  });
});
