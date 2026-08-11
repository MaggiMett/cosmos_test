import { describe, expect, it } from "vitest";

import { cosmosTheme } from "../themes/cosmos";
import { ThemeRegistry, ThemeRegistryError, type ThemeDefinition } from "./themeRegistry";
import { ThemeRuntime, type ThemePresenter } from "./themeRuntime";
import type { ThemeActivationPersistence } from "./themeRuntimePersistence";
import { TransitionRuntime } from "./transitionRuntime";

class RecordingPresenter implements ThemePresenter {
  readonly applied: string[] = [];
  failThemeId: string | null = null;

  apply(definition: { objectId: string }): void {
    this.applied.push(definition.objectId);
    if (definition.objectId === this.failThemeId) throw new Error("apply failed");
  }
}

const secondTheme: ThemeDefinition = {
  ...cosmosTheme,
  objectId: "cosmos.theme.subscription",
  displayName: "Subscription",
  tokens: { ...cosmosTheme.tokens, "--cosmos-color-accent": "#89d4c2" },
};

describe("ThemeRuntime", () => {
  it("loads validated Theme Objects through the registry", async () => {
    const registry = new ThemeRegistry();
    registry.register(cosmosTheme);
    const presenter = new RecordingPresenter();
    const runtime = new ThemeRuntime(
      registry,
      new TransitionRuntime(),
      cosmosTheme.objectId,
      presenter,
    );

    await expect(runtime.activate(cosmosTheme.objectId)).resolves.toMatchObject({
      objectId: cosmosTheme.objectId,
    });
    expect(runtime.active?.objectId).toBe(cosmosTheme.objectId);
    expect(presenter.applied).toEqual([cosmosTheme.objectId]);
  });

  it("falls back to the default Theme when resolution fails", async () => {
    const registry = new ThemeRegistry();
    registry.register(cosmosTheme);
    const runtime = new ThemeRuntime(registry, new TransitionRuntime(), cosmosTheme.objectId);

    await expect(runtime.activate("missing.theme")).resolves.toMatchObject({
      objectId: cosmosTheme.objectId,
    });
  });

  it("rejects duplicate or behavior-like unnamespaced definitions", () => {
    const registry = new ThemeRegistry();
    registry.register(cosmosTheme);

    expect(() => registry.register(cosmosTheme)).toThrowError(ThemeRegistryError);
    expect(() =>
      registry.register({
        ...cosmosTheme,
        objectId: "cosmos.theme.invalid",
        tokens: { navigationMode: "teleport" },
      }),
    ).toThrow("--cosmos-");
  });

  it("publishes only committed active Themes with a monotone presentation revision", async () => {
    const registry = new ThemeRegistry();
    registry.register(cosmosTheme);
    registry.register(secondTheme);
    const runtime = new ThemeRuntime(registry, new TransitionRuntime(), cosmosTheme.objectId);
    const commits: Readonly<{ activeThemeId: string; presentationRevision: number }>[] = [];
    const unsubscribe = runtime.subscribeActiveTheme((commit) => commits.push(commit));

    await runtime.activate(cosmosTheme.objectId);
    await runtime.activate(secondTheme.objectId);
    await runtime.activate(secondTheme.objectId);
    await runtime.activate(cosmosTheme.objectId);
    unsubscribe();
    await runtime.activate(secondTheme.objectId);

    expect(commits).toEqual([
      { activeThemeId: cosmosTheme.objectId, presentationRevision: 1 },
      { activeThemeId: secondTheme.objectId, presentationRevision: 2 },
      { activeThemeId: cosmosTheme.objectId, presentationRevision: 3 },
    ]);
    expect(commits.every(Object.isFrozen)).toBe(true);
  });

  it("isolates subscribers and does not publish a failed Theme apply", async () => {
    const registry = new ThemeRegistry();
    registry.register(cosmosTheme);
    registry.register(secondTheme);
    const presenter = new RecordingPresenter();
    const runtime = new ThemeRuntime(
      registry,
      new TransitionRuntime(),
      cosmosTheme.objectId,
      presenter,
    );
    const committed: string[] = [];
    runtime.subscribeActiveTheme(() => {
      throw new Error("observer failed");
    });
    runtime.subscribeActiveTheme((commit) => committed.push(commit.activeThemeId));

    await runtime.applyPreparedTheme(runtime.prepareActivation(cosmosTheme.objectId));
    presenter.failThemeId = secondTheme.objectId;
    await expect(
      runtime.applyPreparedTheme(runtime.prepareActivation(secondTheme.objectId)),
    ).rejects.toMatchObject({ code: "apply_failed" });

    expect(runtime.readSnapshot().activeThemeId).toBe(cosmosTheme.objectId);
    expect(committed).toEqual([cosmosTheme.objectId]);
  });

  it("publishes the actual committed Theme even when persistence subsequently fails", async () => {
    const registry = new ThemeRegistry();
    registry.register(cosmosTheme);
    registry.register(secondTheme);
    const persistence: ThemeActivationPersistence = {
      load: async () => null,
      save: async () => {
        throw new Error("disk full");
      },
    };
    const runtime = new ThemeRuntime(
      registry,
      new TransitionRuntime(),
      cosmosTheme.objectId,
      new RecordingPresenter(),
      persistence,
    );
    const committed: string[] = [];
    runtime.subscribeActiveTheme((commit) => committed.push(commit.activeThemeId));

    await expect(
      runtime.applyPreparedTheme(runtime.prepareActivation(secondTheme.objectId)),
    ).rejects.toMatchObject({ code: "persistence_failed" });

    expect(runtime.readSnapshot().activeThemeId).toBe(secondTheme.objectId);
    expect(committed).toEqual([secondTheme.objectId]);
  });
});
