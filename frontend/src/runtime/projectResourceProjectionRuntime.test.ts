import { afterEach, describe, expect, it, vi } from "vitest";

import { CosmosApiClient } from "./apiClient";
import { ProjectResourceProjectionRuntime } from "./projectResourceProjectionRuntime";

afterEach(() => vi.unstubAllGlobals());

describe("ProjectResourceProjectionRuntime", () => {
  it("loads a project-scoped presentation projection through the API client", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ projectId: "project.alpha", items: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const runtime = new ProjectResourceProjectionRuntime(new CosmosApiClient("http://cosmos.test"));

    await expect(runtime.load("project.alpha")).resolves.toEqual({ projectId: "project.alpha", items: [] });
    expect(runtime.state.phase).toBe("ready");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://cosmos.test/projects/project.alpha/resource-projection",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("degrades independently when the additive projection is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "missing" }), { status: 404 })));
    const runtime = new ProjectResourceProjectionRuntime(new CosmosApiClient("http://cosmos.test"));

    await expect(runtime.load("project.alpha")).resolves.toBeNull();
    expect(runtime.state.phase).toBe("error");
    expect(runtime.state.snapshot).toBeNull();
  });
});
