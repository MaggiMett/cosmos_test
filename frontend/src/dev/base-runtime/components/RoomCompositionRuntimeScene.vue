<template>
  <section
    class="room-composition-runtime-scene"
    :class="{ 'room-composition-runtime-scene--background': backgroundOnly }"
    :aria-label="backgroundOnly ? undefined : `${roomName} Composition`"
    :aria-hidden="backgroundOnly ? 'true' : undefined"
    :inert="backgroundOnly || undefined"
    :data-room-id="snapshot.roomId"
    :data-theme-visuals="themePresentation ? 'theme' : 'core'"
    data-testid="room-composition-runtime-scene"
  >
    <RoomCompositionShadowRenderer
      :snapshot="snapshot"
      :interaction="interactions"
      :presentation="themePresentation"
      mode="visual"
    />

    <svg
      v-if="!backgroundOnly"
      class="room-composition-runtime-scene__interactions"
      :viewBox="`0 0 ${snapshot.shell.referenceViewport.width} ${snapshot.shell.referenceViewport.height}`"
      preserveAspectRatio="xMidYMid meet"
      role="group"
      :aria-label="`${roomName} interactions`"
      focusable="false"
      @contextmenu.prevent="openRoomContextMenu"
    >
      <foreignObject
        v-for="target in interactions.targets"
        :key="target.containerInstanceId"
        class="room-composition-runtime-scene__target-frame"
        v-bind="boundsBox(target.interactionBounds)"
      >
        <button
          xmlns="http://www.w3.org/1999/xhtml"
          type="button"
          class="room-composition-runtime-scene__target"
          :class="`room-composition-runtime-scene__target--${target.functionRole}`"
          :style="targetShapeStyle(target.interactionBounds)"
          :aria-label="target.semanticLabel"
          :aria-pressed="target.bindingKind === 'workspace' ? selectedObjectId === target.bindingId : undefined"
          :disabled="!target.available"
          :data-function-role="target.functionRole"
          :data-binding-id="target.bindingId"
          :data-binding-target-id="target.bindingTargetId"
          :data-focus-order="target.focusOrder"
          @click="$emit('activate', target)"
          @contextmenu.prevent.stop="openTargetContextMenu($event, target)"
        >
          <span>{{ target.semanticLabel }}</span>
        </button>
      </foreignObject>
    </svg>
  </section>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";

import type { ImmutableRoomSnapshot } from "../../../theme-engine";
import type { BoundsShape } from "../../../theme-engine/types";
import RoomCompositionShadowRenderer from "../../room-composition-preview/RoomCompositionShadowRenderer.vue";
import type {
  RoomCompositionInteractionProjection,
  RoomShadowInteractionTarget,
} from "../../room-composition-preview/roomCompositionInteractionProjection";
import type { RoomCompositionThemePresentation } from "../../room-composition-preview/roomCompositionRenderProjection";

const props = defineProps<{
  snapshot: Readonly<ImmutableRoomSnapshot>;
  interactions: Readonly<RoomCompositionInteractionProjection>;
  roomName: string;
  selectedObjectId: string | null;
  backgroundOnly: boolean;
  themePresentation?: Readonly<RoomCompositionThemePresentation>;
}>();

const emit = defineEmits<{
  activate: [target: Readonly<RoomShadowInteractionTarget>];
  "open-context-menu": [event: MouseEvent, objectId: string];
}>();

function boundsBox(shape: BoundsShape): {
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

function targetShapeStyle(shape: BoundsShape): CSSProperties {
  if (shape.type === "ellipse") return { borderRadius: "50%" };
  if (shape.type !== "polygon") return {};
  const box = boundsBox(shape);
  const points = shape.points.map((point) =>
    `${((point.x - box.x) / box.width) * 100}% ${((point.y - box.y) / box.height) * 100}%`,
  );
  return { clipPath: `polygon(${points.join(", ")})` };
}

function contextTarget(target: Readonly<RoomShadowInteractionTarget>): string {
  return target.bindingTargetId ?? target.bindingId;
}

function openTargetContextMenu(
  event: MouseEvent,
  target: Readonly<RoomShadowInteractionTarget>,
): void {
  if (target.bindingKind !== "workspace") return;
  emit("open-context-menu", event, contextTarget(target));
}

function openRoomContextMenu(event: MouseEvent): void {
  const base = props.interactions.targets.find(
    (target) => target.bindingKind === "base-exit",
  );
  const baseId = base?.bindingTargetId ?? base?.bindingId;
  if (baseId) emit("open-context-menu", event, baseId);
}
</script>

<style scoped>
.room-composition-runtime-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--cosmos-color-background, #02040a);
}

.room-composition-runtime-scene--background {
  pointer-events: none;
}

.room-composition-runtime-scene :deep(.room-composition-renderer) {
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.room-composition-runtime-scene :deep(.room-composition-renderer__function-label) {
  display: none;
}

.room-composition-runtime-scene__interactions {
  position: absolute;
  z-index: 18;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.room-composition-runtime-scene__target-frame {
  overflow: visible;
  pointer-events: none;
}

.room-composition-runtime-scene__target {
  display: grid;
  width: 100%;
  height: 100%;
  padding: 10px;
  place-items: center;
  border: 1px solid rgba(190, 224, 238, 0.16);
  background: rgba(7, 15, 23, 0.08);
  color: rgba(229, 237, 242, 0.76);
  cursor: pointer;
  font: inherit;
  pointer-events: auto;
}

.room-composition-runtime-scene__target span {
  padding: 4px 7px;
  border-radius: var(--cosmos-radius-control, 8px);
  background: rgba(4, 9, 15, 0.72);
  font-size: 0.66rem;
  letter-spacing: 0.04em;
  opacity: 0.72;
  transition: opacity 160ms ease;
}

.room-composition-runtime-scene__target:hover span,
.room-composition-runtime-scene__target:focus-visible span {
  opacity: 1;
}

.room-composition-runtime-scene__target:focus-visible {
  border-color: var(--cosmos-color-accent, #62c8ea);
  outline: 3px solid color-mix(in srgb, var(--cosmos-color-accent, #62c8ea) 72%, white);
  outline-offset: -4px;
  box-shadow: inset 0 0 28px rgba(98, 200, 234, 0.12);
}

.room-composition-runtime-scene__target[aria-pressed="true"] {
  border-color: rgba(98, 200, 234, 0.64);
  background: rgba(98, 200, 234, 0.08);
}

.room-composition-runtime-scene__target:disabled {
  border-color: rgba(148, 166, 176, 0.42);
  border-style: dashed;
  background:
    repeating-linear-gradient(
      135deg,
      rgba(148, 166, 176, 0.07) 0 9px,
      transparent 9px 19px
    ),
    rgba(4, 9, 15, 0.18);
  cursor: default;
  opacity: 0.72;
  pointer-events: none;
}

.room-composition-runtime-scene__target:disabled span {
  color: var(--cosmos-color-muted, #83949f);
  opacity: 1;
}

.room-composition-runtime-scene__target--room-transition {
  border-color: rgba(217, 167, 101, 0.28);
}

.room-composition-runtime-scene__target--companion-interaction {
  border-color: rgba(168, 140, 231, 0.32);
}

@media (prefers-reduced-motion: reduce) {
  .room-composition-runtime-scene__target span { transition: none; }
}
</style>
