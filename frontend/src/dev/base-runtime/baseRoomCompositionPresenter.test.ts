import { describe, expect, it } from "vitest";

import type {
  BaseObjectSummary,
  BaseRoom,
  BaseSnapshot,
  WorkspaceSlot,
} from "../../runtime/baseRuntime";
import { runBaseRoomShadowMode } from "../../theme-engine";
import { createRoomCompositionInteractionDiagnostics } from "../room-composition-preview/roomCompositionInteractionProjection";
import {
  resolveBaseRoomCompositionPresenter,
} from "./baseRoomCompositionPresenter";
import {
  configuredBaseRoomRenderer,
  resolveBaseRoomRenderer,
} from "./baseRoomRenderer";

describe("controlled productive Room Composition renderer gate", () => {
  it("promotes Composition by default and keeps presenter as the exact rollback", () => {
    expect(resolveBaseRoomRenderer(undefined)).toBe("composition");
    expect(resolveBaseRoomRenderer("presenter")).toBe("presenter");
    expect(resolveBaseRoomRenderer("unexpected")).toBe("composition");
    expect(resolveBaseRoomRenderer("COMPOSITION")).toBe("composition");
    expect(resolveBaseRoomRenderer("composition")).toBe("composition");
    expect(configuredBaseRoomRenderer).toBe("composition");
  });

  it("keeps the previous presenter renderer when Composition is disabled", () => {
    expect(resolveBaseRoomCompositionPresenter(
      false,
      snapshot(),
      "room.main.real",
    )).toEqual({ status: "fallback", reason: "disabled" });
  });

  it.each([
    ["room.main.real", "Main Room", 5],
    ["room.workshop.real", "Workshop", 6],
  ] as const)("activates equal Composition for real Room %s", (
    roomId,
    roomName,
    targetCount,
  ) => {
    const result = resolveBaseRoomCompositionPresenter(true, snapshot(), roomId);

    expect(result.status).toBe("active");
    if (result.status !== "active") throw new Error("Expected active Composition.");
    expect(result.shadow.snapshot.roomId).toBe(roomId);
    expect(result.shadow.runtimeReference?.roomName).toBe(roomName);
    expect(result.shadow.parity.status).toBe("equal");
    expect(result.interactions.parity.status).toBe("equal");
    expect(result.interactions.actual.targets).toHaveLength(targetCount);
  });

  it("allows existing compatible-difference parity categories", () => {
    const base = snapshot();
    const resolved = runBaseRoomShadowMode({
      baseSnapshot: base,
      roomId: "room.main.real",
    });
    const interactions = createRoomCompositionInteractionDiagnostics(
      base,
      resolved.snapshot,
      resolved.runtimeBindings ?? [],
      "room.main.real",
    );
    const result = resolveBaseRoomCompositionPresenter(
      true,
      base,
      "room.main.real",
      {
        runShadow: () => ({
          ...resolved,
          parity: {
            ...resolved.parity,
            status: "compatible-difference",
            differences: [{
              severity: "compatible-difference",
              category: "skin",
              message: "Core fallback skin differs",
            }],
          },
        }),
        createInteractionDiagnostics: () => ({
          ...interactions,
          parity: {
            ...interactions.parity,
            status: "compatible-difference",
            differences: [],
          },
        }),
      },
    );

    expect(result.status).toBe("active");
  });

  it("falls back for blocking Room parity", () => {
    const base = snapshot();
    const resolved = runBaseRoomShadowMode({
      baseSnapshot: base,
      roomId: "room.main.real",
    });
    const result = resolveBaseRoomCompositionPresenter(
      true,
      base,
      "room.main.real",
      {
        runShadow: () => ({
          ...resolved,
          parity: {
            ...resolved.parity,
            status: "blocking-difference",
            differences: [{
              severity: "blocking-difference",
              category: "bounds",
              message: "Bounds differ",
            }],
          },
        }),
      },
    );

    expect(result).toEqual({
      status: "fallback",
      reason: "blocking-room-parity",
    });
  });

  it("falls back for blocking Interaction parity", () => {
    const base = snapshot();
    const resolved = runBaseRoomShadowMode({
      baseSnapshot: base,
      roomId: "room.main.real",
    });
    const interactions = createRoomCompositionInteractionDiagnostics(
      base,
      resolved.snapshot,
      resolved.runtimeBindings ?? [],
      "room.main.real",
    );
    const result = resolveBaseRoomCompositionPresenter(
      true,
      base,
      "room.main.real",
      {
        createInteractionDiagnostics: () => ({
          ...interactions,
          parity: {
            ...interactions.parity,
            status: "blocking-difference",
            differences: [{
              category: "runtime-binding",
              message: "Workspace target differs",
            }],
          },
        }),
      },
    );

    expect(result).toEqual({
      status: "fallback",
      reason: "blocking-interaction-parity",
    });
  });

  it("falls back for blocking Visual parity", () => {
    const result = resolveBaseRoomCompositionPresenter(
      true,
      snapshot(),
      "room.main.real",
      {
        compareVisualParity: (input) => ({
          roomId: input.room.objectId,
          roomType: input.room.slug,
          status: "blocking-difference",
          differences: [{
            severity: "blocking-difference",
            category: "clipping",
            message: "A Function Container is clipped.",
          }],
          roomBounds: { width: 1600, height: 1000 },
          architectureRoles: [],
          expectedFunctionCount: 5,
          visibleFunctionCount: 4,
          coreFallbackComplete: true,
          overflowFree: false,
        }),
      },
    );

    expect(result).toEqual({
      status: "fallback",
      reason: "blocking-visual-parity",
    });
  });

  it("falls back for an invalid Snapshot or Resolver failure", () => {
    const base = snapshot();
    const resolved = runBaseRoomShadowMode({
      baseSnapshot: base,
      roomId: "room.main.real",
    });
    const invalid = resolveBaseRoomCompositionPresenter(
      true,
      base,
      "room.main.real",
      {
        runShadow: () => ({
          ...resolved,
          snapshot: {
            ...resolved.snapshot,
            validationStatus: {
              valid: false,
              warnings: [],
              conflicts: ["invalid"],
            },
          },
        }),
      },
    );
    const failed = resolveBaseRoomCompositionPresenter(
      true,
      base,
      "room.main.real",
      { runShadow: () => { throw new Error("resolver failed"); } },
    );

    expect(invalid).toEqual({ status: "fallback", reason: "invalid-snapshot" });
    expect(failed).toEqual({ status: "fallback", reason: "resolution-error" });
  });

  it("falls back when the existing Visual projection fails internally", () => {
    expect(resolveBaseRoomCompositionPresenter(
      true,
      snapshot(),
      "room.main.real",
      { compareVisualParity: () => { throw new Error("visual projection failed"); } },
    )).toEqual({ status: "fallback", reason: "resolution-error" });
  });

  it("falls back for an unknown real Room ID", () => {
    expect(resolveBaseRoomCompositionPresenter(
      true,
      snapshot(),
      "room.unknown",
    )).toEqual({ status: "fallback", reason: "resolution-error" });
  });
});

function snapshot(): BaseSnapshot {
  return {
    base: summary("base.real", "Home Base", ["Base"]),
    rooms: [
      room("room.main.real", "Main Room", "main", [
        workspaceSlot("slot.knowledge.real", "Knowledge Workspace", "rear_left", "workspace.knowledge.real"),
        workspaceSlot("slot.creation.real", "Creation Workspace", "rear_right", "workspace.creation.real"),
      ]),
      room("room.workshop.real", "Workshop", "workshop", [
        workspaceSlot("slot.workshop.1.real", "Empty Workspace Slot", "left_rear", null),
        workspaceSlot("slot.workshop.2.real", "Empty Workspace Slot", "left_front", null),
        workspaceSlot("slot.workshop.3.real", "Empty Workspace Slot", "right_rear", null),
        workspaceSlot("slot.workshop.4.real", "Empty Workspace Slot", "right_front", null),
      ]),
    ],
    door: {
      ...summary("door.real", "Workshop Door", ["Door"]),
      roomAId: "room.main.real",
      roomBId: "room.workshop.real",
    },
    cockpit: {
      ...summary("cockpit.real", "Cockpit", ["Cockpit"]),
      roomId: "room.main.real",
    },
    companion: {
      ...summary("companion.real", "Companion", ["Companion"]),
      notificationAvailable: false,
    },
    pet: summary("pet.real", "Pet", ["Pet"]),
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
    atmosphere: "Quiet",
    workspaceSlots,
  };
}

function workspaceSlot(
  objectId: string,
  displayName: string,
  placement: string,
  workspaceObjectId: string | null,
): WorkspaceSlot {
  return {
    ...summary(objectId, `${displayName} Slot`, ["WorkspaceSlot"]),
    placement,
    skin: "Core",
    workspace: workspaceObjectId
      ? {
          ...summary(workspaceObjectId, displayName, ["Workspace"]),
          icon: placement.includes("right") ? "Creation" : "Knowledge",
          overlay: "Workspace",
          sourceProjectId: "project.real",
        }
      : null,
  };
}

function summary(
  objectId: string,
  displayName: string,
  systemTags: string[],
): BaseObjectSummary {
  return { objectId, displayName, description: "", systemTags, userTags: [] };
}
