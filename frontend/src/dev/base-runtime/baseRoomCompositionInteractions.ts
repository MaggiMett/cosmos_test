import type { RoomShadowInteractionTarget } from "../room-composition-preview/roomCompositionInteractionProjection";

export interface BaseRoomCompositionActions {
  openWorkspace: (workspaceSlotId: string) => void;
  travelRoom: (targetRoomId: string) => void;
  openCompanion: () => void;
  closeBase: () => void;
}

/** Function Containers only dispatch to the already-owned presenter actions. */
export function forwardRoomCompositionTarget(
  target: Readonly<RoomShadowInteractionTarget>,
  actions: Readonly<BaseRoomCompositionActions>,
): boolean {
  if (!target.available) return false;
  if (target.bindingKind === "workspace") {
    actions.openWorkspace(target.bindingId);
    return true;
  }
  if (target.bindingKind === "room-transition" && target.bindingTargetId) {
    actions.travelRoom(target.bindingTargetId);
    return true;
  }
  if (target.bindingKind === "companion") {
    actions.openCompanion();
    return true;
  }
  if (target.bindingKind === "base-exit") {
    actions.closeBase();
    return true;
  }
  return false;
}
