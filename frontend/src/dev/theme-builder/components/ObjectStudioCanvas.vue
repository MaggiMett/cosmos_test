<template>
  <section class="object-studio-canvas" aria-label="Object canvas" data-testid="object-studio-canvas">
    <header class="object-studio-canvas__toolbar">
      <BuilderSegmentedControl
        label="Object work mode"
        :options="modes"
        active-option="Art"
      />
      <div class="object-studio-canvas__zoom" aria-label="Canvas zoom">
        <button type="button">Fit</button>
        <button type="button" aria-label="Zoom out">−</button>
        <span>100%</span>
        <button type="button" aria-label="Zoom in">＋</button>
      </div>
    </header>

    <div class="object-studio-canvas__stage">
      <NeutralVisualPlaceholder
        label="Object canvas"
        variant="canvas"
        :show-label="true"
      />
      <div class="object-studio-canvas__object" aria-hidden="true">
        <span class="object-studio-canvas__orbit object-studio-canvas__orbit--rear" />
        <span class="object-studio-canvas__core" />
        <span class="object-studio-canvas__orbit object-studio-canvas__orbit--front" />
        <span class="object-studio-canvas__base" />
      </div>
      <span class="object-studio-canvas__podium" aria-hidden="true" />
    </div>
  </section>
</template>

<script setup lang="ts">
import BuilderSegmentedControl from "./BuilderSegmentedControl.vue";
import NeutralVisualPlaceholder from "./NeutralVisualPlaceholder.vue";

const modes = ["Art", "Structure", "Responsive"] as const;
</script>

<style scoped>
.object-studio-canvas {
  display: grid;
  min-width: 0;
  min-height: 0;
  padding: 12px 16px 14px;
  grid-template-rows: 50px minmax(0, 1fr);
  background: radial-gradient(circle at 50% 18%, rgba(120,149,177,.045), transparent 32%), rgba(5, 9, 12, 0.24);
}

.object-studio-canvas__toolbar {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.object-studio-canvas__zoom {
  display: flex;
  align-items: center;
  color: var(--builder-muted);
  font-size: 0.7rem;
  gap: 7px;
}

.object-studio-canvas__zoom button {
  min-width: 34px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: var(--builder-radius-control);
  background: transparent;
  color: var(--builder-text);
  cursor: pointer;
}

.object-studio-canvas__zoom button:hover {
  border-color: var(--builder-border);
  background: rgba(255, 255, 255, 0.02);
}

.object-studio-canvas__zoom span {
  min-width: 42px;
  text-align: center;
}

.object-studio-canvas__stage {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(154,174,191,.15);
  border-radius: var(--builder-radius-panel);
  background: rgba(13, 18, 23, 0.52);
  box-shadow: var(--builder-shadow-card), inset 0 1px rgba(255,255,255,.02);
}

.object-studio-canvas__stage > :deep(.neutral-visual) {
  position: absolute;
  inset: 4px;
}

.object-studio-canvas__stage :deep(.neutral-visual__arch),
.object-studio-canvas__stage :deep(.neutral-visual__horizon),
.object-studio-canvas__stage :deep(.neutral-visual__floor) {
  display: none;
}

.object-studio-canvas__stage :deep(.neutral-visual) {
  background:
    radial-gradient(ellipse at 50% 66%, rgba(120, 149, 177, 0.065), transparent 38%),
    linear-gradient(180deg, #181b1e, #101417 58%, #0c1013 59%);
}

.object-studio-canvas__stage :deep(.neutral-visual small) {
  top: 15%;
}

.object-studio-canvas__podium {
  position: absolute;
  bottom: 7%;
  left: 50%;
  width: min(52%, 480px);
  height: 8%;
  border: 1px solid rgba(212, 220, 225, 0.1);
  border-radius: 50%;
  background: linear-gradient(180deg, #23292d, #0c1013);
  box-shadow: 0 22px 40px rgba(0, 0, 0, 0.3);
  transform: translateX(-50%);
}

.object-studio-canvas__object {
  position: absolute;
  bottom: 14%;
  left: 50%;
  z-index: 2;
  width: min(30%, 255px);
  height: 62%;
  transform: translateX(-50%);
}

.object-studio-canvas__core {
  position: absolute;
  top: 11%;
  bottom: 8%;
  left: 39%;
  width: 22%;
  border: 1px solid rgba(212, 220, 225, 0.22);
  border-radius: 40px 40px 9px 9px;
  background: linear-gradient(90deg, #252b30, #6d7272 49%, #252b30);
  box-shadow: 0 0 40px rgba(209, 205, 194, 0.08);
}

.object-studio-canvas__base {
  position: absolute;
  right: 17%;
  bottom: 0;
  left: 17%;
  height: 11%;
  border: 1px solid rgba(212, 220, 225, 0.17);
  border-radius: 50%;
  background: #191e22;
}

.object-studio-canvas__orbit {
  position: absolute;
  inset: 8% 7% 13%;
  border: 2px solid rgba(175, 166, 150, 0.32);
  border-radius: 50%;
}

.object-studio-canvas__orbit--rear {
  transform: rotate(-18deg) scaleX(0.54);
}

.object-studio-canvas__orbit--front {
  inset: 22% -12% 26%;
  transform: rotate(18deg) scaleY(0.54);
}
</style>
