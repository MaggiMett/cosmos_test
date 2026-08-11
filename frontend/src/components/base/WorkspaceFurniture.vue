<template>
  <button
    type="button"
    class="workspace-furniture"
    :class="[
      `workspace-furniture--${slot.placement.replaceAll('_', '-')}`,
      `workspace-furniture--${slot.skin.toLowerCase()}`,
      {
        'workspace-furniture--assigned': slot.workspace,
        'workspace-furniture--selected': selected,
      },
    ]"
    :aria-label="label"
    :aria-pressed="selected"
    @click="$emit('select', slot.objectId)"
  >
    <span class="workspace-furniture__surface" aria-hidden="true">
      <i class="workspace-furniture__screen" />
      <i class="workspace-furniture__light" />
      <i class="workspace-furniture__leg workspace-furniture__leg--left" />
      <i class="workspace-furniture__leg workspace-furniture__leg--right" />
    </span>
    <span class="workspace-furniture__label">
      <strong>{{ slot.workspace?.displayName ?? "Empty Workspace" }}</strong>
      <small>{{ slot.workspace ? "Workspace" : "Available slot" }}</small>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { WorkspaceSlot } from "../../runtime/baseRuntime";

const props = defineProps<{ slot: WorkspaceSlot; selected: boolean }>();
defineEmits<{ select: [objectId: string] }>();

const label = computed(() =>
  props.slot.workspace
    ? `${props.slot.workspace.displayName} furniture`
    : `${props.slot.displayName}, available Workspace Slot`,
);
</script>

<style scoped>
.workspace-furniture {
  --furniture-accent: #62c8ea;
  position: absolute;
  z-index: 6;
  display: grid;
  width: clamp(180px, 18vw, 300px);
  height: clamp(126px, 19vh, 210px);
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--cosmos-color-text, #e5edf2);
  cursor: pointer;
  filter: drop-shadow(0 18px 18px rgba(0, 0, 0, 0.34));
}

.workspace-furniture--knowledgedesk { --furniture-accent: #75cfa9; }
.workspace-furniture--creationworkbench { --furniture-accent: #d9a765; }
.workspace-furniture--workshopbench { --furniture-accent: #8eb9cb; }

.workspace-furniture__surface {
  position: absolute;
  inset: 21% 4% 22%;
  border: 1px solid rgba(181, 205, 215, 0.18);
  border-radius: 4px 4px 2px 2px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.075), transparent 14%),
    linear-gradient(155deg, #45545e, #222d35 68%, #12191f);
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.07), 0 12px 24px rgba(0, 0, 0, 0.24);
  transform: perspective(500px) rotateX(12deg);
  transition: border-color 160ms ease, filter 160ms ease, transform 160ms ease;
}

.workspace-furniture__surface::before {
  position: absolute;
  right: -2%;
  bottom: -4%;
  left: -2%;
  height: 13%;
  border: 1px solid rgba(190, 211, 218, 0.14);
  border-radius: 1px;
  background: linear-gradient(180deg, #3d4950, #1a2329);
  box-shadow: 0 5px 9px rgba(0, 0, 0, 0.25);
  content: "";
}

.workspace-furniture__surface::after {
  position: absolute;
  right: 7%;
  bottom: 17%;
  width: 18%;
  height: 12%;
  transform: rotate(-5deg);
  border: 1px solid color-mix(in srgb, var(--furniture-accent) 24%, transparent);
  background: rgba(4, 10, 14, 0.56);
  box-shadow: -18px 3px 0 -5px color-mix(in srgb, var(--furniture-accent) 15%, transparent);
  content: "";
}

.workspace-furniture--knowledgedesk .workspace-furniture__surface {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.07), transparent 14%),
    linear-gradient(155deg, #4a4b46, #2e302d 62%, #171c1d);
}

.workspace-furniture--knowledgedesk .workspace-furniture__surface::before {
  background: linear-gradient(180deg, #69533b, #34291f);
}

.workspace-furniture--knowledgedesk .workspace-furniture__surface::after {
  width: 23%;
  height: 15%;
  border-color: rgba(205, 184, 143, 0.24);
  background: linear-gradient(90deg, #aa9a79 0 47%, #817458 48% 52%, #a89b7e 53%);
  box-shadow: -22px -2px 0 -7px rgba(117, 207, 169, 0.22);
}

.workspace-furniture--creationworkbench .workspace-furniture__surface::after {
  width: 27%;
  height: 5%;
  border: 0;
  background: repeating-linear-gradient(90deg, #9b7851 0 3px, transparent 3px 8px);
  box-shadow: 0 -7px 0 -2px rgba(217, 167, 101, 0.18);
}

.workspace-furniture__screen {
  position: absolute;
  right: 22%;
  bottom: 78%;
  left: 22%;
  height: 54%;
  border: 4px solid #1b252c;
  border-bottom-width: 7px;
  border-radius: 4px;
  background:
    linear-gradient(140deg, rgba(255, 255, 255, 0.14), transparent 38%),
    color-mix(in srgb, var(--furniture-accent) 30%, #07141c);
  box-shadow: 0 0 15px color-mix(in srgb, var(--furniture-accent) 16%, transparent);
}

.workspace-furniture:not(.workspace-furniture--assigned) .workspace-furniture__screen {
  border-width: 2px;
  border-style: dashed;
  background: rgba(10, 20, 27, 0.58);
  box-shadow: none;
  opacity: 0.6;
}

.workspace-furniture__light {
  position: absolute;
  top: 16%;
  right: 7%;
  width: 5px;
  height: 5px;
  border-radius: 1px;
  background: var(--furniture-accent);
  box-shadow: 0 0 9px var(--furniture-accent);
}

.workspace-furniture__leg {
  position: absolute;
  top: 92%;
  width: 8%;
  height: 48%;
  border-radius: 0 0 2px 2px;
  background: #1d282f;
}

.workspace-furniture__leg--left { left: 13%; }
.workspace-furniture__leg--right { right: 13%; }

.workspace-furniture__label {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  gap: 2px;
  text-align: center;
  text-shadow: 0 2px 5px #080d12;
}

.workspace-furniture__label strong {
  font-size: clamp(0.68rem, 0.82vw, 0.82rem);
  font-weight: 620;
}

.workspace-furniture__label small {
  color: rgba(186, 205, 214, 0.48);
  font-size: 0.53rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.workspace-furniture:hover .workspace-furniture__surface,
.workspace-furniture:focus-visible .workspace-furniture__surface,
.workspace-furniture--selected .workspace-furniture__surface {
  border-color: color-mix(in srgb, var(--furniture-accent) 72%, white);
  filter: brightness(1.12);
  transform: perspective(500px) rotateX(12deg) translateY(-3px);
}

.workspace-furniture:focus-visible { outline: 0; }
.workspace-furniture:focus-visible .workspace-furniture__surface {
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2), 0 0 24px var(--furniture-accent);
}

@media (prefers-reduced-motion: reduce) {
  .workspace-furniture__surface { transition: none; }
}
</style>
