<template>
  <section class="showcase-preview" aria-label="Theme showcase preview" data-testid="showcase-preview">
    <NeutralVisualPlaceholder
      label="Theme showcase preview"
      variant="canvas"
      :show-label="true"
    />

    <div class="showcase-preview__world" aria-hidden="true">
      <span class="showcase-preview__window" />
      <span class="showcase-preview__planet" />
      <span class="showcase-preview__cockpit" />
      <span class="showcase-preview__workspace showcase-preview__workspace--left" />
      <span class="showcase-preview__workspace showcase-preview__workspace--right" />
      <span class="showcase-preview__floor" />
    </div>

    <ShowcasePreviewControls />
  </section>
</template>

<script setup lang="ts">
import NeutralVisualPlaceholder from "./NeutralVisualPlaceholder.vue";
import ShowcasePreviewControls from "./ShowcasePreviewControls.vue";
</script>

<style scoped>
.showcase-preview {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--builder-bg-deep);
}

.showcase-preview > :deep(.neutral-visual) {
  position: absolute;
  inset: 8px;
  border: 1px solid var(--builder-border);
  border-radius: var(--builder-radius-card);
  background:
    radial-gradient(circle at 50% 41%, rgba(120, 149, 177, 0.08), transparent 34%),
    linear-gradient(180deg, #161b20, #0b1014 68%);
}

.showcase-preview :deep(.neutral-visual__arch),
.showcase-preview :deep(.neutral-visual__horizon),
.showcase-preview :deep(.neutral-visual__floor) {
  display: none;
}

.showcase-preview :deep(.neutral-visual small) {
  top: 18%;
}

.showcase-preview__world {
  position: absolute;
  inset: 8px;
}

.showcase-preview__window {
  position: absolute;
  top: 15%;
  right: 18%;
  bottom: 35%;
  left: 18%;
  border: 1px solid rgba(212, 220, 225, 0.14);
  border-radius: 48% 48% 20% 20%;
  background:
    radial-gradient(circle at 66% 42%, rgba(120, 149, 177, 0.12), transparent 22%),
    #0b1117;
}

.showcase-preview__planet {
  position: absolute;
  top: 28%;
  left: 44%;
  width: min(18vw, 250px);
  aspect-ratio: 1;
  border: 1px solid rgba(212, 220, 225, 0.14);
  border-radius: 50%;
  background: radial-gradient(circle at 38% 34%, #303942, #11171d 66%);
  box-shadow: 0 0 60px rgba(120, 149, 177, 0.06);
}

.showcase-preview__cockpit {
  position: absolute;
  right: 25%;
  bottom: 24%;
  left: 25%;
  height: 17%;
  border: 1px solid rgba(212, 220, 225, 0.1);
  border-radius: 50% 50% 16px 16px;
  background: linear-gradient(180deg, rgba(32, 39, 45, 0.9), rgba(12, 17, 21, 0.96));
}

.showcase-preview__workspace {
  position: absolute;
  bottom: 15%;
  width: 25%;
  height: 26%;
  border: 1px solid rgba(212, 220, 225, 0.09);
  background: linear-gradient(180deg, #171d22, #0b1014);
}

.showcase-preview__workspace--left {
  left: 2.5%;
  border-radius: 0 30px 12px 0;
  transform: skewY(5deg);
}

.showcase-preview__workspace--right {
  right: 2.5%;
  border-radius: 30px 0 0 12px;
  transform: skewY(-5deg);
}

.showcase-preview__floor {
  position: absolute;
  right: 20%;
  bottom: -24%;
  left: 20%;
  height: 58%;
  border: 1px solid rgba(212, 220, 225, 0.055);
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(120, 149, 177, 0.04), transparent 62%);
}
</style>
