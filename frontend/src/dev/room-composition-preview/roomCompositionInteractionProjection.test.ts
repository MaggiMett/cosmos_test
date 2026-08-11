import { describe, expect, it } from "vitest";

import type {
  BaseObjectSummary,
  BaseRoom,
  BaseSnapshot,
  WorkspaceSlot,
} from "../../runtime/baseRuntime";
import { runBaseMainRoomShadowMode } from "../../theme-engine/roomShadowMode";
import type { BaseRuntimeShadowBinding } from "../../theme-engine/baseRuntimeRoomShadowProjection";
import type { BoundsShape } from "../../theme-engine/types";
import {
  compareRoomCompositionInteractionParity,
  createRoomCompositionInteractionDiagnostics,
  projectBasePresenterInteractionExpectations,
  projectRoomCompositionInteractions,
  type RoomCompositionInteractionProjection,
  type RoomShadowInteractionTarget,
} from "./roomCompositionInteractionProjection";

describe("Room Composition Shadow interaction diagnostics", () => {
  it("projects existing Workspace, Door, Companion and Base Exit Interaction Bounds", () => {
    const { actual } = diagnostics();

    expect(actual.targets.map((target) => target.functionRole)).toEqual([
      "room-transition",
      "knowledge-workspace",
      "creation-workspace",
      "companion-interaction",
      "base-exit",
    ]);
    expect(actual.targets.every((target) => target.interactionBounds)).toBe(true);
  });

  it("keeps visual and Interaction Bounds separate and contract-derived", () => {
    const { shadow, actual } = diagnostics();
    const workspace = actual.targets.find(
      (target) => target.functionRole === "knowledge-workspace",
    );
    const container = shadow.snapshot.functionContainers.find(
      (candidate) => candidate.instance.containerInstanceId === workspace?.containerInstanceId,
    );

    expect(workspace).toBeDefined();
    expect(container).toBeDefined();
    expect(workspace?.visualBounds).not.toEqual(workspace?.interactionBounds);
    expect(container?.definition.interactionBounds).not.toEqual(
      shadow.snapshot.objectInstances.find(
        (object) => object.instanceId === workspace?.objectInstanceId,
      )?.catalogObject.defaultBounds.visual,
    );
  });

  it("preserves stable real binding and target IDs", () => {
    const { actual } = diagnostics();

    expect(actual.targets).toEqual(expect.arrayContaining([
      expect.objectContaining({
        bindingKind: "workspace",
        bindingId: "runtime.slot.knowledge",
        bindingTargetId: "runtime.workspace.knowledge",
      }),
      expect.objectContaining({
        bindingKind: "room-transition",
        bindingId: "runtime.door.main-workshop",
        bindingTargetId: "runtime.room.workshop",
      }),
      expect.objectContaining({
        bindingKind: "companion",
        bindingId: "runtime.companion.guide",
        bindingTargetId: "runtime.companion.guide",
      }),
      expect.objectContaining({
        bindingKind: "base-exit",
        bindingId: "runtime.base.home",
        bindingTargetId: "runtime.base.home",
      }),
    ]));
  });

  it("creates an immutable deterministic Focus plan from existing contracts", () => {
    const first = diagnostics().actual;
    const second = diagnostics().actual;

    expect(second.focusPlan).toEqual(first.focusPlan);
    expect(first.focusPlan.map((target) => target.order)).toEqual([1, 2, 3, 4, 5]);
    expect(first.focusPlan.map((target) => target.functionRole)).toEqual([
      "room-transition",
      "knowledge-workspace",
      "creation-workspace",
      "companion-interaction",
      "base-exit",
    ]);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.targets[0])).toBe(true);
    expect(Object.isFrozen(first.focusPlan[0])).toBe(true);
  });

  it("keeps an unavailable Workspace target visible in the diagnostic Focus plan", () => {
    const base = snapshot();
    base.rooms[0]!.workspaceSlots[0]!.workspace = null;
    const shadow = runBaseMainRoomShadowMode({ baseSnapshot: base });
    const result = createRoomCompositionInteractionDiagnostics(
      base,
      shadow.snapshot,
      shadow.runtimeBindings ?? [],
    );
    const target = result.actual.targets.find(
      (candidate) => candidate.bindingId === "runtime.slot.knowledge",
    );

    expect(result.parity.status).toBe("equal");
    expect(target).toMatchObject({
      available: false,
      focusable: true,
      bindingTargetId: null,
    });
  });

  it("uses the productive Base presenter semantic labels", () => {
    const { actual } = diagnostics();
    const labels = actual.targets.map((target) => target.semanticLabel);

    expect(labels).toEqual([
      "Workshop Door to Workshop",
      "Knowledge Workspace",
      "Creation Workspace",
      "Open Companion",
      "Return to Cosmos",
    ]);
  });

  it("keeps full Main Room structural and interaction parity equal", () => {
    const result = diagnostics();

    expect(result.shadow.parity.status).toBe("equal");
    expect(result.parity.status).toBe("equal");
    expect(result.parity.expectedTargetCount).toBe(5);
    expect(result.parity.actualTargetCount).toBe(5);
  });

  it("blocks a missing container and a wrong Function role", () => {
    const result = diagnostics();
    const missing = projection(result.actual.targets.slice(1));
    const wrongRole = projection(result.actual.targets.map((target, index) =>
      index === 0
        ? { ...target, functionRole: "tool-entry" as const }
        : target,
    ));

    expect(compareRoomCompositionInteractionParity(result.expected, missing)).toMatchObject({
      status: "blocking-difference",
      differences: expect.arrayContaining([
        expect.objectContaining({ category: "container" }),
      ]),
    });
    expect(compareRoomCompositionInteractionParity(result.expected, wrongRole)).toMatchObject({
      status: "blocking-difference",
      differences: expect.arrayContaining([
        expect.objectContaining({ category: "function-role" }),
      ]),
    });
  });

  it.each([
    ["workspace", "runtime.workspace.wrong"],
    ["room-transition", "runtime.room.wrong"],
    ["companion", "runtime.companion.wrong"],
  ] as const)("blocks a wrong %s target binding", (kind, wrongTarget) => {
    const base = snapshot();
    const shadow = runBaseMainRoomShadowMode({ baseSnapshot: base });
    const bindings = (shadow.runtimeBindings ?? []).map((binding) =>
      binding.kind === kind
        ? withBindingTarget(binding, wrongTarget)
        : binding,
    );
    const expected = projectBasePresenterInteractionExpectations(base);
    const labels = Object.fromEntries(
      expected.targets.map((target) => [target.containerInstanceId, target.semanticLabel]),
    );
    const actual = projectRoomCompositionInteractions(shadow.snapshot, bindings, labels);
    const parity = compareRoomCompositionInteractionParity(expected, actual);

    expect(parity.status).toBe("blocking-difference");
    expect(parity.differences).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: "runtime-binding" }),
    ]));
  });

  it("blocks changed Interaction Bounds using the existing exact parity tolerance", () => {
    const result = diagnostics();
    const changed = projection(result.actual.targets.map((target, index) =>
      index === 0
        ? { ...target, interactionBounds: moveShape(target.interactionBounds, 1) }
        : target,
    ));
    const parity = compareRoomCompositionInteractionParity(result.expected, changed);

    expect(parity.status).toBe("blocking-difference");
    expect(parity.differences).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: "interaction-bounds" }),
    ]));
  });

  it("blocks duplicate Focus targets", () => {
    const result = diagnostics();
    const duplicated = projection([
      ...result.actual.targets,
      { ...result.actual.targets[0]! },
    ]);
    const parity = compareRoomCompositionInteractionParity(result.expected, duplicated);

    expect(parity.status).toBe("blocking-difference");
    expect(parity.differences).toEqual(expect.arrayContaining([
      expect.objectContaining({
        category: "focus-order",
        message: expect.stringContaining("Duplicate focus target"),
      }),
    ]));
  });

  it("does not mutate the Base or resolved Room snapshots", () => {
    const base = snapshot();
    const shadow = runBaseMainRoomShadowMode({ baseSnapshot: base });
    const beforeBase = JSON.stringify(base);
    const beforeRoom = JSON.stringify(shadow.snapshot);

    createRoomCompositionInteractionDiagnostics(
      base,
      shadow.snapshot,
      shadow.runtimeBindings ?? [],
    );

    expect(JSON.stringify(base)).toBe(beforeBase);
    expect(JSON.stringify(shadow.snapshot)).toBe(beforeRoom);
  });
});

function diagnostics() {
  const base = snapshot();
  const shadow = runBaseMainRoomShadowMode({ baseSnapshot: base });
  return {
    shadow,
    ...createRoomCompositionInteractionDiagnostics(
      base,
      shadow.snapshot,
      shadow.runtimeBindings ?? [],
    ),
  };
}

function projection(
  targets: readonly Readonly<RoomShadowInteractionTarget>[],
): RoomCompositionInteractionProjection {
  return {
    targets,
    focusPlan: targets.map((target) => ({
      order: target.focusOrder,
      containerInstanceId: target.containerInstanceId,
      functionRole: target.functionRole,
      bindingId: target.bindingId,
      bindingTargetId: target.bindingTargetId,
      available: target.available,
      semanticLabel: target.semanticLabel,
    })),
  };
}

function withBindingTarget(
  binding: Readonly<BaseRuntimeShadowBinding>,
  target: string,
): BaseRuntimeShadowBinding {
  if (binding.kind === "workspace") return { ...binding, workspaceId: target };
  if (binding.kind === "room-transition") return { ...binding, targetRoomId: target };
  if (binding.kind === "companion") {
    return {
      ...binding,
      companionId: target,
      objectInstanceId: target,
    };
  }
  return binding;
}

function moveShape(shape: BoundsShape, offset: number): BoundsShape {
  if (shape.type === "rect") return { ...shape, x: shape.x + offset };
  if (shape.type === "ellipse") return { ...shape, cx: shape.cx + offset };
  return {
    ...shape,
    points: shape.points.map((point) => ({ ...point, x: point.x + offset })),
  };
}

function snapshot(): BaseSnapshot {
  return {
    base: summary("runtime.base.home", "Home Base", ["Base"]),
    rooms: [
      room("runtime.room.main", "Main Room", "main", [
        workspaceSlot(
          "runtime.slot.knowledge",
          "Knowledge Workspace",
          "rear_left",
          "runtime.workspace.knowledge",
        ),
        workspaceSlot(
          "runtime.slot.creation",
          "Creation Workspace",
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
  displayName: string,
  placement: string,
  workspaceObjectId: string,
): WorkspaceSlot {
  return {
    ...summary(objectId, `${displayName} Slot`, ["WorkspaceSlot"]),
    placement,
    skin: "Core",
    workspace: {
      ...summary(workspaceObjectId, displayName, ["Workspace"]),
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
