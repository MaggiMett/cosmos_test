<template>
  <ToolWindow
    :title="record.details.displayName"
    :bounds="record.window.bounds"
    :minimum-size="{ width: 420, height: 380 }"
    :focus-order="record.window.focusOrder"
    :active="record.window.state === 'active'"
    @close="$emit('request-close', record.windowId, dirty)"
    @focus="$emit('focus', record.windowId)"
    @move="$emit('move', record.windowId, $event)"
    @resize="$emit('resize', record.windowId, $event)"
  >
    <article class="object-window">
      <header class="object-window__identity">
        <span class="object-window__role">{{ primaryRole }}</span>
        <span>
          <strong>{{ record.details.displayName }}</strong>
          <small>{{ record.details.primaryProjectId || "Global Object" }}</small>
        </span>
      </header>

      <nav aria-label="Object sections">
        <button type="button" :class="{ selected: section === 'details' }" @click="section = 'details'">Details</button>
        <button type="button" :class="{ selected: section === 'edit' }" @click="section = 'edit'">Edit</button>
        <button type="button" :class="{ selected: section === 'appearance' }" @click="section = 'appearance'">Appearance</button>
        <button type="button" :class="{ selected: section === 'relationships' }" @click="section = 'relationships'">Connections</button>
      </nav>

      <div v-if="section === 'details'" class="object-window__content">
        <section>
          <h3>Identity</h3>
          <p>{{ record.details.description || "No description supplied." }}</p>
          <div class="object-window__pills">
            <span v-for="tag in record.details.systemTags" :key="tag">{{ tag }}</span>
          </div>
        </section>
        <section>
          <h3>Properties</h3>
          <dl>
            <template v-for="([name, value]) in allProperties" :key="name">
              <dt>{{ propertyLabel(name) }}</dt>
              <dd>{{ displayValue(value) }}</dd>
            </template>
          </dl>
        </section>
        <section>
          <h3>User Tags</h3>
          <div v-if="record.details.userTags.length" class="object-window__pills object-window__pills--user">
            <span v-for="tag in record.details.userTags" :key="tag">{{ tag }}</span>
          </div>
          <p v-else>No User Tags.</p>
        </section>
      </div>

      <form v-else-if="section === 'edit'" class="object-window__content" @submit.prevent="save">
        <section>
          <h3>Object identity</h3>
          <label>Display name<input v-model="draft.displayName" required /></label>
          <label>Description<textarea v-model="draft.description" rows="3" /></label>
          <label>User Tags<small>Separate Tags with commas.</small><input v-model="draft.userTags" /></label>
        </section>
        <section v-if="editPropertyNames.length">
          <h3>Configuration</h3>
          <label v-for="name in editPropertyNames" :key="name">
            {{ propertyLabel(name) }}
            <input :value="draft.properties[name]" @input="setProperty(name, $event)" />
          </label>
        </section>
        <p v-if="record.error" class="object-window__error" role="alert">{{ record.error }}</p>
        <footer>
          <span v-if="dirty">Unsaved changes</span>
          <button type="button" :disabled="!dirty || record.saving" @click="resetDraft">Reset</button>
          <button type="submit" :disabled="!dirty || record.saving">{{ record.saving ? "Saving…" : "Save" }}</button>
        </footer>
      </form>

      <form v-else-if="section === 'appearance'" class="object-window__content" @submit.prevent="save">
        <section>
          <h3>Appearance</h3>
          <label v-for="name in appearancePropertyNames" :key="name">
            {{ propertyLabel(name) }}
            <input :value="draft.properties[name]" @input="setProperty(name, $event)" />
          </label>
          <p v-if="!appearancePropertyNames.length">This Object has no editable Version 1 appearance Properties.</p>
        </section>
        <p v-if="record.error" class="object-window__error" role="alert">{{ record.error }}</p>
        <footer v-if="appearancePropertyNames.length">
          <span v-if="dirty">Unsaved changes</span>
          <button type="button" :disabled="!dirty || record.saving" @click="resetDraft">Reset</button>
          <button type="submit" :disabled="!dirty || record.saving">{{ record.saving ? "Saving…" : "Save" }}</button>
        </footer>
      </form>

      <div v-else class="object-window__content">
        <section>
          <h3>Connections</h3>
          <ul v-if="record.details.relationships.length" class="object-window__relationships">
            <li v-for="relationship in record.details.relationships" :key="relationship.relationshipId">
              <span>{{ relationship.relatedDisplayName }}</span>
              <small>{{ relationship.type }}</small>
            </li>
          </ul>
          <p v-else>No accepted Connections.</p>
        </section>
      </div>
    </article>
  </ToolWindow>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";

import type {
  ObjectDetails,
  ObjectWindowRecord,
  ObjectWindowSection,
} from "../../runtime/objectInteractionRuntime";
import ToolWindow from "./ToolWindow.vue";

const props = defineProps<{ record: ObjectWindowRecord }>();
const emit = defineEmits<{
  "request-close": [windowId: string, dirty: boolean];
  focus: [windowId: string];
  move: [windowId: string, position: { x: number; y: number }];
  resize: [windowId: string, size: { width: number; height: number }];
  save: [windowId: string, update: ObjectUpdate];
}>();

interface ObjectUpdate extends Pick<ObjectDetails, "displayName" | "description" | "userTags"> {
  properties: Record<string, unknown>;
}

interface Draft {
  displayName: string;
  description: string;
  userTags: string;
  properties: Record<string, string>;
}

const APPEARANCE_PROPERTIES = new Set(["project_color", "skin", "icon", "overlay", "theme_override"]);
const section = ref<ObjectWindowSection>(props.record.section);
const draft = reactive<Draft>({ displayName: "", description: "", userTags: "", properties: {} });

const primaryRole = computed(
  () => props.record.details.systemTags.find((tag) => tag !== "Node" && tag !== "System") ?? "Object",
);
const allProperties = computed(() => Object.entries(props.record.details.properties));
const appearancePropertyNames = computed(() =>
  props.record.details.editableProperties.filter((name) => APPEARANCE_PROPERTIES.has(name)),
);
const editPropertyNames = computed(() =>
  props.record.details.editableProperties.filter((name) => !APPEARANCE_PROPERTIES.has(name)),
);
const serializedDraft = computed(() =>
  JSON.stringify({
    displayName: draft.displayName.trim(),
    description: draft.description.trim(),
    userTags: parsedTags(),
    properties: editablePropertyPayload(),
  }),
);
const serializedSource = computed(() =>
  JSON.stringify({
    displayName: props.record.details.displayName,
    description: props.record.details.description,
    userTags: [...props.record.details.userTags].sort(),
    properties: Object.fromEntries(
      props.record.details.editableProperties.map((name) => [name, props.record.details.properties[name]]),
    ),
  }),
);
const dirty = computed(() => serializedDraft.value !== serializedSource.value);

function resetDraft() {
  draft.displayName = props.record.details.displayName;
  draft.description = props.record.details.description;
  draft.userTags = props.record.details.userTags.join(", ");
  draft.properties = Object.fromEntries(
    props.record.details.editableProperties.map((name) => [
      name,
      String(props.record.details.properties[name] ?? ""),
    ]),
  );
}

function setProperty(name: string, event: Event) {
  draft.properties[name] = (event.target as HTMLInputElement).value;
}

function save() {
  if (!dirty.value || props.record.saving) return;
  emit("save", props.record.windowId, {
    displayName: draft.displayName.trim(),
    description: draft.description.trim(),
    userTags: parsedTags(),
    properties: editablePropertyPayload(),
  });
}

function parsedTags(): string[] {
  return [...new Set(draft.userTags.split(",").map((tag) => tag.trim()).filter(Boolean))].sort();
}

function editablePropertyPayload(): Record<string, unknown> {
  return Object.fromEntries(
    props.record.details.editableProperties.map((name) => [name, draft.properties[name] ?? ""]),
  );
}

function propertyLabel(name: string): string {
  return name.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayValue(value: unknown): string {
  if (typeof value === "string") return value || "—";
  return JSON.stringify(value);
}

watch(() => props.record.section, (value) => { section.value = value; });
watch(() => props.record.details, resetDraft, { deep: true, immediate: true });
</script>

<style scoped>
.object-window { display: grid; height: 100%; min-height: 0; grid-template-rows: auto auto 1fr; color: #dce7f4; }
.object-window__identity { display: flex; min-height: 68px; padding: 12px 18px; align-items: center; border-bottom: 1px solid rgba(220, 232, 248, 0.08); gap: 12px; }
.object-window__identity > span:last-child { display: grid; gap: 3px; }
.object-window__identity strong { font-size: 0.9rem; }
.object-window__identity small { color: #73839b; font-size: 0.62rem; }
.object-window__role { display: grid; width: 38px; height: 38px; place-items: center; border: 1px solid rgba(125, 211, 252, 0.24); border-radius: 50%; background: rgba(125, 211, 252, 0.08); color: #bcecff; font-size: 0.48rem; text-align: center; }
.object-window > nav { display: flex; padding: 6px 12px; border-bottom: 1px solid rgba(220, 232, 248, 0.08); gap: 3px; }
.object-window > nav button { min-height: 32px; padding: 0 10px; border: 1px solid transparent; border-radius: 8px; background: transparent; color: #8392a8; font-size: 0.64rem; cursor: pointer; }
.object-window > nav button:hover, .object-window > nav button:focus-visible, .object-window > nav button.selected { border-color: rgba(196, 181, 253, 0.18); outline: none; background: rgba(139, 92, 246, 0.09); color: #e6e8ff; }
.object-window__content { min-height: 0; margin: 0; padding: 16px 18px 22px; overflow: auto; }
.object-window__content section + section { padding-top: 16px; border-top: 1px solid rgba(220, 232, 248, 0.08); }
.object-window__content section { display: grid; gap: 10px; }
.object-window__content h3 { margin: 0; color: #8fa1b8; font-size: 0.61rem; letter-spacing: 0.13em; text-transform: uppercase; }
.object-window__content p { margin: 0; color: #a8b5c8; font-size: 0.72rem; line-height: 1.55; }
.object-window__content dl { display: grid; margin: 0; grid-template-columns: minmax(110px, 0.42fr) minmax(0, 1fr); }
.object-window__content dt, .object-window__content dd { margin: 0; padding: 7px 0; border-bottom: 1px solid rgba(220, 232, 248, 0.055); font-size: 0.68rem; overflow-wrap: anywhere; }
.object-window__content dt { color: #77879d; }
.object-window__content dd { color: #c7d2e2; }
.object-window__pills { display: flex; flex-wrap: wrap; gap: 5px; }
.object-window__pills span { padding: 4px 7px; border: 1px solid rgba(180, 199, 226, 0.13); border-radius: 999px; color: #8898ae; font-size: 0.58rem; }
.object-window__pills--user span { border-color: rgba(139, 202, 238, 0.2); color: #a6d8f3; }
.object-window__content label { display: grid; color: #8d9db2; font-size: 0.66rem; gap: 5px; }
.object-window__content label small { color: #627289; }
.object-window__content input, .object-window__content textarea { width: 100%; padding: 8px 9px; border: 1px solid rgba(213, 227, 245, 0.14); border-radius: 8px; outline: none; background: rgba(2, 6, 18, 0.5); color: #e8eef7; font: inherit; }
.object-window__content input:focus, .object-window__content textarea:focus { border-color: rgba(125, 211, 252, 0.45); box-shadow: 0 0 0 3px rgba(125, 211, 252, 0.06); }
.object-window__content footer { position: sticky; bottom: -22px; display: flex; margin: auto -18px -22px; padding: 11px 16px; align-items: center; justify-content: flex-end; border-top: 1px solid rgba(220, 232, 248, 0.08); background: rgba(8, 12, 28, 0.96); gap: 7px; }
.object-window__content footer span { margin-right: auto; color: #d5b87b; font-size: 0.61rem; }
.object-window__content footer button { min-height: 34px; padding: 0 11px; border: 1px solid rgba(213, 227, 245, 0.15); border-radius: 8px; background: rgba(255, 255, 255, 0.04); cursor: pointer; }
.object-window__content footer button[type="submit"] { border-color: rgba(125, 211, 252, 0.32); background: rgba(125, 211, 252, 0.1); }
.object-window__content footer button:disabled { opacity: 0.4; cursor: default; }
.object-window__error { padding: 8px 10px; border-radius: 8px; background: rgba(131, 44, 54, 0.28); color: #f0b4bc !important; }
.object-window__relationships { display: grid; margin: 0; padding: 0; list-style: none; gap: 6px; }
.object-window__relationships li { display: flex; padding: 9px 10px; align-items: center; justify-content: space-between; border: 1px solid rgba(220, 232, 248, 0.09); border-radius: 8px; color: #c7d2e2; font-size: 0.69rem; }
.object-window__relationships small { color: #718096; }
</style>
