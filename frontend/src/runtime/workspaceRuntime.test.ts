import { afterEach, describe, expect, it, vi } from "vitest";

import { CosmosApiClient } from "./apiClient";
import { ToolRuntime } from "./toolRuntime";
import { WindowRuntime } from "./windowRuntime";
import { WorkspaceRuntime, type WorkspaceSession } from "./workspaceRuntime";

const session: WorkspaceSession = {
  objectId: "cosmos.workspace-session.a",
  definition: {
    objectId: "cosmos.workspace.knowledge",
    displayName: "Knowledge Workspace",
    description: "Research and understanding.",
    icon: "Knowledge",
    overlay: "KnowledgeDesk",
    defaultLayout: {},
    contextConfiguration: { projectScopeIds: ["project.alpha"] },
    assignedToolIds: [],
    themeOverride: "",
    sourceProjectId: "cosmos.project.system.knowledge",
  },
  environmentWindow: {
    objectId: "cosmos.window.workspace.a",
    displayName: "Knowledge Workspace",
    role: "workspace_environment",
  },
  context: {
    projectScopeIds: ["project.alpha"],
    focusedProjectId: "project.alpha",
    roomId: "cosmos.room.main",
    workspaceSessionId: "cosmos.workspace-session.a",
  },
  state: "active",
  restorableState: {
    tools: [],
    selectedObjectId: null,
    filters: {},
    camera: {},
    panels: {},
  },
};

describe("WorkspaceRuntime", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("opens a service-owned temporary session with a fixed Environment Window", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(session, 201)));
    const windows = new WindowRuntime();
    const api = new CosmosApiClient("http://cosmos.test");
    const tools = new ToolRuntime(windows, api);
    const runtime = new WorkspaceRuntime(windows, api, tools);

    const opened = await runtime.open({
      definitionObjectId: session.definition.objectId,
      roomId: "cosmos.room.main",
      environmentBounds: { x: 60, y: 50, width: 1200, height: 800 },
    });

    expect(opened.state).toBe("active");
    expect(windows.get(opened.environmentWindow.objectId).capabilities).toMatchObject({
      movable: false,
      resizable: false,
      closable: true,
    });
    expect(runtime.state.phase).toBe("ready");
  });

  it("persists layout before closing without removing the Workspace definition", async () => {
    const responses = [session, session, { ...session, state: "closed" }];
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(json(responses.shift()))));
    const windows = new WindowRuntime();
    const api = new CosmosApiClient("http://cosmos.test");
    const tools = new ToolRuntime(windows, api);
    const runtime = new WorkspaceRuntime(windows, api, tools);
    const opened = await runtime.open({
      definitionObjectId: session.definition.objectId,
      roomId: "cosmos.room.main",
      environmentBounds: { x: 60, y: 50, width: 1200, height: 800 },
    });

    const closed = await runtime.close(opened.objectId);

    expect(closed.state).toBe("closed");
    expect(closed.definition.objectId).toBe("cosmos.workspace.knowledge");
    expect(runtime.list()).toEqual([]);
  });

  it("persists selected Object identity as Workspace Runtime state", async () => {
    const selected = {
      ...session,
      restorableState: { ...session.restorableState, selectedObjectId: "object.alpha" },
    };
    const responses = [session, selected];
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(json(responses.shift())));
    vi.stubGlobal("fetch", fetchMock);
    const windows = new WindowRuntime();
    const api = new CosmosApiClient("http://cosmos.test");
    const runtime = new WorkspaceRuntime(windows, api, new ToolRuntime(windows, api));
    const opened = await runtime.open({
      definitionObjectId: session.definition.objectId,
      roomId: "cosmos.room.main",
      environmentBounds: { x: 60, y: 50, width: 1200, height: 800 },
    });

    const updated = await runtime.selectObject(opened.objectId, "object.alpha");

    expect(updated.restorableState.selectedObjectId).toBe("object.alpha");
    expect(JSON.parse(fetchMock.mock.calls[1]?.[1]?.body as string)).toMatchObject({
      restorableState: { selectedObjectId: "object.alpha" },
    });
  });

  it("compensates the backend session when local Window initialization fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(session, 201));
    vi.stubGlobal("fetch", fetchMock);
    const windows = new WindowRuntime();
    windows.open({
      objectId: session.environmentWindow.objectId,
      role: "workspace_environment",
      title: "Existing",
      bounds: { x: 0, y: 0, width: 1000, height: 700 },
    });
    const api = new CosmosApiClient("http://cosmos.test");
    const runtime = new WorkspaceRuntime(windows, api, new ToolRuntime(windows, api));

    await expect(
      runtime.open({
        definitionObjectId: session.definition.objectId,
        roomId: "cosmos.room.main",
        environmentBounds: { x: 60, y: 50, width: 1200, height: 800 },
      }),
    ).rejects.toThrow("already open");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(runtime.state.phase).toBe("failed");
  });
});

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value ?? {}), {
    status,
    headers: { "content-type": "application/json" },
  });
}
