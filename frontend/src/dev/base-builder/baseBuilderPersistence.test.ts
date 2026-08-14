import { describe, expect, it } from "vitest";

import { createBaseBuilderDocument } from "./baseBuilderDocument";
import { baseBuilderStandardCompositionFixture } from "./baseBuilderFixtures";
import { BASE_BUILDER_DOCUMENT_KIND, createBaseBuilderPersistCommand } from "./baseBuilderPersistence";

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

  it("requires an explicit Base Object identity", () => {
    const document = createBaseBuilderDocument(baseBuilderStandardCompositionFixture);
    expect(() => createBaseBuilderPersistCommand("  ", document)).toThrow(/Base Object id/);
  });
});
