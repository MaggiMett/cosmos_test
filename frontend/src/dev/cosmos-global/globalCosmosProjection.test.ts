import { describe, expect, it, vi } from "vitest";

import type {
  CosmosMapSnapshot,
  MapNode,
  MapProject,
} from "../../runtime/cosmosMapRuntime";
import {
  loadGlobalCosmosSnapshot,
  projectGlobalCosmosSnapshot,
  projectGlobalCosmosState,
} from "./globalCosmosProjection";

function node(
  objectId: string,
  x: number,
  y: number,
  hierarchyLevel: MapNode["hierarchyLevel"] = "Object",
): MapNode {
  return {
    objectId,
    displayName: objectId,
    description: "",
    systemTags: ["Node"],
    userTags: [],
    x,
    y,
    parentObjectId: "",
    hierarchyLevel,
    skin: "Star",
  };
}

function project(
  objectId: string,
  x: number,
  y: number,
  nodes: MapNode[],
  color = "#7dd3fc",
): MapProject {
  return {
    objectId,
    displayName: objectId,
    description: `${objectId} description`,
    systemTags: ["Node", "Project", "ProjectRoot"],
    userTags: [],
    vision: `${objectId} vision`,
    color,
    x,
    y,
    nodes,
  };
}

function snapshot(overrides: Partial<CosmosMapSnapshot> = {}): CosmosMapSnapshot {
  const alphaRoot = node("project.alpha", -500, -100, "ProjectRoot");
  const alphaNode = node("node.alpha.research", -420, -30, "Cluster");
  const betaNode = node("node.beta.build", 560, 120, "Object");
  return {
    camera: { x: 0, y: 0, zoom: 0.42 },
    focusedProjectId: null,
    selectedObjectId: null,
    projects: [
      project("project.alpha", -500, -100, [alphaRoot, alphaNode]),
      project("project.beta", 500, 100, [betaNode], "#c89f78"),
      project("project.empty", 0, 440, []),
    ],
    connections: [
      {
        objectId: "connection.alpha",
        systemTags: ["Connection"],
        provenance: "structural",
        endpointAId: "project.alpha",
        endpointBId: "node.alpha.research",
        relationshipId: null,
      },
      {
        objectId: "connection.cross-project",
        systemTags: ["Connection"],
        provenance: "semantic",
        endpointAId: "node.alpha.research",
        endpointBId: "node.beta.build",
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

describe("Global Cosmos presentation projection", () => {
  it("projects multiple real Projects, including Projects with and without Nodes", () => {
    const source = snapshot();
    const before = JSON.stringify(source);

    const regions = projectGlobalCosmosSnapshot(source);

    expect(regions.map((region) => region.objectId)).toEqual([
      "project.alpha",
      "project.beta",
      "project.empty",
    ]);
    expect(regions[0]).toMatchObject({ nodeCount: 1, connectionCount: 1 });
    expect(regions[1]).toMatchObject({ nodeCount: 1, connectionCount: 0 });
    expect(regions[2]).toMatchObject({ nodeCount: 0, connectionCount: 0, stars: [] });
    expect(regions[0]?.style).toMatchObject({
      "--region-left": "-500px",
      "--region-top": "-100px",
    });
    expect(JSON.stringify(source)).toBe(before);
  });

  it("presents existing focus without creating an artificial selection", () => {
    const regions = projectGlobalCosmosSnapshot(
      snapshot({ focusedProjectId: "project.alpha", selectedObjectId: null }),
    );

    expect(regions.find((region) => region.objectId === "project.alpha")).toMatchObject({
      isFocused: true,
      isSelected: false,
    });
    expect(regions.filter((region) => region.isSelected)).toEqual([]);
  });

  it("maps a uniquely owned selected Node to its Project and star", () => {
    const regions = projectGlobalCosmosSnapshot(
      snapshot({ selectedObjectId: "node.beta.build" }),
    );
    const beta = regions.find((region) => region.objectId === "project.beta");

    expect(beta?.isSelected).toBe(true);
    expect(beta?.stars.find((star) => star.objectId === "node.beta.build")?.isSelected).toBe(true);
    expect(regions.filter((region) => region.isSelected)).toHaveLength(1);
  });

  it("uses the current Runtime selection without mutating the loaded snapshot", () => {
    const source = snapshot({ selectedObjectId: null });
    const state = projectGlobalCosmosState(
      "ready",
      source,
      null,
      "node.beta.build",
    );

    expect(state.phase).toBe("success");
    if (state.phase !== "success") throw new Error("Expected a successful Global projection.");
    expect(state.regions.find((region) => region.objectId === "project.beta")?.isSelected).toBe(true);
    expect(source.selectedObjectId).toBeNull();
  });

  it("does not assign selection when no focus or selection exists", () => {
    const regions = projectGlobalCosmosSnapshot(snapshot());

    expect(regions.some((region) => region.isFocused || region.isSelected)).toBe(false);
  });

  it("does not assign an ambiguous selected Object to either Project", () => {
    const source = snapshot();
    source.projects[0]?.nodes.push(node("node.shared", -300, 0));
    source.projects[1]?.nodes.push(node("node.shared", 300, 0));
    source.selectedObjectId = "node.shared";

    expect(projectGlobalCosmosSnapshot(source).some((region) => region.isSelected)).toBe(false);
  });

  it("projects loading, error, empty and success states", () => {
    expect(projectGlobalCosmosState("idle", null, null)).toEqual({
      phase: "loading",
      projectCount: 0,
      zoomLabel: "--",
    });
    expect(projectGlobalCosmosState("loading", null, null).phase).toBe("loading");
    expect(projectGlobalCosmosState("failed", null, "offline")).toMatchObject({
      phase: "error",
      message: "offline",
    });
    expect(projectGlobalCosmosState("ready", snapshot({ projects: [] }), null)).toEqual({
      phase: "empty",
      projectCount: 0,
      zoomLabel: "42%",
    });
    expect(projectGlobalCosmosState("ready", snapshot(), null)).toMatchObject({
      phase: "success",
      projectCount: 3,
      zoomLabel: "42%",
    });
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

    await loadGlobalCosmosSnapshot(runtime);

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

  it("never introduces the former fixture projects into a successful projection", () => {
    const regions = projectGlobalCosmosSnapshot(snapshot());
    const serialized = JSON.stringify(regions);

    for (const fixtureName of ["Asteria", "Forge", "Atlas", "Mettventures", "Archive", "Sandbox"]) {
      expect(serialized).not.toContain(fixtureName);
    }
  });
});
