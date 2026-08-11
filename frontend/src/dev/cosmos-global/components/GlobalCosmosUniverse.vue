<template>
  <div
    class="global-universe"
    :aria-label="`${regions.length} project regions`"
    data-testid="global-cosmos-universe"
  >
    <button
      v-for="region in regions"
      :key="region.objectId"
      type="button"
      class="project-region"
      :class="{
        'project-region--focused': region.isFocused,
        'project-region--selected': region.isSelected,
      }"
      :style="region.style"
      :aria-label="regionLabel(region)"
      :data-project-id="region.objectId"
      :data-node-count="region.nodeCount"
      :data-connection-count="region.connectionCount"
      @click="$emit('activate-project', region.objectId)"
      @contextmenu.prevent.stop="$emit('open-project-menu', $event, region.objectId)"
    >
      <span class="project-region__nebula" aria-hidden="true" />
      <span
        v-if="region.isFocused || region.isSelected"
        class="project-region__selection"
        :class="{ 'project-region__selection--selected': region.isSelected }"
        aria-hidden="true"
      />
      <span
        v-for="star in region.stars"
        :key="star.objectId"
        class="project-region__star"
        :class="{ 'project-region__star--selected': star.isSelected }"
        :style="star.style"
        role="img"
        :aria-label="star.displayName"
        :data-node-id="star.objectId"
      />
      <span class="project-region__core">
        <i aria-hidden="true" />
        <strong>{{ region.displayName }}</strong>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { GlobalCosmosRegionPresentation } from "../globalCosmosProjection";

defineProps<{
  regions: readonly Readonly<GlobalCosmosRegionPresentation>[];
}>();

defineEmits<{
  "activate-project": [projectId: string];
  "open-project-menu": [event: MouseEvent, projectId: string];
}>();

function regionLabel(region: Readonly<GlobalCosmosRegionPresentation>): string {
  const state = region.isSelected ? ", selected" : region.isFocused ? ", focused" : "";
  return `${region.displayName}${state} project region`;
}
</script>

<style scoped>
.global-universe {
  position: absolute;
  z-index: 5;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  overflow: visible;
  transform-origin: 0 0;
  transition: transform 220ms ease;
}

.global-universe--interacting {
  transition: none;
}

.project-region {
  --region-light: 116, 190, 226;
  padding: 0;
  border: 0;
  appearance: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  position: absolute;
  top: var(--region-top);
  left: var(--region-left);
  width: var(--region-width);
  height: var(--region-height);
  transform: translate(-50%, -50%);
  text-align: initial;
}

.project-region:focus-visible {
  outline: none;
}

.project-region__nebula {
  position: absolute;
  inset: 7%;
  border-radius: 50%;
  background:
    radial-gradient(ellipse at 48% 52%, rgba(var(--region-light), 0.14), rgba(var(--region-light), 0.045) 37%, transparent 72%),
    radial-gradient(ellipse at 64% 35%, rgba(var(--region-light), 0.07), transparent 47%);
  filter: blur(14px);
  opacity: var(--region-nebula-opacity);
  transform: rotate(-10deg);
}

.project-region__selection {
  position: absolute;
  z-index: 1;
  top: 50%;
  left: 50%;
  width: 108px;
  height: 108px;
  transform: translate(-50%, -50%);
  border: 1px solid rgba(113, 190, 226, 0.3);
  border-radius: 50%;
  box-shadow: 0 0 44px rgba(88, 179, 219, 0.12), inset 0 0 32px rgba(82, 177, 219, 0.06);
}

.project-region--selected .project-region__selection {
  border-color: rgba(var(--region-light), 0.48);
  box-shadow: 0 0 48px rgba(var(--region-light), 0.2), inset 0 0 32px rgba(var(--region-light), 0.08);
}

.project-region--focused:not(.project-region--selected) .project-region__selection {
  border-style: dashed;
  opacity: 0.72;
}

.project-region__core {
  position: absolute;
  z-index: 4;
  top: 50%;
  left: 50%;
  display: grid;
  transform: translate(-50%, -50%);
  place-items: center;
}

.project-region__core::before {
  position: absolute;
  inset: -30px;
  border: 1px solid transparent;
  border-radius: 50%;
  content: "";
  pointer-events: none;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.project-region:focus-visible .project-region__core::before {
  border-color: rgba(var(--region-light), 0.58);
  box-shadow: 0 0 28px rgba(var(--region-light), 0.2), inset 0 0 22px rgba(var(--region-light), 0.08);
}

.project-region__core i {
  display: block;
  width: var(--region-core-size);
  height: var(--region-core-size);
  border-radius: 50%;
  background: radial-gradient(circle at 38% 32%, #fff 0 7%, rgb(var(--region-light)) 25%, rgba(var(--region-light), 0.65) 45%, transparent 72%);
  box-shadow:
    0 0 12px rgba(var(--region-light), 0.85),
    0 0 34px rgba(var(--region-light), 0.45),
    0 0 74px rgba(var(--region-light), 0.2);
}

.project-region__core strong {
  position: absolute;
  top: calc(100% + 13px);
  color: rgba(224, 234, 239, 0.78);
  font-size: 0.66rem;
  font-weight: 520;
  letter-spacing: 0.09em;
  text-shadow: 0 2px 9px #000;
  white-space: nowrap;
}

.project-region--focused .project-region__core strong,
.project-region--selected .project-region__core strong {
  color: #e5edf2;
  font-size: 0.76rem;
}

.project-region__star {
  position: absolute;
  z-index: 3;
  top: var(--star-top);
  left: var(--star-left);
  width: var(--star-size);
  height: var(--star-size);
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: rgba(var(--region-light), 0.9);
  box-shadow: 0 0 7px rgba(var(--region-light), 0.68), 0 0 18px rgba(var(--region-light), 0.2);
}

.project-region__star--selected {
  background: #fff;
  box-shadow: 0 0 9px rgba(var(--region-light), 0.95), 0 0 24px rgba(var(--region-light), 0.45);
}

@media (prefers-reduced-motion: reduce) {
  .global-universe { transition: none; }
}
</style>
