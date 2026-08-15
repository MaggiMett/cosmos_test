<template>
  <div class="builder-segmented-control" :aria-label="label">
    <button
      v-for="option in options"
      :key="option"
      type="button"
      :class="{ 'builder-segmented-control__option--active': option === activeOption }"
      :aria-pressed="option === activeOption"
      @click="$emit('change', option)"
    >
      {{ option }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  options: readonly string[];
  activeOption: string;
}>();
defineEmits<{ change: [option: string] }>();
</script>

<style scoped>
.builder-segmented-control {
  display: inline-grid;
  overflow: hidden;
  grid-auto-flow: column;
  grid-auto-columns: minmax(104px, 1fr);
  border: 1px solid var(--builder-border);
  border-radius: var(--builder-radius-control);
  background: rgba(5, 9, 12, 0.26);
}

.builder-segmented-control button {
  min-height: 36px;
  padding: 0 18px;
  border: 0;
  border-right: 1px solid var(--builder-border);
  background: transparent;
  color: var(--builder-muted);
  cursor: pointer;
  font-size: 0.72rem;
  transition:
    background var(--builder-control-transition),
    color var(--builder-control-transition);
}

.builder-segmented-control button:last-child {
  border-right: 0;
}

.builder-segmented-control button:hover {
  background: rgba(255,255,255,.018);
  color: var(--builder-text);
}

.builder-segmented-control__option--active {
  background: linear-gradient(180deg, rgba(120,149,177,.2), rgba(120,149,177,.1)) !important;
  box-shadow: inset 0 0 0 1px rgba(120, 149, 177, 0.45), 0 5px 16px rgba(0,0,0,.12);
  color: var(--builder-text) !important;
}
</style>
