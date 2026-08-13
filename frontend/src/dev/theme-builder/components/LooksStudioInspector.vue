<template>
  <div class="looks-studio-inspector" data-testid="looks-studio-inspector">
    <header class="looks-studio-inspector__heading"><h1 class="builder-serif">{{ skinName }}</h1><p>Look <span aria-hidden="true">·</span> {{ stateLabel }}</p></header>
    <BuilderAccordionSection title="Appearance" :open="true">
      <div class="looks-appearance">
        <span class="looks-appearance__label">Surface</span>
        <label>Fill<input type="color" :value="fill" @change="emitValue('core.material.fill', $event)" /></label>
        <label>Stroke<input type="color" :value="stroke" @change="emitValue('core.material.stroke', $event)" /></label>
        <label>Opacity<input type="number" min="0" max="1" step="0.05" :value="opacity" @change="emitNumber('core.material.opacity', $event)" /></label>
        <label>Texture
          <select :value="textureRef" @change="emitTexture">
            <option value="">No texture</option>
            <option v-for="asset in assets" :key="`${asset.reference.id}@${asset.reference.version}`" :value="asset.reference.id">{{ asset.name }}</option>
          </select>
        </label>
        <button type="button" class="looks-appearance__clear" @click="$emit('clear-material')">Clear material</button>
        <span class="looks-appearance__finish">Finish <strong>{{ fill }}</strong></span>
      </div>
    </BuilderAccordionSection>
    <BuilderAccordionSection title="Alignment" /><BuilderAccordionSection title="Fit" /><BuilderAccordionSection title="Overflow" /><BuilderAccordionSection title="Variant" />
    <section class="animation-section" aria-label="Animation"><span class="builder-serif">Animation</span><button type="button" disabled>Animate...</button></section>
  </div>
</template>

<script setup lang="ts">
import type { JsonValue } from "../../../theme-engine";
import type { BuilderAssetPresentation } from "../themeBuilderAssetReferences";
import BuilderAccordionSection from "./BuilderAccordionSection.vue";

defineProps<{ skinName: string; stateLabel: string; fill: string; stroke: string; opacity: number; textureRef: string; assets: readonly Readonly<BuilderAssetPresentation>[] }>();
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
.looks-studio-inspector { min-height:100%; padding:22px 20px 36px; }.looks-studio-inspector__heading{display:grid;padding:0 4px 15px;border-bottom:1px solid var(--builder-border);gap:7px}.looks-studio-inspector__heading h1{margin:0;color:var(--builder-text);font-size:1.55rem;line-height:1.1}.looks-studio-inspector__heading p{margin:0;color:var(--builder-muted);font-size:.68rem}.looks-appearance{display:grid;gap:12px}.looks-appearance__label,.looks-appearance label,.looks-appearance__finish{display:grid;color:#c4c4c0;font-size:.68rem;gap:6px}.looks-appearance input,.looks-appearance select,.looks-appearance__clear{min-height:36px;padding:0 9px;border:1px solid var(--builder-border);border-radius:var(--builder-radius-control);background:rgba(13,18,23,.5);color:var(--builder-text)}.looks-appearance input[type="color"]{width:100%;padding:4px}.looks-appearance__clear{cursor:pointer}.looks-appearance__finish{grid-template-columns:1fr auto}.animation-section{display:flex;min-height:56px;padding:0 4px;align-items:center;justify-content:space-between;border-bottom:1px solid var(--builder-border);gap:14px}.animation-section>span{font-size:.92rem}.animation-section button{min-height:34px;padding:0 13px;border:1px solid var(--builder-border);border-radius:var(--builder-radius-control);background:rgba(13,18,23,.5);color:var(--builder-text);font-size:.68rem;opacity:.45}
</style>
