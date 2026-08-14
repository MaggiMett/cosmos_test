import type { CosmosApiClient } from "../../runtime/apiClient";
import type { BaseBuilderDocument } from "./baseBuilderDocument";
import {
  createBaseBuilderPersistCommand,
  loadBaseBuilderDocument,
  persistBaseBuilderDocument,
} from "./baseBuilderPersistence";

export type BaseBuilderLifecyclePhase = "idle" | "loading" | "ready" | "saving" | "conflict" | "error";

export class BaseBuilderLifecycle {
  phase: BaseBuilderLifecyclePhase = "idle";
  revisionId: string | null = null;
  document: BaseBuilderDocument | null = null;
  error: string | null = null;

  constructor(private readonly api: CosmosApiClient, readonly baseObjectId: string) {}

  async load(): Promise<BaseBuilderDocument | null> {
    this.phase = "loading";
    this.error = null;
    const result = await loadBaseBuilderDocument(this.api, this.baseObjectId);
    if (!result.ok) {
      this.phase = "error";
      this.error = result.error.message;
      return null;
    }
    this.revisionId = result.data.revisionId;
    this.document = result.data.document;
    this.phase = "ready";
    return this.document;
  }

  async save(document: Readonly<BaseBuilderDocument>): Promise<boolean> {
    this.phase = "saving";
    this.error = null;
    const command = createBaseBuilderPersistCommand(this.baseObjectId, document, this.revisionId);
    const result = await persistBaseBuilderDocument(this.api, command);
    if (!result.ok) {
      this.phase = result.error.code === "conflict" ? "conflict" : "error";
      this.error = result.error.message;
      return false;
    }
    this.revisionId = result.data.revisionId;
    this.document = result.data.document;
    this.phase = "ready";
    return true;
  }
}
