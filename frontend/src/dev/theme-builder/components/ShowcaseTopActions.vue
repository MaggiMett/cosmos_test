<template>
  <div class="showcase-top-actions" aria-label="Showcase actions" data-testid="showcase-top-actions">
    <button type="button">
      <BuilderIcon name="eye" />
      Compare Core Default
    </button>
    <button type="button">
      <BuilderIcon name="showcase" />
      Focus Mode
    </button>
    <button type="button" class="showcase-top-actions__exit">
      <BuilderIcon name="chevron" />
      Exit Preview
    </button>
  </div>
</template>

<script setup lang="ts">
import BuilderIcon from "./BuilderIcon.vue";
</script>

<style scoped>
.showcase-top-actions {
  position: absolute;
  top: 11px;
  right: 24px;
  z-index: 12;
  display: flex;
  align-items: center;
  gap: 10px;
}

.showcase-top-actions button {
  display: flex;
  min-height: 42px;
  padding: 0 16px;
  align-items: center;
  border: 1px solid var(--builder-border);
  border-radius: var(--builder-radius-control);
  background: rgba(10, 14, 18, 0.72);
  color: var(--builder-text);
  cursor: pointer;
  font-size: 0.72rem;
  transition:
    border-color var(--builder-control-transition),
    background var(--builder-control-transition);
  gap: 8px;
}

.showcase-top-actions button:hover {
  border-color: var(--builder-border-strong);
  background: var(--builder-surface);
}

.showcase-top-actions__exit {
  border-color: rgba(120, 149, 177, 0.48) !important;
  background: var(--builder-accent-soft) !important;
}

.showcase-top-actions :deep(.builder-icon) {
  width: 1rem;
  height: 1rem;
}

@media (max-width: 1180px) {
  .showcase-top-actions button {
    padding-inline: 11px;
  }
}
</style>
