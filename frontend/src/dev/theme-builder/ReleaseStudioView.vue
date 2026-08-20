<template>
  <ThemeBuilderShell
    class="release-shell" active-studio="release" studio-label="Release"
    :builder-project-id="projectId" :interactive="phase==='success'"
    :dirty="snapshot?.dirty" :saving="snapshot?.saving" :save-conflict="Boolean(snapshot?.saveConflict)" :save-error="snapshot?.saveError?.message" :can-save="Boolean(snapshot?.dirty)"
    :can-undo="snapshot?.canUndo" :can-redo="snapshot?.canRedo" @save="save" @reload="controller.reload" @undo="undo" @redo="redo"
  >
    <section v-if="phase!=='success'" class="release-state"><h1 class="builder-serif">{{ phase==='loading'?'Loading release data…':phase==='error'?'Release unavailable':'No Builder Project selected' }}</h1><p>{{ phase==='error'?loadError:'Open a Theme Builder Project first.' }}</p><RouterLink v-if="phase!=='loading'" :to="{name:'theme-builder'}">Back to Theme Board</RouterLink></section>
    <div v-else-if="snapshot" class="release-studio" data-testid="release-studio-view">
      <ReleasePackHero :name="snapshot.project.name" :description="snapshot.project.description" :version="snapshot.project.packageVersion" :pack-type="snapshot.project.packageType" :revision="snapshot.project.revision" :ready="validation.ready" :dirty="snapshot.dirty" />
      <section class="release-studio__section" aria-labelledby="included-content-title"><h2 id="included-content-title" class="builder-serif">Included Content</h2><ReleaseContentGrid :items="contentItems" /></section>
      <section class="release-studio__section" aria-labelledby="validation-title"><h2 id="validation-title" class="builder-serif">Validation</h2><ReleaseValidationGrid :items="validationItems" @open="openValidationTarget" /></section>
      <section class="release-studio__section" aria-labelledby="release-notes-title"><h2 id="release-notes-title" class="builder-serif">Release</h2><ReleaseNotesPanel :description="snapshot.project.description" :ready="validation.ready" :dirty="snapshot.dirty" :saving="snapshot.saving" :exporting="exporting" :catalog-loaded="catalogLoaded" @save="save" @export="exportPackage" /></section><div v-if="exportError || exportSuccess" class="release-export-status" :class="{'release-export-status--success':exportSuccess}" :role="exportError?'alert':'status'"><strong>{{ exportError ? 'Export failed' : 'Theme Pack exported' }}</strong><span>{{ exportError || exportSuccess }}</span><button v-if="exportError" type="button" :disabled="exporting" @click="exportPackage">Try again</button></div>
    </div>
  </ThemeBuilderShell>
</template>
<script setup lang="ts">
import "./themeBuilder.css";
import { computed, shallowRef, watch } from "vue";
import { useRouter } from "vue-router";
import { assetCatalogApi, type PersistedAssetCatalogRecord } from "../../runtime/assetCatalogApi";
import { themeBuilderProjectApi } from "../../runtime/themeBuilderProjectApi";
import ReleaseContentGrid,{type ReleaseContentItem} from "./components/ReleaseContentGrid.vue";
import ReleaseNotesPanel from "./components/ReleaseNotesPanel.vue";
import ReleasePackHero from "./components/ReleasePackHero.vue";
import ReleaseValidationGrid,{type ReleaseValidationItem} from "./components/ReleaseValidationGrid.vue";
import ThemeBuilderShell from "./components/ThemeBuilderShell.vue";
import { useThemeBuilderSession } from "./useThemeBuilderSession";
import { validateThemeBuilderV1 } from "./themeBuilderV1Validation";
const router=useRouter(); const controller=useThemeBuilderSession(); const {projectId,phase,loadError,snapshot}=controller; const catalog=shallowRef<readonly Readonly<PersistedAssetCatalogRecord>[]>([]); const catalogLoaded=shallowRef(false); const exporting=shallowRef(false); const exportError=shallowRef(""); const exportSuccess=shallowRef("");
watch(()=>snapshot.value?.project.builderProjectId,async(id)=>{catalogLoaded.value=false;if(!id)return;const result=await assetCatalogApi.list();if(result.ok){catalog.value=result.data;catalogLoaded.value=true}},{immediate:true});
const validation=computed(()=>snapshot.value?validateThemeBuilderV1(snapshot.value.project,catalog.value,catalogLoaded.value):Object.freeze({ready:false,findings:[],missingAssets:0,unavailableAssets:0}));
const contentItems=computed<readonly ReleaseContentItem[]>(()=>{const p=snapshot.value?.project;if(!p)return[];return[{label:"Room Shells",count:p.artifacts.roomShells.length,icon:"room"},{label:"Catalog Objects",count:p.artifacts.catalogObjects.length,icon:"object"},{label:"Looks",count:p.artifacts.skinPacks.reduce((n,pack)=>n+pack.skins.length,0),icon:"looks"},{label:"Materials",count:p.artifacts.skinPacks.reduce((n,pack)=>n+pack.skins.reduce((m,skin)=>m+skin.materials.length,0),0),icon:"material"},{label:"States",count:p.artifacts.skinPacks.reduce((n,pack)=>n+pack.skins.reduce((m,skin)=>m+skin.stateVariants.length,0),0),icon:"motion"},{label:"Assets",count:p.assetRefs.length,icon:"library"}]});
const validationItems=computed<readonly ReleaseValidationItem[]>(()=>{const groups={"must-fix":[],attention:[],recommendation:[],fallback:[]} as Record<string,string[]>;for(const finding of validation.value.findings)groups[finding.severity]?.push(finding.message);const blockers=groups["must-fix"];const blockerTarget=blockers.some(message=>message.startsWith("Theme name"))?"board":blockers.some(message=>message.includes("catalog asset")||message.includes("Unavailable asset"))?"library":"looks";return[{label:"Must Fix",description:blockers.join(" ")||"Nothing is blocking this export.",action:Boolean(blockers.length),target:blockerTarget,clear:!blockers.length},{label:"Needs Attention",description:groups.attention.join(" ")||"No additional attention required.",action:false,clear:!groups.attention.length},{label:"Recommendations",description:groups.recommendation.join(" ")||"No recommendations.",action:Boolean(groups.recommendation.length),target:"looks",clear:!groups.recommendation.length},{label:"Uses Core Fallback",description:groups.fallback.join(" ")||"No fallback findings.",action:false,clear:!groups.fallback.length}]});
function openValidationTarget(item:ReleaseValidationItem):void{if(!item.target)return;const query={builderProjectId:projectId.value||undefined};const name=item.target==="board"?"theme-builder":item.target==="library"?"theme-builder-assets":"theme-builder-looks";void router.push({name,query});}
async function exportPackage():Promise<void>{
  if(!projectId.value||!validation.value.ready||snapshot.value?.dirty||exporting.value)return;
  exporting.value=true;exportError.value="";exportSuccess.value="";
  const result=await themeBuilderProjectApi.exportPackage(projectId.value);
  exporting.value=false;
  if(!result.ok){exportError.value=result.error.message;return}
  const filename=result.data.filename??`${snapshot.value?.project.name??"cosmos-theme"}.zip`;const url=URL.createObjectURL(result.data.blob);const anchor=document.createElement("a");anchor.href=url;anchor.download=filename;anchor.style.display="none";document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),0);exportSuccess.value=`${filename} is ready in your downloads.`;
}
const save=controller.save,undo=controller.undo,redo=controller.redo;
</script>
<style scoped>
.release-shell{grid-template-columns:84px minmax(0,1fr) 0}.release-shell :deep(.builder-shell__canvas){overflow:hidden}.release-shell :deep(.builder-shell__context){display:none}.release-studio{display:grid;width:100%;height:100%;min-width:0;min-height:0;padding:24px 28px 28px;box-sizing:border-box;grid-template-rows:minmax(250px,1.45fr) minmax(170px,1fr) minmax(95px,.55fr) minmax(112px,.65fr);gap:16px;background:radial-gradient(circle at 74% 14%,rgba(120,149,177,.055),transparent 28%)}.release-studio__section{display:grid;min-width:0;min-height:0;grid-template-rows:24px minmax(0,1fr);gap:4px}.release-studio__section h2{margin:0 0 0 3px;align-self:center;color:var(--builder-text);font-size:1.04rem;font-weight:400;line-height:1}.release-state{display:grid;min-height:100%;place-content:center;gap:10px}.release-state h1,.release-state p{margin:0}.release-state p{color:var(--builder-muted)}.release-state a{width:fit-content;margin-top:4px;padding:9px 12px;border:1px solid var(--builder-border-strong);border-radius:7px;background:rgba(120,149,177,.12);color:var(--builder-text);text-decoration:none}.release-export-status{position:absolute;right:24px;bottom:18px;display:grid;max-width:min(420px,calc(100% - 48px));padding:10px 12px;border:1px solid rgba(198,155,118,.4);border-radius:7px;background:#12171b;color:#c69b76;font-size:.7rem;box-shadow:var(--builder-shadow-card);gap:3px}.release-export-status strong{color:var(--builder-text);font-size:.76rem}.release-export-status span{overflow-wrap:anywhere}.release-export-status button{width:fit-content;margin-top:5px;padding:6px 9px;border:1px solid var(--builder-border-strong);border-radius:6px;background:rgba(120,149,177,.12);color:var(--builder-text)}.release-export-status--success{border-color:rgba(120,149,177,.48);color:var(--builder-muted)}
</style>
