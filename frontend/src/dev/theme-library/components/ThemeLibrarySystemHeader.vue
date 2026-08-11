<template>
  <header class="theme-library-header" data-testid="theme-library-system-header">
    <div class="theme-library-header__brand" aria-label="Cosmos">
      <span aria-hidden="true">✦</span>
      <strong>COSMOS</strong>
    </div>

    <CosmosNavigation
      current-location="Theme Library"
      :left-neighbor="leftNeighbor"
      :right-neighbor="rightNeighbor"
      :quick-travel-open="false"
      @travel="$emit('travel', $event)"
    />

    <div class="theme-library-header__actions">
      <button type="button" class="theme-library-header__import" @click="$emit('builder')">
        <span aria-hidden="true">✦</span>
        Theme Builder
      </button>
      <button type="button" class="theme-library-header__import" @click="$emit('import')">
        <span aria-hidden="true">⇧</span>
        Import Theme Pack
      </button>
      <button type="button" class="theme-library-header__round" aria-label="Settings">⚙</button>
      <button type="button" class="theme-library-header__profile" aria-label="Profile">
        <span aria-hidden="true" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import CosmosNavigation from "../../../components/cosmos/CosmosNavigation.vue";

defineEmits<{
  import: [];
  builder: [];
  travel: [destinationId: string];
}>();

const leftNeighbor = { objectId: "cosmos", displayName: "Cosmos" } as const;
const rightNeighbor = { objectId: "base", displayName: "Base" } as const;
</script>

<style scoped>
.theme-library-header {
  position: fixed;
  z-index: 30;
  top: 0;
  right: 0;
  left: 0;
  height: 76px;
  pointer-events: none;
}

.theme-library-header__brand,
.theme-library-header__actions {
  position: absolute;
  top: 18px;
  display: flex;
  align-items: center;
  pointer-events: auto;
}

.theme-library-header__brand {
  left: 34px;
  color: #ece3d4;
  gap: 16px;
}

.theme-library-header__brand > span {
  font-size: 1.75rem;
  line-height: 1;
}

.theme-library-header__brand strong {
  font-size: 0.76rem;
  font-weight: 520;
  letter-spacing: 0.48em;
}

.theme-library-header__actions {
  right: 34px;
  gap: 16px;
}

.theme-library-header button {
  border: 1px solid var(--cosmos-color-border);
  background: rgba(5, 10, 17, 0.68);
  color: var(--cosmos-color-text);
  cursor: pointer;
  backdrop-filter: blur(12px);
}

.theme-library-header__import {
  display: flex;
  min-height: 40px;
  padding: 0 16px;
  align-items: center;
  border-radius: var(--cosmos-radius-control);
  font-size: 0.72rem;
  gap: 9px;
}

.theme-library-header__round,
.theme-library-header__profile {
  display: grid;
  width: 42px;
  height: 42px;
  padding: 0;
  place-items: center;
  border-radius: 50%;
}

.theme-library-header__round {
  color: var(--cosmos-color-muted);
  font-size: 1rem;
}

.theme-library-header__profile span {
  position: relative;
  width: 15px;
  height: 15px;
  border: 1px solid rgba(229, 237, 242, 0.58);
  border-radius: 50%;
}

.theme-library-header__profile span::after {
  position: absolute;
  top: 14px;
  left: 50%;
  width: 23px;
  height: 11px;
  transform: translateX(-50%);
  border: 1px solid rgba(229, 237, 242, 0.42);
  border-radius: 50% 50% 35% 35%;
  content: "";
}
</style>
