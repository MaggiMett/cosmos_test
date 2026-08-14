import { afterEach, describe, expect, it, vi } from "vitest";

import { CosmosApiClient } from "./apiClient";
import { BaseRuntime, type BaseSnapshot } from "./baseRuntime";

const snapshot: BaseSnapshot = {
  activeBuilder: { revisionId: null, document: null },
  base: summary("cosmos.base.default", "Base", ["Base", "System"]),
  rooms: [
    {
      ...summary("cosmos.room.main", "Main Room", ["Room", "System"]),
      slug: "main",
      order: 0,
      atmosphere: "Welcoming",
      workspaceSlots: [
        {
          ...summary("cosmos.slot.knowledge", "Knowledge Workspace", ["WorkspaceSlot"]),
          placement: "rear_left",
          skin: "KnowledgeDesk",
          workspace: {
            ...summary("cosmos.workspace.knowledge", "Knowledge Workspace", ["Workspace"]),
            icon: "Knowledge",
            overlay: "KnowledgeDesk",
            sourceProjectId: "cosmos.project.system.knowledge",
          },
        },
      ],
    },
  ],
  door: {
    ...summary("cosmos.door.main-workshop", "Workshop Door", ["Door"]),
    roomAId: "cosmos.room.main",
    roomBId: "cosmos.room.workshop",
  },
  cockpit: {
    ...summary("cosmos.base.cockpit", "Cockpit", ["Cockpit"]),
    roomId: "cosmos.room.main",
  },
  companion: {
    ...summary("cosmos.entity.companion", "Companion", ["Companion"]),
    notificationAvailable: false,
  },
  pet: summary("cosmos.entity.pet", "Base Pet", ["Pet"]),
  unassignedWorkspaces: [],
};

describe("BaseRuntime", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("loads the Base and resolves physical Rooms", async () => {
    vi.stubGlobal("fetch", () =>
      Promise.resolve(
        new Response(JSON.stringify(snapshot), {
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    const api = new CosmosApiClient("http://cosmos.test");
    const runtime = new BaseRuntime(api);

    await runtime.load();

    expect(runtime.state.phase).toBe("ready");
    expect(runtime.room("main")?.workspaceSlots[0]?.workspace?.displayName).toBe(
      "Knowledge Workspace",
    );
    expect(runtime.room("missing")).toBeNull();
  });

  it("owns selection state without opening a later-Sprint Workspace", () => {
    const runtime = new BaseRuntime(new CosmosApiClient());

    runtime.select("cosmos.slot.knowledge");
    expect(runtime.state.selectedObjectId).toBe("cosmos.slot.knowledge");
    runtime.select(null);
    expect(runtime.state.selectedObjectId).toBeNull();
  });
});

function summary(objectId: string, displayName: string, systemTags: string[]) {
  return { objectId, displayName, description: "", systemTags, userTags: [] };
}
