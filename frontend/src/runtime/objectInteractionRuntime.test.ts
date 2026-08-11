import { afterEach, describe, expect, it, vi } from "vitest";

import { CosmosApiClient } from "./apiClient";
import { CosmosMapRuntime } from "./cosmosMapRuntime";
import {
  ObjectInteractionRuntime,
  type ObjectDetails,
} from "./objectInteractionRuntime";
import { WindowRuntime } from "./windowRuntime";

const details: ObjectDetails = {
  objectId: "cosmos.object.test",
  displayName: "Test Object",
  description: "A test Object.",
  systemTags: ["Node"],
  userTags: [],
  primaryProjectId: "cosmos.project.test",
  properties: {
    position_x: 0,
    position_y: 0,
    parent_object_id: "",
    hierarchy_level: "Object",
    skin: "Star",
  },
  editableProperties: ["skin"],
  relationships: [],
  actions: [
    { id: "open", label: "Open", group: "primary", enabled: true },
    { id: "configuration", label: "Configuration", group: "edit", enabled: true },
  ],
};

describe("ObjectInteractionRuntime", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("opens capability-driven menus and editable Object Windows through one contract", async () => {
    const workspaceSessionId = "cosmos.workspace-session.test";
    const updated = {
      ...details,
      displayName: "Edited Object",
      userTags: ["Reference"],
      properties: { ...details.properties, skin: "Comet" },
    };
    const responses = [details, details, updated];
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(responses.shift()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const api = new CosmosApiClient("http://cosmos.test");
    const windows = new WindowRuntime();
    const runtime = new ObjectInteractionRuntime(api, windows, new CosmosMapRuntime(api));

    await runtime.showContextMenu(details.objectId, { x: 120, y: 90 }, workspaceSessionId);
    const record = await runtime.openObject(
      details.objectId,
      "edit",
      { x: 40, y: 50, width: 620, height: 480 },
      undefined,
      workspaceSessionId,
    );
    const saved = await runtime.save(record.windowId, {
      displayName: "Edited Object",
      description: details.description,
      userTags: ["Reference"],
      properties: { skin: "Comet" },
    });

    expect(runtime.state.contextMenu).toBeNull();
    expect(record.window.role).toBe("tool");
    expect(saved.displayName).toBe("Edited Object");
    expect(runtime.state.windows[0]?.details.userTags).toEqual(["Reference"]);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "http://cosmos.test/objects/cosmos.object.test?workspaceSessionId=cosmos.workspace-session.test",
      "http://cosmos.test/objects/cosmos.object.test?workspaceSessionId=cosmos.workspace-session.test",
      "http://cosmos.test/objects/cosmos.object.test?workspaceSessionId=cosmos.workspace-session.test",
    ]);
  });

  it("removes scoped records after a parent Workspace recursively closes its Windows", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(details), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const api = new CosmosApiClient("http://cosmos.test");
    const windows = new WindowRuntime();
    const parent = windows.open({
      objectId: "cosmos.window.workspace.test",
      role: "workspace_environment",
      title: "Test Workspace",
      bounds: { x: 20, y: 20, width: 1000, height: 700 },
    });
    const runtime = new ObjectInteractionRuntime(api, windows, new CosmosMapRuntime(api));

    await runtime.openObject(
      details.objectId,
      "details",
      { x: 60, y: 70, width: 620, height: 480 },
      parent.objectId,
      "cosmos.workspace-session.test",
    );
    windows.close(parent.objectId);

    expect(() => runtime.closeAll("cosmos.workspace-session.test")).not.toThrow();
    expect(runtime.state.windows).toEqual([]);
  });
});
