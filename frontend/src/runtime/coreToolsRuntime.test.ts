import { afterEach, describe, expect, it, vi } from "vitest";

import { CosmosApiClient } from "./apiClient";
import { CoreToolsRuntime } from "./coreToolsRuntime";

afterEach(() => vi.unstubAllGlobals());

describe("CoreToolsRuntime", () => {
  it("keeps Files calls inside a Workspace session API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ projectId: "project", tree: { name: "Files", path: "", type: "directory", children: [] } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const runtime = new CoreToolsRuntime(new CosmosApiClient("http://cosmos.test"));

    await runtime.fileTree("workspace-session", "notes");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://cosmos.test/workspace-sessions/workspace-session/files?q=notes",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("creates Journeyman tasks through its independent Tool endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ objectId: "task", task_state: "awaiting_provider" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const runtime = new CoreToolsRuntime(new CosmosApiClient("http://cosmos.test"));

    await runtime.createJourneymanTask("workspace-session", "Plan change");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://cosmos.test/workspace-sessions/workspace-session/journeyman/tasks",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ objective: "Plan change" }) }),
    );
  });
});
