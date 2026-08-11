import { describe, expect, it, vi } from "vitest";

import type {
  BaseObjectSummary,
  BaseRoom,
  BaseSnapshot,
  WorkspaceSlot,
} from "../../runtime/baseRuntime";
import {
  loadBaseRuntimeSnapshot,
  projectBaseRuntimeState,
  routeRoomParameterToSnapshotId,
} from "./baseRuntimeProjection";

describe("real Base Runtime projection", () => {
  it("maps productive slug and ID parameters deterministically to Snapshot Room IDs", () => {
    const value = snapshot();

    expect(routeRoomParameterToSnapshotId(value, null)).toBeNull();
    expect(routeRoomParameterToSnapshotId(value, "main")).toBe("room.central.real");
    expect(routeRoomParameterToSnapshotId(value, "workshop")).toBe("room.studio.real");
    expect(routeRoomParameterToSnapshotId(value, "room.studio.real")).toBe("room.studio.real");
  });

  it("preserves an unknown productive Room parameter for the Not Found projection", () => {
    expect(routeRoomParameterToSnapshotId(snapshot(), "room.unknown")).toBe("room.unknown");
    expect(routeRoomParameterToSnapshotId(null, "workshop")).toBe("workshop");
  });

  it("projects the real Main Room and preserves authoritative IDs", () => {
    const state = projectBaseRuntimeState("ready", snapshot(), null);

    expect(state.phase).toBe("success");
    if (state.phase !== "success") throw new Error("Expected Base success.");
    expect(state.currentLocation).toBe("Home Base · Central Room");
    expect(state.room.objectId).toBe("room.central.real");
    expect(state.room.baseObjectId).toBe("base.real");
    expect(state.room.atmosphere).toBe("Calm");
    expect(state.room.pet).toEqual({
      objectId: "pet.real",
      displayName: "Resident",
      description: "",
    });
  });

  it("projects real occupied and empty Workspace Slots without inventing Workspaces", () => {
    const state = projectBaseRuntimeState("ready", snapshot(), null);
    if (state.phase !== "success") throw new Error("Expected Base success.");

    expect(state.room.workspaceSlots).toHaveLength(2);
    expect(state.room.workspaceSlots[0]).toMatchObject({
      slotObjectId: "slot.research.real",
      workspaceObjectId: "workspace.research.real",
      displayName: "Research Desk",
      sourceProjectId: "project.research.real",
      occupied: true,
      side: "left",
    });
    expect(state.room.workspaceSlots[1]).toMatchObject({
      slotObjectId: "slot.empty.real",
      workspaceObjectId: null,
      occupied: false,
      side: "right",
    });
  });

  it("resolves the real Workshop by its authoritative Room ID", () => {
    const state = projectBaseRuntimeState("ready", snapshot(), null, "room.studio.real");

    expect(state.phase).toBe("success");
    if (state.phase !== "success") throw new Error("Expected Workshop success.");
    expect(state.currentLocation).toBe("Home Base · Studio");
    expect(state.room).toMatchObject({
      objectId: "room.studio.real",
      displayName: "Studio",
      slug: "workshop",
      atmosphere: "Focused",
    });
    expect(state.room.workspaceSlots).toEqual([
      expect.objectContaining({
        slotObjectId: "slot.studio.real",
        workspaceObjectId: "workspace.studio.real",
        occupied: true,
      }),
    ]);
    expect(state.room.cockpit).toBeNull();
    expect(state.room.companion).toBeNull();
    expect(state.room.pet).toBeNull();
  });

  it("renders a real Workshop without Workspace Slots as an empty Room composition", () => {
    const value = snapshot();
    value.rooms[1] = room("room.studio.real", "Studio", "workshop", []);

    const state = projectBaseRuntimeState("ready", value, null, "room.studio.real");

    if (state.phase !== "success") throw new Error("Expected Workshop success.");
    expect(state.room.workspaceSlots).toEqual([]);
    expect(state.room.knowledgeWorkspace).toBeNull();
    expect(state.room.creationWorkspace).toBeNull();
  });

  it("returns a quiet Not Found state for an unknown Room ID", () => {
    expect(projectBaseRuntimeState("ready", snapshot(), null, "room.unknown")).toEqual({
      phase: "not-found",
      roomCount: 2,
      currentLocation: "Home Base",
      message: "The requested Base Room is unavailable.",
    });
  });

  it("projects a missing Door target as unavailable without inventing a Room", () => {
    const value = snapshot();
    value.door.roomAId = "room.central.real";
    value.door.roomBId = "room.removed.real";

    const state = projectBaseRuntimeState("ready", value, null);

    if (state.phase !== "success") throw new Error("Expected Base success.");
    expect(state.room.doorTargets).toEqual([
      expect.objectContaining({ targetRoomId: null, targetRoomName: null }),
    ]);
  });

  it("resolves the same Workshop again for a repeated deep-link projection", () => {
    const value = snapshot();
    const first = projectBaseRuntimeState("ready", value, null, "room.studio.real");
    const reloaded = projectBaseRuntimeState("ready", value, null, "room.studio.real");

    expect(reloaded).toEqual(first);
  });

  it("supports a real Main Room without Workspace Slots", () => {
    const value = snapshot();
    value.rooms[0] = room("room.central.real", "Central Room", "main", []);

    const state = projectBaseRuntimeState("ready", value, null);
    expect(state.phase).toBe("success");
    if (state.phase !== "success") throw new Error("Expected Base success.");
    expect(state.room.workspaceSlots).toEqual([]);
    expect(state.room.knowledgeWorkspace).toBeNull();
    expect(state.room.creationWorkspace).toBeNull();
  });

  it("projects only the real Door and its existing Room target", () => {
    const state = projectBaseRuntimeState("ready", snapshot(), null);
    if (state.phase !== "success") throw new Error("Expected Base success.");

    expect(state.room.doorTargets).toEqual([
      {
        objectId: "door.real",
        displayName: "Studio Door",
        description: "Connects the central room and studio.",
        targetRoomId: "room.studio.real",
        targetRoomName: "Studio",
        side: "right",
      },
    ]);
    expect(state.room.rooms.map((roomValue) => roomValue.objectId)).toEqual([
      "room.central.real",
      "room.studio.real",
    ]);
  });

  it("projects a present Companion and degrades quietly when it is absent", () => {
    const present = projectBaseRuntimeState("ready", snapshot(), null);
    if (present.phase !== "success") throw new Error("Expected Base success.");
    expect(present.room.companion).toMatchObject({
      objectId: "companion.real",
      displayName: "Guide",
      notificationAvailable: true,
    });

    const { companion: _companion, ...missing } = snapshot();
    const absent = projectBaseRuntimeState("ready", missing as BaseSnapshot, null);
    if (absent.phase !== "success") throw new Error("Expected Base success.");
    expect(absent.room.companion).toBeNull();
  });

  it("does not invent a Pet when the authoritative Snapshot has none", () => {
    const { pet: _pet, ...missing } = snapshot();
    const state = projectBaseRuntimeState("ready", missing as BaseSnapshot, null);

    if (state.phase !== "success") throw new Error("Expected Base success.");
    expect(state.room.pet).toBeNull();
  });

  it("returns a quiet Empty state for a Base without Rooms or Main Room", () => {
    const noRooms = snapshot();
    noRooms.rooms = [];
    expect(projectBaseRuntimeState("ready", noRooms, null)).toMatchObject({
      phase: "empty",
      message: "No rooms are available in Base.",
    });

    const noMain = snapshot();
    noMain.rooms = [room("room.studio.real", "Studio", "workshop", [])];
    expect(projectBaseRuntimeState("ready", noMain, null)).toMatchObject({
      phase: "empty",
      message: "Main Room is not available.",
    });
  });

  it("preserves Loading and Error states without fallback data", () => {
    expect(projectBaseRuntimeState("loading", null, null)).toEqual({
      phase: "loading",
      roomCount: 0,
      currentLocation: "Base",
    });
    expect(projectBaseRuntimeState("failed", null, "Base service offline")).toEqual({
      phase: "error",
      roomCount: 0,
      currentLocation: "Base",
      message: "Base service offline",
    });
  });

  it("loads exclusively through the existing read-only BaseRuntime load path", async () => {
    const runtime = { load: vi.fn().mockResolvedValue(undefined) };

    await expect(loadBaseRuntimeSnapshot(runtime)).resolves.toBeUndefined();
    expect(runtime.load).toHaveBeenCalledOnce();
    expect(Object.keys(runtime)).toEqual(["load"]);
  });
});

function snapshot(): BaseSnapshot {
  const researchSlot: WorkspaceSlot = {
    ...summary("slot.research.real", "Research Slot", ["WorkspaceSlot"]),
    placement: "rear_left",
    skin: "ResearchSurface",
    workspace: {
      ...summary("workspace.research.real", "Research Desk", ["Workspace"]),
      description: "A real research Workspace.",
      icon: "Knowledge",
      overlay: "ResearchOverlay",
      sourceProjectId: "project.research.real",
    },
  };
  const emptySlot: WorkspaceSlot = {
    ...summary("slot.empty.real", "Unassigned Slot", ["WorkspaceSlot"]),
    placement: "rear_right",
    skin: "EmptySurface",
    workspace: null,
  };
  const studioSlot: WorkspaceSlot = {
    ...summary("slot.studio.real", "Studio Slot", ["WorkspaceSlot"]),
    placement: "left_rear",
    skin: "StudioBench",
    workspace: {
      ...summary("workspace.studio.real", "Studio Workspace", ["Workspace"]),
      icon: "Studio",
      overlay: "StudioBench",
      sourceProjectId: "project.studio.real",
    },
  };
  return {
    base: summary("base.real", "Home Base", ["Base"]),
    rooms: [
      room("room.central.real", "Central Room", "main", [researchSlot, emptySlot]),
      room("room.studio.real", "Studio", "workshop", [studioSlot]),
    ],
    door: {
      ...summary("door.real", "Studio Door", ["Door"]),
      description: "Connects the central room and studio.",
      roomAId: "room.central.real",
      roomBId: "room.studio.real",
    },
    cockpit: {
      ...summary("cockpit.real", "Flight Deck", ["Cockpit"]),
      roomId: "room.central.real",
    },
    companion: {
      ...summary("companion.real", "Guide", ["Companion"]),
      description: "A real Base companion.",
      notificationAvailable: true,
    },
    pet: summary("pet.real", "Resident", ["Pet"]),
    unassignedWorkspaces: [],
  };
}

function room(
  objectId: string,
  displayName: string,
  slug: BaseRoom["slug"],
  workspaceSlots: WorkspaceSlot[],
): BaseRoom {
  return {
    ...summary(objectId, displayName, ["Room"]),
    slug,
    order: slug === "main" ? 0 : 1,
    atmosphere: slug === "main" ? "Calm" : "Focused",
    workspaceSlots,
  };
}

function summary(objectId: string, displayName: string, systemTags: string[]): BaseObjectSummary {
  return { objectId, displayName, description: "", systemTags, userTags: [] };
}
