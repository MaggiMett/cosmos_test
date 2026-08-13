import { describe, expect, it, vi } from "vitest";

import type { BaseRuntime, BaseSnapshot } from "../../runtime/baseRuntime";
import type { BaseWorkspaceSlotPresentation } from "./baseRuntimeProjection";
import {
  baseRoomRoute,
  navigateFromBase,
  navigateToBaseRoom,
  navigateToBaseWorkspace,
  workspaceRoute,
} from "./baseRuntimeInteractions";

describe("Base Runtime existing interaction adapter", () => {
  it("derives canonical Room routes for production and development", () => {
    const rooms = snapshot().rooms;
    expect(baseRoomRoute(rooms[0])).toEqual({ name: "base" });
    expect(baseRoomRoute(rooms[1])).toEqual({ name: "base-room", params: { roomId: "workshop" } });
    expect(baseRoomRoute(rooms[1], "development")).toEqual({
      path: "/dev/base-runtime",
      query: { roomId: "room.workshop.authoritative" },
    });
  });

  it("returns from Base through the productive Cosmos route", async () => {
    const { router, push } = interactionHarness();

    await navigateFromBase(router);

    expect(push).toHaveBeenCalledWith({ path: "/" });
  });

  it("returns from Base to the focused Project Cosmos context", async () => {
    const { router, push } = interactionHarness();

    await navigateFromBase(router, "project.asteria");

    expect(push).toHaveBeenCalledWith({
      path: "/",
      query: { projectId: "project.asteria" },
    });
  });

  it("navigates a real Door target through the canonical Base Room route", async () => {
    const { router, runtime, push, select } = interactionHarness();

    await expect(
      navigateToBaseRoom(router, runtime, snapshot(), "room.workshop.authoritative"),
    ).resolves.toBe(true);

    expect(select).toHaveBeenCalledWith(null);
    expect(push).toHaveBeenCalledWith({ name: "base-room", params: { roomId: "workshop" } });
  });

  it("navigates the real Main Room target through the productive Base route", async () => {
    const { router, runtime, push } = interactionHarness();

    await navigateToBaseRoom(router, runtime, snapshot(), "room.main.authoritative");

    expect(push).toHaveBeenCalledWith({ name: "base" });
  });

  it("navigates Main to Workshop inside the development presenter using the real Room ID", async () => {
    const { router, runtime, push, select } = interactionHarness();

    await navigateToBaseRoom(
      router,
      runtime,
      snapshot(),
      "room.workshop.authoritative",
      "development",
    );

    expect(select).toHaveBeenCalledWith(null);
    expect(push).toHaveBeenCalledWith({
      path: "/dev/base-runtime",
      query: { roomId: "room.workshop.authoritative" },
    });
  });

  it("navigates Workshop to Main inside the same presenter using the real Room ID", async () => {
    const { router, runtime, push } = interactionHarness();

    await navigateToBaseRoom(
      router,
      runtime,
      snapshot(),
      "room.main.authoritative",
      "development",
    );

    expect(push).toHaveBeenCalledWith({
      path: "/dev/base-runtime",
      query: { roomId: "room.main.authoritative" },
    });
  });

  it("does not navigate or mutate selection for an unavailable Room target", async () => {
    const { router, runtime, push, select } = interactionHarness();

    await expect(navigateToBaseRoom(router, runtime, snapshot(), "room.missing")).resolves.toBe(false);

    expect(select).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("derives the canonical Workspace route from the real Workspace ID", () => {
    expect(workspaceRoute("workspace.knowledge.authoritative")).toEqual({
      name: "workspace",
      params: { workspaceId: "workspace.knowledge.authoritative" },
    });
  });

  it("opens the existing Workspace route with the real Workspace ID", async () => {
    const { router, runtime, push, select } = interactionHarness();
    const slot = workspaceSlot();

    await expect(navigateToBaseWorkspace(router, runtime, slot)).resolves.toBe(true);

    expect(select).toHaveBeenCalledWith("slot.knowledge.authoritative");
    expect(push).toHaveBeenCalledWith({
      name: "workspace",
      params: { workspaceId: "workspace.knowledge.authoritative" },
    });
  });

  it("selects an empty Workspace Slot but keeps navigation unavailable like Legacy", async () => {
    const { router, runtime, push, select } = interactionHarness();
    const slot = { ...workspaceSlot(), workspaceObjectId: null, occupied: false };

    await expect(navigateToBaseWorkspace(router, runtime, slot)).resolves.toBe(false);

    expect(select).toHaveBeenCalledWith("slot.knowledge.authoritative");
    expect(push).not.toHaveBeenCalled();
  });
});

function interactionHarness() {
  const push = vi.fn().mockResolvedValue(undefined);
  const select = vi.fn();
  return {
    push,
    select,
    router: { push },
    runtime: { select } as unknown as Pick<BaseRuntime, "select">,
  };
}

function snapshot(): BaseSnapshot {
  return {
    base: summary("base.authoritative", "Base"),
    rooms: [
      {
        ...summary("room.main.authoritative", "Main Room"),
        slug: "main",
        order: 0,
        atmosphere: "Quiet",
        workspaceSlots: [],
      },
      {
        ...summary("room.workshop.authoritative", "Workshop"),
        slug: "workshop",
        order: 1,
        atmosphere: "Focused",
        workspaceSlots: [],
      },
    ],
    door: {
      ...summary("door.authoritative", "Workshop Door"),
      roomAId: "room.main.authoritative",
      roomBId: "room.workshop.authoritative",
    },
    cockpit: { ...summary("cockpit.authoritative", "Cockpit"), roomId: "room.main.authoritative" },
    companion: { ...summary("companion.authoritative", "Companion"), notificationAvailable: false },
    pet: summary("pet.authoritative", "Pet"),
    unassignedWorkspaces: [],
  };
}

function workspaceSlot(): BaseWorkspaceSlotPresentation {
  return {
    slotObjectId: "slot.knowledge.authoritative",
    workspaceObjectId: "workspace.knowledge.authoritative",
    slotDisplayName: "Knowledge Slot",
    displayName: "Knowledge Workspace",
    description: "",
    placement: "rear_left",
    skin: "Knowledge",
    icon: "Knowledge",
    overlay: "KnowledgeDesk",
    sourceProjectId: "project.knowledge.authoritative",
    occupied: true,
    side: "left",
  };
}

function summary(objectId: string, displayName: string) {
  return { objectId, displayName, description: "", systemTags: [], userTags: [] };
}
