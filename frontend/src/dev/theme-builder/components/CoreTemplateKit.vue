<template>
  <section class="core-template-kit" aria-labelledby="core-template-kit-title">
    <header class="core-template-kit__header">
      <div>
        <p>Phase 1 foundation</p>
        <h2 id="core-template-kit-title" class="builder-serif">Cosmos Template Kit</h2>
      </div>
      <span>{{ implementedCount }}/{{ entries.length }} clear templates</span>
    </header>

    <div class="core-template-kit__groups">
      <section v-for="group in groups" :key="group.id" class="core-template-kit__group">
        <h3>{{ group.label }}</h3>
        <ol>
          <li v-for="entry in group.entries" :key="entry.catalogId">
            <button
              type="button"
              class="core-template-kit__entry"
              :class="{ 'core-template-kit__entry--disabled': !destinationFor(entry) }"
              :disabled="!destinationFor(entry)"
              @click="openTemplate(entry)"
            >
              <span class="core-template-kit__status" :class="`core-template-kit__status--${entry.status}`" aria-hidden="true" />
              <span class="core-template-kit__identity">
                <strong>{{ entry.label }}</strong>
                <small>{{ friendlyDescription(entry) }}</small>
              </span>
              <span class="core-template-kit__state">
                {{ destinationFor(entry) ? "Open" : entry.status === "implemented" ? "Clear" : "Planned" }}
              </span>
            </button>
          </li>
        </ol>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import {
  coreTemplateCatalog,
  type CoreTemplateCatalogEntry,
} from "../../../theme-engine";

const route = useRoute();
const router = useRouter();

const entries = coreTemplateCatalog;
const implementedCount = computed(
  () => entries.filter((entry) => entry.status === "implemented").length,
);

const groupDefinitions = [
  { id: "cosmos", label: "Cosmos" },
  { id: "base", label: "Base" },
  { id: "workspace", label: "Workspace" },
  { id: "ui", label: "UI" },
] as const;

const groups = computed(() =>
  groupDefinitions.map((group) => ({
    ...group,
    entries: entries.filter((entry) => entry.group === group.id) as readonly CoreTemplateCatalogEntry[],
  })),
);

function destinationFor(entry: CoreTemplateCatalogEntry): string | null {
  if (entry.status !== "implemented" || !entry.templateId) return null;
  return "theme-builder-looks-studio";
}

function friendlyDescription(entry: CoreTemplateCatalogEntry): string {
  if (entry.catalogId === "cosmos.map") return "Map background, atmosphere and constellation field";
  if (entry.catalogId.startsWith("cosmos.node.")) return "Project hierarchy node · CosmosMap reference";
  if (entry.catalogId === "cosmos.connection") return "Lines connecting the project hierarchy";
  if (entry.catalogId === "base.room.main") return "Base shell, surfaces and default layout";
  if (entry.catalogId === "base.door") return "Theme door appearance and states";
  if (entry.catalogId === "base.workspace-entry") return "Workspace entry appearance and placement";
  if (entry.catalogId === "base.companion") return "Companion presentation anchor";
  if (entry.catalogId === "base.decoration") return "Default theme decoration";
  if (entry.catalogId === "workspace.environment") return "Workspace environment and surfaces";
  if (entry.catalogId === "ui.window") return "Window frame and controls";
  return `${entry.kind} · ${entry.visualReference ?? "Cosmos reference"}`;
}

async function openTemplate(entry: CoreTemplateCatalogEntry): Promise<void> {
  const destination = destinationFor(entry);
  if (!destination) return;
  await router.push({
    name: destination,
    query: {
      ...route.query,
      template: entry.catalogId,
    },
  });
}
</script>

<style scoped>
.core-template-kit {
  display: grid;
  padding: 18px;
  border: 1px solid var(--builder-border);
  border-radius: var(--builder-radius-card);
  background: rgba(255, 255, 255, 0.012);
  gap: 16px;
}

.core-template-kit__header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
}

.core-template-kit__header div { display: grid; gap: 4px; }
.core-template-kit__header p { margin: 0; color: var(--builder-faint); font-size: 0.62rem; letter-spacing: 0.12em; text-transform: uppercase; }
.core-template-kit__header h2 { margin: 0; color: var(--builder-text); font-size: 1.1rem; }
.core-template-kit__header > span { color: var(--builder-muted); font-size: 0.68rem; white-space: nowrap; }

.core-template-kit__groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.core-template-kit__group {
  display: grid;
  padding: 12px;
  border: 1px solid var(--builder-border);
  border-radius: 8px;
  background: rgba(4, 8, 12, 0.28);
  align-content: start;
  gap: 9px;
}

.core-template-kit__group h3 { margin: 0; color: var(--builder-muted); font-size: 0.68rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
.core-template-kit__group ol { display: grid; padding: 0; margin: 0; list-style: none; gap: 7px; }
.core-template-kit__entry { display: grid; width: 100%; grid-template-columns: 9px minmax(0, 1fr) auto; align-items: center; padding: 7px 8px; border: 1px solid transparent; border-radius: 7px; color: inherit; background: transparent; text-align: left; gap: 8px; cursor: pointer; transition: border-color 120ms ease, background 120ms ease; }
.core-template-kit__entry:hover:not(:disabled), .core-template-kit__entry:focus-visible { border-color: var(--builder-border); background: rgba(255, 255, 255, 0.025); outline: none; }
.core-template-kit__entry--disabled { cursor: default; }
.core-template-kit__status { width: 7px; height: 7px; border-radius: 50%; background: rgba(151, 161, 171, 0.25); }
.core-template-kit__status--implemented { background: var(--builder-accent); box-shadow: 0 0 8px color-mix(in srgb, var(--builder-accent) 42%, transparent); }
.core-template-kit__identity { display: grid; min-width: 0; gap: 1px; }
.core-template-kit__identity strong { overflow: hidden; color: var(--builder-text); font-size: 0.7rem; font-weight: 560; text-overflow: ellipsis; white-space: nowrap; }
.core-template-kit__identity small { overflow: hidden; color: var(--builder-faint); font-size: 0.58rem; text-overflow: ellipsis; text-transform: capitalize; white-space: nowrap; }
.core-template-kit__state { color: var(--builder-muted); font-size: 0.6rem; }

@media (max-width: 1180px) {
  .core-template-kit__groups { grid-template-columns: 1fr; }
}
</style>
