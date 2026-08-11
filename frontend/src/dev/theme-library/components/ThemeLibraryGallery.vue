<template>
  <div class="theme-gallery" data-testid="theme-library-gallery">
    <article
      v-for="theme in themes"
      :key="theme.themeId"
      class="theme-card"
      :class="{ 'theme-card--selected': theme.status === 'Active' }"
      :data-theme-id="theme.themeId"
    >
      <div class="theme-card__visual">
        <ThemeLibraryVisual :label="`${theme.name} preview`" :tone="theme.tone" variant="card" />
        <div class="theme-card__hover-actions">
          <button
            type="button"
            :disabled="theme.status === 'Active' || activatingThemeId !== null"
            :aria-busy="activatingThemeId === theme.themeId"
            @click="$emit('activate', theme.themeId)"
          >
            {{
              theme.status === "Active"
                ? "Active"
                : activatingThemeId === theme.themeId
                  ? "Activating…"
                  : "Activate"
            }}
          </button>
          <button type="button">Preview</button>
          <button type="button" @click="$emit('builder')">Open Builder</button>
        </div>
      </div>
      <footer>
        <strong>{{ theme.name }}</strong>
        <p>{{ theme.description ?? theme.themeId }}</p>
        <div>
          <span>{{ theme.version ?? "Version unavailable" }} · {{ theme.author ?? "Author unavailable" }}</span>
          <span :class="`theme-card__status--${theme.status.toLowerCase()}`">
            <i aria-hidden="true" />{{ theme.status }}
          </span>
        </div>
      </footer>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { ThemeLibraryTheme } from "../themeLibraryProjection";
import ThemeLibraryVisual from "./ThemeLibraryVisual.vue";

defineProps<{
  themes: readonly Readonly<ThemeLibraryTheme>[];
  activatingThemeId: string | null;
}>();

defineEmits<{ activate: [themeId: string]; builder: [] }>();
</script>

<style scoped>
.theme-gallery {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 11px;
}

.theme-card {
  display: grid;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  grid-template-rows: minmax(0, 1fr) 79px;
  border: 1px solid var(--cosmos-color-border);
  border-radius: var(--cosmos-radius-window);
  background: rgba(7, 13, 22, 0.92);
}

.theme-card--selected {
  border-color: rgba(119, 190, 221, 0.7);
  box-shadow: 0 0 18px rgba(98, 200, 234, 0.13);
}

.theme-card__visual {
  position: relative;
  min-height: 0;
  overflow: hidden;
}

.theme-card__visual > :deep(.theme-visual) {
  width: 100%;
  height: 100%;
}

.theme-card__hover-actions {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  height: 31px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  background: rgba(4, 9, 15, 0.88);
  backdrop-filter: blur(8px);
}

.theme-card__hover-actions button {
  border: 0;
  border-right: 1px solid var(--cosmos-color-border);
  background: transparent;
  color: #c5d0d5;
  cursor: pointer;
  font-size: 0.57rem;
}

.theme-card__hover-actions button:last-child {
  border-right: 0;
}

.theme-card__hover-actions button:disabled {
  color: #8799a2;
  cursor: default;
  opacity: 1;
}

.theme-card footer {
  display: grid;
  min-width: 0;
  padding: 8px 12px;
  align-content: center;
  gap: 3px;
}

.theme-card footer strong {
  overflow: hidden;
  color: #eadfce;
  font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  font-size: 0.88rem;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.theme-card footer p {
  margin: 0;
  overflow: hidden;
  color: var(--cosmos-color-muted);
  font-size: 0.6rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.theme-card footer > div {
  display: flex;
  min-width: 0;
  justify-content: space-between;
  color: var(--cosmos-color-muted);
  font-size: 0.57rem;
  gap: 8px;
}

.theme-card footer > div > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.theme-card footer > div > span:last-child {
  display: flex;
  align-items: center;
  white-space: nowrap;
  gap: 5px;
}

.theme-card footer i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--cosmos-color-accent);
}

.theme-card__status--active i {
  background: var(--cosmos-color-green);
}

.theme-card__status--inactive i {
  background: var(--cosmos-color-faint);
}
</style>
