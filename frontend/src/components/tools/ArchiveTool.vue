<template>
  <section class="core-tool archive-tool">
    <header class="core-tool__toolbar"><input v-model="query" type="search" placeholder="Search Archive" @input="load" /><span>Knowledge</span></header>
    <p v-if="error" class="core-tool__error" role="alert">{{ error }}</p>
    <div class="archive-tool__body">
      <nav class="core-tool__rail"><button v-for="item in items" :key="item.objectId" type="button" :class="{ selected: item.objectId === selected?.objectId }" @click="open(item.objectId)"><strong>{{ item.title }}</strong><small>v{{ item.current_version }} · {{ item.processed_status }}</small></button><p v-if="!items.length">Archive is empty.</p></nav>
      <main v-if="selected" class="core-tool__content">
        <header class="core-tool__section-title"><span><small>Object View · inline editing</small><strong>{{ selected.title }}</strong></span><button type="button" @click="save">Save version</button></header>
        <label>Title<input v-model="title" /></label>
        <label>Summary<textarea v-model="summary" rows="3" /></label>
        <label class="archive-tool__content-label">Content<textarea v-model="content" /></label>
        <details><summary>Version history ({{ selected.versions?.length ?? 0 }})</summary><ol><li v-for="version in selected.versions" :key="String(version.version)">Version {{ version.version }} · {{ version.author }}</li></ol></details>
      </main>
      <main v-else class="core-tool__content core-tool__empty">Select Knowledge to read or edit it.</main>
    </div>
  </section>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { KnowledgeRecord } from "../../runtime/coreToolsRuntime";
import { useCosmosRuntime } from "../../runtime/plugin";
const props = defineProps<{ workspaceSessionId: string }>(); const runtime = useCosmosRuntime();
const items = ref<KnowledgeRecord[]>([]); const selected = ref<KnowledgeRecord | null>(null); const query = ref(""); const title = ref(""); const summary = ref(""); const content = ref(""); const error = ref<string | null>(null); let timer = 0;
function load() { window.clearTimeout(timer); timer = window.setTimeout(async () => { try { items.value = await runtime.coreTools.archive(props.workspaceSessionId, query.value); error.value = null; } catch (cause) { capture(cause); } }, 160); }
async function open(id: string) { try { selected.value = await runtime.coreTools.knowledge(props.workspaceSessionId, id); title.value = selected.value.title; summary.value = selected.value.summary; content.value = selected.value.current_content; } catch (cause) { capture(cause); } }
async function save() { if (!selected.value) return; try { selected.value = await runtime.coreTools.editKnowledge(props.workspaceSessionId, selected.value.objectId, { title: title.value, summary: summary.value, content: content.value }); await loadNow(); } catch (cause) { capture(cause); } }
async function loadNow() { items.value = await runtime.coreTools.archive(props.workspaceSessionId, query.value); }
function capture(cause: unknown) { error.value = cause instanceof Error ? cause.message : "Archive could not complete the request."; }
onMounted(load);
</script>
<style scoped>
.archive-tool__body { display: grid; min-height: 0; flex: 1; grid-template-columns: 240px 1fr; }
.archive-tool__content-label { min-height: 180px; flex: 1; }
.archive-tool__content-label textarea { min-height: 140px; flex: 1; }
details { color: #9db0b6; font-size: .66rem; }
</style>
