<template>
  <section class="builder-accordion" :class="{ 'builder-accordion--open': open }">
    <button
      type="button"
      class="builder-accordion__heading"
      :aria-expanded="open"
    >
      <span class="builder-serif">{{ title }}</span>
      <span aria-hidden="true">{{ open ? "⌃" : "⌄" }}</span>
    </button>
    <div v-if="open" class="builder-accordion__content">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    open?: boolean;
  }>(),
  { open: false },
);
</script>

<style scoped>
.builder-accordion {
  border-bottom: 1px solid var(--builder-border);
}

.builder-accordion__heading {
  display: flex;
  width: 100%;
  min-height: 52px;
  padding: 0 4px;
  align-items: center;
  justify-content: space-between;
  border: 0;
  background: transparent;
  color: var(--builder-text);
  cursor: pointer;
  text-align: left;
}

.builder-accordion__heading > span:first-child {
  font-size: 0.92rem;
}

.builder-accordion__heading > span:last-child {
  color: var(--builder-muted);
  font-size: 0.75rem;
}

.builder-accordion__content {
  padding: 0 4px 19px;
}
</style>
