import {
  runBaseRoomShadowMode,
  type BaseRuntimeSnapshotReadModel,
  type RoomShadowModeResult,
} from "../../theme-engine";
import {
  createRoomCompositionInteractionDiagnostics,
  type RoomCompositionInteractionDiagnostics,
} from "../room-composition-preview/roomCompositionInteractionProjection";
import { projectBaseRuntimeState } from "./baseRuntimeProjection";
import {
  compareBaseRoomVisualParity,
  type BaseRoomVisualParityResult,
} from "./baseRoomVisualParity";

export type BaseRoomCompositionFallbackReason =
  | "disabled"
  | "resolution-error"
  | "invalid-snapshot"
  | "blocking-room-parity"
  | "blocking-interaction-parity"
  | "blocking-visual-parity";

export type BaseRoomCompositionPresenterResult =
  | {
      status: "active";
      shadow: Readonly<RoomShadowModeResult>;
      interactions: Readonly<RoomCompositionInteractionDiagnostics>;
      visualParity: Readonly<BaseRoomVisualParityResult>;
    }
  | {
      status: "fallback";
      reason: BaseRoomCompositionFallbackReason;
    };

interface BaseRoomCompositionDependencies {
  runShadow?: typeof runBaseRoomShadowMode;
  createInteractionDiagnostics?: typeof createRoomCompositionInteractionDiagnostics;
  compareVisualParity?: typeof compareBaseRoomVisualParity;
}

/**
 * Narrow safety gate for the productive Composition renderer. It owns no Runtime
 * state and falls back before any Composition markup is mounted.
 */
export function resolveBaseRoomCompositionPresenter(
  enabled: boolean,
  baseSnapshot: BaseRuntimeSnapshotReadModel,
  roomId: string,
  dependencies: BaseRoomCompositionDependencies = {},
): Readonly<BaseRoomCompositionPresenterResult> {
  if (!enabled) return Object.freeze({ status: "fallback", reason: "disabled" });
  const runShadow = dependencies.runShadow ?? runBaseRoomShadowMode;
  const createDiagnostics =
    dependencies.createInteractionDiagnostics ??
    createRoomCompositionInteractionDiagnostics;
  try {
    const activeDocument = baseSnapshot.activeBuilder?.document;
    const activeRoom = activeDocument?.base.rooms.find((room) => room.roomId === roomId);
    const shadow = runShadow({
      baseSnapshot,
      roomId,
      ...(activeRoom ? { roomCompositionOverride: activeRoom } : {}),
    });
    if (!shadow.snapshot.validationStatus.valid) {
      return Object.freeze({ status: "fallback", reason: "invalid-snapshot" });
    }
    if (shadow.parity.status === "blocking-difference") {
      return Object.freeze({
        status: "fallback",
        reason: "blocking-room-parity",
      });
    }
    const interactions = createDiagnostics(
      baseSnapshot,
      shadow.snapshot,
      shadow.runtimeBindings ?? [],
      roomId,
    );
    if (interactions.parity.status === "blocking-difference") {
      return Object.freeze({
        status: "fallback",
        reason: "blocking-interaction-parity",
      });
    }
    const presenter = projectBaseRuntimeState("ready", baseSnapshot, null, roomId);
    if (presenter.phase !== "success") {
      return Object.freeze({ status: "fallback", reason: "resolution-error" });
    }
    const compareVisualParity = dependencies.compareVisualParity
      ?? compareBaseRoomVisualParity;
    const visualParity = compareVisualParity({
      room: presenter.room,
      snapshot: shadow.snapshot,
      interactions: interactions.actual,
    });
    if (visualParity.status === "blocking-difference") {
      return Object.freeze({
        status: "fallback",
        reason: "blocking-visual-parity",
      });
    }
    return Object.freeze({ status: "active", shadow, interactions, visualParity });
  } catch {
    return Object.freeze({ status: "fallback", reason: "resolution-error" });
  }
}
