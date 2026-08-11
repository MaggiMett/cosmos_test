<template>
  <CompanionConversation
    v-if="windowInstance"
    :bounds="windowInstance.bounds"
    :current-location="currentLocation"
    :context="context"
    @close="close"
    @focus="focus"
    @move="move"
    @resize="resize"
    @destination="$emit('destination', $event)"
  />
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";

import { useCosmosRuntime } from "../../runtime/plugin";
import type { CompanionContext } from "../../runtime/cosmosMapRuntime";
import type { WindowInstance } from "../../runtime/windowRuntime";
import CompanionConversation from "./CompanionConversation.vue";

defineProps<{ currentLocation: string; context?: CompanionContext }>();
defineEmits<{ destination: [objectId: string] }>();

const runtime = useCosmosRuntime();
const windowInstance = ref<Readonly<WindowInstance> | null>(null);

function open() {
  void runtime.notifications.load().catch(() => undefined);
  if (windowInstance.value) {
    focus();
    return;
  }
  const width = Math.min(520, window.innerWidth - 40);
  const height = Math.min(560, window.innerHeight - 160);
  windowInstance.value = runtime.windows.open({
    objectId: "cosmos.window.tool.companion-conversation",
    role: "tool",
    title: "Companion",
    bounds: { x: Math.max(20, window.innerWidth - width - 54), y: 92, width, height },
    minimumSize: { width: 360, height: 360 },
  });
}

function close() {
  if (!windowInstance.value) return;
  runtime.windows.close(windowInstance.value.objectId);
  windowInstance.value = null;
}

function focus() {
  if (windowInstance.value) {
    windowInstance.value = runtime.windows.focus(windowInstance.value.objectId);
  }
}

function move(position: { x: number; y: number }) {
  if (windowInstance.value) {
    windowInstance.value = runtime.windows.move(windowInstance.value.objectId, position);
  }
}

function resize(size: { width: number; height: number }) {
  if (windowInstance.value) {
    windowInstance.value = runtime.windows.resize(windowInstance.value.objectId, size);
  }
}

defineExpose({ open, close });
onBeforeUnmount(close);
</script>
