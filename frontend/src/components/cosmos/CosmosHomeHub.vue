<template>
  <div class="home-hub" aria-label="Cosmos home">
    <button class="companion-object" type="button" aria-label="Talk to Companion" @click="$emit('companion')">
      <CompanionAvatar :notification-available="notificationAvailable" />
      <span class="home-hub__label">Companion</span>
    </button>

    <button class="ship-object" type="button" aria-label="Open Base" @click="$emit('ship')">
      <span class="ship-object__vessel" aria-hidden="true">
        <i class="ship-object__wing ship-object__wing--left" />
        <i class="ship-object__wing ship-object__wing--right" />
        <i class="ship-object__body" />
        <i class="ship-object__window" />
        <i class="ship-object__engine ship-object__engine--left" />
        <i class="ship-object__engine ship-object__engine--right" />
      </span>
      <span class="home-hub__label">Base</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import CompanionAvatar from "../entities/CompanionAvatar.vue";

withDefaults(defineProps<{ notificationAvailable?: boolean }>(), { notificationAvailable: false });
defineEmits<{ companion: []; ship: [] }>();
</script>

<style scoped>
.home-hub {
  position: fixed;
  z-index: 22;
  right: clamp(18px, 2.8vw, 48px);
  bottom: clamp(16px, 3vh, 38px);
  display: flex;
  width: clamp(250px, 18vw, 330px);
  height: clamp(155px, 18vh, 225px);
  align-items: flex-end;
  justify-content: flex-end;
  gap: 4px;
  pointer-events: none;
}

.home-hub button {
  position: relative;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--cosmos-color-text);
  cursor: pointer;
  pointer-events: auto;
}

.home-hub__label {
  position: absolute;
  bottom: -17px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(204, 221, 230, 0.64);
  font-size: 0.55rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0;
  transition: opacity 160ms ease;
}

.home-hub button:hover .home-hub__label,
.home-hub button:focus-visible .home-hub__label {
  opacity: 1;
}

.companion-object {
  z-index: 2;
  width: clamp(90px, 7.2vw, 118px);
  height: clamp(90px, 7.2vw, 118px);
  margin-right: -22px;
  margin-bottom: 62px;
  border-radius: 50% !important;
  animation: companion-float 6s ease-in-out infinite;
}

.ship-object {
  width: clamp(180px, 14vw, 250px);
  height: clamp(108px, 10vw, 166px);
}

.ship-object__vessel {
  position: absolute;
  inset: 0;
  filter: drop-shadow(0 16px 18px rgba(0, 0, 0, 0.58));
  transition: transform 180ms ease, filter 180ms ease;
  animation: ship-hover 7s ease-in-out infinite;
}

.ship-object:hover .ship-object__vessel,
.ship-object:focus-visible .ship-object__vessel {
  transform: translateY(-4px) scale(1.03);
  filter: drop-shadow(0 17px 26px rgba(75, 171, 211, 0.18));
}

.ship-object__vessel::before,
.ship-object__vessel::after {
  position: absolute;
  z-index: 3;
  content: "";
}

.ship-object__vessel::before {
  right: 29%;
  bottom: 41%;
  width: 33%;
  height: 4%;
  transform: skewX(-16deg);
  background: linear-gradient(90deg, transparent, rgba(98, 200, 234, 0.86), transparent);
  box-shadow: 0 0 9px rgba(98, 200, 234, 0.42);
}

.ship-object__vessel::after {
  right: 21%;
  bottom: 30%;
  width: 43%;
  height: 2%;
  background: repeating-linear-gradient(90deg, rgba(138, 201, 225, 0.62) 0 5px, transparent 5px 10px);
  opacity: 0.58;
}

.ship-object__body {
  position: absolute;
  right: 8%;
  bottom: 29%;
  left: 13%;
  height: 34%;
  transform: skewX(-10deg);
  border: 1px solid rgba(183, 203, 214, 0.48);
  border-radius: 46% 62% 31% 38%;
  background:
    linear-gradient(175deg, rgba(255, 255, 255, 0.16) 0 2%, transparent 3% 31%, rgba(1, 5, 9, 0.26) 32% 35%, transparent 36%),
    linear-gradient(155deg, #9ca8ae 0 12%, #44535e 44%, #17232d 76%, #0b1118 100%);
  box-shadow: inset 0 3px rgba(255, 255, 255, 0.12), inset -14px -12px 22px rgba(0, 0, 0, 0.38);
  clip-path: polygon(0 48%, 11% 16%, 64% 0, 100% 40%, 91% 75%, 23% 100%);
}

.ship-object__wing {
  position: absolute;
  bottom: 15%;
  width: 51%;
  height: 31%;
  border-top: 1px solid rgba(171, 198, 211, 0.34);
  background: linear-gradient(150deg, #3b4b57, #0b121a 74%);
  clip-path: polygon(0 72%, 100% 4%, 82% 100%, 21% 88%);
}

.ship-object__wing--left { left: 0; }
.ship-object__wing--right { right: 0; transform: scaleX(-1); }

.ship-object__window {
  position: absolute;
  z-index: 2;
  top: 36%;
  left: 58%;
  width: 19%;
  height: 13%;
  transform: skewX(-14deg);
  border: 1px solid rgba(143, 207, 232, 0.45);
  border-radius: 46% 64% 28% 32%;
  background: linear-gradient(145deg, rgba(185, 224, 237, 0.76), rgba(13, 78, 103, 0.7));
  box-shadow: 0 0 13px rgba(75, 177, 215, 0.26);
}

.ship-object__engine {
  position: absolute;
  bottom: 25%;
  width: 13%;
  height: 9%;
  border-radius: 50%;
  background: #8bd3ef;
  box-shadow: 0 0 11px #3ba9d5, -12px 2px 22px rgba(59, 169, 213, 0.38);
}

.ship-object__engine--left { left: 13%; }
.ship-object__engine--right { right: 24%; }

@keyframes companion-float { 50% { transform: translateY(-5px) rotate(1deg); } }
@keyframes ship-hover { 50% { transform: translateY(-3px); } }

@media (prefers-reduced-motion: reduce) {
  .companion-object,
  .ship-object__vessel {
    animation: none;
  }
}
</style>
