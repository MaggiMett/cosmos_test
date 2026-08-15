<template>
  <div class="room-shell-inspector" data-testid="room-shell-inspector">
    <header class="room-shell-inspector__heading">
      <h1 class="builder-serif">Celestial Atrium</h1>
      <p>Room Shell <span aria-hidden="true">·</span> Art Mode</p>
    </header>

    <BuilderAccordionSection title="Appearance" :open="true">
      <div class="appearance-controls">
        <label>
          <span>Mood</span>
          <button type="button">Cosmic dusk <span aria-hidden="true">⌄</span></button>
        </label>
        <label>
          <span>Light</span>
          <button type="button">Warm indirect <span aria-hidden="true">⌄</span></button>
        </label>
        <label>
          <span>Atmosphere</span>
          <button type="button">Soft haze <span aria-hidden="true">⌄</span></button>
        </label>
        <label class="appearance-controls__range">
          <span>Intensity</span>
          <input type="range" min="0" max="100" value="65" aria-label="Intensity" />
          <output>65%</output>
        </label>
      </div>
    </BuilderAccordionSection>

    <BuilderAccordionSection title="Layout" />
    <BuilderAccordionSection title="Surfaces" />
    <BuilderAccordionSection title="Background" />
    <BuilderAccordionSection title="Materials" />
  </div>
</template>

<script setup lang="ts">
import BuilderAccordionSection from "./BuilderAccordionSection.vue";
</script>

<style scoped>
.room-shell-inspector {
  min-height: 100%;
  padding: 28px 24px 40px;
  background: linear-gradient(180deg, rgba(16,22,27,.42), rgba(8,12,16,.18));
}

.room-shell-inspector__heading {
  display: grid;
  padding: 0 2px 20px;
  border-bottom: 1px solid var(--builder-border);
  gap: 7px;
}

.room-shell-inspector__heading h1 {
  margin: 0;
  color: var(--builder-text);
  font-size: 1.7rem;
  line-height: 1.06;
  letter-spacing: -.018em;
}

.room-shell-inspector__heading p {
  margin: 0;
  color: var(--builder-muted);
  font-size: 0.68rem;
}

.appearance-controls {
  display: grid;
  gap: 13px;
}

.appearance-controls label {
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  align-items: center;
  color: #c4c4c0;
  font-size: 0.68rem;
  gap: 8px;
}

.appearance-controls button {
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

.appearance-controls button:hover {
  border-color: var(--builder-border-strong);
}

.appearance-controls__range {
  grid-template-columns: 68px minmax(0, 1fr) 34px !important;
}

.appearance-controls__range input {
  width: 100%;
  height: 2px;
  margin: 0;
  accent-color: var(--builder-accent);
}

.appearance-controls__range output {
  color: var(--builder-muted);
  text-align: right;
}
</style>
