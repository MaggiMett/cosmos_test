import { describe, expect, it } from "vitest";

import type {
  BaseObjectSummary,
  BaseRoom,
  BaseSnapshot,
  WorkspaceSlot,
} from "../../runtime/baseRuntime";
import { deepClone } from "../../theme-engine/immutable";
import { runBaseRoomShadowMode } from "../../theme-engine/roomShadowMode";
import {
  createRoomCompositionInteractionDiagnostics,
} from "../room-composition-preview/roomCompositionInteractionProjection";
import {
  projectRoomCompositionForShadowRender,
} from "../room-composition-preview/roomCompositionRenderProjection";
import { projectBaseRuntimeState } from "./baseRuntimeProjection";
import {
  compareBaseRoomVisualParity,
  evaluateBaseRoomCompositionReadiness,
  evaluateBaseRoomVisualAcceptance,
  visualParitySeverity,
  type CompareBaseRoomVisualParityInput,
} from "./baseRoomVisualParity";

describe("Room Composition visual acceptance and default readiness", () => {
  it("accepts Main Room visual parity without blocking differences", () => {
    const result = evaluateBaseRoomVisualAcceptance(snapshot(), "room.main.real");

    expect(result.roomParity).toBe("equal");
    expect(result.interactionParity).toBe("equal");
    expect(result.visualParity).toMatchObject({
      roomType: "main",
      status: "equal",
      expectedFunctionCount: 5,
      visibleFunctionCount: 5,
      coreFallbackComplete: true,
      overflowFree: true,
    });
    expect(result.visualParity.architectureRoles).toEqual([
      "ambient",
      "architecture",
      "background",
      "ceiling",
      "floor",
      "foreground",
    ]);
  });

  it("accepts Workshop visual parity including four unavailable real slots", () => {
    const value = snapshot();
    const input = visualInput(value, "room.workshop.real");
    const result = compareBaseRoomVisualParity(input);

    expect(result).toMatchObject({
      roomType: "workshop",
      status: "equal",
      expectedFunctionCount: 6,
      visibleFunctionCount: 6,
      coreFallbackComplete: true,
      overflowFree: true,
    });
    expect(input.interactions.targets.filter((target) =>
      target.bindingKind === "workspace" && !target.available,
    )).toHaveLength(4);
  });

  it("blocks missing visible architecture", () => {
    const input = visualInput(snapshot(), "room.main.real");
    const original = deepClone(input.renderModel!);
    const renderModel = {
      ...original,
      items: original.items.filter((item) =>
        item.kind !== "surface" || item.role !== "foreground",
      ),
    };

    const result = compareBaseRoomVisualParity({ ...input, renderModel });

    expect(result.status).toBe("blocking-difference");
    expect(result.differences).toContainEqual(expect.objectContaining({
      category: "architecture",
      expectedId: "foreground",
    }));
  });

  it("blocks wrong Room Bounds and strongly wrong function position", () => {
    const input = visualInput(snapshot(), "room.main.real");
    const renderModel = { ...deepClone(input.renderModel!), width: 1200 };
    const originalInteractions = deepClone(input.interactions);
    const workspace = originalInteractions.targets.find(
      (target) => target.bindingKind === "workspace",
    )!;
    const interactions = {
      ...originalInteractions,
      targets: originalInteractions.targets.map((target) =>
        target.containerInstanceId === workspace.containerInstanceId
          ? {
              ...target,
              visualBounds: {
                type: "rect" as const,
                x: 1700,
                y: 40,
                width: 80,
                height: 80,
              },
            }
          : target,
      ),
    };

    const result = compareBaseRoomVisualParity({
      ...input,
      renderModel,
      interactions,
    });

    expect(result.status).toBe("blocking-difference");
    expect(result.differences).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: "room-bounds" }),
      expect.objectContaining({ category: "position" }),
      expect.objectContaining({ category: "clipping" }),
    ]));
  });

  it("blocks a Function Container that has no visible fallback object", () => {
    const input = visualInput(snapshot(), "room.main.real");
    const original = deepClone(input.renderModel!);
    const renderModel = {
      ...original,
      items: original.items.filter((item) => item.id !== "slot.knowledge.real"),
    };

    const result = compareBaseRoomVisualParity({ ...input, renderModel });

    expect(result.status).toBe("blocking-difference");
    expect(result.coreFallbackComplete).toBe(false);
    expect(result.differences).toContainEqual(expect.objectContaining({
      category: "function-visibility",
      expectedId: "slot.knowledge.real",
    }));
  });

  it("keeps neutral palette and missing decoration observations compatible", () => {
    const input = visualInput(snapshot(), "room.main.real");
    const result = compareBaseRoomVisualParity({
      ...input,
      observations: [
        { category: "neutral-palette", message: "Core fallback is cooler than the presenter." },
        { category: "decoration", message: "The presenter cockpit furniture is not part of the function projection." },
      ],
    });

    expect(visualParitySeverity("neutral-palette")).toBe("compatible-difference");
    expect(visualParitySeverity("decoration")).toBe("compatible-difference");
    expect(result.status).toBe("compatible-difference");
    expect(result.differences.every((difference) =>
      difference.severity === "compatible-difference",
    )).toBe(true);
  });

  it("proves complete Core fallback and current productive Room coverage", () => {
    const result = evaluateBaseRoomCompositionReadiness(snapshot());

    expect(result.decision).toBe("READY");
    expect(result.coverage).toEqual({
      actualRoomTypes: ["main", "workshop"],
      testedRoomTypes: ["main", "workshop"],
      complete: true,
    });
    expect(result.rooms).toHaveLength(2);
    expect(result.rooms.every((room) =>
      room.roomParity === "equal"
      && room.interactionParity === "equal"
      && room.visualParity.status === "equal"
      && room.visualParity.coreFallbackComplete,
    )).toBe(true);
    expect(result.blockers).toEqual([]);
  });

});

function visualInput(
  baseSnapshot: BaseSnapshot,
  roomId: string,
): CompareBaseRoomVisualParityInput {
  const presenter = projectBaseRuntimeState("ready", baseSnapshot, null, roomId);
  if (presenter.phase !== "success") throw new Error("Expected Room presentation.");
  const shadow = runBaseRoomShadowMode({ baseSnapshot, roomId });
  const interactions = createRoomCompositionInteractionDiagnostics(
    baseSnapshot,
    shadow.snapshot,
    shadow.runtimeBindings ?? [],
    roomId,
  );
  return {
    room: presenter.room,
    snapshot: shadow.snapshot,
    interactions: interactions.actual,
    renderModel: projectRoomCompositionForShadowRender(shadow.snapshot),
  };
}

function snapshot(): BaseSnapshot {
  return {
    base: summary("base.real", "Base", ["Base"]),
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
    ...summary(objectId, displayName, ["WorkspaceSlot"]),
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
