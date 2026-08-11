<template>
  <section class="core-tool capture-tool">
    <header class="core-tool__toolbar"><strong>Capture</strong><span class="capture-tool__modes"><button v-for="item in modes" :key="item" type="button" :aria-pressed="mode === item" @click="mode = item">{{ item }}</button></span><small>{{ status }}</small></header>
    <p v-if="error" class="core-tool__error" role="alert">{{ error }}</p>
    <main class="core-tool__content">
      <label class="capture-tool__input">What do you want to preserve?<textarea ref="editor" v-model="content" :placeholder="placeholder" @input="scheduleDraft" /></label>
      <ul v-if="attachments.length"><li v-for="(file, index) in attachments" :key="file.name">{{ file.name }} <button type="button" @click="attachments.splice(index, 1); scheduleDraft()">Remove</button></li></ul>
      <footer><label class="core-tool__button">Attach<input type="file" multiple hidden @change="attach" /></label><span>Your draft is stored in this Workspace.</span><button type="button" :disabled="submitting || (!content.trim() && !attachments.length)" @click="submit">{{ submitting ? "Preserving…" : "Preserve" }}</button></footer>
    </main>
  </section>
</template>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { useCosmosRuntime } from "../../runtime/plugin";

interface CaptureAttachment {
  name: string;
  type: string;
  dataUrl: string;
}

const props = defineProps<{ workspaceSessionId: string; toolInstanceId: string }>();
const runtime = useCosmosRuntime();
const modes = ["quick", "rant", "form", "file"] as const;
const mode = ref<(typeof modes)[number]>("quick");
const content = ref("");
const attachments = ref<CaptureAttachment[]>([]);
const status = ref("Ready");
const error = ref<string | null>(null);
const submitting = ref(false);
const editor = ref<HTMLTextAreaElement | null>(null);
const draftId = computed(() => `capture-${props.toolInstanceId}`);
let timer = 0;
let draftSavePromise: Promise<void> | null = null;

const placeholder = computed(() =>
  mode.value === "rant"
    ? "Write freely. Cosmos will preserve the source exactly."
    : mode.value === "form"
      ? "Describe the idea, decision, question, or observation."
      : "Capture the thought before it disappears.",
);

function scheduleDraft() {
  status.value = "Saving draft…";
  window.clearTimeout(timer);
  timer = window.setTimeout(saveDraft, 350);
}

function saveDraft(): Promise<void> {
  const operation = (async () => {
    try {
      await runtime.coreTools.saveDraft(props.workspaceSessionId, draftId.value, {
        mode: mode.value,
        content: content.value,
        attachments: attachments.value,
      });
      status.value = "Draft saved";
      error.value = null;
    } catch (cause) {
      capture(cause);
      status.value = "Draft not saved";
    }
  })();
  draftSavePromise = operation;
  void operation.finally(() => {
    if (draftSavePromise === operation) draftSavePromise = null;
  });
  return operation;
}

async function restore() {
  try {
    const drafts = await runtime.coreTools.drafts(props.workspaceSessionId);
    const draft = drafts.find((item) => item.draftId === draftId.value) ?? drafts[0];
    if (draft) {
      mode.value = modes.includes(draft.mode as (typeof modes)[number])
        ? (draft.mode as (typeof modes)[number])
        : "quick";
      content.value = draft.content;
      attachments.value = draft.attachments as CaptureAttachment[];
      status.value = "Draft restored";
    }
  } catch (cause) {
    capture(cause);
  }
  await nextTick();
  editor.value?.focus();
}

async function attach(event: Event) {
  const files = [...((event.target as HTMLInputElement).files ?? [])];
  for (const file of files) {
    attachments.value.push({ name: file.name, type: file.type, dataUrl: await dataUrl(file) });
  }
  scheduleDraft();
}

async function submit() {
  window.clearTimeout(timer);
  timer = 0;
  submitting.value = true;
  try {
    if (draftSavePromise) await draftSavePromise;
    await runtime.coreTools.submitCapture(props.workspaceSessionId, {
      mode: mode.value,
      content: content.value,
      attachments: attachments.value,
      draftId: draftId.value,
    });
    content.value = "";
    attachments.value = [];
    status.value = "Preserved";
    error.value = null;
    editor.value?.focus();
  } catch (cause) {
    capture(cause);
    status.value = "Capture retained";
  } finally {
    submitting.value = false;
  }
}

function dataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function capture(cause: unknown) {
  error.value =
    cause instanceof Error ? cause.message : "Capture could not complete the request.";
}

watch(mode, scheduleDraft);
onMounted(restore);
onBeforeUnmount(() => window.clearTimeout(timer));
</script>
<style scoped>
.capture-tool__modes { display: flex; gap: 4px; }
.capture-tool__modes button[aria-pressed="true"] { background: rgba(120, 221, 187, .18); border-color: rgba(120, 221, 187, .4); }
.capture-tool__input { min-height: 0; flex: 1; }
.capture-tool__input textarea { min-height: 180px; flex: 1; font-size: .82rem; line-height: 1.55; }
.core-tool__content footer { display: flex; align-items: center; gap: 10px; }
.core-tool__content footer span { flex: 1; color: #788e95; font-size: .62rem; }
</style>
