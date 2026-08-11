<template>
  <div
    class="room-composition-renderer"
    :class="`room-composition-renderer--${mode}`"
    data-testid="room-composition-shadow-renderer"
    :data-room-id="model.roomId"
    :data-diagnostic-mode="mode"
    :data-theme-presentation="presentation ? 'theme' : 'core'"
    :data-active-theme-id="presentation?.activeThemeId"
    aria-hidden="true"
  >
    <svg
      class="room-composition-renderer__canvas"
      :viewBox="`0 0 ${model.width} ${model.height}`"
      preserveAspectRatio="xMidYMid meet"
      focusable="false"
    >
      <defs>
        <linearGradient id="shadow-room-background" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#07101a" />
          <stop offset="1" stop-color="#111923" />
        </linearGradient>
        <radialGradient id="shadow-room-ambient">
          <stop offset="0" stop-color="#62c8ea" stop-opacity="0.12" />
          <stop offset="1" stop-color="#62c8ea" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="shadow-room-foreground">
          <stop offset="58%" stop-color="#02040a" stop-opacity="0" />
          <stop offset="100%" stop-color="#02040a" stop-opacity="0.64" />
        </radialGradient>
      </defs>

      <g
        v-for="item in model.items"
        :key="`${item.kind}:${item.id}`"
        class="room-composition-renderer__item"
        :class="[
          `room-composition-renderer__item--${item.kind}`,
          item.kind === 'surface' ? `room-composition-renderer__surface--${item.role}` : null,
          item.kind === 'object' && item.functionContainer
            ? `room-composition-renderer__function--${item.functionContainer.definition.functionType}`
            : null,
        ]"
        :data-composition-id="item.id"
        :data-layer="item.layer"
        :data-depth="item.depth"
        :data-pointer-policy="item.kind === 'surface' ? item.pointerPolicy : 'none'"
        :data-core-fallback="item.kind === 'object' ? item.fallback : undefined"
        :data-theme-slot-id="visualFor(item.id)?.slotId"
        :data-theme-slot-source="effectiveVisualSource(item.id)"
        :data-theme-resource-fallback="usesResourceFallback(item.id) || undefined"
        :transform="item.kind === 'object' ? item.transform : undefined"
      >
        <RoomShadowShape
          :shape="item.shape"
          class="room-composition-renderer__visual"
          :style="themeMaterialStyle(item.id)"
        />
        <image
          v-if="renderableAssetUrl(item.id)"
          class="room-composition-renderer__theme-asset"
          v-bind="imageBox(item.shape)"
          :href="renderableAssetUrl(item.id) ?? undefined"
          :preserveAspectRatio="visualFor(item.id)?.preserveAspectRatio"
          :opacity="visualFor(item.id)?.assetOpacity"
          @error="markResourceFailed(visualFor(item.id)?.assetUrl)"
        />
        <image
          v-if="renderableTextureUrl(item.id)"
          class="room-composition-renderer__theme-texture"
          v-bind="imageBox(item.shape)"
          :href="renderableTextureUrl(item.id) ?? undefined"
          preserveAspectRatio="xMidYMid slice"
          :opacity="visualFor(item.id)?.materialOpacity ?? 1"
          @error="markResourceFailed(visualFor(item.id)?.textureUrl)"
        />
        <template v-if="mode === 'visual' && item.kind === 'object' && item.functionContainer">
          <text
            class="room-composition-renderer__function-label"
            :x="labelPosition(item.shape).x"
            :y="labelPosition(item.shape).y"
          >
            {{ item.functionContainer.definition.functionType }}
          </text>
        </template>
      </g>

      <g
        v-if="mode !== 'visual'"
        class="room-composition-renderer__diagnostic-layer"
        data-testid="shadow-interaction-layer"
      >
        <g
          v-for="target in interaction.targets"
          :key="target.containerInstanceId"
          class="room-composition-renderer__interaction-target"
          :class="{
            'room-composition-renderer__interaction-target--unavailable': !target.available,
          }"
          data-testid="shadow-interaction-target"
          :data-container-id="target.containerInstanceId"
          :data-function-role="target.functionRole"
          :data-binding-id="target.bindingId"
          :data-binding-target-id="target.bindingTargetId"
          :data-focus-order="target.focusOrder"
          :data-available="target.available"
        >
          <RoomShadowShape
            :shape="target.interactionBounds"
            class="room-composition-renderer__interaction-bounds"
          />
          <circle
            v-if="mode === 'focus'"
            class="room-composition-renderer__focus-marker"
            :cx="labelPosition(target.interactionBounds).x"
            :cy="labelPosition(target.interactionBounds).y - 24"
            r="17"
          />
          <text
            v-if="mode === 'focus'"
            class="room-composition-renderer__focus-number"
            :x="labelPosition(target.interactionBounds).x"
            :y="labelPosition(target.interactionBounds).y - 19"
          >
            {{ target.focusOrder }}
          </text>
          <text
            class="room-composition-renderer__interaction-label"
            :x="labelPosition(target.interactionBounds).x"
            :y="labelPosition(target.interactionBounds).y + (mode === 'focus' ? 12 : -4)"
          >
            {{ target.semanticLabel }}
          </text>
          <text
            class="room-composition-renderer__binding-label"
            :x="labelPosition(target.interactionBounds).x"
            :y="labelPosition(target.interactionBounds).y + (mode === 'focus' ? 31 : 15)"
          >
            {{ bindingLabel(target) }}
          </text>
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, type CSSProperties } from "vue";

import type { ImmutableRoomSnapshot } from "../../theme-engine/roomSnapshotResolver";
import type { BoundsShape, Point } from "../../theme-engine/types";
import RoomShadowShape from "./RoomShadowShape.vue";
import {
  projectRoomCompositionForShadowRender,
  type RoomCompositionThemePresentation,
  type RoomCompositionThemeVisual,
} from "./roomCompositionRenderProjection";
import type {
  RoomCompositionInteractionProjection,
  RoomShadowDiagnosticMode,
  RoomShadowInteractionTarget,
} from "./roomCompositionInteractionProjection";

const props = defineProps<{
  snapshot: Readonly<ImmutableRoomSnapshot>;
  interaction: Readonly<RoomCompositionInteractionProjection>;
  mode: RoomShadowDiagnosticMode;
  presentation?: Readonly<RoomCompositionThemePresentation>;
}>();

const model = computed(() => projectRoomCompositionForShadowRender(props.snapshot));
const themeVisuals = computed(
  () => new Map((props.presentation?.visuals ?? []).map((visual) => [visual.itemId, visual])),
);
const failedResourceUrls = ref(new Set<string>());

watch(
  () => props.presentation,
  () => {
    failedResourceUrls.value = new Set<string>();
  },
);

function visualFor(itemId: string): Readonly<RoomCompositionThemeVisual> | undefined {
  return themeVisuals.value.get(itemId);
}

function renderableAssetUrl(itemId: string): string | null {
  return renderableResourceUrl(visualFor(itemId)?.assetUrl);
}

function renderableTextureUrl(itemId: string): string | null {
  return renderableResourceUrl(visualFor(itemId)?.textureUrl);
}

function renderableResourceUrl(url: string | null | undefined): string | null {
  return url && !failedResourceUrls.value.has(url) ? url : null;
}

function markResourceFailed(url: string | null | undefined): void {
  if (url) failedResourceUrls.value.add(url);
}

function usesResourceFallback(itemId: string): boolean {
  const visual = visualFor(itemId);
  return Boolean(
    (visual?.assetUrl && failedResourceUrls.value.has(visual.assetUrl)) ||
    (visual?.textureUrl && failedResourceUrls.value.has(visual.textureUrl)),
  );
}

function effectiveVisualSource(
  itemId: string,
): RoomCompositionThemeVisual["source"] | undefined {
  const visual = visualFor(itemId);
  if (!visual) return undefined;
  return visual.assetUrl && failedResourceUrls.value.has(visual.assetUrl)
    ? "core-fallback"
    : visual.source;
}

function themeMaterialStyle(itemId: string): CSSProperties {
  const visual = visualFor(itemId);
  if (!visual) return {};
  return {
    ...(visual.fill ? { fill: visual.fill } : {}),
    ...(visual.stroke ? { stroke: visual.stroke } : {}),
    ...(visual.materialOpacity !== null ? { opacity: visual.materialOpacity } : {}),
  };
}

function imageBox(shape: BoundsShape): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (shape.type === "rect") {
    return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
  }
  if (shape.type === "ellipse") {
    return {
      x: shape.cx - shape.rx,
      y: shape.cy - shape.ry,
      width: shape.rx * 2,
      height: shape.ry * 2,
    };
  }
  const xs = shape.points.map((point) => point.x);
  const ys = shape.points.map((point) => point.y);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

function labelPosition(shape: BoundsShape): Point {
  if (shape.type === "rect") {
    return { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
  }
  if (shape.type === "ellipse") return { x: shape.cx, y: shape.cy };
  const x = shape.points.reduce((total, point) => total + point.x, 0) / shape.points.length;
  const y = shape.points.reduce((total, point) => total + point.y, 0) / shape.points.length;
  return { x, y };
}

function bindingLabel(target: Readonly<RoomShadowInteractionTarget>): string {
  return target.bindingTargetId
    ? `${target.bindingId} → ${target.bindingTargetId}`
    : `${target.bindingId} · unavailable`;
}
</script>

<style scoped>
.room-composition-renderer,
.room-composition-renderer * {
  pointer-events: none;
}

.room-composition-renderer {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--cosmos-color-border, rgba(181, 211, 225, 0.14));
  border-radius: var(--cosmos-radius-window, 10px);
  background: var(--cosmos-color-background, #02040a);
  box-shadow: var(--cosmos-window-shadow, 0 28px 90px rgba(0, 0, 0, 0.58));
}

.room-composition-renderer__canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.room-composition-renderer__item {
  pointer-events: none;
}

.room-composition-renderer__theme-asset,
.room-composition-renderer__theme-texture {
  pointer-events: none;
}

.room-composition-renderer__visual {
  stroke: rgba(185, 214, 228, 0.18);
  stroke-width: 2;
  fill: rgba(20, 31, 42, 0.92);
}

.room-composition-renderer__surface--background .room-composition-renderer__visual {
  fill: url(#shadow-room-background);
}

.room-composition-renderer__surface--architecture .room-composition-renderer__visual {
  fill: rgba(23, 35, 46, 0.88);
}

.room-composition-renderer__surface--floor .room-composition-renderer__visual {
  fill: rgba(29, 41, 51, 0.96);
}

.room-composition-renderer__surface--ceiling .room-composition-renderer__visual {
  fill: rgba(14, 23, 31, 0.96);
}

.room-composition-renderer__surface--ambient .room-composition-renderer__visual {
  fill: url(#shadow-room-ambient);
  stroke: rgba(98, 200, 234, 0.16);
}

.room-composition-renderer__surface--foreground .room-composition-renderer__visual {
  fill: url(#shadow-room-foreground);
  stroke: rgba(181, 211, 225, 0.08);
}

.room-composition-renderer__item--object .room-composition-renderer__visual {
  fill: rgba(36, 51, 64, 0.95);
  stroke: rgba(190, 224, 238, 0.34);
}

.room-composition-renderer--interaction .room-composition-renderer__item,
.room-composition-renderer--focus .room-composition-renderer__item {
  opacity: 0.42;
}

.room-composition-renderer__function--room-transition .room-composition-renderer__visual {
  fill: rgba(25, 39, 50, 0.98);
  stroke: rgba(217, 167, 101, 0.48);
}

.room-composition-renderer__function--knowledge-workspace .room-composition-renderer__visual,
.room-composition-renderer__function--creation-workspace .room-composition-renderer__visual {
  fill: rgba(24, 43, 56, 0.97);
  stroke: rgba(98, 200, 234, 0.42);
}

.room-composition-renderer__function--companion-interaction .room-composition-renderer__visual {
  fill: rgba(37, 48, 64, 0.98);
  stroke: rgba(168, 140, 231, 0.48);
}

.room-composition-renderer__diagnostic-layer,
.room-composition-renderer__interaction-target {
  pointer-events: none;
}

.room-composition-renderer__interaction-bounds {
  fill: transparent;
  stroke: rgba(98, 200, 234, 0.82);
  stroke-width: 3;
  stroke-dasharray: 12 8;
  vector-effect: non-scaling-stroke;
}

.room-composition-renderer--focus .room-composition-renderer__interaction-bounds {
  stroke: rgba(168, 140, 231, 0.88);
  stroke-dasharray: 5 7;
}

.room-composition-renderer__interaction-target--unavailable {
  opacity: 0.44;
}

.room-composition-renderer__focus-marker {
  fill: rgba(8, 14, 23, 0.96);
  stroke: rgba(229, 237, 242, 0.84);
  stroke-width: 2;
}

.room-composition-renderer__focus-number,
.room-composition-renderer__interaction-label,
.room-composition-renderer__binding-label {
  text-anchor: middle;
  paint-order: stroke;
  stroke: rgba(4, 8, 14, 0.94);
  stroke-width: 5px;
  stroke-linejoin: round;
}

.room-composition-renderer__focus-number {
  fill: #f2eee7;
  font-size: 14px;
  font-weight: 700;
}

.room-composition-renderer__interaction-label {
  fill: var(--cosmos-color-text, #e5edf2);
  font-size: 15px;
  letter-spacing: 0.04em;
}

.room-composition-renderer__binding-label {
  fill: var(--cosmos-color-muted, #83949f);
  font-size: 10px;
  letter-spacing: 0.03em;
}

.room-composition-renderer__function-label {
  fill: var(--cosmos-color-text, #e5edf2);
  font-size: 18px;
  letter-spacing: 0.08em;
  text-anchor: middle;
  text-transform: uppercase;
}
</style>
