<template>
  <section
    ref="viewportElement"
    class="cosmos-map environment-view"
    :class="{ 'cosmos-map--interacting': cameraDrag || nodeDrag }"
    aria-label="Cosmos Map"
    tabindex="0"
    @pointerdown="startCameraPan"
    @pointermove="continuePointerInteraction"
    @pointerup="finishPointerInteraction"
    @pointercancel="cancelPointerInteraction"
    @wheel.prevent="zoomAtPointer"
  >
    <div class="cosmos-map__stars cosmos-map__stars--distant" aria-hidden="true" />
    <div class="cosmos-map__stars cosmos-map__stars--near" aria-hidden="true" />

    <div v-if="state.phase === 'loading' || state.phase === 'idle'" class="map-status" role="status">
      <span class="map-status__orbit" aria-hidden="true" />
      <p>Charting your Cosmos…</p>
    </div>
    <div v-else-if="state.phase === 'failed'" class="map-status" role="alert">
      <p>{{ state.error }}</p>
      <button type="button" @click="load">Try again</button>
    </div>

    <template v-if="snapshot">
      <div class="cosmos-world" :style="worldStyle" aria-label="Project galaxies">
        <svg class="cosmos-connections" aria-hidden="true">
          <defs>
            <linearGradient
              v-for="connection in renderedConnections"
              :id="`gradient-${connection.objectId}`"
              :key="`gradient-${connection.objectId}`"
              gradientUnits="userSpaceOnUse"
              :x1="connection.x1"
              :y1="connection.y1"
              :x2="connection.x2"
              :y2="connection.y2"
            >
              <stop offset="0" :stop-color="connection.colorA" />
              <stop offset="1" :stop-color="connection.colorB" />
            </linearGradient>
          </defs>
          <path
            v-for="connection in renderedConnections"
            :key="connection.objectId"
            class="cosmos-connection"
            :class="`cosmos-connection--${connection.provenance}`"
            :d="connection.path"
            :stroke="`url(#gradient-${connection.objectId})`"
          />
        </svg>

        <article
          v-for="project in snapshot.projects"
          :key="project.objectId"
          class="project-galaxy"
          :class="{
            'project-galaxy--active': snapshot.focusedProjectId === project.objectId,
            'project-galaxy--selected': state.selectedObjectId === project.objectId,
          }"
          :style="projectStyle(project)"
          :aria-label="`${project.displayName} Project galaxy`"
        >
          <div class="project-galaxy__nebula" aria-hidden="true" />
          <button
            v-for="node in visibleNodes(project)"
            :key="node.objectId"
            class="cosmos-node"
            :class="[
              `cosmos-node--${node.hierarchyLevel.toLowerCase()}`,
              { 'cosmos-node--selected': state.selectedObjectId === node.objectId },
            ]"
            :style="nodeStyle(node, project)"
            type="button"
            :aria-label="`${node.displayName}, ${node.hierarchyLevel} Node`"
            :aria-pressed="state.selectedObjectId === node.objectId"
            @pointerdown.stop="startNodeDrag($event, node)"
            @click="activateNode($event, node)"
            @dblclick.stop="openNode(node.objectId)"
            @contextmenu.prevent.stop="openNodeContextMenu($event, node.objectId)"
          >
            <span class="cosmos-node__hitbox">
              <span class="cosmos-node__star" aria-hidden="true" />
            </span>
            <span class="cosmos-node__label">{{ node.displayName }}</span>
          </button>
        </article>
      </div>

      <template v-if="!backgroundOnly">
        <CosmosNavigation
          :current-location="currentLocation"
          :left-neighbor="neighbors.left"
          :right-neighbor="neighbors.right"
          :quick-travel-open="quickTravelOpen"
          @travel="travelToProject"
          @toggle-quick-travel="quickTravelOpen = !quickTravelOpen"
        />

        <CosmosQuickTravel
          v-if="quickTravelOpen"
          :projects="snapshot.projects"
          :focused-project-id="snapshot.focusedProjectId"
          @close="quickTravelOpen = false"
          @travel-global="travelToCosmos"
          @travel-project="travelToProject"
        />

        <CosmosHomeHub
          :notification-available="snapshot.companion.notificationAvailable"
          @companion="openCompanion"
          @ship="openBase"
        />

        <CompanionWindowHost
          ref="companionWindowHost"
          :current-location="currentLocation"
          @destination="openNode"
        />

        <ObjectInteractionHost ref="objectInteractionHost" />

        <p class="navigation-help" :class="{ 'navigation-help--visible': spaceHeld }">
          Hold Space and drag to move · Scroll to zoom
        </p>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";

import CosmosHomeHub from "../components/cosmos/CosmosHomeHub.vue";
import CosmosNavigation from "../components/cosmos/CosmosNavigation.vue";
import CosmosQuickTravel from "../components/cosmos/CosmosQuickTravel.vue";
import CompanionWindowHost from "../components/cosmos/CompanionWindowHost.vue";
import ObjectInteractionHost from "../components/windows/ObjectInteractionHost.vue";
import type { CosmosMapSnapshot, MapNode, MapProject } from "../runtime/cosmosMapRuntime";
import { useCosmosRuntime } from "../runtime/plugin";

const runtime = useCosmosRuntime();
withDefaults(defineProps<{ backgroundOnly?: boolean }>(), { backgroundOnly: false });
const router = useRouter();
const state = runtime.cosmosMap.state;
const snapshot = computed(() => state.snapshot as CosmosMapSnapshot | null);
const viewportElement = ref<HTMLElement | null>(null);
const viewport = reactive({ width: window.innerWidth, height: window.innerHeight });
const spaceHeld = ref(false);
const quickTravelOpen = ref(false);
const cameraDrag = ref<PointerDrag | null>(null);
const nodeDrag = ref<NodeDrag | null>(null);
const companionWindowHost = ref<InstanceType<typeof CompanionWindowHost> | null>(null);
const objectInteractionHost = ref<InstanceType<typeof ObjectInteractionHost> | null>(null);
let resizeObserver: ResizeObserver | null = null;
let cameraSaveTimer: ReturnType<typeof setTimeout> | null = null;

interface PointerDrag {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startCameraX: number;
  startCameraY: number;
}

interface NodeDrag {
  pointerId: number;
  objectId: string;
  hierarchyLevel: MapNode["hierarchyLevel"];
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  moved: boolean;
}

const worldStyle = computed(() => {
  const camera = snapshot.value?.camera ?? { x: 0, y: 0, zoom: 1 };
  return {
    transform: `translate(${viewport.width / 2 - camera.x * camera.zoom}px, ${viewport.height / 2 - camera.y * camera.zoom}px) scale(${camera.zoom})`,
  };
});

const currentProject = computed(
  () =>
    snapshot.value?.projects.find(
      (project) => project.objectId === snapshot.value?.focusedProjectId,
    ) ?? null,
);
const currentLocation = computed(() => currentProject.value?.displayName ?? "Cosmos");

const neighbors = computed(() => {
  const projects = [...(snapshot.value?.projects ?? [])].sort((left, right) => left.x - right.x);
  const cameraX = snapshot.value?.camera.x ?? 0;
  if (currentProject.value) {
    const index = projects.findIndex((project) => project.objectId === currentProject.value?.objectId);
    return { left: projects[index - 1] ?? null, right: projects[index + 1] ?? null };
  }
  return {
    left: projects.filter((project) => project.x < cameraX).at(-1) ?? null,
    right: projects.find((project) => project.x > cameraX) ?? null,
  };
});

const renderedConnections = computed(() => {
  if (!snapshot.value) return [];
  const endpoints = new Map<string, { x: number; y: number; color: string; projectId: string }>();
  for (const project of snapshot.value.projects) {
    for (const node of project.nodes) {
      endpoints.set(node.objectId, {
        x: node.x,
        y: node.y,
        color: project.color,
        projectId: project.objectId,
      });
    }
  }
  return snapshot.value.connections.flatMap((connection) => {
    const start = endpoints.get(connection.endpointAId);
    const end = endpoints.get(connection.endpointBId);
    if (!start || !end || start.projectId !== end.projectId) return [];
    const bend = Math.min(44, Math.hypot(end.x - start.x, end.y - start.y) * 0.09);
    return [
      {
        ...connection,
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
        colorA: start.color,
        colorB: end.color,
        path: `M ${start.x} ${start.y} Q ${(start.x + end.x) / 2} ${(start.y + end.y) / 2 - bend} ${end.x} ${end.y}`,
      },
    ];
  });
});

function load() {
  void runtime.cosmosMap.load().catch(() => undefined);
}

function projectStyle(project: MapProject) {
  const offsets = project.nodes.map((node) => ({ x: node.x - project.x, y: node.y - project.y }));
  const minimumX = Math.min(0, ...offsets.map((point) => point.x));
  const maximumX = Math.max(0, ...offsets.map((point) => point.x));
  const minimumY = Math.min(0, ...offsets.map((point) => point.y));
  const maximumY = Math.max(0, ...offsets.map((point) => point.y));
  const width = Math.min(640, Math.max(420, maximumX - minimumX + 280));
  const height = Math.min(520, Math.max(340, maximumY - minimumY + 230));
  const centerX = (minimumX + maximumX) / 2;
  const centerY = (minimumY + maximumY) / 2;
  return {
    left: `${project.x}px`,
    top: `${project.y}px`,
    "--project-color": project.color,
    "--nebula-left": `${centerX - width / 2}px`,
    "--nebula-top": `${centerY - height / 2}px`,
    "--nebula-width": `${width}px`,
    "--nebula-height": `${height}px`,
  };
}

function nodeStyle(node: MapNode, project: MapProject) {
  return { left: `${node.x - project.x}px`, top: `${node.y - project.y}px` };
}

function visibleNodes(project: MapProject): MapNode[] {
  const root = project.nodes.filter((node) => node.objectId === project.objectId);
  const previews = project.nodes.filter((node) => node.objectId !== project.objectId);
  return snapshot.value?.focusedProjectId === project.objectId ? [...root, ...previews] : [...root, ...previews.slice(0, 9)];
}

function startCameraPan(event: PointerEvent) {
  if (event.button !== 0 || !snapshot.value) return;
  if (!spaceHeld.value) {
    if (event.target === viewportElement.value) {
      runtime.cosmosMap.select(null);
      void runtime.cosmosMap.persistSelection().catch(() => undefined);
    }
    return;
  }
  event.preventDefault();
  viewportElement.value?.setPointerCapture(event.pointerId);
  cameraDrag.value = {
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startCameraX: snapshot.value.camera.x,
    startCameraY: snapshot.value.camera.y,
  };
}

function startNodeDrag(event: PointerEvent, node: MapNode) {
  if (event.button !== 0 || spaceHeld.value || !snapshot.value) return;
  event.preventDefault();
  runtime.cosmosMap.select(node.objectId);
  void runtime.cosmosMap.persistSelection().catch(() => undefined);
  viewportElement.value?.setPointerCapture(event.pointerId);
  nodeDrag.value = {
    pointerId: event.pointerId,
    objectId: node.objectId,
    hierarchyLevel: node.hierarchyLevel,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startX: node.x,
    startY: node.y,
    moved: false,
  };
}

function activateNode(event: MouseEvent, node: MapNode) {
  if (event.detail !== 0) return;
  runtime.cosmosMap.select(node.objectId);
  void runtime.cosmosMap.persistSelection().catch(() => undefined);
  if (node.hierarchyLevel === "ProjectRoot") travelToProject(node.objectId);
  else openNode(node.objectId);
}

function continuePointerInteraction(event: PointerEvent) {
  if (!snapshot.value) return;
  if (cameraDrag.value?.pointerId === event.pointerId) {
    const drag = cameraDrag.value;
    runtime.cosmosMap.setCamera({
      x: drag.startCameraX - (event.clientX - drag.startClientX) / snapshot.value.camera.zoom,
      y: drag.startCameraY - (event.clientY - drag.startClientY) / snapshot.value.camera.zoom,
      zoom: snapshot.value.camera.zoom,
    });
  } else if (nodeDrag.value?.pointerId === event.pointerId) {
    const drag = nodeDrag.value;
    const deltaX = (event.clientX - drag.startClientX) / snapshot.value.camera.zoom;
    const deltaY = (event.clientY - drag.startClientY) / snapshot.value.camera.zoom;
    if (Math.hypot(deltaX, deltaY) > 3) drag.moved = true;
    runtime.cosmosMap.moveNodeLocally(drag.objectId, drag.startX + deltaX, drag.startY + deltaY);
  }
}

function finishPointerInteraction(event: PointerEvent) {
  if (cameraDrag.value?.pointerId === event.pointerId) {
    cameraDrag.value = null;
    scheduleCameraSave();
  }
  if (nodeDrag.value?.pointerId === event.pointerId) {
    const drag = nodeDrag.value;
    nodeDrag.value = null;
    if (drag.moved) {
      void runtime.cosmosMap.persistNodePosition(drag.objectId).catch(() => load());
    } else if (drag.hierarchyLevel === "ProjectRoot") {
      travelToProject(drag.objectId);
    }
  }
  if (viewportElement.value?.hasPointerCapture(event.pointerId)) {
    viewportElement.value.releasePointerCapture(event.pointerId);
  }
}

function cancelPointerInteraction(event: PointerEvent) {
  cameraDrag.value = null;
  if (nodeDrag.value?.pointerId === event.pointerId) {
    nodeDrag.value = null;
    load();
  }
}

function zoomAtPointer(event: WheelEvent) {
  if (!snapshot.value || !viewportElement.value) return;
  const rect = viewportElement.value.getBoundingClientRect();
  const camera = snapshot.value.camera;
  const cursorX = event.clientX - rect.left - rect.width / 2;
  const cursorY = event.clientY - rect.top - rect.height / 2;
  const worldX = camera.x + cursorX / camera.zoom;
  const worldY = camera.y + cursorY / camera.zoom;
  const zoom = camera.zoom * Math.exp(-event.deltaY * 0.0012);
  const constrainedZoom = Math.min(2.4, Math.max(0.35, zoom));
  runtime.cosmosMap.setCamera({
    x: worldX - cursorX / constrainedZoom,
    y: worldY - cursorY / constrainedZoom,
    zoom: constrainedZoom,
  });
  scheduleCameraSave();
}

function travelToProject(projectId: string) {
  quickTravelOpen.value = false;
  runtime.cosmosMap.focusProject(projectId, viewport);
  runtime.cosmosMap.select(projectId);
  void runtime.cosmosMap.persistSelection().catch(() => undefined);
  scheduleCameraSave();
}

function travelToCosmos() {
  quickTravelOpen.value = false;
  runtime.cosmosMap.focusCosmos(viewport);
  runtime.cosmosMap.select(null);
  void runtime.cosmosMap.persistSelection().catch(() => undefined);
  scheduleCameraSave();
}

function scheduleCameraSave() {
  if (cameraSaveTimer) clearTimeout(cameraSaveTimer);
  cameraSaveTimer = setTimeout(() => {
    cameraSaveTimer = null;
    void runtime.cosmosMap.persistCamera().catch(() => undefined);
  }, 260);
}

function openCompanion() {
  companionWindowHost.value?.open();
}

function openNode(objectId: string) {
  const project = snapshot.value?.projects.find((candidate) => candidate.objectId === objectId);
  if (project?.workspaceObjectId) {
    void router.push(`/workspaces/${encodeURIComponent(project.workspaceObjectId)}`);
    return;
  }
  const node = snapshot.value?.projects
    .flatMap((candidate) => candidate.nodes)
    .find((candidate) => candidate.objectId === objectId);
  if (node?.systemTags.includes("Workspace")) {
    void router.push(`/workspaces/${encodeURIComponent(objectId)}`);
    return;
  }
  void objectInteractionHost.value?.openObject(objectId, "details").catch(() => undefined);
}

function openNodeContextMenu(event: MouseEvent, objectId: string) {
  runtime.cosmosMap.select(objectId);
  void runtime.cosmosMap.persistSelection().catch(() => undefined);
  void objectInteractionHost.value
    ?.openContextMenu(objectId, { x: event.clientX, y: event.clientY })
    .catch(() => undefined);
}

function openBase() {
  void router.push("/base");
}

function onKeyDown(event: KeyboardEvent) {
  if (event.code !== "Space" || isTextInput(event.target)) return;
  event.preventDefault();
  spaceHeld.value = true;
}

function onKeyUp(event: KeyboardEvent) {
  if (event.code === "Space") spaceHeld.value = false;
}

function onWindowBlur() {
  spaceHeld.value = false;
}

function isTextInput(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest("input, textarea, [contenteditable='true']"));
}

onMounted(() => {
  load();
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onWindowBlur);
  if (viewportElement.value) {
    resizeObserver = new ResizeObserver(([entry]) => {
      viewport.width = entry.contentRect.width;
      viewport.height = entry.contentRect.height;
    });
    resizeObserver.observe(viewportElement.value);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
  window.removeEventListener("blur", onWindowBlur);
  resizeObserver?.disconnect();
  if (cameraSaveTimer) clearTimeout(cameraSaveTimer);
});
</script>

<style scoped>
.cosmos-map {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 15% 9%, rgba(37, 83, 135, 0.15), transparent 25%),
    radial-gradient(ellipse at 79% 21%, rgba(92, 46, 126, 0.12), transparent 28%),
    radial-gradient(ellipse at 55% 78%, rgba(15, 93, 105, 0.08), transparent 32%),
    linear-gradient(142deg, #010207 0%, #030711 48%, #010308 100%);
  outline: none;
  touch-action: none;
}

.cosmos-map::before,
.cosmos-map::after {
  position: absolute;
  inset: -15%;
  content: "";
  pointer-events: none;
}

.cosmos-map::before {
  background:
    radial-gradient(ellipse at 18% 31%, transparent 0 6%, rgba(36, 103, 167, 0.09) 13%, transparent 25%),
    radial-gradient(ellipse at 82% 39%, transparent 0 5%, rgba(141, 65, 170, 0.075) 14%, transparent 27%),
    radial-gradient(ellipse at 47% 81%, transparent 0 4%, rgba(45, 138, 127, 0.055) 14%, transparent 25%);
  filter: blur(16px);
  opacity: 0.82;
}

.cosmos-map::after {
  background:
    radial-gradient(circle at 9% 73%, rgba(240, 174, 126, 0.08), transparent 0.9%),
    radial-gradient(circle at 92% 68%, rgba(115, 157, 225, 0.08), transparent 0.8%),
    radial-gradient(circle at 72% 8%, rgba(193, 157, 224, 0.06), transparent 0.7%);
  filter: blur(1px);
}

.cosmos-map__stars {
  position: absolute;
  inset: -12%;
  pointer-events: none;
}

.cosmos-map__stars--distant {
  opacity: 0.46;
  background-image:
    radial-gradient(circle, rgba(226, 236, 243, 0.64) 0 0.7px, transparent 1.2px),
    radial-gradient(circle, rgba(111, 180, 214, 0.36) 0 0.8px, transparent 1.4px),
    radial-gradient(circle, rgba(215, 169, 228, 0.26) 0 0.65px, transparent 1.2px);
  background-position: 8px 18px, 58px 72px, 106px 31px;
  background-size: 83px 83px, 131px 131px, 197px 197px;
}

.cosmos-map__stars--near {
  opacity: 0.28;
  background-image: radial-gradient(circle, rgba(248, 250, 252, 0.9) 0 1px, transparent 1.6px);
  background-position: 31px 12px;
  background-size: 211px 211px;
  animation: stellar-drift 80s linear infinite;
}

.cosmos-world {
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  transform-origin: 0 0;
  transition: transform 620ms cubic-bezier(0.22, 0.78, 0.18, 1);
}

.cosmos-map--interacting .cosmos-world {
  transition: none;
}

.project-galaxy {
  --project-color: #8b5cf6;
  position: absolute;
  width: 0;
  height: 0;
}

.project-galaxy__nebula {
  position: absolute;
  top: var(--nebula-top, -196px);
  left: var(--nebula-left, -238px);
  width: var(--nebula-width, 476px);
  height: var(--nebula-height, 392px);
  transform: rotate(-9deg);
  border-radius: 67% 33% 58% 42% / 39% 57% 43% 61%;
  background:
    radial-gradient(ellipse at 51% 51%, rgba(235, 248, 255, 0.17) 0, color-mix(in srgb, var(--project-color) 26%, transparent) 12%, transparent 32%),
    conic-gradient(from 18deg at 52% 49%, transparent 0 8%, color-mix(in srgb, var(--project-color) 15%, transparent) 13%, transparent 22% 34%, color-mix(in srgb, var(--project-color) 11%, transparent) 42%, transparent 51% 67%, color-mix(in srgb, var(--project-color) 13%, transparent) 76%, transparent 86%),
    radial-gradient(ellipse at 32% 64%, color-mix(in srgb, var(--project-color) 12%, transparent), transparent 52%),
    radial-gradient(ellipse at 74% 31%, color-mix(in srgb, var(--project-color) 8%, white), transparent 44%);
  filter: blur(5px) saturate(1.16);
  opacity: 0.76;
  transition: filter 240ms ease, opacity 240ms ease, transform 500ms ease;
  animation: nebula-breathe 11s ease-in-out infinite alternate;
  pointer-events: none;
}

.project-galaxy__nebula::before,
.project-galaxy__nebula::after {
  position: absolute;
  content: "";
  pointer-events: none;
}

.project-galaxy__nebula::before {
  inset: 18% 10%;
  transform: rotate(13deg);
  border: 1px solid color-mix(in srgb, var(--project-color) 15%, transparent);
  border-color: color-mix(in srgb, var(--project-color) 16%, transparent) transparent;
  border-radius: 50%;
  box-shadow: 0 0 34px color-mix(in srgb, var(--project-color) 9%, transparent);
}

.project-galaxy__nebula::after {
  inset: 7% 21%;
  transform: rotate(-24deg);
  border-radius: 50%;
  background: radial-gradient(ellipse, transparent 48%, color-mix(in srgb, var(--project-color) 8%, transparent) 52%, transparent 68%);
}

.project-galaxy--active .project-galaxy__nebula,
.project-galaxy--selected .project-galaxy__nebula {
  filter: blur(3px) brightness(1.22) saturate(1.18);
  opacity: 1;
}

.cosmos-node {
  position: absolute;
  z-index: 2;
  display: grid;
  width: 80px;
  height: 80px;
  padding: 0;
  place-items: center;
  transform: translate(-50%, -50%);
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #f8fafc;
  cursor: grab;
}

.cosmos-node:active { cursor: grabbing; }

.cosmos-node__hitbox {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  border-radius: 50%;
}

.cosmos-node__star {
  width: 13px;
  height: 13px;
  border: 1px solid rgba(241, 249, 255, 0.72);
  border-radius: 50%;
  background: #f8fafc;
  box-shadow:
    0 0 5px #fff,
    0 0 12px var(--project-color),
    0 0 30px color-mix(in srgb, var(--project-color) 64%, transparent);
  transition: transform 160ms ease, box-shadow 160ms ease;
  animation: node-pulse 4.8s ease-in-out infinite;
}

.cosmos-node--projectroot .cosmos-node__star {
  width: 38px;
  height: 38px;
  border-color: rgba(255, 255, 255, 0.9);
  background: radial-gradient(circle at 38% 32%, #fff, var(--project-color) 44%, #1e1b4b 100%);
  box-shadow: 0 0 7px #fff, 0 0 22px var(--project-color), 0 0 58px color-mix(in srgb, var(--project-color) 58%, transparent);
}

.cosmos-node--domain .cosmos-node__star,
.cosmos-node--cluster .cosmos-node__star {
  width: 20px;
  height: 20px;
}

.cosmos-node--detail .cosmos-node__star {
  width: 8px;
  height: 8px;
}

.cosmos-node:hover .cosmos-node__star,
.cosmos-node:focus-visible .cosmos-node__star {
  transform: scale(1.18);
  box-shadow: 0 0 8px #fff, 0 0 24px var(--project-color), 0 0 54px var(--project-color);
}

.cosmos-node--selected .cosmos-node__hitbox {
  outline: 1px solid color-mix(in srgb, var(--project-color) 62%, white);
  outline-offset: -11px;
}

.cosmos-node__label {
  position: absolute;
  top: calc(50% + 27px);
  left: 50%;
  width: max-content;
  max-width: 190px;
  transform: translateX(-50%);
  color: rgba(225, 237, 244, 0.78);
  font-size: 0.67rem;
  font-weight: 480;
  letter-spacing: 0.055em;
  text-shadow: 0 2px 8px #01030a, 0 0 12px #01030a;
}

.cosmos-node--projectroot .cosmos-node__label {
  top: calc(50% + 35px);
  font-size: 0.86rem;
  font-weight: 560;
  letter-spacing: 0.08em;
}

.cosmos-connections {
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  overflow: visible;
  pointer-events: none;
}

.cosmos-connection {
  fill: none;
  stroke-linecap: round;
  stroke-width: 1.15;
  opacity: 0.34;
  filter: drop-shadow(0 0 3px rgba(98, 200, 234, 0.22));
}

.cosmos-connection--semantic,
.cosmos-connection--discovery {
  stroke-width: 1;
  opacity: 0.14;
  stroke-dasharray: 3 7;
}

.map-status {
  position: absolute;
  z-index: 12;
  top: 50%;
  left: 50%;
  display: grid;
  transform: translate(-50%, -50%);
  place-items: center;
  color: #94a3b8;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
}

.map-status__orbit {
  width: 44px;
  height: 44px;
  border: 1px solid rgba(196, 181, 253, 0.32);
  border-top-color: #c4b5fd;
  border-radius: 50%;
  animation: orbit 1.2s linear infinite;
}

.map-status button {
  padding: 8px 13px;
  border: 1px solid rgba(226, 232, 240, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
}

.navigation-help {
  position: fixed;
  z-index: 18;
  bottom: 24px;
  left: 50%;
  margin: 0;
  padding: 7px 12px;
  transform: translate(-50%, 8px);
  border: 1px solid rgba(226, 232, 240, 0.09);
  border-radius: var(--cosmos-radius-control, 5px);
  background: rgba(3, 7, 18, 0.66);
  color: #64748b;
  font-size: 0.65rem;
  opacity: 0.44;
  transition: opacity 160ms ease, transform 160ms ease;
  pointer-events: none;
}

.navigation-help--visible {
  transform: translate(-50%, 0);
  color: #cbd5e1;
  opacity: 1;
}

@keyframes stellar-drift { to { transform: translate3d(80px, 46px, 0); } }
@keyframes nebula-breathe { to { transform: rotate(-4deg) scale(1.035); } }
@keyframes node-pulse { 50% { filter: brightness(1.18); } }
@keyframes orbit { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  .cosmos-map__stars--near,
  .project-galaxy__nebula,
  .cosmos-node__star,
  .map-status__orbit {
    animation: none;
  }

  .cosmos-world {
    transition-duration: 1ms;
  }
}
</style>
