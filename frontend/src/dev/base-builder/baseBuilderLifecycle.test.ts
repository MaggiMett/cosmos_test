import { afterEach, describe, expect, it, vi } from "vitest";
import { CosmosApiClient } from "../../runtime/apiClient";
import { createBaseBuilderDocument } from "./baseBuilderDocument";
import { baseBuilderStandardCompositionFixture } from "./baseBuilderFixtures";
import { BaseBuilderLifecycle } from "./baseBuilderLifecycle";

afterEach(() => vi.unstubAllGlobals());

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("Base Builder load/edit/save lifecycle", () => {
  it("tracks the loaded revision and advances it after save", async () => {
    const document = createBaseBuilderDocument(baseBuilderStandardCompositionFixture);
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(response({ revisionId: "builder:1", document }))
      .mockResolvedValueOnce(response({ revisionId: "builder:2", document })));
    const lifecycle = new BaseBuilderLifecycle(new CosmosApiClient("http://cosmos.test"), "cosmos.base.default");

    await lifecycle.load();
    expect(lifecycle.revisionId).toBe("builder:1");
    expect(await lifecycle.save(document)).toBe(true);
    expect(lifecycle.revisionId).toBe("builder:2");
    expect(lifecycle.phase).toBe("ready");
  });

  it("keeps local edits recoverable when CAS reports a conflict", async () => {
    const document = createBaseBuilderDocument(baseBuilderStandardCompositionFixture);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ code: "conflict", message: "changed" }, 409)));
    const lifecycle = new BaseBuilderLifecycle(new CosmosApiClient("http://cosmos.test"), "cosmos.base.default");
    lifecycle.revisionId = "builder:old";

    expect(await lifecycle.save(document)).toBe(false);
    expect(lifecycle.phase).toBe("conflict");
    expect(lifecycle.revisionId).toBe("builder:old");
  });
});
