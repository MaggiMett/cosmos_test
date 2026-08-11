<template>
  <section class="looks-studio-canvas" aria-label="Looks canvas" data-testid="looks-studio-canvas">
    <header class="looks-studio-canvas__toolbar">
      <BuilderSegmentedControl
        label="Visual state"
        :options="states.map((state) => state.label)"
        :active-option="activeState?.label ?? ''"
        @change="selectStateByLabel"
      />
      <div class="looks-studio-canvas__zoom" aria-label="Canvas zoom">
        <button type="button">Fit</button><span>100%</span>
      </div>
    </header>
    <div class="looks-studio-canvas__stage">
      <NeutralVisualPlaceholder :label="templateName" variant="canvas" :show-label="true" />
      <div class="looks-studio-canvas__podium" aria-hidden="true" />
      <div
        class="looks-studio-canvas__object"
        :style="objectStyle"
        aria-hidden="true"
      >
        <img
          v-if="materialTextureUrl"
          class="looks-studio-canvas__texture"
          :src="materialTextureUrl"
          alt=""
        />
        <img
          v-for="slot in visibleAssetSlots"
          :key="`${slot.slotId}:${slot.bindingId}`"
          class="looks-studio-canvas__slot-art"
          :class="{ 'looks-studio-canvas__slot-art--selected': slot.slotId === selectedSlotId }"
          :src="slot.previewUrl!"
          alt=""
        />
        <span class="looks-studio-canvas__orbit looks-studio-canvas__orbit--rear" />
        <span class="looks-studio-canvas__core" />
        <span class="looks-studio-canvas__orbit looks-studio-canvas__orbit--front" />
        <span class="looks-studio-canvas__base" />
      </div>
      <div class="slot-callouts" aria-label="Visual slot bindings">
        <button
          v-for="slot in slots"
          :key="slot.slotId"
          type="button"
          :class="{ 'slot-callout--selected': selectedSlotId === slot.slotId }"
          @click="$emit('select-slot', slot.slotId)"
        ><strong>{{ slot.label }}</strong><span>{{ slot.statusLabel }}</span></button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { LooksSlotPresentation, LooksStatePresentation } from "../looksStudioProjection";
import BuilderSegmentedControl from "./BuilderSegmentedControl.vue";
import NeutralVisualPlaceholder from "./NeutralVisualPlaceholder.vue";

const props = defineProps<{
  templateName: string;
  slots: readonly Readonly<LooksSlotPresentation>[];
  states: readonly Readonly<LooksStatePresentation>[];
  activeStateId: string;
  selectedSlotId: string;
  materialFill: string;
  materialStroke: string;
  materialOpacity: number;
  materialTextureUrl: string;
}>();
const emit = defineEmits<{ "select-state": [stateId: string]; "select-slot": [slotId: string] }>();
const activeState = computed(() => props.states.find((state) => state.stateId === props.activeStateId));
const visibleAssetSlots = computed(() => {
  const available = props.slots.filter((slot) => slot.previewUrl && slot.assetStatus === "available");
  const selected = available.find((slot) => slot.slotId === props.selectedSlotId);
  return selected ? [selected] : available.slice(0, 1);
});
const objectStyle = computed(() => ({
  "--looks-fill": props.materialFill,
  "--looks-stroke": props.materialStroke,
  "--looks-opacity": String(props.materialOpacity),
}));
function selectStateByLabel(label: string): void {
  const state = props.states.find((candidate) => candidate.label === label);
  if (state) emit("select-state", state.stateId);
}
</script>

<style scoped>
.looks-studio-canvas { display:grid; min-width:0; min-height:0; padding:8px 12px 6px; grid-template-rows:46px minmax(0,1fr); background:rgba(5,9,12,.24); }
.looks-studio-canvas__toolbar { display:flex; min-width:0; align-items:center; justify-content:space-between; gap:20px; }
.looks-studio-canvas__toolbar > :deep(.builder-segmented-control) { grid-auto-columns:minmax(74px,1fr); }
.looks-studio-canvas__zoom { display:flex; align-items:center; color:var(--builder-muted); font-size:.7rem; gap:8px; }
.looks-studio-canvas__zoom button { min-width:42px; height:32px; border:1px solid transparent; border-radius:var(--builder-radius-control); background:transparent; color:var(--builder-text); }
.looks-studio-canvas__stage { position:relative; min-width:0; min-height:0; overflow:hidden; border:1px solid var(--builder-border); border-radius:var(--builder-radius-card); background:rgba(13,18,23,.52); }
.looks-studio-canvas__stage > :deep(.neutral-visual) { position:absolute; inset:4px; background:radial-gradient(ellipse at 50% 66%,rgba(120,149,177,.065),transparent 38%),linear-gradient(180deg,#181b1e,#101417 58%,#0c1013 59%); }
.looks-studio-canvas__stage :deep(.neutral-visual__arch),.looks-studio-canvas__stage :deep(.neutral-visual__horizon),.looks-studio-canvas__stage :deep(.neutral-visual__floor){display:none}
.looks-studio-canvas__podium { position:absolute; bottom:8%; left:50%; width:min(48%,440px); height:7%; border:1px solid rgba(212,220,225,.1); border-radius:50%; background:linear-gradient(180deg,#23292d,#0c1013); box-shadow:0 22px 40px rgba(0,0,0,.3); transform:translateX(-50%); }
.looks-studio-canvas__object { position:absolute; inset:20% 34% 16%; overflow:hidden; border:2px solid var(--looks-stroke,#8b929c); border-radius:48% 48% 16% 16%; background:var(--looks-fill,#30343a); box-shadow:0 30px 70px rgba(0,0,0,.38); opacity:var(--looks-opacity,1); transition:border-color .14s ease,background .14s ease,opacity .14s ease; }
.looks-studio-canvas__texture,.looks-studio-canvas__slot-art { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:.48; }
.looks-studio-canvas__texture { opacity:.28; mix-blend-mode:soft-light; }
.looks-studio-canvas__slot-art { opacity:.34; mix-blend-mode:screen; }
.looks-studio-canvas__slot-art--selected { opacity:.58; }
.looks-studio-canvas__core { position:absolute; inset:13% 39% 10%; border:1px solid color-mix(in srgb,var(--looks-stroke,#8b929c) 72%,transparent); border-radius:40px 40px 9px 9px; background:color-mix(in srgb,var(--looks-fill,#30343a) 70%,#b9c2c8); box-shadow:0 0 40px rgba(209,205,194,.08); }
.looks-studio-canvas__base { position:absolute; right:17%; bottom:3%; left:17%; height:10%; border:1px solid rgba(212,220,225,.17); border-radius:50%; background:#191e22; }
.looks-studio-canvas__orbit { position:absolute; inset:9% 9% 14%; border:2px solid color-mix(in srgb,var(--looks-stroke,#8b929c) 58%,transparent); border-radius:50%; }
.looks-studio-canvas__orbit--rear { transform:rotate(-18deg) scaleX(.54); }.looks-studio-canvas__orbit--front { inset:22% -12% 26%; transform:rotate(18deg) scaleY(.54); }
.slot-callouts { position:absolute; inset:16px; display:grid; width:min(230px,28%); max-height:calc(100% - 32px); overflow:auto; align-content:start; gap:7px; }
.slot-callouts button { display:grid; padding:8px 10px; border:1px solid var(--builder-border-strong); border-radius:var(--builder-radius-control); background:rgba(12,16,20,.88); color:var(--builder-text); text-align:left; gap:3px; }
.slot-callouts strong { font-family:"Iowan Old Style","Palatino Linotype",Georgia,serif; font-size:.72rem; font-weight:400; }.slot-callouts span{overflow:hidden;color:var(--builder-muted);font-size:.62rem;text-overflow:ellipsis;white-space:nowrap}.slot-callout--selected{border-color:var(--builder-accent)!important;background:var(--builder-accent-soft)!important}
@media (prefers-reduced-motion: reduce){.looks-studio-canvas__object{transition:none}}
</style>
