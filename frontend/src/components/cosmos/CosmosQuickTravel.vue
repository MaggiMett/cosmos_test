<template>
  <aside id="quick-travel" class="quick-travel" aria-label="Quick Travel">
    <header>
      <span>Quick Travel</span>
      <button type="button" aria-label="Close Quick Travel" title="Close Quick Travel" @click="$emit('close')">×</button>
    </header>
    <button type="button" :aria-current="focusedProjectId === null" @click="$emit('travel-global')">
      <i class="quick-travel__cosmos" aria-hidden="true" />
      <span><strong>Global Cosmos</strong><small>All Projects</small></span>
    </button>
    <button
      v-for="project in projects"
      :key="project.objectId"
      type="button"
      :aria-current="focusedProjectId === project.objectId"
      @click="$emit('travel-project', project.objectId)"
    >
      <i :style="{ background: project.color, boxShadow: `0 0 14px ${project.color}` }" aria-hidden="true" />
      <span><strong>{{ project.displayName }}</strong><small>{{ project.vision }}</small></span>
    </button>
  </aside>
</template>

<script setup lang="ts">
interface CosmosQuickTravelProject {
  objectId: string;
  displayName: string;
  vision: string;
  color: string;
}

defineProps<{
  projects: readonly Readonly<CosmosQuickTravelProject>[];
  focusedProjectId: string | null;
}>();

defineEmits<{
  close: [];
  "travel-global": [];
  "travel-project": [projectId: string];
}>();
</script>

<style scoped>
.quick-travel {
  position: fixed;
  z-index: 24;
  top: 88px;
  left: 50%;
  display: grid;
  width: min(390px, calc(100vw - 36px));
  max-height: min(520px, calc(100vh - 130px));
  padding: 8px;
  transform: translateX(-50%);
  overflow: auto;
  border: 1px solid var(--cosmos-color-border-strong);
  border-radius: var(--cosmos-radius-window, 10px);
  background: var(--cosmos-color-surface-raised);
  box-shadow: var(--cosmos-window-shadow);
  backdrop-filter: blur(var(--cosmos-surface-blur, 18px));
}

.quick-travel header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 9px 12px 13px;
  color: #94a3b8;
  font-size: 0.66rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.quick-travel header button {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #cbd5e1;
  font-size: 1.1rem;
  cursor: pointer;
}

.quick-travel > button {
  display: grid;
  min-height: 58px;
  padding: 8px 10px;
  align-items: center;
  border: 1px solid transparent;
  border-radius: var(--cosmos-radius-control, 5px);
  background: transparent;
  color: #e2e8f0;
  text-align: left;
  cursor: pointer;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 8px;
}

.quick-travel > button:hover,
.quick-travel > button:focus-visible,
.quick-travel > button[aria-current="true"] {
  border-color: rgba(196, 181, 253, 0.16);
  outline: none;
  background: rgba(196, 181, 253, 0.07);
}

.quick-travel > button i {
  width: 9px;
  height: 9px;
  margin-left: 7px;
  border-radius: 50%;
}

.quick-travel__cosmos {
  border: 1px solid #94a3b8;
  background: transparent !important;
  box-shadow: 0 0 10px rgba(148, 163, 184, 0.4);
}

.quick-travel > button span {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.quick-travel strong,
.quick-travel small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-travel strong { font-size: 0.8rem; font-weight: 600; }
.quick-travel small { color: #64748b; font-size: 0.66rem; }
</style>
