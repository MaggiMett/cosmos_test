import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { cosmosTheme } from "../themes/cosmos";
import { ThemeRegistry, type ThemeDefinition } from "./themeRegistry";
import {
  ThemeActivationError,
  ThemeRuntime,
  type ThemePresenter,
} from "./themeRuntime";
import type {
  PersistedThemeActivationState,
  ThemeActivationPersistence,
} from "./themeRuntimePersistence";
import { TransitionRuntime } from "./transitionRuntime";

const auroraTheme: ThemeDefinition = {
  ...cosmosTheme,
  objectId: "cosmos.theme.aurora",
  displayName: "Aurora",
  tokens: { ...cosmosTheme.tokens, "--cosmos-color-accent": "#88ddff" },
};

const duskTheme: ThemeDefinition = {
  ...cosmosTheme,
  objectId: "cosmos.theme.dusk",
  displayName: "Dusk",
  tokens: { ...cosmosTheme.tokens, "--cosmos-color-accent": "#bb99ff" },
};

class RecordingPresenter implements ThemePresenter {
  readonly applied: string[] = [];
  readonly order: string[];
  private readonly failures = new Map<string, number>();

  constructor(order: string[] = []) {
    this.order = order;
  }

  failNext(themeId: string): void {
    this.failures.set(themeId, (this.failures.get(themeId) ?? 0) + 1);
  }

  apply(definition: Readonly<ThemeDefinition>): void {
    this.applied.push(definition.objectId);
    this.order.push(`apply:${definition.objectId}`);
    const remaining = this.failures.get(definition.objectId) ?? 0;
    if (remaining > 0) {
      this.failures.set(definition.objectId, remaining - 1);
      throw new Error(`failed:${definition.objectId}`);
    }
  }
}

class MemoryThemePersistence implements ThemeActivationPersistence {
  readonly saved: PersistedThemeActivationState[] = [];
  readonly order: string[];
  loadError: Error | null = null;
  saveError: Error | null = null;

  constructor(
    public state: PersistedThemeActivationState | null = null,
    order: string[] = [],
  ) {
    this.order = order;
  }

  async load(): Promise<Readonly<PersistedThemeActivationState> | null> {
    if (this.loadError) throw this.loadError;
    return this.state ? Object.freeze({ ...this.state }) : null;
  }

  async save(state: Readonly<PersistedThemeActivationState>): Promise<void> {
    this.order.push(`persist:${state.activeThemeId}`);
    if (this.saveError) throw this.saveError;
    const copy = { ...state };
    this.saved.push(copy);
    this.state = copy;
  }
}

function createRuntime(
  persistence: ThemeActivationPersistence,
  presenter = new RecordingPresenter(),
) {
  const registry = new ThemeRegistry();
  registry.register(cosmosTheme);
  registry.register(auroraTheme);
  registry.register(duskTheme);
  return {
    runtime: new ThemeRuntime(
      registry,
      new TransitionRuntime(),
      cosmosTheme.objectId,
      presenter,
      persistence,
    ),
    presenter,
  };
}

async function activate(runtime: ThemeRuntime, themeId: string) {
  return runtime.applyPreparedTheme(runtime.prepareActivation(themeId));
}

describe("Theme activation persistence", () => {
  it("persists active and last-known-good only after a successful Presenter commit", async () => {
    const order: string[] = [];
    const persistence = new MemoryThemePersistence(null, order);
    const presenter = new RecordingPresenter(order);
    const { runtime } = createRuntime(persistence, presenter);

    await activate(runtime, auroraTheme.objectId);

    expect(order).toEqual([
      `apply:${auroraTheme.objectId}`,
      `persist:${auroraTheme.objectId}`,
    ]);
    expect(persistence.saved).toEqual([
      {
        schemaVersion: 1,
        activeThemeId: auroraTheme.objectId,
        lastKnownGoodThemeId: auroraTheme.objectId,
      },
    ]);
  });

  it("persists the actual restored Theme after apply failure, never the failed request", async () => {
    const persistence = new MemoryThemePersistence();
    const presenter = new RecordingPresenter();
    const { runtime } = createRuntime(persistence, presenter);
    await activate(runtime, auroraTheme.objectId);
    persistence.saved.length = 0;
    presenter.failNext(duskTheme.objectId);

    await expect(activate(runtime, duskTheme.objectId)).rejects.toMatchObject({
      code: "apply_failed",
    });

    expect(persistence.saved).toEqual([
      {
        schemaVersion: 1,
        activeThemeId: auroraTheme.objectId,
        lastKnownGoodThemeId: auroraTheme.objectId,
      },
    ]);
    expect(persistence.saved).not.toContainEqual(
      expect.objectContaining({ activeThemeId: duskTheme.objectId }),
    );
  });

  it("persists the actual Theme after an explicit last-known-good rollback", async () => {
    const persistence = new MemoryThemePersistence();
    const { runtime, presenter } = createRuntime(persistence);
    await activate(runtime, auroraTheme.objectId);
    persistence.saved.length = 0;

    await runtime.rollbackToLastKnownGood();

    expect(presenter.applied.slice(-1)).toEqual([auroraTheme.objectId]);
    expect(persistence.saved).toEqual([
      {
        schemaVersion: 1,
        activeThemeId: auroraTheme.objectId,
        lastKnownGoodThemeId: auroraTheme.objectId,
      },
    ]);
  });

  it("restores a registered persisted active Theme through the safe Presenter path", async () => {
    const persistence = new MemoryThemePersistence({
      schemaVersion: 1,
      activeThemeId: auroraTheme.objectId,
      lastKnownGoodThemeId: cosmosTheme.objectId,
    });
    const { runtime, presenter } = createRuntime(persistence);

    await runtime.restoreAtStartup(cosmosTheme.objectId);

    expect(presenter.applied).toEqual([auroraTheme.objectId]);
    expect(runtime.readSnapshot()).toMatchObject({
      activeThemeId: auroraTheme.objectId,
      lastKnownGoodThemeId: auroraTheme.objectId,
    });
  });

  it("uses a registered persisted last-known-good when the active ID is unknown", async () => {
    const persistence = new MemoryThemePersistence({
      schemaVersion: 1,
      activeThemeId: "cosmos.theme.removed",
      lastKnownGoodThemeId: auroraTheme.objectId,
    });
    const { runtime, presenter } = createRuntime(persistence);

    await runtime.restoreAtStartup(cosmosTheme.objectId);

    expect(presenter.applied).toEqual([auroraTheme.objectId]);
    expect(runtime.readSnapshot().activeThemeId).toBe(auroraTheme.objectId);
  });

  it("uses Core when both persisted IDs are unknown and never presents unchecked IDs", async () => {
    const persistence = new MemoryThemePersistence({
      schemaVersion: 1,
      activeThemeId: "cosmos.theme.removed",
      lastKnownGoodThemeId: "cosmos.theme.also-removed",
    });
    const { runtime, presenter } = createRuntime(persistence);

    await runtime.restoreAtStartup(auroraTheme.objectId);

    expect(presenter.applied).toEqual([cosmosTheme.objectId]);
    expect(runtime.readSnapshot()).toMatchObject({
      activeThemeId: cosmosTheme.objectId,
      lastKnownGoodThemeId: cosmosTheme.objectId,
    });
  });

  it("falls safely to Core when persistence cannot be read", async () => {
    const persistence = new MemoryThemePersistence();
    persistence.loadError = new Error("database unavailable");
    const { runtime, presenter } = createRuntime(persistence);

    await runtime.restoreAtStartup(auroraTheme.objectId);

    expect(presenter.applied).toEqual([cosmosTheme.objectId]);
    expect(runtime.readSnapshot().activeThemeId).toBe(cosmosTheme.objectId);
    expect(persistence.saved).toEqual([]);
  });

  it("uses persisted last-known-good for safe rollback if startup apply fails", async () => {
    const persistence = new MemoryThemePersistence({
      schemaVersion: 1,
      activeThemeId: duskTheme.objectId,
      lastKnownGoodThemeId: auroraTheme.objectId,
    });
    const presenter = new RecordingPresenter();
    presenter.failNext(duskTheme.objectId);
    const { runtime } = createRuntime(persistence, presenter);

    await runtime.restoreAtStartup(cosmosTheme.objectId);

    expect(presenter.applied).toEqual([duskTheme.objectId, auroraTheme.objectId]);
    expect(runtime.readSnapshot().activeThemeId).toBe(auroraTheme.objectId);
    expect(persistence.state?.activeThemeId).toBe(auroraTheme.objectId);
  });

  it("keeps the committed Runtime active and reports a structured write failure without reapply", async () => {
    const persistence = new MemoryThemePersistence();
    persistence.saveError = new Error("disk full");
    const { runtime, presenter } = createRuntime(persistence);

    await expect(activate(runtime, auroraTheme.objectId)).rejects.toEqual(
      expect.objectContaining<Partial<ThemeActivationError>>({ code: "persistence_failed" }),
    );

    expect(presenter.applied).toEqual([auroraTheme.objectId]);
    expect(runtime.readSnapshot()).toMatchObject({
      activeThemeId: auroraTheme.objectId,
      lastKnownGoodThemeId: auroraTheme.objectId,
    });
  });

  it("restores the committed IDs in a fresh Runtime instance", async () => {
    const persistence = new MemoryThemePersistence();
    const first = createRuntime(persistence);
    await activate(first.runtime, auroraTheme.objectId);
    const second = createRuntime(persistence);

    await second.runtime.restoreAtStartup(cosmosTheme.objectId);

    expect(second.presenter.applied).toEqual([auroraTheme.objectId]);
    expect(second.runtime.readSnapshot()).toMatchObject({
      activeThemeId: auroraTheme.objectId,
      lastKnownGoodThemeId: auroraTheme.objectId,
    });
  });

  it("contains no browser storage path and persists no Theme definitions or tokens", async () => {
    const persistence = new MemoryThemePersistence();
    const { runtime } = createRuntime(persistence);
    await activate(runtime, auroraTheme.objectId);

    expect(Object.keys(persistence.saved[0] ?? {}).sort()).toEqual([
      "activeThemeId",
      "lastKnownGoodThemeId",
      "schemaVersion",
    ]);
    expect(JSON.stringify(persistence.saved)).not.toMatch(/tokens|displayName|version/);

    const sources = ["./themeRuntime.ts", "./themeRuntimePersistence.ts"]
      .map((path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8"))
      .join("\n");
    expect(sources).not.toContain("localStorage");
    expect(sources).not.toContain("sessionStorage");
  });
});
