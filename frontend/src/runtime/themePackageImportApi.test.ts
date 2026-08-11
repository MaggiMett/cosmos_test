import { afterEach, describe, expect, it, vi } from "vitest";

import { CosmosApiClient } from "./apiClient";
import { ThemePackageImportApi, type ThemePackageImportSuccess } from "./themePackageImportApi";

describe("ThemePackageImportApi", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("posts the selected ZIP bytes to the safe import endpoint", async () => {
    const payload = successResult();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["PK\u0003\u0004package"], "aurora.zip", { type: "application/zip" });

    const result = await new ThemePackageImportApi(
      new CosmosApiClient("http://127.0.0.1:8000"),
    ).importPackage(file);

    expect(result).toEqual({ ok: true, data: payload });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/theme-packages/import",
      expect.objectContaining({
        method: "POST",
        body: file,
        headers: { "Content-Type": "application/zip" },
      }),
    );
  });
});

export function successResult(): ThemePackageImportSuccess {
  return {
    success: true,
    packageId: "max.theme-package.aurora",
    packageVersion: "1.0.0",
    themeId: "max.theme.aurora",
    themeName: "Aurora",
    installStatus: "installed",
    diagnostics: [],
    assets: { total: 3, installed: 2, reused: 1 },
    integrity: {
      status: "verified",
      archiveSha256: "a".repeat(64),
      manifestSha256: "b".repeat(64),
    },
    runtimeRegistration: "next-startup",
  };
}
