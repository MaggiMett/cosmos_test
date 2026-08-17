<template>
  <div class="release-notes" data-testid="release-notes">
    <article class="release-notes__copy">
      <div class="release-notes__visual"><NeutralVisualPlaceholder label="Release preview" variant="thumbnail" /></div>
      <p>{{ description || "This Theme Builder Project has no description yet." }}</p>
    </article>
    <aside class="release-notes__actions" aria-label="Release actions">
      <p><BuilderIcon name="spark" /> {{ ready ? "Theme Pack v1 · Ready" : "Resolve blocking findings before export" }}</p>
      <button type="button" :disabled="!dirty" @click="$emit('save')">{{ saving ? "Saving…" : dirty ? "Save Draft" : "Saved" }}</button>
      <button
        type="button"
        class="release-notes__export"
        :disabled="!ready || dirty || exporting"
        @click="$emit('export')"
      ><BuilderIcon name="spark" />{{ exporting ? "Exporting…" : "Export Theme Pack" }}</button>
    </aside>
  </div>
</template>
<script setup lang="ts">
import BuilderIcon from "./BuilderIcon.vue";
import NeutralVisualPlaceholder from "./NeutralVisualPlaceholder.vue";
defineProps<{description:string;ready:boolean;dirty:boolean;saving:boolean;exporting:boolean}>();
defineEmits<{save:[];export:[]}>();
</script>
<style scoped>
.release-notes{display:grid;height:100%;min-height:0;grid-template-columns:minmax(0,1fr) minmax(560px,1fr);gap:12px}.release-notes__copy,.release-notes__actions{min-width:0;min-height:0;border:1px solid var(--builder-border);border-radius:var(--builder-radius-card);background:linear-gradient(145deg,var(--builder-surface-raised),var(--builder-surface))}.release-notes__copy{display:grid;padding:10px 12px;grid-template-columns:146px minmax(0,1fr);align-items:center;gap:14px}.release-notes__visual{height:100%;min-height:68px;overflow:hidden;border:1px solid var(--builder-border);border-radius:var(--builder-radius-control)}.release-notes__visual>:deep(.neutral-visual){width:100%;height:100%}.release-notes__copy>p{margin:0;color:#c8c4bc;font-family:"Iowan Old Style","Palatino Linotype",Georgia,serif;font-size:.8rem;line-height:1.4}.release-notes__actions{display:grid;padding:14px 18px;grid-template-columns:minmax(220px,1fr) 128px 244px;align-items:center;gap:12px}.release-notes__actions p{display:flex;margin:0;align-items:center;color:var(--builder-muted);font-size:.7rem;gap:9px;white-space:nowrap}.release-notes__actions button,.release-notes__export{display:flex;min-height:48px;padding:0 16px;align-items:center;justify-content:center;border:1px solid var(--builder-border-strong);border-radius:var(--builder-radius-control);background:rgba(255,255,255,.018);color:var(--builder-text);cursor:pointer;font-family:"Iowan Old Style","Palatino Linotype",Georgia,serif;font-size:.86rem;text-decoration:none}.release-notes__actions button:disabled{cursor:default;opacity:.42}.release-notes__export{gap:11px;border-color:rgba(143,178,211,.7);background:linear-gradient(180deg,rgba(82,119,154,.3),rgba(43,71,98,.18));box-shadow:0 0 22px rgba(80,121,157,.18);font-size:1rem}@media(max-width:1280px){.release-notes{grid-template-columns:minmax(0,.95fr) minmax(520px,1.05fr)}.release-notes__actions{grid-template-columns:1fr 112px 210px;padding-inline:12px}.release-notes__actions p{font-size:.64rem}}@media(max-width:1040px){.release-notes{height:auto;grid-template-columns:1fr}.release-notes__copy{min-height:104px}.release-notes__actions{grid-template-columns:minmax(0,1fr) 120px 220px}}@media(max-width:720px){.release-notes__copy{grid-template-columns:96px minmax(0,1fr)}.release-notes__actions{grid-template-columns:1fr 1fr}.release-notes__actions p{grid-column:1/-1;white-space:normal}.release-notes__export{min-width:0}}
</style>
