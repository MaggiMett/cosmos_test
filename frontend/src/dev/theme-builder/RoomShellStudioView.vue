<template>
  <ThemeBuilderShell
    active-studio="room"
    studio-label="Room Shell Studio"
    :builder-project-id="projectId"
    :interactive="phase === 'success'"
    :dirty="snapshot?.dirty"
    :saving="snapshot?.saving"
    :can-save="Boolean(snapshot?.dirty)"
    :can-undo="snapshot?.canUndo"
    :can-redo="snapshot?.canRedo"
    @save="save"
    @undo="undo"
    @redo="redo"
  >
    <section v-if="phase !== 'success'" class="artifact-state">
      <p class="artifact-state__eyebrow">Room Shell Studio</p>
      <h1 class="builder-serif">{{ phase === 'loading' ? 'Loading Builder Draft…' : phase === 'error' ? 'Builder Draft unavailable' : 'No Builder Project selected' }}</h1>
      <p>{{ phase === 'error' ? loadError : 'Open the Theme Board first and continue from the same Builder Project.' }}</p>
      <RouterLink v-if="phase !== 'loading'" :to="{name:'theme-builder',query:{builderProjectId:projectId||undefined}}">Back to Theme Board</RouterLink>
    </section>

    <div v-else-if="snapshot" class="room-shell-v1" data-testid="room-shell-studio-view">
      <aside class="artifact-list">
        <header><span>Structure</span><h2 class="builder-serif">Room Shells</h2></header>
        <button
          v-for="shell in shells"
          :key="shell.shellId"
          type="button"
          :class="{ active: selectedShellId === shell.shellId }"
          @click="selectShell(shell.shellId)"
        ><strong>{{ shell.displayName }}</strong><small>{{ shell.shellId }}</small></button>
        <div v-if="!shells.length" class="artifact-list__empty">No authored Room Shells yet.</div>
        <form class="artifact-create" @submit.prevent="createShell">
          <label>Name<input v-model="createName" maxlength="120" placeholder="Main Room Shell" /></label>
          <button type="submit">Create from Core structure</button>
        </form>
      </aside>

      <section class="artifact-canvas">
        <header>
          <div><span>Authoring V1</span><h1 class="builder-serif">{{ selectedShell?.displayName ?? 'Select a Room Shell' }}</h1></div>
          <span v-if="selectedShell">{{ selectedShell.architectureSurfaces.length }} surfaces · {{ selectedShell.placementSurfaces.length }} placement surfaces</span>
        </header>
        <div class="room-shell-visual" aria-hidden="true">
          <div class="room-shell-visual__frame" />
          <div class="room-shell-visual__window" />
          <div class="room-shell-visual__floor" />
          <span v-for="surface in selectedShell?.architectureSurfaces ?? []" :key="surface.surfaceId" class="room-shell-visual__marker" />
        </div>
        <p class="artifact-note">V1 authors stable shell identity, name and perspective profile while preserving validated Core geometry. Freeform geometry editing is intentionally deferred.</p>
      </section>
    </div>

    <template #context>
      <section v-if="selectedShell" class="artifact-inspector">
        <p class="artifact-state__eyebrow">Selected Shell</p>
        <h2 class="builder-serif">Appearance &amp; Structure</h2>
        <label>Display name<input v-model="editName" @change="updateShell" /></label>
        <label>Perspective profile<input v-model="editPerspective" @change="updateShell" /></label>
        <dl>
          <div><dt>ID</dt><dd>{{ selectedShell.shellId }}</dd></div>
          <div><dt>Version</dt><dd>{{ selectedShell.version }}</dd></div>
          <div><dt>Projection</dt><dd>{{ selectedShell.camera.projection }}</dd></div>
          <div><dt>Layer bands</dt><dd>{{ selectedShell.layerBands.length }}</dd></div>
        </dl>
        <button type="button" class="danger" @click="removeShell">Remove from draft</button>
        <p v-if="commandError" class="artifact-error" role="alert">{{ commandError }}</p>
      </section>
      <section v-else class="artifact-inspector"><h2 class="builder-serif">Room Shell Studio</h2><p>Create or select a Room Shell to edit it.</p></section>
    </template>
  </ThemeBuilderShell>
</template>

<script setup lang="ts">
import "./themeBuilder.css";
import { computed, ref, watch } from "vue";
import ThemeBuilderShell from "./components/ThemeBuilderShell.vue";
import { useThemeBuilderSession } from "./useThemeBuilderSession";
import { BuilderArtifactDraftError } from "./themeBuilderArtifactDrafts";

const controller = useThemeBuilderSession();
const { projectId, phase, loadError, snapshot } = controller;
const createName = ref("");
const selectedShellId = ref("");
const editName = ref("");
const editPerspective = ref("");
const commandError = ref("");
const shells = computed(() => snapshot.value?.project.artifacts.roomShells ?? []);
const selectedShell = computed(() => shells.value.find((item) => item.shellId === selectedShellId.value));

watch(shells, (items) => {
  if (!items.some((item) => item.shellId === selectedShellId.value)) selectedShellId.value = items[0]?.shellId ?? "";
}, { immediate: true });
watch(selectedShell, (shell) => {
  editName.value = shell?.displayName ?? "";
  editPerspective.value = shell?.perspectiveProfile ?? "";
}, { immediate: true });

function execute(command: Parameters<NonNullable<ReturnType<typeof controller.session>>["execute"]>[0]): void {
  try { controller.session()?.execute(command); commandError.value = ""; controller.sync(); }
  catch (error) { commandError.value = error instanceof Error ? error.message : "The Room Shell could not be changed."; }
}
function createShell(): void { execute({ type: "create-room-shell-draft", name: createName.value }); createName.value = ""; }
function selectShell(id: string): void { selectedShellId.value = id; }
function updateShell(): void {
  if (!selectedShell.value) return;
  execute({ type: "update-room-shell-draft", shellId: selectedShell.value.shellId, displayName: editName.value, perspectiveProfile: editPerspective.value });
}
function removeShell(): void { if (selectedShell.value) execute({ type: "remove-room-shell-draft", shellId: selectedShell.value.shellId }); }
const save = controller.save; const undo = controller.undo; const redo = controller.redo;
</script>

<style scoped>
.room-shell-v1{display:grid;width:100%;height:100%;grid-template-columns:270px minmax(0,1fr)}.artifact-list{display:grid;align-content:start;padding:24px 18px;border-right:1px solid var(--builder-border);gap:10px}.artifact-list header{margin-bottom:8px}.artifact-list header span,.artifact-state__eyebrow,.artifact-canvas header span{color:var(--builder-faint);font-size:.66rem;text-transform:uppercase;letter-spacing:.1em}.artifact-list h2,.artifact-canvas h1,.artifact-inspector h2{margin:4px 0 0}.artifact-list>button{display:grid;padding:10px;border:1px solid var(--builder-border);border-radius:8px;background:transparent;color:var(--builder-text);text-align:left;gap:4px}.artifact-list>button.active{border-color:var(--builder-accent);background:rgba(120,149,177,.12)}.artifact-list small{overflow:hidden;color:var(--builder-faint);text-overflow:ellipsis}.artifact-list__empty{padding:20px 0;color:var(--builder-muted);font-size:.75rem}.artifact-create{display:grid;margin-top:12px;padding-top:14px;border-top:1px solid var(--builder-border);gap:10px}.artifact-create label,.artifact-inspector label{display:grid;color:var(--builder-muted);font-size:.7rem;gap:6px}.artifact-create input,.artifact-inspector input{min-height:38px;padding:0 10px;border:1px solid var(--builder-border);border-radius:6px;background:#0b1014;color:var(--builder-text)}.artifact-create button,.artifact-inspector button{min-height:38px;padding:0 12px;border:1px solid var(--builder-border-strong);border-radius:6px;background:rgba(120,149,177,.12);color:var(--builder-text)}.artifact-canvas{display:grid;min-width:0;padding:24px;grid-template-rows:auto minmax(0,1fr) auto;gap:16px}.artifact-canvas header{display:flex;align-items:end;justify-content:space-between;gap:20px}.room-shell-visual{position:relative;min-height:0;overflow:hidden;border:1px solid var(--builder-border);border-radius:14px;background:radial-gradient(circle at 50% 40%,rgba(93,129,160,.18),transparent 35%),linear-gradient(#151b20,#0b1014)}.room-shell-visual__frame{position:absolute;inset:12% 8% 18%;border:2px solid #59646f;border-radius:70px 70px 20px 20px}.room-shell-visual__window{position:absolute;inset:20% 18% 38%;border:1px solid #718396;border-radius:50px;background:radial-gradient(circle at 60% 45%,rgba(130,163,190,.2),transparent 55%),#081018}.room-shell-visual__floor{position:absolute;right:8%;bottom:10%;left:8%;height:28%;border-top:1px solid #48545e;transform:perspective(500px) rotateX(55deg);transform-origin:top}.room-shell-visual__marker{position:relative;display:inline-block;width:5px;height:5px;margin:4px;border-radius:50%;background:#8aa2b8}.artifact-note{margin:0;color:var(--builder-muted);font-size:.72rem}.artifact-inspector{display:grid;padding:40px 24px;align-content:start;gap:14px}.artifact-inspector dl{display:grid;margin:4px 0;gap:8px}.artifact-inspector dl>div{display:grid;grid-template-columns:90px 1fr;gap:8px}.artifact-inspector dt{color:var(--builder-faint);font-size:.67rem}.artifact-inspector dd{overflow-wrap:anywhere;margin:0;color:var(--builder-muted);font-size:.68rem}.artifact-inspector .danger{border-color:rgba(177,100,100,.4);background:rgba(177,100,100,.08)}.artifact-error{color:#c69b76}.artifact-state{display:grid;min-height:100%;padding:40px;place-content:center;gap:10px}.artifact-state h1,.artifact-state p{margin:0}.artifact-state p{color:var(--builder-muted)}.artifact-state a{width:fit-content;padding:9px 12px;border:1px solid var(--builder-border-strong);border-radius:7px;background:rgba(120,149,177,.12);color:var(--builder-text);text-decoration:none}
@media(max-width:1040px){.room-shell-v1{grid-template-columns:220px minmax(0,1fr)}.artifact-list{padding-inline:14px}.artifact-canvas{padding:20px}.artifact-inspector{padding:32px 20px}}
@media(max-width:760px){.room-shell-v1{height:auto;min-height:100%;grid-template-columns:1fr}.artifact-list{border-right:0;border-bottom:1px solid var(--builder-border)}.artifact-canvas{min-height:560px}.artifact-inspector{padding-top:24px}}
</style>
