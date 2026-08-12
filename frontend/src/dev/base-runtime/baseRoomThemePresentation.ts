import {
  loadActiveThemePresentationSnapshot,
  type ActiveThemePresentationSnapshot,
  type ResolvedPresentationBinding,
  type ResolvedPresentationMaterial,
  type ResolvedPresentationSkin,
} from "../../runtime/activeThemePresentationSnapshot";
import type { AssetCatalogApi } from "../../runtime/assetCatalogApi";
import type { ThemePackagePresentationSource } from "../../runtime/themePackageRegistry";
import type { ThemeRuntime } from "../../runtime/themeRuntime";
import { cloneAndFreeze } from "../../theme-engine/immutable";
import { BASE_MAIN_ROOM_TEMPLATE_ID, baseMainRoomTemplate } from "../../theme-engine/baseTemplate";
import type { ImmutableRoomSnapshot } from "../../theme-engine/roomSnapshotResolver";
import type { RoomParityStatus } from "../../theme-engine/roomParity";
import type {
  RoomCompositionThemePresentation,
  RoomCompositionThemeVisual,
} from "../room-composition-preview/roomCompositionRenderProjection";

export type BaseThemeVisuals = "core" | "theme";

export type BaseRoomThemeFallbackReason =
  | "disabled"
  | "loading"
  | "presentation-error"
  | "stale-snapshot"
  | "invalid-room-snapshot"
  | "blocking-room-parity"
  | "blocking-interaction-parity"
  | "blocking-visual-parity"
  | "presentation-unavailable"
  | "skin-unavailable"
  | "material-unavailable"
  | "resource-url-unavailable"
  | "fallback-incomplete";

export type BaseRoomThemePresentationResult =
  | Readonly<{
      status: "active";
      presentation: Readonly<RoomCompositionThemePresentation>;
    }>
  | Readonly<{
      status: "core";
      reason: BaseRoomThemeFallbackReason;
    }>;

export interface BaseRoomThemeParityGate {
  readonly room: RoomParityStatus;
  readonly interaction: RoomParityStatus;
  readonly visual: RoomParityStatus;
}

interface ResolveBaseRoomThemePresentationInput {
  readonly mode: BaseThemeVisuals;
  readonly activeThemeId: string | null;
  readonly presentationSnapshot: Readonly<ActiveThemePresentationSnapshot>;
  readonly roomSnapshot: Readonly<ImmutableRoomSnapshot>;
  readonly parity: Readonly<BaseRoomThemeParityGate>;
  readonly resolveResourceUrl: (
    reference: NonNullable<ActiveThemePresentationSnapshot["assets"][number]["reference"]>,
  ) => string | null;
}

interface LoadBaseRoomThemePresentationInput {
  readonly mode: BaseThemeVisuals;
  readonly themeRuntime: Pick<ThemeRuntime, "active" | "readSnapshot">;
  readonly skinPackSource: Pick<ThemePackagePresentationSource, "readPresentationSkinPacks">;
  readonly assetCatalog: Pick<AssetCatalogApi, "list">;
  readonly roomSnapshot: Readonly<ImmutableRoomSnapshot>;
  readonly parity: Readonly<BaseRoomThemeParityGate>;
  readonly resolveResourceUrl: ResolveBaseRoomThemePresentationInput["resolveResourceUrl"];
}

interface SlotTarget {
  readonly itemId: string;
  readonly slotId: string;
  readonly required: boolean;
}

interface MaterialProjection {
  readonly fill: string | null;
  readonly stroke: string | null;
  readonly opacity: number | null;
  readonly textureUrl: string | null;
}

export function coreBaseRoomThemePresentation(
  reason: BaseRoomThemeFallbackReason,
): Readonly<BaseRoomThemePresentationResult> {
  return Object.freeze({ status: "core", reason });
}

/**
 * Async read boundary. Theme/Package/Catalog resolution completes before the
 * Room renderer receives any presentation data.
 */
export async function loadBaseRoomThemePresentation(
  input: Readonly<LoadBaseRoomThemePresentationInput>,
): Promise<Readonly<BaseRoomThemePresentationResult>> {
  if (input.mode !== "theme") return coreBaseRoomThemePresentation("disabled");
  const requestedThemeId = input.themeRuntime.readSnapshot().activeThemeId;
  try {
    const presentationSnapshot = await loadActiveThemePresentationSnapshot({
      themeRuntime: input.themeRuntime,
      assetCatalog: input.assetCatalog,
      skinPackSource: input.skinPackSource,
    });
    const activeThemeId = input.themeRuntime.readSnapshot().activeThemeId;
    if (requestedThemeId !== activeThemeId) {
      return coreBaseRoomThemePresentation("stale-snapshot");
    }
    return resolveBaseRoomThemePresentation({
      mode: input.mode,
      activeThemeId,
      presentationSnapshot,
      roomSnapshot: input.roomSnapshot,
      parity: input.parity,
      resolveResourceUrl: input.resolveResourceUrl,
    });
  } catch {
    return coreBaseRoomThemePresentation("presentation-error");
  }
}

/** Pure adapter: resolved presentation + resolved Room snapshot in, draw data out. */
export function resolveBaseRoomThemePresentation(
  input: Readonly<ResolveBaseRoomThemePresentationInput>,
): Readonly<BaseRoomThemePresentationResult> {
  if (input.mode !== "theme") return coreBaseRoomThemePresentation("disabled");
  if (!input.roomSnapshot.validationStatus.valid) {
    return coreBaseRoomThemePresentation("invalid-room-snapshot");
  }
  if (input.parity.room === "blocking-difference") {
    return coreBaseRoomThemePresentation("blocking-room-parity");
  }
  if (input.parity.interaction === "blocking-difference") {
    return coreBaseRoomThemePresentation("blocking-interaction-parity");
  }
  if (input.parity.visual === "blocking-difference") {
    return coreBaseRoomThemePresentation("blocking-visual-parity");
  }
  if (
    !input.activeThemeId ||
    input.presentationSnapshot.activeThemeId !== input.activeThemeId
  ) {
    return coreBaseRoomThemePresentation("stale-snapshot");
  }
  if (
    input.presentationSnapshot.resolutionStatus === "unavailable" ||
    input.presentationSnapshot.resolutionStatus === "partial"
  ) {
    return coreBaseRoomThemePresentation("presentation-unavailable");
  }

  const skin = selectRoomSkin(input.presentationSnapshot.skins);
  if (!skin || skin.status !== "resolved") {
    return coreBaseRoomThemePresentation("skin-unavailable");
  }
  const material = projectMaterial(
    skin,
    input.presentationSnapshot.materials,
    input.resolveResourceUrl,
  );
  if (material === null) {
    return coreBaseRoomThemePresentation("material-unavailable");
  }

  const targets = roomSlotTargets(input.roomSnapshot);
  const activeBindings = defaultBindings(skin);
  const coreSkin = input.presentationSnapshot.skins.find(
    (candidate) =>
      candidate.source === "core-fallback" &&
      candidate.templateId === BASE_MAIN_ROOM_TEMPLATE_ID &&
      candidate.status === "resolved",
  );
  const visuals: RoomCompositionThemeVisual[] = [];

  for (const target of targets) {
    const binding = activeBindings.find((candidate) => candidate.slotId === target.slotId);
    const activeVisual = binding
      ? projectBindingVisual(
          target,
          binding,
          skin.source,
          input.presentationSnapshot,
          material,
          input.resolveResourceUrl,
        )
      : null;
    if (activeVisual?.kind === "error") {
      return coreBaseRoomThemePresentation("resource-url-unavailable");
    }
    if (activeVisual?.kind === "visual") {
      visuals.push(activeVisual.visual);
      continue;
    }

    const fallbackBinding = coreSkin?.bindings.find(
      (candidate) => candidate.slotId === target.slotId,
    );
    const fallbackAsset = fallbackBinding
      ? input.presentationSnapshot.assets.find(
          (asset) => asset.requestId === fallbackBinding.assetRequestId,
        )
      : null;
    if (target.required && (!fallbackBinding || !fallbackAsset?.reference)) {
      return coreBaseRoomThemePresentation("fallback-incomplete");
    }
    visuals.push({
      itemId: target.itemId,
      slotId: target.slotId,
      source: "core-fallback",
      assetUrl: null,
      textureUrl: skin.source === "active-theme" ? material.textureUrl : null,
      preserveAspectRatio: "xMidYMid meet",
      assetOpacity: 1,
      fill: skin.source === "active-theme" ? material.fill : null,
      stroke: skin.source === "active-theme" ? material.stroke : null,
      materialOpacity: skin.source === "active-theme" ? material.opacity : null,
    });
  }

  visuals.sort((left, right) => compareText(left.itemId, right.itemId));
  return cloneAndFreeze({
    status: "active" as const,
    presentation: {
      activeThemeId: input.activeThemeId,
      skinId: skin.skinId,
      visuals,
      resolvedThemeSlotCount: visuals.filter(
        (visual) => visual.source === "active-theme",
      ).length,
      coreFallbackSlotCount: visuals.filter(
        (visual) => visual.source === "core-fallback",
      ).length,
    },
  });
}

function selectRoomSkin(
  skins: readonly Readonly<ResolvedPresentationSkin>[],
): Readonly<ResolvedPresentationSkin> | null {
  const compatible = skins.filter(
    (skin) =>
      skin.templateId === BASE_MAIN_ROOM_TEMPLATE_ID &&
      (skin.presentationGroup === "base-interior" || skin.presentationGroup === "room"),
  );
  return (
    compatible.find((skin) => skin.source === "active-theme") ??
    compatible.find((skin) => skin.source === "core-fallback") ??
    null
  );
}

function defaultBindings(
  skin: Readonly<ResolvedPresentationSkin>,
): readonly Readonly<ResolvedPresentationBinding>[] {
  const state = skin.states.find((candidate) => candidate.stateId === "default");
  const activeIds = new Set(state?.assetBindingIds ?? skin.bindings.map((binding) => binding.bindingId));
  return skin.bindings.filter(
    (binding) =>
      activeIds.has(binding.bindingId) &&
      (binding.states.length === 0 || binding.states.includes("default")),
  );
}

function roomSlotTargets(snapshot: Readonly<ImmutableRoomSnapshot>): readonly SlotTarget[] {
  const templateSurfaces = new Map<string, (typeof baseMainRoomTemplate.surfaces)[number]>(
    baseMainRoomTemplate.surfaces.map((surface) => [surface.surfaceId, surface]),
  );
  return [
    ...snapshot.surfaces.flatMap((surface) => {
      const templateSurface = templateSurfaces.get(surface.surfaceId);
      return templateSurface
        ? [{ itemId: surface.surfaceId, slotId: templateSurface.assetSlotId, required: true }]
        : [];
    }),
    ...snapshot.objectInstances.flatMap((object) =>
      object.catalogObject.visualSlots.map((slot) => ({
        itemId: object.instanceId,
        slotId: slot.slotId,
        required: slot.required,
      })),
    ),
  ].sort((left, right) => compareText(left.itemId, right.itemId));
}

function projectBindingVisual(
  target: Readonly<SlotTarget>,
  binding: Readonly<ResolvedPresentationBinding>,
  skinSource: ResolvedPresentationSkin["source"],
  snapshot: Readonly<ActiveThemePresentationSnapshot>,
  material: Readonly<MaterialProjection>,
  resolveResourceUrl: ResolveBaseRoomThemePresentationInput["resolveResourceUrl"],
):
  | Readonly<{ kind: "visual"; visual: Readonly<RoomCompositionThemeVisual> }>
  | Readonly<{ kind: "fallback" }>
  | Readonly<{ kind: "error" }> {
  const asset = snapshot.assets.find(
    (candidate) => candidate.requestId === binding.assetRequestId,
  );
  if (!asset?.reference || asset.status === "unavailable" || asset.status === "invalid") {
    return Object.freeze({ kind: "fallback" });
  }
  if (asset.source === "core-fallback" || asset.reference.version === null) {
    return Object.freeze({ kind: "fallback" });
  }
  const assetUrl = resolveResourceUrl(asset.reference);
  if (!assetUrl) return Object.freeze({ kind: "error" });
  return Object.freeze({
    kind: "visual",
    visual: Object.freeze({
      itemId: target.itemId,
      slotId: target.slotId,
      source: skinSource,
      assetUrl,
      textureUrl: material.textureUrl,
      preserveAspectRatio: preserveAspectRatio(binding.fit, binding.alignment),
      assetOpacity: binding.opacity,
      fill: material.fill,
      stroke: material.stroke,
      materialOpacity: material.opacity,
    }),
  });
}

function projectMaterial(
  skin: Readonly<ResolvedPresentationSkin>,
  materials: readonly Readonly<ResolvedPresentationMaterial>[],
  resolveResourceUrl: ResolveBaseRoomThemePresentationInput["resolveResourceUrl"],
): Readonly<MaterialProjection> | null {
  const relevant = materials.filter((material) => material.skinId === skin.skinId);
  if (relevant.some((material) => material.status !== "resolved")) return null;
  const material = relevant.find(
    (candidate) => candidate.channelId === "core.material.dom-surface",
  );
  let fill: string | null = null;
  let stroke: string | null = null;
  let opacity: number | null = null;
  let textureUrl: string | null = null;
  for (const parameter of material?.parameters ?? []) {
    if (parameter.parameterId === "core.material.fill" && parameter.kind === "color") {
      fill = parameter.value;
    } else if (
      parameter.parameterId === "core.material.stroke" &&
      parameter.kind === "color"
    ) {
      stroke = parameter.value;
    } else if (
      parameter.parameterId === "core.material.opacity" &&
      parameter.kind === "number"
    ) {
      opacity = parameter.value;
    } else if (
      parameter.parameterId === "core.material.texture-ref" &&
      parameter.kind === "asset-reference"
    ) {
      textureUrl = resolveResourceUrl(parameter.value as Parameters<typeof resolveResourceUrl>[0]);
      if (!textureUrl) return null;
    }
  }
  return Object.freeze({ fill, stroke, opacity, textureUrl });
}

function preserveAspectRatio(
  fit: ResolvedPresentationBinding["fit"],
  alignment: ResolvedPresentationBinding["alignment"],
): string {
  if (fit === "fill") return "none";
  const alignments: Record<ResolvedPresentationBinding["alignment"], string> = {
    center: "xMidYMid",
    top: "xMidYMin",
    right: "xMaxYMid",
    bottom: "xMidYMax",
    left: "xMinYMid",
    "top-left": "xMinYMin",
    "top-right": "xMaxYMin",
    "bottom-left": "xMinYMax",
    "bottom-right": "xMaxYMax",
  };
  return `${alignments[alignment]} ${fit === "cover" ? "slice" : "meet"}`;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
