<template>
  <div
    class="neutral-visual"
    :class="`neutral-visual--${variant}`"
    :aria-label="label"
    role="img"
  >
    <span class="neutral-visual__arch" />
    <span class="neutral-visual__horizon" />
    <span class="neutral-visual__floor" />
    <small v-if="showLabel">{{ label }}</small>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    variant?: "canvas" | "thumbnail";
    showLabel?: boolean;
  }>(),
  {
    variant: "thumbnail",
    showLabel: false,
  },
);
</script>

<style scoped>
.neutral-visual {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 46%, rgba(120, 149, 177, 0.07), transparent 38%),
    linear-gradient(180deg, #151b20, #0d1216);
  color: var(--builder-faint);
}

.neutral-visual__arch {
  position: absolute;
  inset: 11% 10% 24%;
  border: 1px solid rgba(212, 220, 225, 0.1);
  border-bottom-color: rgba(212, 220, 225, 0.05);
  border-radius: 48% 48% 16px 16px;
}

.neutral-visual__horizon {
  position: absolute;
  right: 12%;
  bottom: 27%;
  left: 12%;
  height: 1px;
  background: rgba(212, 220, 225, 0.09);
}

.neutral-visual__floor {
  position: absolute;
  right: 22%;
  bottom: -22%;
  left: 22%;
  height: 46%;
  border: 1px solid rgba(212, 220, 225, 0.055);
  transform: perspective(160px) rotateX(58deg);
}

.neutral-visual small {
  position: absolute;
  top: 50%;
  left: 50%;
  color: #626b72;
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transform: translate(-50%, -50%);
}

.neutral-visual--canvas {
  border-radius: var(--builder-radius-card);
}

.neutral-visual--canvas .neutral-visual__arch {
  inset: 8% 7% 18%;
  border-radius: 48% 48% 24px 24px;
}

.neutral-visual--canvas .neutral-visual__horizon {
  right: 9%;
  bottom: 21%;
  left: 9%;
}

.neutral-visual--thumbnail .neutral-visual__arch {
  border-radius: 44% 44% 7px 7px;
}
</style>
