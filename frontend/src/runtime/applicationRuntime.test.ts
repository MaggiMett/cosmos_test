import { describe, expect, it, vi } from "vitest";

import { CosmosApiClient } from "./apiClient";
import { ApplicationRuntime } from "./applicationRuntime";
import type { ThemeRuntime } from "./themeRuntime";

describe("ApplicationRuntime", () => {
  it("loads the Theme before accepting backend readiness", async () => {
    const order: string[] = [];
    const themes = {
      restoreAtStartup: vi.fn(async () => {
        order.push("theme");
      }),
    } as unknown as ThemeRuntime;
    const api = {
      get: vi.fn(async () => {
        order.push("backend");
        return { ok: true, data: { service: "cosmos", status: "ready" } };
      }),
    } as unknown as CosmosApiClient;
    const runtime = new ApplicationRuntime(api, themes, "cosmos.theme.cosmos");

    await runtime.start();

    expect(order).toEqual(["theme", "backend"]);
    expect(runtime.state).toEqual({ phase: "ready", error: null });
  });

  it("isolates startup failure and permits retry", async () => {
    const get = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, error: { message: "Backend unavailable" } })
      .mockResolvedValueOnce({ ok: true, data: { service: "cosmos", status: "ready" } });
    const themes = { restoreAtStartup: vi.fn().mockResolvedValue({}) } as unknown as ThemeRuntime;
    const runtime = new ApplicationRuntime({ get } as unknown as CosmosApiClient, themes, "theme");

    await expect(runtime.start()).rejects.toThrow("Backend unavailable");
    expect(runtime.state).toEqual({ phase: "failed", error: "Backend unavailable" });

    await runtime.start();
    expect(runtime.state).toEqual({ phase: "ready", error: null });
  });

  it("coalesces concurrent startup requests", async () => {
    let release: (() => void) | undefined;
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    const themes = { restoreAtStartup: vi.fn(() => waiting) } as unknown as ThemeRuntime;
    const api = {
      get: vi.fn().mockResolvedValue({ ok: true, data: { service: "cosmos", status: "ready" } }),
    } as unknown as CosmosApiClient;
    const runtime = new ApplicationRuntime(api, themes, "theme");

    const first = runtime.start();
    const second = runtime.start();
    release?.();
    await Promise.all([first, second]);

    expect(themes.restoreAtStartup).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledTimes(1);
  });
});
