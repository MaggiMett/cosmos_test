<template>
  <div class="looks-studio-inspector" data-testid="looks-studio-inspector">
    <header class="looks-studio-inspector__heading"><h1 class="builder-serif">{{ partName }}</h1><p>{{ skinName }} <span aria-hidden="true">·</span> {{ stateLabel }}</p></header>
    <BuilderAccordionSection title="Look" :open="true">
      <div class="looks-appearance">
        <div v-if="stateLabel !== 'Default'" class="looks-appearance__inheritance" :class="{ 'looks-appearance__inheritance--custom': !inheritsDefault }">
          <span>{{ inheritsDefault ? "Using Default look" : "Custom look for this interaction" }}</span>
          <button v-if="!inheritsDefault" type="button" @click="$emit('clear-material')">Reset to Default</button>
        </div>
        <span class="looks-appearance__label">Color & surface</span>
        <label>Color<input type="color" :value="fill" @change="emitValue('core.material.fill', $event)" /></label>
        <label>Outline / glow<input type="color" :value="stroke" @change="emitValue('core.material.stroke', $event)" /></label>
        <label>Visibility<input type="range" min="0" max="1" step="0.05" :value="opacity" @change="emitNumber('core.material.opacity', $event)" /></label>
        <label>Artwork / texture
          <select :value="textureRef" @change="emitTexture">
            <option value="">No texture</option>
            <option v-for="asset in assets" :key="`${asset.reference.id}@${asset.reference.version}`" :value="asset.reference.id">{{ asset.name }}</option>
          </select>
        </label>
        <button type="button" class="looks-appearance__clear" @click="$emit('clear-material')">Clear material</button>
        <span class="looks-appearance__finish">Finish <strong>{{ fill }}</strong></span>
      </div>
    </BuilderAccordionSection>
    <BuilderAccordionSection title="Effects">
      <div class="looks-effects">
        <p>Outline / glow uses the selected part's accent color. More effect controls will appear here as the template exposes them.</p>
      </div>
    </BuilderAccordionSection>
    <section class="animation-section" aria-label="Animation"><span class="builder-serif">Animation</span><button type="button" disabled>Coming later</button></section>
    <details class="looks-inspector__advanced">
      <summary>Advanced</summary>
      <p v-if="partId">Part ID · {{ partId }}</p>
      <p>Material channel · core.material.dom-surface</p>
    </details>
  </div>
</template>

<script setup lang="ts">
import type { JsonValue } from "../../../theme-engine";
import type { BuilderAssetPresentation } from "../themeBuilderAssetReferences";
import BuilderAccordionSection from "./BuilderAccordionSection.vue";

defineProps<{ skinName: string; partName: string; partId: string; stateLabel: string; fill: string; stroke: string; opacity: number; textureRef: string; assets: readonly Readonly<BuilderAssetPresentation>[]; inheritsDefault: boolean }>();
const emit = defineEmits<{ "set-material": [parameterId: string, value: JsonValue]; "clear-material": [] }>();
function emitValue(parameterId: string, event: Event): void { emit("set-material", parameterId, (event.target as HTMLInputElement).value); }
function emitNumber(parameterId: string, event: Event): void { emit("set-material", parameterId, Number((event.target as HTMLInputElement).value)); }
function emitTexture(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  if (value) emit("set-material", "core.material.texture-ref", value);
  else emit("set-material", "core.material.texture-ref", null);
}
</script>

<style scoped>
.looks-studio-inspector { min-height:100%; padding:22px 20px 36px; }.looks-studio-inspector__heading{display:grid;padding:0 4px 15px;border-bottom:1px solid var(--builder-border);gap:7px}.looks-studio-inspector__heading h1{margin:0;color:var(--builder-text);font-size:1.55rem;line-height:1.1}.looks-studio-inspector__heading p{margin:0;color:var(--builder-muted);font-size:.68rem}.looks-appearance{display:grid;gap:12px}.looks-appearance__label,.looks-appearance label,.looks-appearance__finish{display:grid;color:#c4c4c0;font-size:.68rem;gap:6px}.looks-appearance__inheritance{display:flex;min-height:34px;padding:7px 9px;align-items:center;justify-content:space-between;border:1px solid var(--builder-border);border-radius:var(--builder-radius-control);background:rgba(120,149,177,.05);color:var(--builder-muted);font-size:.64rem;gap:8px}.looks-appearance__inheritance--custom{border-color:rgba(98,217,255,.28);background:rgba(98,217,255,.06);color:var(--builder-text)}.looks-appearance__inheritance button{padding:5px 8px;border:1px solid var(--builder-border);border-radius:var(--builder-radius-control);background:transparent;color:var(--builder-text);font-size:.6rem;cursor:pointer}.looks-appearance input,.looks-appearance select,.looks-appearance__clear{min-height:36px;padding:0 9px;border:1px solid var(--builder-border);border-radius:var(--builder-radius-control);background:rgba(13,18,23,.5);color:var(--builder-text)}.looks-appearance input[type="color"]{width:100%;padding:4px}.looks-appearance__clear{cursor:pointer}.looks-appearance__finish{grid-template-columns:1fr auto}.animation-section{display:flex;min-height:56px;padding:0 4px;align-items:center;justify-content:space-between;border-bottom:1px solid var(--builder-border);gap:14px}.animation-section>span{font-size:.92rem}.animation-section button{min-height:34px;padding:0 13px;border:1px solid var(--builder-border);border-radius:var(--builder-radius-control);background:rgba(13,18,23,.5);color:var(--builder-text);font-size:.68rem;opacity:.45}.looks-effects p{margin:0;color:var(--builder-muted);font-size:.66rem;line-height:1.5}.looks-inspector__advanced{margin-top:16px;color:var(--builder-faint);font-size:.6rem}.looks-inspector__advanced summary{cursor:pointer}.looks-inspector__advanced p{margin:8px 0 0;overflow-wrap:anywhere}.looks-appearance input[type="range"]{padding:0}
</style>
