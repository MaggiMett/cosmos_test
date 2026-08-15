<template>
  <section class="theme-assets" aria-labelledby="theme-assets-title" data-testid="theme-board-assets">
    <header>
      <div>
        <h2 id="theme-assets-title" class="builder-serif">Current Theme Assets</h2>
        <p>{{ items.length }} {{ items.length === 1 ? "reference" : "references" }}</p>
      </div>
      <button type="button" @click="$emit('add')">Add Asset</button>
    </header>
    <div v-if="items.length" class="theme-assets__grid">
      <article v-for="item in items" :key="`${item.reference.id}@${item.reference.version}`">
        <div class="theme-assets__preview">
          <img v-if="item.previewUrl" :src="item.previewUrl" :alt="`${item.name} preview`" />
          <span v-else aria-hidden="true">◇</span>
        </div>
        <div class="theme-assets__copy">
          <strong>{{ item.name }}</strong>
          <span>{{ item.category }}</span>
          <small :data-status="item.status">
            {{ item.status === "available" ? `Catalog · ${item.reference.version}` : item.status === "missing" ? "Missing catalog entry" : "Unavailable resource" }}
          </small>
        </div>
        <button type="button" :aria-label="`Remove ${item.name} from theme`" @click="$emit('remove', item.reference)">
          Remove
        </button>
      </article>
    </div>
    <div v-else class="theme-assets__empty">
      <span aria-hidden="true">◇</span>
      <div><strong>No assets referenced</strong><p>Add an existing cataloged Visual Asset to this draft.</p></div>
      <button type="button" @click="$emit('add')">Add Asset</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ExactVersionedRef } from "../../../theme-engine";
import type { BuilderAssetPresentation } from "../themeBuilderAssetReferences";

defineProps<{ items: readonly Readonly<BuilderAssetPresentation>[] }>();
defineEmits<{ add: []; remove: [reference: Readonly<ExactVersionedRef>] }>();
</script>

<style scoped>
.theme-assets { display: grid; gap: 16px; padding-top: 4px; }
.theme-assets > header { display: flex; align-items: end; justify-content: space-between; gap: 20px; }
.theme-assets h2, .theme-assets p { margin: 0; }
.theme-assets h2 { font-size: 1.06rem; }
.theme-assets p { margin-top: 3px; color: var(--builder-faint); font-size: 0.68rem; }
.theme-assets button { min-height: 34px; padding: 0 12px; border: 1px solid var(--builder-border-strong); border-radius: var(--builder-radius-control); background: rgba(120, 149, 177, 0.1); color: var(--builder-text); cursor: pointer; }
.theme-assets__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.theme-assets__grid article { display: grid; min-width: 0; padding: 11px; grid-template-columns: 86px minmax(0, 1fr); border: 1px solid rgba(154,174,191,.14); border-radius: var(--builder-radius-card); background: linear-gradient(145deg, rgba(23,30,36,.88), rgba(13,18,23,.74)); box-shadow: inset 0 1px rgba(255,255,255,.018); gap: 12px; }
.theme-assets__preview { display: grid; min-height: 82px; overflow: hidden; place-items: center; border:1px solid rgba(255,255,255,.025); border-radius: 10px; background: radial-gradient(circle at 60% 30%,rgba(120,149,177,.08),transparent 38%),#10161b; color: var(--builder-faint); }
.theme-assets__preview img { width: 100%; height: 100%; object-fit: contain; }
.theme-assets__copy { display: grid; min-width: 0; align-content: center; gap: 3px; }
.theme-assets__copy strong, .theme-assets__copy span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.theme-assets__copy strong { font-size: 0.78rem; font-weight: 500; }
.theme-assets__copy span, .theme-assets__copy small { color: var(--builder-muted); font-size: 0.64rem; }
.theme-assets__copy small[data-status="missing"], .theme-assets__copy small[data-status="unavailable"] { color: #c69b76; }
.theme-assets__grid article > button { min-height: 26px; padding: 0; grid-column: 1 / -1; border-color: transparent; background: transparent; color: var(--builder-muted); font-size: 0.65rem; }
.theme-assets__empty { display: flex; min-height: 86px; padding: 16px; align-items: center; border: 1px dashed var(--builder-border-strong); border-radius: var(--builder-radius-card); color: var(--builder-faint); gap: 14px; }
.theme-assets__empty > span { font-size: 1.4rem; }
.theme-assets__empty > div { min-width: 0; flex: 1; }
.theme-assets__empty strong { color: var(--builder-text); font-size: 0.8rem; }
@media (max-width: 1200px) { .theme-assets__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
