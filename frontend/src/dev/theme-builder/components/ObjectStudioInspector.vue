<template>
  <div class="object-studio-inspector" data-testid="object-studio-inspector">
    <header class="object-studio-inspector__heading">
      <h1 class="builder-serif">Orbital Luminaire</h1>
      <p>Object <span aria-hidden="true">·</span> Art Mode</p>
    </header>

    <BuilderAccordionSection title="Appearance" :open="true">
      <div class="object-appearance-controls">
        <label>
          <span>Finish</span>
          <button type="button">Smoked graphite <span aria-hidden="true">⌄</span></button>
        </label>
        <label>
          <span>Accent</span>
          <button type="button">Warm bronze <span aria-hidden="true">⌄</span></button>
        </label>
        <label>
          <span>Glow</span>
          <button type="button">Soft ivory <span aria-hidden="true">⌄</span></button>
        </label>
        <label class="object-appearance-controls__range">
          <span>Presence</span>
          <input type="range" min="0" max="100" value="62" aria-label="Presence" />
          <output>62%</output>
        </label>
      </div>
    </BuilderAccordionSection>

    <BuilderAccordionSection title="Form" />
    <BuilderAccordionSection title="Materials" />
    <BuilderAccordionSection title="Surface Detail" />
    <BuilderAccordionSection title="Presentation" />
  </div>
</template>

<script setup lang="ts">
import BuilderAccordionSection from "./BuilderAccordionSection.vue";
</script>

<style scoped>
.object-studio-inspector {
  min-height: 100%;
  padding: 22px 20px 36px;
}

.object-studio-inspector__heading {
  display: grid;
  padding: 0 4px 15px;
  border-bottom: 1px solid var(--builder-border);
  gap: 7px;
}

.object-studio-inspector__heading h1 {
  margin: 0;
  color: var(--builder-text);
  font-size: 1.55rem;
  line-height: 1.1;
}

.object-studio-inspector__heading p {
  margin: 0;
  color: var(--builder-muted);
  font-size: 0.68rem;
}

.object-appearance-controls {
  display: grid;
  gap: 13px;
}

.object-appearance-controls label {
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  align-items: center;
  color: #c4c4c0;
  font-size: 0.68rem;
  gap: 8px;
}

.object-appearance-controls button {
  display: flex;
  min-width: 0;
  min-height: 35px;
  padding: 0 10px;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--builder-border);
  border-radius: var(--builder-radius-control);
  background: rgba(13, 18, 23, 0.5);
  color: var(--builder-text);
  cursor: pointer;
  font-size: 0.68rem;
  text-align: left;
}

.object-appearance-controls button:hover {
  border-color: var(--builder-border-strong);
}

.object-appearance-controls__range {
  grid-template-columns: 68px minmax(0, 1fr) 34px !important;
}

.object-appearance-controls__range input {
  width: 100%;
  height: 2px;
  margin: 0;
  accent-color: var(--builder-accent);
}

.object-appearance-controls__range output {
  color: var(--builder-muted);
  text-align: right;
}
</style>
