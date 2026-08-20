<template>
  <section class="release-hero" data-testid="release-pack-hero">
    <div class="release-hero__cover">
      <NeutralVisualPlaceholder :label="`${name} Theme Pack`" variant="canvas" />
      <span>Theme Pack Cover</span>
    </div>
    <div class="release-hero__summary">
      <header>
        <p>{{ packType }}</p>
        <h1 class="builder-serif">{{ name }}</h1>
        <span>{{ description || "No description" }}</span>
      </header>
      <div class="release-hero__details">
        <div class="release-hero__thumbnail"><NeutralVisualPlaceholder :label="`${name} cover`" variant="thumbnail" /></div>
        <dl>
          <div><dt>Theme Name</dt><dd>{{ name }}</dd></div>
          <div><dt>Version</dt><dd>{{ version }}</dd></div>
          <div><dt>Pack Type</dt><dd>{{ packType }}</dd></div>
          <div><dt>Revision</dt><dd>{{ revision }}</dd></div>
        </dl>
        <div class="release-hero__ready" :class="{ 'release-hero__ready--blocked': !ready || dirty }">
          <span><BuilderIcon :name="ready && !dirty ? 'check' : 'spark'" /></span>
          <strong class="builder-serif">{{ ready ? (dirty ? "Save Before Export" : "Ready for Export") : "Needs Attention" }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import BuilderIcon from "./BuilderIcon.vue";
import NeutralVisualPlaceholder from "./NeutralVisualPlaceholder.vue";
defineProps<{ name:string; description:string; version:string; packType:string; revision:number; ready:boolean; dirty:boolean }>();
</script>
<style scoped>
.release-hero{display:grid;min-width:0;min-height:0;grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);gap:18px}.release-hero__cover,.release-hero__summary{min-width:0;min-height:0;overflow:hidden;border:1px solid rgba(154,174,191,.15);border-radius:var(--builder-radius-panel);background:var(--builder-surface);box-shadow:var(--builder-shadow-card),inset 0 1px rgba(255,255,255,.02)}.release-hero__cover{position:relative}.release-hero__cover>:deep(.neutral-visual){width:100%;height:100%;border-radius:0}.release-hero__cover>span{position:absolute;bottom:14px;left:16px;color:var(--builder-muted);font-size:.7rem}.release-hero__summary{display:grid;padding:clamp(18px,2vw,28px);grid-template-rows:auto minmax(0,1fr);background:radial-gradient(circle at 82% 48%,rgba(120,149,177,.08),transparent 24%),linear-gradient(145deg,var(--builder-surface-raised),var(--builder-surface));gap:16px}.release-hero__summary header{display:grid;align-content:start;gap:6px}.release-hero__summary header p,.release-hero__summary header span{margin:0;color:var(--builder-muted);font-size:.72rem}.release-hero__summary header p{color:var(--builder-accent);letter-spacing:.08em;text-transform:uppercase}.release-hero__summary h1{margin:0;font-size:clamp(1.9rem,2.5vw,2.75rem);line-height:1;letter-spacing:-.025em}.release-hero__details{display:grid;min-height:0;grid-template-columns:140px minmax(230px,1fr) minmax(150px,.8fr);align-items:center;gap:20px}.release-hero__thumbnail{height:100%;min-height:108px;overflow:hidden;border:1px solid var(--builder-border-strong);border-radius:var(--builder-radius-control)}.release-hero__thumbnail>:deep(.neutral-visual){width:100%;height:100%}.release-hero dl{display:grid;margin:0;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 22px}.release-hero dt{margin-bottom:5px;color:var(--builder-muted);font-size:.68rem}.release-hero dd{margin:0;overflow:hidden;color:var(--builder-text);font-family:"Iowan Old Style","Palatino Linotype",Georgia,serif;font-size:.9rem;text-overflow:ellipsis;white-space:nowrap}.release-hero__ready{display:grid;justify-items:center;text-align:center;gap:9px}.release-hero__ready>span{display:grid;width:74px;height:74px;place-items:center;border:1px solid rgba(120,149,177,.52);border-radius:50%;background:rgba(120,149,177,.07);color:var(--builder-text)}.release-hero__ready--blocked>span{border-color:rgba(198,155,118,.5);color:#c69b76}.release-hero__ready strong{font-size:clamp(1rem,1.45vw,1.35rem);font-weight:400;white-space:nowrap}@media(max-width:1280px){.release-hero__details{grid-template-columns:100px minmax(210px,1fr) 140px;gap:14px}.release-hero__ready>span{width:62px;height:62px}}@media(max-width:1040px){.release-hero{grid-template-columns:1fr}.release-hero__cover{min-height:220px}.release-hero__summary{min-height:260px}.release-hero__details{grid-template-columns:100px minmax(0,1fr) 120px}}@media(max-width:620px){.release-hero__details{grid-template-columns:1fr}.release-hero__thumbnail{height:120px}.release-hero__ready{grid-template-columns:auto minmax(0,1fr);justify-items:start;text-align:left}.release-hero__ready>span{width:52px;height:52px}.release-hero dl{gap:12px}}
</style>
