<template>
  <LegacyCosmosView v-if="presenter === 'legacy'" data-cosmos-presenter="legacy" />
  <CosmosProjectView
    v-else-if="projectId"
    navigation-scope="production"
    data-cosmos-presenter="new"
  />
  <CosmosGlobalView
    v-else
    navigation-scope="production"
    data-cosmos-presenter="new"
  />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";
import { useRoute } from "vue-router";

import { projectIdFromQuery } from "../dev/cosmos-project/projectCosmosProjection";
import { configuredCosmosPresenter, type CosmosPresenter } from "./cosmosPresenter";

const LegacyCosmosView = defineAsyncComponent(() => import("./CosmosView.vue"));
const CosmosGlobalView = defineAsyncComponent(
  () => import("../dev/cosmos-global/CosmosGlobalView.vue"),
);
const CosmosProjectView = defineAsyncComponent(
  () => import("../dev/cosmos-project/CosmosProjectView.vue"),
);

const props = withDefaults(defineProps<{ presenter?: CosmosPresenter }>(), {
  presenter: configuredCosmosPresenter,
});
const route = useRoute();
const projectId = computed(() => projectIdFromQuery(route.query.projectId));
const presenter = computed(() => props.presenter);
</script>
