import type { BoundsShape, LayerBand } from "../../theme-engine/types";
import type {
  ImmutableRoomSnapshot,
  ResolvedRoomFunctionContainer,
  ResolvedRoomObjectInstance,
} from "../../theme-engine/roomSnapshotResolver";
import type { SurfaceDefinition } from "../../theme-engine/roomCompositionTypes";

export type RoomShadowSurfaceRole =
  | "background"
  | "architecture"
  | "floor"
  | "ceiling"
  | "ambient"
  | "foreground";

interface RoomShadowRenderItemBase {
  id: string;
  layer: string;
  depth: number;
  order: number;
}

export interface RoomShadowSurfaceItem extends RoomShadowRenderItemBase {
  kind: "surface";
  role: RoomShadowSurfaceRole;
  shape: BoundsShape;
  pointerPolicy: "passive";
}

export interface RoomShadowObjectItem extends RoomShadowRenderItemBase {
  kind: "object";
  shape: BoundsShape;
  transform: string;
  functionContainer: Readonly<ResolvedRoomFunctionContainer> | null;
  interactionShape: BoundsShape | null;
  fallback: boolean;
}

export type RoomShadowRenderItem = RoomShadowSurfaceItem | RoomShadowObjectItem;

export interface RoomCompositionThemeVisual {
  readonly itemId: string;
  readonly slotId: string;
  readonly source: "active-theme" | "core-fallback";
  readonly assetUrl: string | null;
  readonly textureUrl: string | null;
  readonly preserveAspectRatio: string;
  readonly assetOpacity: number;
  readonly fill: string | null;
  readonly stroke: string | null;
  readonly materialOpacity: number | null;
}

export interface RoomCompositionThemePresentation {
  readonly activeThemeId: string;
  readonly skinId: string;
  readonly visuals: readonly Readonly<RoomCompositionThemeVisual>[];
  readonly resolvedThemeSlotCount: number;
  readonly coreFallbackSlotCount: number;
}

export interface RoomCompositionShadowRenderModel {
  roomId: string;
  width: number;
  height: number;
  items: readonly Readonly<RoomShadowRenderItem>[];
  surfaceCount: number;
  functionContainerCount: number;
  usesCoreFallback: boolean;
}

/** Pure renderer boundary: resolved snapshot in, deterministic draw records out. */
export function projectRoomCompositionForShadowRender(
  snapshot: Readonly<ImmutableRoomSnapshot>,
): Readonly<RoomCompositionShadowRenderModel> {
  const layerOrder = new Map(
    snapshot.layers.map((layer) => [layer.bandId, layer.minimum]),
  );
  const functionByObject = new Map(
    snapshot.functionContainers.map((container) => [
      container.attachedObjectInstanceId,
      container,
    ]),
  );
  const items: RoomShadowRenderItem[] = [
    ...snapshot.surfaces.map((surface) =>
      surfaceItem(surface, layerOrder),
    ),
    ...snapshot.objectInstances.map((object) =>
      objectItem(object, functionByObject.get(object.instanceId) ?? null, layerOrder),
    ),
  ];
  items.sort(
    (left, right) =>
      left.order - right.order ||
      left.depth - right.depth ||
      kindOrder(left.kind) - kindOrder(right.kind) ||
      compareText(left.id, right.id),
  );
  return Object.freeze({
    roomId: snapshot.roomId,
    width: snapshot.shell.referenceViewport.width,
    height: snapshot.shell.referenceViewport.height,
    items: Object.freeze(items.map((item) => Object.freeze(item))),
    surfaceCount: snapshot.surfaces.length,
    functionContainerCount: snapshot.functionContainers.length,
    usesCoreFallback: snapshot.objectInstances.some(
      (object) =>
        object.propertyResolution.skin.source === "core-default" ||
        object.propertyResolution.skin.fallback,
    ),
  });
}

function surfaceItem(
  surface: Readonly<SurfaceDefinition>,
  layers: ReadonlyMap<string, number>,
): RoomShadowSurfaceItem {
  return {
    kind: "surface",
    id: surface.surfaceId,
    role: surfaceRole(surface),
    shape: surface.geometry,
    pointerPolicy: surface.pointerPolicy,
    layer: surface.layerBandId,
    depth: surface.depth,
    order: layerMinimum(layers, surface.layerBandId),
  };
}

function objectItem(
  object: Readonly<ResolvedRoomObjectInstance>,
  functionContainer: Readonly<ResolvedRoomFunctionContainer> | null,
  layers: ReadonlyMap<string, number>,
): RoomShadowObjectItem {
  return {
    kind: "object",
    id: object.instanceId,
    shape: object.catalogObject.defaultBounds.visual,
    transform: objectTransform(object),
    functionContainer,
    interactionShape: functionContainer?.definition.interactionBounds ?? null,
    fallback:
      object.propertyResolution.skin.source === "core-default" ||
      object.propertyResolution.skin.fallback,
    layer: object.layer,
    depth: object.depth,
    order: layerMinimum(layers, object.layer),
  };
}

function surfaceRole(surface: Readonly<SurfaceDefinition>): RoomShadowSurfaceRole {
  if (surface.layerBandId === "foreground") return "foreground";
  if (surface.layerBandId.startsWith("ambient")) return "ambient";
  if (surface.layerBandId === "background") return "background";
  if (surface.surfaceKind === "floor") return "floor";
  if (surface.surfaceKind === "ceiling") return "ceiling";
  return "architecture";
}

function objectTransform(object: Readonly<ResolvedRoomObjectInstance>): string {
  return [
    `translate(${object.position.x} ${object.position.y})`,
    `rotate(${object.rotation})`,
    `scale(${object.scale.x} ${object.scale.y})`,
  ].join(" ");
}

function layerMinimum(
  layers: ReadonlyMap<string, number>,
  layerId: string,
): number {
  return layers.get(layerId) ?? Number.MAX_SAFE_INTEGER;
}

function kindOrder(kind: RoomShadowRenderItem["kind"]): number {
  return kind === "surface" ? 0 : 1;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function orderedLayerIds(
  layers: readonly Readonly<LayerBand>[],
): readonly string[] {
  return [...layers]
    .sort(
      (left, right) =>
        left.minimum - right.minimum || compareText(left.bandId, right.bandId),
    )
    .map((layer) => layer.bandId);
}
