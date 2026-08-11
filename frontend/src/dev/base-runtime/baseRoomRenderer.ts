export type BaseRoomRenderer = "presenter" | "composition";

/** Only the explicit `presenter` value activates the renderer rollback. */
export function resolveBaseRoomRenderer(value: unknown): BaseRoomRenderer {
  return value === "presenter" ? "presenter" : "composition";
}

export const configuredBaseRoomRenderer = resolveBaseRoomRenderer(
  import.meta.env.VITE_BASE_ROOM_RENDERER,
);
