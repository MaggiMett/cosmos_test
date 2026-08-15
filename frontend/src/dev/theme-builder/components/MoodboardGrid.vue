<template>
  <section class="moodboard" aria-labelledby="moodboard-title" data-testid="moodboard-grid">
    <h2 id="moodboard-title" class="builder-serif">Moodboard</h2>
    <p v-if="items.length === 0" class="moodboard__empty">Not part of this Builder Project contract.</p>
    <div class="moodboard__grid">
      <article
        v-for="(item, index) in items"
        :key="item.label"
        class="moodboard__card"
        :class="`moodboard__card--${index + 1}`"
      >
        <div class="moodboard__placeholder" :data-tone="item.tone" aria-hidden="true">
          <span />
        </div>
        <span>{{ item.label }}</span>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
export interface MoodboardItem {
  label: string;
  tone: "space" | "structure" | "material" | "atmosphere";
}

defineProps<{ items: readonly MoodboardItem[] }>();
</script>

<style scoped>
.moodboard {
  display: grid;
  gap: 14px;
}

.moodboard h2 {
  margin: 0;
  font-size: 1.06rem;
}

.moodboard__empty {
  min-height: 112px;
  margin: 0;
  padding: 30px;
  border: 1px dashed rgba(154,174,191,.18);
  border-radius: var(--builder-radius-card);
  background: linear-gradient(135deg, rgba(120,149,177,.025), rgba(255,255,255,.008));
  color: var(--builder-faint);
  font-size: 0.74rem;
}

.moodboard__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.moodboard__card {
  position: relative;
  min-height: 164px;
  overflow: hidden;
  border: 1px solid rgba(154,174,191,.14);
  border-radius: var(--builder-radius-card);
  background: var(--builder-surface);
}

.moodboard__placeholder {
  position: absolute;
  inset: 0;
  background: #12171c;
}

.moodboard__placeholder[data-tone="space"] {
  background: radial-gradient(circle at 34% 44%, #39434e 0 2px, transparent 3px), #0d1218;
  background-size: 34px 31px;
}

.moodboard__placeholder[data-tone="structure"] {
  background: repeating-linear-gradient(115deg, #10151a 0 22px, #181d22 23px 24px, #0f1419 25px 43px);
}

.moodboard__placeholder[data-tone="material"] {
  background: linear-gradient(112deg, #11161b, #303a43 52%, #11161b 54%, #222b33);
}

.moodboard__placeholder[data-tone="atmosphere"] {
  background: radial-gradient(circle at 72% 40%, rgba(156, 126, 91, 0.28), transparent 35%), #161513;
}

.moodboard__placeholder > span {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 48%, rgba(5, 8, 10, 0.72));
}

.moodboard__card > span {
  position: absolute;
  bottom: 12px;
  left: 14px;
  color: var(--builder-text);
  font-size: 0.76rem;
}

@media (max-width: 1180px) {
  .moodboard__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
