import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { compileScript, compileTemplate, parse } from "vue/compiler-sfc";
import { describe, expect, it } from "vitest";

const presenterPath = "./BasePresenterView.vue";
const presenterSource = source(presenterPath);
const environmentSource = source("./EnvironmentView.ts");
const newSource = source("../dev/base-runtime/BaseRuntimeView.vue");
const roomSource = source("../dev/base-runtime/components/BaseRoomScene.vue");
const workspaceSource = source("./WorkspaceView.vue");
const toolWindowSource = source("../components/windows/ToolWindow.vue");
describe("Base production presenter", () => {
  it("compiles a narrow production wrapper around the promoted Base presenter", () => {
    const descriptor = parse(presenterSource, { filename: presenterPath }).descriptor;
    compileScript(descriptor, { id: "base-presenter" });
    if (!descriptor.template) throw new Error("Presenter template missing.");
    expect(compileTemplate({
      id: "base-presenter",
      filename: presenterPath,
      source: descriptor.template.content,
    }).errors).toEqual([]);
    expect(presenterSource).not.toContain("LegacyBaseView");
    expect(presenterSource).toContain("BaseRuntimeView");
    expect(presenterSource).not.toContain("presenter === 'legacy'");
    expect(presenterSource).not.toContain("configuredBasePresenter");
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
    expect(workspaceSource).toContain(':room-id="session?.context.roomId ?? null"');
    expect(presenterSource).toContain(':room-id="roomId"');
    expect(newSource).toContain("if (props.roomId) return props.roomId");
    expect(workspaceSource).toContain("[...toolInstances.value]");
    expect(workspaceSource).toContain('instance.window.state === "active"');
    expect(workspaceSource).toContain("closeTool(focusedTool.instanceId)");
    expect(workspaceSource).not.toContain("session.value.toolInstances");
    expect(workspaceSource).toContain(':aria-label="workspaceCloseLabel"');
    expect(workspaceSource).toContain('@click="requestWorkspaceClose"');
    expect(workspaceSource).toContain('"Close active Tools before returning"');
    expect(workspaceSource).toContain("requestWorkspaceClose();");
    expect(workspaceSource).toContain('`Return to ${room.displayName}`');
    expect(workspaceSource).toContain('"Return to Base"');
    expect(toolWindowSource).toContain(':aria-label="`Close ${title}`"');
    expect(toolWindowSource).toContain(':title="`Close ${title}`"');
    expect(workspaceSource).toContain("toolOpenState(tool.objectId)");
    expect(workspaceSource).toContain(':aria-pressed="toolOpenState(tool.objectId)"');
    expect(workspaceSource).toContain("workspace-tool--open");
    expect(workspaceSource).toContain("toolFocusedState(tool.objectId)");
    expect(workspaceSource).toContain("workspace-tool--focused");
    expect(workspaceSource).toContain(':data-focused="toolFocusedState(tool.objectId) || undefined"');
    expect(workspaceSource).toContain("`Open another ${tool.displayName}`");
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

});

function source(path: string): string {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
}
