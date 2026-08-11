import { describe, expect, it } from "vitest";

import { validateThemeBuilderProject } from "./themeBuilderProject";

describe("Theme Builder Project contract", () => {
  it("projects a valid response as a deeply immutable document", () => {
    const project = validateThemeBuilderProject(projectFixture());
    expect(project.builderProjectId).toBe("user.theme-builder-project.test");
    expect(Object.isFrozen(project)).toBe(true);
    expect(Object.isFrozen(project.manifestDraft)).toBe(true);
    expect(Object.isFrozen(project.artifacts.skinPacks)).toBe(true);
  });

  it("rejects inconsistent manifest identity", () => {
    const value = projectFixture();
    value.manifestDraft.themeId = "user.theme.other";
    expect(() => validateThemeBuilderProject(value)).toThrow("invalid");
  });
});

function projectFixture() {
  return {
    schemaVersion: 1,
    builderProjectId: "user.theme-builder-project.test",
    revision: 1,
    createdAt: "2026-08-09T10:00:00+00:00",
    updatedAt: "2026-08-09T10:00:00+00:00",
    contractVersions: { themeBuilder: "1.0.0", themeEngine: "1.0.0" },
    themeId: "user.theme.test",
    packageId: "user.theme-package.test",
    name: "Test Theme",
    description: "A test draft.",
    author: "Tester",
    packageType: "full-theme",
    themeVersion: "0.1.0",
    packageVersion: "0.1.0",
    manifestDraft: {
      schemaVersion: 1,
      themeId: "user.theme.test",
      version: "0.1.0",
      displayName: "Test Theme",
      description: "A test draft.",
      packageKind: "full-theme",
      compatibility: { themeEngine: "^1.0.0" },
      groups: [],
      packRefs: [],
      tokens: {},
      systemTerms: {},
      author: { name: "Tester" },
    },
    artifacts: { skinPacks: [], roomShells: [], catalogObjects: [] },
    assetRefs: [],
  };
}
