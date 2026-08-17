<template>
  <div class="release-content-grid" data-testid="release-included-content">
    <article v-for="item in items" :key="item.label" class="release-content-card">
      <div class="release-content-card__visual">
        <NeutralVisualPlaceholder :label="`${item.label} preview`" variant="thumbnail" />
        <BuilderIcon :name="item.icon" />
      </div>
      <footer>
        <strong class="builder-serif">{{ item.label }}</strong>
        <span>{{ item.count }}</span>
      </footer>
    </article>
  </div>
</template>

<script setup lang="ts">
import BuilderIcon from "./BuilderIcon.vue";
import NeutralVisualPlaceholder from "./NeutralVisualPlaceholder.vue";

export interface ReleaseContentItem {
  label: string;
  count: number;
  icon: string;
}

defineProps<{ items: readonly ReleaseContentItem[] }>();
</script>

<style scoped>
.release-content-grid {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.release-content-card {
  display: grid;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  grid-template-rows: minmax(0, 1fr) auto;
  border: 1px solid var(--builder-border);
  border-radius: var(--builder-radius-card);
  background: var(--builder-surface);
}

.release-content-card__visual {
  position: relative;
  min-height: 0;
  overflow: hidden;
  border-bottom: 1px solid var(--builder-border);
}

.release-content-card__visual > :deep(.neutral-visual) {
  width: 100%;
  height: 100%;
}

.release-content-card__visual > :deep(.builder-icon) {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2.1rem;
  height: 2.1rem;
  color: rgba(232, 227, 218, 0.36);
  transform: translate(-50%, -50%);
}

.release-content-card footer {
  display: grid;
  min-height: 48px;
  padding: 8px 12px;
  align-content: center;
  gap: 1px;
}

.release-content-card strong {
  overflow: hidden;
  font-size: 0.88rem;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.release-content-card footer span {
  color: var(--builder-muted);
  font-size: 0.66rem;
}

@media (max-width: 1120px) {
  .release-content-grid { height:auto; grid-template-columns:repeat(3,minmax(0,1fr)); }
  .release-content-card__visual { min-height:96px; }
}

@media (max-width: 680px) {
  .release-content-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
}

@media (max-width: 440px) {
  .release-content-grid { grid-template-columns:1fr; }
}
</style>
