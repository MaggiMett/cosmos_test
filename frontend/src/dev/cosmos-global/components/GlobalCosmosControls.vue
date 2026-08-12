<template>
  <div class="global-cosmos-controls" data-testid="global-cosmos-controls">
    <div class="global-cosmos-controls__zoom" aria-label="Zoom controls">
      <button type="button" aria-label="Zoom out" @click="$emit('zoom-out')">−</button>
      <span>{{ zoomLabel }}</span>
      <button type="button" aria-label="Zoom in" @click="$emit('zoom-in')">+</button>
    </div>
    <button type="button" @click="$emit('fit')">Fit</button>

    <p><span>Cosmos</span><i aria-hidden="true">/</i><strong>Global</strong></p>

    <nav class="global-cosmos-controls__destinations" aria-label="Runtime destinations">
      <button type="button" @click="$emit('open-base')"><span aria-hidden="true">⌂</span>Base</button>
      <button type="button" @click="$emit('open-companion')"><span aria-hidden="true">○</span>Companion</button>
      <button type="button" @click="$emit('open-themes')"><span aria-hidden="true">◇</span>Themes</button>
    </nav>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  zoomLabel: string;
}>();

defineEmits<{
  "zoom-out": [];
  "zoom-in": [];
  fit: [];
  "open-base": [];
  "open-companion": [];
  "open-themes": [];
}>();
</script>

<style scoped>
.global-cosmos-controls {
  position: fixed;
  z-index: 24;
  right: 30px;
  bottom: 26px;
  left: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
  pointer-events: none;
}

.global-cosmos-controls button,
.global-cosmos-controls__zoom,
.global-cosmos-controls__destinations {
  pointer-events: auto;
}

.global-cosmos-controls__zoom {
  display: grid;
  min-height: 43px;
  grid-template-columns: 38px 52px 38px;
  align-items: center;
  border: 1px solid var(--cosmos-color-border);
  border-radius: var(--cosmos-radius-window);
  background: rgba(3, 8, 14, 0.72);
  backdrop-filter: blur(12px);
}

.global-cosmos-controls__zoom button,
.global-cosmos-controls > button,
.global-cosmos-controls__destinations button {
  border: 0;
  background: transparent;
  color: #c7d2d7;
  cursor: pointer;
}

.global-cosmos-controls__zoom button {
  display: grid;
  width: 29px;
  height: 29px;
  margin: auto;
  padding: 0;
  place-items: center;
  border: 1px solid var(--cosmos-color-border);
  border-radius: 50%;
  font-size: 0.95rem;
}

.global-cosmos-controls__zoom span {
  color: #bdc8cd;
  font-size: 0.68rem;
  text-align: center;
}

.global-cosmos-controls > button,
.global-cosmos-controls__destinations {
  min-height: 43px;
  border: 1px solid var(--cosmos-color-border);
  border-radius: var(--cosmos-radius-window);
  background: rgba(3, 8, 14, 0.72);
  backdrop-filter: blur(12px);
}

.global-cosmos-controls > button {
  padding: 0 15px;
  font-size: 0.66rem;
}

.global-cosmos-controls__search {
  display: flex;
  align-items: center;
  gap: 8px;
}

.global-cosmos-controls p {
  display: flex;
  margin: 0 0 0 auto;
  padding: 9px 12px;
  align-items: center;
  color: var(--cosmos-color-faint);
  font-size: 0.59rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  gap: 8px;
}

.global-cosmos-controls p span,
.global-cosmos-controls p strong {
  color: var(--cosmos-color-muted);
  font-weight: 520;
}

.global-cosmos-controls p i {
  color: rgba(98, 200, 234, 0.38);
  font-style: normal;
}

.global-cosmos-controls__destinations {
  display: flex;
  padding: 4px;
  align-items: center;
  gap: 2px;
}

.global-cosmos-controls__destinations button {
  display: flex;
  min-height: 33px;
  padding: 0 10px;
  align-items: center;
  border-radius: var(--cosmos-radius-control);
  font-size: 0.62rem;
  gap: 7px;
}

.global-cosmos-controls__destinations button:last-child {
  width: 33px;
  padding: 0;
  justify-content: center;
}
</style>
