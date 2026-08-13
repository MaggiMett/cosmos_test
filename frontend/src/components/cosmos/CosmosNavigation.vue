<template>
  <nav class="cosmos-navigation" aria-label="Cosmos navigation">
    <button
      v-if="leftNeighbor"
      class="cosmos-navigation__neighbor"
      type="button"
      :aria-label="`Travel to ${leftNeighbor.displayName}`"
      :title="`Travel to ${leftNeighbor.displayName}`"
      @click="$emit('travel', leftNeighbor.objectId)"
    >
      <span aria-hidden="true">‹</span>{{ leftNeighbor.displayName }}
    </button>
    <span v-else class="cosmos-navigation__spacer" />

    <button
      v-if="currentInteractive"
      class="cosmos-navigation__current"
      type="button"
      :aria-expanded="quickTravelOpen"
      aria-controls="quick-travel"
      :aria-label="`Open quick travel from ${currentLocation}`"
      :title="`Open quick travel from ${currentLocation}`"
      @click="$emit('toggle-quick-travel')"
    >
      <strong>{{ currentLocation }}</strong>
      <span class="cosmos-navigation__mark" aria-hidden="true" />
    </button>
    <div v-else class="cosmos-navigation__current cosmos-navigation__current--passive">
      <strong>{{ currentLocation }}</strong>
      <span class="cosmos-navigation__mark" aria-hidden="true" />
    </div>

    <button
      v-if="rightNeighbor"
      class="cosmos-navigation__neighbor cosmos-navigation__neighbor--right"
      type="button"
      :aria-label="`Travel to ${rightNeighbor.displayName}`"
      :title="`Travel to ${rightNeighbor.displayName}`"
      @click="$emit('travel', rightNeighbor.objectId)"
    >
      {{ rightNeighbor.displayName }}<span aria-hidden="true">›</span>
    </button>
    <span v-else class="cosmos-navigation__spacer" />
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  currentLocation: string;
  leftNeighbor: Readonly<{ objectId: string; displayName: string }> | null;
  rightNeighbor: Readonly<{ objectId: string; displayName: string }> | null;
  quickTravelOpen: boolean;
  currentInteractive?: boolean;
}>();

defineEmits<{
  travel: [projectId: string];
  "toggle-quick-travel": [];
}>();
</script>

<style scoped>
.cosmos-navigation {
  position: fixed;
  z-index: 20;
  top: 14px;
  left: 50%;
  display: grid;
  width: min(720px, calc(100vw - 40px));
  align-items: start;
  transform: translateX(-50%);
  grid-template-columns: minmax(0, 1fr) minmax(210px, auto) minmax(0, 1fr);
  gap: 12px;
  pointer-events: none;
}

.cosmos-navigation::before {
  position: absolute;
  z-index: -1;
  top: 20px;
  right: 12%;
  left: 12%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(136, 183, 204, 0.19) 26%, rgba(136, 183, 204, 0.19) 74%, transparent);
  content: "";
}

.cosmos-navigation button {
  pointer-events: auto;
}

.cosmos-navigation__current {
  position: relative;
  display: grid;
  min-width: 210px;
  padding: 8px 30px 12px;
  border: 1px solid var(--cosmos-color-border);
  border-top-color: rgba(190, 224, 238, 0.23);
  border-radius: 3px 3px 9px 9px;
  background: linear-gradient(180deg, rgba(14, 24, 36, 0.9), rgba(5, 10, 18, 0.78));
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.045), 0 16px 42px rgba(0, 0, 0, 0.28), var(--cosmos-glow-cyan);
  color: var(--cosmos-color-text);
  text-align: center;
  cursor: pointer;
  backdrop-filter: blur(var(--cosmos-surface-blur));
}

.cosmos-navigation__current:not(.cosmos-navigation__current--passive):hover,
.cosmos-navigation__current:not(.cosmos-navigation__current--passive):focus-visible {
  border-color: color-mix(in srgb, var(--cosmos-color-accent) 42%, transparent);
  outline: none;
}

.cosmos-navigation__current--passive {
  cursor: default;
}

.cosmos-navigation__current strong {
  margin-top: 3px;
  overflow: hidden;
  font-size: 0.82rem;
  font-weight: 560;
  letter-spacing: 0.06em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cosmos-navigation__mark {
  position: absolute;
  bottom: -6px;
  left: 50%;
  width: 11px;
  height: 11px;
  transform: translateX(-50%) rotate(45deg);
  border-right: 1px solid rgba(98, 200, 234, 0.46);
  border-bottom: 1px solid rgba(98, 200, 234, 0.46);
  background: #07111c;
  box-shadow: 4px 4px 9px rgba(50, 159, 198, 0.12);
}

.cosmos-navigation__neighbor {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 13px 10px;
  overflow: hidden;
  border: 0;
  background: transparent;
  color: var(--cosmos-color-muted);
  font-size: 0.66rem;
  letter-spacing: 0.035em;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.cosmos-navigation__neighbor:hover,
.cosmos-navigation__neighbor:focus-visible {
  color: var(--cosmos-color-text);
}

.cosmos-navigation__neighbor span {
  color: var(--cosmos-color-accent);
  font-size: 1rem;
  opacity: 0.82;
}

.cosmos-navigation__neighbor--right {
  justify-content: flex-start;
}
</style>
