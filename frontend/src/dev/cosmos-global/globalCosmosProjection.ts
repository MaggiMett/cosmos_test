import type { DeepReadonly } from "vue";

import type {
  CosmosMapRuntime,
  CosmosMapSnapshot,
  MapNode,
  MapProject,
} from "../../runtime/cosmosMapRuntime";

export interface GlobalCosmosStarPresentation {
  objectId: string;
  displayName: string;
  isSelected: boolean;
  style: Readonly<Record<string, string>>;
}

export interface GlobalCosmosRegionPresentation {
  objectId: string;
  displayName: string;
  description: string;
  nodeCount: number;
  connectionCount: number;
  isFocused: boolean;
  isSelected: boolean;
  stars: readonly Readonly<GlobalCosmosStarPresentation>[];
  style: Readonly<Record<string, string>>;
}

interface GlobalCosmosStateBase {
  projectCount: number;
  zoomLabel: string;
}

export type GlobalCosmosPresentationState =
  | (GlobalCosmosStateBase & { phase: "loading" })
  | (GlobalCosmosStateBase & { phase: "error"; message: string })
  | (GlobalCosmosStateBase & { phase: "empty" })
  | (GlobalCosmosStateBase & {
      phase: "success";
      regions: readonly Readonly<GlobalCosmosRegionPresentation>[];
    });

const DEFAULT_LIGHT = [116, 190, 226] as const;

export function loadGlobalCosmosSnapshot(
  runtime: Readonly<Pick<CosmosMapRuntime, "load">>,
): Promise<void> {
  return runtime.load();
}

export function projectGlobalCosmosState(
  phase: CosmosMapRuntime["state"]["phase"],
  snapshot: DeepReadonly<CosmosMapSnapshot> | null,
  error: string | null,
  selectedObjectId: string | null = snapshot?.selectedObjectId ?? null,
): GlobalCosmosPresentationState {
  if (phase === "idle" || phase === "loading") {
    return { phase: "loading", projectCount: 0, zoomLabel: "--" };
  }
  if (phase === "failed") {
    return {
      phase: "error",
      projectCount: 0,
      zoomLabel: "--",
      message: error ?? "The Cosmos map could not be loaded.",
    };
  }
  if (!snapshot) {
    return {
      phase: "error",
      projectCount: 0,
      zoomLabel: "--",
      message: "The Cosmos map returned no snapshot.",
    };
  }
  if (snapshot.projects.length === 0) {
    return {
      phase: "empty",
      projectCount: 0,
      zoomLabel: zoomLabel(snapshot.camera.zoom),
    };
  }

  return {
    phase: "success",
    projectCount: snapshot.projects.length,
    zoomLabel: zoomLabel(snapshot.camera.zoom),
    regions: projectGlobalCosmosSnapshot(snapshot, selectedObjectId),
  };
}

export function projectGlobalCosmosSnapshot(
  snapshot: DeepReadonly<CosmosMapSnapshot>,
  runtimeSelectedObjectId: string | null = snapshot.selectedObjectId,
): readonly Readonly<GlobalCosmosRegionPresentation>[] {
  const projects = snapshot.projects;
  const selectedProjectId = uniquelyOwningProjectId(projects, runtimeSelectedObjectId);

  return projects.map((project) => {
    const memberIds = new Set([project.objectId, ...project.nodes.map((node) => node.objectId)]);
    const internalConnections = snapshot.connections.filter(
      (connection) =>
        memberIds.has(connection.endpointAId) && memberIds.has(connection.endpointBId),
    );
    const stars = project.nodes.filter((node) => node.objectId !== project.objectId);
    const width = clamp(190 + stars.length * 15 + internalConnections.length * 4, 190, 420);
    const height = Math.round(width * 0.76);
    const light = colorChannels(project.color);

    return {
      objectId: project.objectId,
      displayName: project.displayName,
      description: project.description,
      nodeCount: stars.length,
      connectionCount: internalConnections.length,
      isFocused: snapshot.focusedProjectId === project.objectId,
      isSelected: selectedProjectId === project.objectId,
      stars: projectStars(project, stars, selectedProjectId === project.objectId ? runtimeSelectedObjectId : null),
      style: {
        "--region-left": `${project.x}px`,
        "--region-top": `${project.y}px`,
        "--region-width": `${width}px`,
        "--region-height": `${height}px`,
        "--region-light": light.join(", "),
        "--region-core-size": `${clamp(15 + stars.length * 1.25 + internalConnections.length * 0.5, 15, 31)}px`,
        "--region-nebula-opacity": `${clamp(0.48 + stars.length * 0.025 + internalConnections.length * 0.012, 0.48, 0.82)}`,
      },
    };
  });
}

function projectStars(
  project: DeepReadonly<MapProject>,
  nodes: readonly DeepReadonly<MapNode>[],
  selectedObjectId: string | null,
): readonly Readonly<GlobalCosmosStarPresentation>[] {
  const xRange = valueRange([project.x, ...nodes.map((node) => node.x)]);
  const yRange = valueRange([project.y, ...nodes.map((node) => node.y)]);

  return nodes.map((node, index) => {
    const angle = nodes.length === 0 ? 0 : (index / nodes.length) * Math.PI * 2 - Math.PI / 2;
    return {
      objectId: node.objectId,
      displayName: node.displayName,
      isSelected: selectedObjectId === node.objectId,
      style: {
        "--star-left": `${nodePosition(node.x, xRange, 50 + Math.cos(angle) * 31)}%`,
        "--star-top": `${nodePosition(node.y, yRange, 50 + Math.sin(angle) * 31)}%`,
        "--star-size": `${nodeSize(node.hierarchyLevel)}px`,
      },
    };
  });
}

function uniquelyOwningProjectId(
  projects: readonly DeepReadonly<MapProject>[],
  selectedObjectId: string | null,
): string | null {
  if (!selectedObjectId) return null;
  const matches = projects.filter(
    (project) =>
      project.objectId === selectedObjectId ||
      project.nodes.some((node) => node.objectId === selectedObjectId),
  );
  return matches.length === 1 ? matches[0]?.objectId ?? null : null;
}

function valueRange(values: readonly number[]): Readonly<{ minimum: number; maximum: number }> {
  return {
    minimum: Math.min(...values),
    maximum: Math.max(...values),
  };
}

function nodePosition(
  value: number,
  range: Readonly<{ minimum: number; maximum: number }>,
  fallback: number,
): number {
  if (range.minimum === range.maximum) return round(fallback);
  return round(17 + ((value - range.minimum) / (range.maximum - range.minimum)) * 66);
}

function nodeSize(level: MapNode["hierarchyLevel"]): number {
  switch (level) {
    case "Domain":
      return 7;
    case "Cluster":
      return 6;
    case "Object":
      return 4.5;
    case "Detail":
      return 3;
    case "ProjectRoot":
      return 8;
  }
}

function colorChannels(value: string): readonly [number, number, number] {
  const short = /^#([\da-f])([\da-f])([\da-f])$/iu.exec(value.trim());
  if (short) {
    return [
      Number.parseInt(`${short[1]}${short[1]}`, 16),
      Number.parseInt(`${short[2]}${short[2]}`, 16),
      Number.parseInt(`${short[3]}${short[3]}`, 16),
    ];
  }
  const full = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/iu.exec(value.trim());
  if (!full) return DEFAULT_LIGHT;
  return [
    Number.parseInt(full[1] ?? "74", 16),
    Number.parseInt(full[2] ?? "be", 16),
    Number.parseInt(full[3] ?? "e2", 16),
  ];
}

function zoomLabel(zoom: number): string {
  return Number.isFinite(zoom) ? `${Math.round(zoom * 100)}%` : "--";
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
