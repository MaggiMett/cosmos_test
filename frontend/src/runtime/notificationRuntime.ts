import { reactive, readonly } from "vue";

import type { CosmosApiClient } from "./apiClient";
import type { BaseRuntime } from "./baseRuntime";
import type { CosmosMapRuntime } from "./cosmosMapRuntime";

export type NotificationCategory = "Tasks" | "Discoveries" | "Suggestions" | "Projects" | "System";

export interface CosmosNotification {
  objectId: string;
  displayName: string;
  description: string;
  systemTags: string[];
  userTags: string[];
  category: NotificationCategory;
  message: string;
  sourceObjectId: string;
  destinationObjectId: string;
  read: boolean;
  createdAt: string;
  primaryProjectId: string | null;
}

interface NotificationState {
  phase: "idle" | "loading" | "ready" | "failed";
  values: CosmosNotification[];
  error: string | null;
}

export class NotificationRuntime {
  private readonly mutableState = reactive<NotificationState>({
    phase: "idle",
    values: [],
    error: null,
  });
  private loadPromise: Promise<void> | null = null;

  readonly state = readonly(this.mutableState);

  constructor(
    private readonly api: CosmosApiClient,
    private readonly cosmosMap: CosmosMapRuntime,
    private readonly base: BaseRuntime,
  ) {}

  async load(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;
    this.mutableState.phase = "loading";
    this.mutableState.error = null;
    this.loadPromise = this.api
      .get<CosmosNotification[]>("/notifications")
      .then((result) => {
        if (!result.ok) throw new Error(result.error.message);
        this.mutableState.values = result.data.map(copyNotification);
        this.mutableState.phase = "ready";
        this.syncIndicator();
      })
      .catch((error: unknown) => {
        this.mutableState.phase = "failed";
        this.mutableState.error =
          error instanceof Error ? error.message : "Notifications could not load.";
        throw error;
      })
      .finally(() => {
        this.loadPromise = null;
      });
    return this.loadPromise;
  }

  async markRead(objectId: string): Promise<CosmosNotification> {
    const result = await this.api.put<CosmosNotification>(
      `/notifications/${encodeURIComponent(objectId)}`,
      { read: true },
    );
    if (!result.ok) throw new Error(result.error.message);
    const index = this.mutableState.values.findIndex((value) => value.objectId === objectId);
    if (index >= 0) this.mutableState.values[index] = copyNotification(result.data);
    this.syncIndicator();
    return copyNotification(result.data);
  }

  private syncIndicator(): void {
    const available = this.mutableState.values.some((value) => !value.read);
    this.cosmosMap.setNotificationAvailable(available);
    this.base.setNotificationAvailable(available);
  }
}

function copyNotification(value: CosmosNotification): CosmosNotification {
  return { ...value, systemTags: [...value.systemTags], userTags: [...value.userTags] };
}
