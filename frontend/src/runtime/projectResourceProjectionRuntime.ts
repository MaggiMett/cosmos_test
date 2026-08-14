import { reactive, readonly } from "vue";

import type { CosmosApiClient } from "./apiClient";

export interface ProjectResourceProjectionItem {
  projectId: string;
  resourcePath: string;
  displayName: string;
  kind: "group" | "resource";
  depth: number;
  editable: boolean;
  children: ProjectResourceProjectionItem[];
}

export interface ProjectResourceProjectionSnapshot {
  projectId: string;
  items: ProjectResourceProjectionItem[];
}

interface ProjectResourceProjectionState {
  phase: "idle" | "loading" | "ready" | "error";
  snapshot: ProjectResourceProjectionSnapshot | null;
  error: string | null;
}

export class ProjectResourceProjectionRuntime {
  private requestGeneration = 0;
  private readonly mutableState = reactive<ProjectResourceProjectionState>({
    phase: "idle",
    snapshot: null,
    error: null,
  });

  readonly state = readonly(this.mutableState);

  constructor(private readonly api: CosmosApiClient) {}

  async load(projectId: string): Promise<ProjectResourceProjectionSnapshot | null> {
    const generation = ++this.requestGeneration;
    this.mutableState.phase = "loading";
    this.mutableState.snapshot = null;
    this.mutableState.error = null;
    const result = await this.api.get<ProjectResourceProjectionSnapshot>(
      `/projects/${encodeURIComponent(projectId)}/resource-projection`,
    );
    if (generation !== this.requestGeneration) return null;
    if (!result.ok) {
      this.mutableState.phase = "error";
      this.mutableState.snapshot = null;
      this.mutableState.error = result.error.message;
      return null;
    }
    this.mutableState.snapshot = result.data;
    this.mutableState.phase = "ready";
    return result.data;
  }

  clear(): void {
    this.requestGeneration += 1;
    this.mutableState.phase = "idle";
    this.mutableState.snapshot = null;
    this.mutableState.error = null;
  }
}
