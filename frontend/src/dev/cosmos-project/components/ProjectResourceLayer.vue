<template>
  <aside class="project-resource-layer" aria-label="Project resources">
    <header>
      <span><small>Project resources</small><strong>{{ projectName }}</strong></span>
      <button type="button" aria-label="Close project resources" title="Close project resources" @click="$emit('close')">×</button>
    </header>
    <p v-if="phase === 'loading'" class="project-resource-layer__state">Loading resources…</p>
    <p v-else-if="phase === 'error'" class="project-resource-layer__state">Resources are temporarily unavailable.</p>
    <p v-else-if="!items.length" class="project-resource-layer__state">No user-facing resources found.</p>
    <nav v-else aria-label="Projected project resources">
      <template v-for="item in items" :key="item.resourcePath">
        <div class="project-resource-layer__group" v-if="item.kind === 'group'">
          <strong>{{ item.displayName }}</strong>
          <ResourceBranch :items="item.children" @open-resource="$emit('open-resource', $event)" />
        </div>
        <button v-else class="project-resource-layer__resource" type="button" @click="$emit('open-resource', item.resourcePath)">{{ item.displayName }}</button>
      </template>
    </nav>
    <footer>Resource view · not Cosmos semantics</footer>
  </aside>
</template>

<script setup lang="ts">
import { defineComponent, h, type PropType } from "vue";
import type { ProjectResourceProjectionItem } from "../../../runtime/projectResourceProjectionRuntime";

const props = defineProps<{
  projectName: string;
  phase: "idle" | "loading" | "ready" | "error";
  items: ProjectResourceProjectionItem[];
}>();
void props;
defineEmits<{ close: []; "open-resource": [resourcePath: string] }>();

const ResourceBranch = defineComponent({
  name: "ResourceBranch",
  props: { items: { type: Array as PropType<ProjectResourceProjectionItem[]>, required: true } },
  emits: { "open-resource": (_resourcePath: string) => true },
  setup(branchProps, { emit }) {
    const renderItems = (items: ProjectResourceProjectionItem[]) => h("ul", items.map((item) =>
      h("li", { key: item.resourcePath }, item.kind === "group"
        ? [h("strong", item.displayName), renderItems(item.children)]
        : h("button", {
          type: "button",
          class: "project-resource-layer__nested-resource",
          onClick: () => emit("open-resource", item.resourcePath),
        }, item.displayName)),
    ));
    return () => renderItems(branchProps.items);
  },
});
</script>

<style scoped>
.project-resource-layer{position:fixed;z-index:23;top:92px;right:28px;width:min(320px,calc(100vw - 56px));max-height:calc(100vh - 180px);overflow:auto;border:1px solid rgba(126,185,255,.18);border-radius:12px;background:rgba(5,10,17,.9);box-shadow:0 22px 52px rgba(0,0,0,.38);backdrop-filter:blur(16px)}
header{display:flex;align-items:center;justify-content:space-between;padding:14px 14px 11px;border-bottom:1px solid rgba(255,255,255,.06)} header span{display:grid;gap:2px} header small,footer{color:rgba(214,224,239,.42);font-size:.57rem;letter-spacing:.12em;text-transform:uppercase} header strong{color:#e4edf3;font-size:.78rem;font-weight:560} header button{width:28px;height:28px;border:1px solid rgba(255,255,255,.1);border-radius:50%;background:transparent;color:#c7d2d7;cursor:pointer} nav{padding:10px 14px 14px}.project-resource-layer__group{margin:8px 0}.project-resource-layer__group>strong,.project-resource-layer__resource{display:block;color:#d8e2e8;font-size:.67rem}.project-resource-layer__resource{padding:5px 0 5px 10px;color:rgba(216,226,232,.72)} :deep(ul){margin:4px 0 4px 10px;padding-left:12px;border-left:1px solid rgba(126,185,255,.12);list-style:none} :deep(li){margin:5px 0;color:rgba(216,226,232,.7);font-size:.65rem} :deep(li strong){color:#dbe6ec;font-weight:520}:deep(.project-resource-layer__nested-resource){padding:3px 0;border:0;background:transparent;color:rgba(216,226,232,.7);font:inherit;cursor:pointer;text-align:left}:deep(.project-resource-layer__nested-resource:hover),:deep(.project-resource-layer__nested-resource:focus-visible){color:#fff;outline:0}.project-resource-layer__state{margin:0;padding:18px 14px;color:rgba(216,226,232,.56);font-size:.66rem}footer{padding:10px 14px 12px;border-top:1px solid rgba(255,255,255,.05)}
</style>
