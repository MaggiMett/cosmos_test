import {
  adaptBaseMainRoomV1,
  type BaseRoomCompatibilityAdapterInput,
} from "./baseRoomCompatibilityAdapter";
import {
  compareBaseRuntimeRoomShadowProjection,
  projectBaseRoomToRoomCompositionShadow,
  projectBaseMainRoomToRoomCompositionShadow,
  type BaseRuntimeRoomReference,
  type BaseRuntimeSnapshotReadModel,
  type BaseRuntimeShadowBinding,
} from "./baseRuntimeRoomShadowProjection";
import { cloneAndFreeze } from "./immutable";
import {
  compareLegacyBaseToRoomSnapshot,
  type RoomParityResult,
} from "./roomParity";
import {
  createRoomCompositionRegistries,
  type RoomCompositionRegistries,
} from "./roomRegistries";
import {
  RoomCompositionResolver,
  type ImmutableRoomSnapshot,
  type RoomSkinResolutionInput,
} from "./roomSnapshotResolver";
import type { BaseComposition, RoomComposition } from "./roomCompositionTypes";

export interface RunBaseRoomShadowModeInput {
  compatibilityInput?: BaseRoomCompatibilityAdapterInput;
  skins?: RoomSkinResolutionInput;
  baseSnapshot?: BaseRuntimeSnapshotReadModel;
  roomId?: string;
  roomCompositionOverride?: Readonly<RoomComposition>;
}

export interface RoomShadowModeResult {
  mode: "shadow";
  authoritativeRuntime: "compatibility-fixture" | "base-runtime";
  snapshot: Readonly<ImmutableRoomSnapshot>;
  parity: Readonly<RoomParityResult>;
  diagnostics: readonly string[];
  runtimeReference?: Readonly<BaseRuntimeRoomReference>;
  runtimeBindings?: readonly Readonly<BaseRuntimeShadowBinding>[];
}

export function runBaseMainRoomShadowMode(
  input: RunBaseRoomShadowModeInput = {},
): Readonly<RoomShadowModeResult> {
  return runBaseRoomShadowMode(input);
}

export function runBaseRoomShadowMode(
  input: RunBaseRoomShadowModeInput = {},
): Readonly<RoomShadowModeResult> {
  if (input.baseSnapshot && input.compatibilityInput) {
    throw new Error(
      "Base Runtime and compatibility fixture inputs cannot be combined in one Shadow run",
    );
  }
  const runtimeProjection = input.baseSnapshot
    ? input.roomId
      ? projectBaseRoomToRoomCompositionShadow(input.baseSnapshot, input.roomId)
      : projectBaseMainRoomToRoomCompositionShadow(input.baseSnapshot)
    : null;
  const projectedLegacy =
    runtimeProjection?.compatibility ?? adaptBaseMainRoomV1(input.compatibilityInput);
  const legacy = input.roomCompositionOverride
    ? { ...projectedLegacy, roomComposition: cloneAndFreeze(input.roomCompositionOverride) }
    : projectedLegacy;
  const registries = createRoomCompositionRegistries();
  registerCompatibilityProjection(
    registries,
    legacy,
    runtimeProjection?.source.baseObjectId,
  );
  const resolver = new RoomCompositionResolver(registries);
  const snapshot = resolver.resolve({
    roomComposition: legacy.roomComposition,
    presetRef: {
      id: legacy.preset.presetId,
      versionRange: legacy.preset.version,
    },
    skins: input.skins ?? compatibilitySkinResolution(legacy),
  });
  const structuralParity = compareLegacyBaseToRoomSnapshot(legacy, snapshot);
  const parity = runtimeProjection
    ? compareBaseRuntimeRoomShadowProjection(
        runtimeProjection,
        snapshot,
        structuralParity,
      )
    : structuralParity;
  const diagnostics = [
    ...snapshot.validationStatus.warnings.map(
      (warning) => `snapshot-warning: ${warning}`,
    ),
    ...snapshot.validationStatus.conflicts.map(
      (conflict) => `snapshot-conflict: ${conflict}`,
    ),
    ...parity.differences.map(
      (difference) => `${difference.severity}: ${difference.message}`,
    ),
  ].sort(compareText);
  return cloneAndFreeze({
    mode: "shadow" as const,
    authoritativeRuntime: runtimeProjection
      ? ("base-runtime" as const)
      : ("compatibility-fixture" as const),
    snapshot,
    parity,
    diagnostics,
    ...(runtimeProjection
      ? {
          runtimeReference: runtimeProjection.source,
          runtimeBindings: runtimeProjection.runtimeBindings,
        }
      : {}),
  });
}

function registerCompatibilityProjection(
  registries: RoomCompositionRegistries,
  legacy: ReturnType<typeof adaptBaseMainRoomV1>,
  baseId = "core.base.shadow-compatibility",
): void {
  registries.shells.register(legacy.shell);
  registries.presets.register(legacy.preset);
  registries.catalogObjects.registerMany(legacy.catalogObjects);
  registries.functionContainers.registerMany(legacy.functionContainers);
  const base: BaseComposition = {
    schemaVersion: 1,
    baseId,
    version: "1.0.0",
    rooms: [legacy.roomComposition],
    connections: [],
    entryRoomId: legacy.roomComposition.roomId,
    presentationOverrides: [],
    revision: { revisionId: "shadow-read-only" },
  };
  registries.baseCompositions.register(base);
}

function compatibilitySkinResolution(
  legacy: ReturnType<typeof adaptBaseMainRoomV1>,
): RoomSkinResolutionInput {
  const coreSkins = new Map<string, { skinId: string; version: string }>();
  for (const object of legacy.catalogObjects) {
    const reference = object.skinCompatibility.coreFallbackSkinRef;
    coreSkins.set(reference.id, {
      skinId: reference.id,
      version: "1.0.0",
    });
  }
  return {
    availableSkins: [...coreSkins.values()].sort((left, right) =>
      compareText(left.skinId, right.skinId),
    ),
    assignments: [],
  };
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
