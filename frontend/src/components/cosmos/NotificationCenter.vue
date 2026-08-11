<template>
  <section class="notification-center" aria-label="Notification Center">
    <header>
      <span>Notification Center</span>
      <small>{{ unreadCount ? `${unreadCount} unread` : "All caught up" }}</small>
    </header>

    <nav v-if="categories.length > 1" aria-label="Notification categories">
      <button type="button" :aria-current="activeCategory === null" @click="activeCategory = null">All</button>
      <button
        v-for="category in categories"
        :key="category"
        type="button"
        :aria-current="activeCategory === category"
        @click="activeCategory = category"
      >
        {{ category }}
      </button>
    </nav>

    <div v-if="state.phase === 'loading' || state.phase === 'idle'" class="notification-center__state" role="status">
      Gathering notifications…
    </div>
    <div v-else-if="state.phase === 'failed'" class="notification-center__state" role="alert">
      <p>{{ state.error }}</p>
      <button type="button" @click="load">Try again</button>
    </div>
    <div v-else-if="!state.values.length" class="notification-center__state">
      Nothing needs your attention right now.
    </div>
    <ol v-else>
      <li v-for="value in filteredValues" :key="value.objectId">
        <button
          type="button"
          :class="{ 'notification-entry--unread': !value.read }"
          @click="selectNotification(value.objectId, value.destinationObjectId)"
        >
          <span class="notification-entry__category">{{ value.category }}</span>
          <strong>{{ value.displayName }}</strong>
          <p>{{ value.message }}</p>
          <time :datetime="value.createdAt">{{ formatTime(value.createdAt) }}</time>
        </button>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { useCosmosRuntime } from "../../runtime/plugin";

const emit = defineEmits<{ destination: [objectId: string] }>();
const runtime = useCosmosRuntime();
const state = runtime.notifications.state;
const activeCategory = ref<string | null>(null);
const unreadCount = computed(() => state.values.filter((value) => !value.read).length);
const categories = computed(() => [...new Set(state.values.map((value) => value.category))]);
const filteredValues = computed(() =>
  activeCategory.value
    ? state.values.filter((value) => value.category === activeCategory.value)
    : state.values,
);

function load() {
  void runtime.notifications.load().catch(() => undefined);
}

function selectNotification(objectId: string, destinationObjectId: string) {
  void runtime.notifications
    .markRead(objectId)
    .then(() => {
      if (destinationObjectId) emit("destination", destinationObjectId);
    })
    .catch(() => undefined);
}

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

onMounted(load);
</script>

<style scoped>
.notification-center { display: flex; height: 100%; min-height: 0; flex-direction: column; }
.notification-center > header { display: flex; min-height: 44px; padding: 0 16px; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(181, 211, 225, 0.09); color: var(--cosmos-color-text); font-size: 0.72rem; }
.notification-center > header small { color: var(--cosmos-color-faint); font-size: 0.61rem; }
.notification-center > nav { display: flex; padding: 5px 10px; overflow-x: auto; border-bottom: 1px solid rgba(226, 232, 240, 0.07); gap: 3px; }
.notification-center > nav button { min-height: 28px; padding: 0 8px; border: 1px solid transparent; border-radius: var(--cosmos-radius-control, 5px); background: transparent; color: var(--cosmos-color-faint); font-size: 0.57rem; cursor: pointer; }
.notification-center > nav button:hover, .notification-center > nav button:focus-visible, .notification-center > nav button[aria-current="true"] { border-color: rgba(125, 211, 252, 0.17); outline: none; background: rgba(125, 211, 252, 0.06); color: #a9dff6; }
.notification-center ol { min-height: 0; margin: 0; padding: 10px; flex: 1; overflow: auto; list-style: none; }
.notification-center li + li { margin-top: 6px; }
.notification-center li button { position: relative; display: grid; width: 100%; padding: 10px 12px 10px 15px; border: 1px solid rgba(181, 211, 225, 0.09); border-radius: var(--cosmos-radius-control, 5px); background: rgba(204, 232, 241, 0.02); color: var(--cosmos-color-text); text-align: left; cursor: pointer; gap: 4px; }
.notification-center li button:hover, .notification-center li button:focus-visible { border-color: rgba(125, 211, 252, 0.28); outline: none; background: rgba(125, 211, 252, 0.06); }
.notification-entry--unread::before { position: absolute; top: 9px; bottom: 9px; left: 5px; width: 2px; border-radius: 999px; background: #7dd3fc; box-shadow: 0 0 8px rgba(125, 211, 252, 0.6); content: ""; }
.notification-entry__category { color: #7f91aa; font-size: 0.54rem; letter-spacing: 0.12em; text-transform: uppercase; }
.notification-center strong { color: #e2e8f0; font-size: 0.71rem; }
.notification-center p { margin: 0; color: #94a3b8; font-size: 0.66rem; line-height: 1.45; }
.notification-center time { color: #5f6f85; font-size: 0.56rem; }
.notification-center__state { display: grid; min-height: 0; padding: 20px; flex: 1; place-items: center; color: #718096; font-size: 0.7rem; text-align: center; }
.notification-center__state p { margin: 0 0 8px; }
.notification-center__state button { padding: 6px 9px; border: 1px solid var(--cosmos-color-border); border-radius: var(--cosmos-radius-control, 5px); background: transparent; cursor: pointer; }
</style>
