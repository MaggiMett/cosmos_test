<template>
  <ul class="project-resource-branch">
    <li v-for="item in items" :key="item.resourcePath">
      <template v-if="item.kind === 'group'">
        <button
          class="project-resource-branch__group"
          type="button"
          :aria-expanded="isExpanded(item.resourcePath)"
          @click="toggle(item.resourcePath)"
        >
          <span aria-hidden="true">{{ isExpanded(item.resourcePath) ? '−' : '+' }}</span>
          {{ item.displayName }}
        </button>
        <ProjectResourceBranch
          v-if="isExpanded(item.resourcePath)"
          :items="item.children"
          @open-resource="$emit('open-resource', $event)"
        />
      </template>
      <button
        v-else
        class="project-resource-branch__resource"
        type="button"
        :title="item.resourcePath"
        @click="$emit('open-resource', item.resourcePath)"
      >
        <span>{{ item.displayName }}</span>
        <small>{{ item.editable ? 'Editable' : 'Read only' }}</small>
      </button>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { ProjectResourceProjectionItem } from "../../../runtime/projectResourceProjectionRuntime";

defineOptions({ name: "ProjectResourceBranch" });
defineProps<{ items: ProjectResourceProjectionItem[] }>();
defineEmits<{ "open-resource": [resourcePath: string] }>();

const collapsed = ref(new Set<string>());

function isExpanded(resourcePath: string): boolean {
  return !collapsed.value.has(resourcePath);
}

function toggle(resourcePath: string): void {
  const next = new Set(collapsed.value);
  if (next.has(resourcePath)) next.delete(resourcePath);
  else next.add(resourcePath);
  collapsed.value = next;
}
</script>

<style scoped>
.project-resource-branch{margin:4px 0 4px 10px;padding-left:12px;border-left:1px solid rgba(126,185,255,.12);list-style:none}.project-resource-branch li{margin:5px 0;color:rgba(216,226,232,.7);font-size:.65rem}.project-resource-branch__group,.project-resource-branch__resource{display:block;width:100%;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}.project-resource-branch__group{padding:3px 0;color:#dbe6ec;font-weight:520}.project-resource-branch__group span{display:inline-block;width:14px;color:rgba(126,185,255,.65)}.project-resource-branch__resource{padding:3px 0}.project-resource-branch__resource small{display:block;margin-top:2px;color:rgba(214,224,239,.36);font-size:.52rem;letter-spacing:.06em;text-transform:uppercase}.project-resource-branch__group:hover,.project-resource-branch__group:focus-visible,.project-resource-branch__resource:hover,.project-resource-branch__resource:focus-visible{color:#fff;outline:0}
</style>
