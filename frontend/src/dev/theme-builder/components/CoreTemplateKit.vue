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
            <span class="core-template-kit__status" :class="`core-template-kit__status--${entry.status}`" aria-hidden="true" />
            <span class="core-template-kit__identity">
              <strong>{{ entry.label }}</strong>
              <small>{{ entry.kind }} · {{ entry.visualReference }}</small>
            </span>
            <span class="core-template-kit__state">
              {{ entry.status === "implemented" ? "Clear" : "Planned" }}
            </span>
          </li>
        </ol>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import {
  coreTemplateCatalog,
  type CoreTemplateCatalogEntry,
} from "../../../theme-engine";

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
.core-template-kit__group li { display: grid; grid-template-columns: 9px minmax(0, 1fr) auto; align-items: center; gap: 8px; }
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
