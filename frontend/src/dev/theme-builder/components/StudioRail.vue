<template>
  <nav class="studio-rail" aria-label="Theme Builder studios" data-testid="studio-rail">
    <button type="button" class="studio-rail__brand" aria-label="Cosmos Theme Builder" @click="go('board')">
      <BuilderIcon name="spark" />
    </button>

    <div class="studio-rail__divider" />

    <div class="studio-rail__studios">
      <button
        v-for="studio in studios"
        :key="studio.id"
        type="button"
        class="studio-rail__item"
        :class="{ 'studio-rail__item--active': studio.id === activeStudio }"
        :aria-current="studio.id === activeStudio ? 'page' : undefined"
        :aria-label="studio.label"
        :title="studio.label"
        :disabled="studio.requiresProject && !builderProjectId"
        @click="go(studio.id)"
      >
        <BuilderIcon :name="studio.icon" />
        <span>{{ studio.label }}</span>
      </button>
    </div>

    <span class="studio-rail__end" aria-hidden="true" />
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import BuilderIcon from "./BuilderIcon.vue";

const props = defineProps<{ activeStudio: string; builderProjectId?: string }>();
const router = useRouter();

const studios = [
  { id: "board", label: "Theme Board", icon: "board", requiresProject: false },
  { id: "library", label: "Asset Library", icon: "library", requiresProject: false },
  { id: "room", label: "Room Shell", icon: "room", requiresProject: true },
  { id: "object", label: "Object Studio", icon: "object", requiresProject: true },
  { id: "looks", label: "Looks", icon: "looks", requiresProject: true },
  { id: "showcase", label: "Showcase", icon: "showcase", requiresProject: true },
  { id: "release", label: "Release", icon: "release", requiresProject: true },
] as const;

type StudioId = (typeof studios)[number]["id"];

function go(id: StudioId): void {
  const projectId = props.builderProjectId?.trim() ?? "";
  if (id === "board") {
    void router.push({ name: "theme-builder", query: projectId ? { builderProjectId: projectId } : {} });
    return;
  }
  if (id === "library") {
    void router.push({
      name: "theme-builder-assets",
      query: projectId ? { returnBuilderProjectId: projectId } : {},
    });
    return;
  }
  if (!projectId) return;
  const names: Record<Exclude<StudioId, "board" | "library">, string> = {
    room: "theme-builder-room-shell",
    object: "theme-builder-object",
    looks: "theme-builder-looks",
    showcase: "theme-builder-preview",
    release: "theme-builder-release",
  };
  void router.push({ name: names[id], query: { builderProjectId: projectId } });
}
</script>

<style scoped>
.studio-rail {
  z-index: 6;
  display: flex;
  width: 84px;
  min-height: 0;
  grid-row: 1 / -1;
  flex-direction: column;
  align-items: center;
  border-right: 1px solid var(--builder-border);
  background:
    linear-gradient(180deg, rgba(20, 27, 34, 0.96), rgba(7, 11, 15, 0.99)),
    var(--builder-bg-deep);
  box-shadow: 10px 0 32px rgba(0,0,0,.12);
}
.studio-rail button { color: inherit; }
.studio-rail__brand,.studio-rail__item { display:grid;padding:0;place-items:center;border:0;background:transparent;cursor:pointer; }
.studio-rail__brand { width:84px;height:72px;color:var(--builder-text);background:radial-gradient(circle,rgba(120,149,177,.1),transparent 58%); }
.studio-rail__brand :deep(.builder-icon) { width:1.65rem;height:1.65rem;stroke-width:1.15; }
.studio-rail__divider { width:40px;height:1px;margin:0 0 14px;background:var(--builder-border); }
.studio-rail__studios { display:flex;flex-direction:column;gap:10px; }
.studio-rail__item { position:relative;width:54px;height:54px;border:1px solid transparent;border-radius:14px;color:#9c9da0;transition:color var(--builder-control-transition),border-color var(--builder-control-transition),background var(--builder-control-transition),box-shadow var(--builder-control-transition); }
.studio-rail__item:disabled { opacity:.28;cursor:default; }
.studio-rail__item > span { position:absolute;left:calc(100% + 11px);z-index:10;width:max-content;padding:6px 8px;border:1px solid var(--builder-border);border-radius:6px;background:#14191e;box-shadow:0 8px 24px rgba(0,0,0,.28);color:var(--builder-text);font-size:.72rem;opacity:0;pointer-events:none;transform:translateX(-3px);transition:opacity var(--builder-control-transition),transform var(--builder-control-transition); }
.studio-rail__item:hover:not(:disabled),.studio-rail__item:focus-visible { color:var(--builder-text); }
.studio-rail__item:hover:not(:disabled) > span,.studio-rail__item:focus-visible > span { opacity:1;transform:translateX(0); }
.studio-rail__item--active { border-color:rgba(120,149,177,.58);background:linear-gradient(145deg,rgba(120,149,177,.2),rgba(120,149,177,.055));box-shadow:inset 0 0 22px rgba(120,149,177,.1),0 8px 28px rgba(0,0,0,.2),0 0 20px rgba(120,149,177,.08);color:var(--builder-text); }
.studio-rail__item--active::before { content:"";position:absolute;left:-16px;width:2px;height:24px;border-radius:2px;background:rgba(178,201,221,.82);box-shadow:0 0 12px rgba(120,149,177,.42); }
.studio-rail__end { width:4px;height:4px;margin-top:auto;margin-bottom:22px;border-radius:50%;background:var(--builder-border-strong); }
</style>
