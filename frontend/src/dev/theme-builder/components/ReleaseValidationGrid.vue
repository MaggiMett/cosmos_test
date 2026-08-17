<template>
  <div class="release-validation-grid" data-testid="release-validation">
    <article
      v-for="item in items"
      :key="item.label"
      class="release-validation-card"
      :class="{ 'release-validation-card--clear': item.clear }"
    >
      <div v-if="item.clear" class="release-validation-card__check">
        <BuilderIcon name="check" />
      </div>
      <div v-else class="release-validation-card__visual">
        <NeutralVisualPlaceholder :label="`${item.label} finding`" variant="thumbnail" />
      </div>
      <div class="release-validation-card__copy">
        <strong class="builder-serif">{{ item.label }}</strong>
        <span>{{ item.description }}</span>
      </div>
      <button v-if="item.action" type="button">Go to <span aria-hidden="true">→</span></button>
    </article>
  </div>
</template>

<script setup lang="ts">
import BuilderIcon from "./BuilderIcon.vue";
import NeutralVisualPlaceholder from "./NeutralVisualPlaceholder.vue";

export interface ReleaseValidationItem {
  label: string;
  description: string;
  action: boolean;
  clear?: boolean;
}

defineProps<{ items: readonly ReleaseValidationItem[] }>();
</script>

<style scoped>
.release-validation-grid {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.release-validation-card {
  display: grid;
  min-width: 0;
  min-height: 0;
  padding: 9px 10px;
  grid-template-columns: 76px minmax(0, 1fr) auto;
  align-items: center;
  border: 1px solid var(--builder-border);
  border-radius: var(--builder-radius-card);
  background: linear-gradient(145deg, var(--builder-surface-raised), var(--builder-surface));
  gap: 11px;
}

.release-validation-card--clear {
  grid-template-columns: 48px minmax(0, 1fr);
}

.release-validation-card__visual {
  height: 100%;
  min-height: 54px;
  overflow: hidden;
  border: 1px solid var(--builder-border);
  border-radius: var(--builder-radius-control);
}

.release-validation-card__visual > :deep(.neutral-visual) {
  width: 100%;
  height: 100%;
}

.release-validation-card__check {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 1px solid rgba(120, 149, 177, 0.52);
  border-radius: 50%;
  color: #b9cbbf;
}

.release-validation-card__check :deep(.builder-icon) {
  width: 1.35rem;
  height: 1.35rem;
}

.release-validation-card__copy {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.release-validation-card__copy strong {
  color: var(--builder-text);
  font-size: 0.84rem;
  font-weight: 400;
}

.release-validation-card__copy span {
  overflow: hidden;
  color: var(--builder-muted);
  font-size: 0.66rem;
  line-height: 1.35;
}

.release-validation-card button {
  align-self: end;
  padding: 5px 0;
  border: 0;
  background: transparent;
  color: var(--builder-muted);
  cursor: pointer;
  font-size: 0.65rem;
  white-space: nowrap;
}

.release-validation-card button:hover {
  color: var(--builder-text);
}

@media (max-width: 1280px) {
  .release-validation-card {
    grid-template-columns: 58px minmax(0, 1fr);
  }

  .release-validation-card button {
    display: none;
  }
}

@media (max-width: 1040px) {
  .release-validation-grid { height:auto; grid-template-columns:repeat(2,minmax(0,1fr)); }
  .release-validation-card { min-height:84px; }
}

@media (max-width: 620px) {
  .release-validation-grid { grid-template-columns:1fr; }
}
</style>
