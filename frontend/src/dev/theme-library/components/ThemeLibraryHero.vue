<template>
  <section class="theme-library-hero" data-testid="theme-library-hero">
    <div class="theme-library-hero__visual">
      <ThemeLibraryVisual :label="`${theme.name} theme preview`" :tone="theme.tone" variant="hero" />
    </div>
    <div class="theme-library-hero__copy">
      <div class="theme-library-hero__status-row">
        <div>
          <span>Active Theme</span>
          <small v-if="theme.isFallback">Core fallback</small>
        </div>
        <button type="button">Deactivate</button>
      </div>
      <h2>{{ theme.name }}</h2>
      <p>{{ theme.description ?? "Description unavailable" }}</p>
      <dl>
        <div><dt>Theme ID</dt><dd>{{ theme.themeId }}</dd></div>
        <div><dt>Version</dt><dd>{{ theme.version ?? "Unavailable" }}</dd></div>
        <div><dt>Author</dt><dd>{{ theme.author ?? "Unavailable" }}</dd></div>
      </dl>
      <button type="button" class="theme-library-hero__primary" @click="$emit('builder')">
        <span aria-hidden="true">☷</span>
        Open Theme Builder
      </button>
      <div class="theme-library-hero__secondary">
        <button type="button">Preview</button>
        <button type="button">Duplicate</button>
        <button type="button">Export</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ThemeLibraryTheme } from "../themeLibraryProjection";
import ThemeLibraryVisual from "./ThemeLibraryVisual.vue";

defineProps<{ theme: Readonly<ThemeLibraryTheme> }>();
defineEmits<{ builder: [] }>();
</script>

<style scoped>
.theme-library-hero {
  display: grid;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  grid-template-columns: minmax(0, 1.25fr) minmax(520px, 1fr);
  border: 1px solid var(--cosmos-color-border);
  border-radius: var(--cosmos-radius-window);
  background: var(--cosmos-color-surface);
  box-shadow: 0 20px 62px rgba(0, 0, 0, 0.28);
}

.theme-library-hero__visual,
.theme-library-hero__visual > :deep(.theme-visual) {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.theme-library-hero__copy {
  display: grid;
  min-width: 0;
  padding: 20px 28px 16px;
  align-content: center;
  background: linear-gradient(135deg, rgba(11, 19, 30, 0.98), rgba(5, 11, 18, 0.94));
  gap: 7px;
}

.theme-library-hero__status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.theme-library-hero__status-row > div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-library-hero__status-row > div > span {
  padding: 4px 9px;
  border: 1px solid rgba(98, 200, 234, 0.2);
  border-radius: 999px;
  background: rgba(98, 200, 234, 0.1);
  color: #a9d8e8;
  font-size: 0.58rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.theme-library-hero__status-row small {
  color: var(--cosmos-color-muted);
  font-size: 0.56rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.theme-library-hero__status-row button {
  border: 0;
  background: transparent;
  color: var(--cosmos-color-muted);
  cursor: pointer;
  font-size: 0.64rem;
}

.theme-library-hero h2 {
  margin: 0;
  color: #eadfce;
  font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  font-size: 2rem;
  font-weight: 400;
  line-height: 1;
}

.theme-library-hero > .theme-library-hero__copy > p {
  margin: 0;
  color: #b9c2c7;
  font-size: 0.72rem;
}

.theme-library-hero dl {
  display: flex;
  margin: 3px 0 5px;
  color: var(--cosmos-color-muted);
  font-size: 0.64rem;
  gap: 24px;
}

.theme-library-hero dl div {
  display: flex;
  gap: 7px;
}

.theme-library-hero dd {
  max-width: 180px;
  margin: 0;
  overflow: hidden;
  color: #b9c2c7;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.theme-library-hero__primary,
.theme-library-hero__secondary button {
  border: 1px solid var(--cosmos-color-border);
  background: rgba(255, 255, 255, 0.02);
  color: var(--cosmos-color-text);
  cursor: pointer;
}

.theme-library-hero__primary {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border-color: rgba(119, 190, 221, 0.66);
  border-radius: var(--cosmos-radius-control);
  background: linear-gradient(180deg, rgba(71, 128, 162, 0.27), rgba(33, 70, 95, 0.2));
  box-shadow: 0 0 20px rgba(98, 200, 234, 0.12);
  color: #ece3d4;
  font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  font-size: 0.95rem;
  gap: 10px;
}

.theme-library-hero__secondary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.theme-library-hero__secondary button {
  min-height: 30px;
  border-width: 0 1px 0 0;
  background: transparent;
  color: #bdc7cc;
  font-size: 0.67rem;
}

.theme-library-hero__secondary button:last-child {
  border-right: 0;
}
</style>
