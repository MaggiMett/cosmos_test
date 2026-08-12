import { describe, expect, it, vi } from "vitest";

import type { ProjectCosmosPresentation } from "./projectCosmosProjection";
import {
  beginProjectNodeMove,
  moveProjectNode,
  openSelectedProjectCosmosNode,
  persistProjectNodeMove,
  selectProjectCosmosNode,
} from "./projectCosmosInteraction";

function project(selectedObjectId: string | null = null): ProjectCosmosPresentation {
  return {
    objectId: "project.real",
    workspaceObjectId: "workspace.real",
    displayName: "Real Project",
    description: "",
    isFocused: false,
    isCoreSelected: false,
    nodes: [
      {
        objectId: "node.real",
        displayName: "Real Node",
        description: "",
        typeLabel: "Object",
        x: 120,
        y: 80,
        isSelected: selectedObjectId === "node.real",
        style: {},
      },
    ],
    connections: [],
    style: {},
  };
}

describe("Project Cosmos interaction adapter", () => {
  it("selects and persists a real projected Node through CosmosMapRuntime", async () => {
    const runtime = {
      select: vi.fn(),
      persistSelection: vi.fn().mockResolvedValue(undefined),
    };

    await expect(selectProjectCosmosNode(runtime, project(), "node.real")).resolves.toBe(true);

    expect(runtime.select).toHaveBeenCalledOnce();
    expect(runtime.select).toHaveBeenCalledWith("node.real");
    expect(runtime.persistSelection).toHaveBeenCalledOnce();
  });

  it("selects the real Project core through the same ProjectRoot path as Legacy", async () => {
    const runtime = {
      select: vi.fn(),
      persistSelection: vi.fn().mockResolvedValue(undefined),
    };

    await expect(
      selectProjectCosmosNode(runtime, project(), "project.real"),
    ).resolves.toBe(true);

    expect(runtime.select).toHaveBeenCalledWith("project.real");
    expect(runtime.persistSelection).toHaveBeenCalledOnce();
  });

  it("opens only the selected real Node through the existing Object Interaction host", async () => {
    const host = { openObject: vi.fn().mockResolvedValue(undefined) };

    await expect(
      openSelectedProjectCosmosNode(host, project("node.real"), "node.real"),
    ).resolves.toBe(true);

    expect(host.openObject).toHaveBeenCalledOnce();
    expect(host.openObject).toHaveBeenCalledWith("node.real", "details");
  });

  it("opens a selected real Project core through the existing Object Interaction host", async () => {
    const host = { openObject: vi.fn().mockResolvedValue(undefined) };
    const selectedProject = { ...project(), isCoreSelected: true };

    await expect(
      openSelectedProjectCosmosNode(host, selectedProject, "project.real"),
    ).resolves.toBe(true);

    expect(host.openObject).toHaveBeenCalledWith("project.real", "details");
  });

  it("ignores unknown, disappeared, or no-longer-selected Node IDs", async () => {
    const runtime = {
      select: vi.fn(),
      persistSelection: vi.fn().mockResolvedValue(undefined),
    };
    const host = { openObject: vi.fn().mockResolvedValue(undefined) };

    await expect(selectProjectCosmosNode(runtime, project(), "node.removed")).resolves.toBe(false);
    await expect(
      openSelectedProjectCosmosNode(host, project(), "node.real"),
    ).resolves.toBe(false);
    await expect(
      openSelectedProjectCosmosNode(host, project("node.real"), "node.removed"),
    ).resolves.toBe(false);

    expect(runtime.select).not.toHaveBeenCalled();
    expect(runtime.persistSelection).not.toHaveBeenCalled();
    expect(host.openObject).not.toHaveBeenCalled();
  });

  it("moves and persists a real Node through the existing Runtime position path", async () => {
    const gesture = beginProjectNodeMove(project(), "node.real", {
      pointerId: 7,
      clientX: 100,
      clientY: 120,
    });
    if (!gesture) throw new Error("Expected a Node move gesture.");
    const runtime = {
      moveNodeLocally: vi.fn().mockReturnValue(true),
      persistNodePosition: vi.fn().mockResolvedValue(undefined),
    };

    expect(moveProjectNode(runtime, gesture, { clientX: 140, clientY: 100 }, 2)).toBe(true);
    expect(runtime.moveNodeLocally).toHaveBeenCalledWith("node.real", 140, 70);
    expect(gesture.moved).toBe(true);
    await expect(persistProjectNodeMove(runtime, gesture)).resolves.toBe(true);
    expect(runtime.persistNodePosition).toHaveBeenCalledWith("node.real");
  });

  it("does not persist a click without Node movement", async () => {
    const gesture = beginProjectNodeMove(project(), "node.real", {
      pointerId: 8,
      clientX: 10,
      clientY: 10,
    });
    if (!gesture) throw new Error("Expected a Node move gesture.");
    const runtime = { persistNodePosition: vi.fn().mockResolvedValue(undefined) };

    await expect(persistProjectNodeMove(runtime, gesture)).resolves.toBe(false);
    expect(runtime.persistNodePosition).not.toHaveBeenCalled();
  });

  it("contains no fixture defaults, new backend calls, or parallel state", () => {
    const combined = [
      selectProjectCosmosNode,
      openSelectedProjectCosmosNode,
      beginProjectNodeMove,
      moveProjectNode,
      persistProjectNodeMove,
    ]
      .map((value) => value.toString())
      .join("\n");

    for (const fixture of ["Asteria", "Research", "Design", "Assets", "Build", "Notes", "Archive"]) {
      expect(combined).not.toContain(fixture);
    }
    for (const forbidden of ["fetch(", ".post(", ".put(", ".patch(", ".delete(", "ref(", "reactive("]) {
      expect(combined).not.toContain(forbidden);
    }
  });
});
