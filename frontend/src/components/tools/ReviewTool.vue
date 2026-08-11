<template>
  <section class="core-tool review-tool">
    <header class="core-tool__toolbar"><strong>Review queue</strong><button type="button" @click="load">Refresh</button></header>
    <p v-if="error" class="core-tool__error" role="alert">{{ error }}</p>
    <div v-if="items.length" class="review-tool__body">
      <nav class="core-tool__rail"><button v-for="item in items" :key="item.objectId" type="button" :class="{ selected: item.objectId === selected?.objectId }" @click="selected = item"><strong>{{ item.displayName }}</strong><small>{{ item.urgency }} · {{ Math.round(item.confidence * 100) }}% confidence</small></button></nav>
      <main v-if="selected" class="core-tool__content"><header class="core-tool__section-title"><span><small>{{ selected.review_state }}</small><strong>{{ selected.displayName }}</strong></span></header><p>{{ selected.summary }}</p><section><small>Why this needs you</small><p>{{ selected.review_reason }}</p></section><section><small>Evidence</small><pre>{{ formatEvidence(selected.evidence) }}</pre></section><label>Decision note<textarea v-model="note" rows="3" /></label><footer><button v-for="action in selected.available_actions" :key="action" type="button" @click="decide(action)">{{ label(action) }}</button></footer></main>
    </div>
    <main v-else class="core-tool__content core-tool__empty"><strong>Nothing needs your attention.</strong><span>Mature discoveries and decisions will appear here.</span></main>
  </section>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue"; import type { ReviewRecord } from "../../runtime/coreToolsRuntime"; import { useCosmosRuntime } from "../../runtime/plugin";
const props = defineProps<{ workspaceSessionId: string }>(); const runtime = useCosmosRuntime(); const items = ref<ReviewRecord[]>([]); const selected = ref<ReviewRecord | null>(null); const note = ref(""); const error = ref<string | null>(null);
async function load() { try { items.value = await runtime.coreTools.reviews(props.workspaceSessionId); selected.value = items.value.find((item) => item.objectId === selected.value?.objectId) ?? items.value[0] ?? null; error.value = null; } catch (cause) { error.value = cause instanceof Error ? cause.message : "Review could not load."; } }
async function decide(action: string) { if (!selected.value) return; try { await runtime.coreTools.decideReview(props.workspaceSessionId, selected.value.objectId, action, note.value); note.value = ""; await load(); } catch (cause) { error.value = cause instanceof Error ? cause.message : "Decision could not be recorded."; } }
function label(value: string) { return value.replaceAll("_", " ").replace(/^./, (first) => first.toUpperCase()); }
function formatEvidence(value: unknown[]) { return value.length ? JSON.stringify(value, null, 2) : "No supporting evidence was attached."; }
onMounted(load);
</script>
<style scoped>
.review-tool__body { display: grid; min-height: 0; flex: 1; grid-template-columns: 250px 1fr; }
pre { max-height: 130px; overflow: auto; white-space: pre-wrap; color: #aebfc4; font-size: .65rem; }
.core-tool__content footer { display: flex; flex-wrap: wrap; gap: 6px; }
</style>
