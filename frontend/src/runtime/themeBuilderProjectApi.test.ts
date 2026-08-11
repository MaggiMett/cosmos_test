import { afterEach, describe, expect, it, vi } from "vitest";

import { CosmosApiClient } from "./apiClient";
import { ThemeBuilderProjectApi } from "./themeBuilderProjectApi";

describe("ThemeBuilderProjectApi", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses the persistent project boundary and explicit revision save", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(projectFixture()))
      .mockResolvedValueOnce(response({ ...projectFixture(), revision: 2 }));
    vi.stubGlobal("fetch", fetchMock);
    const api = new ThemeBuilderProjectApi(new CosmosApiClient("http://cosmos.test"));

    await api.get("user.theme-builder-project.test");
    await api.saveDraft("user.theme-builder-project.test", 1, {
      name: "Test Theme", description: "A test draft.", author: "Tester",
    }, [{ id: "personal.visual-asset.real", version: "1.0.0" }]);

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://cosmos.test/theme-builder/projects/user.theme-builder-project.test",
    );
    const request = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(request.method).toBe("PUT");
    expect(JSON.parse(String(request.body))).toMatchObject({
      expectedRevision: 1,
      assetRefs: [{ id: "personal.visual-asset.real", version: "1.0.0" }],
    });
  });
});

function response(value: unknown): Response {
  return new Response(JSON.stringify(value), { status: 200, headers: { "Content-Type": "application/json" } });
}

function projectFixture() {
  return {
    schemaVersion: 1, builderProjectId: "user.theme-builder-project.test", revision: 1,
    createdAt: "2026-08-09T10:00:00+00:00", updatedAt: "2026-08-09T10:00:00+00:00",
    contractVersions: { themeBuilder: "1.0.0", themeEngine: "1.0.0" },
    themeId: "user.theme.test", packageId: "user.theme-package.test", name: "Test Theme",
    description: "A test draft.", author: "Tester", packageType: "full-theme",
    themeVersion: "0.1.0", packageVersion: "0.1.0",
    manifestDraft: { schemaVersion: 1, themeId: "user.theme.test", version: "0.1.0",
      displayName: "Test Theme", description: "A test draft.", packageKind: "full-theme",
      compatibility: { themeEngine: "^1.0.0" }, groups: [], packRefs: [], tokens: {}, systemTerms: {},
      author: { name: "Tester" } },
    artifacts: { skinPacks: [], roomShells: [], catalogObjects: [] }, assetRefs: [],
  };
}
