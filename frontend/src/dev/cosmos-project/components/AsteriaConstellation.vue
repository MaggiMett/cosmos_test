<template>
  <section
    class="project-constellation"
    :style="project.style"
    :aria-label="`${project.displayName} project constellation`"
    data-testid="project-constellation"
  >
    <div class="project-constellation__nebula" aria-hidden="true" />

    <svg
      class="project-connections"
      aria-label="Project connections"
    >
      <path
        v-for="connection in project.connections"
        :key="connection.objectId"
        class="project-connection"
        :class="`project-connection--${connection.provenance}`"
        :d="connection.path"
        :data-connection-id="connection.objectId"
      />
    </svg>

    <button
      type="button"
      class="project-node project-node--core"
      :class="{
        'project-node--focused': project.isFocused,
        'project-node--selected': project.isCoreSelected,
      }"
      :aria-label="coreLabel"
      :aria-pressed="project.isCoreSelected"
      :data-node-id="project.objectId"
      @click="$emit('select-node', project.objectId)"
      @dblclick.stop="$emit('open-node', project.objectId)"
      @contextmenu.prevent.stop="$emit('open-node-menu', $event, project.objectId)"
    >
      <span v-if="project.isFocused || project.isCoreSelected" class="project-node__focus-ring" aria-hidden="true" />
      <i aria-hidden="true" />
      <strong>{{ project.displayName }}</strong>
    </button>

    <div
      v-for="node in project.nodes"
      :key="node.objectId"
      class="project-node-anchor"
      :style="node.style"
      :data-node-id="node.objectId"
    >
      <button
        type="button"
        class="project-node"
        :class="[
          `project-node--${node.hierarchyLevel.toLowerCase()}`,
          { 'project-node--selected': node.isSelected },
        ]"
        :aria-label="`${node.displayName} node`"
        :aria-pressed="node.isSelected"
        :data-node-id="node.objectId"
        @pointerdown.stop="$emit('start-node-move', $event, node.objectId)"
        @click="$emit('select-node', node.objectId)"
        @dblclick.stop="$emit('open-node', node.objectId)"
        @contextmenu.prevent.stop="$emit('open-node-menu', $event, node.objectId)"
      >
        <span v-if="node.isSelected" class="project-node__focus-ring" aria-hidden="true" />
        <i aria-hidden="true" />
      </button>
      <aside v-if="node.isSelected" class="project-node-card">
        <strong>{{ node.displayName }}</strong>
        <span>{{ node.typeLabel }}</span>
        <p>{{ node.description || "No description available." }}</p>
        <button type="button" @click="$emit('open-node', node.objectId)">Inspect</button>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { ProjectCosmosPresentation } from "../projectCosmosProjection";

const props = defineProps<{
  project: Readonly<ProjectCosmosPresentation>;
}>();

defineEmits<{
  "select-node": [objectId: string];
  "open-node": [objectId: string];
  "open-node-menu": [event: MouseEvent, objectId: string];
  "start-node-move": [event: PointerEvent, objectId: string];
}>();

const coreLabel = computed(() => {
  const state = props.project.isCoreSelected
    ? ", selected"
    : props.project.isFocused
      ? ", focused"
      : "";
  return `${props.project.displayName}${state} project core`;
});
</script>

<style scoped>
.project-constellation {
  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
}

.project-constellation__nebula {
  position: absolute;
  top: calc(var(--project-y) - 320px);
  left: calc(var(--project-x) - 500px);
  width: 1000px;
  height: 640px;
  transform: rotate(-7deg);
  border-radius: 62% 38% 58% 42% / 43% 57% 43% 57%;
  background:
    radial-gradient(ellipse at 51% 48%, rgba(var(--project-light), 0.15), transparent 13%),
    conic-gradient(from 22deg at 52% 48%, transparent 0 10%, rgba(var(--project-light), 0.09) 15%, transparent 25% 38%, rgba(var(--project-light), 0.08) 43%, transparent 53% 68%, rgba(var(--project-light), 0.08) 76%, transparent 88%),
    radial-gradient(ellipse at 50% 50%, rgba(var(--project-light), 0.13), transparent 62%);
  filter: blur(5px);
  opacity: 0.9;
}

.project-connections {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.project-connection {
  fill: none;
  stroke: rgba(var(--project-light), 0.2);
  stroke-linecap: round;
  stroke-width: 1.05;
  vector-effect: non-scaling-stroke;
}

.project-connection--structural {
  stroke: rgba(var(--project-light), 0.48);
  stroke-width: 1.45;
  filter: drop-shadow(0 0 3px rgba(var(--project-light), 0.24));
}

.project-connection--semantic,
.project-connection--discovery {
  stroke: rgba(var(--project-light), 0.14);
  stroke-width: 1;
  stroke-dasharray: 2 7;
}

.project-node {
  position: absolute;
  top: var(--node-top);
  left: var(--node-left);
  display: grid;
  width: 60px;
  height: 60px;
  transform: translate(-50%, -50%);
  place-items: center;
}

.project-node-anchor {
  position: absolute;
  top: var(--node-top);
  left: var(--node-left);
  width: 60px;
  height: 60px;
  transform: translate(-50%, -50%);
}

.project-node-anchor > .project-node {
  position: relative;
  top: auto;
  left: auto;
  padding: 0;
  border: 0;
  appearance: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  touch-action: none;
  transform: none;
}

.project-node-anchor > .project-node:active {
  cursor: grabbing;
}

.project-node-anchor > .project-node:focus-visible {
  outline: none;
}

.project-node-anchor > .project-node:focus-visible::after {
  position: absolute;
  inset: -7px;
  border: 1px dashed rgba(var(--project-light), 0.74);
  border-radius: 50%;
  box-shadow: 0 0 18px rgba(var(--project-light), 0.16);
  content: "";
  pointer-events: none;
}

.project-node > i {
  display: block;
  width: var(--node-size);
  height: var(--node-size);
  border: 1px solid rgba(243, 242, 229, 0.78);
  border-radius: 50%;
  background: #f1efe3;
  box-shadow: 0 0 5px #e8e8df, 0 0 16px rgba(var(--project-light), 0.62), 0 0 35px rgba(var(--project-light), 0.28);
}

.project-node--core {
  --node-left: 50%;
  --node-top: 50%;
  --node-size: 40px;
  top: var(--project-y);
  left: var(--project-x);
  width: 130px;
  height: 130px;
  padding: 0;
  border: 0;
  appearance: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
}

.project-node--core:focus-visible {
  outline: 1px dashed rgba(var(--project-light), 0.74);
  outline-offset: -10px;
  border-radius: 50%;
}

.project-node--core > i {
  background: radial-gradient(circle at 36% 30%, #fff, #e6dfca 36%, rgba(var(--project-light), 0.76) 70%, #334755);
  box-shadow: 0 0 9px #fff, 0 0 28px rgba(230, 222, 198, 0.72), 0 0 82px rgba(var(--project-light), 0.46);
}

.project-node__focus-ring {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(var(--project-light), 0.36);
  border-radius: 50%;
  box-shadow: inset 0 0 22px rgba(var(--project-light), 0.08), 0 0 34px rgba(var(--project-light), 0.08);
}

.project-node--focused:not(.project-node--selected) .project-node__focus-ring {
  border-style: dashed;
  opacity: 0.74;
}

.project-node--selected > i {
  box-shadow: 0 0 8px #fff, 0 0 26px rgba(var(--project-light), 0.82), 0 0 58px rgba(var(--project-light), 0.36);
}

.project-node--domain > i {
  border-width: 1.5px;
  box-shadow: 0 0 18px rgba(var(--project-light), 0.34), inset 0 0 10px rgba(255,255,255,0.12);
}

.project-node--cluster > i {
  box-shadow: 0 0 12px rgba(var(--project-light), 0.24), inset 0 0 8px rgba(255,255,255,0.09);
}

.project-node--object > i,
.project-node--detail > i {
  border-color: rgba(var(--project-light), 0.58);
  box-shadow: 0 0 8px rgba(var(--project-light), 0.18);
}

.project-node--core > strong {
  position: absolute;
  top: calc(50% + 37px);
  left: 50%;
  transform: translateX(-50%);
  color: rgba(229, 237, 242, 0.8);
  font-size: 0.65rem;
  font-weight: 520;
  letter-spacing: 0.12em;
  text-shadow: 0 2px 8px #01030a;
  white-space: nowrap;
}

.project-node-card {
  position: absolute;
  z-index: 8;
  top: 42px;
  left: 48px;
  display: grid;
  width: 165px;
  padding: 11px 12px;
  border: 1px solid rgba(var(--project-light), 0.42);
  border-radius: var(--cosmos-radius-window);
  background: rgba(5, 12, 19, 0.86);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.38), 0 0 18px rgba(var(--project-light), 0.08);
  backdrop-filter: blur(12px);
  gap: 4px;
}

.project-node-card::before {
  position: absolute;
  top: 13px;
  left: -6px;
  width: 10px;
  height: 10px;
  transform: rotate(45deg);
  border-bottom: 1px solid rgba(var(--project-light), 0.42);
  border-left: 1px solid rgba(var(--project-light), 0.42);
  background: #07101a;
  content: "";
}

.project-node-card strong {
  color: #e5dfd5;
  font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  font-size: 0.77rem;
  font-weight: 400;
}

.project-node-card span {
  color: var(--cosmos-color-accent);
  font-size: 0.55rem;
}

.project-node-card p {
  margin: 3px 0 0;
  color: #98a8af;
  font-size: 0.58rem;
  line-height: 1.45;
}

.project-node-card button {
  justify-self: start;
  margin-top: 5px;
  padding: 5px 9px;
  border: 1px solid rgba(var(--project-light), 0.34);
  border-radius: 7px;
  background: rgba(var(--project-light), 0.08);
  color: #dce7ec;
  font: inherit;
  font-size: 0.56rem;
  letter-spacing: 0.05em;
  cursor: pointer;
}

.project-node-card button:hover,
.project-node-card button:focus-visible {
  border-color: rgba(var(--project-light), 0.62);
  outline: none;
  background: rgba(var(--project-light), 0.14);
}
</style>
