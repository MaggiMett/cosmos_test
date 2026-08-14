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

  it("ignores a stale response after the projection is cleared", async () => {
    let resolveFetch!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise<Response>((resolve) => { resolveFetch = resolve; })));
    const runtime = new ProjectResourceProjectionRuntime(new CosmosApiClient("http://cosmos.test"));

    const pending = runtime.load("project.alpha");
    runtime.clear();
    resolveFetch(new Response(JSON.stringify({ projectId: "project.alpha", items: [] }), { status: 200 }));

    await expect(pending).resolves.toBeNull();
    expect(runtime.state.phase).toBe("idle");
    expect(runtime.state.snapshot).toBeNull();
  });

  it("degrades independently when the additive projection is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "missing" }), { status: 404 })));
    const runtime = new ProjectResourceProjectionRuntime(new CosmosApiClient("http://cosmos.test"));

    await expect(runtime.load("project.alpha")).resolves.toBeNull();
    expect(runtime.state.phase).toBe("error");
    expect(runtime.state.snapshot).toBeNull();
  });
});
