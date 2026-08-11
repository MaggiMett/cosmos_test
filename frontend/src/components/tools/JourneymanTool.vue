<template>
  <section class="core-tool journeyman-tool">
    <header class="core-tool__toolbar"><span><strong>Journeyman</strong><small>Planning · orchestration · development assistance</small></span><button type="button" @click="load">Refresh</button></header>
    <p v-if="error" class="core-tool__error" role="alert">{{ error }}</p>
    <div class="journeyman-tool__context">Workspace context <code>{{ workspaceSessionId }}</code></div>
    <main class="core-tool__content">
      <form @submit.prevent="create"><label>Objective<textarea v-model="objective" rows="3" placeholder="Describe the development outcome Journeyman should plan and support." /></label><button type="submit" :disabled="!objective.trim()">Create task</button></form>
      <article v-for="task in tasks" :key="task.objectId" class="journeyman-task"><header><span><strong>{{ task.objective }}</strong><small>{{ task.task_state }}<template v-if="task.provider_id"> · {{ task.provider_id }}</template></small></span><button v-if="['queued','executing'].includes(task.task_state)" type="button" @click="cancel(task.objectId)">Cancel</button></header><ol><li v-for="step in task.plan" :key="step.step" :data-state="step.state">{{ step.step }}</li></ol><div class="journeyman-task__events"><p v-for="event in task.events" :key="event.timestamp + event.type"><time>{{ time(event.timestamp) }}</time><span>{{ event.message }}</span></p></div><p v-if="task.task_state === 'awaiting_provider'" class="journeyman-task__notice">Connect and activate a Provider with the development capability to execute this plan.</p></article>
      <p v-if="!tasks.length" class="core-tool__empty">No Journeyman tasks in this Workspace.</p>
    </main>
  </section>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue"; import type { JourneymanTask } from "../../runtime/coreToolsRuntime"; import { useCosmosRuntime } from "../../runtime/plugin";
const props = defineProps<{ workspaceSessionId: string }>(); const runtime = useCosmosRuntime(); const tasks = ref<JourneymanTask[]>([]); const objective = ref(""); const error = ref<string | null>(null);
async function load() { try { tasks.value = (await runtime.coreTools.journeymanTasks(props.workspaceSessionId)).reverse(); error.value = null; } catch (cause) { capture(cause); } }
async function create() { try { const task = await runtime.coreTools.createJourneymanTask(props.workspaceSessionId, objective.value); objective.value = ""; tasks.value.unshift(task); } catch (cause) { capture(cause); } }
async function cancel(id: string) { try { await runtime.coreTools.cancelJourneymanTask(props.workspaceSessionId, id); await load(); } catch (cause) { capture(cause); } }
function capture(cause: unknown) { error.value = cause instanceof Error ? cause.message : "Journeyman could not complete the request."; }
function time(value: string) { return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
onMounted(load);
</script>
<style scoped>
.journeyman-tool__context { padding: 7px 14px; border-bottom: 1px solid rgba(220,235,240,.08); color: #789098; font-size: .6rem; }
.journeyman-task { padding: 12px; border: 1px solid rgba(188,174,246,.18); border-radius: 10px; background: rgba(13,20,34,.74); }
.journeyman-task header { display: flex; justify-content: space-between; gap: 12px; }
.journeyman-task header span { display: grid; gap: 3px; }
.journeyman-task ol { color: #adbec3; font-size: .66rem; line-height: 1.7; }
.journeyman-task__events { border-left: 1px solid rgba(188,174,246,.24); padding-left: 10px; }
.journeyman-task__events p { display: grid; grid-template-columns: 52px 1fr; margin: 5px 0; font-size: .63rem; }
.journeyman-task__events time { color: #6f858d; }
.journeyman-task__notice { color: #e7bd80; }
</style>
