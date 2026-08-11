<template>
  <main class="theme-builder-surface builder-shell" data-testid="theme-builder-shell">
    <StudioRail :active-studio="activeStudio" :builder-project-id="builderProjectId" />
    <BuilderTopNavigation
      :studio-label="studioLabel"
      :interactive="interactive"
      :dirty="dirty"
      :saving="saving"
      :can-save="canSave"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :builder-project-id="builderProjectId"
      @save="$emit('save')"
      @undo="$emit('undo')"
      @redo="$emit('redo')"
    />
    <section class="builder-shell__canvas" data-testid="builder-canvas-layout">
      <slot />
    </section>
    <aside class="builder-shell__context" aria-label="Theme context" data-testid="right-context-panel">
      <slot name="context" />
    </aside>
  </main>
</template>

<script setup lang="ts">
import BuilderTopNavigation from "./BuilderTopNavigation.vue";
import StudioRail from "./StudioRail.vue";

defineProps<{
  activeStudio: string;
  studioLabel: string;
  interactive?: boolean;
  dirty?: boolean;
  saving?: boolean;
  canSave?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  builderProjectId?: string;
}>();

defineEmits<{ save: []; undo: []; redo: [] }>();
</script>

<style scoped>
.builder-shell {
  display: grid;
  width: 100%;
  height: 100%;
  min-width: 1024px;
  min-height: 720px;
  grid-template-columns: 72px minmax(0, 1fr) 370px;
  grid-template-rows: 64px minmax(0, 1fr);
  overflow: hidden;
  background:
    radial-gradient(circle at 88% 22%, rgba(120, 149, 177, 0.035), transparent 30%),
    var(--builder-bg);
}

.builder-shell > :deep(.builder-topbar) {
  grid-column: 2 / -1;
}

.builder-shell__canvas,
.builder-shell__context {
  min-width: 0;
  min-height: 0;
}

.builder-shell__canvas {
  overflow: auto;
  scrollbar-color: rgba(154, 164, 172, 0.18) transparent;
}

.builder-shell__context {
  overflow: auto;
  border-left: 1px solid var(--builder-border);
  background:
    linear-gradient(180deg, rgba(13, 18, 23, 0.52), rgba(8, 12, 16, 0.18)),
    transparent;
  scrollbar-color: rgba(154, 164, 172, 0.18) transparent;
}

@media (max-width: 1280px) {
  .builder-shell {
    grid-template-columns: 72px minmax(0, 1fr) 320px;
  }
}
</style>
