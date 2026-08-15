<template>
  <article class="hero-card" :tabindex="unavailable ? undefined : 0" data-testid="theme-board-hero">
    <div class="hero-card__placeholder" aria-hidden="true">
      <span />
      <i />
      <small>{{ unavailable ? "Hero unavailable" : "Hero visual" }}</small>
    </div>
    <div class="hero-card__shade" />
    <footer class="hero-card__footer">
      <div>
        <span>{{ unavailable ? "No hero presentation" : "Hero presentation" }}</span>
        <small>{{ unavailable ? "Not part of this Builder Project contract" : "Preview" }}</small>
      </div>
      <div v-if="!unavailable" class="hero-card__actions">
        <button type="button">Compare Core</button>
        <button type="button">Open Preview</button>
      </div>
    </footer>
  </article>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ unavailable?: boolean }>(), { unavailable: false });
</script>

<style scoped>
.hero-card {
  position: relative;
  min-height: 390px;
  overflow: hidden;
  border: 1px solid rgba(154, 174, 191, .16);
  border-radius: var(--builder-radius-hero);
  background: #11161b;
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.3), inset 0 1px rgba(255,255,255,.025);
}

.hero-card__placeholder {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 67% 32%, rgba(111, 143, 169, .16), transparent 24%),
    radial-gradient(circle at 25% 72%, rgba(126, 103, 77, .1), transparent 28%),
    linear-gradient(125deg, #172029 0%, #0d1319 48%, #15191b 100%);
  color: var(--builder-faint);
}

.hero-card__placeholder > span {
  position: absolute;
  inset: 13% 11% 20%;
  border: 1px solid rgba(212, 220, 225, 0.08);
  border-radius: 48% 48% 20px 20px;
  box-shadow: inset 0 -60px 100px rgba(0,0,0,.12), 0 0 80px rgba(120,149,177,.025);
}

.hero-card__placeholder > i {
  position: absolute;
  right: 17%;
  bottom: 21%;
  left: 17%;
  height: 1px;
  background: rgba(212, 220, 225, 0.07);
}

.hero-card__placeholder small {
  color: #626b72;
  font-size: 0.72rem;
  font-style: normal;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-card__shade {
  position: absolute;
  inset: 45% 0 0;
  background: linear-gradient(transparent, rgba(5, 8, 11, 0.84));
}

.hero-card__footer {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  min-height: 76px;
  padding: 20px 22px;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}

.hero-card__footer > div:first-child {
  display: grid;
  gap: 3px;
}

.hero-card__footer span {
  font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  font-size: 1rem;
}

.hero-card__footer small {
  color: var(--builder-muted);
  font-size: 0.7rem;
}

.hero-card__actions {
  display: flex;
  opacity: 0;
  transform: translateY(5px);
  transition:
    opacity var(--builder-panel-transition),
    transform var(--builder-panel-transition);
  gap: 7px;
}

.hero-card:hover .hero-card__actions,
.hero-card:focus-within .hero-card__actions {
  opacity: 1;
  transform: translateY(0);
}

.hero-card__actions button {
  min-height: 34px;
  padding: 0 11px;
  border: 1px solid var(--builder-border-strong);
  border-radius: var(--builder-radius-control);
  background: rgba(10, 14, 18, 0.82);
  color: var(--builder-text);
  cursor: pointer;
  font-size: 0.72rem;
}

@media (min-width: 1460px) and (min-height: 900px) {
  .hero-card {
    min-height: 410px;
  }
}
</style>
