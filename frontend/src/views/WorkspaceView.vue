<template>
  <section class="workspace-stage environment-view" aria-label="Workspace">
    <div v-if="phase === 'opening'" class="workspace-status" role="status">
      <span aria-hidden="true" />
      <p>Preparing your Workspace…</p>
    </div>
    <div v-else-if="error" class="workspace-status" role="alert">
      <p>{{ error }}</p>
      <button type="button" @click="openWorkspace">Try again</button>
    </div>

    <article
      v-if="session"
      class="workspace-environment"
      :class="`workspace-environment--${session.definition.overlay.toLowerCase()}`"
      :style="environmentStyle"
      :aria-label="session.definition.displayName"
    >
      <header
        class="workspace-environment__header"
        @contextmenu.prevent="openWorkspaceContextMenu"
      >
        <span class="workspace-environment__identity">
          <i aria-hidden="true" />
          <span>
            <small>Workspace</small>
            <strong>{{ session.definition.displayName }}</strong>
          </span>
        </span>
        <button type="button" aria-label="Close Workspace" title="Close" @click="closeWorkspace">
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <div class="workspace-canvas" aria-label="Workspace Canvas">
        <div class="workspace-canvas__overlay" aria-hidden="true">
          <i v-for="index in 9" :key="index" :style="overlayMark(index)" />
        </div>

        <nav class="tool-area" aria-label="Tool Area">
          <span class="tool-area__label">Tools</span>
          <button
            v-for="tool in availableTools"
            :key="tool.objectId"
            type="button"
            :aria-label="`Open ${tool.displayName}`"
            :title="tool.description"
            @click="openTool(tool.objectId)"
          >
            <i aria-hidden="true">{{ tool.icon.slice(0, 1) }}</i>
            <span>{{ tool.displayName }}</span>
          </button>
        </nav>

        <ToolWindow
          v-for="instance in toolInstances"
          :key="instance.instanceId"
          :title="instance.definition.displayName"
          :bounds="instance.window.bounds"
          :minimum-size="instance.definition.minimumSize"
          :focus-order="instance.window.focusOrder"
          :active="instance.window.state === 'active'"
          @close="closeTool(instance.instanceId)"
          @focus="focusTool(instance.instanceId)"
          @move="moveTool(instance.instanceId, $event)"
          @resize="resizeTool(instance.instanceId, $event)"
        >
          <component
            :is="runtime.toolRenderers.resolve(instance.definition)"
            v-if="runtime.toolRenderers.resolve(instance.definition)"
            :workspace-session-id="instance.workspaceSessionId"
            :tool-instance-id="instance.instanceId"
            :entry-point="instance.definition.entryPoint"
            :title="instance.definition.displayName"
          />
        </ToolWindow>

        <ObjectInteractionHost
          ref="objectInteractionHost"
          :parent-window-id="session.environmentWindow.objectId"
          :parent-bounds="environmentBounds"
          :workspace-session-id="session.objectId"
        />
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import ToolWindow from "../components/windows/ToolWindow.vue";
import ObjectInteractionHost from "../components/windows/ObjectInteractionHost.vue";
import type { WorkspaceSession } from "../runtime/workspaceRuntime";
import { useCosmosRuntime } from "../runtime/plugin";

const runtime = useCosmosRuntime();
const route = useRoute();
const router = useRouter();
const session = ref<Readonly<WorkspaceSession> | null>(null);
const phase = ref<"idle" | "opening" | "ready" | "closing">("idle");
const error = ref<string | null>(null);
const environmentBounds = ref(workspaceBounds());
const objectInteractionHost = ref<InstanceType<typeof ObjectInteractionHost> | null>(null);

const environmentStyle = computed(() => ({
  left: `${environmentBounds.value.x}px`,
  top: `${environmentBounds.value.y}px`,
  width: `${environmentBounds.value.width}px`,
  height: `${environmentBounds.value.height}px`,
}));
const availableTools = computed(() => {
  const assigned = session.value?.resolvedToolIds ?? [];
  return runtime.tools.available(assigned.length ? assigned : undefined);
});
const toolInstances = computed(() =>
  session.value ? runtime.tools.state.instances.filter((item) => item.workspaceSessionId === session.value?.objectId) : [],
);

async function openWorkspace() {
  if (phase.value === "opening" || session.value) return;
  phase.value = "opening";
  error.value = null;
  try {
    if (runtime.base.state.phase !== "ready") await runtime.base.load();
    await runtime.tools.loadDefinitions();
    const definitionObjectId = resolveDefinitionObjectId(String(route.params.workspaceId ?? ""));
    const roomId = resolveRoomId(definitionObjectId);
    environmentBounds.value = workspaceBounds();
    session.value = await runtime.workspaces.open({
      definitionObjectId,
      roomId,
      environmentBounds: environmentBounds.value,
    });
    phase.value = "ready";
  } catch (cause) {
    phase.value = "idle";
    error.value = cause instanceof Error ? cause.message : "Workspace could not open.";
  }
}

async function closeWorkspace() {
  if (!session.value || phase.value === "closing") return;
  phase.value = "closing";
  const roomId = session.value.context.roomId;
  try {
    await runtime.workspaces.close(session.value.objectId);
    runtime.objectInteractions.closeAll(session.value.objectId);
    session.value = null;
    await router.push(roomId === "cosmos.room.main" ? "/base" : "/base/rooms/workshop");
  } catch (cause) {
    phase.value = "ready";
    error.value = cause instanceof Error ? cause.message : "Workspace state could not be preserved.";
  }
}

function resolveDefinitionObjectId(value: string): string {
  const workspaces = runtime.base.state.snapshot?.rooms.flatMap((room) =>
    room.workspaceSlots.flatMap((slot) => (slot.workspace ? [slot.workspace] : [])),
  ) ?? [];
  const normalized = value.toLowerCase();
  return (
    workspaces.find(
      (workspace) =>
        workspace.objectId === value ||
        workspace.objectId.endsWith(`.${normalized}`) ||
        workspace.displayName.toLowerCase().replace(/ workspace$/, "") === normalized,
    )?.objectId ?? value
  );
}

function resolveRoomId(definitionObjectId: string): string {
  return (
    runtime.base.state.snapshot?.rooms.find((room) =>
      room.workspaceSlots.some((slot) => slot.workspace?.objectId === definitionObjectId),
    )?.objectId ?? "cosmos.room.main"
  );
}

function openTool(definitionObjectId: string) {
  if (!session.value) return;
  const offset = runtime.tools.list(session.value.objectId).length * 34;
  void runtime.tools
    .open(session.value.objectId, session.value.environmentWindow.objectId, definitionObjectId, {
      x: environmentBounds.value.x + 110 + offset,
      y: environmentBounds.value.y + 96 + offset,
      width: Math.min(760, environmentBounds.value.width - 80),
      height: Math.min(540, environmentBounds.value.height - 100),
    })
    .catch((cause: unknown) => {
      error.value = cause instanceof Error ? cause.message : "Tool could not open.";
    });
}

function focusTool(instanceId: string) {
  runtime.tools.focus(instanceId);
}

function moveTool(instanceId: string, position: { x: number; y: number }) {
  runtime.tools.move(instanceId, position);
}

function resizeTool(instanceId: string, size: { width: number; height: number }) {
  runtime.tools.resize(instanceId, size);
}

function closeTool(instanceId: string) {
  void runtime.tools.close(instanceId).catch((cause: unknown) => {
    error.value = cause instanceof Error ? cause.message : "Tool could not close.";
  });
}

function openWorkspaceContextMenu(event: MouseEvent) {
  if (!session.value) return;
  void objectInteractionHost.value
    ?.openContextMenu(session.value.definition.objectId, { x: event.clientX, y: event.clientY })
    .catch(() => undefined);
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape" && !event.defaultPrevented) void closeWorkspace();
}

function workspaceBounds() {
  const width = Math.round(window.innerWidth * 0.9);
  const height = Math.round(window.innerHeight * 0.88);
  return {
    x: Math.round((window.innerWidth - width) / 2),
    y: Math.round((window.innerHeight - height) / 2),
    width,
    height,
  };
}

function overlayMark(index: number) {
  return {
    left: `${8 + ((index * 29) % 84)}%`,
    top: `${10 + ((index * 37) % 76)}%`,
    opacity: 0.05 + (index % 3) * 0.025,
  };
}

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
  void openWorkspace();
});

onBeforeUnmount(() => window.removeEventListener("keydown", onKeyDown));
</script>

<style scoped>
.workspace-stage {
  z-index: 20;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 46%, rgba(31, 79, 102, 0.11), transparent 50%),
    rgba(1, 3, 8, 0.46);
  pointer-events: auto;
}

.workspace-environment {
  --workspace-accent: #75cfa9;
  position: fixed;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--workspace-accent) 24%, var(--cosmos-color-border));
  border-radius: var(--cosmos-radius-window, 10px);
  background: rgba(5, 10, 16, 0.965);
  box-shadow: var(--cosmos-window-shadow-active), inset 0 1px rgba(255, 255, 255, 0.045);
  backdrop-filter: blur(22px);
  animation: workspace-open 360ms cubic-bezier(0.22, 0.78, 0.18, 1) both;
}

.workspace-environment--creationworkbench { --workspace-accent: #d9a765; }
.workspace-environment--graphicsdesk { --workspace-accent: #a88ce7; }

.workspace-environment__header {
  position: relative;
  z-index: 60;
  display: flex;
  height: 54px;
  align-items: center;
  justify-content: space-between;
  padding: 0 13px 0 18px;
  border-bottom: 1px solid rgba(181, 211, 225, 0.1);
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--workspace-accent) 7%, transparent), transparent 34%),
    linear-gradient(180deg, rgba(24, 36, 47, 0.88), rgba(11, 20, 28, 0.82));
}

.workspace-environment__identity { display: flex; align-items: center; gap: 10px; }
.workspace-environment__identity > i { width: 8px; height: 8px; transform: rotate(45deg); border: 1px solid color-mix(in srgb, var(--workspace-accent) 78%, white); background: color-mix(in srgb, var(--workspace-accent) 72%, #071018); box-shadow: 0 0 12px color-mix(in srgb, var(--workspace-accent) 54%, transparent); }
.workspace-environment__identity > span { display: grid; gap: 1px; }
.workspace-environment__identity small { color: var(--cosmos-color-faint); font-size: 0.49rem; letter-spacing: 0.2em; text-transform: uppercase; }
.workspace-environment__identity strong { color: var(--cosmos-color-text); font-size: 0.77rem; font-weight: 560; letter-spacing: 0.035em; }

.workspace-environment__header > button {
  display: grid;
  width: 28px;
  height: 28px;
  padding: 0;
  place-items: center;
  border: 1px solid rgba(181, 211, 225, 0.14);
  border-radius: var(--cosmos-radius-control, 5px);
  background: rgba(204, 232, 241, 0.025);
  color: rgba(231, 240, 242, 0.78);
  font-size: 0.98rem;
  cursor: pointer;
}
.workspace-environment__header > button:hover,
.workspace-environment__header > button:focus-visible { border-color: rgba(255, 255, 255, 0.46); background: rgba(105, 61, 61, 0.72); outline: 0; }

.workspace-canvas {
  position: absolute;
  inset: 54px 0 0;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 62% 32%, color-mix(in srgb, var(--workspace-accent) 5%, transparent), transparent 31%),
    radial-gradient(ellipse at 36% 72%, rgba(74, 116, 151, 0.055), transparent 35%),
    linear-gradient(142deg, #071019, #08121b 47%, #050b11);
}
.workspace-canvas::before {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(168, 201, 213, 0.022) 1px, transparent 1px),
    linear-gradient(90deg, rgba(168, 201, 213, 0.022) 1px, transparent 1px),
    radial-gradient(circle, rgba(205, 228, 238, 0.34) 0 0.65px, transparent 1px);
  background-position: 0 0, 0 0, 17px 23px;
  background-size: 40px 40px, 40px 40px, 131px 131px;
  content: "";
  opacity: 0.72;
  pointer-events: none;
}
.workspace-canvas::after {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 45%, rgba(0, 2, 5, 0.34) 100%);
  content: "";
  pointer-events: none;
}
.workspace-canvas__overlay { position: absolute; inset: 0; pointer-events: none; }
.workspace-canvas__overlay i { position: absolute; width: 190px; height: 116px; border: 1px solid var(--workspace-accent); border-color: color-mix(in srgb, var(--workspace-accent) 58%, transparent) transparent; border-radius: 50%; transform: translate(-50%, -50%) rotate(-12deg); }

.tool-area {
  position: absolute;
  z-index: 58;
  top: 14px;
  left: 14px;
  display: flex;
  max-width: calc(100% - 36px);
  min-height: 40px;
  padding: 4px;
  align-items: center;
  border: 1px solid rgba(181, 211, 225, 0.11);
  border-radius: 7px;
  background: rgba(6, 14, 20, 0.76);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(14px);
  gap: 5px;
}
.tool-area__label { padding: 0 7px; color: var(--cosmos-color-faint); font-size: 0.49rem; letter-spacing: 0.18em; text-transform: uppercase; }
.tool-area button { display: flex; min-height: 30px; padding: 3px 8px 3px 5px; align-items: center; border: 1px solid transparent; border-radius: 4px; background: transparent; color: #d7e5eb; cursor: pointer; gap: 6px; }
.tool-area button:hover,
.tool-area button:focus-visible { border-color: color-mix(in srgb, var(--workspace-accent) 28%, transparent); background: color-mix(in srgb, var(--workspace-accent) 8%, transparent); outline: 0; }
.tool-area button i { display: grid; width: 22px; height: 22px; place-items: center; border: 1px solid color-mix(in srgb, var(--workspace-accent) 18%, transparent); border-radius: 3px; background: color-mix(in srgb, var(--workspace-accent) 9%, #101b23); color: var(--workspace-accent); font-size: 0.59rem; font-style: normal; }
.tool-area button span { font-size: 0.63rem; letter-spacing: 0.02em; }

.workspace-status { position: absolute; z-index: 70; top: 50%; left: 50%; display: grid; transform: translate(-50%, -50%); place-items: center; color: #b5c8cd; font-size: 0.72rem; }
.workspace-status > span { width: 38px; height: 38px; border: 1px solid rgba(138, 230, 198, 0.25); border-top-color: #8ae6c6; border-radius: 50%; animation: spin 1.1s linear infinite; }
.workspace-status button { padding: 7px 12px; border: 1px solid rgba(215, 234, 237, 0.2); border-radius: 8px; background: rgba(12, 23, 31, 0.7); cursor: pointer; }

@keyframes workspace-open { from { opacity: 0; transform: scale(0.95); filter: blur(6px); } }
@keyframes spin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  .workspace-environment,
  .workspace-status > span { animation: none; }
}
</style>
