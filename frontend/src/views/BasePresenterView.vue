<template>
  <LegacyBaseView
    v-if="presenter === 'legacy'"
    :background-only="backgroundOnly"
    data-base-presenter="legacy"
  />
  <template v-else>
    <CosmosPresenterView background-only />
    <BaseRuntimeView
      navigation-scope="production"
      :background-only="backgroundOnly"
      data-base-presenter="new"
    />
  </template>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";

import { configuredBasePresenter, type BasePresenter } from "./basePresenter";
import CosmosPresenterView from "./CosmosPresenterView.vue";

const LegacyBaseView = defineAsyncComponent(() => import("./BaseView.vue"));
const BaseRuntimeView = defineAsyncComponent(
  () => import("../dev/base-runtime/BaseRuntimeView.vue"),
);

const props = withDefaults(defineProps<{
  presenter?: BasePresenter;
  backgroundOnly?: boolean;
}>(), {
  presenter: configuredBasePresenter,
  backgroundOnly: false,
});

const presenter = computed(() => props.presenter);
</script>
