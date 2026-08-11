import { reactive, readonly } from "vue";

import type { CosmosApiClient } from "./apiClient";
import type { PersistedToolRecord } from "./toolRuntime";
import { ToolRuntime } from "./toolRuntime";
import { WindowRuntime, type WindowBounds } from "./windowRuntime";

export type WorkspaceSessionState = "created" | "initialized" | "active" | "background" | "closed";

export interface WorkspaceContext {
  projectScopeIds: readonly string[];
  focusedProjectId?: string | null;
  roomId?: string;
  workspaceSessionId?: string;
}

export interface WorkspaceDefinitionReference {
  objectId: string;
  displayName: string;
  description: string;
  icon: string;
  overlay: string;
  defaultLayout: Record<string, unknown>;
  contextConfiguration: Record<string, unknown>;
  assignedToolIds: string[];
  themeOverride: string;
  sourceProjectId: string;
}

export interface WorkspaceEnvironmentWindow {
  objectId: string;
  displayName: string;
  role: "workspace_environment";
}

export interface WorkspaceRestorableState {
  tools: PersistedToolRecord[];
  selectedObjectId: string | null;
  filters: Record<string, unknown>;
  camera: Record<string, unknown>;
  panels: Record<string, unknown>;
}

export interface WorkspaceSession {
  objectId: string;
  definition: WorkspaceDefinitionReference;
  environmentWindow: WorkspaceEnvironmentWindow;
  context: WorkspaceContext;
  state: WorkspaceSessionState;
  restorableState: WorkspaceRestorableState;
}

export interface OpenWorkspaceRequest {
  definitionObjectId: string;
  roomId: string;
  environmentBounds: WindowBounds;
}

interface WorkspaceRuntimeState {
  sessions: WorkspaceSession[];
  phase: "idle" | "opening" | "ready" | "failed";
  error: string | null;
}

export class WorkspaceRuntimeError extends Error {
  constructor(
    readonly code: "duplicate_session" | "invalid_context" | "unknown_session" | "open_failed",
    message: string,
  ) {
    super(message);
    this.name = "WorkspaceRuntimeError";
  }
}

export class WorkspaceRuntime {
  private readonly mutableState = reactive<WorkspaceRuntimeState>({
    sessions: [],
    phase: "idle",
    error: null,
  });

  readonly state = readonly(this.mutableState);

  constructor(
    private readonly windows: WindowRuntime,
    private readonly api: CosmosApiClient,
    private readonly tools: ToolRuntime,
  ) {}

  async definition(objectId: string): Promise<WorkspaceDefinitionReference> {
    const result = await this.api.get<WorkspaceDefinitionReference>(`/workspaces/${objectId}`);
    if (!result.ok) throw new WorkspaceRuntimeError("open_failed", result.error.message);
    return result.data;
  }

  async open(request: OpenWorkspaceRequest): Promise<Readonly<WorkspaceSession>> {
    this.mutableState.phase = "opening";
    this.mutableState.error = null;
    const result = await this.api.post<WorkspaceSession>(
      `/workspaces/${request.definitionObjectId}/sessions`,
      { roomId: request.roomId },
    );
    if (!result.ok) {
      this.mutableState.phase = "failed";
      this.mutableState.error = result.error.message;
      throw new WorkspaceRuntimeError("open_failed", result.error.message);
    }
    if (this.mutableState.sessions.some((session) => session.objectId === result.data.objectId)) {
      throw new WorkspaceRuntimeError(
        "duplicate_session",
        `Duplicate Workspace session ID: ${result.data.objectId}`,
      );
    }
    this.backgroundFocusedSession();
    const session = copySession(result.data);
    this.mutableState.sessions.push(session);
    try {
      this.windows.open({
        objectId: session.environmentWindow.objectId,
        role: "workspace_environment",
        title: session.definition.displayName,
        bounds: { ...request.environmentBounds },
      });
      this.tools.restore(
        session.objectId,
        session.environmentWindow.objectId,
        session.restorableState.tools,
      );
      this.mutableState.phase = "ready";
      return snapshot(session);
    } catch (error) {
      this.mutableState.sessions = this.mutableState.sessions.filter(
        (candidate) => candidate.objectId !== session.objectId,
      );
      await this.api.delete(`/workspace-sessions/${session.objectId}`);
      this.mutableState.phase = "failed";
      this.mutableState.error = error instanceof Error ? error.message : "Workspace could not open.";
      throw error;
    }
  }

  async focus(sessionId: string): Promise<Readonly<WorkspaceSession>> {
    const selected = this.requireSession(sessionId);
    const result = await this.api.post<WorkspaceSession>(
      `/workspace-sessions/${sessionId}/focus`,
      {},
    );
    if (!result.ok) throw new WorkspaceRuntimeError("open_failed", result.error.message);
    this.backgroundFocusedSession();
    selected.state = "active";
    this.windows.focus(selected.environmentWindow.objectId);
    return snapshot(selected);
  }

  async save(sessionId: string): Promise<Readonly<WorkspaceSession>> {
    const session = this.requireSession(sessionId);
    session.restorableState.tools = this.tools.serialize(sessionId);
    const result = await this.api.put<WorkspaceSession>(`/workspace-sessions/${sessionId}`, {
      restorableState: session.restorableState,
    });
    if (!result.ok) throw new WorkspaceRuntimeError("open_failed", result.error.message);
    session.restorableState = copyRestorableState(result.data.restorableState);
    return snapshot(session);
  }

  async selectObject(
    sessionId: string,
    objectId: string | null,
  ): Promise<Readonly<WorkspaceSession>> {
    const session = this.requireSession(sessionId);
    session.restorableState.selectedObjectId = objectId;
    return this.save(sessionId);
  }

  async close(sessionId: string): Promise<Readonly<WorkspaceSession>> {
    const session = this.requireSession(sessionId);
    await this.save(sessionId);
    const result = await this.api.delete<WorkspaceSession>(`/workspace-sessions/${sessionId}`);
    if (!result.ok) throw new WorkspaceRuntimeError("open_failed", result.error.message);
    this.tools.detachWorkspace(sessionId);
    try {
      this.windows.close(session.environmentWindow.objectId);
    } catch {
      // Tool detachment can close the last focused child before the parent closes.
    }
    session.state = "closed";
    this.mutableState.sessions = this.mutableState.sessions.filter(
      (candidate) => candidate.objectId !== sessionId,
    );
    const next = this.mutableState.sessions.at(-1);
    if (next) await this.focus(next.objectId);
    return snapshot(session);
  }

  get(sessionId: string): Readonly<WorkspaceSession> {
    return snapshot(this.requireSession(sessionId));
  }

  list(): readonly Readonly<WorkspaceSession>[] {
    return this.mutableState.sessions.map(snapshot);
  }

  private requireSession(sessionId: string): WorkspaceSession {
    const session = this.mutableState.sessions.find((candidate) => candidate.objectId === sessionId);
    if (!session) {
      throw new WorkspaceRuntimeError("unknown_session", `Unknown active Workspace session: ${sessionId}`);
    }
    return session;
  }

  private backgroundFocusedSession(): void {
    for (const session of this.mutableState.sessions) {
      if (session.state === "active") session.state = "background";
    }
  }
}

function copySession(session: WorkspaceSession): WorkspaceSession {
  return {
    ...session,
    definition: {
      ...session.definition,
      assignedToolIds: [...session.definition.assignedToolIds],
      defaultLayout: { ...session.definition.defaultLayout },
      contextConfiguration: { ...session.definition.contextConfiguration },
    },
    environmentWindow: { ...session.environmentWindow },
    context: { ...session.context, projectScopeIds: [...session.context.projectScopeIds] },
    restorableState: copyRestorableState(session.restorableState),
  };
}

function copyRestorableState(state: WorkspaceRestorableState): WorkspaceRestorableState {
  return {
    tools: state.tools.map((record) => ({
      ...record,
      bounds: { ...record.bounds },
      runtimeState: { ...record.runtimeState },
    })),
    selectedObjectId: state.selectedObjectId,
    filters: { ...state.filters },
    camera: { ...state.camera },
    panels: { ...state.panels },
  };
}

function snapshot(session: WorkspaceSession): Readonly<WorkspaceSession> {
  return copySession(session);
}
