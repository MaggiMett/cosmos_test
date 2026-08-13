<template>
  <ContextMenu
    v-if="contextMenu"
    :menu="contextMenu"
    :owner-bounds="parentBounds"
    @action="activateAction"
    @close="runtime.objectInteractions.closeContextMenu()"
  />

  <ObjectWindow
    v-for="record in records"
    :key="record.windowId"
    :record="record"
    @request-close="requestClose"
    @focus="focus"
    @move="move"
    @resize="resize"
    @save="save"
  />

  <CosmosDialog
    v-if="pendingCloseWindowId"
    title="Discard unsaved changes?"
    message="This Object Window contains changes that have not been saved. Closing it will discard them."
    confirm-label="Discard and close"
    :owner-bounds="parentBounds"
    @confirm="confirmClose"
    @cancel="pendingCloseWindowId = null"
  />

  <p v-if="state.error" class="interaction-error" role="alert">{{ state.error }}</p>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";

import { workspaceRoute } from "../../dev/base-runtime/baseRuntimeInteractions";
import type {
  ContextMenuState,
  ObjectAction,
  ObjectDetails,
  ObjectWindowRecord,
  ObjectWindowSection,
} from "../../runtime/objectInteractionRuntime";
import type { WindowBounds } from "../../runtime/windowRuntime";
import { useCosmosRuntime } from "../../runtime/plugin";
import CosmosDialog from "./CosmosDialog.vue";
import ContextMenu from "./ContextMenu.vue";
import ObjectWindow from "./ObjectWindow.vue";

const props = defineProps<{
  parentWindowId?: string;
  parentBounds?: WindowBounds;
  workspaceSessionId?: string;
}>();
const runtime = useCosmosRuntime();
const router = useRouter();
const state = runtime.objectInteractions.state;
const records = computed(() => state.windows as unknown as ObjectWindowRecord[]);
const contextMenu = computed(() => state.contextMenu as ContextMenuState | null);
const pendingCloseWindowId = ref<string | null>(null);

async function openContextMenu(objectId: string, point: { x: number; y: number }) {
  await selectWorkspaceObject(objectId);
  await runtime.objectInteractions.showContextMenu(objectId, point, props.workspaceSessionId);
}

async function openObject(objectId: string, section: ObjectWindowSection = "details") {
  await selectWorkspaceObject(objectId);
  await runtime.objectInteractions.openObject(
    objectId,
    section,
    nextBounds(),
    props.parentWindowId,
    props.workspaceSessionId,
  );
}

function activateAction(action: ObjectAction) {
  const menu = contextMenu.value;
  if (!menu || !action.enabled) return;
  if (action.id === "open_workspace") {
    runtime.objectInteractions.closeContextMenu();
    void router.push(workspaceRoute(menu.objectId));
    return;
  }
  const section: ObjectWindowSection =
    action.id === "appearance"
      ? "appearance"
      : action.id === "connections"
        ? "relationships"
        : action.id === "open"
          ? "details"
          : "edit";
  void openObject(menu.objectId, section).catch(() => undefined);
}

function requestClose(windowId: string, dirty: boolean) {
  if (dirty) {
    pendingCloseWindowId.value = windowId;
  } else {
    runtime.objectInteractions.close(windowId);
  }
}

function focus(windowId: string) {
  runtime.objectInteractions.focus(windowId);
}

function move(windowId: string, position: { x: number; y: number }) {
  runtime.objectInteractions.move(windowId, position);
}

function resize(windowId: string, size: { width: number; height: number }) {
  runtime.objectInteractions.resize(windowId, size);
}

function confirmClose() {
  if (pendingCloseWindowId.value) runtime.objectInteractions.close(pendingCloseWindowId.value);
  pendingCloseWindowId.value = null;
}

function save(
  windowId: string,
  update: Pick<ObjectDetails, "displayName" | "description" | "userTags"> & {
    properties: Record<string, unknown>;
  },
) {
  void runtime.objectInteractions.save(windowId, update).catch(() => undefined);
}

function nextBounds(): WindowBounds {
  const offset = records.value.length * 26;
  if (props.parentBounds) {
    const width = Math.max(420, Math.min(700, props.parentBounds.width - 100));
    const height = Math.max(380, Math.min(580, props.parentBounds.height - 100));
    return {
      x: props.parentBounds.x + 50 + offset,
      y: props.parentBounds.y + 50 + offset,
      width,
      height,
    };
  }
  const width = Math.min(700, window.innerWidth - 80);
  const height = Math.min(580, window.innerHeight - 130);
  return {
    x: Math.max(30, (window.innerWidth - width) / 2 + offset),
    y: Math.max(74, (window.innerHeight - height) / 2 + offset),
    width,
    height,
  };
}

async function selectWorkspaceObject(objectId: string) {
  if (props.workspaceSessionId) {
    await runtime.workspaces.selectObject(props.workspaceSessionId, objectId);
  }
}

defineExpose({ openContextMenu, openObject });
onBeforeUnmount(() => runtime.objectInteractions.closeAll(props.workspaceSessionId));
</script>

<style scoped>
.interaction-error {
  position: fixed;
  z-index: 175;
  right: 22px;
  bottom: 22px;
  max-width: 420px;
  margin: 0;
  padding: 10px 13px;
  border: 1px solid rgba(245, 166, 176, 0.25);
  border-radius: 10px;
  background: rgba(83, 28, 38, 0.92);
  color: #f4c1c8;
  font-size: 0.7rem;
}
</style>
