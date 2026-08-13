<template>
  <section class="core-tool files-tool">
    <header class="core-tool__toolbar">
      <button type="button" @click="creating = true">New file</button>
      <input v-model="query" type="search" placeholder="Search project files" aria-label="Search project files" @input="loadTree" />
      <button type="button" :aria-pressed="view === 'grid'" @click="view = view === 'list' ? 'grid' : 'list'">{{ view === "list" ? "Grid" : "List" }}</button>
    </header>
    <p v-if="error" class="core-tool__error" role="alert">{{ error }}</p>
    <div class="files-tool__body">
      <nav class="core-tool__rail" aria-label="Project files">
        <button v-for="file in files" :key="file.path" type="button" :class="{ selected: file.path === selected?.metadata.path }" @click="open(file.path)">
          <span>{{ file.name }}</span><small>{{ formatBytes(file.sizeBytes ?? 0) }}</small>
        </button>
        <p v-if="!loading && !files.length">No project files yet.</p>
      </nav>
      <main class="core-tool__content">
        <div v-if="creating" class="core-tool__form">
          <label>Project-relative path<input v-model="newPath" placeholder="notes/idea.md" /></label>
          <label>Content<textarea v-model="newContent" /></label>
          <div><button type="button" @click="create">Create</button><button type="button" @click="creating = false">Cancel</button></div>
        </div>
        <template v-else-if="selected">
          <header class="core-tool__section-title">
            <span><strong>{{ selected.metadata.name }}</strong><small>{{ selected.metadata.path }}</small></span>
            <span><button v-if="selected.editable" type="button" @click="save">Save</button><button type="button" @click="rename">Rename / move</button><button class="danger" type="button" @click="remove">Delete</button></span>
          </header>
          <textarea v-if="selected.contentType === 'text'" v-model="content" class="files-tool__editor" spellcheck="false" />
          <img v-else-if="selected.contentType === 'image' && selected.dataUrl" :src="selected.dataUrl" :alt="selected.metadata.name" />
          <p v-else>{{ selected.message }}</p>
        </template>
        <p v-else class="core-tool__empty">Select a file to preview it.</p>
      </main>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { ResourceContent, ResourceNode } from "../../runtime/coreToolsRuntime";
import { useCosmosRuntime } from "../../runtime/plugin";

const props = defineProps<{ workspaceSessionId: string; initialResourcePath?: string | null }>();
const runtime = useCosmosRuntime();
const root = ref<ResourceNode | null>(null);
const selected = ref<ResourceContent | null>(null);
const content = ref("");
const query = ref("");
const view = ref<"list" | "grid">("list");
const loading = ref(false);
const error = ref<string | null>(null);
const creating = ref(false);
const newPath = ref("");
const newContent = ref("");
let searchTimer = 0;
const files = computed(() => flatten(root.value));

function loadTree() {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(async () => {
    loading.value = true;
    try { root.value = (await runtime.coreTools.fileTree(props.workspaceSessionId, query.value)).tree; error.value = null; }
    catch (cause) { capture(cause); }
    finally { loading.value = false; }
  }, 180);
}
async function open(path: string) { try { selected.value = await runtime.coreTools.readFile(props.workspaceSessionId, path); content.value = selected.value.content ?? ""; error.value = null; } catch (cause) { capture(cause); } }
async function create() { try { selected.value = await runtime.coreTools.createFile(props.workspaceSessionId, newPath.value, newContent.value); content.value = selected.value.content ?? ""; creating.value = false; newPath.value = ""; newContent.value = ""; loadTree(); } catch (cause) { capture(cause); } }
async function save() { if (!selected.value) return; try { selected.value = await runtime.coreTools.editFile(props.workspaceSessionId, selected.value.metadata.path, content.value, selected.value.metadata.contentHash); content.value = selected.value.content ?? ""; } catch (cause) { capture(cause); } }
async function rename() { if (!selected.value) return; const destination = window.prompt("New project-relative path", selected.value.metadata.path); if (!destination || destination === selected.value.metadata.path) return; try { selected.value = await runtime.coreTools.moveFile(props.workspaceSessionId, selected.value.metadata.path, destination); content.value = selected.value.content ?? ""; loadTree(); } catch (cause) { capture(cause); } }
async function remove() { if (!selected.value || !window.confirm(`Delete ${selected.value.metadata.path}?`)) return; try { await runtime.coreTools.deleteFile(props.workspaceSessionId, selected.value.metadata.path); selected.value = null; content.value = ""; loadTree(); } catch (cause) { capture(cause); } }
function flatten(node: ResourceNode | null): ResourceNode[] { if (!node) return []; return node.type === "file" ? [node] : (node.children ?? []).flatMap(flatten); }
function formatBytes(value: number) { return value < 1024 ? `${value} B` : `${(value / 1024).toFixed(1)} KB`; }
function capture(cause: unknown) { error.value = cause instanceof Error ? cause.message : "Files could not complete the request."; }
onMounted(() => {
  loadTree();
  if (props.initialResourcePath) void open(props.initialResourcePath);
});
</script>

<style scoped>
.files-tool__body { display: grid; min-height: 0; flex: 1; grid-template-columns: 220px 1fr; }
.files-tool__editor { width: 100%; min-height: 0; flex: 1; resize: none; border: 0; background: #080d17; color: #d9e7eb; font: 0.72rem/1.55 ui-monospace, monospace; padding: 16px; }
.core-tool__content img { max-width: 100%; max-height: calc(100% - 60px); margin: auto; object-fit: contain; }
</style>
