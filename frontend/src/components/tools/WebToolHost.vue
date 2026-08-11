<template>
  <iframe
    class="web-tool-host"
    :src="entryPoint"
    :title="title"
    :sandbox="sandbox"
    referrerpolicy="no-referrer"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";

import { resolveWebSandbox } from "../../runtime/webHostPolicy";

const props = defineProps<{
  entryPoint: string;
  runtimeConfiguration: Record<string, unknown>;
  title: string;
}>();

const sandbox = computed(() => resolveWebSandbox(props.runtimeConfiguration));
</script>

<style scoped>
.web-tool-host {
  width: 100%;
  height: 100%;
  display: block;
  border: 0;
  background: var(--cosmos-surface, #111);
}
</style>
