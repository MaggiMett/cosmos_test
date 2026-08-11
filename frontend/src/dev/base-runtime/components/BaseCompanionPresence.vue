<template>
  <button
    v-if="companion"
    type="button"
    class="base-companion-presence"
    data-testid="base-companion-presence"
    :aria-label="`Open ${companion.displayName}`"
    @click="$emit('open')"
  >
      <div class="base-companion-presence__avatar" :data-companion-id="companion.objectId">
        <CompanionAvatar
          mode="compact"
          :notification-available="companion.notificationAvailable"
        />
      </div>
      <div class="base-companion-presence__message">
        <strong><span aria-hidden="true">✦</span> {{ companion.displayName }}</strong>
        <p>{{ companion.description || "Available in Base" }}</p>
      </div>
  </button>
  <div v-else class="base-companion-presence" data-testid="base-companion-presence">
    <p class="base-companion-presence__unavailable">Companion unavailable</p>
  </div>
</template>

<script setup lang="ts">
import CompanionAvatar from "../../../components/entities/CompanionAvatar.vue";
import type { BaseCompanionPresentation } from "../baseRuntimeProjection";

defineProps<{ companion: Readonly<BaseCompanionPresentation> | null }>();
defineEmits<{ open: [] }>();
</script>

<style scoped>
.base-companion-presence {
  position: absolute;
  z-index: 13;
  bottom: 12%;
  left: 50%;
  width: 310px;
  height: 130px;
  transform: translateX(-18%);
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: initial;
}

.base-companion-presence:focus-visible {
  border-radius: var(--cosmos-radius-window);
  outline: 2px solid var(--cosmos-color-accent);
  outline-offset: 4px;
}

.base-companion-presence__avatar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 92px;
  height: 92px;
  padding: 10px;
  border: 1px solid rgba(181, 211, 225, 0.14);
  border-radius: 50%;
  background: rgba(7, 13, 19, 0.88);
  box-shadow: 0 18px 28px rgba(0, 0, 0, 0.4);
}

.base-companion-presence__message {
  position: absolute;
  right: 0;
  bottom: 10px;
  width: 190px;
  padding: 11px 14px;
  border: 1px solid rgba(110, 173, 204, 0.42);
  border-radius: var(--cosmos-radius-window);
  background: rgba(8, 17, 26, 0.88);
  box-shadow: 0 15px 34px rgba(0, 0, 0, 0.34), 0 0 18px rgba(78, 166, 204, 0.08);
  backdrop-filter: blur(12px);
}

.base-companion-presence__message strong {
  display: flex;
  align-items: center;
  color: #dce5e8;
  font-size: 0.67rem;
  font-weight: 520;
  gap: 7px;
}

.base-companion-presence__message strong span {
  color: var(--cosmos-color-accent);
}

.base-companion-presence__message p {
  margin: 6px 0 0 18px;
  color: var(--cosmos-color-muted);
  font-size: 0.64rem;
}

.base-companion-presence__unavailable {
  position: absolute;
  right: 0;
  bottom: 10px;
  margin: 0;
  padding: 10px 13px;
  border: 1px solid var(--cosmos-color-border);
  border-radius: var(--cosmos-radius-window);
  background: rgba(8, 17, 26, 0.72);
  color: var(--cosmos-color-muted);
  font-size: 0.62rem;
}
</style>
