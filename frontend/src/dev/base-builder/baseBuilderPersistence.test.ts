import { afterEach, describe, expect, it, vi } from "vitest";

import { CosmosApiClient } from "../../runtime/apiClient";
import { createBaseBuilderDocument } from "./baseBuilderDocument";
import { baseBuilderStandardCompositionFixture } from "./baseBuilderFixtures";
import { BASE_BUILDER_DOCUMENT_KIND, createBaseBuilderPersistCommand, persistBaseBuilderDocument } from "./baseBuilderPersistence";

afterEach(() => vi.unstubAllGlobals());

describe("Base Builder persistence handoff", () => {
  it("creates an explicit versioned command without activating the document", () => {
    const document = createBaseBuilderDocument(baseBuilderStandardCompositionFixture);
    const command = createBaseBuilderPersistCommand("cosmos.base.main", document, "revision-7");

    expect(command.kind).toBe(BASE_BUILDER_DOCUMENT_KIND);
    expect(command.baseObjectId).toBe("cosmos.base.main");
    expect(command.expectedRevisionId).toBe("revision-7");
    expect(command.document).toEqual(document);
    expect(command.document).not.toBe(document);
  });

  it("hands the command to the Base Builder API without activation side effects", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ revisionId: "builder:1", document: {} }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const document = createBaseBuilderDocument(baseBuilderStandardCompositionFixture);
    const command = createBaseBuilderPersistCommand("cosmos.base.main", document, null);

    const result = await persistBaseBuilderDocument(new CosmosApiClient("http://cosmos.test"), command);

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe("http://cosmos.test/base-builder/cosmos.base.main/document");
    expect(fetchMock.mock.calls[0][1].method).toBe("PUT");
  });

  it("requires an explicit Base Object identity", () => {
    const document = createBaseBuilderDocument(baseBuilderStandardCompositionFixture);
    expect(() => createBaseBuilderPersistCommand("  ", document)).toThrow(/Base Object id/);
  });
});
