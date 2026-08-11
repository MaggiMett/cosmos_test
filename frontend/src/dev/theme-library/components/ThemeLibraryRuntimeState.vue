<template>
  <section
    class="theme-library-runtime-state"
    :class="`theme-library-runtime-state--${phase}`"
    :role="phase === 'error' ? 'alert' : 'status'"
    aria-live="polite"
    data-testid="theme-library-runtime-state"
  >
    <span aria-hidden="true" />
    <small>Theme Runtime</small>
    <template v-if="phase === 'loading'">
      <h2>Loading your themes</h2>
      <p>Reading the registered Theme Runtime.</p>
    </template>
    <template v-else-if="phase === 'error'">
      <h2>Theme Library is unavailable</h2>
      <p>{{ message ?? "The Theme Runtime could not be read." }}</p>
    </template>
    <template v-else>
      <h2>Active theme unavailable</h2>
      <p v-if="activeThemeId">
        The active Theme ID {{ activeThemeId }} is not present in the registry.
      </p>
      <p v-else>No registered theme is currently active.</p>
    </template>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  phase: "loading" | "error" | "active-missing";
  message?: string;
  activeThemeId?: string | null;
}>();
</script>

<style scoped>
.theme-library-runtime-state {
  display: grid;
  min-width: 0;
  min-height: 0;
  place-content: center;
  justify-items: center;
  overflow: hidden;
  border: 1px solid var(--cosmos-color-border);
  border-radius: var(--cosmos-radius-window);
  background:
    radial-gradient(circle at 50% 42%, rgba(98, 200, 234, 0.07), transparent 28%),
    linear-gradient(145deg, rgba(11, 19, 30, 0.9), rgba(4, 8, 14, 0.94));
  color: var(--cosmos-color-muted);
  text-align: center;
  gap: 9px;
}

.theme-library-runtime-state > span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cosmos-color-accent);
  box-shadow: 0 0 18px rgba(98, 200, 234, 0.28);
}

.theme-library-runtime-state > small {
  color: var(--cosmos-color-faint);
  font-size: 0.58rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.theme-library-runtime-state h2 {
  margin: 0;
  color: #eadfce;
  font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  font-size: 1.75rem;
  font-weight: 400;
}

.theme-library-runtime-state p {
  max-width: 420px;
  margin: 0;
  font-size: 0.7rem;
  line-height: 1.55;
}

.theme-library-runtime-state--loading > span {
  animation: theme-library-pulse 1.8s ease-in-out infinite;
}

.theme-library-runtime-state--error > span,
.theme-library-runtime-state--active-missing > span {
  background: #c79578;
  box-shadow: 0 0 16px rgba(199, 149, 120, 0.28);
}

@keyframes theme-library-pulse {
  50% { opacity: 0.3; transform: scale(0.72); }
}

@media (prefers-reduced-motion: reduce) {
  .theme-library-runtime-state--loading > span { animation: none; }
}
</style>
