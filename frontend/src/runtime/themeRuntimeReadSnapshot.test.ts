import { describe, expect, it } from "vitest";

import { cosmosTheme } from "../themes/cosmos";
import { ThemeRegistry } from "./themeRegistry";
import { ThemeRuntime, type ThemePresenter } from "./themeRuntime";
import { TransitionRuntime } from "./transitionRuntime";

const secondTheme = {
  ...cosmosTheme,
  objectId: "cosmos.theme.second",
  displayName: "Second registered theme",
  version: "2.0.0",
};

class RecordingPresenter implements ThemePresenter {
  readonly applied: string[] = [];

  apply(definition: { objectId: string }): void {
    this.applied.push(definition.objectId);
  }
}

function createRuntime() {
  const registry = new ThemeRegistry();
  registry.register(secondTheme);
  registry.register(cosmosTheme);
  const presenter = new RecordingPresenter();
  const runtime = new ThemeRuntime(
    registry,
    new TransitionRuntime(),
    cosmosTheme.objectId,
    presenter,
  );
  return { runtime, presenter };
}

describe("ThemeRuntime read snapshot", () => {
  it("contains every registered Theme in deterministic registry order", () => {
    const { runtime } = createRuntime();

    const snapshot = runtime.readSnapshot();

    expect(snapshot.themes.map((theme) => theme.themeId)).toEqual([
      cosmosTheme.objectId,
      secondTheme.objectId,
    ]);
    expect(snapshot.themes.map((theme) => theme.name)).toEqual([
      cosmosTheme.displayName,
      secondTheme.displayName,
    ]);
    expect(snapshot.fallbackThemeId).toBe(cosmosTheme.objectId);
    expect(snapshot.lastKnownGoodThemeId).toBe(cosmosTheme.objectId);
  });

  it("projects the authoritative active Theme ID and runtime status", async () => {
    const { runtime } = createRuntime();
    await runtime.activate(secondTheme.objectId);

    const snapshot = runtime.readSnapshot();

    expect(snapshot.activeThemeId).toBe(secondTheme.objectId);
    expect(snapshot.lastKnownGoodThemeId).toBe(secondTheme.objectId);
    expect(snapshot.themes.find((theme) => theme.themeId === secondTheme.objectId)).toMatchObject({
      runtimeStatus: "active",
      registryStatus: "registered",
      isFallback: false,
    });
    expect(snapshot.themes.find((theme) => theme.themeId === cosmosTheme.objectId)).toMatchObject({
      runtimeStatus: "inactive",
      isFallback: true,
    });
  });

  it("does not invent optional metadata that ThemeDefinition does not provide", () => {
    const { runtime } = createRuntime();

    const theme = runtime.readSnapshot().themes[0];

    expect(theme).toMatchObject({
      themeId: cosmosTheme.objectId,
      name: cosmosTheme.displayName,
      version: cosmosTheme.version,
      author: undefined,
      description: undefined,
    });
  });

  it("returns an immutable snapshot without applying a Theme or writing presentation state", async () => {
    const { runtime, presenter } = createRuntime();
    await runtime.activate(cosmosTheme.objectId);
    const applyCount = presenter.applied.length;

    const snapshot = runtime.readSnapshot();

    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.themes)).toBe(true);
    expect(snapshot.themes.every(Object.isFrozen)).toBe(true);
    expect(presenter.applied).toHaveLength(applyCount);
  });
});
