<template>
  <section class="coverage" aria-labelledby="theme-coverage-title" data-testid="theme-coverage">
    <h2 id="theme-coverage-title" class="builder-serif">Theme Coverage</h2>
    <div class="coverage__grid">
      <div v-for="item in items" :key="item.label" class="coverage__item">
        <BuilderIcon :name="item.icon" />
        <span>{{ item.label }}</span>
        <i :class="`coverage__status--${item.status}`" :aria-label="statusLabel(item.status)" />
      </div>
    </div>
    <p>
      <span class="coverage__legend-dot coverage__legend-dot--custom" />
      Own look
      <span class="coverage__legend-dot" />
      Uses Core Fallback
    </p>
  </section>
</template>

<script setup lang="ts">
import BuilderIcon from "./BuilderIcon.vue";

export type CoverageStatus = "custom" | "partial" | "fallback" | "attention";

export interface CoverageItem {
  label: string;
  icon: string;
  status: CoverageStatus;
}

defineProps<{ items: readonly CoverageItem[] }>();

function statusLabel(status: CoverageStatus): string {
  return {
    custom: "Own look available",
    partial: "Partially customized",
    fallback: "Uses Core Fallback",
    attention: "Needs attention",
  }[status];
}
</script>

<style scoped>
.coverage {
  display: grid;
  padding: 20px;
  border: 1px solid rgba(154,174,191,.12);
  border-radius: var(--builder-radius-card);
  background: linear-gradient(145deg, rgba(21,28,34,.72), rgba(10,15,19,.52));
  gap: 18px;
}

.coverage h2 {
  margin: 0;
  font-size: 1.06rem;
}

.coverage__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 22px;
}

.coverage__item {
  display: grid;
  min-width: 0;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  align-items: center;
  color: #c2c1bd;
  font-size: 0.73rem;
  gap: 10px;
}

.coverage__item :deep(.builder-icon) {
  width: 1.2rem;
  height: 1.2rem;
  color: #b7b9ba;
}

.coverage__item i,
.coverage__legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #a7aaad;
  box-shadow: 0 0 8px rgba(210, 216, 220, 0.15);
}

.coverage__item .coverage__status--custom,
.coverage__legend-dot--custom {
  background: #74a9d6;
  box-shadow: 0 0 9px rgba(116, 169, 214, 0.45);
}

.coverage__item .coverage__status--partial {
  background: linear-gradient(90deg, #74a9d6 50%, #a7aaad 50%);
}

.coverage__item .coverage__status--attention {
  background: #b89165;
}

.coverage p {
  display: flex;
  margin: 0;
  align-items: center;
  color: var(--builder-faint);
  font-size: 0.63rem;
  gap: 7px;
}

.coverage p .coverage__legend-dot:not(:first-child) {
  margin-left: 9px;
}
</style>
