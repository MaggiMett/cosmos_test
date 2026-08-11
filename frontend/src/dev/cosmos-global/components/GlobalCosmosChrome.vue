<template>
  <header class="global-cosmos-chrome" data-testid="global-cosmos-chrome">
    <div class="global-cosmos-chrome__brand" aria-label="Cosmos">
      <span aria-hidden="true">✦</span>
      <strong>COSMOS</strong>
    </div>

    <CosmosNavigation
      current-location="Global View"
      :left-neighbor="leftNeighbor"
      :right-neighbor="rightNeighbor"
      :quick-travel-open="quickTravelOpen"
      @travel="$emit('travel-project', $event)"
      @toggle-quick-travel="$emit('toggle-quick-travel')"
    />

    <div class="global-cosmos-chrome__status" aria-label="Global status">
      <span><i class="global-cosmos-chrome__dot global-cosmos-chrome__dot--synced" />Local · Synced</span>
      <span><i class="global-cosmos-chrome__dot" />{{ projectStatus }}</span>
      <div class="global-cosmos-chrome__companion" aria-label="Companion available">
        <CompanionAvatar mode="compact" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";

import CosmosNavigation from "../../../components/cosmos/CosmosNavigation.vue";
import CompanionAvatar from "../../../components/entities/CompanionAvatar.vue";
import type { CosmosProjectDestination } from "../../cosmosNavigation";

const props = defineProps<{
  projectCount: number;
  phase: "loading" | "error" | "empty" | "success";
  leftNeighbor: Readonly<CosmosProjectDestination> | null;
  rightNeighbor: Readonly<CosmosProjectDestination> | null;
  quickTravelOpen: boolean;
}>();

defineEmits<{
  "travel-project": [projectId: string];
  "toggle-quick-travel": [];
}>();

const projectStatus = computed(() => {
  if (props.phase === "loading") return "Loading projects";
  if (props.phase === "error") return "Projects unavailable";
  return `${props.projectCount} ${props.projectCount === 1 ? "project" : "projects"}`;
});
</script>

<style scoped>
.global-cosmos-chrome {
  position: fixed;
  z-index: 30;
  top: 0;
  right: 0;
  left: 0;
  height: 82px;
  pointer-events: none;
}

.global-cosmos-chrome__brand,
.global-cosmos-chrome__status {
  position: absolute;
  top: 20px;
  display: flex;
  align-items: center;
  pointer-events: auto;
}

.global-cosmos-chrome__brand {
  left: 30px;
  color: #e6e3dc;
  gap: 16px;
}

.global-cosmos-chrome__brand > span {
  font-size: 1.8rem;
  line-height: 1;
}

.global-cosmos-chrome__brand strong {
  font-size: 0.76rem;
  font-weight: 520;
  letter-spacing: 0.46em;
}

.global-cosmos-chrome__status {
  right: 28px;
  gap: 9px;
}

.global-cosmos-chrome__status > span {
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

.global-cosmos-chrome__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #72acd6;
  box-shadow: 0 0 8px rgba(114, 172, 214, 0.48);
}

.global-cosmos-chrome__dot--synced {
  background: var(--cosmos-color-green);
  box-shadow: 0 0 8px rgba(117, 207, 169, 0.42);
}

.global-cosmos-chrome__companion {
  width: 44px;
  height: 44px;
  padding: 5px;
  border: 1px solid var(--cosmos-color-border-strong);
  border-radius: 50%;
  background: rgba(3, 8, 14, 0.74);
}
</style>
