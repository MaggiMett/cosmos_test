import type { DeepReadonly } from "vue";
import type { Router } from "vue-router";

import type { BaseRuntime, BaseSnapshot } from "../../runtime/baseRuntime";
import type { BaseWorkspaceSlotPresentation } from "./baseRuntimeProjection";

type BaseSelectionRuntime = Readonly<Pick<BaseRuntime, "select">>;
type BaseNavigationRouter = Readonly<Pick<Router, "push">>;
export type BaseNavigationScope = "production" | "development";

type BaseRoomDestination = Readonly<Pick<DeepReadonly<BaseSnapshot>["rooms"][number], "objectId" | "slug">>;

export function baseRoomRoute(
  room: BaseRoomDestination | null | undefined,
  scope: BaseNavigationScope = "production",
) {
  if (scope === "development") {
    return room
      ? { path: "/dev/base-runtime", query: { roomId: room.objectId } }
      : { path: "/dev/base-runtime" };
  }
  return !room || room.slug === "main"
    ? { name: "base" }
    : { name: "room", params: { roomId: room.slug } };
}

export function workspaceRoute(workspaceObjectId: string, roomId?: string | null) {
  return {
    name: "workspace",
    params: { workspaceId: workspaceObjectId },
    ...(roomId ? { query: { fromRoomId: roomId } } : {}),
  };
}

export async function navigateFromBase(
  router: BaseNavigationRouter,
  focusedProjectId: string | null = null,
): Promise<void> {
  await router.push(focusedProjectId
    ? { path: "/", query: { projectId: focusedProjectId } }
    : { path: "/" });
}

export async function navigateToBaseRoom(
  router: BaseNavigationRouter,
  runtime: BaseSelectionRuntime,
  snapshot: DeepReadonly<BaseSnapshot>,
  targetRoomId: string,
  scope: BaseNavigationScope = "production",
): Promise<boolean> {
  const targetRoom = snapshot.rooms.find((room) => room.objectId === targetRoomId);
  if (!targetRoom) return false;

  runtime.select(null);
  await router.push(baseRoomRoute(targetRoom, scope));
  return true;
}

export async function navigateToBaseWorkspace(
  router: BaseNavigationRouter,
  runtime: BaseSelectionRuntime,
  slot: Readonly<BaseWorkspaceSlotPresentation>,
): Promise<boolean> {
  runtime.select(slot.slotObjectId);
  if (!slot.workspaceObjectId) return false;

  await router.push(workspaceRoute(slot.workspaceObjectId));
  return true;
}
