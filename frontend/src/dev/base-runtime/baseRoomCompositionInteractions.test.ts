import { describe, expect, it, vi } from "vitest";

import type { RoomShadowInteractionTarget } from "../room-composition-preview/roomCompositionInteractionProjection";
import { forwardRoomCompositionTarget } from "./baseRoomCompositionInteractions";

describe("productive Room Composition interaction forwarding", () => {
  it.each([
    ["workspace", "openWorkspace", "slot.real", null],
    ["room-transition", "travelRoom", "door.real", "room.workshop.real"],
    ["companion", "openCompanion", "companion.real", "companion.real"],
    ["base-exit", "closeBase", "base.real", "base.real"],
  ] as const)("forwards %s only to the existing %s action", (
    bindingKind,
    action,
    bindingId,
    bindingTargetId,
  ) => {
    const actions = actionHarness();

    expect(forwardRoomCompositionTarget(
      target({ bindingKind, bindingId, bindingTargetId }),
      actions,
    )).toBe(true);

    expect(actions[action]).toHaveBeenCalledOnce();
    if (action === "openWorkspace") expect(actions[action]).toHaveBeenCalledWith(bindingId);
    if (action === "travelRoom") expect(actions[action]).toHaveBeenCalledWith(bindingTargetId);
    expect(Object.values(actions).filter((callback) => callback.mock.calls.length > 0)).toHaveLength(1);
  });

  it("does not activate an unavailable target", () => {
    const actions = actionHarness();

    expect(forwardRoomCompositionTarget(
      target({ bindingKind: "workspace", available: false }),
      actions,
    )).toBe(false);
    expect(Object.values(actions).every((callback) => callback.mock.calls.length === 0)).toBe(true);
  });
});

function actionHarness() {
  return {
    openWorkspace: vi.fn(),
    travelRoom: vi.fn(),
    openCompanion: vi.fn(),
    closeBase: vi.fn(),
  };
}

function target(
  override: Partial<RoomShadowInteractionTarget>,
): RoomShadowInteractionTarget {
  return {
    containerInstanceId: "container.real",
    objectInstanceId: "object.real",
    functionRole: "knowledge-workspace",
    descriptorRole: "workspace.open",
    bindingKind: "workspace",
    bindingId: "slot.real",
    bindingTargetId: "workspace.real",
    visualBounds: { type: "rect", x: 0, y: 0, width: 80, height: 40 },
    interactionBounds: { type: "rect", x: 0, y: 0, width: 100, height: 60 },
    position: { x: 0, y: 0 },
    available: true,
    focusable: true,
    focusOrder: 1,
    semanticLabel: "Target",
    ...override,
  };
}
