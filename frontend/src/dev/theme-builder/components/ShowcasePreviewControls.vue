<template>
  <nav
    class="showcase-preview-controls"
    aria-label="Showcase preview"
    data-testid="showcase-preview-controls"
  >
    <button
      v-for="option in options"
      :key="option.label"
      type="button"
      :class="{ 'showcase-preview-controls__active': option.label === 'Cosmos' }"
      :aria-pressed="option.label === 'Cosmos'"
    >
      <span>
        <BuilderIcon :name="option.icon" />
      </span>
      {{ option.label }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import BuilderIcon from "./BuilderIcon.vue";

const options = [
  { label: "Cosmos", icon: "spark" },
  { label: "Base", icon: "object" },
  { label: "Room", icon: "room" },
  { label: "Object", icon: "looks" },
  { label: "Responsive", icon: "showcase" },
] as const;
</script>

<style scoped>
.showcase-preview-controls {
  position: absolute;
  bottom: 34px;
  left: 50%;
  z-index: 5;
  display: grid;
  width: min(570px, calc(100% - 32px));
  min-width: 0;
  padding: 11px 18px 10px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  border: 1px solid var(--builder-border-strong);
  border-radius: 999px;
  background: rgba(12, 17, 21, 0.88);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.34);
  backdrop-filter: blur(18px);
  transform: translateX(-50%);
}

.showcase-preview-controls button {
  position: relative;
  display: grid;
  padding: 0 12px;
  place-items: center;
  border: 0;
  border-right: 1px solid var(--builder-border);
  background: transparent;
  color: var(--builder-muted);
  cursor: pointer;
  font-size: 0.67rem;
  gap: 5px;
}

.showcase-preview-controls button:last-child {
  border-right: 0;
}

.showcase-preview-controls button:hover {
  color: var(--builder-text);
}

.showcase-preview-controls button > span {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid var(--builder-border-strong);
  border-radius: 50%;
  background: rgba(9, 13, 17, 0.7);
}

.showcase-preview-controls__active {
  color: var(--builder-text) !important;
}

.showcase-preview-controls__active > span {
  border-color: rgba(120, 149, 177, 0.8) !important;
  background: var(--builder-accent-soft) !important;
  box-shadow: 0 0 18px rgba(120, 149, 177, 0.24);
}

.showcase-preview-controls :deep(.builder-icon) {
  width: 1.1rem;
  height: 1.1rem;
}

@media (max-width: 680px) {
  .showcase-preview-controls { bottom: 18px; padding: 8px 10px; }
  .showcase-preview-controls button { padding-inline: 4px; font-size: .58rem; }
  .showcase-preview-controls button > span { width: 32px; height: 32px; }
}
</style>
