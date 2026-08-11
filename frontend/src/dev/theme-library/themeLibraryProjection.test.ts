import { describe, expect, it, vi } from "vitest";

import type { ThemeRuntimeReadSnapshot } from "../../runtime/themeRuntimeReadSnapshot";
import {
  loadThemeLibrarySnapshot,
  projectThemeLibrarySnapshot,
} from "./themeLibraryProjection";

function snapshot(
  themes: ThemeRuntimeReadSnapshot["themes"],
  activeThemeId: string | null,
): Readonly<ThemeRuntimeReadSnapshot> {
  return Object.freeze({
    themes: Object.freeze([...themes]),
    activeThemeId,
    lastKnownGoodThemeId: "cosmos.theme.core",
    fallbackThemeId: "cosmos.theme.core",
  });
}

function theme(themeId: string, runtimeStatus: "active" | "inactive" = "inactive") {
  return Object.freeze({
    themeId,
    name: `Name for ${themeId}`,
    version: "1.0.0",
    author: undefined,
    description: undefined,
    registryStatus: "registered" as const,
    runtimeStatus,
    isFallback: themeId === "cosmos.theme.core",
  });
}

describe("Theme Library Runtime projection", () => {
  it("maps exactly one real Theme to exactly one active Library card", () => {
    const presentation = projectThemeLibrarySnapshot(
      snapshot([theme("cosmos.theme.core", "active")], "cosmos.theme.core"),
    );

    expect(presentation.phase).toBe("success");
    if (presentation.phase !== "success") throw new Error("Expected success presentation.");
    expect(presentation.themes).toHaveLength(1);
    expect(presentation.themes[0]).toMatchObject({
      themeId: "cosmos.theme.core",
      name: "Name for cosmos.theme.core",
      version: "1.0.0",
      author: undefined,
      description: undefined,
      status: "Active",
      isFallback: true,
    });
    expect(presentation.activeTheme).toBe(presentation.themes[0]);
  });

  it("maps multiple registered Themes without fixture entries or invented metadata", () => {
    const presentation = projectThemeLibrarySnapshot(
      snapshot(
        [theme("real.theme.alpha", "active"), theme("real.theme.beta")],
        "real.theme.alpha",
      ),
    );

    expect(presentation.phase).toBe("success");
    if (presentation.phase !== "success") throw new Error("Expected success presentation.");
    expect(presentation.themes.map((item) => item.themeId)).toEqual([
      "real.theme.alpha",
      "real.theme.beta",
    ]);
    expect(presentation.themes[1]).toMatchObject({
      status: "Installed",
      author: undefined,
      description: undefined,
    });
    expect(JSON.stringify(presentation)).not.toMatch(
      /Cosmos Reference|Minimal|Nebula Garden|Industrial|Fantasy|Pixel/,
    );
  });

  it("returns the real empty-registry state", () => {
    expect(projectThemeLibrarySnapshot(snapshot([], null))).toEqual({
      phase: "empty",
      themeCount: 0,
    });
  });

  it("returns an inconsistency state when the active Theme is absent", () => {
    expect(
      projectThemeLibrarySnapshot(
        snapshot([theme("real.theme.alpha")], "real.theme.missing"),
      ),
    ).toEqual({
      phase: "active-missing",
      themeCount: 1,
      activeThemeId: "real.theme.missing",
    });
  });

  it("does not manufacture an active Theme when no active ID exists", () => {
    expect(projectThemeLibrarySnapshot(snapshot([theme("real.theme.alpha")], null))).toEqual({
      phase: "active-missing",
      themeCount: 1,
      activeThemeId: null,
    });
  });

  it("reads without activating or mutating ThemeRuntime", async () => {
    const readSnapshot = vi.fn(() => snapshot([], null));
    const activate = vi.fn();
    const runtime = { readSnapshot, activate };

    await expect(loadThemeLibrarySnapshot(runtime)).resolves.toEqual(snapshot([], null));
    expect(readSnapshot).toHaveBeenCalledOnce();
    expect(activate).not.toHaveBeenCalled();
  });

  it("propagates read failures for the View error state", async () => {
    const failure = new Error("runtime read failed");
    const runtime = { readSnapshot: vi.fn(() => { throw failure; }) };

    await expect(loadThemeLibrarySnapshot(runtime)).rejects.toBe(failure);
  });
});
