<template>
  <BaseRuntimeWindow :title="workspace?.displayName ?? 'Creation'">
    <div class="capture-window" data-testid="base-capture-window">
      <div
        class="capture-window__visual"
        role="img"
        :aria-label="workspace ? `${workspace.displayName} visual placeholder` : 'Creation Workspace unavailable'"
        :data-workspace-id="workspace?.workspaceObjectId"
      >
        <span v-for="index in 5" :key="index" :class="`capture-window__sample--${index}`" />
      </div>
      <div v-if="workspace" class="capture-window__copy">
        <strong>{{ workspace.displayName }}</strong>
        <p>{{ workspace.description || "No Workspace description available." }}</p>
        <small>{{ workspace.sourceProjectId || "Source Project unavailable" }}</small>
      </div>
      <p v-else class="capture-window__unavailable">Creation Workspace unavailable</p>
    </div>
  </BaseRuntimeWindow>
</template>

<script setup lang="ts">
import BaseRuntimeWindow from "./BaseRuntimeWindow.vue";
import type { BaseWorkspaceSlotPresentation } from "../baseRuntimeProjection";

defineProps<{ workspace: Readonly<BaseWorkspaceSlotPresentation> | null }>();
</script>

<style scoped>
.capture-window {
  display: grid;
  height: 100%;
  min-height: 0;
  padding: 10px 12px 13px;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 10px;
}

.capture-window__visual {
  position: relative;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--cosmos-color-border);
  border-radius: var(--cosmos-radius-control);
  background: linear-gradient(145deg, #292621, #0d1113 74%);
}

.capture-window__visual::before {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(90deg, transparent 0 44px, rgba(227, 199, 157, 0.03) 44px 45px);
  content: "";
}

.capture-window__visual span {
  position: absolute;
  width: 62px;
  height: 28px;
  transform: rotate(-14deg);
  border: 1px solid rgba(218, 197, 163, 0.15);
  background: linear-gradient(145deg, #534c41, #17191a);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.36);
}

.capture-window__sample--1 { top: 18px; left: 14px; }
.capture-window__sample--2 { top: 28px; right: 16px; }
.capture-window__sample--3 { bottom: 17px; left: 48px; }
.capture-window__sample--4 { right: 52px; bottom: 28px; }
.capture-window__sample--5 { top: 48%; left: 47%; width: 24px !important; height: 24px !important; border-radius: 50%; }

.capture-window__copy {
  display: grid;
  align-items: center;
  gap: 4px;
}

.capture-window__copy strong,
.capture-window__copy p,
.capture-window__copy small { min-width: 0; }

.capture-window__copy strong {
  color: #e4ddd2;
  font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  font-size: 0.82rem;
  font-weight: 400;
}

.capture-window__copy p {
  margin: 0;
  color: var(--cosmos-color-muted);
  font-size: 0.59rem;
}

.capture-window__copy small {
  overflow: hidden;
  color: var(--cosmos-color-faint);
  font-size: 0.52rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.capture-window__unavailable {
  margin: 0;
  place-self: center;
  color: var(--cosmos-color-muted);
  font-size: 0.62rem;
}
</style>
