<template>
  <section
    ref="viewportElement"
    class="cosmos-global-view environment-view"
    :class="{ 'cosmos-global-view--interacting': isPanning }"
    aria-label="Global Cosmos View"
    data-testid="cosmos-global-view"
    @pointerdown="startPan"
    @pointermove="continuePan"
    @pointerup="finishPan"
    @pointercancel="cancelPan"
    @wheel.prevent="zoomAtPointer"
  >
    <div class="cosmos-global-view__stars cosmos-global-view__stars--distant" aria-hidden="true" />
    <div class="cosmos-global-view__stars cosmos-global-view__stars--near" aria-hidden="true" />
    <GlobalCosmosUniverse
      v-if="presentation.phase === 'success'"
      :regions="presentation.regions"
      :style="worldStyle"
      :class="{ 'global-universe--interacting': isPanning }"
      @activate-project="openProject"
      @open-project-menu="openProjectContextMenu"
    />

    <div
      v-else
      class="cosmos-global-view__state"
      :class="`cosmos-global-view__state--${presentation.phase}`"
      :role="presentation.phase === 'error' ? 'alert' : 'status'"
      aria-live="polite"
      data-testid="global-cosmos-state"
    >
      <span aria-hidden="true" />
      <small>Cosmos · Global</small>
      <strong v-if="presentation.phase === 'loading'">Loading your cosmos</strong>
      <template v-else-if="presentation.phase === 'error'">
        <strong>Cosmos is temporarily unavailable</strong>
        <p>{{ presentation.message }}</p>
      </template>
      <template v-else>
        <strong>Your cosmos is quiet</strong>
        <p>No projects are available yet.</p>
      </template>
    </div>

    <GlobalCosmosChrome
      :project-count="presentation.projectCount"
      :phase="presentation.phase"
      :left-neighbor="neighbors.left"
      :right-neighbor="neighbors.right"
      :quick-travel-open="quickTravelOpen"
      @travel-project="openProject"
      @toggle-quick-travel="quickTravelOpen = !quickTravelOpen"
    />
    <CosmosQuickTravel
      v-if="quickTravelOpen && mapState.snapshot"
      :projects="mapState.snapshot.projects"
      :focused-project-id="mapState.snapshot.focusedProjectId"
      @close="quickTravelOpen = false"
      @travel-global="travelToGlobal"
      @travel-project="openProject"
    />
    <GlobalCosmosControls
      :zoom-label="presentation.zoomLabel"
      @zoom-out="zoomBy(1 / 1.18)"
      @zoom-in="zoomBy(1.18)"
      @fit="fit"
      @open-base="openBase"
      @open-companion="openCompanion"
      @open-themes="openThemes"
    />
    <CompanionWindowHost
      ref="companionWindowHost"
      current-location="Cosmos"
      @destination="openObject"
    />
    <ObjectInteractionHost ref="objectInteractionHost" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import {
  cosmosProjectNeighbors,
  navigateToGlobal,
  navigateToProject,
  type CosmosNavigationScope,
} from "../cosmosNavigation";
import { useCosmosCameraPresenter } from "../useCosmosCameraPresenter";
import CompanionWindowHost from "../../components/cosmos/CompanionWindowHost.vue";
import CosmosQuickTravel from "../../components/cosmos/CosmosQuickTravel.vue";
import ObjectInteractionHost from "../../components/windows/ObjectInteractionHost.vue";
import { useCosmosRuntime } from "../../runtime/plugin";
import GlobalCosmosChrome from "./components/GlobalCosmosChrome.vue";
import GlobalCosmosControls from "./components/GlobalCosmosControls.vue";
import GlobalCosmosUniverse from "./components/GlobalCosmosUniverse.vue";
import { loadGlobalCosmosSnapshot, projectGlobalCosmosState } from "./globalCosmosProjection";

const runtime = useCosmosRuntime();
const router = useRouter();
const props = withDefaults(defineProps<{ navigationScope?: CosmosNavigationScope }>(), {
  navigationScope: "development",
});
const mapState = runtime.cosmosMap.state;
const quickTravelOpen = ref(false);
const companionWindowHost = ref<InstanceType<typeof CompanionWindowHost> | null>(null);
const objectInteractionHost = ref<InstanceType<typeof ObjectInteractionHost> | null>(null);
const presentation = computed(() =>
  projectGlobalCosmosState(
    mapState.phase,
    mapState.snapshot,
    mapState.error,
    mapState.selectedObjectId,
  ),
);
const {
  viewportElement,
  viewport,
  worldStyle,
  isPanning,
  startPan,
  continuePan,
  finishPan,
  cancelPan,
  zoomAtPointer,
  zoomBy,
  fit,
  focusProject,
  persistCameraNow,
} = useCosmosCameraPresenter(runtime.cosmosMap);
const neighbors = computed(() => {
  const snapshot = mapState.snapshot;
  return cosmosProjectNeighbors(
    snapshot?.projects ?? [],
    snapshot?.focusedProjectId ?? null,
    snapshot?.camera.x ?? 0,
  );
});

async function openProject(projectId: string): Promise<void> {
  quickTravelOpen.value = false;
  focusProject(projectId);
  runtime.cosmosMap.select(projectId);
  await Promise.all([
    persistCameraNow(),
    runtime.cosmosMap.persistSelection(),
  ]).catch(() => undefined);
  await navigateToProject(router, projectId, props.navigationScope);
}

async function travelToGlobal(): Promise<void> {
  quickTravelOpen.value = false;
  runtime.cosmosMap.focusCosmos(viewport);
  runtime.cosmosMap.select(null);
  await Promise.all([
    persistCameraNow(),
    runtime.cosmosMap.persistSelection(),
  ]).catch(() => undefined);
  await navigateToGlobal(router, props.navigationScope);
}

function openProjectContextMenu(event: MouseEvent, projectId: string): void {
  const host = objectInteractionHost.value;
  const state = presentation.value;
  if (state.phase !== "success" || !host || !state.regions.some((region) => region.objectId === projectId)) return;
  quickTravelOpen.value = false;
  runtime.cosmosMap.select(projectId);
  void runtime.cosmosMap.persistSelection().catch(() => undefined);
  void host.openContextMenu(projectId, { x: event.clientX, y: event.clientY }).catch(() => undefined);
}

function openObject(objectId: string): void {
  void objectInteractionHost.value?.openObject(objectId, "details").catch(() => undefined);
}

function openCompanion(): void {
  companionWindowHost.value?.open();
}

function openBase(): void {
  void router.push("/base");
}

function openThemes(): void {
  void router.push({ name: "theme-library" });
}

onMounted(() => {
  void loadGlobalCosmosSnapshot(runtime.cosmosMap).catch(() => undefined);
});
</script>

<style scoped>
.cosmos-global-view {
  overflow: hidden;
  touch-action: none;
  background:
    radial-gradient(ellipse at 38% 48%, rgba(30, 72, 95, 0.08), transparent 35%),
    radial-gradient(ellipse at 73% 68%, rgba(23, 80, 79, 0.06), transparent 28%),
    linear-gradient(145deg, #010308, #030711 53%, #010207);
  color: var(--cosmos-color-text);
}

.cosmos-global-view--interacting {
  cursor: grabbing;
}

.cosmos-global-view::after {
  position: absolute;
  z-index: 20;
  inset: 0;
  background: radial-gradient(ellipse at 50% 50%, transparent 42%, rgba(0, 2, 7, 0.36) 100%);
  content: "";
  pointer-events: none;
}

.cosmos-global-view__stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.cosmos-global-view__stars--distant {
  background-image:
    radial-gradient(circle, rgba(226, 236, 243, 0.5) 0 0.55px, transparent 0.95px),
    radial-gradient(circle, rgba(111, 180, 214, 0.27) 0 0.7px, transparent 1.05px),
    radial-gradient(circle, rgba(210, 217, 222, 0.19) 0 0.55px, transparent 0.95px);
  background-position: 10px 17px, 61px 74px, 111px 34px;
  background-size: 71px 71px, 127px 127px, 181px 181px;
  opacity: 0.62;
}

.cosmos-global-view__stars--near {
  background-image: radial-gradient(circle, rgba(244, 249, 252, 0.75) 0 0.9px, transparent 1.45px);
  background-position: 33px 15px;
  background-size: 233px 233px;
  opacity: 0.28;
}

.cosmos-global-view__state {
  position: absolute;
  z-index: 8;
  top: 50%;
  left: 50%;
  display: grid;
  width: min(380px, calc(100vw - 48px));
  transform: translate(-50%, -50%);
  place-items: center;
  color: var(--cosmos-color-muted);
  text-align: center;
  gap: 9px;
}

.cosmos-global-view__state > span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cosmos-color-accent);
  box-shadow: 0 0 18px color-mix(in srgb, var(--cosmos-color-accent) 52%, transparent);
  opacity: 0.72;
}

.cosmos-global-view__state small {
  color: var(--cosmos-color-faint);
  font-size: 0.57rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.cosmos-global-view__state strong {
  color: var(--cosmos-color-text);
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.3rem;
  font-weight: 400;
  letter-spacing: 0.02em;
}

.cosmos-global-view__state p {
  max-width: 330px;
  margin: 0;
  color: var(--cosmos-color-muted);
  font-size: 0.68rem;
  line-height: 1.55;
}

.cosmos-global-view__state--loading > span {
  animation: global-cosmos-pulse 1.8s ease-in-out infinite;
}

.cosmos-global-view__state--error > span {
  background: #c79578;
  box-shadow: 0 0 16px rgba(199, 149, 120, 0.32);
}

@keyframes global-cosmos-pulse {
  50% { opacity: 0.28; transform: scale(0.72); }
}

@media (prefers-reduced-motion: reduce) {
  .cosmos-global-view__state--loading > span { animation: none; }
}
</style>
