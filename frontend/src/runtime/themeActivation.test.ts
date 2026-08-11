import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { cosmosTheme } from "../themes/cosmos";
import { ThemeRegistry, ThemeRegistryError, type ThemeDefinition } from "./themeRegistry";
import {
  ThemeActivationError,
  ThemeRuntime,
  type PreparedThemeActivation,
  type ThemePresenter,
} from "./themeRuntime";
import { TransitionRuntime } from "./transitionRuntime";

const auroraTheme: ThemeDefinition = {
  ...cosmosTheme,
  objectId: "cosmos.theme.aurora",
  displayName: "Aurora",
  version: "2.0.0",
  tokens: { ...cosmosTheme.tokens, "--cosmos-color-accent": "#88ddff" },
};

const duskTheme: ThemeDefinition = {
  ...cosmosTheme,
  objectId: "cosmos.theme.dusk",
  displayName: "Dusk",
  version: "3.0.0",
  tokens: { ...cosmosTheme.tokens, "--cosmos-color-accent": "#cc99ff" },
};

class ControlledPresenter implements ThemePresenter {
  readonly applied: string[] = [];
  private readonly remainingFailures = new Map<string, number>();

  failNext(themeId: string, count = 1): void {
    this.remainingFailures.set(themeId, count);
  }

  apply(definition: Readonly<ThemeDefinition>): void {
    this.applied.push(definition.objectId);
    const remaining = this.remainingFailures.get(definition.objectId) ?? 0;
    if (remaining > 0) {
      this.remainingFailures.set(definition.objectId, remaining - 1);
      throw new Error(`Presenter failed for ${definition.objectId}`);
    }
  }
}

function createRuntime() {
  const registry = new ThemeRegistry();
  registry.register(cosmosTheme);
  registry.register(auroraTheme);
  registry.register(duskTheme);
  const transitions = new TransitionRuntime();
  const presenter = new ControlledPresenter();
  const runtime = new ThemeRuntime(
    registry,
    transitions,
    cosmosTheme.objectId,
    presenter,
  );
  return { runtime, presenter, transitions };
}

async function safelyActivate(runtime: ThemeRuntime, themeId: string) {
  return runtime.applyPreparedTheme(runtime.prepareActivation(themeId));
}

describe("ThemeRuntime safe activation", () => {
  it("prepares only a complete registered Theme with a stable last-known-good reference", () => {
    const { runtime } = createRuntime();

    const prepared = runtime.prepareActivation(auroraTheme.objectId);

    expect(prepared).toEqual({
      themeId: auroraTheme.objectId,
      lastKnownGoodThemeId: cosmosTheme.objectId,
    });
    expect(Object.isFrozen(prepared)).toBe(true);
  });

  it("rejects an unknown Theme during preflight before Presenter apply", () => {
    const { runtime, presenter } = createRuntime();

    expect(() => runtime.prepareActivation("cosmos.theme.missing")).toThrowError(
      ThemeRegistryError,
    );
    expect(presenter.applied).toEqual([]);
  });

  it("commits active and last-known-good IDs only after successful apply", async () => {
    const { runtime, presenter } = createRuntime();
    const prepared = runtime.prepareActivation(auroraTheme.objectId);
    expect(runtime.readSnapshot()).toMatchObject({
      activeThemeId: null,
      lastKnownGoodThemeId: cosmosTheme.objectId,
    });

    await expect(runtime.applyPreparedTheme(prepared)).resolves.toMatchObject({
      objectId: auroraTheme.objectId,
    });

    expect(presenter.applied).toEqual([auroraTheme.objectId]);
    expect(runtime.readSnapshot()).toMatchObject({
      activeThemeId: auroraTheme.objectId,
      lastKnownGoodThemeId: auroraTheme.objectId,
    });
  });

  it("rolls a failed first apply back to the Core fallback without a half-active state", async () => {
    const { runtime, presenter, transitions } = createRuntime();
    presenter.failNext(auroraTheme.objectId);

    await expect(safelyActivate(runtime, auroraTheme.objectId)).rejects.toMatchObject({
      code: "apply_failed",
    });

    expect(presenter.applied).toEqual([auroraTheme.objectId, cosmosTheme.objectId]);
    expect(runtime.active?.objectId).toBe(cosmosTheme.objectId);
    expect(runtime.readSnapshot()).toMatchObject({
      activeThemeId: cosmosTheme.objectId,
      lastKnownGoodThemeId: cosmosTheme.objectId,
    });
    expect(transitions.active).toBeNull();
  });

  it("restores the previous committed Theme when a later Presenter apply fails", async () => {
    const { runtime, presenter } = createRuntime();
    await safelyActivate(runtime, auroraTheme.objectId);
    presenter.failNext(duskTheme.objectId);

    await expect(safelyActivate(runtime, duskTheme.objectId)).rejects.toBeInstanceOf(
      ThemeActivationError,
    );

    expect(presenter.applied).toEqual([
      auroraTheme.objectId,
      duskTheme.objectId,
      auroraTheme.objectId,
    ]);
    expect(runtime.readSnapshot()).toMatchObject({
      activeThemeId: auroraTheme.objectId,
      lastKnownGoodThemeId: auroraTheme.objectId,
    });
  });

  it("uses Core when both the requested Theme and a non-Core rollback target fail", async () => {
    const { runtime, presenter } = createRuntime();
    await safelyActivate(runtime, auroraTheme.objectId);
    presenter.failNext(duskTheme.objectId);
    presenter.failNext(auroraTheme.objectId);

    await expect(safelyActivate(runtime, duskTheme.objectId)).rejects.toMatchObject({
      code: "apply_failed",
    });

    expect(presenter.applied.slice(-3)).toEqual([
      duskTheme.objectId,
      auroraTheme.objectId,
      cosmosTheme.objectId,
    ]);
    expect(runtime.readSnapshot()).toMatchObject({
      activeThemeId: cosmosTheme.objectId,
      lastKnownGoodThemeId: cosmosTheme.objectId,
    });
  });

  it("keeps the Runtime usable after a failed activation", async () => {
    const { runtime, presenter } = createRuntime();
    presenter.failNext(auroraTheme.objectId);
    await expect(safelyActivate(runtime, auroraTheme.objectId)).rejects.toBeInstanceOf(
      ThemeActivationError,
    );

    await expect(safelyActivate(runtime, duskTheme.objectId)).resolves.toMatchObject({
      objectId: duskTheme.objectId,
    });
    expect(runtime.readSnapshot().activeThemeId).toBe(duskTheme.objectId);
  });

  it("rejects forged preparations for Themes outside the Registry", () => {
    const { runtime, presenter } = createRuntime();
    const forged: PreparedThemeActivation = {
      themeId: "cosmos.theme.unregistered",
      lastKnownGoodThemeId: cosmosTheme.objectId,
    };

    expect(() => runtime.applyPreparedTheme(forged)).toThrowError(ThemeRegistryError);
    expect(presenter.applied).toEqual([]);
  });

  it("rejects stale preparations before applying their Theme", async () => {
    const { runtime, presenter } = createRuntime();
    const stale = runtime.prepareActivation(auroraTheme.objectId);
    await safelyActivate(runtime, duskTheme.objectId);
    const applyCount = presenter.applied.length;

    await expect(runtime.applyPreparedTheme(stale)).rejects.toMatchObject({
      code: "stale_preparation",
    });
    expect(presenter.applied).toHaveLength(applyCount);
    expect(runtime.readSnapshot().activeThemeId).toBe(duskTheme.objectId);
  });

  it("reuses the Transition boundary for explicit last-known-good rollback", async () => {
    const { runtime, presenter, transitions } = createRuntime();
    await safelyActivate(runtime, auroraTheme.objectId);

    await expect(runtime.rollbackToLastKnownGood()).resolves.toMatchObject({
      objectId: auroraTheme.objectId,
    });

    expect(presenter.applied.slice(-1)).toEqual([auroraTheme.objectId]);
    expect(transitions.active).toBeNull();
  });

  it("contains no persistence, storage, network or backend path", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./themeRuntime.ts", import.meta.url)),
      "utf8",
    );

    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("localStorage");
    expect(source).not.toContain("sessionStorage");
    expect(source).not.toContain("CosmosApiClient");
    expect(source).not.toContain("/api");
  });
});
