<template>
  <section class="base-runtime-window" :aria-label="`${title} window`">
    <header>
      <strong>{{ title }}</strong>
      <button type="button" :aria-label="`Close ${title}`" disabled>×</button>
    </header>
    <div class="base-runtime-window__content">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<style scoped>
.base-runtime-window {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(135, 190, 215, 0.38);
  border-radius: var(--cosmos-radius-window);
  background: linear-gradient(145deg, rgba(8, 15, 23, 0.91), rgba(4, 9, 15, 0.88));
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.48), 0 0 24px rgba(68, 155, 192, 0.08), inset 0 1px rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(16px);
}

.base-runtime-window > header {
  display: flex;
  min-height: 38px;
  padding: 0 8px 0 13px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(181, 211, 225, 0.09);
  background: linear-gradient(180deg, rgba(25, 38, 49, 0.48), rgba(10, 18, 26, 0.24));
}

.base-runtime-window > header strong {
  font-size: 0.58rem;
  font-weight: 560;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.base-runtime-window > header button {
  display: grid;
  width: 25px;
  height: 25px;
  padding: 0;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--cosmos-color-muted);
  cursor: pointer;
  font-size: 1rem;
}

.base-runtime-window > header button:disabled {
  cursor: default;
}

.base-runtime-window__content {
  min-height: 0;
  flex: 1;
}
</style>
