<template>
  <main class="application-shell" :aria-busy="!ready">
    <RouterView v-if="ready" />

    <section v-else-if="state.phase === 'failed'" class="startup-state" role="alert">
      <h1>Cosmos could not start</h1>
      <p>{{ state.error }}</p>
      <button type="button" @click="start">Retry</button>
    </section>

    <p v-else class="startup-state" role="status" aria-live="polite">Starting Cosmos…</p>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { RouterView } from "vue-router";

import { useCosmosRuntime } from "../runtime/plugin";

const runtime = useCosmosRuntime();
const state = runtime.application.state;
const ready = computed(() => state.phase === "ready");

function start() {
  void runtime.application.start().catch(() => undefined);
}

onMounted(start);
</script>
