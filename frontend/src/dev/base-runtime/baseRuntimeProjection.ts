import type { DeepReadonly } from "vue";

import type {
  BaseObjectSummary,
  BaseRoom,
  BaseRuntime,
  BaseSnapshot,
  BaseWorkspace,
  WorkspaceSlot,
} from "../../runtime/baseRuntime";

export interface BaseWorkspaceSlotPresentation {
  slotObjectId: string;
  workspaceObjectId: string | null;
  slotDisplayName: string;
  displayName: string;
  description: string;
  placement: string;
  skin: string;
  icon: string | null;
  overlay: string | null;
  sourceProjectId: string | null;
  occupied: boolean;
  side: "left" | "right" | "center";
}

export interface BaseDoorPresentation {
  objectId: string;
  displayName: string;
  description: string;
  targetRoomId: string | null;
  targetRoomName: string | null;
  side: "left" | "right";
}

export interface BaseCompanionPresentation {
  objectId: string;
  displayName: string;
  description: string;
  notificationAvailable: boolean;
}

export interface BasePetPresentation {
  objectId: string;
  displayName: string;
  description: string;
}

export interface BaseRoomPresentation {
  baseObjectId: string;
  baseName: string;
  objectId: string;
  displayName: string;
  description: string;
  atmosphere: string;
  slug: BaseRoom["slug"];
  workspaceSlots: readonly Readonly<BaseWorkspaceSlotPresentation>[];
  knowledgeWorkspace: Readonly<BaseWorkspaceSlotPresentation> | null;
  creationWorkspace: Readonly<BaseWorkspaceSlotPresentation> | null;
  doorTargets: readonly Readonly<BaseDoorPresentation>[];
  cockpit: Readonly<Pick<BaseObjectSummary, "objectId" | "displayName" | "description">> | null;
  companion: Readonly<BaseCompanionPresentation> | null;
  pet: Readonly<BasePetPresentation> | null;
  rooms: readonly Readonly<Pick<BaseObjectSummary, "objectId" | "displayName" | "description">>[];
}

interface BasePresentationStateBase {
  roomCount: number;
  currentLocation: string;
}

export type BaseRuntimePresentationState =
  | (BasePresentationStateBase & { phase: "loading" })
  | (BasePresentationStateBase & { phase: "error"; message: string })
  | (BasePresentationStateBase & { phase: "empty"; message: string })
  | (BasePresentationStateBase & { phase: "not-found"; message: string })
  | (BasePresentationStateBase & {
      phase: "success";
      room: Readonly<BaseRoomPresentation>;
    });

export function loadBaseRuntimeSnapshot(
  runtime: Readonly<Pick<BaseRuntime, "load">>,
): Promise<void> {
  return runtime.load();
}

export function routeRoomParameterToSnapshotId(
  snapshot: DeepReadonly<BaseSnapshot> | null,
  value: unknown,
): string | null {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const parameter = value.trim();
  if (!snapshot) return parameter;
  return snapshot.rooms.find(
    (room) => room.objectId === parameter || room.slug === parameter,
  )?.objectId ?? parameter;
}

export function projectBaseRuntimeState(
  phase: BaseRuntime["state"]["phase"],
  snapshot: DeepReadonly<BaseSnapshot> | null,
  error: string | null,
  requestedRoomId: string | null = null,
): BaseRuntimePresentationState {
  if (phase === "idle" || phase === "loading") {
    return { phase: "loading", roomCount: 0, currentLocation: "Base" };
  }
  if (phase === "failed") {
    return {
      phase: "error",
      roomCount: 0,
      currentLocation: "Base",
      message: error ?? "Base could not be loaded.",
    };
  }
  if (!snapshot) {
    return {
      phase: "error",
      roomCount: 0,
      currentLocation: "Base",
      message: "Base returned no snapshot.",
    };
  }
  if (snapshot.rooms.length === 0) {
    return {
      phase: "empty",
      roomCount: 0,
      currentLocation: snapshot.base.displayName,
      message: "No rooms are available in Base.",
    };
  }

  const room = requestedRoomId
    ? snapshot.rooms.find((candidate) => candidate.objectId === requestedRoomId)
    : snapshot.rooms.find((candidate) => candidate.slug === "main");
  if (!room && requestedRoomId) {
    return {
      phase: "not-found",
      roomCount: snapshot.rooms.length,
      currentLocation: snapshot.base.displayName,
      message: "The requested Base Room is unavailable.",
    };
  }
  if (!room) {
    return {
      phase: "empty",
      roomCount: snapshot.rooms.length,
      currentLocation: snapshot.base.displayName,
      message: "Main Room is not available.",
    };
  }

  const workspaceSlots = room.workspaceSlots.map(projectWorkspaceSlot);
  const companion = room.slug === "main" && snapshot.companion
    ? {
        objectId: snapshot.companion.objectId,
        displayName: snapshot.companion.displayName,
        description: snapshot.companion.description,
        notificationAvailable: snapshot.companion.notificationAvailable,
      }
    : null;
  const pet = room.slug === "main" && snapshot.pet ? summary(snapshot.pet) : null;
  const cockpit = snapshot.cockpit?.roomId === room.objectId
    ? summary(snapshot.cockpit)
    : null;
  const doorTargets = projectDoorTargets(snapshot, room.objectId);

  return {
    phase: "success",
    roomCount: snapshot.rooms.length,
    currentLocation: room.slug === "main"
      ? snapshot.base.displayName
      : `${snapshot.base.displayName} · ${room.displayName}`,
    room: {
      baseObjectId: snapshot.base.objectId,
      baseName: snapshot.base.displayName,
      objectId: room.objectId,
      displayName: room.displayName,
      description: room.description,
      atmosphere: room.atmosphere,
      slug: room.slug,
      workspaceSlots,
      knowledgeWorkspace: workspaceByIcon(workspaceSlots, "knowledge"),
      creationWorkspace: workspaceByIcon(workspaceSlots, "creation"),
      doorTargets,
      cockpit,
      companion,
      pet,
      rooms: snapshot.rooms.map(summary),
    },
  };
}

function projectWorkspaceSlot(
  slot: DeepReadonly<WorkspaceSlot>,
): Readonly<BaseWorkspaceSlotPresentation> {
  const workspace = slot.workspace as DeepReadonly<BaseWorkspace> | null;
  return {
    slotObjectId: slot.objectId,
    workspaceObjectId: workspace?.objectId ?? null,
    slotDisplayName: slot.displayName,
    displayName: workspace?.displayName ?? slot.displayName,
    description: workspace?.description ?? slot.description,
    placement: slot.placement,
    skin: slot.skin,
    icon: workspace?.icon ?? null,
    overlay: workspace?.overlay ?? null,
    sourceProjectId: workspace?.sourceProjectId ?? null,
    occupied: workspace !== null,
    side: slotSide(slot.placement),
  };
}

function projectDoorTargets(
  snapshot: DeepReadonly<BaseSnapshot>,
  roomId: string,
): readonly Readonly<BaseDoorPresentation>[] {
  const door = snapshot.door;
  if (!door || (door.roomAId !== roomId && door.roomBId !== roomId)) return [];
  const targetRoomId = door.roomAId === roomId ? door.roomBId : door.roomAId;
  const targetRoom = snapshot.rooms.find((room) => room.objectId === targetRoomId) ?? null;
  return [{
    objectId: door.objectId,
    displayName: door.displayName,
    description: door.description,
    targetRoomId: targetRoom?.objectId ?? null,
    targetRoomName: targetRoom?.displayName ?? null,
    side: "right",
  }];
}

function workspaceByIcon(
  slots: readonly Readonly<BaseWorkspaceSlotPresentation>[],
  icon: string,
): Readonly<BaseWorkspaceSlotPresentation> | null {
  return slots.find((slot) => slot.icon?.trim().toLocaleLowerCase() === icon) ?? null;
}

function slotSide(placement: string): "left" | "right" | "center" {
  const normalized = placement.toLocaleLowerCase();
  if (normalized.includes("left")) return "left";
  if (normalized.includes("right")) return "right";
  return "center";
}

function summary(
  value: DeepReadonly<BaseObjectSummary>,
): Pick<BaseObjectSummary, "objectId" | "displayName" | "description"> {
  return {
    objectId: value.objectId,
    displayName: value.displayName,
    description: value.description,
  };
}
