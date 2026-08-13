<template>
  <section
    ref="viewportElement"
    class="cosmos-project-view environment-view"
    :class="{
      'cosmos-project-view--interacting': isPanning || nodeMove !== null,
      'cosmos-project-view--background': backgroundOnly,
    }"
    :aria-label="`${presentation.projectName} Project Cosmos`"
    data-testid="cosmos-project-view"
    @pointerdown="startPan"
    @pointermove="continuePointerInteraction"
    @pointerup="finishPointerInteraction"
    @pointercancel="cancelPointerInteraction"
    @wheel.prevent="zoomAtPointer"
  >
    <div class="cosmos-project-view__stars cosmos-project-view__stars--distant" aria-hidden="true" />
    <div class="cosmos-project-view__stars cosmos-project-view__stars--near" aria-hidden="true" />
    <div
      v-if="visibleProject"
      class="cosmos-project-view__world"
      :class="{ 'cosmos-project-view__world--interacting': isPanning || nodeMove !== null }"
      :style="worldStyle"
    >
      <AsteriaConstellation
        :project="visibleProject"
        @select-node="selectNode"
        @open-node="openNode"
        @open-node-menu="openNodeContextMenu"
        @start-node-move="startNodeMove"
      />
    </div>

    <div
      v-if="presentation.phase !== 'success'"
      class="cosmos-project-view__state"
      :class="`cosmos-project-view__state--${presentation.phase}`"
      :role="presentation.phase === 'error' ? 'alert' : 'status'"
      aria-live="polite"
      data-testid="project-cosmos-state"
    >
      <span aria-hidden="true" />
      <small>Cosmos · Project</small>
      <strong v-if="presentation.phase === 'loading'">Loading project cosmos</strong>
      <template v-else-if="presentation.phase === 'error'">
        <strong>Project cosmos is temporarily unavailable</strong>
        <p>{{ presentation.message }}</p>
      </template>
      <template v-else-if="presentation.phase === 'not-found'">
        <strong>Project not found</strong>
        <p>The requested Project is not available in this cosmos.</p>
      </template>
      <template v-else>
        <strong>This project is quiet</strong>
        <p>No project nodes are available yet.</p>
      </template>
    </div>

    <ProjectCosmosChrome
      :project-name="presentation.projectName"
      :object-count="presentation.objectCount"
      :phase="presentation.phase"
      :left-neighbor="neighbors.left"
      :right-neighbor="neighbors.right"
      :quick-travel-open="quickTravelOpen"
      @back-to-global="backToGlobal"
      @travel-project="travelToProject"
      @toggle-quick-travel="quickTravelOpen = !quickTravelOpen"
    />
    <CosmosQuickTravel
      v-if="quickTravelOpen && mapState.snapshot"
      :projects="mapState.snapshot.projects"
      :focused-project-id="mapState.snapshot.focusedProjectId"
      @close="quickTravelOpen = false"
      @travel-global="travelToCosmos"
      @travel-project="travelToProject"
    />
    <ProjectCosmosControls
      :project-name="presentation.projectName"
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
      :current-location="presentation.projectName"
      @destination="openCompanionDestination"
    />
    <ObjectInteractionHost ref="objectInteractionHost" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { workspaceRoute } from "../base-runtime/baseRuntimeInteractions";
import {
  cosmosProjectNeighbors,
  navigateToBase,
  navigateToGlobal,
  navigateToProject,
  type CosmosNavigationScope,
} from "../cosmosNavigation";
import { useCosmosCameraPresenter } from "../useCosmosCameraPresenter";
import CompanionWindowHost from "../../components/cosmos/CompanionWindowHost.vue";
import CosmosQuickTravel from "../../components/cosmos/CosmosQuickTravel.vue";
import ObjectInteractionHost from "../../components/windows/ObjectInteractionHost.vue";
import { useCosmosRuntime } from "../../runtime/plugin";
import AsteriaConstellation from "./components/AsteriaConstellation.vue";
import ProjectCosmosChrome from "./components/ProjectCosmosChrome.vue";
import ProjectCosmosControls from "./components/ProjectCosmosControls.vue";
import {
  beginProjectNodeMove,
  moveProjectNode,
  openSelectedProjectCosmosNode,
  persistProjectNodeMove,
  type ProjectNodeMoveGesture,
  selectProjectCosmosNode,
} from "./projectCosmosInteraction";
import {
  loadProjectCosmosSnapshot,
  projectIdFromQuery,
  projectProjectCosmosState,
} from "./projectCosmosProjection";

const runtime = useCosmosRuntime();
const route = useRoute();
const router = useRouter();
const props = withDefaults(
  defineProps<{ navigationScope?: CosmosNavigationScope; backgroundOnly?: boolean }>(),
  {
    navigationScope: "development",
    backgroundOnly: false,
  },
);
const mapState = runtime.cosmosMap.state;
const requestedProjectId = computed(() => projectIdFromQuery(route.query.projectId));
const presentation = computed(() =>
  projectProjectCosmosState(
    mapState.phase,
    mapState.snapshot,
    mapState.error,
    requestedProjectId.value,
    mapState.selectedObjectId,
  ),
);
const objectInteractionHost = ref<InstanceType<typeof ObjectInteractionHost> | null>(null);
const companionWindowHost = ref<InstanceType<typeof CompanionWindowHost> | null>(null);
const quickTravelOpen = ref(false);
const nodeMove = ref<ProjectNodeMoveGesture | null>(null);
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
} = useCosmosCameraPresenter(runtime.cosmosMap, requestedProjectId);
const visibleProject = computed(() => {
  const state = presentation.value;
  return state.phase === "success" || state.phase === "empty-project" ? state.project : null;
});
const neighbors = computed(() => {
  const snapshot = mapState.snapshot;
  return cosmosProjectNeighbors(
    snapshot?.projects ?? [],
    requestedProjectId.value,
    snapshot?.camera.x ?? 0,
  );
});

async function backToGlobal(): Promise<void> {
  quickTravelOpen.value = false;
  await persistCameraNow().catch(() => undefined);
  await navigateToGlobal(router, props.navigationScope);
}

async function travelToProject(projectId: string): Promise<void> {
  quickTravelOpen.value = false;
  focusProject(projectId);
  runtime.cosmosMap.select(projectId);
  await Promise.all([
    persistCameraNow(),
    runtime.cosmosMap.persistSelection(),
  ]).catch(() => undefined);
  await navigateToProject(router, projectId, props.navigationScope);
}

async function travelToCosmos(): Promise<void> {
  quickTravelOpen.value = false;
  runtime.cosmosMap.focusCosmos(viewport);
  runtime.cosmosMap.select(null);
  await Promise.all([
    persistCameraNow(),
    runtime.cosmosMap.persistSelection(),
  ]).catch(() => undefined);
  await navigateToGlobal(router, props.navigationScope);
}

function selectNode(objectId: string): void {
  const project = visibleProject.value;
  if (!project) return;
  if (objectId === project.objectId) fit();
  if (mapState.selectedObjectId === objectId) return;
  void selectProjectCosmosNode(runtime.cosmosMap, project, objectId).catch(() => undefined);
}

function openNode(objectId: string): void {
  const project = visibleProject.value;
  const host = objectInteractionHost.value;
  if (!project) return;
  if (objectId === project.objectId && project.workspaceObjectId) {
    void router.push(workspaceRoute(project.workspaceObjectId));
    return;
  }
  if (!host) return;
  void openSelectedProjectCosmosNode(host, project, objectId).catch(() => undefined);
}

function openNodeContextMenu(event: MouseEvent, objectId: string): void {
  const project = visibleProject.value;
  const host = objectInteractionHost.value;
  const belongsToProject = project && (
    project.objectId === objectId || project.nodes.some((node) => node.objectId === objectId)
  );
  if (!project || !host || !belongsToProject) return;
  quickTravelOpen.value = false;
  runtime.cosmosMap.select(objectId);
  void runtime.cosmosMap.persistSelection().catch(() => undefined);
  void host.openContextMenu(objectId, { x: event.clientX, y: event.clientY }).catch(() => undefined);
}

function openCompanionDestination(objectId: string): void {
  void objectInteractionHost.value?.openObject(objectId, "details").catch(() => undefined);
}

function openCompanion(): void {
  companionWindowHost.value?.open();
}

function openBase(): void {
  void navigateToBase(router);
}

function openThemes(): void {
  void router.push({ name: "theme-library" });
}

function startNodeMove(event: PointerEvent, objectId: string): void {
  const project = visibleProject.value;
  if (event.button !== 0 || !project) return;
  const gesture = beginProjectNodeMove(project, objectId, event);
  if (!gesture) return;
  event.preventDefault();
  nodeMove.value = gesture;
  viewportElement.value?.setPointerCapture(event.pointerId);
  selectNode(objectId);
}

function continuePointerInteraction(event: PointerEvent): void {
  const gesture = nodeMove.value;
  if (gesture?.pointerId === event.pointerId) {
    moveProjectNode(
      runtime.cosmosMap,
      gesture,
      event,
      mapState.snapshot?.camera.zoom ?? 1,
    );
    return;
  }
  continuePan(event);
}

function finishPointerInteraction(event: PointerEvent): void {
  const gesture = nodeMove.value;
  if (gesture?.pointerId === event.pointerId) {
    nodeMove.value = null;
    releasePointer(event.pointerId);
    void persistProjectNodeMove(runtime.cosmosMap, gesture).catch(() => {
      void loadProjectCosmosSnapshot(runtime.cosmosMap).catch(() => undefined);
    });
    return;
  }
  finishPan(event);
}

function cancelPointerInteraction(event: PointerEvent): void {
  if (nodeMove.value?.pointerId === event.pointerId) {
    nodeMove.value = null;
    releasePointer(event.pointerId);
    void loadProjectCosmosSnapshot(runtime.cosmosMap).catch(() => undefined);
    return;
  }
  cancelPan(event);
}

function releasePointer(pointerId: number): void {
  if (viewportElement.value?.hasPointerCapture(pointerId)) {
    viewportElement.value.releasePointerCapture(pointerId);
  }
}

onMounted(() => {
  void loadProjectCosmosSnapshot(runtime.cosmosMap).catch(() => undefined);
});
</script>

<style scoped>
.cosmos-project-view {
  overflow: hidden;
  touch-action: none;
  background:
    radial-gradient(ellipse at 50% 49%, rgba(33, 80, 103, 0.13), transparent 39%),
    radial-gradient(ellipse at 68% 28%, rgba(47, 62, 101, 0.08), transparent 30%),
    linear-gradient(145deg, #010309, #030811 54%, #010308);
  color: var(--cosmos-color-text);
}

.cosmos-project-view--interacting {
  cursor: grabbing;
}

.cosmos-project-view--background {
  pointer-events: none;
}

.cosmos-project-view--background :deep(.project-cosmos-chrome),
.cosmos-project-view--background :deep(.project-cosmos-controls),
.cosmos-project-view--background :deep(.cosmos-quick-travel) {
  display: none;
}

.cosmos-project-view__world {
  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  transform-origin: 0 0;
  transition: transform 220ms ease;
}

.cosmos-project-view__world--interacting {
  transition: none;
}

.cosmos-project-view::after {
  position: absolute;
  z-index: 20;
  inset: 0;
  background: radial-gradient(ellipse at 50% 49%, transparent 45%, rgba(0, 2, 7, 0.32) 100%);
  content: "";
  pointer-events: none;
}

.cosmos-project-view__stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.cosmos-project-view__stars--distant {
  background-image:
    radial-gradient(circle, rgba(226, 236, 243, 0.58) 0 0.65px, transparent 1px),
    radial-gradient(circle, rgba(111, 180, 214, 0.34) 0 0.7px, transparent 1.1px),
    radial-gradient(circle, rgba(210, 217, 222, 0.22) 0 0.6px, transparent 1px);
  background-position: 8px 18px, 58px 72px, 106px 31px;
  background-size: 67px 67px, 113px 113px, 173px 173px;
  opacity: 0.62;
}

.cosmos-project-view__stars--near {
  background-image: radial-gradient(circle, rgba(244, 249, 252, 0.84) 0 1px, transparent 1.55px);
  background-position: 31px 12px;
  background-size: 209px 209px;
  opacity: 0.34;
}

.cosmos-project-view__state {
  position: absolute;
  z-index: 8;
  top: 50%;
  left: 50%;
  display: grid;
  width: min(390px, calc(100vw - 48px));
  transform: translate(-50%, -50%);
  place-items: center;
  color: var(--cosmos-color-muted);
  text-align: center;
  gap: 9px;
}

.cosmos-project-view__state--empty-project {
  top: auto;
  bottom: 102px;
  transform: translateX(-50%);
}

.cosmos-project-view__state > span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cosmos-color-accent);
  box-shadow: 0 0 18px color-mix(in srgb, var(--cosmos-color-accent) 52%, transparent);
  opacity: 0.72;
}

.cosmos-project-view__state small {
  color: var(--cosmos-color-faint);
  font-size: 0.57rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.cosmos-project-view__state strong {
  color: var(--cosmos-color-text);
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.3rem;
  font-weight: 400;
  letter-spacing: 0.02em;
}

.cosmos-project-view__state p {
  max-width: 340px;
  margin: 0;
  color: var(--cosmos-color-muted);
  font-size: 0.68rem;
  line-height: 1.55;
}

.cosmos-project-view__state--loading > span {
  animation: project-cosmos-pulse 1.8s ease-in-out infinite;
}

.cosmos-project-view__state--error > span {
  background: #c79578;
  box-shadow: 0 0 16px rgba(199, 149, 120, 0.32);
}

@keyframes project-cosmos-pulse {
  50% { opacity: 0.28; transform: scale(0.72); }
}

@media (prefers-reduced-motion: reduce) {
  .cosmos-project-view__state--loading > span { animation: none; }
  .cosmos-project-view__world { transition: none; }
}
</style>
