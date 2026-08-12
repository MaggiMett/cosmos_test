import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { compileScript, compileTemplate, parse } from "vue/compiler-sfc";
import { describe, expect, it } from "vitest";

import { configuredBasePresenter, resolveBasePresenter } from "./basePresenter";

const presenterPath = "./BasePresenterView.vue";
const presenterSource = source(presenterPath);
const environmentSource = source("./EnvironmentView.ts");
const legacySource = source("./BaseView.vue");
const newSource = source("../dev/base-runtime/BaseRuntimeView.vue");
const roomSource = source("../dev/base-runtime/components/BaseRoomScene.vue");
const workspaceSource = source("./WorkspaceView.vue");
const roomRendererSource = source("../dev/base-runtime/baseRoomRenderer.ts");

describe("controlled Base presenter rollout", () => {
  it("promotes New when the variable is unset", () => {
    expect(resolveBasePresenter(undefined)).toBe("new");
    expect(configuredBasePresenter).toBe("new");
  });

  it("keeps New for explicit new and invalid values", () => {
    expect(resolveBasePresenter("new")).toBe("new");
    expect(resolveBasePresenter("NEW")).toBe("new");
    expect(resolveBasePresenter("unexpected")).toBe("new");
    expect(resolveBasePresenter(null)).toBe("new");
  });

  it("uses Legacy only for the exact rollback value", () => {
    expect(resolveBasePresenter("legacy")).toBe("legacy");
    expect(resolveBasePresenter("LEGACY")).toBe("new");
  });

  it("keeps the Base presenter and Room renderer switches independent", () => {
    expect(source("./basePresenter.ts")).toContain("VITE_BASE_PRESENTER");
    expect(source("./basePresenter.ts")).not.toContain("VITE_BASE_ROOM_RENDERER");
    expect(roomRendererSource).toContain("VITE_BASE_ROOM_RENDERER");
    expect(roomRendererSource).not.toContain("VITE_BASE_PRESENTER");
    expect(roomRendererSource).toContain(
      'value === "presenter" ? "presenter" : "composition"',
    );
    expect(presenterSource).not.toContain("configuredBaseRoomRenderer");
  });

  it("compiles a narrow wrapper that keeps both presenters renderable", () => {
    const descriptor = parse(presenterSource, { filename: presenterPath }).descriptor;
    compileScript(descriptor, { id: "base-presenter" });
    if (!descriptor.template) throw new Error("Presenter template missing.");
    expect(compileTemplate({
      id: "base-presenter",
      filename: presenterPath,
      source: descriptor.template.content,
    }).errors).toEqual([]);
    expect(presenterSource).toContain("LegacyBaseView");
    expect(presenterSource).toContain("BaseRuntimeView");
    expect(presenterSource).toContain("presenter === 'legacy'");
    expect(presenterSource).toContain("presenter: configuredBasePresenter");
    expect(presenterSource).toContain('navigation-scope="production"');
  });

  it("binds only productive Base and Room environments to the wrapper", () => {
    expect(environmentSource).toContain('route.meta.environment === "base"');
    expect(environmentSource).toContain('route.meta.environment === "room"');
    expect(environmentSource).toContain("h(BasePresenterView)");
    expect(environmentSource).not.toContain("h(BaseView)");
  });

  it("keeps Workspace as a single production layer without a hidden Base presenter", () => {
    expect(environmentSource).toContain("return h(WorkspaceView)");
    expect(environmentSource).not.toContain("backgroundOnly: true");
    expect(presenterSource).toContain(':background-only="backgroundOnly"');
    expect(newSource).toContain(':inert="backgroundOnly || undefined"');
    expect(newSource).toContain('v-if="!backgroundOnly"');
    expect(newSource).toContain("if (props.backgroundOnly) return");
    expect(workspaceSource).toContain("runtime.workspaces.open");
  });

  it("keeps all productive interactions on the prepared New presenter", () => {
    expect(newSource).toContain("navigateToBaseRoom");
    expect(newSource).toContain("navigateToBaseWorkspace");
    expect(newSource).toContain("CompanionWindowHost");
    expect(roomSource).toContain("BasePetPresence");
    expect(newSource).toContain("openContextMenu");
    expect(newSource).toContain("navigateFromBase");
  });

  it("creates no Runtime, Registry, store, or parallel Room state", () => {
    const combined = `${presenterSource}\n${environmentSource}\n${newSource}`;
    expect(combined).not.toContain("createCosmosFrontendRuntime");
    expect(combined).not.toContain("new BaseRuntime");
    expect(combined).not.toContain("createStore");
    expect(combined).not.toContain("selectedRoomId");
    expect(combined).not.toContain("localStorage");
    expect(combined).not.toContain("sessionStorage");
  });

  it("leaves the complete Legacy presenter and canonical Workspace path intact", () => {
    expect(legacySource).toContain("useCosmosRuntime()");
    expect(legacySource).toContain("travelThroughDoor");
    expect(legacySource).toContain("openObjectContextMenu");
    expect(legacySource).toContain("greetPet");
    expect(legacySource).toContain("companionWindowHost.value?.open()");
    expect(legacySource).toContain('router.push(`/workspaces/${slot.workspace.objectId}`)');
  });
});

function source(path: string): string {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
}
