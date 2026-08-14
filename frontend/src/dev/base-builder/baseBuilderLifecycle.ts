import type { CosmosApiClient } from "../../runtime/apiClient";
import type { BaseBuilderDocument } from "./baseBuilderDocument";
import {
  activateBaseBuilderDocument,
  createBaseBuilderPersistCommand,
  loadBaseBuilderDocument,
  persistBaseBuilderDocument,
} from "./baseBuilderPersistence";

export type BaseBuilderLifecyclePhase = "idle" | "loading" | "ready" | "saving" | "conflict" | "error";

export class BaseBuilderLifecycle {
  phase: BaseBuilderLifecyclePhase = "idle";
  revisionId: string | null = null;
  document: BaseBuilderDocument | null = null;
  pendingDocument: BaseBuilderDocument | null = null;
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
    this.pendingDocument = null;
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
      this.pendingDocument = result.error.code === "conflict" ? structuredClone(document) : null;
      this.error = result.error.message;
      return false;
    }
    this.revisionId = result.data.revisionId;
    this.document = result.data.document;
    this.pendingDocument = null;
    this.phase = "ready";
    return true;
  }

  async activateSavedRevision(): Promise<boolean> {
    if (!this.revisionId || !this.document) throw new Error("Base Builder has no saved revision to activate.");
    this.error = null;
    const result = await activateBaseBuilderDocument(this.api, this.baseObjectId, this.revisionId);
    if (!result.ok) {
      this.phase = result.error.code === "conflict" ? "conflict" : "error";
      this.error = result.error.message;
      return false;
    }
    this.phase = "ready";
    return true;
  }

  async reloadAfterConflict(): Promise<BaseBuilderDocument | null> {
    if (this.phase !== "conflict" || !this.pendingDocument) {
      throw new Error("Base Builder has no conflict to reload.");
    }
    const localEdits = this.pendingDocument;
    const remote = await this.load();
    this.pendingDocument = localEdits;
    return remote;
  }

  async retryPendingSave(): Promise<boolean> {
    if (!this.pendingDocument) throw new Error("Base Builder has no pending document to save.");
    return this.save(this.pendingDocument);
  }

  discardPendingEdits(): void {
    this.pendingDocument = null;
    this.error = null;
    if (this.phase === "conflict") this.phase = "ready";
  }
}
