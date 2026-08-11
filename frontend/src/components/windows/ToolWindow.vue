<template>
  <section
    class="tool-window"
    :class="{ 'tool-window--active': active }"
    role="dialog"
    :aria-label="title"
    :style="windowStyle"
    @pointerdown.stop="$emit('focus')"
  >
    <header class="tool-window__header" @pointerdown="startMove">
      <span>{{ title }}</span>
      <button type="button" aria-label="Close" title="Close" @pointerdown.stop @click="$emit('close')">
        <span aria-hidden="true">×</span>
      </button>
    </header>
    <div class="tool-window__content"><slot /></div>
    <button
      v-for="direction in resizeDirections"
      :key="direction"
      class="tool-window__resize"
      :class="`tool-window__resize--${direction}`"
      type="button"
      :aria-label="`Resize window ${direction}`"
      :title="`Resize ${direction}`"
      @pointerdown.stop="startResize($event, direction)"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount } from "vue";

import type { WindowBounds } from "../../runtime/windowRuntime";

const props = withDefaults(defineProps<{
  title: string;
  bounds: WindowBounds;
  minimumSize?: { width: number; height: number };
  focusOrder?: number;
  active?: boolean;
}>(), { focusOrder: 0, active: true });

const emit = defineEmits<{
  close: [];
  focus: [];
  move: [position: { x: number; y: number }];
  resize: [size: { width: number; height: number }];
}>();

let stopActivePointer: (() => void) | null = null;
type ResizeDirection = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
const resizeDirections: ResizeDirection[] = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];

const windowStyle = computed(() => ({
  left: `${props.bounds.x}px`,
  top: `${props.bounds.y}px`,
  width: `${props.bounds.width}px`,
  height: `${props.bounds.height}px`,
  zIndex: 40 + props.focusOrder,
}));

function startMove(event: PointerEvent) {
  if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
  event.preventDefault();
  const origin = { x: event.clientX, y: event.clientY, left: props.bounds.x, top: props.bounds.y };
  trackPointer((moveEvent) => {
    emit("move", {
      x: clamp(origin.left + moveEvent.clientX - origin.x, 0, window.innerWidth - props.bounds.width),
      y: clamp(origin.top + moveEvent.clientY - origin.y, 0, window.innerHeight - 80),
    });
  });
}

function startResize(event: PointerEvent, direction: ResizeDirection) {
  if (event.button !== 0) return;
  event.preventDefault();
  const minimum = props.minimumSize ?? { width: 320, height: 240 };
  const origin = {
    x: event.clientX,
    y: event.clientY,
    width: props.bounds.width,
    height: props.bounds.height,
    left: props.bounds.x,
    top: props.bounds.y,
  };
  trackPointer((moveEvent) => {
    const deltaX = moveEvent.clientX - origin.x;
    const deltaY = moveEvent.clientY - origin.y;
    const west = direction.includes("w");
    const east = direction.includes("e");
    const north = direction.includes("n");
    const south = direction.includes("s");
    const width = west
      ? clamp(origin.width - deltaX, minimum.width, origin.left + origin.width)
      : east
        ? clamp(origin.width + deltaX, minimum.width, window.innerWidth - origin.left)
        : origin.width;
    const height = north
      ? clamp(origin.height - deltaY, minimum.height, origin.top + origin.height)
      : south
        ? clamp(origin.height + deltaY, minimum.height, window.innerHeight - origin.top)
        : origin.height;
    if (west || north) {
      emit("move", {
        x: west ? origin.left + origin.width - width : origin.left,
        y: north ? origin.top + origin.height - height : origin.top,
      });
    }
    emit("resize", {
      width,
      height,
    });
  });
}

function trackPointer(move: (event: PointerEvent) => void) {
  stopActivePointer?.();
  const stop = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
    window.removeEventListener("pointercancel", stop);
    if (stopActivePointer === stop) stopActivePointer = null;
  };
  stopActivePointer = stop;
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop, { once: true });
  window.addEventListener("pointercancel", stop, { once: true });
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

onBeforeUnmount(() => stopActivePointer?.());
</script>

<style scoped>
.tool-window {
  position: fixed;
  z-index: 40;
  display: flex;
  min-width: 320px;
  min-height: 240px;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(165, 196, 211, 0.2);
  border-radius: var(--cosmos-radius-window, 10px);
  background: linear-gradient(145deg, rgba(8, 15, 23, 0.96), rgba(4, 9, 15, 0.94));
  box-shadow: var(--cosmos-window-shadow), inset 0 1px rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(var(--cosmos-surface-blur, 18px));
  opacity: 0.94;
  transition: border-color var(--cosmos-transition-duration) ease, box-shadow var(--cosmos-transition-duration) ease, opacity var(--cosmos-transition-duration) ease;
}

.tool-window--active {
  border-color: rgba(119, 193, 222, 0.38);
  box-shadow: var(--cosmos-window-shadow-active), 0 0 24px rgba(59, 166, 207, 0.07), inset 0 1px rgba(255, 255, 255, 0.055);
  opacity: 1;
}

.tool-window__header {
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  padding: 0 9px 0 14px;
  border-bottom: 1px solid rgba(181, 211, 225, 0.09);
  background: linear-gradient(180deg, rgba(25, 38, 49, 0.54), rgba(10, 18, 26, 0.36));
  color: var(--cosmos-color-text, #e5edf2);
  font-size: 0.7rem;
  font-weight: 560;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: move;
  user-select: none;
}

.tool-window__header button {
  display: grid;
  width: 27px;
  height: 27px;
  padding: 0;
  place-items: center;
  border: 1px solid rgba(181, 211, 225, 0.13);
  border-radius: 4px;
  background: rgba(202, 230, 240, 0.025);
  cursor: pointer;
}

.tool-window__header button:hover,
.tool-window__header button:focus-visible {
  border-color: rgba(201, 123, 123, 0.45);
  background: rgba(125, 58, 58, 0.28);
  outline: none;
}

.tool-window__content {
  min-height: 0;
  flex: 1;
}

.tool-window__resize {
  position: absolute;
  padding: 0;
  border: 0;
  background: transparent;
}

.tool-window__resize--n, .tool-window__resize--s { right: 18px; left: 18px; height: 8px; }
.tool-window__resize--n { top: 0; cursor: ns-resize; }
.tool-window__resize--s { bottom: 0; cursor: ns-resize; }
.tool-window__resize--e, .tool-window__resize--w { top: 18px; bottom: 18px; width: 8px; }
.tool-window__resize--e { right: 0; cursor: ew-resize; }
.tool-window__resize--w { left: 0; cursor: ew-resize; }
.tool-window__resize--ne, .tool-window__resize--se, .tool-window__resize--sw, .tool-window__resize--nw { width: 16px; height: 16px; }
.tool-window__resize--ne { top: 0; right: 0; cursor: nesw-resize; }
.tool-window__resize--se { right: 0; bottom: 0; cursor: nwse-resize; background: linear-gradient(135deg, transparent 49%, rgba(114, 183, 210, 0.48) 50% 55%, transparent 56% 67%, rgba(114, 183, 210, 0.3) 68% 73%, transparent 74%); }
.tool-window__resize--sw { bottom: 0; left: 0; cursor: nesw-resize; }
.tool-window__resize--nw { top: 0; left: 0; cursor: nwse-resize; }
</style>
