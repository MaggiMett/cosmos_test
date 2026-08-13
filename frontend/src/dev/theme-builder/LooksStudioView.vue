<template>
  <ThemeBuilderShell
    active-studio="looks"
    studio-label="Looks Studio"
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
    <section v-if="phase !== 'success'" class="looks-studio-state" :aria-live="phase === 'loading' ? 'polite' : undefined">
      <template v-if="phase === 'loading'"><h1 class="builder-serif">Loading Looks Studio…</h1></template>
      <template v-else-if="phase === 'error'"><h1 class="builder-serif">Looks Studio unavailable</h1><p role="alert">{{ loadError }}</p><button type="button" @click="loadProject">Try again</button></template>
      <template v-else-if="phase === 'missing-template'"><h1 class="builder-serif">Missing Target Template</h1><p role="alert">{{ commandError }}</p></template>
      <template v-else>
        <p class="looks-studio-state__eyebrow">{{ selectedTemplateEntry ? "Template selected" : "No Skin Selected" }}</p>
        <h1 class="builder-serif">{{ selectedTemplateEntry ? `${selectedTemplateEntry.label} gestalten` : "Create or open a Skin Draft" }}</h1>
        <p v-if="selectedTemplateEntry" class="looks-studio-state__template-flow">
          {{ selectedTemplateDescription }}
        </p>
        <section v-if="selectedTemplateEntry" class="looks-studio-state__template-guide" aria-label="Theme workflow">
          <article>
            <span>1</span>
            <div><strong>Clear template</strong><small>Form, slots, states and safe interaction areas.</small></div>
          </article>
          <i aria-hidden="true" />
          <article>
            <span>2</span>
            <div><strong>Cosmos Core</strong><small>Our first finished example · {{ selectedTemplateEntry.visualReference }}</small></div>
          </article>
          <i aria-hidden="true" />
          <article>
            <span>3</span>
            <div><strong>Your theme</strong><small>Replace the visual layer without changing the Core contract.</small></div>
          </article>
        </section>
        <p v-if="!projectId">Open Looks Studio with an explicit builderProjectId.</p>
        <template v-else-if="snapshot">
          <nav v-if="matchingSkins.length" aria-label="Existing Skin Drafts">
            <RouterLink v-for="skin in matchingSkins" :key="skin.skinId" :to="{ name: 'theme-builder-looks', query: { builderProjectId: projectId, skinId: skin.skinId, template: requestedTemplateCatalogId || undefined } }">Continue {{ skin.displayName }}</RouterLink>
          </nav>
          <div class="looks-studio-state__create">
            <h2 class="builder-serif">{{ selectedTemplateEntry ? `Create ${selectedTemplateEntry.label} look` : "Create Skin" }}</h2>
            <label v-if="!selectedTemplateEntry">Target Template
              <select v-model="createTemplateId"><option v-for="template in availableTemplates" :key="template.templateId" :value="template.templateId">{{ template.displayName }} · {{ template.templateId }}@{{ template.version }}</option></select>
            </label>
            <p v-else class="looks-studio-state__target">Using <strong>{{ selectedTemplateEntry.label }}</strong> clear template.</p>
            <label>Look name <input v-model="createName" maxlength="120" :placeholder="selectedTemplateEntry ? `${selectedTemplateEntry.label} — My Theme` : 'Optional'" /></label>
            <button type="button" :disabled="!createTemplateId" @click="createSkin">Create Look</button>
            <p v-if="commandError" role="alert">{{ commandError }}</p>
          </div>
        </template>
      </template>
    </section>

    <div v-else-if="resolved && snapshot" class="looks-studio-workspace" data-testid="looks-studio-view">
      <LooksStudioContextPanel
        :template-name="resolved.template.displayName"
        :template-id="resolved.template.templateId"
        :template-version="resolved.template.version"
        :slots="slotItems"
        :assets="assetItems"
        :states="stateItems"
        :active-state-id="activeStateId"
        :selected-slot-id="selectedSlotId"
        @select-slot="selectedSlotId = $event"
        @select-state="selectState"
        @assign-asset="assignAsset"
        @clear-slot="clearSlot"
      />
      <LooksStudioCanvas
        :template-name="resolved.template.displayName"
        :template-id="resolved.template.templateId"
        :slots="slotItems"
        :states="stateItems"
        :active-state-id="activeStateId"
        :selected-slot-id="selectedSlotId"
        :material-fill="materialFill"
        :material-stroke="materialStroke"
        :material-opacity="materialOpacity"
        :material-texture-url="materialTextureUrl"
        @select-state="selectState"
        @select-slot="selectedSlotId = $event"
      />
      <div class="looks-studio-workspace__shelf"><AssetShelfBar /></div>
      <p v-if="commandError" class="looks-studio-workspace__message" role="alert">{{ commandError }}</p>
      <p v-else-if="missingAssetCount" class="looks-studio-workspace__message" role="status">{{ missingAssetCount }} Missing Asset Reference{{ missingAssetCount === 1 ? '' : 's' }}</p>
      <p v-else-if="catalogError" class="looks-studio-workspace__message" role="status">Asset previews unavailable: {{ catalogError }}</p>
    </div>

    <template #context>
      <LooksStudioInspector
        v-if="phase === 'success' && resolved"
        :skin-name="resolved.skin.displayName"
        :part-name="selectedSlot?.label ?? 'Overall Look'"
        :part-id="selectedSlot?.slotId ?? ''"
        :state-label="activeStateLabel"
        :fill="materialFill"
        :stroke="materialStroke"
        :opacity="materialOpacity"
        :texture-ref="materialTexture"
        :assets="assetItems.filter((asset) => asset.status === 'available')"
        @set-material="setMaterial"
        @clear-material="clearMaterial"
      />
      <div v-else class="looks-studio-context-state">
        <h2 class="builder-serif">Looks Draft</h2><p>Selection and material controls appear after a real Skin Draft is opened.</p>
      </div>
      <p v-if="snapshot?.saveConflict" class="looks-studio-context-error" role="alert">Revision Conflict. Reload before saving again.</p>
      <p v-else-if="snapshot?.saveError" class="looks-studio-context-error" role="alert">Save Error: {{ snapshot.saveError.message }}</p>
    </template>
  </ThemeBuilderShell>
</template>

<script setup lang="ts">
import "./themeBuilder.css";
import { computed, ref, shallowRef, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { assetCatalogApi, type PersistedAssetCatalogRecord } from "../../runtime/assetCatalogApi";
import { themeBuilderProjectApi } from "../../runtime/themeBuilderProjectApi";
import {
  BASE_MAIN_ROOM_TEMPLATE_ID,
  TemplateRegistry,
  baseMainRoomTemplate,
  clusterNodeTemplate,
  coreTemplateCatalog,
  cosmosConnectionTemplate,
  cosmosMapTemplate,
  detailNodeTemplate,
  domainNodeTemplate,
  objectNodeTemplate,
  projectRootNodeTemplate,
  type CoreTemplateCatalogEntry,
  type ExactVersionedRef,
  type JsonValue,
} from "../../theme-engine";
import AssetShelfBar from "./components/AssetShelfBar.vue";
import LooksStudioCanvas from "./components/LooksStudioCanvas.vue";
import LooksStudioContextPanel from "./components/LooksStudioContextPanel.vue";
import LooksStudioInspector from "./components/LooksStudioInspector.vue";
import ThemeBuilderShell from "./components/ThemeBuilderShell.vue";
import { projectLooksSlots, projectLooksStates } from "./looksStudioProjection";
import { BuilderAssetCatalogIndex, projectBuilderAssets } from "./themeBuilderAssetReferences";
import { resolveSkinDraft, SkinDraftError, type ResolvedSkinDraft } from "./themeBuilderSkinDraft";
import { ThemeBuilderSession, type ThemeBuilderSessionSnapshot } from "./themeBuilderSession";

type Phase = "empty" | "loading" | "error" | "missing-template" | "success";
const templates = new TemplateRegistry();
[
  baseMainRoomTemplate,
  cosmosMapTemplate,
  projectRootNodeTemplate,
  domainNodeTemplate,
  clusterNodeTemplate,
  objectNodeTemplate,
  detailNodeTemplate,
  cosmosConnectionTemplate,
].forEach((template) => templates.register(template));
const route = useRoute();
const router = useRouter();
const phase = shallowRef<Phase>("empty");
const loadError = shallowRef("");
const commandError = shallowRef("");
const catalogError = shallowRef("");
const catalogLoaded = shallowRef(false);
const catalogRecords = shallowRef<readonly Readonly<PersistedAssetCatalogRecord>[]>([]);
const snapshot = shallowRef<Readonly<ThemeBuilderSessionSnapshot>>();
const resolved = shallowRef<Readonly<ResolvedSkinDraft>>();
const activeStateId = ref("default");
const selectedSlotId = ref("");
const createTemplateId = ref(BASE_MAIN_ROOM_TEMPLATE_ID);
const createName = ref("");
let session: ThemeBuilderSession | undefined;

const projectId = computed(() => typeof route.query.builderProjectId === "string" ? route.query.builderProjectId.trim() : "");
const requestedSkinId = computed(() => typeof route.query.skinId === "string" ? route.query.skinId.trim() : "");
const requestedTemplateCatalogId = computed(() => typeof route.query.template === "string" ? route.query.template.trim() : "");
const selectedTemplateEntry = computed<CoreTemplateCatalogEntry | undefined>(() =>
  coreTemplateCatalog.find((entry) => entry.catalogId === requestedTemplateCatalogId.value),
);
const selectedTemplateDescription = computed(() => {
  const entry = selectedTemplateEntry.value;
  if (!entry) return "";
  if (entry.catalogId === "cosmos.map") return "Style the map background and atmosphere around project constellations.";
  if (entry.catalogId.startsWith("cosmos.node.")) return "Style this level of the project hierarchy while Core keeps its meaning and interaction.";
  if (entry.catalogId === "cosmos.connection") return "Style the visual link between Nodes while Core owns both endpoints and their relationship.";
  if (entry.catalogId === "base.room.main") return "Style the Base shell and its default theme presentation without changing runtime ownership.";
  return "Style this Cosmos surface without changing its Core behavior.";
});
const availableTemplates = computed(() => templates.list().filter((template) => (template.assetSlots?.length ?? 0) > 0));
const existingSkins = computed(() => snapshot.value?.project.artifacts.skinPacks.flatMap((pack) => pack.skins) ?? []);
const matchingSkins = computed(() => {
  const templateId = selectedTemplateEntry.value?.templateId;
  if (!templateId) return existingSkins.value;
  return existingSkins.value.filter((skin) => skin.target.templateRef.id === templateId);
});
const assetItems = computed(() => snapshot.value
  ? projectBuilderAssets(snapshot.value.project, catalogRecords.value, catalogLoaded.value)
  : []);
const assetCatalogIndex = computed(() => new BuilderAssetCatalogIndex(catalogRecords.value));
const stateItems = computed(() => resolved.value ? projectLooksStates(resolved.value.template) : []);
const slotItems = computed(() => resolved.value
  ? projectLooksSlots(resolved.value.skin, resolved.value.template, assetItems.value, activeStateId.value)
  : []);
const activeStateLabel = computed(() => stateItems.value.find((state) => state.stateId === activeStateId.value)?.label ?? activeStateId.value);
const selectedSlot = computed(() => slotItems.value.find((slot) => slot.slotId === selectedSlotId.value));
const missingAssetCount = computed(() => slotItems.value.filter((slot) => slot.assetStatus === "missing").length);
const selectedMaterialChannelId = computed(() => selectedSlotId.value ? `core.material.part-surface.${selectedSlotId.value}` : "core.material.dom-surface");
const material = computed(() => resolved.value?.skin.materials.find((item) => item.channelId === selectedMaterialChannelId.value));
const materialFill = computed(() => colorValue(material.value?.parameters["core.material.fill"], "#30343a"));
const materialStroke = computed(() => colorValue(material.value?.parameters["core.material.stroke"], "#8b929c"));
const materialOpacity = computed(() => typeof material.value?.parameters["core.material.opacity"] === "number" ? material.value.parameters["core.material.opacity"] : 1);
const materialTexture = computed(() => typeof material.value?.parameters["core.material.texture-ref"] === "string" ? material.value.parameters["core.material.texture-ref"] : "");
const materialTextureUrl = computed(() => assetItems.value.find((asset) =>
  asset.reference.id === materialTexture.value && asset.status === "available",
)?.previewUrl ?? "");

watch(projectId, loadProject, { immediate: true });
watch(requestedSkinId, resolveRouteSkin);
watch(requestedTemplateCatalogId, () => {
  const templateId = selectedTemplateEntry.value?.templateId;
  if (templateId && templates.get(templateId)) createTemplateId.value = templateId;
}, { immediate: true });

async function loadProject(): Promise<void> {
  session = undefined; snapshot.value = undefined; resolved.value = undefined; commandError.value = "";
  if (!projectId.value) { phase.value = "empty"; return; }
  phase.value = "loading";
  const result = await themeBuilderProjectApi.get(projectId.value);
  if (!result.ok) { loadError.value = result.error.message; phase.value = "error"; return; }
  session = new ThemeBuilderSession(result.data, templates);
  syncSnapshot();
  resolveRouteSkin();
  void loadCatalog();
}

async function loadCatalog(): Promise<void> {
  catalogLoaded.value = false; catalogError.value = "";
  const result = await assetCatalogApi.list();
  if (!result.ok) { catalogError.value = result.error.message; return; }
  catalogRecords.value = result.data; catalogLoaded.value = true;
}

function resolveRouteSkin(): void {
  resolved.value = undefined; commandError.value = "";
  if (!snapshot.value || !requestedSkinId.value) { phase.value = "empty"; return; }
  try {
    resolved.value = resolveSkinDraft(snapshot.value.project, requestedSkinId.value, templates);
    const stateIds = resolved.value.template.states.map((state) => state.stateId);
    activeStateId.value = stateIds.includes(activeStateId.value) ? activeStateId.value : stateIds[0] ?? "default";
    selectedSlotId.value = resolved.value.slots.some((slot) => slot.slotId === selectedSlotId.value)
      ? selectedSlotId.value : resolved.value.slots[0]?.slotId ?? "";
    phase.value = "success";
  } catch (error) {
    commandError.value = error instanceof Error ? error.message : "The Skin Draft is unavailable.";
    phase.value = error instanceof SkinDraftError && error.code === "missing-template" ? "missing-template" : "empty";
  }
}

async function createSkin(): Promise<void> {
  if (!session) return;
  const before = new Set(existingSkins.value.map((skin) => skin.skinId));
  try {
    session.execute({ type: "create-skin-draft", targetTemplateId: createTemplateId.value, name: createName.value });
    syncSnapshot();
    const created = existingSkins.value.find((skin) => !before.has(skin.skinId));
    if (created) await router.replace({ name: "theme-builder-looks", query: { builderProjectId: projectId.value, skinId: created.skinId, template: requestedTemplateCatalogId.value || undefined } });
  } catch (error) { showCommandError(error); }
}

function selectState(stateId: string): void { activeStateId.value = stateId; commandError.value = ""; }
function assignAsset(reference: Readonly<ExactVersionedRef>): void {
  execute({ type: "assign-skin-slot-asset", skinId: requestedSkinId.value, slotId: selectedSlotId.value, stateId: activeStateId.value, reference });
}
function clearSlot(): void {
  execute({ type: "clear-skin-slot-asset", skinId: requestedSkinId.value, slotId: selectedSlotId.value, stateId: activeStateId.value });
}
function setMaterial(parameterId: string, value: JsonValue): void {
  if (value === null) {
    execute({ type: "clear-skin-material-channel", skinId: requestedSkinId.value, channelId: selectedMaterialChannelId.value, parameterId });
    return;
  }
  execute({ type: "set-skin-material-channel", skinId: requestedSkinId.value, channelId: selectedMaterialChannelId.value, parameterId, value });
}
function clearMaterial(): void { execute({ type: "clear-skin-material-channel", skinId: requestedSkinId.value, channelId: selectedMaterialChannelId.value }); }

function execute(command: Parameters<ThemeBuilderSession["execute"]>[0]): void {
  if (!session) return;
  try { session.execute(command, command.type === "assign-skin-slot-asset" ? assetCatalogIndex.value : undefined); commandError.value = ""; syncSnapshot(); resolveRouteSkin(); }
  catch (error) { showCommandError(error); }
}
async function save(): Promise<void> { if (!session) return; const pending = session.save(themeBuilderProjectApi); syncSnapshot(); await pending; syncSnapshot(); resolveRouteSkin(); }
function undo(): void { session?.undo(); syncSnapshot(); resolveRouteSkin(); }
function redo(): void { session?.redo(); syncSnapshot(); resolveRouteSkin(); }
function syncSnapshot(): void { if (session) snapshot.value = session.snapshot; }
function showCommandError(error: unknown): void { commandError.value = error instanceof Error ? error.message : "The Skin Draft could not be changed."; }
function colorValue(value: JsonValue | undefined, fallback: string): string { return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback; }
</script>

<style scoped>
.looks-studio-workspace{position:relative;display:grid;width:100%;height:100%;min-width:0;min-height:0;grid-template-columns:286px minmax(0,1fr);grid-template-rows:minmax(0,1fr) 50px}.looks-studio-workspace>:deep(.looks-context){grid-row:1/-1}.looks-studio-workspace__shelf{min-width:0;padding:0 12px 6px}.looks-studio-workspace__message{position:absolute;right:24px;bottom:62px;max-width:360px;margin:0;padding:8px 11px;border:1px solid var(--builder-border-strong);border-radius:var(--builder-radius-control);background:rgba(12,16,20,.94);color:#c69b76;font-size:.68rem}.looks-studio-state{display:grid;width:min(680px,calc(100% - 56px));min-height:100%;margin:0 auto;align-content:center;gap:12px}.looks-studio-state h1,.looks-studio-state h2{margin:0}.looks-studio-state p{margin:0;color:var(--builder-muted)}.looks-studio-state__eyebrow{color:var(--builder-faint)!important;text-transform:uppercase;letter-spacing:.12em}.looks-studio-state nav{display:flex;flex-wrap:wrap;gap:8px}.looks-studio-state nav a,.looks-studio-state button{min-height:36px;padding:0 13px;border:1px solid var(--builder-border);border-radius:var(--builder-radius-control);background:rgba(120,149,177,.1);color:var(--builder-text);text-decoration:none}.looks-studio-state__template-flow{max-width:620px;line-height:1.55}.looks-studio-state__template-guide{display:grid;grid-template-columns:minmax(0,1fr) 28px minmax(0,1fr) 28px minmax(0,1fr);align-items:center;margin:6px 0 2px;padding:14px;border:1px solid var(--builder-border);border-radius:var(--builder-radius-card);background:rgba(255,255,255,.012)}.looks-studio-state__template-guide article{display:flex;align-items:center;gap:9px}.looks-studio-state__template-guide article>span{display:grid;width:25px;height:25px;flex:0 0 25px;border:1px solid var(--builder-border-strong);border-radius:50%;place-items:center;color:var(--builder-text);font-size:.64rem}.looks-studio-state__template-guide article div{display:grid;gap:2px}.looks-studio-state__template-guide strong{color:var(--builder-text);font-size:.68rem}.looks-studio-state__template-guide small{color:var(--builder-faint);font-size:.59rem;line-height:1.35}.looks-studio-state__template-guide i{height:1px;background:var(--builder-border)}.looks-studio-state__target{padding:8px 10px;border-left:2px solid var(--builder-accent);background:rgba(120,149,177,.06);font-size:.68rem}.looks-studio-state__create{display:grid;margin-top:14px;padding:18px;border:1px solid var(--builder-border);border-radius:var(--builder-radius-card);gap:12px}.looks-studio-state__create label{display:grid;color:var(--builder-muted);font-size:.7rem;gap:6px}.looks-studio-state__create input,.looks-studio-state__create select{min-height:38px;padding:0 10px;border:1px solid var(--builder-border);border-radius:var(--builder-radius-control);background:rgba(6,10,14,.55);color:var(--builder-text)}.looks-studio-context-state{display:grid;padding:46px 24px;align-content:start;gap:10px}.looks-studio-context-state h2,.looks-studio-context-state p{margin:0}.looks-studio-context-state p{color:var(--builder-muted);font-size:.72rem}.looks-studio-context-error{margin:0 24px;color:#c69b76;font-size:.7rem}@media(max-width:1280px){.looks-studio-workspace{grid-template-columns:250px minmax(0,1fr)}}
</style>
