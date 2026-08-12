<template>
  <CosmosPresenterView background-only />
  <BaseRuntimeView
    navigation-scope="production"
    :background-only="backgroundOnly"
    data-base-presenter="new"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";

import CosmosPresenterView from "./CosmosPresenterView.vue";

const BaseRuntimeView = defineAsyncComponent(
  () => import("../dev/base-runtime/BaseRuntimeView.vue"),
);

withDefaults(defineProps<{
  backgroundOnly?: boolean;
}>(), {
  backgroundOnly: false,
});
</script>
