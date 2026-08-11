<template>
  <ThemeBuilderShell
    active-studio="object"
    studio-label="Object Studio"
    :builder-project-id="projectId"
    :interactive="phase === 'success'"
    :dirty="snapshot?.dirty"
    :saving="snapshot?.saving"
    :can-save="Boolean(snapshot?.dirty)"
    :can-undo="snapshot?.canUndo"
    :can-redo="snapshot?.canRedo"
    @save="save" @undo="undo" @redo="redo"
  >
    <section v-if="phase !== 'success'" class="artifact-state">
      <p>Object Studio</p><h1 class="builder-serif">{{ phase === 'loading' ? 'Loading Builder Draft…' : phase === 'error' ? 'Builder Draft unavailable' : 'No Builder Project selected' }}</h1><span>{{ phase === 'error' ? loadError : 'Return to Theme Board and open an explicit project.' }}</span>
    </section>
    <div v-else-if="snapshot" class="object-v1" data-testid="object-studio-view">
      <aside class="object-list">
        <header><span>Templates</span><h2 class="builder-serif">Catalog Objects</h2></header>
        <button v-for="item in objects" :key="item.catalogObjectId" type="button" :class="{active:selectedObjectId===item.catalogObjectId}" @click="selectedObjectId=item.catalogObjectId"><strong>{{ item.displayName }}</strong><small>{{ item.family }}</small></button>
        <div v-if="!objects.length" class="empty">No authored Catalog Objects yet.</div>
        <form @submit.prevent="createObject">
          <label>Start from<select v-model="sourceId"><option v-for="source in coreSources" :key="source.catalogObjectId" :value="source.catalogObjectId">{{ source.displayName }} · {{ source.family }}</option></select></label>
          <label>Name<input v-model="createName" placeholder="Orbital Console" /></label>
          <button type="submit">Create Object Draft</button>
        </form>
      </aside>
      <section class="object-canvas">
        <header><div><span>Catalog Object V1</span><h1 class="builder-serif">{{ selectedObject?.displayName ?? 'Select an Object' }}</h1></div><small v-if="selectedObject">{{ selectedObject.visualSlots.length }} slots · {{ selectedObject.states.length }} states</small></header>
        <div class="object-visual" :data-family="selectedObject?.family"><span class="object-visual__orbit"/><span class="object-visual__body"/><span class="object-visual__base"/></div>
        <p>V1 authors stable Catalog Object identity and validated scale while preserving the canonical Core placement/interaction contract.</p>
      </section>
    </div>
    <template #context>
      <section v-if="selectedObject" class="object-inspector">
        <p>Selected Object</p><h2 class="builder-serif">Form</h2>
        <label>Display name<input v-model="editName" @change="updateObject" /></label>
        <label>Default scale<input v-model.number="editScale" type="number" :min="selectedObject.scale.minimum" :max="selectedObject.scale.maximum" step="0.05" @change="updateObject" /></label>
        <dl><div><dt>ID</dt><dd>{{ selectedObject.catalogObjectId }}</dd></div><div><dt>Family</dt><dd>{{ selectedObject.family }}</dd></div><div><dt>Perspective</dt><dd>{{ selectedObject.perspectiveProfile }}</dd></div></dl>
        <button type="button" class="danger" @click="removeObject">Remove from draft</button><p v-if="commandError" role="alert">{{ commandError }}</p>
      </section>
      <section v-else class="object-inspector"><h2 class="builder-serif">Object Studio</h2><p>Create or select an Object Draft.</p></section>
    </template>
  </ThemeBuilderShell>
</template>

<script setup lang="ts">
import "./themeBuilder.css";
import { computed, ref, watch } from "vue";
import { cosmosMainRoomCatalogObjects } from "../../theme-engine";
import ThemeBuilderShell from "./components/ThemeBuilderShell.vue";
import { useThemeBuilderSession } from "./useThemeBuilderSession";

const controller=useThemeBuilderSession(); const {projectId,phase,loadError,snapshot}=controller;
const coreSources=cosmosMainRoomCatalogObjects; const sourceId=ref(coreSources[0]?.catalogObjectId??""); const createName=ref(""); const selectedObjectId=ref(""); const editName=ref(""); const editScale=ref(1); const commandError=ref("");
const objects=computed(()=>snapshot.value?.project.artifacts.catalogObjects??[]); const selectedObject=computed(()=>objects.value.find((item)=>item.catalogObjectId===selectedObjectId.value));
watch(objects,(items)=>{if(!items.some((item)=>item.catalogObjectId===selectedObjectId.value))selectedObjectId.value=items[0]?.catalogObjectId??""},{immediate:true});
watch(selectedObject,(item)=>{editName.value=item?.displayName??"";editScale.value=item?.scale.defaultX??1},{immediate:true});
function execute(command:Parameters<NonNullable<ReturnType<typeof controller.session>>["execute"]>[0]):void{try{controller.session()?.execute(command);commandError.value="";controller.sync()}catch(error){commandError.value=error instanceof Error?error.message:"The Object Draft could not be changed."}}
function createObject():void{execute({type:"create-catalog-object-draft",sourceCatalogObjectId:sourceId.value,name:createName.value});createName.value=""}
function updateObject():void{if(selectedObject.value)execute({type:"update-catalog-object-draft",catalogObjectId:selectedObject.value.catalogObjectId,displayName:editName.value,scale:editScale.value})}
function removeObject():void{if(selectedObject.value)execute({type:"remove-catalog-object-draft",catalogObjectId:selectedObject.value.catalogObjectId})}
const save=controller.save,undo=controller.undo,redo=controller.redo;
</script>

<style scoped>
.object-v1{display:grid;width:100%;height:100%;grid-template-columns:290px minmax(0,1fr)}.object-list{display:grid;padding:24px 18px;align-content:start;border-right:1px solid var(--builder-border);gap:9px}.object-list header span,.object-canvas header span,.object-inspector>p{color:var(--builder-faint);font-size:.66rem;text-transform:uppercase;letter-spacing:.1em}.object-list h2,.object-canvas h1,.object-inspector h2{margin:4px 0}.object-list>button{display:grid;padding:10px;border:1px solid var(--builder-border);border-radius:8px;background:transparent;color:var(--builder-text);text-align:left;gap:4px}.object-list>button.active{border-color:var(--builder-accent);background:rgba(120,149,177,.12)}.object-list small{color:var(--builder-faint)}.object-list form{display:grid;margin-top:12px;padding-top:14px;border-top:1px solid var(--builder-border);gap:10px}.object-list label,.object-inspector label{display:grid;color:var(--builder-muted);font-size:.7rem;gap:5px}.object-list input,.object-list select,.object-inspector input{min-height:38px;padding:0 9px;border:1px solid var(--builder-border);border-radius:6px;background:#0b1014;color:var(--builder-text)}.object-list button,.object-inspector button{min-height:38px;border:1px solid var(--builder-border);border-radius:6px;background:rgba(120,149,177,.1);color:var(--builder-text)}.empty{padding:18px 0;color:var(--builder-muted);font-size:.74rem}.object-canvas{display:grid;padding:24px;grid-template-rows:auto minmax(0,1fr) auto;gap:16px}.object-canvas header{display:flex;align-items:end;justify-content:space-between}.object-canvas small,.object-canvas p{color:var(--builder-muted)}.object-visual{position:relative;min-height:0;overflow:hidden;border:1px solid var(--builder-border);border-radius:14px;background:radial-gradient(circle at 50% 50%,rgba(120,149,177,.15),transparent 35%),#10161b}.object-visual__body{position:absolute;inset:22% 36% 16%;border:2px solid #687785;border-radius:46% 46% 16% 16%;background:#252e36}.object-visual__orbit{position:absolute;inset:28% 26% 28%;border:2px solid #7f92a3;border-radius:50%;transform:rotate(-22deg)}.object-visual__base{position:absolute;right:32%;bottom:12%;left:32%;height:7%;border:1px solid #5d6974;border-radius:50%;background:#171d22}.object-inspector{display:grid;padding:40px 24px;align-content:start;gap:13px}.object-inspector dl{display:grid;gap:8px}.object-inspector dl>div{display:grid;grid-template-columns:80px 1fr;gap:8px}.object-inspector dt{color:var(--builder-faint);font-size:.66rem}.object-inspector dd{overflow-wrap:anywhere;margin:0;color:var(--builder-muted);font-size:.68rem}.object-inspector .danger{border-color:rgba(177,100,100,.4)}.object-inspector [role=alert]{color:#c69b76}.artifact-state{display:grid;min-height:100%;padding:40px;place-content:center;gap:10px}.artifact-state h1,.artifact-state p,.artifact-state span{margin:0}.artifact-state p{color:var(--builder-faint);text-transform:uppercase}.artifact-state span{color:var(--builder-muted)}
</style>
