import type { BaseBuilderDocument } from "./baseBuilderDocument";

export const BASE_BUILDER_DOCUMENT_KIND = "cosmos.base-composition.v1" as const;

export interface BaseBuilderPersistCommand {
  kind: typeof BASE_BUILDER_DOCUMENT_KIND;
  baseObjectId: string;
  expectedRevisionId: string | null;
  document: BaseBuilderDocument;
}

export function createBaseBuilderPersistCommand(
  baseObjectId: string,
  document: Readonly<BaseBuilderDocument>,
  expectedRevisionId: string | null = null,
): Readonly<BaseBuilderPersistCommand> {
  if (!baseObjectId.trim()) throw new Error("Base Builder persistence requires a Base Object id.");
  return Object.freeze({
    kind: BASE_BUILDER_DOCUMENT_KIND,
    baseObjectId: baseObjectId.trim(),
    expectedRevisionId,
    document: structuredClone(document),
  });
}
