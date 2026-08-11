import { afterEach, describe, expect, it, vi } from "vitest";

import { CosmosApiClient } from "./apiClient";

describe("CosmosApiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports unavailable when no API base URL is configured", async () => {
    const result = await new CosmosApiClient("").get("/health");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("unavailable");
  });

  it("normalizes the base URL, path, and query", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await new CosmosApiClient("http://127.0.0.1:8000/").get("health", {
      query: { active: true, empty: "", skipped: undefined },
    });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/health?active=true",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("preserves structured backend error messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Invalid request." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const result = await new CosmosApiClient("http://127.0.0.1:8000").post("/future", {});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("validation");
      expect(result.error.message).toBe("Invalid request.");
      expect(result.error.details).toEqual({ message: "Invalid request." });
    }
  });

  it("uploads binary content with its explicit media type and preserves diagnostics", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          diagnostics: [{ code: "theme_package_conflict", message: "Already installed." }],
        }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const archive = new Blob(["zip-bytes"], { type: "application/zip" });

    const result = await new CosmosApiClient("http://127.0.0.1:8000").upload(
      "/theme-packages/import",
      archive,
      "application/zip",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/theme-packages/import",
      expect.objectContaining({
        method: "POST",
        body: archive,
        headers: { "Content-Type": "application/zip" },
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.status).toBe(409);
      expect(result.error.code).toBe("theme_package_conflict");
      expect(result.error.details).toMatchObject({ success: false });
    }
  });
});
