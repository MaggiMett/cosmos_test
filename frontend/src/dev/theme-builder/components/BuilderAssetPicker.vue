<template>
  <div class="asset-picker" role="dialog" aria-modal="true" aria-labelledby="asset-picker-title" @keydown.esc="$emit('close')">
    <button type="button" class="asset-picker__backdrop" aria-label="Close Asset picker" @click="$emit('close')" />
    <section class="asset-picker__drawer">
      <header>
        <div><span>Persistent Asset Catalog</span><h2 id="asset-picker-title" class="builder-serif">Add Asset</h2></div>
        <button type="button" aria-label="Close Asset picker" @click="$emit('close')">×</button>
      </header>
      <p v-if="loading" role="status">Loading cataloged assets…</p>
      <div v-else-if="error" class="asset-picker__state" role="alert">{{ error }}</div>
      <div v-else-if="records.length" class="asset-picker__grid" role="listbox" aria-label="Cataloged Visual Assets">
        <button
          v-for="record in records"
          :key="`${record.visualAsset.id}@${record.visualAsset.version}`"
          type="button"
          role="option"
          :aria-selected="selectedAssetId === record.visualAsset.id"
          :disabled="!usable(record)"
          @click="selectedAssetId = record.visualAsset.id"
        >
          <span class="asset-picker__preview">
            <img v-if="record.previewUrl" :src="record.previewUrl" :alt="`${record.catalogEntry.displayName} preview`" />
            <i v-else aria-hidden="true">◇</i>
          </span>
          <strong>{{ record.catalogEntry.displayName }}</strong>
          <small>{{ record.catalogEntry.category }}</small>
          <em>{{ usable(record) ? record.visualAsset.version : "Unavailable" }}</em>
        </button>
      </div>
      <div v-else class="asset-picker__state"><p>No cataloged Visual Assets are available.</p><button type="button" @click="$emit('open-library')">Open Asset Library</button></div>
      <footer>
        <p>Selection creates only an exact draft reference. Import remains in Asset Library.</p>
        <button type="button" :disabled="!selectedAssetId" @click="addSelected">Add to Theme</button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from "vue";
import type { PersistedAssetCatalogRecord } from "../../../runtime/assetCatalogApi";

defineProps<{
  records: readonly Readonly<PersistedAssetCatalogRecord>[];
  loading: boolean;
  error: string;
}>();
const emit = defineEmits<{ close: []; add: [assetId: string]; 'open-library': [] }>();
const selectedAssetId = shallowRef("");

function usable(record: Readonly<PersistedAssetCatalogRecord>): boolean {
  return record.resourceAvailable && !record.catalogEntry.deprecated;
}

function addSelected(): void {
  if (selectedAssetId.value) emit("add", selectedAssetId.value);
}
</script>

<style scoped>
.asset-picker { position: fixed; z-index: 20; inset: 0; }
.asset-picker__backdrop { position: absolute; inset: 0; width: 100%; border: 0; background: rgba(2, 5, 8, 0.72); }
.asset-picker__drawer { position: absolute; top: 64px; right: 0; bottom: 0; display: grid; width: min(680px, calc(100vw - 72px)); padding: 22px; grid-template-rows: auto minmax(0, 1fr) auto; border-left: 1px solid var(--builder-border-strong); background: var(--builder-bg-deep); box-shadow: -24px 0 60px rgba(0, 0, 0, 0.3); gap: 18px; }
.asset-picker__drawer > header, .asset-picker__drawer > footer { display: flex; align-items: center; justify-content: space-between; gap: 18px; }
.asset-picker__drawer h2, .asset-picker__drawer p { margin: 0; }
.asset-picker__drawer header span { color: var(--builder-faint); font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.1em; }
.asset-picker__drawer h2 { margin-top: 4px; font-size: 1.45rem; }
.asset-picker__drawer button { border: 1px solid var(--builder-border); border-radius: var(--builder-radius-control); background: transparent; color: var(--builder-text); cursor: pointer; }
.asset-picker__drawer header button { width: 34px; height: 34px; }
.asset-picker__grid { display: grid; min-height: 0; padding-right: 5px; grid-template-columns: repeat(3, minmax(0, 1fr)); align-content: start; overflow: auto; gap: 10px; }
.asset-picker__grid > button { display: grid; min-width: 0; padding: 8px; text-align: left; gap: 4px; }
.asset-picker__grid > button[aria-selected="true"] { border-color: var(--builder-accent); background: rgba(120, 149, 177, 0.12); }
.asset-picker__grid > button:disabled { cursor: default; opacity: 0.45; }
.asset-picker__preview { display: grid; height: 112px; overflow: hidden; place-items: center; border-radius: 7px; background: #11171c; }
.asset-picker__preview img { width: 100%; height: 100%; object-fit: contain; }
.asset-picker__grid strong, .asset-picker__grid small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.asset-picker__grid strong { margin-top: 4px; font-size: 0.75rem; font-weight: 500; }
.asset-picker__grid small, .asset-picker__grid em { color: var(--builder-muted); font-size: 0.61rem; font-style: normal; }
.asset-picker__state { display:grid;align-self:center;justify-items:center;color:var(--builder-muted);text-align:center;gap:12px; }
.asset-picker__state p{margin:0}.asset-picker__state button{min-height:38px;padding:0 14px;background:rgba(120,149,177,.14)}
.asset-picker__drawer footer p { max-width: 380px; color: var(--builder-faint); font-size: 0.66rem; }
.asset-picker__drawer footer button { min-height: 38px; padding: 0 16px; background: rgba(120, 149, 177, 0.16); }
.asset-picker__drawer footer button:disabled { opacity: 0.4; }
</style>
