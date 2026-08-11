import { afterEach, describe, expect, it, vi } from "vitest";

import { CosmosApiClient } from "./apiClient";
import { CosmosMapRuntime, type CosmosMapSnapshot } from "./cosmosMapRuntime";

const snapshot: CosmosMapSnapshot = {
  camera: { x: 0, y: -380, zoom: 0.58 },
  focusedProjectId: null,
  selectedObjectId: null,
  projects: [
    {
      objectId: "project.left",
      displayName: "Left",
      description: "",
      systemTags: ["Node", "Project", "ProjectRoot"],
      userTags: [],
      vision: "Left project",
      color: "#7dd3fc",
      x: -700,
      y: 0,
      nodes: [
        {
          objectId: "project.left",
          displayName: "Left",
          description: "",
          systemTags: ["Node", "Project", "ProjectRoot"],
          userTags: [],
          x: -700,
          y: 0,
          parentObjectId: "",
          hierarchyLevel: "ProjectRoot",
          skin: "Star",
        },
      ],
    },
    {
      objectId: "project.right",
      displayName: "Right",
      description: "",
      systemTags: ["Node", "Project", "ProjectRoot"],
      userTags: [],
      vision: "Right project",
      color: "#f9a8d4",
      x: 700,
      y: 0,
      nodes: [
        {
          objectId: "project.right",
          displayName: "Right",
          description: "",
          systemTags: ["Node", "Project", "ProjectRoot"],
          userTags: [],
          x: 700,
          y: 0,
          parentObjectId: "",
          hierarchyLevel: "ProjectRoot",
          skin: "Star",
        },
      ],
    },
  ],
  connections: [],
  companion: {
    objectId: "companion",
    displayName: "Companion",
    description: "",
    systemTags: ["Companion", "Entity"],
    userTags: [],
    notificationAvailable: false,
  },
};

describe("CosmosMapRuntime", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("loads a snapshot, derives focus, and keeps Project galaxies separated", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(snapshot), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const runtime = new CosmosMapRuntime(new CosmosApiClient("http://cosmos.test"));

    await runtime.load();
    runtime.focusProject("project.left", { width: 1200, height: 800 });

    expect(runtime.state.phase).toBe("ready");
    expect(runtime.state.snapshot?.focusedProjectId).toBe("project.left");
    expect(runtime.moveNodeLocally("project.left", 500, 0)).toBe(false);
    expect(runtime.moveNodeLocally("project.left", -500, 0)).toBe(true);
  });

  it("persists camera, Node position, and deterministic Companion requests through the API", async () => {
    const responses = [snapshot, { x: 5, y: 6, zoom: 1 }, { objectId: "project.left", x: -600, y: 0 }, { message: "Hello", mode: "deterministic" }];
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(responses.shift()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const runtime = new CosmosMapRuntime(new CosmosApiClient("http://cosmos.test"));
    await runtime.load();
    runtime.setCamera({ x: 5, y: 6, zoom: 1 });
    runtime.moveNodeLocally("project.left", -600, 0);

    await runtime.persistCamera();
    await runtime.persistNodePosition("project.left");
    const reply = await runtime.sendCompanionMessage("Hello", {
      roomId: "cosmos.room.main",
      objectId: "cosmos.slot.knowledge",
    });

    expect(reply.mode).toBe("deterministic");
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "http://cosmos.test/cosmos/map",
      "http://cosmos.test/cosmos/camera",
      "http://cosmos.test/objects/project.left/position",
      "http://cosmos.test/companion/messages",
    ]);
    expect(JSON.parse(fetchMock.mock.calls[3]?.[1]?.body as string)).toEqual({
      message: "Hello",
      roomId: "cosmos.room.main",
      objectId: "cosmos.slot.knowledge",
    });
  });
});
