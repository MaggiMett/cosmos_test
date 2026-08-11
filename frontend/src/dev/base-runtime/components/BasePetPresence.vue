<template>
  <button
    v-if="pet"
    type="button"
    class="base-pet-presence"
    :class="{ 'base-pet-presence--greeting': greeting }"
    :aria-label="`Pet ${pet.displayName}`"
    :data-pet-id="pet.objectId"
    @click="greet"
  >
    <span class="base-pet-presence__tail" aria-hidden="true" />
    <span class="base-pet-presence__body" aria-hidden="true"><i /><i /></span>
    <span class="base-pet-presence__head" aria-hidden="true"><i /><i /><b /><b /></span>
    <small>{{ greeting ? "Hello!" : pet.displayName }}</small>
  </button>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";

import type { BasePetPresentation } from "../baseRuntimeProjection";

defineProps<{ pet: Readonly<BasePetPresentation> | null }>();

const greeting = ref(false);
let greetingTimer: ReturnType<typeof setTimeout> | null = null;

function greet() {
  greeting.value = true;
  if (greetingTimer) clearTimeout(greetingTimer);
  greetingTimer = setTimeout(() => {
    greeting.value = false;
    greetingTimer = null;
  }, 1600);
}

onBeforeUnmount(() => {
  if (greetingTimer) clearTimeout(greetingTimer);
});
</script>

<style scoped>
.base-pet-presence {
  position: absolute;
  z-index: 14;
  right: 29%;
  bottom: 9%;
  width: 84px;
  height: 70px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #d8e8e4;
  cursor: pointer;
  opacity: 0.78;
}

.base-pet-presence__body,
.base-pet-presence__head,
.base-pet-presence__tail { position: absolute; display: block; }

.base-pet-presence__body {
  right: 12%;
  bottom: 17px;
  width: 54px;
  height: 34px;
  border-radius: 50% 50% 42% 45%;
  background: linear-gradient(135deg, #7b8e8b, #354743);
}

.base-pet-presence__body i {
  position: absolute;
  bottom: -8px;
  width: 7px;
  height: 16px;
  border-radius: 3px;
  background: #405752;
}

.base-pet-presence__body i:first-child { left: 11px; }
.base-pet-presence__body i:last-child { right: 10px; }

.base-pet-presence__head {
  right: 1%;
  bottom: 31px;
  width: 31px;
  height: 29px;
  border-radius: 44%;
  background: #687b77;
}

.base-pet-presence__head i {
  position: absolute;
  top: -7px;
  width: 11px;
  height: 14px;
  background: #566b66;
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}

.base-pet-presence__head i:first-child { left: 0; transform: rotate(-15deg); }
.base-pet-presence__head i:nth-child(2) { right: 0; transform: rotate(15deg); }
.base-pet-presence__head b { position: absolute; top: 11px; width: 4px; height: 4px; border-radius: 50%; background: #122127; }
.base-pet-presence__head b:nth-child(3) { left: 7px; }
.base-pet-presence__head b:last-child { right: 7px; }

.base-pet-presence__tail {
  bottom: 25px;
  left: 7px;
  width: 35px;
  height: 14px;
  border-top: 7px solid #6f9389;
  border-radius: 60% 0 0;
  transform-origin: 100% 50%;
}

.base-pet-presence small {
  position: absolute;
  right: 0;
  bottom: -4px;
  left: 0;
  font-size: 0.56rem;
  opacity: 0;
}

.base-pet-presence:hover small,
.base-pet-presence:focus-visible small,
.base-pet-presence--greeting small { opacity: 0.82; }

.base-pet-presence:focus-visible {
  border-radius: 12px;
  outline: 2px solid rgba(138, 230, 198, 0.65);
}

.base-pet-presence--greeting { animation: base-pet-hop 440ms ease-in-out 2 alternate; }

@keyframes base-pet-hop {
  to { transform: translateY(-8px) rotate(-2deg); }
}

@media (prefers-reduced-motion: reduce) {
  .base-pet-presence--greeting { animation: none; }
}
</style>
