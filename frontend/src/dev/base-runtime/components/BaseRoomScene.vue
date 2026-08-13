<template>
  <div
    class="base-room-scene"
    :class="`base-room-scene--${room.slug}`"
    :aria-label="`${room.displayName} in ${room.baseName}`"
    :data-room-id="room.objectId"
    data-testid="base-room-scene"
    @contextmenu.self.prevent="$emit('open-object-context-menu', $event, room.baseObjectId)"
  >
    <div class="base-room-scene__ceiling" aria-hidden="true" />
    <div class="base-room-scene__wall base-room-scene__wall--left" aria-hidden="true" />
    <div class="base-room-scene__wall base-room-scene__wall--right" aria-hidden="true" />
    <div class="base-room-scene__floor" aria-hidden="true" />

    <div
      v-if="room.cockpit"
      class="base-room-scene__cockpit"
      :aria-label="room.cockpit.displayName"
      :data-cockpit-id="room.cockpit.objectId"
    >
      <div class="base-room-scene__window">
        <span class="base-room-scene__planet" aria-hidden="true" />
        <i v-for="index in 20" :key="index" :style="starStyle(index)" aria-hidden="true" />
      </div>
      <span class="base-room-scene__window-frame" aria-hidden="true" />
      <span class="base-room-scene__console" aria-hidden="true" />
      <span class="base-room-scene__cockpit-seat base-room-scene__cockpit-seat--left" aria-hidden="true" />
      <span class="base-room-scene__cockpit-seat base-room-scene__cockpit-seat--right" aria-hidden="true" />
    </div>

    <button
      v-for="door in room.doorTargets"
      :key="door.objectId"
      type="button"
      class="base-room-scene__door"
      :class="`base-room-scene__door--${door.side}`"
      :aria-label="door.targetRoomName ? `${door.displayName} to ${door.targetRoomName}` : `${door.displayName}, destination unavailable`"
      :title="door.targetRoomName ? `Travel to ${door.targetRoomName}` : `${door.displayName}, destination unavailable`"
      :data-door-id="door.objectId"
      :data-target-room-id="door.targetRoomId"
      :disabled="!door.targetRoomId"
      @click="door.targetRoomId && $emit('travel-room', door.targetRoomId)"
    >
      <span aria-hidden="true" />
      <strong v-if="door.targetRoomId" class="base-room-scene__door-label">{{ door.targetRoomName }}</strong>
    </button>

    <button
      v-for="slot in room.workspaceSlots"
      :key="slot.slotObjectId"
      type="button"
      class="base-room-scene__workspace"
      :class="[
        `base-room-scene__workspace--${slot.side}`,
        `base-room-scene__workspace--${placementClass(slot.placement)}`,
      ]"
      :aria-label="slot.occupied ? `Open ${slot.displayName} workspace` : `${slot.displayName}, workspace slot available`"
      :title="slot.occupied ? `Open ${slot.displayName} workspace` : `${slot.displayName}, workspace slot available`"
      :data-slot-id="slot.slotObjectId"
      :data-workspace-id="slot.workspaceObjectId"
      :aria-pressed="selectedObjectId === slot.slotObjectId"
      :disabled="!slot.occupied"
      @click="slot.occupied && $emit('open-workspace', slot)"
      @contextmenu.prevent.stop="$emit('open-object-context-menu', $event, slot.workspaceObjectId ?? slot.slotObjectId)"
    >
      <span v-if="slot.icon?.toLocaleLowerCase() === 'knowledge'" class="base-room-scene__shelf" aria-hidden="true" />
      <span v-else class="base-room-scene__board" aria-hidden="true" />
      <span class="base-room-scene__desk" aria-hidden="true"><i /><i /></span>
      <strong>{{ slot.displayName }}</strong>
      <small>{{ slot.occupied ? slot.icon ?? slot.skin : "Available workspace slot" }}</small>
    </button>

    <div v-if="room.companion" class="base-room-scene__lounge" :aria-label="`${room.companion.displayName} area`">
      <span class="base-room-scene__rug" aria-hidden="true" />
      <span class="base-room-scene__chair" aria-hidden="true" />
      <span class="base-room-scene__table" aria-hidden="true" />
    </div>

    <BaseCompanionPresence :companion="room.companion" @open="$emit('open-companion')" />
    <BasePetPresence :pet="room.pet" />

  </div>
</template>

<script setup lang="ts">
import BaseCompanionPresence from "./BaseCompanionPresence.vue";
import BasePetPresence from "./BasePetPresence.vue";
import type { BaseRoomPresentation } from "../baseRuntimeProjection";
const props = defineProps<{
  room: Readonly<BaseRoomPresentation>;
  selectedObjectId: string | null;
}>();

defineEmits<{
  "travel-room": [roomId: string];
  "open-workspace": [slot: Readonly<BaseRoomPresentation["workspaceSlots"][number]>];
  "open-companion": [];
  "open-object-context-menu": [event: MouseEvent, objectId: string];
}>();

function starStyle(index: number) {
  return {
    left: `${(index * 47) % 94}%`,
    top: `${(index * 31) % 82}%`,
    opacity: 0.3 + (index % 4) * 0.14,
  };
}

function placementClass(placement: string) {
  return placement.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-");
}
</script>

<style scoped>
.base-room-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 56%, rgba(94, 69, 44, 0.17), transparent 45%),
    linear-gradient(180deg, #17191a, #0d1114 58%, #07090b);
}

.base-room-scene::after {
  position: absolute;
  z-index: 30;
  inset: 0;
  background: radial-gradient(ellipse at 50% 54%, transparent 40%, rgba(0, 0, 0, 0.38) 100%);
  content: "";
  pointer-events: none;
}

.base-room-scene--workshop {
  background:
    radial-gradient(ellipse at 50% 56%, rgba(100, 83, 59, 0.14), transparent 45%),
    linear-gradient(180deg, #1a1c1d, #111517 58%, #080a0c);
}

.base-room-scene__ceiling,
.base-room-scene__wall,
.base-room-scene__floor {
  position: absolute;
}

.base-room-scene__ceiling {
  z-index: 2;
  top: 0;
  right: 0;
  left: 0;
  height: 30%;
  clip-path: polygon(0 0, 100% 0, 78% 100%, 22% 100%);
  background:
    linear-gradient(90deg, transparent 20%, rgba(194, 142, 86, 0.14) 20.2%, transparent 20.5%, transparent 79.5%, rgba(194, 142, 86, 0.14) 79.8%, transparent 80%),
    linear-gradient(#171818, #23211f);
  box-shadow: inset 0 -2px rgba(219, 163, 100, 0.13);
}

.base-room-scene__wall {
  z-index: 1;
  top: 0;
  bottom: 0;
  width: 29%;
  background:
    repeating-linear-gradient(0deg, transparent 0 18%, rgba(215, 183, 145, 0.035) 18.2% 18.4%),
    linear-gradient(140deg, #262421, #111314 66%);
}

.base-room-scene__wall--left {
  left: 0;
  clip-path: polygon(0 0, 78% 28%, 84% 58%, 100% 100%, 0 100%);
}

.base-room-scene__wall--right {
  right: 0;
  clip-path: polygon(22% 28%, 100% 0, 100% 100%, 0 100%, 16% 58%);
}

.base-room-scene__floor {
  z-index: 1;
  right: 0;
  bottom: 0;
  left: 0;
  height: 53%;
  clip-path: polygon(21% 0, 79% 0, 100% 100%, 0 100%);
  background:
    repeating-linear-gradient(90deg, transparent 0 12.4%, rgba(185, 204, 211, 0.04) 12.5% 12.65%),
    repeating-linear-gradient(0deg, transparent 0 19%, rgba(218, 166, 105, 0.045) 19.2% 19.4%),
    linear-gradient(180deg, #272a2b, #151719 68%, #0a0c0e);
}

.base-room-scene__cockpit {
  position: absolute;
  z-index: 4;
  top: 20%;
  right: 23%;
  left: 23%;
  height: 46%;
}

.base-room-scene__window {
  position: absolute;
  inset: 0 4% 16%;
  overflow: hidden;
  border: 7px solid #252b2e;
  border-radius: 25% 25% 3px 3px / 18% 18% 3px 3px;
  background:
    radial-gradient(ellipse at 60% 25%, rgba(76, 66, 123, 0.18), transparent 28%),
    linear-gradient(180deg, #050a13, #07111e 76%, #020408);
  box-shadow: inset 0 0 48px #010205, 0 0 0 2px rgba(188, 211, 220, 0.1), 0 14px 28px rgba(0, 0, 0, 0.38);
}

.base-room-scene__window i {
  position: absolute;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: #e8f1f5;
  box-shadow: 0 0 5px rgba(206, 230, 240, 0.7);
}

.base-room-scene__planet {
  position: absolute;
  top: 25%;
  left: 50%;
  width: 32%;
  aspect-ratio: 1;
  transform: translateX(-50%);
  border: 1px solid rgba(194, 211, 221, 0.24);
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 28%, rgba(198, 207, 204, 0.27), transparent 22%),
    linear-gradient(145deg, #45505a, #1b2530 58%, #080d13);
  box-shadow: -14px 18px 38px rgba(0, 0, 0, 0.5), 0 0 48px rgba(84, 127, 156, 0.14);
}

.base-room-scene__window-frame {
  position: absolute;
  inset: -3% 0 8%;
  border: 10px solid rgba(52, 56, 57, 0.84);
  border-bottom-color: transparent;
  border-radius: 31% 31% 10% 10%;
  pointer-events: none;
}

.base-room-scene__console {
  position: absolute;
  right: 16%;
  bottom: 8%;
  left: 16%;
  height: 20%;
  clip-path: polygon(7% 0, 93% 0, 100% 100%, 0 100%);
  background:
    repeating-linear-gradient(90deg, transparent 0 13%, rgba(101, 168, 194, 0.12) 13.4% 17%, transparent 17.4% 24%),
    linear-gradient(#36434a, #161e23);
  box-shadow: inset 0 4px rgba(111, 189, 217, 0.12), 0 12px 18px rgba(0, 0, 0, 0.34);
}

.base-room-scene__cockpit-seat {
  position: absolute;
  z-index: 2;
  bottom: -5%;
  width: 12%;
  height: 28%;
  border: 1px solid rgba(181, 211, 225, 0.12);
  border-radius: 8px 8px 3px 3px;
  background: linear-gradient(90deg, #101619, #3a4143 48%, #101619);
  box-shadow: 0 12px 18px rgba(0, 0, 0, 0.42);
}

.base-room-scene__cockpit-seat--left { left: 25%; transform: rotate(4deg); }
.base-room-scene__cockpit-seat--right { right: 25%; transform: rotate(-4deg); }

.base-room-scene__door {
  position: absolute;
  z-index: 5;
  top: 25%;
  bottom: 8%;
  width: 7%;
  border: 1px solid rgba(210, 181, 146, 0.12);
  border-radius: 44% 44% 4px 4px / 14% 14% 4px 4px;
  background: linear-gradient(90deg, #0d1011, #272522 50%, #0d1011);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.58), 0 0 0 5px rgba(28, 28, 27, 0.8);
  cursor: pointer;
}

.base-room-scene__door:disabled {
  cursor: default;
  opacity: 0.46;
}

.base-room-scene__door:not(:disabled):hover {
  border-color: color-mix(in srgb, var(--cosmos-color-accent) 38%, rgba(210, 181, 146, 0.12));
  box-shadow:
    inset 0 0 20px rgba(0, 0, 0, 0.58),
    0 0 0 5px rgba(28, 28, 27, 0.8),
    0 0 24px color-mix(in srgb, var(--cosmos-color-accent) 12%, transparent);
}

.base-room-scene__door:focus-visible,
.base-room-scene__workspace:focus-visible {
  outline: 2px solid var(--cosmos-color-accent);
  outline-offset: 4px;
}

.base-room-scene__door--left { left: -1%; }
.base-room-scene__door--right { right: -1%; }

.base-room-scene__door span {
  position: absolute;
  top: 50%;
  width: 4px;
  height: 72px;
  transform: translateY(-50%);
  border-radius: 999px;
  background: #dab07d;
  box-shadow: 0 0 13px rgba(218, 176, 125, 0.36);
}

.base-room-scene__door--left span { right: 17px; }
.base-room-scene__door--right span { left: 17px; }

.base-room-scene__door-label {
  position: absolute;
  top: 18%;
  left: 50%;
  max-width: 110px;
  transform: translateX(-50%);
  color: rgba(224, 218, 207, 0.72);
  font-size: 0.5rem;
  font-weight: 560;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-shadow: 0 2px 7px #050607;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 120ms ease;
  pointer-events: none;
}

.base-room-scene__door:not(:disabled):hover .base-room-scene__door-label,
.base-room-scene__door:focus-visible .base-room-scene__door-label {
  opacity: 1;
}

.base-room-scene__workspace {
  position: absolute;
  z-index: 8;
  bottom: 8%;
  width: 29%;
  height: 39%;
  padding: 0;
  border: 0;
  background: transparent;
  color: #dcd8d0;
  cursor: pointer;
  font: inherit;
  text-align: initial;
}

.base-room-scene__workspace:disabled {
  cursor: default;
  opacity: 0.42;
  filter: saturate(0.35);
}

.base-room-scene__workspace:not(:disabled):hover {
  filter: brightness(1.08) drop-shadow(0 0 10px color-mix(in srgb, var(--cosmos-color-accent) 16%, transparent));
}

.base-room-scene__workspace:not(:disabled):hover::after,
.base-room-scene__workspace:focus-visible::after {
  position: absolute;
  inset: 0;
  border: 1px solid color-mix(in srgb, var(--cosmos-color-accent) 34%, transparent);
  border-radius: var(--cosmos-radius-window);
  box-shadow: 0 0 18px color-mix(in srgb, var(--cosmos-color-accent) 10%, transparent);
  content: "";
  pointer-events: none;
}

.base-room-scene__workspace[aria-pressed="true"] {
  filter: brightness(1.12);
}

.base-room-scene__workspace[aria-pressed="true"]::after {
  position: absolute;
  inset: 0;
  border: 1px solid color-mix(in srgb, var(--cosmos-color-accent) 48%, transparent);
  border-radius: var(--cosmos-radius-window);
  box-shadow: 0 0 22px color-mix(in srgb, var(--cosmos-color-accent) 12%, transparent);
  content: "";
  pointer-events: none;
}

.base-room-scene__workspace--left { left: 5%; }
.base-room-scene__workspace--right { right: 5%; }
.base-room-scene__workspace--center { left: 35.5%; }

.base-room-scene__workspace--left-rear { top: 19%; bottom: auto; left: 4%; }
.base-room-scene__workspace--left-front { right: auto; bottom: 5%; left: 7%; }
.base-room-scene__workspace--right-rear { top: 19%; right: 4%; bottom: auto; left: auto; }
.base-room-scene__workspace--right-front { right: 7%; bottom: 5%; left: auto; }

.base-room-scene__workspace > strong,
.base-room-scene__workspace > small {
  position: absolute;
  bottom: 3%;
  text-shadow: 0 2px 7px #050607;
}

.base-room-scene__workspace--left > strong,
.base-room-scene__workspace--left > small { left: 6%; }
.base-room-scene__workspace--right > strong,
.base-room-scene__workspace--right > small { right: 6%; text-align: right; }
.base-room-scene__workspace--center > strong,
.base-room-scene__workspace--center > small { left: 6%; }

.base-room-scene__workspace > strong {
  bottom: 7%;
  font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  font-size: 0.88rem;
  font-weight: 400;
}

.base-room-scene__workspace > small {
  color: rgba(196, 205, 209, 0.58);
  font-size: 0.52rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.base-room-scene__desk {
  position: absolute;
  right: 3%;
  bottom: 13%;
  left: 3%;
  height: 33%;
  transform: perspective(430px) rotateX(10deg);
  border: 1px solid rgba(202, 180, 151, 0.14);
  border-radius: 3px;
  background: linear-gradient(155deg, #4b4238, #201d1a 70%);
  box-shadow: 0 18px 25px rgba(0, 0, 0, 0.38);
}

.base-room-scene__workspace--right .base-room-scene__desk {
  background: linear-gradient(155deg, #4d4439, #221d19 70%);
}

.base-room-scene__desk::before,
.base-room-scene__desk::after {
  position: absolute;
  bottom: 84%;
  width: 30%;
  height: 62%;
  border: 4px solid #15191b;
  border-bottom-width: 7px;
  border-radius: 3px;
  background: linear-gradient(145deg, rgba(105, 167, 190, 0.2), #081116);
  box-shadow: 0 0 14px rgba(72, 154, 185, 0.11);
  content: "";
}

.base-room-scene__desk::before { left: 10%; }
.base-room-scene__desk::after { right: 10%; }

.base-room-scene__desk i {
  position: absolute;
  top: 18%;
  width: 18%;
  height: 12%;
  background: repeating-linear-gradient(90deg, #9b7c58 0 3px, transparent 3px 7px);
}

.base-room-scene__desk i:first-child { left: 37%; }
.base-room-scene__desk i:last-child { right: 5%; }

.base-room-scene__shelf,
.base-room-scene__board {
  position: absolute;
  right: 7%;
  bottom: 45%;
  left: 7%;
  height: 42%;
  border: 1px solid rgba(210, 181, 146, 0.1);
  background: repeating-linear-gradient(90deg, rgba(150, 115, 76, 0.2) 0 5px, transparent 5px 16px), linear-gradient(180deg, transparent 48%, rgba(189, 146, 95, 0.16) 49% 51%, transparent 52%);
  opacity: 0.6;
}

.base-room-scene__board {
  right: 12%;
  left: 28%;
  background: repeating-linear-gradient(135deg, rgba(207, 186, 155, 0.14) 0 13px, transparent 13px 29px);
}

.base-room-scene__lounge {
  position: absolute;
  z-index: 7;
  right: 34%;
  bottom: 1%;
  left: 34%;
  height: 30%;
}

.base-room-scene__rug {
  position: absolute;
  right: 3%;
  bottom: 0;
  left: 3%;
  height: 62%;
  border: 1px solid rgba(184, 137, 86, 0.1);
  border-radius: 50%;
  background: radial-gradient(ellipse, #252322, #111313 72%);
}

.base-room-scene__chair {
  position: absolute;
  bottom: 18%;
  left: 13%;
  width: 29%;
  height: 56%;
  transform: rotate(-7deg);
  border: 1px solid rgba(184, 175, 161, 0.12);
  border-radius: 42% 44% 18% 18%;
  background: linear-gradient(145deg, #3c3935, #171818 72%);
  box-shadow: 0 18px 24px rgba(0, 0, 0, 0.38);
}

.base-room-scene__table {
  position: absolute;
  bottom: 14%;
  left: 43%;
  width: 19%;
  height: 23%;
  border-top: 7px solid #514336;
  border-radius: 50%;
  background: linear-gradient(90deg, transparent 46%, #25211d 47% 53%, transparent 54%);
}

</style>
