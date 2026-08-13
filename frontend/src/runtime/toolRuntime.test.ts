import { afterEach, describe, expect, it, vi } from "vitest";

import { CosmosApiClient } from "./apiClient";
import { ToolRuntime, type PersistedToolRecord } from "./toolRuntime";
import { WindowRuntime } from "./windowRuntime";

describe("ToolRuntime", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("restores multiple isolated Tool Instances and their window focus order", () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({})));
    const windows = new WindowRuntime();
    windows.open({
      objectId: "workspace-window",
      role: "workspace_environment",
      title: "Workspace",
      bounds: { x: 40, y: 40, width: 1200, height: 800 },
    });
    const runtime = new ToolRuntime(windows, new CosmosApiClient("http://cosmos.test"));
    runtime.register(definition("cosmos.tool.files", "Files"));
    runtime.register(definition("cosmos.tool.archive", "Archive"));

    runtime.restore("session-a", "workspace-window", [
      record("files-instance", "cosmos.tool.files", "files-window", 1, 90),
      record("archive-instance", "cosmos.tool.archive", "archive-window", 2, 420),
    ]);

    expect(runtime.list("session-a").map((instance) => instance.definition.displayName)).toEqual([
      "Files",
      "Archive",
    ]);
    expect(windows.get("files-window").state).toBe("inactive");
    expect(windows.get("archive-window").state).toBe("active");
    expect(runtime.move("archive-instance", { x: 1100, y: 700 }).window.bounds.x).toBe(720);
    expect(runtime.resize("archive-instance", { width: 380, height: 300 }).window.bounds).toMatchObject({
      width: 380,
      height: 300,
    });
  });

  it("discovers Tools by capabilities through the authoritative backend selection", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json([definition("cosmos.tool.files", "Files")]));
    vi.stubGlobal("fetch", fetchMock);
    const runtime = new ToolRuntime(new WindowRuntime(), new CosmosApiClient("http://cosmos.test"));

    const discovered = await runtime.discover(["search", "preview"]);

    expect(discovered.map((item) => item.objectId)).toEqual(["cosmos.tool.files"]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://cosmos.test/tools?capability=search&capability=preview",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("keeps explicit assigned Tool ids as a compatibility filter", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        json([definition("cosmos.tool.files", "Files"), definition("cosmos.tool.archive", "Archive")]),
      ),
    );
    const runtime = new ToolRuntime(new WindowRuntime(), new CosmosApiClient("http://cosmos.test"));
    await runtime.loadDefinitions();

    expect(runtime.available(["cosmos.tool.archive"]).map((item) => item.objectId)).toEqual([
      "cosmos.tool.archive",
    ]);
  });

  it("refreshes the promoted Tool focus state after closing the active instance", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({})));
    const windows = new WindowRuntime();
    windows.open({
      objectId: "workspace-window",
      role: "workspace_environment",
      title: "Workspace",
      bounds: { x: 0, y: 0, width: 1000, height: 700 },
    });
    const runtime = new ToolRuntime(windows, new CosmosApiClient("http://cosmos.test"));
    runtime.register(definition("cosmos.tool.files", "Files"));
    runtime.restore("session-a", "workspace-window", [
      record("files-one", "cosmos.tool.files", "files-window-one", 1, 90),
      record("files-two", "cosmos.tool.files", "files-window-two", 2, 420),
    ]);

    expect(runtime.list("session-a")[1]?.window.state).toBe("active");
    await runtime.close("files-two");

    expect(runtime.list("session-a")).toHaveLength(1);
    expect(runtime.list("session-a")[0]?.instanceId).toBe("files-one");
    expect(runtime.list("session-a")[0]?.window.state).toBe("active");
  });

  it("isolates unavailable restored Tool definitions without failing the Workspace", () => {
    const windows = new WindowRuntime();
    windows.open({
      objectId: "workspace-window",
      role: "workspace_environment",
      title: "Workspace",
      bounds: { x: 0, y: 0, width: 1000, height: 700 },
    });
    const runtime = new ToolRuntime(windows, new CosmosApiClient());

    runtime.restore("session-a", "workspace-window", [
      record("missing-instance", "cosmos.tool.missing", "missing-window", 1, 20),
    ]);

    expect(runtime.list("session-a")).toEqual([]);
    expect(runtime.state.unavailableDefinitionIds).toEqual(["cosmos.tool.missing"]);
  });
});

function definition(objectId: string, displayName: string) {
  return {
    objectId,
    displayName,
    description: `${displayName} Tool`,
    icon: displayName,
    minimumSize: { width: 320, height: 240 },
    componentKey: objectId,
    runtimeKind: "native" as const,
    runtimeConfiguration: {},
    entryPoint: `@cosmos/frontend-runtime:${objectId}`,
  };
}

function record(
  instanceId: string,
  definitionObjectId: string,
  windowObjectId: string,
  focusOrder: number,
  x: number,
): PersistedToolRecord {
  return {
    instanceId,
    definitionObjectId,
    windowObjectId,
    bounds: { x, y: 90, width: 520, height: 420 },
    focusOrder,
    state: focusOrder === 2 ? "active" : "background",
    runtimeState: {},
  };
}

function json(value: unknown): Response {
  return new Response(JSON.stringify(value), { headers: { "content-type": "application/json" } });
}
