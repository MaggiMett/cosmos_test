<template>
  <aside class="room-shell-context" aria-label="Room Shell context" data-testid="room-shell-context">
    <section class="room-shell-context__section">
      <h2 class="builder-serif">Room Shells</h2>
      <div class="room-shell-list">
        <button
          v-for="shell in shells"
          :key="shell.name"
          type="button"
          class="room-shell-card"
          :class="{ 'room-shell-card--active': shell.active }"
          :aria-pressed="shell.active"
        >
          <NeutralVisualPlaceholder :label="shell.name" />
          <span class="room-shell-card__copy">
            <span>
              <strong>{{ shell.name }}</strong>
              <small>{{ shell.status }}</small>
            </span>
            <small>{{ shell.perspective }}</small>
          </span>
        </button>
      </div>
    </section>

    <section class="room-shell-context__section room-shell-context__section--lined">
      <h2 class="builder-serif">Layer Bands</h2>
      <div class="layer-band-list">
        <button v-for="layer in layers" :key="layer.label" type="button">
          <BuilderIcon :name="layer.icon" />
          <span>{{ layer.label }}</span>
          <BuilderIcon name="eye" />
        </button>
      </div>
    </section>

    <section class="room-shell-context__section room-shell-context__section--lined">
      <h2 class="builder-serif">Perspective Family</h2>
      <div class="perspective-list">
        <button
          v-for="perspective in perspectives"
          :key="perspective.label"
          type="button"
          :class="{ 'perspective-list__active': perspective.active }"
          :aria-pressed="perspective.active"
        >
          <BuilderIcon :name="perspective.icon" />
          <span>{{ perspective.label }}</span>
        </button>
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import BuilderIcon from "./BuilderIcon.vue";
import NeutralVisualPlaceholder from "./NeutralVisualPlaceholder.vue";

const shells = [
  { name: "Celestial Atrium", status: "Draft", perspective: "Wide Perspective", active: true },
  { name: "Quiet Observatory", status: "Ready", perspective: "Panoramic", active: false },
  { name: "Lunar Gallery", status: "Draft", perspective: "Illustrated Fixed", active: false },
] as const;

const layers = [
  { label: "Background", icon: "showcase" },
  { label: "Rear Architecture", icon: "room" },
  { label: "Atmosphere", icon: "spark" },
  { label: "Foreground", icon: "object" },
] as const;

const perspectives = [
  { label: "Perspective", icon: "spark", active: true },
  { label: "Orthographic", icon: "board", active: false },
  { label: "Illustrated Fixed", icon: "templates", active: false },
] as const;
</script>

<style scoped>
.room-shell-context {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 22px 16px 32px;
  border-right: 1px solid var(--builder-border);
  background: linear-gradient(180deg, rgba(13,19,24,.62), rgba(7,11,15,.36));
  scrollbar-color: rgba(154, 164, 172, 0.18) transparent;
}

.room-shell-context__section {
  display: grid;
  gap: 12px;
}

.room-shell-context__section--lined {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--builder-border);
}

.room-shell-context h2 {
  margin: 0 4px;
  font-size: 0.92rem;
}

.room-shell-list {
  display: grid;
  gap: 10px;
}

.room-shell-card {
  display: grid;
  min-height: 112px;
  padding: 0;
  overflow: hidden;
  grid-template-rows: 70px auto;
  border: 1px solid var(--builder-border);
  border-radius: var(--builder-radius-control);
  background: rgba(13, 18, 23, 0.44);
  color: inherit;
  cursor: pointer;
  text-align: left;
  transition:
    border-color var(--builder-control-transition),
    background var(--builder-control-transition);
}

.room-shell-card:hover { border-color:rgba(120,149,177,.32); background:rgba(18,24,30,.62); }
.room-shell-card--active { border-color:rgba(159,187,211,.56); background:linear-gradient(145deg,rgba(120,149,177,.15),rgba(18,24,30,.68)); box-shadow:inset 0 0 0 1px rgba(159,187,211,.06),0 9px 22px rgba(0,0,0,.12); }

.room-shell-card__copy {
  display: grid;
  padding: 8px 9px 9px;
  gap: 4px;
}

.room-shell-card__copy > span {
  display: flex;
  min-width: 0;
  justify-content: space-between;
  gap: 8px;
}

.room-shell-card__copy strong {
  overflow: hidden;
  font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  font-size: 0.75rem;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.room-shell-card__copy small {
  color: var(--builder-muted);
  font-size: 0.62rem;
}

.layer-band-list,
.perspective-list {
  display: grid;
  overflow: hidden;
  border: 1px solid var(--builder-border);
  border-radius: var(--builder-radius-control);
}

.layer-band-list button,
.perspective-list button {
  display: grid;
  min-height: 35px;
  padding: 0 9px;
  grid-template-columns: 20px minmax(0, 1fr) 18px;
  align-items: center;
  border: 0;
  border-bottom: 1px solid var(--builder-border);
  background: rgba(13, 18, 23, 0.34);
  color: #c9c8c4;
  cursor: pointer;
  font-size: 0.68rem;
  text-align: left;
  gap: 8px;
}

.layer-band-list button:last-child,
.perspective-list button:last-child {
  border-bottom: 0;
}

.layer-band-list button:hover,
.perspective-list button:hover {
  background: rgba(255, 255, 255, 0.025);
}

.layer-band-list :deep(.builder-icon),
.perspective-list :deep(.builder-icon) {
  width: 0.95rem;
  height: 0.95rem;
}

.layer-band-list button > :deep(.builder-icon:last-child) {
  width: 0.85rem;
  height: 0.85rem;
  color: var(--builder-muted);
}

.perspective-list button {
  grid-template-columns: 20px minmax(0, 1fr);
}

.perspective-list__active {
  background: var(--builder-accent-soft) !important;
  box-shadow: inset 0 0 0 1px rgba(120, 149, 177, 0.45);
}
</style>
