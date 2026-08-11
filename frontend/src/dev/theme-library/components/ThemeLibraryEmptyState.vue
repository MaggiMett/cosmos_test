<template>
  <section class="theme-library-empty" data-testid="theme-library-empty-state">
    <div class="theme-library-empty__visual" aria-hidden="true">
      <span />
      <i />
    </div>
    <p>Your personal theme collection is ready to begin.</p>
    <h2>Create your first world.</h2>
    <small>Design a new Cosmos theme or bring in an existing Theme Pack.</small>
    <div>
      <button type="button" class="theme-library-empty__primary" @click="$emit('builder')">New Theme</button>
      <button type="button" @click="$emit('import')">Import Theme Pack</button>
    </div>
  </section>
</template>

<script setup lang="ts">
defineEmits<{ import: []; builder: [] }>();
</script>

<style scoped>
.theme-library-empty {
  display: grid;
  min-width: 0;
  min-height: 0;
  place-content: center;
  justify-items: center;
  overflow: hidden;
  border: 1px solid var(--cosmos-color-border);
  border-radius: var(--cosmos-radius-window);
  background:
    radial-gradient(circle at 50% 42%, rgba(98, 200, 234, 0.08), transparent 28%),
    linear-gradient(145deg, rgba(11, 19, 30, 0.9), rgba(4, 8, 14, 0.94));
  text-align: center;
}

.theme-library-empty__visual {
  position: relative;
  width: 104px;
  height: 104px;
  margin-bottom: 18px;
  border: 1px solid rgba(98, 200, 234, 0.22);
  border-radius: 50%;
  box-shadow: inset 0 0 34px rgba(98, 200, 234, 0.07), 0 0 34px rgba(98, 200, 234, 0.08);
}

.theme-library-empty__visual span,
.theme-library-empty__visual i {
  position: absolute;
  border: 1px solid rgba(196, 224, 235, 0.28);
  border-radius: 50%;
}

.theme-library-empty__visual span {
  inset: 25px;
}

.theme-library-empty__visual i {
  top: 49px;
  left: 10px;
  width: 84px;
  height: 20px;
  transform: rotate(-18deg);
}

.theme-library-empty > p {
  margin: 0 0 6px;
  color: var(--cosmos-color-accent);
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.theme-library-empty h2 {
  margin: 0;
  color: #eadfce;
  font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  font-size: 2.35rem;
  font-weight: 400;
}

.theme-library-empty > small {
  margin-top: 8px;
  color: var(--cosmos-color-muted);
  font-size: 0.72rem;
}

.theme-library-empty > div:last-child {
  display: flex;
  margin-top: 24px;
  gap: 10px;
}

.theme-library-empty button {
  min-width: 150px;
  min-height: 42px;
  border: 1px solid var(--cosmos-color-border);
  border-radius: var(--cosmos-radius-control);
  background: rgba(255, 255, 255, 0.018);
  color: var(--cosmos-color-text);
  cursor: pointer;
  font-size: 0.72rem;
}

.theme-library-empty .theme-library-empty__primary {
  border-color: rgba(119, 190, 221, 0.66);
  background: linear-gradient(180deg, rgba(71, 128, 162, 0.27), rgba(33, 70, 95, 0.2));
  box-shadow: 0 0 20px rgba(98, 200, 234, 0.12);
}
</style>
