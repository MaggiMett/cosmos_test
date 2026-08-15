<template>
  <header class="builder-topbar" data-testid="builder-top-navigation">
    <div class="builder-topbar__orientation" aria-label="Builder location">
      <span>Theme Builder</span>
      <BuilderIcon name="chevron" />
      <strong>{{ studioLabel }}</strong>
    </div>

    <div class="builder-topbar__history" aria-label="Save and history">
      <button
        v-if="interactive"
        type="button"
        class="builder-topbar__save"
        :disabled="!canSave || saving"
        @click="$emit('save')"
      >
        {{ saving ? "Saving…" : dirty ? "Save" : "Saved" }}
      </button>
      <span v-else class="builder-topbar__saved">
        <BuilderIcon name="check" />
        Saved
      </span>
      <button type="button" class="builder-topbar__icon-button" aria-label="Undo" :disabled="interactive && !canUndo" @click="$emit('undo')">
        <BuilderIcon name="undo" />
      </button>
      <button type="button" class="builder-topbar__icon-button" aria-label="Redo" :disabled="interactive && !canRedo" @click="$emit('redo')">
        <BuilderIcon name="redo" />
      </button>
    </div>

    <div class="builder-topbar__actions">
      <button type="button" class="builder-topbar__button" @click="exitBuilder">
        Theme Library
      </button>
      <button type="button" class="builder-topbar__button" :disabled="!builderProjectId" @click="openRelease">
        <BuilderIcon name="spark" />
        Theme Check
      </button>
      <button type="button" class="builder-topbar__button builder-topbar__button--primary" :disabled="!builderProjectId" @click="openPreview">
        <BuilderIcon name="eye" />
        Preview Theme
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import BuilderIcon from "./BuilderIcon.vue";

const props = withDefaults(defineProps<{
  studioLabel: string;
  interactive?: boolean;
  dirty?: boolean;
  saving?: boolean;
  canSave?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  builderProjectId?: string;
}>(), {
  interactive: false,
  dirty: false,
  saving: false,
  canSave: false,
  canUndo: false,
  canRedo: false,
});

const router = useRouter();
function exitBuilder(): void { void router.push({ name: "theme-library" }); }
function openRelease(): void { if (props.builderProjectId) void router.push({ name: "theme-builder-release", query: { builderProjectId: props.builderProjectId } }); }
function openPreview(): void { if (props.builderProjectId) void router.push({ name: "theme-builder-preview", query: { builderProjectId: props.builderProjectId } }); }

defineEmits<{ save: []; undo: []; redo: [] }>();
</script>

<style scoped>
.builder-topbar {
  z-index: 5;
  display: grid;
  min-width: 0;
  min-height: 72px;
  padding: 0 28px 0 34px;
  grid-template-columns: minmax(260px, 1fr) auto minmax(300px, 1fr);
  align-items: center;
  border-bottom: 1px solid var(--builder-border);
  background:
    linear-gradient(90deg, rgba(16,22,28,.98), rgba(10,15,20,.94)),
    color-mix(in srgb, var(--builder-bg-deep) 96%, transparent);
  box-shadow: 0 10px 32px rgba(0,0,0,.1);
}

.builder-topbar__orientation,
.builder-topbar__history,
.builder-topbar__actions,
.builder-topbar__saved,
.builder-topbar__button {
  display: flex;
  align-items: center;
}

.builder-topbar__orientation {
  min-width: 0;
  color: var(--builder-muted);
  font-size: 0.78rem;
  letter-spacing: .015em;
  gap: 12px;
}

.builder-topbar__orientation strong {
  overflow: hidden;
  color: var(--builder-text);
  font-weight: 560;
  font-size: .9rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.builder-topbar__orientation :deep(.builder-icon) {
  width: 0.9rem;
  height: 0.9rem;
  color: var(--builder-faint);
}

.builder-topbar__history {
  justify-content: center;
  gap: 7px;
}

.builder-topbar__saved {
  margin-right: 19px;
  color: var(--builder-muted);
  font-size: 0.8rem;
  gap: 8px;
}

.builder-topbar__saved :deep(.builder-icon) {
  width: 1.1rem;
  height: 1.1rem;
  color: var(--builder-text);
}

.builder-topbar__icon-button,
.builder-topbar__button,
.builder-topbar__save {
  border: 1px solid transparent;
  border-radius: var(--builder-radius-control);
  background: transparent;
  color: var(--builder-muted);
  cursor: pointer;
  transition:
    border-color var(--builder-control-transition),
    background var(--builder-control-transition),
    color var(--builder-control-transition);
}

.builder-topbar__save {
  min-width: 76px;
  min-height: 34px;
  margin-right: 10px;
  border-color: var(--builder-border);
  color: var(--builder-text);
}

.builder-topbar button:disabled {
  cursor: default;
  opacity: 0.42;
}

.builder-topbar__icon-button {
  display: grid;
  width: 38px;
  height: 38px;
  padding: 0;
  place-items: center;
}

.builder-topbar__icon-button:hover,
.builder-topbar__button:hover {
  border-color: var(--builder-border-strong);
  background: rgba(255, 255, 255, 0.025);
  color: var(--builder-text);
}

.builder-topbar__actions {
  justify-content: flex-end;
  gap: 12px;
}

.builder-topbar__button {
  min-height: 42px;
  padding: 0 18px;
  border-color: var(--builder-border);
  color: var(--builder-text);
  font-size: 0.82rem;
  gap: 9px;
}

.builder-topbar__button :deep(.builder-icon) {
  width: 1.1rem;
  height: 1.1rem;
}

.builder-topbar__button--primary {
  border-color: rgba(120, 149, 177, 0.42);
  background: linear-gradient(180deg, rgba(120, 149, 177, 0.24), rgba(120, 149, 177, 0.1));
  box-shadow: inset 0 1px rgba(255,255,255,.035), 0 8px 22px rgba(0,0,0,.12);
}

@media (max-width: 1280px) {
  .builder-topbar {
    padding-inline: 20px;
    grid-template-columns: minmax(220px, 1fr) auto minmax(280px, 1fr);
  }

  .builder-topbar__saved { margin-right: 8px; }
}

@media (max-width: 1040px) {
  .builder-topbar { min-height: 68px; padding-inline: 16px; grid-template-columns: minmax(180px, 1fr) auto; }
  .builder-topbar__tabs { display: none; }
  .builder-topbar__actions { gap: 6px; }
  .builder-topbar__saved { display: none; }
}

@media (max-width: 720px) {
  .builder-topbar__context span[aria-hidden="true"],
  .builder-topbar__context strong { display: none; }
  .builder-topbar__button { padding-inline: 12px; }
}
</style>
