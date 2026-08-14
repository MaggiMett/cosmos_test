import { cloneAndFreeze, deepClone } from "../../theme-engine/immutable";
import type { BaseComposition, RoomComposition } from "../../theme-engine/roomCompositionTypes";
import type { NamespacedId } from "../../theme-engine/types";
import { validateRoomComposition } from "../../theme-engine/validation";

export interface BaseBuilderDocument {
  base: BaseComposition;
  activeRoomId: NamespacedId;
}

export function createBaseBuilderDocument(
  room: Readonly<RoomComposition>,
  baseId: NamespacedId = "base.builder.local",
): Readonly<BaseBuilderDocument> {
  const validatedRoom = validateRoomComposition(deepClone(room));
  return cloneAndFreeze({
    base: {
      schemaVersion: 1,
      baseId,
      version: validatedRoom.version,
      rooms: [validatedRoom],
      connections: [...(validatedRoom.connections ?? [])],
      entryRoomId: validatedRoom.roomId,
      presentationOverrides: [],
      revision: { revisionId: `builder:${validatedRoom.revision.revisionId}` },
    },
    activeRoomId: validatedRoom.roomId,
  });
}

export function replaceBaseBuilderRoom(
  document: Readonly<BaseBuilderDocument>,
  room: Readonly<RoomComposition>,
): Readonly<BaseBuilderDocument> {
  const validatedRoom = validateRoomComposition(deepClone(room));
  if (validatedRoom.roomId !== document.activeRoomId) {
    throw new Error(`Base Builder room mismatch: expected ${document.activeRoomId}, received ${validatedRoom.roomId}`);
  }
  const rooms = document.base.rooms.map((existing) =>
    existing.roomId === validatedRoom.roomId ? validatedRoom : deepClone(existing),
  );
  if (!rooms.some((existing) => existing.roomId === validatedRoom.roomId)) {
    throw new Error(`Base Builder room is not part of Base Composition: ${validatedRoom.roomId}`);
  }
  return cloneAndFreeze({
    activeRoomId: document.activeRoomId,
    base: {
      ...deepClone(document.base),
      rooms,
      connections: [...(validatedRoom.connections ?? [])],
      revision: { revisionId: `builder:${validatedRoom.revision.revisionId}` },
    },
  });
}
