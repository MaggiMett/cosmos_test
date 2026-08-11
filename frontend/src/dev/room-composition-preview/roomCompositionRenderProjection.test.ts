import { describe, expect, it } from "vitest";

import type {
  BaseObjectSummary,
  BaseRoom,
  BaseSnapshot,
  WorkspaceSlot,
} from "../../runtime/baseRuntime";
import { runBaseMainRoomShadowMode } from "../../theme-engine/roomShadowMode";
import { projectRoomCompositionForShadowRender } from "./roomCompositionRenderProjection";

describe("read-only Room Composition Shadow renderer projection", () => {
  it("projects a real Main Room only after the existing Shadow resolver", () => {
    const value = snapshot();
    const shadow = runBaseMainRoomShadowMode({ baseSnapshot: value });
    const model = projectRoomCompositionForShadowRender(shadow.snapshot);

    expect(model.roomId).toBe("runtime.room.main");
    expect(model.width).toBe(1600);
    expect(model.height).toBe(900);
    expect(shadow.parity.status).toBe("equal");
    expect(JSON.stringify(value)).toBe(JSON.stringify(snapshot()));
  });

  it("includes Background, Foreground and Ambient as visible passive draw records", () => {
    const model = renderModel();

    expect(model.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "surface",
          id: "base.surface.background",
          role: "background",
          pointerPolicy: "passive",
        }),
        expect.objectContaining({
          kind: "surface",
          id: "base.surface.foreground",
          role: "foreground",
          pointerPolicy: "passive",
        }),
        expect.objectContaining({
          kind: "surface",
          id: "base.surface.ambient",
          role: "ambient",
          pointerPolicy: "passive",
        }),
      ]),
    );
  });

  it("projects Workspace, Transition and Companion Function Containers", () => {
    const functions = renderModel().items.filter(
      (item) => item.kind === "object" && item.functionContainer,
    );
    const types = functions.map((item) =>
      item.kind === "object" ? item.functionContainer?.definition.functionType : null,
    );

    expect(types.filter((type) => type === "knowledge-workspace")).toHaveLength(1);
    expect(types.filter((type) => type === "creation-workspace")).toHaveLength(1);
    expect(types).toContain("room-transition");
    expect(types).toContain("companion-interaction");
    expect(functions.every(
      (item) => item.kind === "object" && item.interactionShape !== null,
    )).toBe(true);
  });

  it("sorts Layer and Depth deterministically", () => {
    const first = renderModel();
    const second = renderModel();
    const order = first.items.map((item) => `${item.layer}:${item.depth}:${item.id}`);

    expect(second.items.map((item) => `${item.layer}:${item.depth}:${item.id}`)).toEqual(order);
    expect(order.indexOf("background:-1000:base.surface.background")).toBeLessThan(
      order.indexOf("scene:30:runtime.slot.knowledge"),
    );
    expect(order.indexOf("scene:30:runtime.slot.knowledge")).toBeLessThan(
      order.indexOf("ambient-front:500:base.surface.ambient"),
    );
    expect(order.indexOf("ambient-front:500:base.surface.ambient")).toBeLessThan(
      order.indexOf("foreground:700:base.surface.foreground"),
    );
  });

  it("remains complete with only the existing Core fallback", () => {
    const model = renderModel();

    expect(model.usesCoreFallback).toBe(true);
    expect(model.items.filter((item) => item.kind === "object")).not.toHaveLength(0);
    expect(model.surfaceCount).toBe(8);
    expect(model.functionContainerCount).toBe(5);
  });

  it("returns immutable draw records without mutating the resolved Snapshot", () => {
    const shadow = runBaseMainRoomShadowMode({ baseSnapshot: snapshot() });
    const before = JSON.stringify(shadow.snapshot);
    const model = projectRoomCompositionForShadowRender(shadow.snapshot);

    expect(JSON.stringify(shadow.snapshot)).toBe(before);
    expect(Object.isFrozen(model)).toBe(true);
    expect(Object.isFrozen(model.items)).toBe(true);
    expect(Object.isFrozen(model.items[0])).toBe(true);
  });
});

function renderModel() {
  const shadow = runBaseMainRoomShadowMode({ baseSnapshot: snapshot() });
  return projectRoomCompositionForShadowRender(shadow.snapshot);
}

function snapshot(): BaseSnapshot {
  return {
    base: summary("runtime.base.home", "Home Base", ["Base"]),
    rooms: [
      room("runtime.room.main", "Main Room", "main", [
        workspaceSlot(
          "runtime.slot.knowledge",
          "rear_left",
          "runtime.workspace.knowledge",
        ),
        workspaceSlot(
          "runtime.slot.creation",
          "rear_right",
          "runtime.workspace.creation",
        ),
      ]),
      room("runtime.room.workshop", "Workshop", "workshop", []),
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
    pet: summary("runtime.pet.resident", "Base Pet", ["Pet"]),
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
  placement: string,
  workspaceObjectId: string,
): WorkspaceSlot {
  return {
    ...summary(objectId, "Workspace Slot", ["WorkspaceSlot"]),
    placement,
    skin: "Core",
    workspace: {
      ...summary(workspaceObjectId, "Workspace", ["Workspace"]),
      icon: placement.includes("left") ? "Knowledge" : "Creation",
      overlay: "Workspace",
      sourceProjectId: "runtime.project.source",
    },
  };
}

function summary(
  objectId: string,
  displayName: string,
  systemTags: string[],
): BaseObjectSummary {
  return { objectId, displayName, description: "", systemTags, userTags: [] };
}
