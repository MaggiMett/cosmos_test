<template>
  <CosmosProjectView
    v-if="projectId"
    navigation-scope="production"
    :background-only="backgroundOnly"
    :inert="backgroundOnly || undefined"
    :aria-hidden="backgroundOnly ? 'true' : undefined"
    data-cosmos-presenter="new"
  />
  <CosmosGlobalView
    v-else
    navigation-scope="production"
    :background-only="backgroundOnly"
    :inert="backgroundOnly || undefined"
    :aria-hidden="backgroundOnly ? 'true' : undefined"
    data-cosmos-presenter="new"
  />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";
import { useRoute } from "vue-router";

import { projectIdFromQuery } from "../dev/cosmos-project/projectCosmosProjection";

const CosmosGlobalView = defineAsyncComponent(
  () => import("../dev/cosmos-global/CosmosGlobalView.vue"),
);
const CosmosProjectView = defineAsyncComponent(
  () => import("../dev/cosmos-project/CosmosProjectView.vue"),
);

withDefaults(defineProps<{ backgroundOnly?: boolean }>(), {
  backgroundOnly: false,
});
const route = useRoute();
const projectId = computed(() => projectIdFromQuery(route.query.projectId));
</script>
