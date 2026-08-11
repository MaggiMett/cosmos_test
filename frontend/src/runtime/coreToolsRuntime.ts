import type { CosmosApiClient } from "./apiClient";

export interface ResourceNode {
  name: string;
  path: string;
  type: "directory" | "file";
  children: ResourceNode[] | null;
  sizeBytes?: number;
  modifiedAt?: string;
  editable?: boolean;
  contentHash?: string;
}

export interface ResourceContent {
  projectId: string;
  metadata: ResourceNode & { contentHash: string };
  contentType: "text" | "image" | "binary";
  content: string | null;
  dataUrl: string | null;
  editable: boolean;
  supported: boolean;
  message: string | null;
}

export interface KnowledgeRecord {
  objectId: string;
  displayName: string;
  title: string;
  current_content: string;
  summary: string;
  current_version: number;
  processed_status: string;
  versions?: Array<Record<string, unknown>>;
}

export interface CaptureDraft {
  draftId: string;
  mode: string;
  content: string;
  attachments: unknown[];
  updatedAt: string;
}

export interface ReviewRecord {
  objectId: string;
  displayName: string;
  summary: string;
  review_reason: string;
  evidence: unknown[];
  confidence: number;
  available_actions: string[];
  review_state: string;
  urgency: string;
}

export interface JourneymanTask {
  objectId: string;
  displayName: string;
  objective: string;
  task_state: string;
  plan: Array<{ step: string; state: string }>;
  events: Array<{ type: string; message: string; timestamp: string }>;
  result: Record<string, unknown>;
  provider_id: string;
}

export class CoreToolsRuntime {
  constructor(private readonly api: CosmosApiClient) {}

  async fileTree(sessionId: string, query = "") {
    return this.get<{ projectId: string; tree: ResourceNode }>(this.path(sessionId, "files"), { q: query });
  }

  async readFile(sessionId: string, path: string) {
    return this.get<ResourceContent>(this.path(sessionId, "files/content"), { path });
  }

  async createFile(sessionId: string, path: string, content: string) {
    return this.post<ResourceContent>(this.path(sessionId, "files"), { path, content });
  }

  async editFile(sessionId: string, path: string, content: string, expectedHash: string) {
    return this.put<ResourceContent>(this.path(sessionId, "files/content"), { path, content, expectedHash });
  }

  async moveFile(sessionId: string, sourcePath: string, destinationPath: string) {
    return this.post<ResourceContent>(this.path(sessionId, "files/move"), { sourcePath, destinationPath });
  }

  async deleteFile(sessionId: string, path: string) {
    return this.remove<{ deleted: boolean }>(this.path(sessionId, "files/content"), { path });
  }

  async archive(sessionId: string, query = "") {
    return this.get<KnowledgeRecord[]>(this.path(sessionId, "archive"), { q: query });
  }

  async knowledge(sessionId: string, objectId: string) {
    return this.get<KnowledgeRecord>(this.path(sessionId, `archive/${objectId}`));
  }

  async editKnowledge(sessionId: string, objectId: string, value: { title: string; content: string; summary: string }) {
    return this.put<KnowledgeRecord>(this.path(sessionId, `archive/${objectId}`), value);
  }

  async drafts(sessionId: string) {
    return this.get<CaptureDraft[]>(this.path(sessionId, "capture/drafts"));
  }

  async saveDraft(sessionId: string, draftId: string, value: { mode: string; content: string; attachments: unknown[] }) {
    return this.put<CaptureDraft>(this.path(sessionId, `capture/drafts/${draftId}`), value);
  }

  async deleteDraft(sessionId: string, draftId: string) {
    return this.remove(this.path(sessionId, `capture/drafts/${draftId}`));
  }

  async submitCapture(sessionId: string, value: { mode: string; content: string; attachments: unknown[]; draftId?: string }) {
    return this.post<{ knowledge: KnowledgeRecord; job: Record<string, unknown> }>(this.path(sessionId, "capture/submissions"), value);
  }

  async reviews(sessionId: string) {
    return this.get<ReviewRecord[]>(this.path(sessionId, "reviews"));
  }

  async decideReview(sessionId: string, reviewId: string, action: string, note = "") {
    return this.post<ReviewRecord>(this.path(sessionId, `reviews/${reviewId}/decisions`), { action, note });
  }

  async journeymanTasks(sessionId: string) {
    return this.get<JourneymanTask[]>(this.path(sessionId, "journeyman/tasks"));
  }

  async createJourneymanTask(sessionId: string, objective: string) {
    return this.post<JourneymanTask>(this.path(sessionId, "journeyman/tasks"), { objective });
  }

  async cancelJourneymanTask(sessionId: string, taskId: string) {
    return this.remove<JourneymanTask>(this.path(sessionId, `journeyman/tasks/${taskId}`));
  }

  private path(sessionId: string, suffix: string) {
    return `/workspace-sessions/${encodeURIComponent(sessionId)}/${suffix}`;
  }

  private async get<T>(path: string, query?: Record<string, string>) {
    const result = await this.api.get<T>(path, { query });
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  private async post<T>(path: string, body: unknown) {
    const result = await this.api.post<T>(path, body);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  private async put<T>(path: string, body: unknown) {
    const result = await this.api.put<T>(path, body);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  private async remove<T = Record<string, unknown>>(path: string, query?: Record<string, string>) {
    const result = await this.api.delete<T>(path, { query });
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }
}
