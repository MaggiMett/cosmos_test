import { describe, expect, it, vi } from "vitest";

import type { CosmosApiClient } from "./apiClient";
import { ApiThemeActivationPersistence } from "./themeRuntimePersistence";

describe("ApiThemeActivationPersistence", () => {
  it("maps an empty Runtime State record to no persisted activation", async () => {
    const api = {
      get: vi.fn().mockResolvedValue({
        ok: true,
        data: { schemaVersion: 1, activeThemeId: null, lastKnownGoodThemeId: null },
      }),
    } as unknown as CosmosApiClient;

    await expect(new ApiThemeActivationPersistence(api).load()).resolves.toBeNull();
    expect(api.get).toHaveBeenCalledWith("/runtime-state/theme");
  });

  it("loads a small immutable versioned activation record", async () => {
    const api = {
      get: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          schemaVersion: 1,
          activeThemeId: "cosmos.theme.aurora",
          lastKnownGoodThemeId: "cosmos.theme.cosmos",
        },
      }),
    } as unknown as CosmosApiClient;

    const state = await new ApiThemeActivationPersistence(api).load();

    expect(state).toEqual({
      schemaVersion: 1,
      activeThemeId: "cosmos.theme.aurora",
      lastKnownGoodThemeId: "cosmos.theme.cosmos",
    });
    expect(Object.isFrozen(state)).toBe(true);
  });

  it("writes only IDs and the schema marker through the existing Runtime State endpoint", async () => {
    const put = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        schemaVersion: 1,
        activeThemeId: "cosmos.theme.aurora",
        lastKnownGoodThemeId: "cosmos.theme.aurora",
      },
    });
    const api = { put } as unknown as CosmosApiClient;

    await new ApiThemeActivationPersistence(api).save({
      schemaVersion: 1,
      activeThemeId: "cosmos.theme.aurora",
      lastKnownGoodThemeId: "cosmos.theme.aurora",
    });

    expect(put).toHaveBeenCalledWith("/runtime-state/theme", {
      schemaVersion: 1,
      activeThemeId: "cosmos.theme.aurora",
      lastKnownGoodThemeId: "cosmos.theme.aurora",
    });
    expect(JSON.stringify(put.mock.calls[0]?.[1])).not.toMatch(/tokens|definition|pack/i);
  });

  it("rejects malformed or failed reads instead of accepting unchecked IDs", async () => {
    const malformedApi = {
      get: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          schemaVersion: 1,
          activeThemeId: "cosmos.theme.aurora",
          lastKnownGoodThemeId: null,
        },
      }),
    } as unknown as CosmosApiClient;
    const failedApi = {
      get: vi.fn().mockResolvedValue({ ok: false, error: { message: "offline" } }),
    } as unknown as CosmosApiClient;

    await expect(new ApiThemeActivationPersistence(malformedApi).load()).rejects.toThrow(
      "invalid",
    );
    await expect(new ApiThemeActivationPersistence(failedApi).load()).rejects.toThrow("offline");
  });
});
