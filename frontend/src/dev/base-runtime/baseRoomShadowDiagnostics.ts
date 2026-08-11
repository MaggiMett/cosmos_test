import type { BaseRuntime } from "../../runtime/baseRuntime";
import {
  runBaseMainRoomShadowMode,
  type RoomShadowModeResult,
} from "../../theme-engine/roomShadowMode";

export type BaseRoomShadowDiagnosticsResult =
  | { status: "skipped"; reason: "base-not-ready" }
  | { status: "complete"; result: Readonly<RoomShadowModeResult> }
  | { status: "failed"; error: unknown };

type ShadowRunner = typeof runBaseMainRoomShadowMode;

/** Diagnostics-only boundary: reads Base state and never exposes Runtime actions. */
export function collectBaseRoomShadowDiagnostics(
  base: Readonly<Pick<BaseRuntime, "state">>,
  runShadow: ShadowRunner = runBaseMainRoomShadowMode,
): BaseRoomShadowDiagnosticsResult {
  if (base.state.phase !== "ready" || !base.state.snapshot) {
    return { status: "skipped", reason: "base-not-ready" };
  }
  try {
    return {
      status: "complete",
      result: runShadow({ baseSnapshot: base.state.snapshot }),
    };
  } catch (error: unknown) {
    return { status: "failed", error };
  }
}

/** Runs after Base loading without participating in rendering or navigation. */
export function scheduleBaseRoomShadowDiagnostics(
  base: Readonly<Pick<BaseRuntime, "state">>,
): void {
  void Promise.resolve().then(() => {
    collectBaseRoomShadowDiagnostics(base);
  });
}
