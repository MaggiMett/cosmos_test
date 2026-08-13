<template>
  <header class="base-runtime-chrome" data-testid="base-runtime-chrome">
    <button
      type="button"
      class="base-runtime-chrome__brand"
      :aria-label="returnLabel"
      :title="returnLabel"
      @click="$emit('close-base')"
    >
      <span aria-hidden="true">✦</span>
      <strong>COSMOS</strong>
    </button>

    <CosmosNavigation
      :current-location="currentLocation"
      :left-neighbor="null"
      :right-neighbor="sceneOwnsFunctionControls ? null : rightNeighbor"
      :quick-travel-open="false"
      :current-interactive="false"
      @travel="$emit('travel-room', $event)"
    />

    <div class="base-runtime-chrome__status" aria-label="Companion">
      <button
        v-if="!sceneOwnsFunctionControls"
        type="button"
        :aria-label="companionLabel"
        :title="companionLabel"
        :disabled="!companion"
        @click="$emit('open-companion')"
      >
        <CompanionAvatar v-if="companion" mode="compact" />
        <span v-else aria-hidden="true">○</span>
      </button>
      <span
        v-else
        class="base-runtime-chrome__companion-visual"
        aria-hidden="true"
      >
        <CompanionAvatar v-if="companion" mode="compact" />
        <span v-else>○</span>
      </span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";

import CosmosNavigation from "../../../components/cosmos/CosmosNavigation.vue";
import CompanionAvatar from "../../../components/entities/CompanionAvatar.vue";
import type { BaseCompanionPresentation } from "../baseRuntimeProjection";

const props = withDefaults(defineProps<{
  currentLocation: string;
  companion: Readonly<BaseCompanionPresentation> | null;
  rightNeighbor: Readonly<{ objectId: string; displayName: string }> | null;
  returnProjectName?: string | null;
  sceneOwnsFunctionControls?: boolean;
}>(), {
  returnProjectName: null,
  sceneOwnsFunctionControls: false,
});

defineEmits<{
  "travel-room": [roomId: string];
  "open-companion": [];
  "close-base": [];
}>();

const companionLabel = computed(() =>
  props.companion ? `${props.companion.displayName} available` : "Companion unavailable",
);
const returnLabel = computed(() =>
  props.returnProjectName ? `Return to ${props.returnProjectName} in Cosmos` : "Return to Cosmos",
);
</script>

<style scoped>
.base-runtime-chrome {
  position: fixed;
  z-index: 40;
  top: 0;
  right: 0;
  left: 0;
  height: 82px;
  pointer-events: none;
}

.base-runtime-chrome__brand,
.base-runtime-chrome__status {
  position: absolute;
  top: 20px;
  display: flex;
  align-items: center;
  pointer-events: auto;
}

.base-runtime-chrome__brand {
  left: 30px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #e9e3da;
  cursor: pointer;
  font: inherit;
  gap: 16px;
}

.base-runtime-chrome__brand:focus-visible {
  border-radius: var(--cosmos-radius-control);
  outline: 2px solid var(--cosmos-color-accent);
  outline-offset: 5px;
}

.base-runtime-chrome__brand > span {
  font-size: 1.8rem;
  line-height: 1;
}

.base-runtime-chrome__brand strong {
  font-size: 0.76rem;
  font-weight: 520;
  letter-spacing: 0.46em;
}

.base-runtime-chrome__status {
  right: 28px;
  gap: 9px;
}

.base-runtime-chrome__status > span {
  display: flex;
  min-height: 38px;
  padding: 0 13px;
  align-items: center;
  border: 1px solid var(--cosmos-color-border);
  border-radius: var(--cosmos-radius-control);
  background: rgba(5, 10, 16, 0.7);
  color: #bac5ca;
  font-size: 0.66rem;
  gap: 8px;
  backdrop-filter: blur(12px);
}

.base-runtime-chrome__status button {
  width: 46px;
  height: 46px;
  padding: 7px;
  border: 1px solid var(--cosmos-color-border-strong);
  border-radius: 50%;
  background: rgba(5, 10, 16, 0.76);
  cursor: pointer;
}

.base-runtime-chrome__status > .base-runtime-chrome__companion-visual {
  display: grid;
  width: 46px;
  height: 46px;
  padding: 7px;
  place-items: center;
  border: 1px solid var(--cosmos-color-border-strong);
  border-radius: 50%;
  background: rgba(5, 10, 16, 0.76);
}

.base-runtime-chrome__status button:disabled {
  cursor: default;
}

.base-runtime-chrome__status button:focus-visible {
  border-color: var(--cosmos-color-accent);
  outline: 2px solid color-mix(in srgb, var(--cosmos-color-accent) 58%, transparent);
  outline-offset: 2px;
}
</style>
