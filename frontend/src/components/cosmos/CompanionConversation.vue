<template>
  <ToolWindow
    title="Companion"
    :bounds="bounds"
    :minimum-size="{ width: 360, height: 360 }"
    @close="$emit('close')"
    @focus="$emit('focus')"
    @move="$emit('move', $event)"
    @resize="$emit('resize', $event)"
  >
    <div class="conversation">
      <div class="conversation__context">
        <span>Current context</span>
        <strong>{{ currentLocation }}</strong>
      </div>
      <nav class="conversation__tabs" aria-label="Companion sections">
        <button type="button" :aria-current="section === 'conversation'" @click="section = 'conversation'">Conversation</button>
        <button type="button" :aria-current="section === 'notifications'" @click="section = 'notifications'">
          Notifications
        </button>
      </nav>
      <NotificationCenter
        v-if="section === 'notifications'"
        @destination="$emit('destination', $event)"
      />
      <ol v-else class="conversation__messages" aria-live="polite">
        <li v-for="entry in messages" :key="entry.id" :class="`conversation__message--${entry.author}`">
          <span>{{ entry.author === "companion" ? "Companion" : "You" }}</span>
          <p>{{ entry.message }}</p>
        </li>
      </ol>
      <form v-if="section === 'conversation'" class="conversation__form" @submit.prevent="send">
        <label class="sr-only" for="companion-message">Talk to the Companion</label>
        <input
          id="companion-message"
          v-model="draft"
          type="text"
          autocomplete="off"
          placeholder="Talk to the Companion…"
          :disabled="sending"
        />
        <button type="submit" :disabled="sending || !draft.trim()">Send</button>
      </form>
    </div>
  </ToolWindow>
</template>

<script setup lang="ts">
import { ref } from "vue";

import type { CompanionContext } from "../../runtime/cosmosMapRuntime";
import type { WindowBounds } from "../../runtime/windowRuntime";
import { useCosmosRuntime } from "../../runtime/plugin";
import ToolWindow from "../windows/ToolWindow.vue";
import NotificationCenter from "./NotificationCenter.vue";

const props = defineProps<{
  bounds: WindowBounds;
  currentLocation: string;
  context?: CompanionContext;
}>();
defineEmits<{
  close: [];
  focus: [];
  move: [position: { x: number; y: number }];
  resize: [size: { width: number; height: number }];
  destination: [objectId: string];
}>();

const runtime = useCosmosRuntime();
const draft = ref("");
const sending = ref(false);
const section = ref<"conversation" | "notifications">("conversation");
const messages = ref<Array<{ id: string; author: "companion" | "user"; message: string }>>([
  {
    id: "welcome",
    author: "companion" as const,
    message: "Hello. I'm here with you in Cosmos.",
  },
]);

async function send() {
  const message = draft.value.trim();
  if (!message || sending.value) return;
  messages.value.push({ id: crypto.randomUUID(), author: "user", message });
  draft.value = "";
  sending.value = true;
  try {
    const reply = await runtime.cosmosMap.sendCompanionMessage(message, props.context);
    messages.value.push({ id: crypto.randomUUID(), author: "companion", message: reply.message });
  } catch (error) {
    messages.value.push({
      id: crypto.randomUUID(),
      author: "companion",
      message: error instanceof Error ? error.message : "Conversation is temporarily unavailable.",
    });
  } finally {
    sending.value = false;
  }
}
</script>

<style scoped>
.conversation {
  display: grid;
  height: 100%;
  grid-template-rows: auto auto 1fr auto;
}

.conversation__tabs { display: flex; padding: 5px 12px; border-bottom: 1px solid rgba(226, 232, 240, 0.08); gap: 4px; }
.conversation__tabs button { min-height: 30px; padding: 0 9px; border: 1px solid transparent; border-radius: 8px; background: transparent; color: #718096; font-size: 0.62rem; cursor: pointer; }
.conversation__tabs button:hover, .conversation__tabs button:focus-visible, .conversation__tabs button[aria-current="true"] { border-color: rgba(125, 211, 252, 0.18); outline: none; background: rgba(125, 211, 252, 0.07); color: #bfe8fb; }

.conversation__context {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.08);
  color: #94a3b8;
  font-size: 0.76rem;
}

.conversation__context strong {
  color: #dbeafe;
  font-weight: 600;
}

.conversation__messages {
  display: flex;
  min-height: 0;
  margin: 0;
  padding: 18px;
  flex-direction: column;
  gap: 14px;
  overflow: auto;
  list-style: none;
}

.conversation__messages li {
  width: min(88%, 34rem);
}

.conversation__messages li span {
  color: #94a3b8;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.conversation__messages p {
  margin: 5px 0 0;
  padding: 11px 13px;
  border: 1px solid rgba(226, 232, 240, 0.1);
  border-radius: 14px 14px 14px 4px;
  background: rgba(125, 211, 252, 0.07);
  color: #e2e8f0;
  line-height: 1.5;
}

.conversation__message--user {
  align-self: flex-end;
}

.conversation__message--user span {
  display: block;
  text-align: right;
}

.conversation__message--user p {
  border-radius: 14px 14px 4px;
  background: rgba(196, 181, 253, 0.12);
}

.conversation__form {
  display: grid;
  padding: 14px;
  border-top: 1px solid rgba(226, 232, 240, 0.1);
  grid-template-columns: 1fr auto;
  gap: 9px;
}

.conversation__form input,
.conversation__form button {
  min-height: 42px;
  border: 1px solid rgba(226, 232, 240, 0.16);
  border-radius: 12px;
  color: #f8fafc;
}

.conversation__form input {
  min-width: 0;
  padding: 0 13px;
  outline: none;
  background: rgba(2, 6, 23, 0.68);
}

.conversation__form input:focus {
  border-color: rgba(125, 211, 252, 0.62);
  box-shadow: 0 0 0 3px rgba(125, 211, 252, 0.08);
}

.conversation__form button {
  padding: 0 16px;
  background: rgba(125, 211, 252, 0.12);
  cursor: pointer;
}

.conversation__form button:disabled {
  opacity: 0.45;
  cursor: default;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
