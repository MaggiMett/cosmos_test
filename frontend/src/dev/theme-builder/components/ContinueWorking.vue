<template>
  <section class="context-section" aria-labelledby="continue-working-title" data-testid="continue-working">
    <h2 id="continue-working-title" class="builder-serif">Continue Working</h2>
    <div class="working-list">
      <button v-for="item in items" :key="item.name" type="button" class="working-card">
        <span class="working-card__placeholder" aria-hidden="true" />
        <span class="working-card__copy">
          <strong>{{ item.name }}</strong>
          <small>{{ item.type }}</small>
          <span>{{ item.state }}</span>
        </span>
        <BuilderIcon name="chevron" />
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import BuilderIcon from "./BuilderIcon.vue";

export interface WorkingItem {
  name: string;
  type: string;
  state: string;
}

defineProps<{ items: readonly WorkingItem[] }>();
</script>

<style scoped>
.context-section {
  display: grid;
  gap: 14px;
}

.context-section h2 {
  margin: 0;
  font-size: 1.06rem;
}

.working-list {
  display: grid;
  gap: 10px;
}

.working-card {
  display: grid;
  width: 100%;
  min-height: 88px;
  padding: 8px 9px;
  grid-template-columns: 116px minmax(0, 1fr) auto;
  align-items: center;
  border: 1px solid transparent;
  border-radius: var(--builder-radius-card);
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
  transition:
    border-color var(--builder-control-transition),
    background var(--builder-control-transition);
  gap: 13px;
}

.working-card:hover {
  border-color: var(--builder-border);
  background: rgba(255, 255, 255, 0.018);
}

.working-card__placeholder {
  align-self: stretch;
  border: 1px solid var(--builder-border);
  border-radius: 9px;
  background:
    linear-gradient(145deg, transparent 38%, rgba(120, 149, 177, 0.1) 39% 41%, transparent 42%),
    #13191e;
}

.working-card__copy {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.working-card__copy strong,
.working-card__copy small,
.working-card__copy > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.working-card__copy strong {
  color: var(--builder-text);
  font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  font-size: 0.88rem;
  font-weight: 400;
}

.working-card__copy small,
.working-card__copy > span {
  color: var(--builder-muted);
  font-size: 0.68rem;
}

.working-card__copy > span {
  color: #717d87;
}

.working-card > :deep(.builder-icon) {
  width: 0.8rem;
  height: 0.8rem;
  color: var(--builder-faint);
}

@media (max-width: 1280px) {
  .working-card {
    grid-template-columns: 92px minmax(0, 1fr) auto;
  }
}
</style>
