<template>
  <header class="project-cosmos-chrome" data-testid="project-cosmos-chrome">
    <div class="project-cosmos-chrome__brand" aria-label="Cosmos">
      <span aria-hidden="true">✦</span>
      <strong>COSMOS</strong>
    </div>

    <CosmosNavigation
      :current-location="projectName"
      :left-neighbor="leftNeighbor"
      :right-neighbor="rightNeighbor"
      :quick-travel-open="quickTravelOpen"
      @travel="$emit('travel-project', $event)"
      @toggle-quick-travel="$emit('toggle-quick-travel')"
    />

    <div class="project-cosmos-chrome__status" aria-label="Project status">
      <span><i class="project-cosmos-chrome__dot project-cosmos-chrome__dot--synced" />Local · Synced</span>
      <span><i class="project-cosmos-chrome__dot" />{{ objectStatus }}</span>
      <button type="button" aria-label="Back to Global" @click="$emit('back-to-global')">◎</button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";

import CosmosNavigation from "../../../components/cosmos/CosmosNavigation.vue";
import type { CosmosProjectDestination } from "../../cosmosNavigation";

const props = defineProps<{
  projectName: string;
  objectCount: number;
  phase: "loading" | "error" | "not-found" | "empty-project" | "success";
  leftNeighbor: Readonly<CosmosProjectDestination> | null;
  rightNeighbor: Readonly<CosmosProjectDestination> | null;
  quickTravelOpen: boolean;
}>();

defineEmits<{
  "back-to-global": [];
  "travel-project": [projectId: string];
  "toggle-quick-travel": [];
}>();

const objectStatus = computed(() => {
  if (props.phase === "loading") return "Loading objects";
  if (props.phase === "error" || props.phase === "not-found") return "Objects unavailable";
  return `${props.objectCount} ${props.objectCount === 1 ? "object" : "objects"}`;
});
</script>

<style scoped>
.project-cosmos-chrome {
  position: fixed;
  z-index: 30;
  top: 0;
  right: 0;
  left: 0;
  height: 82px;
  pointer-events: none;
}

.project-cosmos-chrome__brand,
.project-cosmos-chrome__status {
  position: absolute;
  top: 20px;
  display: flex;
  align-items: center;
  pointer-events: auto;
}

.project-cosmos-chrome__brand {
  left: 30px;
  color: #e6e3dc;
  gap: 16px;
}

.project-cosmos-chrome__brand > span {
  font-size: 1.8rem;
  line-height: 1;
}

.project-cosmos-chrome__brand strong {
  font-size: 0.76rem;
  font-weight: 520;
  letter-spacing: 0.46em;
}

.project-cosmos-chrome__status {
  right: 28px;
  gap: 9px;
}

.project-cosmos-chrome__status > span {
  display: flex;
  min-height: 38px;
  padding: 0 13px;
  align-items: center;
  border: 1px solid var(--cosmos-color-border);
  border-radius: var(--cosmos-radius-control);
  background: rgba(3, 8, 14, 0.72);
  color: #b8c5cb;
  font-size: 0.66rem;
  gap: 8px;
  backdrop-filter: blur(12px);
}

.project-cosmos-chrome__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #72acd6;
  box-shadow: 0 0 8px rgba(114, 172, 214, 0.48);
}

.project-cosmos-chrome__dot--synced {
  background: var(--cosmos-color-green);
  box-shadow: 0 0 8px rgba(117, 207, 169, 0.42);
}

.project-cosmos-chrome__status button {
  display: grid;
  width: 44px;
  height: 44px;
  padding: 0;
  place-items: center;
  border: 1px solid var(--cosmos-color-border-strong);
  border-radius: 50%;
  background: rgba(3, 8, 14, 0.74);
  color: #c5d2d8;
  cursor: pointer;
  font-size: 1rem;
}
</style>
