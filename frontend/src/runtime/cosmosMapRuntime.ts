import { reactive, readonly } from "vue";

import type { CosmosApiClient } from "./apiClient";

export interface MapCamera {
  x: number;
  y: number;
  zoom: number;
}

export interface MapNode {
  objectId: string;
  displayName: string;
  description: string;
  systemTags: string[];
  userTags: string[];
  x: number;
  y: number;
  parentObjectId: string;
  hierarchyLevel: "ProjectRoot" | "Domain" | "Cluster" | "Object" | "Detail";
  skin: string;
}

export interface MapProject {
  objectId: string;
  workspaceObjectId: string | null;
  displayName: string;
  description: string;
  systemTags: string[];
  userTags: string[];
  vision: string;
  color: string;
  x: number;
  y: number;
  nodes: MapNode[];
}

export interface MapConnection {
  objectId: string;
  systemTags: ["Connection"];
  provenance: "structural" | "semantic" | "discovery";
  endpointAId: string;
  endpointBId: string;
  relationshipId: string | null;
}

export interface MapCompanion {
  objectId: string;
  displayName: string;
  description: string;
  systemTags: string[];
  userTags: string[];
  notificationAvailable: boolean;
}

export interface CosmosMapSnapshot {
  camera: MapCamera;
  focusedProjectId: string | null;
  selectedObjectId: string | null;
  projects: MapProject[];
  connections: MapConnection[];
  companion: MapCompanion;
}

export interface CompanionReply {
  message: string;
  mode: "deterministic" | "provider";
}

export interface CompanionContext {
  roomId?: string;
  workspaceSessionId?: string;
  objectId?: string | null;
}

interface CosmosMapState {
  phase: "idle" | "loading" | "ready" | "failed";
  snapshot: CosmosMapSnapshot | null;
  selectedObjectId: string | null;
  error: string | null;
}

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.4;

export class CosmosMapRuntime {
  private readonly mutableState = reactive<CosmosMapState>({
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
      .get<CosmosMapSnapshot>("/cosmos/map")
      .then((result) => {
        if (!result.ok) throw new Error(result.error.message);
        this.mutableState.snapshot = result.data;
        this.mutableState.selectedObjectId = result.data.selectedObjectId;
        this.mutableState.phase = "ready";
      })
      .catch((error: unknown) => {
        this.mutableState.phase = "failed";
        this.mutableState.error = error instanceof Error ? error.message : "The Cosmos Map could not load.";
        throw error;
      })
      .finally(() => {
        this.loadPromise = null;
      });
    return this.loadPromise;
  }

  setCamera(camera: MapCamera): void {
    const snapshot = this.requireSnapshot();
    snapshot.camera = {
      x: camera.x,
      y: camera.y,
      zoom: clamp(camera.zoom, MIN_ZOOM, MAX_ZOOM),
    };
    snapshot.focusedProjectId = focusedProjectId(snapshot.projects, snapshot.camera);
  }

  async persistCamera(): Promise<void> {
    const snapshot = this.requireSnapshot();
    const result = await this.api.put<MapCamera>("/cosmos/camera", snapshot.camera);
    if (!result.ok) throw new Error(result.error.message);
  }

  select(objectId: string | null): void {
    this.mutableState.selectedObjectId = objectId;
  }

  async persistSelection(): Promise<void> {
    const result = await this.api.put<{ objectId: string | null }>("/cosmos/selection", {
      objectId: this.mutableState.selectedObjectId,
    });
    if (!result.ok) throw new Error(result.error.message);
  }

  applyObjectUpdate(value: Pick<MapNode, "objectId" | "displayName" | "description" | "userTags"> & {
    properties: Record<string, unknown>;
  }): void {
    const snapshot = this.mutableState.snapshot;
    if (!snapshot) return;
    const node = allNodes(snapshot.projects).find((candidate) => candidate.objectId === value.objectId);
    if (!node) return;
    node.displayName = value.displayName;
    node.description = value.description;
    node.userTags = [...value.userTags];
    if (typeof value.properties.skin === "string") node.skin = value.properties.skin;
    const project = snapshot.projects.find((candidate) => candidate.objectId === value.objectId);
    if (project) {
      project.displayName = value.displayName;
      project.description = value.description;
      project.userTags = [...value.userTags];
      if (typeof value.properties.vision === "string") project.vision = value.properties.vision;
      if (typeof value.properties.project_color === "string") project.color = value.properties.project_color;
    }
  }

  setNotificationAvailable(available: boolean): void {
    if (this.mutableState.snapshot) {
      this.mutableState.snapshot.companion.notificationAvailable = available;
    }
  }

  moveNodeLocally(objectId: string, x: number, y: number): boolean {
    const snapshot = this.requireSnapshot();
    const node = allNodes(snapshot.projects).find((candidate) => candidate.objectId === objectId);
    if (!node || !canPlace(snapshot.projects, objectId, x, y, node.hierarchyLevel)) return false;
    node.x = x;
    node.y = y;
    const project = snapshot.projects.find((candidate) => candidate.objectId === objectId);
    if (project) {
      project.x = x;
      project.y = y;
    }
    return true;
  }

  async persistNodePosition(objectId: string): Promise<void> {
    const node = allNodes(this.requireSnapshot().projects).find(
      (candidate) => candidate.objectId === objectId,
    );
    if (!node) throw new Error(`Unknown Node: ${objectId}`);
    const result = await this.api.put<{ objectId: string; x: number; y: number }>(
      `/objects/${encodeURIComponent(objectId)}/position`,
      { x: node.x, y: node.y },
    );
    if (!result.ok) throw new Error(result.error.message);
  }

  focusProject(projectId: string, viewport: { width: number; height: number }): void {
    const snapshot = this.requireSnapshot();
    const project = snapshot.projects.find((candidate) => candidate.objectId === projectId);
    if (!project) throw new Error(`Unknown Project: ${projectId}`);
    const nodes = project.nodes.length ? project.nodes : [{ x: project.x, y: project.y }];
    const xs = nodes.map((node) => node.x);
    const ys = nodes.map((node) => node.y);
    const width = Math.max(380, Math.max(...xs) - Math.min(...xs) + 300);
    const height = Math.max(320, Math.max(...ys) - Math.min(...ys) + 260);
    this.setCamera({
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2,
      zoom: Math.min(1.35, viewport.width / width, viewport.height / height),
    });
  }

  focusCosmos(viewport: { width: number; height: number }): void {
    const projects = this.requireSnapshot().projects;
    if (!projects.length) return;
    const xs = projects.map((project) => project.x);
    const ys = projects.map((project) => project.y);
    const width = Math.max(...xs) - Math.min(...xs) + 680;
    const height = Math.max(...ys) - Math.min(...ys) + 560;
    this.setCamera({
      x: (Math.min(...xs) + Math.max(...xs)) / 2 + 80,
      y: (Math.min(...ys) + Math.max(...ys)) / 2 - 180,
      zoom: Math.min(0.52, viewport.width / width, viewport.height / height),
    });
  }

  async sendCompanionMessage(
    message: string,
    context: CompanionContext = {},
  ): Promise<CompanionReply> {
    const result = await this.api.post<CompanionReply>("/companion/messages", {
      message,
      ...context,
    });
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  private requireSnapshot(): CosmosMapSnapshot {
    if (!this.mutableState.snapshot) throw new Error("The Cosmos Map is not loaded.");
    return this.mutableState.snapshot;
  }
}

export function focusedProjectId(projects: MapProject[], camera: MapCamera): string | null {
  const nearest = [...projects].sort(
    (left, right) => distance(left, camera) - distance(right, camera),
  )[0];
  return nearest && distance(nearest, camera) <= 280 ? nearest.objectId : null;
}

function allNodes(projects: MapProject[]): MapNode[] {
  return projects.flatMap((project) => project.nodes);
}

function canPlace(
  projects: MapProject[],
  objectId: string,
  x: number,
  y: number,
  hierarchyLevel: MapNode["hierarchyLevel"],
): boolean {
  return allNodes(projects).every((node) => {
    if (node.objectId === objectId) return true;
    const minimumDistance =
      hierarchyLevel === "ProjectRoot" && node.hierarchyLevel === "ProjectRoot"
        ? 440
        : hierarchyLevel === "ProjectRoot" || node.hierarchyLevel === "ProjectRoot"
          ? 140
          : 78;
    return Math.hypot(node.x - x, node.y - y) >= minimumDistance;
  });
}

function distance(project: MapProject, camera: MapCamera): number {
  return Math.hypot(project.x - camera.x, project.y - camera.y);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
