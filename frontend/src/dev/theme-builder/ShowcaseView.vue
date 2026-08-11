<template>
  <ThemeBuilderShell class="showcase-shell" active-studio="showcase" studio-label="Showcase" :builder-project-id="projectId">
    <section v-if="phase!=='success'" class="showcase-state"><h1 class="builder-serif">{{ phase==='loading'?'Preparing draft preview…':phase==='error'?'Preview unavailable':'No Builder Project selected' }}</h1><p>{{ phase==='error'?loadError:'Open a Theme Builder Project first.' }}</p></section>
    <section v-else-if="snapshot" class="showcase-v1" data-testid="showcase-view">
      <header class="showcase-v1__header">
        <div><span>Draft Preview · Revision {{ snapshot.project.revision }}</span><h1 class="builder-serif">{{ snapshot.project.name }}</h1><p>{{ snapshot.project.description || 'No description' }}</p></div>
        <div class="showcase-v1__stats"><span>{{ skinCount }} Looks</span><span>{{ snapshot.project.assetRefs.length }} Assets</span><span>{{ snapshot.project.artifacts.roomShells.length }} Room Shells</span><span>{{ snapshot.project.artifacts.catalogObjects.length }} Objects</span></div>
      </header>
      <div v-if="resolved" class="showcase-v1__preview">
        <LooksStudioCanvas
          :template-name="resolved.template.displayName"
          :slots="slots"
          :states="states"
          :active-state-id="activeStateId"
          :selected-slot-id="selectedSlotId"
          :material-fill="materialFill"
          :material-stroke="materialStroke"
          :material-opacity="materialOpacity"
          :material-texture-url="materialTextureUrl"
          @select-state="activeStateId=$event"
          @select-slot="selectedSlotId=$event"
        />
        <aside><span>Previewing Look</span><h2 class="builder-serif">{{ resolved.skin.displayName }}</h2><p>This is an isolated Builder Draft preview. It does not mutate ThemeRuntime or the active installed Theme.</p><RouterLink :to="{name:'theme-builder-looks',query:{builderProjectId:projectId,skinId:resolved.skin.skinId}}">Open in Looks Studio</RouterLink></aside>
      </div>
      <div v-else class="showcase-v1__empty"><h2 class="builder-serif">No Look to preview yet</h2><p>Create a Look in Looks Studio. V1 preview intentionally uses the real draft rather than fixture art.</p><RouterLink :to="{name:'theme-builder-looks',query:{builderProjectId:projectId}}">Create a Look</RouterLink></div>
    </section>
  </ThemeBuilderShell>
</template>
<script setup lang="ts">
import "./themeBuilder.css";
import { computed, ref, shallowRef, watch } from "vue";
import { assetCatalogApi, type PersistedAssetCatalogRecord } from "../../runtime/assetCatalogApi";
import { baseMainRoomTemplate, TemplateRegistry, type JsonValue } from "../../theme-engine";
import ThemeBuilderShell from "./components/ThemeBuilderShell.vue";
import LooksStudioCanvas from "./components/LooksStudioCanvas.vue";
import { useThemeBuilderSession } from "./useThemeBuilderSession";
import { projectBuilderAssets } from "./themeBuilderAssetReferences";
import { projectLooksSlots, projectLooksStates } from "./looksStudioProjection";
import { resolveSkinDraft, type ResolvedSkinDraft } from "./themeBuilderSkinDraft";
const templates=new TemplateRegistry();templates.register(baseMainRoomTemplate);
const controller=useThemeBuilderSession(templates);const{projectId,phase,loadError,snapshot}=controller;const catalog=shallowRef<readonly Readonly<PersistedAssetCatalogRecord>[]>([]);const catalogLoaded=shallowRef(false);const resolved=shallowRef<Readonly<ResolvedSkinDraft>>();const activeStateId=ref("default");const selectedSlotId=ref("");
const skinCount=computed(()=>snapshot.value?.project.artifacts.skinPacks.reduce((n,p)=>n+p.skins.length,0)??0);
const assets=computed(()=>snapshot.value?projectBuilderAssets(snapshot.value.project,catalog.value,catalogLoaded.value):[]);
const slots=computed(()=>resolved.value?projectLooksSlots(resolved.value.skin,resolved.value.template,assets.value,activeStateId.value):[]);const states=computed(()=>resolved.value?projectLooksStates(resolved.value.template):[]);
const material=computed(()=>resolved.value?.skin.materials.find((item)=>item.channelId==="core.material.dom-surface"));const materialFill=computed(()=>color(material.value?.parameters["core.material.fill"],"#30343a"));const materialStroke=computed(()=>color(material.value?.parameters["core.material.stroke"],"#8b929c"));const materialOpacity=computed(()=>typeof material.value?.parameters["core.material.opacity"]==="number"?material.value.parameters["core.material.opacity"]:1);const materialTextureId=computed(()=>typeof material.value?.parameters["core.material.texture-ref"]==="string"?material.value.parameters["core.material.texture-ref"]:"");const materialTextureUrl=computed(()=>assets.value.find((item)=>item.reference.id===materialTextureId.value&&item.status==="available")?.previewUrl??"");
watch(()=>snapshot.value?.project,async(project)=>{resolved.value=undefined;if(!project)return;const first=project.artifacts.skinPacks.flatMap((pack)=>pack.skins)[0];if(first){try{resolved.value=resolveSkinDraft(project,first.skinId,templates);activeStateId.value=resolved.value.template.states[0]?.stateId??"default";selectedSlotId.value=resolved.value.slots[0]?.slotId??""}catch{resolved.value=undefined}}const result=await assetCatalogApi.list();if(result.ok){catalog.value=result.data;catalogLoaded.value=true}},{immediate:true});
function color(value:JsonValue|undefined,fallback:string):string{return typeof value==="string"&&/^#[0-9a-f]{6}$/i.test(value)?value:fallback}
</script>
<style scoped>
.showcase-shell{grid-template-columns:72px minmax(0,1fr) 0}.showcase-shell :deep(.builder-shell__context){display:none}.showcase-v1{display:grid;width:100%;height:100%;padding:24px;box-sizing:border-box;grid-template-rows:auto minmax(0,1fr);gap:18px;background:radial-gradient(circle at 70% 30%,rgba(90,126,158,.09),transparent 35%),#080d11}.showcase-v1__header{display:flex;align-items:end;justify-content:space-between;gap:20px}.showcase-v1__header span,.showcase-v1__header p{color:var(--builder-muted);font-size:.72rem}.showcase-v1__header h1{margin:4px 0;font-size:2.2rem}.showcase-v1__header p{margin:0}.showcase-v1__stats{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}.showcase-v1__stats span{padding:6px 9px;border:1px solid var(--builder-border);border-radius:999px}.showcase-v1__preview{display:grid;min-height:0;grid-template-columns:minmax(0,1fr) 270px;overflow:hidden;border:1px solid var(--builder-border);border-radius:18px;background:rgba(9,14,18,.7)}.showcase-v1__preview>:deep(.looks-studio-canvas){min-height:0}.showcase-v1__preview aside{display:grid;padding:28px;align-content:center;border-left:1px solid var(--builder-border);gap:10px}.showcase-v1__preview aside span{color:var(--builder-faint);font-size:.65rem;text-transform:uppercase}.showcase-v1__preview aside h2,.showcase-v1__preview aside p{margin:0}.showcase-v1__preview aside p{color:var(--builder-muted);font-size:.72rem;line-height:1.5}.showcase-v1__preview a,.showcase-v1__empty a{width:fit-content;margin-top:8px;padding:9px 12px;border:1px solid var(--builder-border-strong);border-radius:7px;background:rgba(120,149,177,.12);color:var(--builder-text);text-decoration:none}.showcase-v1__empty,.showcase-state{display:grid;min-height:100%;place-content:center;justify-items:start;gap:10px}.showcase-v1__empty h2,.showcase-v1__empty p,.showcase-state h1,.showcase-state p{margin:0}.showcase-v1__empty p,.showcase-state p{max-width:520px;color:var(--builder-muted)}
</style>
