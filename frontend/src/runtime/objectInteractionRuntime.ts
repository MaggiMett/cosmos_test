import { reactive, readonly } from "vue";

import type { CosmosApiClient } from "./apiClient";
import type { CosmosMapRuntime } from "./cosmosMapRuntime";
import type { WindowBounds, WindowInstance } from "./windowRuntime";
import { WindowRuntime } from "./windowRuntime";

export interface ObjectAction {
  id: "open" | "open_workspace" | "appearance" | "connections" | "configuration" | "rename" | "assign_project" | "tags";
  label: string;
  group: string;
  enabled: boolean;
}

export interface ObjectRelationship {
  relationshipId: string;
  type: string;
  projectId: string;
  relatedObjectId: string;
  relatedDisplayName: string;
}

export interface ObjectDetails {
  objectId: string;
  displayName: string;
  description: string;
  systemTags: string[];
  userTags: string[];
  primaryProjectId: string | null;
  properties: Record<string, unknown>;
  editableProperties: string[];
  relationships: ObjectRelationship[];
  actions: ObjectAction[];
}

export type ObjectWindowSection = "details" | "appearance" | "relationships" | "edit";

export interface ObjectWindowRecord {
  windowId: string;
  objectId: string;
  workspaceSessionId?: string;
  section: ObjectWindowSection;
  details: ObjectDetails;
  window: Readonly<WindowInstance>;
  saving: boolean;
  error: string | null;
}

export interface ContextMenuState {
  objectId: string;
  workspaceSessionId?: string;
  displayName: string;
  x: number;
  y: number;
  actions: ObjectAction[];
}

interface ObjectInteractionState {
  windows: ObjectWindowRecord[];
  contextMenu: ContextMenuState | null;
  loadingContextMenu: boolean;
  error: string | null;
}

export class ObjectInteractionRuntime {
  private readonly mutableState = reactive<ObjectInteractionState>({
    windows: [],
    contextMenu: null,
    loadingContextMenu: false,
    error: null,
  });

  readonly state = readonly(this.mutableState);

  constructor(
    private readonly api: CosmosApiClient,
    private readonly windows: WindowRuntime,
    private readonly cosmosMap: CosmosMapRuntime,
  ) {}

  async showContextMenu(
    objectId: string,
    point: { x: number; y: number },
    workspaceSessionId?: string,
  ): Promise<void> {
    this.mutableState.loadingContextMenu = true;
    this.mutableState.error = null;
    try {
      const details = await this.inspect(objectId, workspaceSessionId);
      this.mutableState.contextMenu = {
        objectId,
        workspaceSessionId,
        displayName: details.displayName,
        x: point.x,
        y: point.y,
        actions: details.actions.map((action) => ({ ...action })),
      };
    } catch (error) {
      this.mutableState.error = error instanceof Error ? error.message : "Context Menu could not open.";
      throw error;
    } finally {
      this.mutableState.loadingContextMenu = false;
    }
  }

  closeContextMenu(): void {
    this.mutableState.contextMenu = null;
  }

  async openObject(
    objectId: string,
    section: ObjectWindowSection,
    bounds: WindowBounds,
    parentWindowId?: string,
    workspaceSessionId?: string,
  ): Promise<Readonly<ObjectWindowRecord>> {
    this.closeContextMenu();
    const existing = this.mutableState.windows.find(
      (record) =>
        record.objectId === objectId && record.workspaceSessionId === workspaceSessionId,
    );
    if (existing) {
      existing.section = section;
      existing.window = this.windows.focus(existing.windowId);
      return snapshotRecord(existing);
    }
    const details = await this.inspect(objectId, workspaceSessionId);
    const windowId = `cosmos.window.object.${objectId}${workspaceSessionId ? `.${workspaceSessionId}` : ""}`;
    const window = this.windows.open({
      objectId: windowId,
      role: "tool",
      title: details.displayName,
      bounds,
      minimumSize: { width: 420, height: 380 },
      parentWindowId,
    });
    const record: ObjectWindowRecord = {
      windowId,
      objectId,
      workspaceSessionId,
      section,
      details,
      window,
      saving: false,
      error: null,
    };
    this.mutableState.windows.push(record);
    return snapshotRecord(record);
  }

  focus(windowId: string): void {
    const record = this.requireWindow(windowId);
    record.window = this.windows.focus(windowId);
  }

  move(windowId: string, position: { x: number; y: number }): void {
    const record = this.requireWindow(windowId);
    record.window = this.windows.move(windowId, position);
  }

  resize(windowId: string, size: { width: number; height: number }): void {
    const record = this.requireWindow(windowId);
    record.window = this.windows.resize(windowId, size);
  }

  close(windowId: string): void {
    if (this.windows.list().some((window) => window.objectId === windowId)) {
      this.windows.close(windowId);
    }
    this.mutableState.windows = this.mutableState.windows.filter(
      (record) => record.windowId !== windowId,
    );
  }

  closeAll(workspaceSessionId?: string): void {
    for (const record of [...this.mutableState.windows]) {
      if (workspaceSessionId === undefined || record.workspaceSessionId === workspaceSessionId) {
        this.close(record.windowId);
      }
    }
    if (
      workspaceSessionId === undefined ||
      this.mutableState.contextMenu?.workspaceSessionId === workspaceSessionId
    ) {
      this.closeContextMenu();
    }
  }

  async save(
    windowId: string,
    update: Pick<ObjectDetails, "displayName" | "description" | "userTags"> & {
      properties: Record<string, unknown>;
    },
  ): Promise<ObjectDetails> {
    const record = this.requireWindow(windowId);
    record.saving = true;
    record.error = null;
    try {
      const result = await this.api.put<ObjectDetails>(
        `/objects/${encodeURIComponent(record.objectId)}`,
        update,
        { query: { workspaceSessionId: record.workspaceSessionId } },
      );
      if (!result.ok) throw new Error(result.error.message);
      record.details = copyDetails(result.data);
      this.cosmosMap.applyObjectUpdate(result.data);
      return copyDetails(record.details);
    } catch (error) {
      record.error = error instanceof Error ? error.message : "Object changes could not be saved.";
      throw error;
    } finally {
      record.saving = false;
    }
  }

  private async inspect(objectId: string, workspaceSessionId?: string): Promise<ObjectDetails> {
    const result = await this.api.get<ObjectDetails>(`/objects/${encodeURIComponent(objectId)}`, {
      query: { workspaceSessionId },
    });
    if (!result.ok) throw new Error(result.error.message);
    return copyDetails(result.data);
  }

  private requireWindow(windowId: string): ObjectWindowRecord {
    const record = this.mutableState.windows.find((candidate) => candidate.windowId === windowId);
    if (!record) throw new Error(`Unknown Object Window: ${windowId}`);
    return record;
  }
}

function copyDetails(value: ObjectDetails): ObjectDetails {
  return {
    ...value,
    systemTags: [...value.systemTags],
    userTags: [...value.userTags],
    properties: JSON.parse(JSON.stringify(value.properties)) as Record<string, unknown>,
    editableProperties: [...value.editableProperties],
    relationships: value.relationships.map((relationship) => ({ ...relationship })),
    actions: value.actions.map((action) => ({ ...action })),
  };
}

function snapshotRecord(value: ObjectWindowRecord): Readonly<ObjectWindowRecord> {
  return { ...value, details: copyDetails(value.details), window: { ...value.window } };
}
