import { reactive, readonly } from "vue";

import type { CosmosApiClient } from "./apiClient";
import type { WindowBounds, WindowInstance } from "./windowRuntime";
import { WindowRuntime } from "./windowRuntime";

export type ToolRuntimeKind = "native" | "web" | "service" | "desktop" | "command";

export interface ToolDefinition {
  objectId: string;
  displayName: string;
  description: string;
  icon: string;
  minimumSize: Readonly<{ width: number; height: number }>;
  componentKey: string;
  runtimeKind: ToolRuntimeKind;
  runtimeConfiguration: Record<string, unknown>;
  entryPoint: string;
  category?: string;
  capabilities?: string[];
  permissions?: string[];
}

export interface PersistedToolRecord {
  instanceId: string;
  definitionObjectId: string;
  windowObjectId: string;
  bounds: WindowBounds;
  focusOrder: number;
  state: "active" | "background";
  runtimeState: Record<string, unknown>;
}

export interface FrontendToolInstance {
  instanceId: string;
  definition: Readonly<ToolDefinition>;
  workspaceSessionId: string;
  windowObjectId: string;
  window: Readonly<WindowInstance>;
  runtimeState: Record<string, unknown>;
}

interface ToolRuntimeState {
  instances: FrontendToolInstance[];
  unavailableDefinitionIds: string[];
  error: string | null;
}

export class ToolRuntime {
  private readonly definitions = new Map<string, Readonly<ToolDefinition>>();
  private readonly mutableState = reactive<ToolRuntimeState>({
    instances: [],
    unavailableDefinitionIds: [],
    error: null,
  });

  readonly state = readonly(this.mutableState);

  constructor(
    private readonly windows: WindowRuntime,
    private readonly api: CosmosApiClient,
  ) {}

  register(definition: ToolDefinition): void {
    if (this.definitions.has(definition.objectId)) {
      throw new Error(`Tool definition is already registered: ${definition.objectId}`);
    }
    if (definition.minimumSize.width <= 0 || definition.minimumSize.height <= 0) {
      throw new Error("Tool minimum size must be positive.");
    }
    this.definitions.set(definition.objectId, Object.freeze({ ...definition }));
  }

  async loadDefinitions(): Promise<void> {
    await this.discover();
  }

  async discover(requiredCapabilities: readonly string[] = []): Promise<readonly Readonly<ToolDefinition>[]> {
    const query = requiredCapabilities.map((capability) => `capability=${encodeURIComponent(capability)}`).join("&");
    const result = await this.api.get<ToolDefinition[]>(query ? `/tools?${query}` : "/tools");
    if (!result.ok) throw new Error(result.error.message);
    if (requiredCapabilities.length === 0) {
      this.definitions.clear();
      for (const definition of result.data) this.register(definition);
      this.mutableState.unavailableDefinitionIds = [];
    }
    return [...result.data].sort((left, right) => left.displayName.localeCompare(right.displayName));
  }

  available(assignedToolIds?: readonly string[]): readonly Readonly<ToolDefinition>[] {
    const assigned = assignedToolIds ? new Set(assignedToolIds) : null;
    return [...this.definitions.values()]
      .filter((definition) => !assigned || assigned.has(definition.objectId))
      .sort((left, right) => left.displayName.localeCompare(right.displayName));
  }

  async open(
    workspaceSessionId: string,
    parentWindowId: string,
    definitionObjectId: string,
    bounds: WindowBounds,
  ): Promise<Readonly<FrontendToolInstance>> {
    const definition = this.requireDefinition(definitionObjectId);
    const result = await this.api.post<PersistedToolRecord>(
      `/workspace-sessions/${workspaceSessionId}/tools`,
      { toolDefinitionId: definitionObjectId, bounds },
    );
    if (!result.ok) throw new Error(result.error.message);
    return this.attach(workspaceSessionId, parentWindowId, definition, result.data);
  }

  restore(
    workspaceSessionId: string,
    parentWindowId: string,
    records: readonly PersistedToolRecord[],
  ): void {
    for (const record of [...records].sort((left, right) => left.focusOrder - right.focusOrder)) {
      const definition = this.definitions.get(record.definitionObjectId);
      if (!definition) {
        if (!this.mutableState.unavailableDefinitionIds.includes(record.definitionObjectId)) {
          this.mutableState.unavailableDefinitionIds.push(record.definitionObjectId);
        }
        continue;
      }
      this.attach(workspaceSessionId, parentWindowId, definition, record);
    }
  }

  focus(instanceId: string): Readonly<FrontendToolInstance> {
    const instance = this.requireInstance(instanceId);
    instance.window = this.windows.focus(instance.windowObjectId);
    this.refreshWorkspaceWindows(instance.workspaceSessionId);
    void this.persistWindow(instance).catch((error: unknown) => this.captureError(error));
    return snapshot(instance);
  }

  move(instanceId: string, position: { x: number; y: number }): Readonly<FrontendToolInstance> {
    const instance = this.requireInstance(instanceId);
    instance.window = this.windows.move(instance.windowObjectId, position);
    void this.persistWindow(instance).catch((error: unknown) => this.captureError(error));
    return snapshot(instance);
  }

  resize(instanceId: string, size: { width: number; height: number }): Readonly<FrontendToolInstance> {
    const instance = this.requireInstance(instanceId);
    instance.window = this.windows.resize(instance.windowObjectId, size);
    void this.persistWindow(instance).catch((error: unknown) => this.captureError(error));
    return snapshot(instance);
  }

  async updateState(
    instanceId: string,
    runtimeState: Record<string, unknown>,
  ): Promise<Readonly<FrontendToolInstance>> {
    const instance = this.requireInstance(instanceId);
    const result = await this.api.put<PersistedToolRecord>(
      this.instancePath(instance),
      { runtimeState },
    );
    if (!result.ok) throw new Error(result.error.message);
    instance.runtimeState = { ...runtimeState };
    return snapshot(instance);
  }

  async close(instanceId: string): Promise<Readonly<FrontendToolInstance>> {
    const instance = this.requireInstance(instanceId);
    const result = await this.api.delete<PersistedToolRecord>(this.instancePath(instance));
    if (!result.ok) throw new Error(result.error.message);
    this.windows.close(instance.windowObjectId);
    this.mutableState.instances = this.mutableState.instances.filter(
      (candidate) => candidate.instanceId !== instanceId,
    );
    return snapshot(instance);
  }

  list(workspaceSessionId: string): readonly Readonly<FrontendToolInstance>[] {
    return this.mutableState.instances
      .filter((instance) => instance.workspaceSessionId === workspaceSessionId)
      .map(snapshot);
  }

  serialize(workspaceSessionId: string): PersistedToolRecord[] {
    return this.list(workspaceSessionId).map((instance) => ({
      instanceId: instance.instanceId,
      definitionObjectId: instance.definition.objectId,
      windowObjectId: instance.windowObjectId,
      bounds: { ...instance.window.bounds },
      focusOrder: instance.window.focusOrder,
      state: instance.window.state === "active" ? "active" : "background",
      runtimeState: { ...instance.runtimeState },
    }));
  }

  detachWorkspace(workspaceSessionId: string): void {
    for (const instance of [...this.mutableState.instances]) {
      if (instance.workspaceSessionId !== workspaceSessionId) continue;
      try {
        this.windows.close(instance.windowObjectId);
      } catch {
        // The parent Environment Window may already have closed its children.
      }
    }
    this.mutableState.instances = this.mutableState.instances.filter(
      (instance) => instance.workspaceSessionId !== workspaceSessionId,
    );
  }

  private attach(
    workspaceSessionId: string,
    parentWindowId: string,
    definition: Readonly<ToolDefinition>,
    record: PersistedToolRecord,
  ): Readonly<FrontendToolInstance> {
    const window = this.windows.open({
      objectId: record.windowObjectId,
      role: "tool",
      title: definition.displayName,
      bounds: { ...record.bounds },
      minimumSize: definition.minimumSize,
      parentWindowId,
    });
    const instance: FrontendToolInstance = {
      instanceId: record.instanceId,
      definition,
      workspaceSessionId,
      windowObjectId: record.windowObjectId,
      window,
      runtimeState: { ...record.runtimeState },
    };
    this.mutableState.instances.push(instance);
    this.refreshWorkspaceWindows(workspaceSessionId);
    return snapshot(instance);
  }

  private async persistWindow(instance: FrontendToolInstance): Promise<void> {
    const result = await this.api.put<PersistedToolRecord>(this.instancePath(instance), {
      bounds: instance.window.bounds,
      focusOrder: instance.window.focusOrder,
    });
    if (!result.ok) throw new Error(result.error.message);
  }

  private requireDefinition(objectId: string): Readonly<ToolDefinition> {
    const definition = this.definitions.get(objectId);
    if (!definition) throw new Error(`Unknown or unavailable Tool definition: ${objectId}`);
    return definition;
  }

  private refreshWorkspaceWindows(workspaceSessionId: string): void {
    for (const instance of this.mutableState.instances) {
      if (instance.workspaceSessionId === workspaceSessionId) {
        instance.window = this.windows.get(instance.windowObjectId);
      }
    }
  }

  private requireInstance(instanceId: string): FrontendToolInstance {
    const instance = this.mutableState.instances.find((candidate) => candidate.instanceId === instanceId);
    if (!instance) throw new Error(`Unknown active Tool Instance: ${instanceId}`);
    return instance;
  }

  private instancePath(instance: FrontendToolInstance): string {
    return `/workspace-sessions/${instance.workspaceSessionId}/tools/${instance.instanceId}`;
  }

  private captureError(error: unknown): void {
    this.mutableState.error = error instanceof Error ? error.message : "Tool Window state could not persist.";
  }
}

function snapshot(instance: FrontendToolInstance): Readonly<FrontendToolInstance> {
  return {
    ...instance,
    definition: { ...instance.definition },
    window: { ...instance.window, bounds: { ...instance.window.bounds } },
    runtimeState: { ...instance.runtimeState },
  };
}
