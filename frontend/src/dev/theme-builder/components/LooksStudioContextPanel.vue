<template>
  <aside class="looks-context" aria-label="Looks Studio context" data-testid="looks-studio-context">
    <section class="looks-context__section">
      <h2 class="builder-serif">Current Template</h2>
      <div class="current-template">
        <NeutralVisualPlaceholder :label="templateName" />
        <span><strong class="builder-serif">{{ templateName }}</strong><small>Clear template · {{ slots.length }} editable parts</small></span>
      </div>
    </section>

    <section class="looks-context__section looks-context__section--lined">
      <h2 class="builder-serif">Parts</h2>
      <div class="visual-slot-list">
        <button
          v-for="slot in slots"
          :key="slot.slotId"
          type="button"
          :class="{ 'visual-slot-list__active': selectedSlotId === slot.slotId }"
          :aria-pressed="selectedSlotId === slot.slotId"
          @click="$emit('select-slot', slot.slotId)"
        >
          <span class="visual-slot-list__swatch" :data-tone="slot.assetId ? 'assigned' : 'empty'" aria-hidden="true" />
          <span class="visual-slot-list__copy"><strong>{{ slot.label }}</strong><small>{{ slot.purpose }}</small></span>
          <span class="visual-slot-list__value">{{ slot.statusLabel }}</span>
          <BuilderIcon :name="slot.assetId ? 'check' : 'object'" />
        </button>
      </div>
    </section>

    <section class="looks-context__section looks-context__section--lined">
      <h2 class="builder-serif">Artwork</h2>
      <p class="looks-context__hint">Choose the artwork used by the selected part.</p>
      <div v-if="selectedSlot && activeStateId !== 'default'" class="looks-context__inheritance" :class="{ 'looks-context__inheritance--custom': !selectedSlot.inherited }">
        <span>{{ selectedSlot.inherited ? "Using Default artwork" : "Custom artwork for this interaction" }}</span>
        <button v-if="!selectedSlot.inherited" type="button" @click="$emit('clear-slot')">Reset to Default</button>
      </div>
      <p v-if="assets.length === 0" class="looks-context__empty">Add artwork to this theme from the Theme Board first.</p>
      <div v-else class="looks-swatch-grid">
        <button
          v-for="asset in assets"
          :key="`${asset.reference.id}@${asset.reference.version}`"
          type="button"
          :disabled="!selectedSlotId || asset.status !== 'available'"
          :title="selectedSlotId ? `Assign ${asset.name}` : 'Select a visual slot first'"
          @click="$emit('assign-asset', asset.reference)"
        >
          <img v-if="asset.previewUrl" :src="asset.previewUrl" alt="" />
          <span v-else :data-status="asset.status" aria-hidden="true" />
          <small>{{ asset.name }}</small>
        </button>
      </div>
    </section>

    <section class="looks-context__section looks-context__section--lined">
      <h2 class="builder-serif">Interaction</h2>
      <p class="looks-context__hint">Preview how this part looks when the user interacts with it. Cosmos keeps the behavior itself.</p>
      <div class="state-button-grid">
        <button
          v-for="state in states"
          :key="state.stateId"
          type="button"
          :class="{ 'state-button-grid__active': activeStateId === state.stateId }"
          :aria-pressed="activeStateId === state.stateId"
          :title="state.fallbackLabel"
          @click="$emit('select-state', state.stateId)"
        >{{ state.label }}</button>
      </div>
    </section>

    <details class="looks-context__advanced">
      <summary>Advanced</summary>
      <dl>
        <div><dt>Template</dt><dd>{{ templateId }}@{{ templateVersion }}</dd></div>
        <div v-if="selectedSlot"><dt>Part ID</dt><dd>{{ selectedSlot.slotId }}</dd></div>
        <div v-if="selectedSlot?.bindingId"><dt>Binding</dt><dd>{{ selectedSlot.bindingId }}</dd></div>
      </dl>
    </details>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ExactVersionedRef } from "../../../theme-engine";
import type { BuilderAssetPresentation } from "../themeBuilderAssetReferences";
import type { LooksSlotPresentation, LooksStatePresentation } from "../looksStudioProjection";
import BuilderIcon from "./BuilderIcon.vue";
import NeutralVisualPlaceholder from "./NeutralVisualPlaceholder.vue";

const props = defineProps<{
  templateName: string;
  templateId: string;
  templateVersion: string;
  slots: readonly Readonly<LooksSlotPresentation>[];
  assets: readonly Readonly<BuilderAssetPresentation>[];
  states: readonly Readonly<LooksStatePresentation>[];
  activeStateId: string;
  selectedSlotId: string;
}>();

defineEmits<{
  "select-slot": [slotId: string];
  "select-state": [stateId: string];
  "assign-asset": [reference: Readonly<ExactVersionedRef>];
  "clear-slot": [];
}>();

const selectedSlot = computed(() => props.slots.find((slot) => slot.slotId === props.selectedSlotId));
</script>

<style scoped>
.looks-context { min-width: 0; min-height: 0; overflow: auto; padding: 22px 16px 32px; border-right: 1px solid var(--builder-border); background: linear-gradient(180deg,rgba(13,19,24,.62),rgba(7,11,15,.36)); scrollbar-color: rgba(154,164,172,.18) transparent; }
.looks-context__section { display: grid; gap: 13px; }
.looks-context__section--lined { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--builder-border); }
.looks-context h2 { margin: 0 4px; font-size: .9rem; }
.current-template { display: grid; min-height: 78px; grid-template-columns: 78px minmax(0,1fr); align-items: center; gap: 12px; }
.current-template > :deep(.neutral-visual) { width: 78px; height: 72px; border: 1px solid var(--builder-border); border-radius: var(--builder-radius-control); }
.current-template > span { display: grid; min-width: 0; gap: 4px; }
.current-template strong { overflow: hidden; font-size: .86rem; font-weight: 400; text-overflow: ellipsis; white-space: nowrap; }
.current-template small, .visual-slot-list small, .looks-context__empty, .looks-context__hint { color: var(--builder-muted); font-size: .62rem; overflow-wrap: anywhere; }
.looks-context__hint { margin: -4px 0 0 4px; line-height: 1.45; }
.visual-slot-list { display: grid; overflow: hidden; border: 1px solid var(--builder-border); border-radius: var(--builder-radius-card); background:rgba(7,11,15,.22); }
.visual-slot-list button { display: grid; min-height: 50px; padding: 7px 9px; grid-template-columns: 28px minmax(0,1fr) minmax(74px,auto) 16px; align-items: center; border: 0; border-bottom: 1px solid var(--builder-border); background: rgba(13,18,23,.34); color: #c9c8c4; cursor: pointer; font-size: .66rem; text-align: left; gap: 8px; }
.visual-slot-list button:last-child { border-bottom: 0; }
.visual-slot-list button:hover { background: rgba(120,149,177,.07); }
.visual-slot-list__active { position:relative; background: linear-gradient(90deg,rgba(120,149,177,.2),rgba(120,149,177,.075)) !important; color:var(--builder-text)!important; box-shadow:inset 3px 0 rgba(159,187,211,.72); }
.visual-slot-list__swatch { width: 24px; height: 24px; border: 1px solid var(--builder-border-strong); border-radius: 50%; }
.visual-slot-list__swatch[data-tone="assigned"] { background: radial-gradient(circle at 34% 29%, #71859a, #171d22 68%); }
.visual-slot-list__swatch[data-tone="empty"] { border-style: dashed; }
.visual-slot-list__copy { display: grid; min-width: 0; gap: 2px; }
.visual-slot-list__copy strong, .visual-slot-list__value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.visual-slot-list__copy strong { font-weight: 500; }
.visual-slot-list__value { color: var(--builder-muted); text-align: right; }
.visual-slot-list :deep(.builder-icon) { width: .8rem; height: .8rem; color: var(--builder-faint); }
.looks-context__clear { min-height: 34px; border: 1px solid var(--builder-border); border-radius: var(--builder-radius-control); background: transparent; color: var(--builder-muted); }
.looks-context__inheritance{display:flex;padding:7px 9px;align-items:center;justify-content:space-between;border:1px solid var(--builder-border);border-radius:var(--builder-radius-control);background:rgba(120,149,177,.05);color:var(--builder-muted);font-size:.62rem;gap:8px}.looks-context__inheritance--custom{border-color:rgba(98,217,255,.28);background:rgba(98,217,255,.06);color:var(--builder-text)}.looks-context__inheritance button{padding:5px 8px;border:1px solid var(--builder-border);border-radius:var(--builder-radius-control);background:transparent;color:var(--builder-text);font-size:.58rem;cursor:pointer}
.looks-swatch-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 7px; }
.looks-swatch-grid button { display: grid; min-width: 0; min-height: 94px; padding: 8px 4px 7px; grid-template-rows: 1fr auto; place-items: center; border: 1px solid var(--builder-border); border-radius: var(--builder-radius-control); background: rgba(13,18,23,.34); color: var(--builder-text); cursor: pointer; gap: 5px; }
.looks-swatch-grid button:disabled { cursor: default; opacity: .45; }
.looks-swatch-grid button > span, .looks-swatch-grid img { width: 48px; height: 48px; border: 1px solid var(--builder-border-strong); border-radius: 50%; object-fit: cover; background: linear-gradient(135deg,#303940,#11171b); }
.looks-swatch-grid span[data-status="missing"] { border-style: dashed; background: transparent; }
.looks-swatch-grid small { max-width: 100%; overflow: hidden; font-size: .6rem; text-overflow: ellipsis; white-space: nowrap; }
.state-button-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 7px; }
.state-button-grid button { min-height: 34px; padding: 0 7px; border: 1px solid var(--builder-border); border-radius: var(--builder-radius-control); background: rgba(13,18,23,.34); color: var(--builder-text); cursor: pointer; font-size: .64rem; }
.state-button-grid button:hover { border-color:rgba(120,149,177,.34)!important; background:rgba(120,149,177,.06)!important; }
.state-button-grid__active { border-color:rgba(159,187,211,.58)!important; background:linear-gradient(180deg,rgba(120,149,177,.2),rgba(120,149,177,.09))!important; box-shadow:inset 0 0 0 1px rgba(159,187,211,.08),0 5px 14px rgba(0,0,0,.1); }
.looks-context__advanced{margin-top:16px;padding-top:12px;border-top:1px solid var(--builder-border);color:var(--builder-muted);font-size:.62rem}.looks-context__advanced summary{cursor:pointer;color:var(--builder-faint);letter-spacing:.04em}.looks-context__advanced dl{display:grid;margin:10px 0 0;gap:7px}.looks-context__advanced dl div{display:grid;grid-template-columns:58px minmax(0,1fr);gap:8px}.looks-context__advanced dt{color:var(--builder-faint)}.looks-context__advanced dd{margin:0;overflow-wrap:anywhere;color:var(--builder-muted)}
</style>
