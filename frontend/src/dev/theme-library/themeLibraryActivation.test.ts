import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { cosmosTheme } from "../../themes/cosmos";
import { ThemeRegistryError } from "../../runtime/themeRegistry";
import { ThemeActivationError } from "../../runtime/themeRuntime";
import type {
  ThemeRuntimeReadSnapshot,
  ThemeRuntimeReadTheme,
} from "../../runtime/themeRuntimeReadSnapshot";
import {
  activateThemeInLibrary,
  useThemeLibraryActivation,
  type ThemeLibraryActivationRuntime,
} from "./themeLibraryActivation";

const activeThemeId = "cosmos.theme.active";
const inactiveThemeId = "cosmos.theme.inactive";

function runtimeTheme(
  themeId: string,
  runtimeStatus: "active" | "inactive",
): Readonly<ThemeRuntimeReadTheme> {
  return Object.freeze({
    themeId,
    name: themeId,
    version: "1.0.0",
    author: undefined,
    description: undefined,
    registryStatus: "registered",
    runtimeStatus,
    isFallback: themeId === activeThemeId,
  });
}

function snapshot(activeId: string): Readonly<ThemeRuntimeReadSnapshot> {
  return Object.freeze({
    themes: Object.freeze([
      runtimeTheme(activeThemeId, activeId === activeThemeId ? "active" : "inactive"),
      runtimeTheme(inactiveThemeId, activeId === inactiveThemeId ? "active" : "inactive"),
    ]),
    activeThemeId: activeId,
    lastKnownGoodThemeId: activeId,
    fallbackThemeId: activeThemeId,
  });
}

function runtimeWith(overrides: Partial<ThemeLibraryActivationRuntime> = {}) {
  const runtime: ThemeLibraryActivationRuntime = {
    prepareActivation: vi.fn((themeId: string) => ({
      themeId,
      lastKnownGoodThemeId: activeThemeId,
    })),
    applyPreparedTheme: vi.fn(async () => cosmosTheme),
    readSnapshot: vi.fn(() => snapshot(inactiveThemeId)),
    ...overrides,
  };
  return runtime;
}

describe("Theme Library safe activation adapter", () => {
  it("activates a registered inactive Theme with its real Runtime ID and refreshes afterward", async () => {
    const order: string[] = [];
    const prepareActivation = vi.fn((themeId: string) => {
      order.push(`prepare:${themeId}`);
      return { themeId, lastKnownGoodThemeId: activeThemeId };
    });
    const applyPreparedTheme = vi.fn(async () => {
      order.push("apply");
      return cosmosTheme;
    });
    const readSnapshot = vi.fn(() => {
      order.push("read");
      return snapshot(inactiveThemeId);
    });
    const runtime = runtimeWith({ prepareActivation, applyPreparedTheme, readSnapshot });

    const outcome = await activateThemeInLibrary(runtime, inactiveThemeId);

    expect(order).toEqual([`prepare:${inactiveThemeId}`, "apply", "read"]);
    expect(prepareActivation).toHaveBeenCalledWith(inactiveThemeId);
    expect(applyPreparedTheme).toHaveBeenCalledWith({
      themeId: inactiveThemeId,
      lastKnownGoodThemeId: activeThemeId,
    });
    expect(outcome.failure).toBeNull();
    expect(outcome.presentation).toMatchObject({
      phase: "success",
      activeTheme: { themeId: inactiveThemeId },
    });
  });

  it("does not publish optimistic presentation state while apply is pending", async () => {
    let release: (() => void) | undefined;
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    const runtime = runtimeWith({
      applyPreparedTheme: vi.fn(async () => {
        await waiting;
        return cosmosTheme;
      }),
    });
    const controller = useThemeLibraryActivation(runtime);
    const update = vi.fn();

    const activation = controller.activate(inactiveThemeId, false, update);
    await Promise.resolve();

    expect(controller.activatingThemeId.value).toBe(inactiveThemeId);
    expect(update).not.toHaveBeenCalled();
    expect(runtime.readSnapshot).not.toHaveBeenCalled();

    release?.();
    await activation;
    expect(update).toHaveBeenCalledOnce();
  });

  it("does not activate an already active Theme", async () => {
    const runtime = runtimeWith();
    const controller = useThemeLibraryActivation(runtime);

    await expect(controller.activate(activeThemeId, true, vi.fn())).resolves.toBe(false);

    expect(runtime.prepareActivation).not.toHaveBeenCalled();
    expect(runtime.applyPreparedTheme).not.toHaveBeenCalled();
    expect(runtime.readSnapshot).not.toHaveBeenCalled();
  });

  it("prevents a second parallel activation", async () => {
    let release: (() => void) | undefined;
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    const runtime = runtimeWith({
      applyPreparedTheme: vi.fn(async () => {
        await waiting;
        return cosmosTheme;
      }),
    });
    const controller = useThemeLibraryActivation(runtime);

    const first = controller.activate(inactiveThemeId, false, vi.fn());
    await Promise.resolve();
    await expect(controller.activate("cosmos.theme.other", false, vi.fn())).resolves.toBe(false);
    expect(runtime.prepareActivation).toHaveBeenCalledOnce();

    release?.();
    await first;
  });

  it("turns a preflight rejection into a local message and reloads actual Runtime state", async () => {
    const runtime = runtimeWith({
      prepareActivation: vi.fn(() => {
        throw new ThemeRegistryError("unknown_theme", "technical registry message");
      }),
      readSnapshot: vi.fn(() => snapshot(activeThemeId)),
    });

    const outcome = await activateThemeInLibrary(runtime, inactiveThemeId);

    expect(runtime.applyPreparedTheme).not.toHaveBeenCalled();
    expect(runtime.readSnapshot).toHaveBeenCalledOnce();
    expect(outcome.failure).toEqual({
      kind: "preflight-rejected",
      message: "This theme is not ready to activate.",
    });
    expect(outcome.presentation).toMatchObject({
      phase: "success",
      activeTheme: { themeId: activeThemeId },
    });
  });

  it("keeps the rolled-back active Theme visible after an apply failure", async () => {
    const runtime = runtimeWith({
      applyPreparedTheme: vi.fn(async () => {
        throw new ThemeActivationError("apply_failed", "technical apply message");
      }),
      readSnapshot: vi.fn(() => snapshot(activeThemeId)),
    });

    const outcome = await activateThemeInLibrary(runtime, inactiveThemeId);

    expect(outcome.failure).toEqual({
      kind: "apply-failed",
      message: "The theme could not be activated. Your previous theme was restored.",
    });
    expect(outcome.presentation).toMatchObject({
      phase: "success",
      activeTheme: { themeId: activeThemeId },
    });
  });

  it("distinguishes rollback failure without exposing the technical exception", async () => {
    const runtime = runtimeWith({
      applyPreparedTheme: vi.fn(async () => {
        throw new ThemeActivationError("rollback_failed", "internal rollback details");
      }),
      readSnapshot: vi.fn(() => snapshot(activeThemeId)),
    });

    const outcome = await activateThemeInLibrary(runtime, inactiveThemeId);

    expect(outcome.failure).toEqual({
      kind: "rollback-failed",
      message: "The theme could not be activated and the safe theme could not be restored.",
    });
    expect(outcome.failure?.message).not.toContain("internal rollback details");
  });

  it("reports persistence failure while retaining the committed Runtime projection", async () => {
    const runtime = runtimeWith({
      applyPreparedTheme: vi.fn(async () => {
        throw new ThemeActivationError("persistence_failed", "internal persistence details");
      }),
      readSnapshot: vi.fn(() => snapshot(inactiveThemeId)),
    });

    const outcome = await activateThemeInLibrary(runtime, inactiveThemeId);

    expect(outcome.failure).toEqual({
      kind: "persistence-failed",
      message: "The theme is active for this session, but the selection could not be saved.",
    });
    expect(outcome.presentation).toMatchObject({
      phase: "success",
      activeTheme: { themeId: inactiveThemeId },
    });
    expect(outcome.failure?.message).not.toContain("internal persistence details");
  });

  it("clears transient state after failure so the Library can retry", async () => {
    const applyPreparedTheme = vi
      .fn()
      .mockRejectedValueOnce(new ThemeActivationError("apply_failed", "failed"))
      .mockResolvedValueOnce(cosmosTheme);
    const runtime = runtimeWith({ applyPreparedTheme });
    const controller = useThemeLibraryActivation(runtime);

    await expect(controller.activate(inactiveThemeId, false, vi.fn())).resolves.toBe(false);
    expect(controller.activatingThemeId.value).toBeNull();
    expect(controller.activationError.value?.kind).toBe("apply-failed");

    await expect(controller.activate(inactiveThemeId, false, vi.fn())).resolves.toBe(true);
    expect(applyPreparedTheme).toHaveBeenCalledTimes(2);
    expect(controller.activatingThemeId.value).toBeNull();
    expect(controller.activationError.value).toBeNull();
  });

  it("keeps only allowed transient UI state and has no persistence or backend path", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./themeLibraryActivation.ts", import.meta.url)),
      "utf8",
    );

    expect(source).toContain("activatingThemeId");
    expect(source).toContain("activationError");
    expect(source).not.toMatch(/ref<[^>]*activeThemeId/);
    expect(source).not.toContain("localStorage");
    expect(source).not.toContain("sessionStorage");
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("CosmosApiClient");
    expect(source).not.toContain("ApiThemeActivationPersistence");
    expect(source).not.toContain("/runtime-state/theme");
  });
});
