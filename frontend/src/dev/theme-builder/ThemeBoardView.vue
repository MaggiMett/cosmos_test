<template>
  <ThemeBuilderShell
    active-studio="board"
    studio-label="Theme Board"
    :builder-project-id="snapshot?.project.builderProjectId"
    :interactive="phase === 'success'"
    :dirty="snapshot?.dirty"
    :saving="snapshot?.saving"
    :can-save="Boolean(snapshot?.dirty && form.name.trim())"
    :can-undo="snapshot?.canUndo"
    :can-redo="snapshot?.canRedo"
    @save="save"
    @undo="undo"
    @redo="redo"
  >
    <div class="theme-board" data-testid="theme-board-view">
      <section v-if="phase === 'loading'" class="theme-board__state" aria-live="polite">
        <span class="theme-board__pulse" />
        <h1 class="builder-serif">Loading Theme Builder Project…</h1>
      </section>

      <section v-else-if="phase === 'error'" class="theme-board__state" role="alert">
        <h1 class="builder-serif">Theme Builder Project unavailable</h1>
        <p>{{ loadError }}</p>
        <button type="button" @click="loadFromRoute">Try again</button>
      </section>

      <section v-else-if="phase === 'empty'" class="theme-board__state theme-board__state--create">
        <p class="theme-board__eyebrow">No project selected</p>
        <h1 class="builder-serif">Create a Theme Builder Project</h1>
        <p>Open an existing Builder Project or create a new persistent draft.</p>
        <nav v-if="existingProjects.length" class="theme-board__projects" aria-label="Existing Theme Builder Projects">
          <button v-for="project in existingProjects" :key="project.builderProjectId" type="button" @click="openProject(project.builderProjectId)">
            <strong>{{ project.name }}</strong><span>Revision {{ project.revision }} · {{ project.author || "Unknown author" }}</span>
          </button>
        </nav>
        <form class="theme-board__form" @submit.prevent="createProject">
          <label>Theme name<input v-model="createForm.name" required maxlength="120" /></label>
          <label>Description<textarea v-model="createForm.description" maxlength="2000" /></label>
          <label>Author<input v-model="createForm.author" maxlength="120" /></label>
          <button type="submit" :disabled="creating || !createForm.name.trim()">
            {{ creating ? "Creating…" : "Create project" }}
          </button>
          <p v-if="createError" class="theme-board__error" role="alert">{{ createError }}</p>
        </form>
      </section>

      <template v-else-if="snapshot">
        <header class="theme-board__heading">
          <div class="theme-board__title-row">
            <h1 class="builder-serif">{{ snapshot.project.name }}</h1>
            <span>{{ snapshot.dirty ? "Unsaved" : "Draft" }}</span>
          </div>
          <p>{{ snapshot.project.description || "No description" }}</p>
        </header>

        <section class="theme-board__metadata" aria-labelledby="theme-metadata-title">
          <h2 id="theme-metadata-title" class="builder-serif">Theme metadata</h2>
          <div class="theme-board__form theme-board__form--metadata">
            <label>Theme name<input v-model="form.name" maxlength="120" @input="updateMetadata" /></label>
            <label>Description<textarea v-model="form.description" maxlength="2000" @input="updateMetadata" /></label>
            <label>Author<input v-model="form.author" maxlength="120" @input="updateMetadata" /></label>
          </div>
          <p v-if="snapshot.saveConflict" class="theme-board__error" role="alert">
            This draft changed elsewhere. Reload before saving again.
          </p>
          <p v-else-if="snapshot.saveError" class="theme-board__error" role="alert">
            {{ snapshot.saveError.message }}
          </p>
        </section>

        <ThemeBoardAssets :items="assetItems" @add="openAssetPicker" @remove="removeAsset" />
        <p v-if="assetCommandError" class="theme-board__error" role="alert">{{ assetCommandError }}</p>

        <HeroCard unavailable />
        <MoodboardGrid :items="[]" />
      </template>
    </div>

    <BuilderAssetPicker
      v-if="pickerOpen"
      :records="pickerRecords"
      :loading="catalogLoading"
      :error="catalogError"
      @close="pickerOpen = false"
      @add="addAsset"
      @open-library="openAssetLibrary"
    />

    <template #context>
      <div v-if="snapshot" class="theme-board-context">
        <section class="theme-board-details" aria-labelledby="project-details-title">
          <h2 id="project-details-title" class="builder-serif">Builder Project</h2>
          <dl>
            <div><dt>Project</dt><dd>{{ snapshot.project.builderProjectId }}</dd></div>
            <div><dt>Theme</dt><dd>{{ snapshot.project.themeId }}</dd></div>
            <div><dt>Package</dt><dd>{{ snapshot.project.packageId }}</dd></div>
            <div><dt>Type</dt><dd>{{ snapshot.project.packageType }}</dd></div>
            <div><dt>Versions</dt><dd>{{ snapshot.project.themeVersion }} · {{ snapshot.project.packageVersion }}</dd></div>
            <div><dt>Revision</dt><dd>{{ snapshot.project.revision }}</dd></div>
          </dl>
        </section>
        <div class="theme-board-context__divider" />
        <ContinueWorking :items="workingItems" />
        <div class="theme-board-context__divider" />
        <ThemeCoverage :items="coverageItems" />
      </div>
    </template>
  </ThemeBuilderShell>
</template>

<script setup lang="ts">
import "./themeBuilder.css";

import { computed, reactive, shallowRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { themeBuilderProjectApi } from "../../runtime/themeBuilderProjectApi";
import { assetCatalogApi, type PersistedAssetCatalogRecord } from "../../runtime/assetCatalogApi";
import type { ExactVersionedRef } from "../../theme-engine";
import BuilderAssetPicker from "./components/BuilderAssetPicker.vue";
import ContinueWorking from "./components/ContinueWorking.vue";
import HeroCard from "./components/HeroCard.vue";
import MoodboardGrid from "./components/MoodboardGrid.vue";
import ThemeBuilderShell from "./components/ThemeBuilderShell.vue";
import ThemeCoverage from "./components/ThemeCoverage.vue";
import ThemeBoardAssets from "./components/ThemeBoardAssets.vue";
import { projectContinueWorking, projectThemeCoverage } from "./themeBoardProjection";
import { ThemeBuilderSession, type ThemeBuilderSessionSnapshot } from "./themeBuilderSession";
import {
  BuilderAssetCatalogIndex,
  BuilderAssetReferenceError,
  projectBuilderAssets,
} from "./themeBuilderAssetReferences";

type Phase = "empty" | "loading" | "error" | "success";

const route = useRoute();
const router = useRouter();
const phase = shallowRef<Phase>("empty");
const loadError = shallowRef("");
const createError = shallowRef("");
const creating = shallowRef(false);
const existingProjects = shallowRef<readonly Readonly<import("../../theme-engine").ThemeBuilderProject>[]>([]);
const pickerOpen = shallowRef(false);
const catalogLoading = shallowRef(false);
const catalogError = shallowRef("");
const assetCommandError = shallowRef("");
const catalogRecords = shallowRef<readonly Readonly<PersistedAssetCatalogRecord>[]>([]);
const snapshot = shallowRef<Readonly<ThemeBuilderSessionSnapshot>>();
let session: ThemeBuilderSession | undefined;
const form = reactive({ name: "", description: "", author: "" });
const createForm = reactive({ name: "", description: "", author: "" });

const coverageItems = computed(() => snapshot.value ? projectThemeCoverage(snapshot.value.project) : []);
const workingItems = computed(() => snapshot.value ? projectContinueWorking(snapshot.value.project, snapshot.value.dirty) : []);
const assetItems = computed(() => snapshot.value
  ? projectBuilderAssets(snapshot.value.project, catalogRecords.value, !catalogLoading.value && !catalogError.value)
  : []);
const assetCatalogIndex = computed(() => new BuilderAssetCatalogIndex(catalogRecords.value));
const pickerRecords = computed(() => assetCatalogIndex.value.records.filter((record) =>
  !snapshot.value?.project.assetRefs.some((reference) =>
    reference.id === record.visualAsset.id && reference.version === record.visualAsset.version,
  ),
));

watch(() => route.query.builderProjectId, loadFromRoute, { immediate: true });

async function loadFromRoute(): Promise<void> {
  const rawId = route.query.builderProjectId;
  const projectId = typeof rawId === "string" ? rawId.trim() : "";
  session = undefined;
  snapshot.value = undefined;
  if (!projectId) {
    phase.value = "empty";
    const listed = await themeBuilderProjectApi.list();
    existingProjects.value = listed.ok ? listed.data : [];
    return;
  }
  phase.value = "loading";
  const result = await themeBuilderProjectApi.get(projectId);
  if (!result.ok) {
    loadError.value = result.error.message;
    phase.value = "error";
    return;
  }
  session = new ThemeBuilderSession(result.data);
  syncSnapshot();
  phase.value = "success";
  await loadCatalog();
}

async function loadCatalog(): Promise<void> {
  catalogLoading.value = true;
  catalogError.value = "";
  const result = await assetCatalogApi.list();
  catalogLoading.value = false;
  if (!result.ok) {
    catalogError.value = result.error.message;
    return;
  }
  catalogRecords.value = result.data;
}

function openProject(builderProjectId: string): void {
  void router.push({ name: "theme-builder", query: { builderProjectId } });
}

async function createProject(): Promise<void> {
  creating.value = true;
  createError.value = "";
  const result = await themeBuilderProjectApi.create(createForm);
  creating.value = false;
  if (!result.ok) {
    createError.value = result.error.message;
    return;
  }
  await router.replace({ name: "theme-builder", query: { builderProjectId: result.data.builderProjectId } });
}

function updateMetadata(): void {
  if (!session || !form.name.trim()) return;
  session.execute({ type: "update-theme-metadata", metadata: form });
  syncSnapshot();
}

function openAssetPicker(): void {
  assetCommandError.value = "";
  pickerOpen.value = true;
  if (catalogError.value) void loadCatalog();
}

function openAssetLibrary(): void {
  const id = snapshot.value?.project.builderProjectId;
  if (!id) return;
  pickerOpen.value = false;
  void router.push({ name: "theme-builder-assets", query: { returnBuilderProjectId: id } });
}

function addAsset(assetId: string): void {
  if (!session) return;
  try {
    session.execute({ type: "add-asset-reference", assetId }, assetCatalogIndex.value);
    assetCommandError.value = "";
    pickerOpen.value = false;
    syncSnapshot();
  } catch (error) {
    assetCommandError.value = error instanceof BuilderAssetReferenceError ? error.message : "The Asset could not be referenced.";
  }
}

function removeAsset(reference: Readonly<ExactVersionedRef>): void {
  if (!session) return;
  try {
    session.execute({ type: "remove-asset-reference", reference });
    assetCommandError.value = "";
    syncSnapshot();
  } catch (error) {
    assetCommandError.value = error instanceof BuilderAssetReferenceError ? error.message : "The reference could not be removed.";
  }
}

async function save(): Promise<void> {
  if (!session) return;
  const pending = session.save(themeBuilderProjectApi);
  syncSnapshot();
  await pending;
  syncSnapshot();
}

function undo(): void { session?.undo(); syncSnapshot(); }
function redo(): void { session?.redo(); syncSnapshot(); }

function syncSnapshot(): void {
  if (!session) return;
  snapshot.value = session.snapshot;
  Object.assign(form, {
    name: snapshot.value.project.name,
    description: snapshot.value.project.description,
    author: snapshot.value.project.author,
  });
}
</script>

<style scoped>
.theme-board { display: grid; width: min(100%, 1110px); min-height: 100%; padding: 26px 28px 36px; align-content: start; gap: 20px; }
.theme-board__heading, .theme-board__metadata, .theme-board__state, .theme-board-details { display: grid; gap: 8px; }
.theme-board__title-row { display: flex; align-items: center; gap: 14px; }
.theme-board h1, .theme-board h2, .theme-board-details h2 { margin: 0; color: var(--builder-text); }
.theme-board h1 { font-size: clamp(2rem, 2.55vw, 2.7rem); line-height: 1; letter-spacing: -0.025em; }
.theme-board h2, .theme-board-details h2 { font-size: 1.06rem; }
.theme-board__title-row > span { padding: 3px 7px; border: 1px solid var(--builder-border-strong); border-radius: 5px; color: var(--builder-muted); font-size: 0.65rem; }
.theme-board p { margin: 0; color: var(--builder-muted); font-size: 0.78rem; }
.theme-board__metadata { padding: 18px; border: 1px solid var(--builder-border); border-radius: var(--builder-radius-card); }
.theme-board__projects{display:grid;width:min(100%,620px);gap:8px}.theme-board__projects button{display:grid;padding:10px 12px;border:1px solid var(--builder-border);border-radius:8px;background:rgba(255,255,255,.015);color:var(--builder-text);text-align:left;gap:3px}.theme-board__projects span{color:var(--builder-muted);font-size:.68rem}.theme-board__form { display: grid; width: min(100%, 620px); gap: 12px; }
.theme-board__form--metadata { grid-template-columns: 1fr 1.3fr 1fr; width: 100%; }
.theme-board__form label { display: grid; color: var(--builder-muted); font-size: 0.69rem; gap: 6px; }
.theme-board__form input, .theme-board__form textarea { min-width: 0; padding: 9px 10px; border: 1px solid var(--builder-border); border-radius: var(--builder-radius-control); background: rgba(6, 10, 14, 0.55); color: var(--builder-text); font: inherit; }
.theme-board__form textarea { min-height: 38px; resize: vertical; }
.theme-board__form button, .theme-board__state > button { width: fit-content; min-height: 38px; padding: 0 16px; border: 1px solid var(--builder-border-strong); border-radius: var(--builder-radius-control); background: rgba(120, 149, 177, 0.14); color: var(--builder-text); }
.theme-board__state { min-height: 520px; place-content: center; justify-items: start; }
.theme-board__state--create { width: min(100%, 660px); margin: 0 auto; }
.theme-board__pulse { width: 18px; height: 18px; border: 1px solid var(--builder-accent); border-radius: 50%; animation: pulse 1.2s ease-in-out infinite; }
.theme-board__error { color: #c69b76 !important; }
.theme-board__eyebrow { color: var(--builder-faint) !important; text-transform: uppercase; letter-spacing: 0.12em; }
.theme-board-context { display: grid; padding: 46px 24px 40px; align-content: start; gap: 24px; }
.theme-board-context__divider { height: 1px; background: linear-gradient(90deg, var(--builder-border), transparent); }
.theme-board-details dl { display: grid; margin: 0; gap: 9px; }
.theme-board-details dl > div { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 8px; }
.theme-board-details dt { color: var(--builder-faint); font-size: 0.66rem; }
.theme-board-details dd { overflow-wrap: anywhere; margin: 0; color: var(--builder-muted); font-size: 0.68rem; }
@keyframes pulse { 50% { opacity: 0.35; transform: scale(0.8); } }
@media (prefers-reduced-motion: reduce) { .theme-board__pulse { animation: none; } }
@media (max-width: 1280px) { .theme-board { padding-inline: 22px; } .theme-board-context { padding-inline: 18px; } }
</style>
