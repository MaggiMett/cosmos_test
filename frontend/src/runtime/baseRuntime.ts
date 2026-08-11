import { reactive, readonly } from "vue";

import type { CosmosApiClient } from "./apiClient";

export interface BaseObjectSummary {
  objectId: string;
  displayName: string;
  description: string;
  systemTags: string[];
  userTags: string[];
}

export interface BaseWorkspace extends BaseObjectSummary {
  icon: string;
  overlay: string;
  sourceProjectId: string;
}

export interface WorkspaceSlot extends BaseObjectSummary {
  placement: string;
  skin: string;
  workspace: BaseWorkspace | null;
}

export interface BaseRoom extends BaseObjectSummary {
  slug: "main" | "workshop";
  order: number;
  atmosphere: string;
  workspaceSlots: WorkspaceSlot[];
}

export interface BaseSnapshot {
  base: BaseObjectSummary;
  rooms: BaseRoom[];
  door: BaseObjectSummary & { roomAId: string; roomBId: string };
  cockpit: BaseObjectSummary & { roomId: string };
  companion: BaseObjectSummary & { notificationAvailable: boolean };
  pet: BaseObjectSummary;
  unassignedWorkspaces: BaseWorkspace[];
}

interface BaseState {
  phase: "idle" | "loading" | "ready" | "failed";
  snapshot: BaseSnapshot | null;
  selectedObjectId: string | null;
  error: string | null;
}

export class BaseRuntime {
  private readonly mutableState = reactive<BaseState>({
    phase: "idle",
    snapshot: null,
    selectedObjectId: null,
    error: null,
  });
  private loadPromise: Promise<void> | null = null;

  readonly state = readonly(this.mutableState);

  constructor(private readonly api: CosmosApiClient) {}

  async load(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;
    this.mutableState.phase = "loading";
    this.mutableState.error = null;
    this.loadPromise = this.api
      .get<BaseSnapshot>("/base")
      .then((result) => {
        if (!result.ok) throw new Error(result.error.message);
        this.mutableState.snapshot = result.data;
        this.mutableState.phase = "ready";
      })
      .catch((error: unknown) => {
        this.mutableState.phase = "failed";
        this.mutableState.error = error instanceof Error ? error.message : "The Base could not load.";
        throw error;
      })
      .finally(() => {
        this.loadPromise = null;
      });
    return this.loadPromise;
  }

  room(slug: string): BaseRoom | null {
    return this.mutableState.snapshot?.rooms.find((room) => room.slug === slug) ?? null;
  }

  select(objectId: string | null): void {
    this.mutableState.selectedObjectId = objectId;
  }

  setNotificationAvailable(available: boolean): void {
    if (this.mutableState.snapshot) {
      this.mutableState.snapshot.companion.notificationAvailable = available;
    }
  }
}
