<template>
  <RouterView v-if="route.meta.developmentPreview || route.meta.standaloneExperience" />
  <ApplicationShell v-else />
</template>

<script setup lang="ts">
import { RouterView, useRoute } from "vue-router";

import ApplicationShell from "./shell/ApplicationShell.vue";

const route = useRoute();
</script>
