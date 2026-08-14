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

  it("activates only the currently tracked saved revision", async () => {
    const document = createBaseBuilderDocument(baseBuilderStandardCompositionFixture);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ revisionId: "builder:1", document }))
      .mockResolvedValueOnce(response({ baseObjectId: "cosmos.base.default", revisionId: "builder:1", document }));
    vi.stubGlobal("fetch", fetchMock);
    const lifecycle = new BaseBuilderLifecycle(new CosmosApiClient("http://cosmos.test"), "cosmos.base.default");

    await lifecycle.load();
    expect(await lifecycle.activateSavedRevision()).toBe(true);
    expect(fetchMock.mock.calls[1][0]).toBe("http://cosmos.test/base-builder/cosmos.base.default/activate");
    expect(fetchMock.mock.calls[1][1].method).toBe("POST");
  });

  it("keeps local edits recoverable when CAS reports a conflict", async () => {
    const document = createBaseBuilderDocument(baseBuilderStandardCompositionFixture);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ code: "conflict", message: "changed" }, 409)));
    const lifecycle = new BaseBuilderLifecycle(new CosmosApiClient("http://cosmos.test"), "cosmos.base.default");
    lifecycle.revisionId = "builder:old";

    expect(await lifecycle.save(document)).toBe(false);
    expect(lifecycle.phase).toBe("conflict");
    expect(lifecycle.revisionId).toBe("builder:old");
    expect(lifecycle.pendingDocument).toEqual(document);
  });

  it("reloads the remote revision without losing conflicting local edits, then retries", async () => {
    const local = createBaseBuilderDocument(baseBuilderStandardCompositionFixture);
    const remote = structuredClone(local);
    remote.base.revision.revisionId = "builder:remote";
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(response({ code: "conflict", message: "changed" }, 409))
      .mockResolvedValueOnce(response({ revisionId: "builder:remote", document: remote }))
      .mockResolvedValueOnce(response({ revisionId: "builder:merged", document: local })));
    const lifecycle = new BaseBuilderLifecycle(new CosmosApiClient("http://cosmos.test"), "cosmos.base.default");
    lifecycle.revisionId = "builder:old";

    expect(await lifecycle.save(local)).toBe(false);
    expect(await lifecycle.reloadAfterConflict()).toEqual(remote);
    expect(lifecycle.revisionId).toBe("builder:remote");
    expect(lifecycle.pendingDocument).toEqual(local);
    expect(await lifecycle.retryPendingSave()).toBe(true);
    expect(lifecycle.revisionId).toBe("builder:merged");
    expect(lifecycle.pendingDocument).toBeNull();
  });

  it("can explicitly discard pending conflicting edits", async () => {
    const document = createBaseBuilderDocument(baseBuilderStandardCompositionFixture);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ code: "conflict", message: "changed" }, 409)));
    const lifecycle = new BaseBuilderLifecycle(new CosmosApiClient("http://cosmos.test"), "cosmos.base.default");

    await lifecycle.save(document);
    lifecycle.discardPendingEdits();

    expect(lifecycle.pendingDocument).toBeNull();
    expect(lifecycle.phase).toBe("ready");
    expect(lifecycle.error).toBeNull();
  });
});
