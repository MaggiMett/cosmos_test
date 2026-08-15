<template>
  <aside class="object-context" aria-label="Object Studio context" data-testid="object-studio-context">
    <section class="object-context__section">
      <h2 class="builder-serif">Object Templates</h2>
      <div class="object-template-list">
        <button
          v-for="template in templates"
          :key="template.name"
          type="button"
          class="object-template-card"
          :class="{ 'object-template-card--active': template.active }"
          :aria-pressed="template.active"
        >
          <NeutralVisualPlaceholder :label="template.name" />
          <span>{{ template.name }}</span>
        </button>
      </div>
    </section>

    <section class="object-context__section object-context__section--lined">
      <h2 class="builder-serif">Layer</h2>
      <div class="object-row-list">
        <button v-for="layer in layers" :key="layer.label" type="button">
          <span class="object-row-list__mark" :data-tone="layer.tone" aria-hidden="true" />
          <span>{{ layer.label }}</span>
          <BuilderIcon name="eye" />
        </button>
      </div>
    </section>

    <section class="object-context__section object-context__section--lined">
      <h2 class="builder-serif">Slots</h2>
      <div class="object-row-list object-row-list--slots">
        <button v-for="slot in slots" :key="slot.label" type="button">
          <span class="object-row-list__swatch" :data-tone="slot.tone" aria-hidden="true" />
          <span>{{ slot.label }}</span>
        </button>
      </div>
    </section>

    <section class="object-context__section object-context__section--lined">
      <h2 class="builder-serif">Variants</h2>
      <div class="variant-list">
        <button
          v-for="variant in variants"
          :key="variant.name"
          type="button"
          :class="{ 'variant-list__active': variant.active }"
          :aria-pressed="variant.active"
        >
          <span :data-tone="variant.tone" aria-hidden="true" />
          <small>{{ variant.name }}</small>
        </button>
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import BuilderIcon from "./BuilderIcon.vue";
import NeutralVisualPlaceholder from "./NeutralVisualPlaceholder.vue";

const templates = [
  { name: "Orbital Luminaire", active: true },
  { name: "Meridian Console", active: false },
  { name: "Halo Planter", active: false },
] as const;

const layers = [
  { label: "Silhouette", tone: "outline" },
  { label: "Light Core", tone: "light" },
  { label: "Base", tone: "base" },
] as const;

const slots = [
  { label: "Main Material", tone: "graphite" },
  { label: "Accent", tone: "bronze" },
  { label: "Emission", tone: "ivory" },
] as const;

const variants = [
  { name: "Obsidian", tone: "obsidian", active: true },
  { name: "Pearl", tone: "pearl", active: false },
  { name: "Amber", tone: "amber", active: false },
] as const;
</script>

<style scoped>
.object-context {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 22px 16px 32px;
  border-right: 1px solid var(--builder-border);
  background: linear-gradient(180deg, rgba(13,19,24,.62), rgba(7,11,15,.36));
  scrollbar-color: rgba(154, 164, 172, 0.18) transparent;
}

.object-context__section {
  display: grid;
  gap: 14px;
}

.object-context__section--lined {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid var(--builder-border);
}

.object-context h2 {
  margin: 0 4px;
  font-size: 0.92rem;
}

.object-template-list,
.variant-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}

.object-template-card {
  display: grid;
  min-width: 0;
  min-height: 140px;
  padding: 0;
  overflow: hidden;
  grid-template-rows: 104px minmax(0, 1fr);
  border: 1px solid var(--builder-border);
  border-radius: var(--builder-radius-control);
  background: rgba(13, 18, 23, 0.44);
  color: inherit;
  cursor: pointer;
  transition:
    border-color var(--builder-control-transition),
    background var(--builder-control-transition);
}

.object-template-card:hover { border-color:rgba(120,149,177,.34); background:rgba(18,24,30,.62); }
.object-template-card--active { border-color:rgba(159,187,211,.58); background:linear-gradient(145deg,rgba(120,149,177,.16),rgba(18,24,30,.7)); box-shadow:inset 0 0 0 1px rgba(159,187,211,.06),0 10px 24px rgba(0,0,0,.13); }

.object-template-card > span {
  display: flex;
  min-width: 0;
  padding: 8px 7px;
  align-items: center;
  color: var(--builder-text);
  font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  font-size: 0.68rem;
  line-height: 1.25;
  text-align: left;
}

.object-template-card :deep(.neutral-visual__arch) {
  inset: 18% 29% 24%;
  border-radius: 50%;
}

.object-template-card :deep(.neutral-visual__floor) {
  right: 17%;
  left: 17%;
}

.object-row-list {
  display: grid;
  gap: 5px;
}

.object-row-list button {
  display: grid;
  min-height: 36px;
  padding: 0 9px;
  grid-template-columns: 24px minmax(0, 1fr) 18px;
  align-items: center;
  border: 1px solid var(--builder-border);
  border-radius: var(--builder-radius-control);
  background: rgba(13, 18, 23, 0.34);
  color: #c9c8c4;
  cursor: pointer;
  font-size: 0.68rem;
  text-align: left;
  gap: 8px;
}

.object-row-list button:hover {
  border-color: var(--builder-border-strong);
}

.object-row-list :deep(.builder-icon) {
  width: 0.85rem;
  height: 0.85rem;
  color: var(--builder-muted);
}

.object-row-list__mark,
.object-row-list__swatch {
  display: block;
  width: 22px;
  height: 22px;
  border: 1px solid rgba(220, 225, 228, 0.2);
  border-radius: 50%;
  background: #191f24;
}

.object-row-list__mark[data-tone="outline"] {
  border-style: dashed;
  background: transparent;
}

.object-row-list__mark[data-tone="light"] {
  background: radial-gradient(circle, #ded9ce 0 18%, #6e6e69 30%, #14191d 68%);
}

.object-row-list__mark[data-tone="base"] {
  border-radius: 50% 50% 4px 4px;
  background: #24292d;
}

.object-row-list--slots button {
  grid-template-columns: 24px minmax(0, 1fr);
}

.object-row-list__swatch[data-tone="graphite"] {
  background: linear-gradient(135deg, #090b0d, #32363a);
}

.object-row-list__swatch[data-tone="bronze"] {
  background: linear-gradient(135deg, #2a201a, #9a6e47);
}

.object-row-list__swatch[data-tone="ivory"] {
  background: linear-gradient(135deg, #77746e, #e1ddd2);
}

.variant-list button {
  display: grid;
  min-width: 0;
  min-height: 112px;
  padding: 9px 6px 8px;
  grid-template-rows: 1fr auto;
  place-items: center;
  border: 1px solid var(--builder-border);
  border-radius: var(--builder-radius-control);
  background: rgba(13, 18, 23, 0.34);
  color: var(--builder-text);
  cursor: pointer;
  gap: 7px;
}

.variant-list button:hover { border-color:rgba(120,149,177,.34)!important; background:rgba(120,149,177,.045); }
.variant-list__active { border-color:rgba(159,187,211,.58)!important; background:linear-gradient(180deg,rgba(120,149,177,.13),rgba(13,18,23,.34))!important; box-shadow:inset 0 0 0 1px rgba(159,187,211,.06),0 8px 20px rgba(0,0,0,.12); }

.variant-list button > span {
  display: block;
  width: 52px;
  height: 52px;
  border: 1px solid var(--builder-border-strong);
  border-radius: 50%;
  box-shadow: inset -10px -8px 18px rgba(0, 0, 0, 0.32);
}

.variant-list button > span[data-tone="obsidian"] {
  background: radial-gradient(circle at 34% 29%, #35393c, #0c0e10 64%);
}

.variant-list button > span[data-tone="pearl"] {
  background: radial-gradient(circle at 34% 29%, #e1ded7, #777873 66%);
}

.variant-list button > span[data-tone="amber"] {
  background: radial-gradient(circle at 34% 29%, #c48c56, #4a2b18 68%);
}

.variant-list small {
  font-size: 0.65rem;
}
</style>
