<template>
  <section class="looks-studio-canvas" aria-label="Looks canvas" data-testid="looks-studio-canvas">
    <header class="looks-studio-canvas__toolbar">
      <div class="looks-studio-canvas__toolbar-group">
        <BuilderSegmentedControl label="Preview source" :options="previewModes" :active-option="previewMode" @change="selectPreviewMode" />
        <BuilderSegmentedControl
          label="Visual state"
          :options="states.map((state) => state.label)"
          :active-option="activeState?.label ?? ''"
          @change="selectStateByLabel"
        />
      </div>
      <div class="looks-studio-canvas__zoom" aria-label="Canvas zoom">
        <button type="button">Fit</button><span>100%</span>
      </div>
    </header>
    <div class="looks-studio-canvas__stage">
      <NeutralVisualPlaceholder :label="templateName" variant="canvas" :show-label="true" />
      <div v-if="previewKind === 'map'" class="looks-studio-canvas__map" :style="objectStyle" aria-hidden="true">
        <span class="looks-studio-canvas__nebula" />
        <span v-for="index in 9" :key="index" class="looks-studio-canvas__star" :style="starStyle(index)" />
        <span class="looks-studio-canvas__map-line looks-studio-canvas__map-line--a" />
        <span class="looks-studio-canvas__map-line looks-studio-canvas__map-line--b" />
        <span class="looks-studio-canvas__map-node looks-studio-canvas__map-node--root" />
        <span class="looks-studio-canvas__map-node looks-studio-canvas__map-node--a" />
        <span class="looks-studio-canvas__map-node looks-studio-canvas__map-node--b" />
      </div>
      <div v-else-if="previewKind === 'connection'" class="looks-studio-canvas__connection" :style="objectStyle" aria-hidden="true">
        <span class="looks-studio-canvas__connection-node" />
        <span class="looks-studio-canvas__connection-beam" />
        <span class="looks-studio-canvas__connection-node" />
      </div>
      <div v-else-if="previewKind === 'base'" class="looks-studio-canvas__base-room" :style="objectStyle" aria-hidden="true">
        <span class="looks-studio-canvas__base-ceiling" />
        <span class="looks-studio-canvas__base-wall looks-studio-canvas__base-wall--left" />
        <span class="looks-studio-canvas__base-wall looks-studio-canvas__base-wall--right" />
        <span class="looks-studio-canvas__cockpit"><i /><i /><i /></span>
        <span class="looks-studio-canvas__base-door looks-studio-canvas__base-door--left" />
        <span class="looks-studio-canvas__base-door looks-studio-canvas__base-door--right" />
        <span class="looks-studio-canvas__workspace looks-studio-canvas__workspace--left" />
        <span class="looks-studio-canvas__workspace looks-studio-canvas__workspace--right" />
        <span class="looks-studio-canvas__companion" />
        <span class="looks-studio-canvas__base-floor" />
      </div>
      <div v-else-if="previewKind === 'workspace'" class="looks-studio-canvas__workspace-environment" :style="objectStyle" aria-hidden="true">
        <span class="looks-studio-canvas__workspace-grid" />
        <span class="looks-studio-canvas__tool-area"><i /><i /><i /></span>
        <span class="looks-studio-canvas__workspace-window looks-studio-canvas__workspace-window--primary" />
        <span class="looks-studio-canvas__workspace-window looks-studio-canvas__workspace-window--secondary" />
      </div>
      <div v-else-if="previewKind === 'window'" class="looks-studio-canvas__window-frame" :style="objectStyle" aria-hidden="true">
        <span class="looks-studio-canvas__window-header"><i /><i /><i /></span>
        <span class="looks-studio-canvas__window-content"><i /><i /><i /></span>
        <span class="looks-studio-canvas__window-resize" />
      </div>
      <div v-else class="looks-studio-canvas__podium" aria-hidden="true" />
      <div
        v-if="previewKind === 'node' || previewKind === 'generic'"
        class="looks-studio-canvas__object"
        :class="{ 'looks-studio-canvas__object--node': previewKind === 'node' }"
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
import { computed, ref } from "vue";
import type { LooksSlotPresentation, LooksStatePresentation } from "../looksStudioProjection";
import BuilderSegmentedControl from "./BuilderSegmentedControl.vue";
import NeutralVisualPlaceholder from "./NeutralVisualPlaceholder.vue";

const props = defineProps<{
  templateName: string;
  templateId: string;
  slots: readonly Readonly<LooksSlotPresentation>[];
  states: readonly Readonly<LooksStatePresentation>[];
  activeStateId: string;
  selectedSlotId: string;
  materialFill: string;
  materialStroke: string;
  materialOpacity: number;
  materialTextureUrl: string;
  coreFill: string;
  coreStroke: string;
  coreOpacity: number;
}>();
const emit = defineEmits<{ "select-state": [stateId: string]; "select-slot": [slotId: string] }>();
const previewModes = ["Clear", "Cosmos Core", "Your Theme"] as const;
const previewMode = ref<(typeof previewModes)[number]>("Your Theme");
const activeState = computed(() => props.states.find((state) => state.stateId === props.activeStateId));
const previewKind = computed<"map" | "node" | "connection" | "base" | "workspace" | "window" | "generic">(() => {
  if (props.templateId.includes("cosmos.map.")) return "map";
  if (props.templateId.includes("connection")) return "connection";
  if (props.templateId.includes("node")) return "node";
  if (props.templateId.includes("base.main-room")) return "base";
  if (props.templateId.includes("workspace")) return "workspace";
  if (props.templateId.includes("window")) return "window";
  return "generic";
});
const visibleAssetSlots = computed(() => {
  const available = props.slots.filter((slot) => slot.previewUrl && slot.assetStatus === "available");
  const selected = available.find((slot) => slot.slotId === props.selectedSlotId);
  return selected ? [selected] : available.slice(0, 1);
});
const objectStyle = computed(() => {
  if (previewMode.value === "Clear") return { "--looks-fill": "#20262d", "--looks-stroke": "#8b98a6", "--looks-opacity": "1" };
  if (previewMode.value === "Cosmos Core") return { "--looks-fill": props.coreFill, "--looks-stroke": props.coreStroke, "--looks-opacity": String(props.coreOpacity) };
  return {
    "--looks-fill": props.materialFill,
    "--looks-stroke": props.materialStroke,
    "--looks-opacity": String(props.materialOpacity),
  };
});
function starStyle(index: number): Record<string, string> {
  const positions = [[13,20],[28,68],[39,30],[51,77],[62,18],[71,55],[82,27],[88,73],[19,45]];
  const [left, top] = positions[index - 1] ?? [50, 50];
  return { left: `${left}%`, top: `${top}%` };
}
function selectPreviewMode(mode: string): void {
  if (previewModes.includes(mode as (typeof previewModes)[number])) previewMode.value = mode as (typeof previewModes)[number];
}
function selectStateByLabel(label: string): void {
  const state = props.states.find((candidate) => candidate.label === label);
  if (state) emit("select-state", state.stateId);
}
</script>

<style scoped>
.looks-studio-canvas { display:grid; min-width:0; min-height:0; padding:12px 16px 14px; grid-template-rows:50px minmax(0,1fr); background:radial-gradient(circle at 50% 18%,rgba(120,149,177,.045),transparent 32%),rgba(5,9,12,.24); }
.looks-studio-canvas__toolbar { display:flex; min-width:0; padding:0 4px; align-items:center; justify-content:space-between; gap:20px; }
.looks-studio-canvas__toolbar-group{display:flex;min-width:0;align-items:center;gap:10px}.looks-studio-canvas__toolbar-group > :deep(.builder-segmented-control){grid-auto-columns:minmax(74px,1fr)}
.looks-studio-canvas__zoom { display:flex; align-items:center; color:var(--builder-muted); font-size:.7rem; gap:8px; }
.looks-studio-canvas__zoom button { min-width:42px; height:32px; border:1px solid transparent; border-radius:var(--builder-radius-control); background:transparent; color:var(--builder-text); }
@media(max-width:760px){.looks-studio-canvas{padding-inline:10px;grid-template-rows:auto minmax(0,1fr)}.looks-studio-canvas__toolbar{min-height:50px;flex-wrap:wrap;padding-block:6px;gap:6px 12px}.looks-studio-canvas__toolbar-group{flex:1 1 100%;overflow-x:auto;padding-bottom:2px}.looks-studio-canvas__toolbar-group>:deep(.builder-segmented-control){grid-auto-columns:minmax(64px,1fr)}.looks-studio-canvas__zoom{margin-left:auto}}
.looks-studio-canvas__stage { position:relative; min-width:0; min-height:0; overflow:hidden; border:1px solid rgba(154,174,191,.15); border-radius:var(--builder-radius-panel); background:rgba(13,18,23,.52); box-shadow:var(--builder-shadow-card),inset 0 1px rgba(255,255,255,.02); }
.looks-studio-canvas__stage > :deep(.neutral-visual) { position:absolute; inset:4px; background:radial-gradient(ellipse at 50% 66%,rgba(120,149,177,.065),transparent 38%),linear-gradient(180deg,#181b1e,#101417 58%,#0c1013 59%); }
.looks-studio-canvas__stage :deep(.neutral-visual__arch),.looks-studio-canvas__stage :deep(.neutral-visual__horizon),.looks-studio-canvas__stage :deep(.neutral-visual__floor){display:none}
.looks-studio-canvas__podium { position:absolute; bottom:8%; left:50%; width:min(48%,440px); height:7%; border:1px solid rgba(212,220,225,.1); border-radius:50%; background:linear-gradient(180deg,#23292d,#0c1013); box-shadow:0 22px 40px rgba(0,0,0,.3); transform:translateX(-50%); }
.looks-studio-canvas__object { position:absolute; inset:20% 34% 16%; overflow:hidden; border:2px solid var(--looks-stroke,#8b929c); border-radius:48% 48% 16% 16%; background:var(--looks-fill,#30343a); box-shadow:0 30px 70px rgba(0,0,0,.38); opacity:var(--looks-opacity,1); transition:border-color .14s ease,background .14s ease,opacity .14s ease; }
.looks-studio-canvas__object--node{inset:29% 38% 25%;border-radius:50%;box-shadow:0 0 26px color-mix(in srgb,var(--looks-stroke,#8b929c) 34%,transparent),0 28px 60px rgba(0,0,0,.38)}.looks-studio-canvas__object--node .looks-studio-canvas__core{inset:24%;border-radius:50%}.looks-studio-canvas__object--node .looks-studio-canvas__base{display:none}.looks-studio-canvas__object--node .looks-studio-canvas__orbit{inset:9%;}.looks-studio-canvas__map{position:absolute;inset:12% 8%;overflow:hidden;border:1px solid var(--builder-border);border-radius:14px;background:radial-gradient(circle at 60% 42%,color-mix(in srgb,var(--looks-stroke,#62d9ff) 16%,transparent),transparent 26%),linear-gradient(145deg,#030711,#07162d 58%,#100a1b);opacity:var(--looks-opacity,1)}.looks-studio-canvas__nebula{position:absolute;inset:15% 12%;background:radial-gradient(ellipse at center,rgba(112,72,168,.16),transparent 58%);filter:blur(10px)}.looks-studio-canvas__star{position:absolute;width:3px;height:3px;border-radius:50%;background:#d8f4ff;box-shadow:0 0 8px #62d9ff}.looks-studio-canvas__map-node,.looks-studio-canvas__connection-node{position:absolute;width:22px;height:22px;border:2px solid var(--looks-stroke,#62d9ff);border-radius:50%;background:var(--looks-fill,#081426);box-shadow:0 0 18px color-mix(in srgb,var(--looks-stroke,#62d9ff) 55%,transparent)}.looks-studio-canvas__map-node--root{left:48%;top:43%;width:34px;height:34px}.looks-studio-canvas__map-node--a{left:25%;top:27%}.looks-studio-canvas__map-node--b{right:23%;bottom:25%}.looks-studio-canvas__map-line{position:absolute;height:2px;background:linear-gradient(90deg,transparent,var(--looks-stroke,#62d9ff),transparent);box-shadow:0 0 9px var(--looks-stroke,#62d9ff);transform-origin:left center}.looks-studio-canvas__map-line--a{left:28%;top:33%;width:25%;transform:rotate(24deg)}.looks-studio-canvas__map-line--b{left:52%;top:49%;width:27%;transform:rotate(27deg)}.looks-studio-canvas__connection{position:absolute;inset:36% 18%;display:flex;align-items:center}.looks-studio-canvas__connection-node{position:relative;flex:0 0 30px;width:30px;height:30px}.looks-studio-canvas__connection-beam{height:3px;flex:1;background:linear-gradient(90deg,var(--looks-stroke,#68cfff),#a67cff,var(--looks-stroke,#68cfff));box-shadow:0 0 12px var(--looks-stroke,#68cfff);opacity:var(--looks-opacity,1)}
.looks-studio-canvas__base-room{position:absolute;inset:9% 7% 8%;overflow:hidden;border:2px solid var(--looks-stroke,#6e8997);border-radius:12px;background:linear-gradient(180deg,color-mix(in srgb,var(--looks-fill,#0c1218) 78%,#26323a),var(--looks-fill,#0c1218) 64%);box-shadow:0 28px 70px rgba(0,0,0,.38);opacity:var(--looks-opacity,1)}.looks-studio-canvas__base-ceiling{position:absolute;inset:0 20% auto;height:15%;background:#0c1319;clip-path:polygon(10% 0,90% 0,100% 100%,0 100%)}.looks-studio-canvas__base-wall{position:absolute;top:14%;bottom:18%;width:21%;background:color-mix(in srgb,var(--looks-fill,#0c1218) 82%,#26343c)}.looks-studio-canvas__base-wall--left{left:0;clip-path:polygon(0 3%,100% 0,100% 100%,0 90%)}.looks-studio-canvas__base-wall--right{right:0;clip-path:polygon(0 0,100% 3%,100% 90%,0 100%)}.looks-studio-canvas__cockpit{position:absolute;top:11%;left:38%;width:24%;height:38%;border:3px solid var(--looks-stroke,#6e8997);background:radial-gradient(circle at 60% 45%,rgba(63,128,164,.45),transparent 28%),linear-gradient(150deg,#050811,#10243a);box-shadow:0 0 28px color-mix(in srgb,var(--looks-stroke,#6e8997) 15%,transparent)}.looks-studio-canvas__cockpit i{position:absolute;width:3px;height:3px;border-radius:50%;background:#d9f5ff;box-shadow:0 0 7px #8adfff}.looks-studio-canvas__cockpit i:nth-child(1){left:20%;top:25%}.looks-studio-canvas__cockpit i:nth-child(2){left:68%;top:18%}.looks-studio-canvas__cockpit i:nth-child(3){left:78%;top:62%}.looks-studio-canvas__base-door{position:absolute;top:31%;width:14%;height:47%;border:2px solid color-mix(in srgb,var(--looks-stroke,#6e8997) 72%,transparent);background:#121b22}.looks-studio-canvas__base-door--left{left:5%}.looks-studio-canvas__base-door--right{right:5%}.looks-studio-canvas__workspace{position:absolute;top:54%;width:19%;height:24%;border:2px solid color-mix(in srgb,var(--looks-stroke,#6e8997) 60%,transparent);background:#172229;box-shadow:inset 0 0 18px rgba(98,185,208,.08)}.looks-studio-canvas__workspace::after{content:"";position:absolute;inset:13% 9% 34%;border:1px solid var(--looks-stroke,#6e8997);background:#091720}.looks-studio-canvas__workspace--left{left:25%}.looks-studio-canvas__workspace--right{right:25%}.looks-studio-canvas__companion{position:absolute;left:50%;bottom:17%;width:7%;aspect-ratio:1;border:2px solid var(--looks-stroke,#7bc7d6);border-radius:50%;background:color-mix(in srgb,var(--looks-fill,#1b2930) 70%,#40535d);box-shadow:0 0 20px color-mix(in srgb,var(--looks-stroke,#7bc7d6) 28%,transparent);transform:translateX(-50%)}.looks-studio-canvas__base-floor{position:absolute;z-index:-1;right:5%;bottom:0;left:5%;height:28%;background:linear-gradient(180deg,#252a2c,#101619);clip-path:polygon(12% 0,88% 0,100% 100%,0 100%)}
.looks-studio-canvas__workspace-environment{position:absolute;inset:10% 8%;overflow:hidden;border:2px solid var(--looks-stroke,#557384);border-radius:12px;background:var(--looks-fill,#091117);box-shadow:0 28px 70px rgba(0,0,0,.38);opacity:var(--looks-opacity,1)}.looks-studio-canvas__workspace-grid{position:absolute;inset:0;background:linear-gradient(rgba(120,170,190,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(120,170,190,.055) 1px,transparent 1px);background-size:32px 32px}.looks-studio-canvas__tool-area{position:absolute;top:0;right:0;bottom:0;width:13%;border-left:1px solid color-mix(in srgb,var(--looks-stroke,#557384) 55%,transparent);background:color-mix(in srgb,var(--looks-fill,#091117) 72%,#263844)}.looks-studio-canvas__tool-area i{display:block;width:42%;aspect-ratio:1;margin:22px auto;border:1px solid var(--looks-stroke,#557384);border-radius:6px;background:rgba(255,255,255,.035)}.looks-studio-canvas__workspace-window{position:absolute;border:1px solid color-mix(in srgb,var(--looks-stroke,#557384) 68%,transparent);border-radius:7px;background:color-mix(in srgb,var(--looks-fill,#091117) 78%,#26323a);box-shadow:0 16px 32px rgba(0,0,0,.25)}.looks-studio-canvas__workspace-window::before{content:"";display:block;height:18%;border-bottom:1px solid color-mix(in srgb,var(--looks-stroke,#557384) 48%,transparent);background:rgba(255,255,255,.025)}.looks-studio-canvas__workspace-window--primary{inset:17% 36% 24% 10%}.looks-studio-canvas__workspace-window--secondary{inset:39% 18% 12% 54%}.looks-studio-canvas__window-frame{position:absolute;inset:20% 22%;overflow:hidden;border:2px solid var(--looks-stroke,#668797);border-radius:10px;background:var(--looks-fill,#101820);box-shadow:0 28px 65px rgba(0,0,0,.42);opacity:var(--looks-opacity,1)}.looks-studio-canvas__window-header{position:absolute;inset:0 0 auto;height:16%;border-bottom:1px solid color-mix(in srgb,var(--looks-stroke,#668797) 62%,transparent);background:color-mix(in srgb,var(--looks-fill,#101820) 70%,#31424c)}.looks-studio-canvas__window-header i{position:relative;display:inline-block;width:8px;height:8px;margin:14px 0 0 10px;border:1px solid var(--looks-stroke,#668797);border-radius:50%;opacity:.8}.looks-studio-canvas__window-content{position:absolute;inset:22% 7% 9%;display:grid;align-content:start;gap:10px}.looks-studio-canvas__window-content i{display:block;height:10px;border-radius:3px;background:color-mix(in srgb,var(--looks-stroke,#668797) 24%,transparent)}.looks-studio-canvas__window-content i:nth-child(2){width:72%}.looks-studio-canvas__window-content i:nth-child(3){width:86%}.looks-studio-canvas__window-resize{position:absolute;right:5px;bottom:5px;width:12px;height:12px;border-right:2px solid var(--looks-stroke,#668797);border-bottom:2px solid var(--looks-stroke,#668797);opacity:.65}
.looks-studio-canvas__texture,.looks-studio-canvas__slot-art { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:.48; }
.looks-studio-canvas__texture { opacity:.28; mix-blend-mode:soft-light; }
.looks-studio-canvas__slot-art { opacity:.34; mix-blend-mode:screen; }
.looks-studio-canvas__slot-art--selected { opacity:.66; filter:saturate(1.08) brightness(1.08); }
.looks-studio-canvas__core { position:absolute; inset:13% 39% 10%; border:1px solid color-mix(in srgb,var(--looks-stroke,#8b929c) 72%,transparent); border-radius:40px 40px 9px 9px; background:color-mix(in srgb,var(--looks-fill,#30343a) 70%,#b9c2c8); box-shadow:0 0 40px rgba(209,205,194,.08); }
.looks-studio-canvas__base { position:absolute; right:17%; bottom:3%; left:17%; height:10%; border:1px solid rgba(212,220,225,.17); border-radius:50%; background:#191e22; }
.looks-studio-canvas__orbit { position:absolute; inset:9% 9% 14%; border:2px solid color-mix(in srgb,var(--looks-stroke,#8b929c) 58%,transparent); border-radius:50%; }
.looks-studio-canvas__orbit--rear { transform:rotate(-18deg) scaleX(.54); }.looks-studio-canvas__orbit--front { inset:22% -12% 26%; transform:rotate(18deg) scaleY(.54); }
.slot-callouts { position:absolute; inset:16px; display:grid; width:min(230px,28%); max-height:calc(100% - 32px); overflow:auto; align-content:start; gap:7px; }
.slot-callouts button { display:grid; padding:8px 10px; border:1px solid var(--builder-border-strong); border-radius:var(--builder-radius-control); background:rgba(12,16,20,.88); color:var(--builder-text); text-align:left; gap:3px; transition:border-color var(--builder-control-transition),background var(--builder-control-transition),box-shadow var(--builder-control-transition),transform var(--builder-control-transition); }
.slot-callouts button:hover{border-color:rgba(120,149,177,.38);background:rgba(18,25,31,.94);transform:translateX(1px)}
.slot-callouts strong { font-family:"Iowan Old Style","Palatino Linotype",Georgia,serif; font-size:.72rem; font-weight:400; }.slot-callouts span{overflow:hidden;color:var(--builder-muted);font-size:.62rem;text-overflow:ellipsis;white-space:nowrap}.slot-callout--selected{border-color:rgba(159,187,211,.68)!important;background:linear-gradient(90deg,rgba(120,149,177,.22),rgba(15,21,27,.94))!important;box-shadow:inset 3px 0 rgba(178,201,221,.76),0 8px 22px rgba(0,0,0,.16);transform:translateX(2px)}
@media (prefers-reduced-motion: reduce){.looks-studio-canvas__object{transition:none}}
</style>
