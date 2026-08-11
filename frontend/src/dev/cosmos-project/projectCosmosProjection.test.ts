import { describe, expect, it, vi } from "vitest";

import type {
  CosmosMapSnapshot,
  MapNode,
  MapProject,
} from "../../runtime/cosmosMapRuntime";
import {
  loadProjectCosmosSnapshot,
  projectIdFromQuery,
  projectProjectCosmosSnapshot,
  projectProjectCosmosState,
} from "./projectCosmosProjection";

function node(
  objectId: string,
  x: number,
  y: number,
  hierarchyLevel: MapNode["hierarchyLevel"] = "Object",
): MapNode {
  return {
    objectId,
    displayName: objectId,
    description: `${objectId} description`,
    systemTags: ["Node"],
    userTags: [],
    x,
    y,
    parentObjectId: "",
    hierarchyLevel,
    skin: "Star",
  };
}

function project(objectId: string, nodes: MapNode[]): MapProject {
  return {
    objectId,
    displayName: objectId,
    description: `${objectId} description`,
    systemTags: ["Node", "Project", "ProjectRoot"],
    userTags: [],
    vision: `${objectId} vision`,
    color: "#7dd3fc",
    x: 0,
    y: 0,
    nodes,
  };
}

function snapshot(overrides: Partial<CosmosMapSnapshot> = {}): CosmosMapSnapshot {
  return {
    camera: { x: 0, y: 0, zoom: 0.72 },
    focusedProjectId: null,
    selectedObjectId: null,
    projects: [
      project("project.alpha", [
        node("project.alpha", 0, 0, "ProjectRoot"),
        node("node.alpha.research", -180, -90, "Cluster"),
        node("node.alpha.build", 220, 130, "Object"),
      ]),
      project("project.empty", []),
      project("project.other", [node("node.other", 620, 0)]),
    ],
    connections: [
      {
        objectId: "connection.alpha.structural",
        systemTags: ["Connection"],
        provenance: "structural",
        endpointAId: "project.alpha",
        endpointBId: "node.alpha.research",
        relationshipId: null,
      },
      {
        objectId: "connection.alpha.semantic",
        systemTags: ["Connection"],
        provenance: "semantic",
        endpointAId: "node.alpha.research",
        endpointBId: "node.alpha.build",
        relationshipId: "relationship.alpha",
      },
      {
        objectId: "connection.cross-project",
        systemTags: ["Connection"],
        provenance: "semantic",
        endpointAId: "node.alpha.build",
        endpointBId: "node.other",
        relationshipId: "relationship.cross-project",
      },
    ],
    companion: {
      objectId: "companion",
      displayName: "Companion",
      description: "",
      systemTags: ["Companion", "Entity"],
      userTags: [],
      notificationAvailable: false,
    },
    ...overrides,
  };
}

describe("Project Cosmos presentation projection", () => {
  it("resolves a valid real Project with multiple Nodes without mutating the snapshot", () => {
    const source = snapshot();
    const before = JSON.stringify(source);
    const state = projectProjectCosmosState("ready", source, null, "project.alpha");

    expect(state.phase).toBe("success");
    if (state.phase !== "success") throw new Error("Expected a successful Project projection.");
    expect(state.project.objectId).toBe("project.alpha");
    expect(state.project.nodes.map((item) => item.objectId)).toEqual([
      "node.alpha.research",
      "node.alpha.build",
    ]);
    expect(state.project.nodes[0]?.style).toMatchObject({
      "--node-left": "-180px",
      "--node-top": "-90px",
    });
    expect(JSON.stringify(source)).toBe(before);
  });

  it("returns the Empty Project state for a real Project without Nodes", () => {
    const state = projectProjectCosmosState("ready", snapshot(), null, "project.empty");

    expect(state.phase).toBe("empty-project");
    if (state.phase !== "empty-project") throw new Error("Expected an empty Project.");
    expect(state.project.objectId).toBe("project.empty");
    expect(state.project.nodes).toEqual([]);
    expect(state.objectCount).toBe(0);
  });

  it("projects only real internal Connections", () => {
    const source = snapshot();
    const alpha = source.projects.find((item) => item.objectId === "project.alpha");
    if (!alpha) throw new Error("Alpha fixture missing.");

    const presentation = projectProjectCosmosSnapshot(source, alpha);

    expect(presentation.connections.map((connection) => connection.objectId)).toEqual([
      "connection.alpha.structural",
      "connection.alpha.semantic",
    ]);
    expect(presentation.connections.every((connection) => connection.path.startsWith("M"))).toBe(true);
    expect(presentation.connections).not.toContainEqual(
      expect.objectContaining({ objectId: "connection.cross-project" }),
    );
  });

  it("reprojects a Runtime-moved Node directly from authoritative world coordinates", () => {
    const source = snapshot();
    const alpha = source.projects.find((item) => item.objectId === "project.alpha");
    const moved = alpha?.nodes.find((item) => item.objectId === "node.alpha.build");
    if (!alpha || !moved) throw new Error("Expected the real test Node.");
    moved.x = 310;
    moved.y = 170;

    const presentation = projectProjectCosmosSnapshot(source, alpha);
    expect(presentation.nodes.find((item) => item.objectId === moved.objectId)?.style).toMatchObject({
      "--node-left": "310px",
      "--node-top": "170px",
    });
  });

  it("presents focusedProjectId only on the requested Project core", () => {
    const state = projectProjectCosmosState(
      "ready",
      snapshot({ focusedProjectId: "project.alpha" }),
      null,
      "project.alpha",
    );

    expect(state.phase).toBe("success");
    if (state.phase !== "success") throw new Error("Expected a successful Project projection.");
    expect(state.project.isFocused).toBe(true);
    expect(state.project.nodes.some((item) => item.isSelected)).toBe(false);
  });

  it("restores selectedObjectId from a reloaded Runtime snapshot", () => {
    const state = projectProjectCosmosState(
      "ready",
      snapshot({ selectedObjectId: "node.alpha.build" }),
      null,
      "project.alpha",
    );

    expect(state.phase).toBe("success");
    if (state.phase !== "success") throw new Error("Expected a successful Project projection.");
    expect(state.project.nodes.find((item) => item.objectId === "node.alpha.build")?.isSelected).toBe(true);
    expect(state.project.nodes.filter((item) => item.isSelected)).toHaveLength(1);
  });

  it("uses the current Runtime selection without creating a local selection layer", () => {
    const source = snapshot({ selectedObjectId: null });
    const state = projectProjectCosmosState(
      "ready",
      source,
      null,
      "project.alpha",
      "node.alpha.research",
    );

    expect(state.phase).toBe("success");
    if (state.phase !== "success") throw new Error("Expected a successful Project projection.");
    expect(state.project.nodes.find((item) => item.objectId === "node.alpha.research")?.isSelected).toBe(true);
    expect(source.selectedObjectId).toBeNull();
  });

  it("does not create selection when selectedObjectId belongs to another Project", () => {
    const state = projectProjectCosmosState(
      "ready",
      snapshot({ selectedObjectId: "node.other" }),
      null,
      "project.alpha",
    );

    expect(state.phase).toBe("success");
    if (state.phase !== "success") throw new Error("Expected a successful Project projection.");
    expect(state.project.isCoreSelected).toBe(false);
    expect(state.project.nodes.some((item) => item.isSelected)).toBe(false);

    const disappeared = projectProjectCosmosState(
      "ready",
      snapshot(),
      null,
      "project.alpha",
      "node.alpha.removed",
    );
    expect(disappeared.phase).toBe("success");
    if (disappeared.phase !== "success") throw new Error("Expected a successful Project projection.");
    expect(disappeared.project.nodes.some((item) => item.isSelected)).toBe(false);
  });

  it("returns Not Found for unknown or missing Project IDs and an empty snapshot", () => {
    expect(projectProjectCosmosState("ready", snapshot(), null, "project.unknown")).toMatchObject({
      phase: "not-found",
      requestedProjectId: "project.unknown",
    });
    expect(projectProjectCosmosState("ready", snapshot(), null, null)).toMatchObject({
      phase: "not-found",
      requestedProjectId: null,
    });
    expect(
      projectProjectCosmosState("ready", snapshot({ projects: [] }), null, "project.alpha"),
    ).toMatchObject({ phase: "not-found" });
  });

  it("projects Loading and Error without fixture fallback", () => {
    expect(projectProjectCosmosState("idle", null, null, "project.alpha").phase).toBe("loading");
    expect(projectProjectCosmosState("loading", null, null, "project.alpha").phase).toBe("loading");
    expect(projectProjectCosmosState("failed", null, "offline", "project.alpha")).toMatchObject({
      phase: "error",
      message: "offline",
    });
  });

  it("normalizes a deterministic Project ID from query context", () => {
    expect(projectIdFromQuery(" project.alpha ")).toBe("project.alpha");
    expect(projectIdFromQuery(["project.alpha", "project.other"])).toBe("project.alpha");
    expect(projectIdFromQuery(undefined)).toBeNull();
    expect(projectIdFromQuery(42)).toBeNull();
  });

  it("never introduces former fixture Nodes into Success", () => {
    const state = projectProjectCosmosState("ready", snapshot(), null, "project.alpha");
    expect(state.phase).toBe("success");
    const serialized = JSON.stringify(state);

    for (const fixtureName of ["Asteria", "Research", "Design", "Assets", "Build", "Notes", "Archive"]) {
      expect(serialized).not.toContain(fixtureName);
    }
  });

  it("loads through the sole read method and never invokes Runtime mutators", async () => {
    const runtime = {
      load: vi.fn().mockResolvedValue(undefined),
      setCamera: vi.fn(),
      persistCamera: vi.fn(),
      select: vi.fn(),
      persistSelection: vi.fn(),
      moveNodeLocally: vi.fn(),
      persistNodePosition: vi.fn(),
      focusProject: vi.fn(),
      focusCosmos: vi.fn(),
    };

    await loadProjectCosmosSnapshot(runtime);

    expect(runtime.load).toHaveBeenCalledOnce();
    for (const method of [
      runtime.setCamera,
      runtime.persistCamera,
      runtime.select,
      runtime.persistSelection,
      runtime.moveNodeLocally,
      runtime.persistNodePosition,
      runtime.focusProject,
      runtime.focusCosmos,
    ]) {
      expect(method).not.toHaveBeenCalled();
    }
  });
});
