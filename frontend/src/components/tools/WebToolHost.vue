<template>
  <iframe
    class="web-tool-host"
    :src="entryPoint"
    :title="title"
    sandbox="allow-forms allow-modals allow-popups allow-scripts allow-same-origin"
    referrerpolicy="no-referrer"
  />
</template>

<script setup lang="ts">
defineProps<{
  entryPoint: string;
  title: string;
}>();
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
