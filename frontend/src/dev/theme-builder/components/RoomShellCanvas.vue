<template>
  <section class="room-shell-canvas" aria-label="Room Shell canvas" data-testid="room-shell-canvas">
    <header class="room-shell-canvas__toolbar">
      <BuilderSegmentedControl
        label="Room Shell work mode"
        :options="modes"
        active-option="Art"
      />
      <div class="room-shell-canvas__zoom" aria-label="Canvas zoom">
        <button type="button">Fit</button>
        <button type="button" aria-label="Zoom out">−</button>
        <span>100%</span>
        <button type="button" aria-label="Zoom in">＋</button>
      </div>
    </header>
    <div class="room-shell-canvas__stage">
      <NeutralVisualPlaceholder
        label="Room Shell canvas"
        variant="canvas"
        :show-label="true"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import BuilderSegmentedControl from "./BuilderSegmentedControl.vue";
import NeutralVisualPlaceholder from "./NeutralVisualPlaceholder.vue";

const modes = ["Art", "Structure", "Responsive"] as const;
</script>

<style scoped>
.room-shell-canvas {
  display: grid;
  min-width: 0;
  min-height: 0;
  padding: 8px 12px 6px;
  grid-template-rows: 46px minmax(0, 1fr);
  background: rgba(5, 9, 12, 0.24);
}

.room-shell-canvas__toolbar {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.room-shell-canvas__zoom {
  display: flex;
  align-items: center;
  color: var(--builder-muted);
  font-size: 0.7rem;
  gap: 7px;
}

.room-shell-canvas__zoom button {
  min-width: 34px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: var(--builder-radius-control);
  background: transparent;
  color: var(--builder-text);
  cursor: pointer;
}

.room-shell-canvas__zoom button:hover {
  border-color: var(--builder-border);
  background: rgba(255, 255, 255, 0.02);
}

.room-shell-canvas__zoom span {
  min-width: 42px;
  text-align: center;
}

.room-shell-canvas__stage {
  min-width: 0;
  min-height: 0;
  padding: 4px;
  border: 1px solid var(--builder-border);
  border-radius: var(--builder-radius-card);
  background: rgba(13, 18, 23, 0.52);
}

.room-shell-canvas__stage > :deep(.neutral-visual) {
  width: 100%;
  height: 100%;
}
</style>
