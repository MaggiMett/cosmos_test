import { describe, expect, it, vi } from "vitest";

import type { BaseRuntime, BaseSnapshot } from "../../runtime/baseRuntime";
import { runBaseMainRoomShadowMode } from "../../theme-engine/roomShadowMode";
import { collectBaseRoomShadowDiagnostics } from "./baseRoomShadowDiagnostics";

describe("new Base Presenter Room Shadow diagnostics boundary", () => {
  it("reads only the ready Base Snapshot and invokes the real Shadow projection", () => {
    const value = snapshot();
    const select = vi.fn();
    const load = vi.fn();
    const setNotificationAvailable = vi.fn();
    const base = {
      state: {
        phase: "ready",
        snapshot: value,
        selectedObjectId: "runtime.slot.knowledge",
        error: null,
      },
      select,
      load,
      setNotificationAvailable,
    } as unknown as BaseRuntime;

    const diagnostics = collectBaseRoomShadowDiagnostics(base);

    expect(diagnostics.status).toBe("complete");
    if (diagnostics.status !== "complete") throw new Error("Expected diagnostics.");
    expect(diagnostics.result.authoritativeRuntime).toBe("base-runtime");
    expect(diagnostics.result.snapshot.roomId).toBe("runtime.room.main");
    expect(select).not.toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();
    expect(setNotificationAvailable).not.toHaveBeenCalled();
  });

  it("skips non-ready Base state without running Shadow Mode", () => {
    const run = vi.fn(runBaseMainRoomShadowMode);
    const base = {
      state: {
        phase: "loading",
        snapshot: null,
        selectedObjectId: null,
        error: null,
      },
    } as unknown as Pick<BaseRuntime, "state">;

    expect(collectBaseRoomShadowDiagnostics(base, run)).toEqual({
      status: "skipped",
      reason: "base-not-ready",
    });
    expect(run).not.toHaveBeenCalled();
  });

  it("contains Shadow failures so the visible Base Presenter remains unaffected", () => {
    const base = {
      state: {
        phase: "ready",
        snapshot: snapshot(),
        selectedObjectId: null,
        error: null,
      },
    } as unknown as Pick<BaseRuntime, "state">;
    const failure = new Error("diagnostic failure");

    const diagnostics = collectBaseRoomShadowDiagnostics(base, () => {
      throw failure;
    });

    expect(diagnostics).toEqual({ status: "failed", error: failure });
  });
});

function snapshot(): BaseSnapshot {
  const summary = (objectId: string, displayName: string, systemTags: string[]) => ({
    objectId,
    displayName,
    description: "",
    systemTags,
    userTags: [],
  });
  return {
    base: summary("runtime.base.home", "Home Base", ["Base"]),
    rooms: [
      {
        ...summary("runtime.room.main", "Main Room", ["Room"]),
        slug: "main",
        order: 0,
        atmosphere: "Quiet",
        workspaceSlots: [
          {
            ...summary("runtime.slot.knowledge", "Knowledge Slot", ["WorkspaceSlot"]),
            placement: "rear_left",
            skin: "Core",
            workspace: {
              ...summary("runtime.workspace.knowledge", "Knowledge", ["Workspace"]),
              icon: "Knowledge",
              overlay: "Knowledge",
              sourceProjectId: "runtime.project.knowledge",
            },
          },
        ],
      },
      {
        ...summary("runtime.room.workshop", "Workshop", ["Room"]),
        slug: "workshop",
        order: 1,
        atmosphere: "Practical",
        workspaceSlots: [],
      },
    ],
    door: {
      ...summary("runtime.door.main-workshop", "Workshop Door", ["Door"]),
      roomAId: "runtime.room.main",
      roomBId: "runtime.room.workshop",
    },
    cockpit: {
      ...summary("runtime.cockpit.main", "Cockpit", ["Cockpit"]),
      roomId: "runtime.room.main",
    },
    companion: {
      ...summary("runtime.companion.guide", "Companion", ["Companion"]),
      notificationAvailable: false,
    },
    pet: summary("runtime.pet.resident", "Pet", ["Pet"]),
    unassignedWorkspaces: [],
  };
}
