<template>
  <div
    class="theme-visual"
    :class="[`theme-visual--${tone}`, `theme-visual--${variant}`]"
    role="img"
    :aria-label="label"
  >
    <span class="theme-visual__window" />
    <span class="theme-visual__orb" />
    <span class="theme-visual__horizon" />
    <span class="theme-visual__floor" />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    tone?: "cosmos" | "minimal" | "nebula" | "industrial" | "fantasy" | "pixel";
    variant?: "hero" | "card" | "screenshot";
  }>(),
  {
    tone: "cosmos",
    variant: "card",
  },
);
</script>

<style scoped>
.theme-visual {
  --visual-glow: rgba(98, 200, 234, 0.14);
  --visual-line: rgba(197, 222, 233, 0.15);
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 52% 43%, var(--visual-glow), transparent 24%),
    linear-gradient(145deg, #101923, #050a10 72%);
}

.theme-visual::before,
.theme-visual::after {
  position: absolute;
  inset: 0;
  content: "";
  pointer-events: none;
}

.theme-visual::before {
  background-image:
    radial-gradient(circle, rgba(229, 238, 243, 0.28) 0 0.6px, transparent 0.9px),
    radial-gradient(circle, rgba(123, 181, 207, 0.2) 0 0.7px, transparent 1px);
  background-position: 12px 8px, 54px 37px;
  background-size: 61px 61px, 97px 97px;
  opacity: 0.36;
}

.theme-visual::after {
  top: 65%;
  background: linear-gradient(180deg, transparent, rgba(1, 4, 8, 0.76));
}

.theme-visual__window {
  position: absolute;
  inset: 10% 9% 25%;
  border: 1px solid var(--visual-line);
  border-radius: 46% 46% 13px 13px;
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.22);
}

.theme-visual__orb {
  position: absolute;
  top: 30%;
  left: 50%;
  width: 20%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border: 1px solid rgba(220, 233, 239, 0.13);
  border-radius: 50%;
  background: radial-gradient(circle at 34% 30%, rgba(215, 229, 236, 0.16), #111b24 66%);
  box-shadow: 0 0 32px var(--visual-glow);
}

.theme-visual__horizon {
  position: absolute;
  right: 8%;
  bottom: 25%;
  left: 8%;
  height: 1px;
  background: var(--visual-line);
}

.theme-visual__floor {
  position: absolute;
  right: 18%;
  bottom: -28%;
  left: 18%;
  height: 50%;
  transform: perspective(190px) rotateX(58deg);
  border: 1px solid rgba(194, 215, 224, 0.09);
  border-radius: 50% 50% 0 0;
}

.theme-visual--minimal {
  --visual-glow: rgba(226, 211, 183, 0.13);
  --visual-line: rgba(231, 222, 202, 0.18);
  background: radial-gradient(circle at 50% 44%, #4b4a44, transparent 30%), linear-gradient(145deg, #363632, #141615);
}

.theme-visual--nebula {
  --visual-glow: rgba(121, 94, 190, 0.24);
  --visual-line: rgba(151, 179, 215, 0.2);
  background: radial-gradient(circle at 55% 34%, rgba(54, 143, 153, 0.2), transparent 28%), radial-gradient(circle at 30% 70%, rgba(98, 55, 145, 0.25), transparent 32%), linear-gradient(145deg, #101829, #07100f);
}

.theme-visual--industrial {
  --visual-glow: rgba(184, 125, 70, 0.16);
  --visual-line: rgba(194, 152, 111, 0.17);
  background: linear-gradient(135deg, rgba(91, 59, 36, 0.38), transparent 45%), linear-gradient(145deg, #1c1815, #08090a);
}

.theme-visual--fantasy {
  --visual-glow: rgba(107, 137, 194, 0.24);
  --visual-line: rgba(158, 178, 217, 0.18);
  background: radial-gradient(circle at 54% 32%, rgba(101, 146, 205, 0.22), transparent 28%), linear-gradient(145deg, #101827, #090b12);
}

.theme-visual--pixel {
  --visual-glow: rgba(197, 105, 54, 0.18);
  --visual-line: rgba(213, 139, 84, 0.17);
  background: repeating-linear-gradient(90deg, transparent 0 34px, rgba(208, 143, 94, 0.025) 34px 35px), linear-gradient(145deg, #20130f, #09090a);
}

.theme-visual--hero .theme-visual__window {
  inset: 8% 7% 20%;
  border-radius: 48% 48% 18px 18px;
}

.theme-visual--hero .theme-visual__orb {
  top: 36%;
  width: 17%;
}

.theme-visual--screenshot .theme-visual__orb {
  width: 25%;
}
</style>
