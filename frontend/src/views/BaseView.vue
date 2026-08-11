<template>
  <section class="base-stage environment-view" :class="`base-stage--${roomSlug}`" aria-label="Base">
    <div class="base-stage__cosmos" aria-hidden="true">
      <i v-for="index in 14" :key="index" :style="starStyle(index)" />
    </div>

    <div v-if="state.phase === 'loading' || state.phase === 'idle'" class="base-status" role="status">
      <span class="base-status__signal" aria-hidden="true" />
      <p>Approaching Base…</p>
    </div>
    <div v-else-if="state.phase === 'failed'" class="base-status" role="alert">
      <p>{{ state.error }}</p>
      <button type="button" @click="load">Try again</button>
    </div>

    <article
      v-if="snapshot && room"
      class="base-environment"
      :aria-label="`${room.displayName} environment`"
      @contextmenu.self.prevent="openObjectContextMenu($event, snapshot.base.objectId)"
    >
      <button
        v-if="!backgroundOnly"
        class="base-environment__close"
        type="button"
        aria-label="Return to Cosmos"
        @click="closeBase"
      >
        <span aria-hidden="true">×</span>
      </button>

      <div class="room-shell" aria-hidden="true">
        <div class="room-shell__ceiling" />
        <div class="room-shell__wall room-shell__wall--left" />
        <div class="room-shell__wall room-shell__wall--right" />
        <div class="room-shell__floor" />
        <div class="room-shell__beam room-shell__beam--left" />
        <div class="room-shell__beam room-shell__beam--right" />
        <div class="room-shell__bay room-shell__bay--left"><i /></div>
        <div class="room-shell__bay room-shell__bay--right"><i /></div>
        <div class="room-shell__light room-shell__light--left" />
        <div class="room-shell__light room-shell__light--right" />
      </div>

      <template v-if="roomSlug === 'main'">
        <section class="cockpit" aria-label="Cockpit">
          <div class="cockpit__window" aria-label="Panoramic view of Cosmos">
            <i v-for="index in 24" :key="index" :style="cockpitStarStyle(index)" aria-hidden="true" />
            <span class="cockpit__nebula" aria-hidden="true" />
          </div>
          <span class="cockpit__arch" aria-hidden="true" />
          <span class="cockpit__console" aria-hidden="true" />
          <span class="cockpit__seat cockpit__seat--left" aria-hidden="true" />
          <span class="cockpit__seat cockpit__seat--right" aria-hidden="true" />
        </section>

        <WorkspaceFurniture
          v-for="slot in room.workspaceSlots"
          :key="slot.objectId"
          :slot="slot"
          :selected="state.selectedObjectId === slot.objectId"
          @select="select"
          @contextmenu.prevent.stop="openObjectContextMenu($event, slot.workspace?.objectId ?? slot.objectId)"
        />

        <button
          type="button"
          class="base-companion"
          :aria-label="`Talk with ${snapshot.companion.displayName}`"
          @click="openCompanion"
        >
          <CompanionAvatar
            mode="seated"
            :notification-available="snapshot.companion.notificationAvailable"
          />
          <span>{{ snapshot.companion.displayName }}</span>
        </button>

        <button
          type="button"
          class="base-pet"
          :class="{ 'base-pet--greeting': petGreeting }"
          :aria-label="`Pet ${snapshot.pet.displayName}`"
          @click="greetPet"
        >
          <span class="base-pet__tail" aria-hidden="true" />
          <span class="base-pet__body" aria-hidden="true"><i /><i /></span>
          <span class="base-pet__head" aria-hidden="true"><i /><i /><b /><b /></span>
          <small>{{ petGreeting ? "Hello!" : snapshot.pet.displayName }}</small>
        </button>
      </template>

      <template v-else>
        <div class="workshop-sign" aria-hidden="true">
          <span>Workshop</span>
          <small>Workspace bay</small>
        </div>
        <WorkspaceFurniture
          v-for="slot in room.workspaceSlots"
          :key="slot.objectId"
          :slot="slot"
          :selected="state.selectedObjectId === slot.objectId"
          @select="select"
          @contextmenu.prevent.stop="openObjectContextMenu($event, slot.workspace?.objectId ?? slot.objectId)"
        />
      </template>

      <button type="button" class="room-door" :aria-label="doorLabel" @click="travelThroughDoor">
        <span class="room-door__frame" aria-hidden="true"><i /></span>
        <strong>{{ roomSlug === "main" ? "Workshop" : "Main Room" }}</strong>
        <small>{{ roomSlug === "main" ? "Enter room" : "Return home" }}</small>
      </button>

      <p v-if="selectedSlot" class="selection-note" role="status">
        <strong>{{ selectedSlot.workspace?.displayName ?? "Empty Workspace Slot" }}</strong>
        <span>{{ selectedSlot.workspace ? "Opening Workspace" : "Available for a future Workspace" }}</span>
      </p>

      <CompanionWindowHost
        v-if="!backgroundOnly"
        ref="companionWindowHost"
        :current-location="room.displayName"
        :context="{ roomId: room.objectId, objectId: state.selectedObjectId }"
        @destination="openObject"
      />
      <ObjectInteractionHost v-if="!backgroundOnly" ref="objectInteractionHost" />
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import WorkspaceFurniture from "../components/base/WorkspaceFurniture.vue";
import CompanionWindowHost from "../components/cosmos/CompanionWindowHost.vue";
import CompanionAvatar from "../components/entities/CompanionAvatar.vue";
import ObjectInteractionHost from "../components/windows/ObjectInteractionHost.vue";
import type { BaseSnapshot, WorkspaceSlot } from "../runtime/baseRuntime";
import { useCosmosRuntime } from "../runtime/plugin";

const runtime = useCosmosRuntime();
const props = withDefaults(defineProps<{ backgroundOnly?: boolean }>(), { backgroundOnly: false });
const route = useRoute();
const router = useRouter();
const state = runtime.base.state;
const snapshot = computed(() => state.snapshot as BaseSnapshot | null);
const petGreeting = ref(false);
const companionWindowHost = ref<InstanceType<typeof CompanionWindowHost> | null>(null);
const objectInteractionHost = ref<InstanceType<typeof ObjectInteractionHost> | null>(null);
let petTimer: ReturnType<typeof setTimeout> | null = null;

const requestedRoom = computed(() =>
  route.meta.environment === "room" ? String(route.params.roomId ?? "main") : "main",
);
const roomSlug = computed<"main" | "workshop">(() =>
  requestedRoom.value === "workshop" ? "workshop" : "main",
);
const room = computed(() => runtime.base.room(roomSlug.value));
const selectedSlot = computed<WorkspaceSlot | null>(() =>
  room.value?.workspaceSlots.find((slot) => slot.objectId === state.selectedObjectId) ?? null,
);
const doorLabel = computed(() =>
  roomSlug.value === "main" ? "Enter the Workshop" : "Return to the Main Room",
);

function load() {
  void runtime.base.load().catch(() => undefined);
}

function select(objectId: string) {
  const slot = room.value?.workspaceSlots.find((candidate) => candidate.objectId === objectId);
  runtime.base.select(objectId);
  if (slot?.workspace && !props.backgroundOnly) {
    void router.push(`/workspaces/${slot.workspace.objectId}`);
  }
}

function closeBase() {
  void router.push("/");
}

function travelThroughDoor() {
  runtime.base.select(null);
  void router.push(roomSlug.value === "main" ? "/base/rooms/workshop" : "/base");
}

function openCompanion() {
  companionWindowHost.value?.open();
}

function openObject(objectId: string) {
  void objectInteractionHost.value?.openObject(objectId, "details").catch(() => undefined);
}

function openObjectContextMenu(event: MouseEvent, objectId: string) {
  void objectInteractionHost.value
    ?.openContextMenu(objectId, { x: event.clientX, y: event.clientY })
    .catch(() => undefined);
}

function greetPet() {
  petGreeting.value = true;
  if (petTimer) clearTimeout(petTimer);
  petTimer = setTimeout(() => {
    petGreeting.value = false;
    petTimer = null;
  }, 1600);
}

function starStyle(index: number) {
  return {
    left: `${(index * 47) % 97}%`,
    top: `${(index * 29) % 91}%`,
    animationDelay: `${(index % 6) * -0.7}s`,
  };
}

function cockpitStarStyle(index: number) {
  return {
    left: `${(index * 41) % 96}%`,
    top: `${(index * 23) % 88}%`,
    opacity: 0.38 + (index % 4) * 0.14,
  };
}

watch(requestedRoom, (value) => {
  if (value !== "main" && value !== "workshop") void router.replace("/base");
});

onMounted(() => {
  if (requestedRoom.value !== "main" && requestedRoom.value !== "workshop") {
    void router.replace("/base");
  }
  load();
});

onBeforeUnmount(() => {
  if (petTimer) clearTimeout(petTimer);
});
</script>

<style scoped>
.base-stage {
  z-index: 10;
  display: grid;
  overflow: hidden;
  place-items: center;
  background:
    radial-gradient(circle at 50% 52%, rgba(28, 69, 94, 0.16), transparent 42%),
    rgba(1, 3, 8, 0.48);
  pointer-events: auto;
}

.base-stage__cosmos {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 72% 24%, rgba(88, 65, 137, 0.13), transparent 34%),
    radial-gradient(ellipse at 18% 72%, rgba(24, 83, 102, 0.1), transparent 30%),
    linear-gradient(155deg, rgba(2, 5, 12, 0.15), rgba(0, 2, 6, 0.52));
  pointer-events: none;
}

.base-stage__cosmos i {
  position: absolute;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: #dceeff;
  box-shadow: 0 0 8px rgba(184, 222, 255, 0.8);
  animation: star-breathe 4s ease-in-out infinite alternate;
}

.base-environment {
  position: relative;
  width: 80vw;
  height: 80vh;
  min-height: 575px;
  overflow: hidden;
  border: 0;
  border-radius: 6px;
  background: #101820;
  box-shadow: 0 46px 120px rgba(0, 0, 0, 0.74), 0 0 0 1px rgba(161, 193, 207, 0.1);
  animation: base-arrival 520ms cubic-bezier(0.22, 0.78, 0.18, 1) both;
}

.base-stage--workshop .base-environment { background: #18262d; }

.base-environment__close {
  position: absolute;
  z-index: 30;
  top: 14px;
  right: 15px;
  display: grid;
  width: 32px;
  height: 32px;
  padding: 0;
  place-items: center;
  border: 1px solid rgba(181, 211, 225, 0.17);
  border-radius: 4px;
  background: rgba(7, 14, 20, 0.66);
  color: rgba(229, 238, 241, 0.82);
  font-size: 1.05rem;
  cursor: pointer;
  backdrop-filter: blur(10px);
}

.base-environment__close:hover,
.base-environment__close:focus-visible {
  border-color: rgba(255, 255, 255, 0.52);
  background: rgba(103, 54, 54, 0.72);
  outline: 0;
}

.room-shell,
.room-shell > div { position: absolute; }
.room-shell { inset: 0; overflow: hidden; }

.room-shell__ceiling {
  top: 0;
  right: 0;
  left: 0;
  height: 26%;
  clip-path: polygon(0 0, 100% 0, 79% 100%, 21% 100%);
  background:
    repeating-linear-gradient(90deg, transparent 0 11.8%, rgba(154, 181, 191, 0.045) 12% 12.3%),
    linear-gradient(90deg, transparent 22%, rgba(117, 166, 184, 0.16) 22.3%, transparent 22.7%, transparent 77%, rgba(117, 166, 184, 0.16) 77.3%, transparent 77.7%),
    linear-gradient(#161e25, #111a21);
}

.room-shell__floor {
  right: 0;
  bottom: 0;
  left: 0;
  height: 47%;
  clip-path: polygon(21% 0, 79% 0, 100% 100%, 0 100%);
  background:
    repeating-linear-gradient(90deg, transparent 0 14.8%, rgba(158, 197, 203, 0.055) 15% 15.15%),
    repeating-linear-gradient(0deg, transparent 0 19%, rgba(221, 164, 94, 0.035) 19.2% 19.45%),
    linear-gradient(180deg, #2b2925, #151718 72%, #0b1014);
}

.room-shell__floor::after {
  position: absolute;
  inset: 14% 29% 18%;
  border-radius: 50%;
  border: 1px solid rgba(179, 131, 77, 0.12);
  background: radial-gradient(ellipse, rgba(191, 134, 72, 0.11), transparent 67%);
  content: "";
}

.room-shell__wall {
  top: 0;
  bottom: 0;
  width: 26%;
  background:
    repeating-linear-gradient(0deg, transparent 0 17%, rgba(185, 204, 211, 0.035) 17.2% 17.5%),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035), transparent 18%),
    linear-gradient(140deg, #29343a, #131c22 64%);
}

.room-shell__wall--left { left: 0; clip-path: polygon(0 0, 82% 26%, 82% 53%, 100% 100%, 0 100%); }
.room-shell__wall--right { right: 0; clip-path: polygon(18% 26%, 100% 0, 100% 100%, 0 100%, 18% 53%); }

.room-shell__beam {
  z-index: 2;
  top: 0;
  width: 3.2%;
  height: 64%;
  background: linear-gradient(90deg, #0c1217, #44525a 42%, #121b21);
  box-shadow: 0 0 0 1px rgba(189, 210, 217, 0.08), 0 0 22px rgba(0, 0, 0, 0.34);
}

.room-shell__beam--left { left: 20%; transform: skewY(18deg); }
.room-shell__beam--right { right: 20%; transform: skewY(-18deg); }

.room-shell__bay {
  z-index: 1;
  top: 14%;
  width: 16%;
  height: 42%;
  border: 1px solid rgba(162, 190, 201, 0.12);
  background: linear-gradient(155deg, rgba(16, 25, 31, 0.82), rgba(5, 10, 14, 0.7));
  box-shadow: inset 0 0 24px rgba(0, 0, 0, 0.46);
}

.room-shell__bay--left { left: 3.5%; transform: perspective(430px) rotateY(9deg); }
.room-shell__bay--right { right: 3.5%; transform: perspective(430px) rotateY(-9deg); }
.room-shell__bay i {
  position: absolute;
  top: 12%;
  bottom: 12%;
  width: 2px;
  background: rgba(80, 176, 205, 0.42);
  box-shadow: 0 0 10px rgba(71, 175, 209, 0.3);
}
.room-shell__bay--left i { left: 10px; }
.room-shell__bay--right i { right: 10px; }

.room-shell__light {
  z-index: 3;
  top: 5.5%;
  width: 19%;
  height: 4px;
  border-radius: 1px;
  background: linear-gradient(90deg, transparent, #e1b777 18% 82%, transparent);
  box-shadow: 0 5px 22px rgba(222, 171, 99, 0.26);
  opacity: 0.8;
}
.room-shell__light--left { left: 4%; transform: rotate(6deg); }
.room-shell__light--right { right: 4%; transform: rotate(-6deg); }

.base-stage--workshop .room-shell__ceiling {
  background:
    repeating-linear-gradient(90deg, transparent 0 18%, rgba(206, 236, 239, 0.23) 18.4% 18.9%),
    linear-gradient(#42575d, #263a40);
}
.base-stage--workshop .room-shell__floor { background: linear-gradient(180deg, #45595b, #263638); }
.base-stage--workshop .room-shell__wall { background: linear-gradient(140deg, #52666a, #2c4044 64%); }

.cockpit {
  position: absolute;
  z-index: 3;
  top: 7%;
  right: 20%;
  left: 20%;
  height: 54%;
}

.cockpit__window {
  position: absolute;
  inset: 0 6% 16%;
  overflow: hidden;
  border: 8px solid #27343c;
  border-radius: 25% 25% 5px 5px / 20% 20% 5px 5px;
  background:
    radial-gradient(ellipse at 58% 34%, rgba(105, 75, 153, 0.21), transparent 31%),
    radial-gradient(ellipse at 50% 120%, #102341 0, #050b17 54%, #010207 100%);
  box-shadow: inset 0 0 45px #01030a, 0 0 0 2px rgba(121, 163, 179, 0.15), 0 12px 28px rgba(0, 0, 0, 0.38);
}

.cockpit__window i {
  position: absolute;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 0 5px #bfdbfe;
}

.cockpit__nebula {
  position: absolute;
  top: 28%;
  left: 18%;
  width: 64%;
  height: 36%;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(101, 79, 164, 0.27), transparent 70%);
  filter: blur(9px);
  transform: rotate(-7deg);
}

.cockpit__arch {
  position: absolute;
  inset: -4% 1% 7%;
  border: 12px solid rgba(48, 62, 70, 0.82);
  border-bottom-color: transparent;
  border-radius: 30% 30% 12% 12%;
  pointer-events: none;
}

.cockpit__console {
  position: absolute;
  right: 19%;
  bottom: 11%;
  left: 19%;
  height: 18%;
  clip-path: polygon(8% 0, 92% 0, 100% 100%, 0 100%);
  background: linear-gradient(#324650, #17232b);
  box-shadow: inset 0 4px rgba(84, 188, 221, 0.16), 0 10px 16px rgba(0, 0, 0, 0.28);
}

.cockpit__seat {
  position: absolute;
  z-index: 2;
  bottom: -9%;
  width: 14%;
  height: 32%;
  border: 1px solid rgba(167, 190, 199, 0.15);
  border-radius: 10px 10px 4px 4px;
  background: linear-gradient(90deg, #18252c, #495960 48%, #18252c);
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.45);
}
.cockpit__seat--left { left: 21%; transform: rotate(4deg); }
.cockpit__seat--right { right: 21%; transform: rotate(-4deg); }

.workspace-furniture--rear-left { top: 27%; left: 2%; }
.workspace-furniture--rear-right { top: 27%; right: 2%; }
.workspace-furniture--left-rear { top: 20%; left: 4%; }
.workspace-furniture--left-front { bottom: 12%; left: 7%; }
.workspace-furniture--right-rear { top: 20%; right: 4%; }
.workspace-furniture--right-front { right: 7%; bottom: 12%; }

.base-companion {
  position: absolute;
  z-index: 12;
  bottom: 10%;
  left: 50%;
  width: 132px;
  height: 194px;
  padding: 0 12px 21px;
  transform: translateX(-50%);
  border: 0;
  background: transparent;
  color: rgba(230, 238, 241, 0.72);
  cursor: pointer;
}

.base-companion::before {
  position: absolute;
  z-index: -1;
  right: 19%;
  bottom: 16%;
  left: 19%;
  height: 54%;
  border: 1px solid rgba(164, 185, 194, 0.2);
  border-radius: 24px 24px 7px 7px;
  background: linear-gradient(100deg, #10181e, #303c42 48%, #10181e);
  box-shadow: 0 16px 18px rgba(0, 0, 0, 0.34);
  content: "";
}

.base-companion::after {
  position: absolute;
  z-index: -2;
  bottom: 3%;
  left: 50%;
  width: 76%;
  height: 18%;
  transform: translateX(-50%);
  border-top: 3px solid #26343b;
  background: linear-gradient(90deg, transparent 5%, #25333a 6% 9%, transparent 10% 47%, #314049 48% 52%, transparent 53% 90%, #25333a 91% 94%, transparent 95%);
  content: "";
}

.base-companion > span:last-child {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  font-size: 0.64rem;
  opacity: 0;
  transition: opacity 160ms ease;
}

.base-companion:hover > span:last-child,
.base-companion:focus-visible > span:last-child { opacity: 1; }
.base-companion:focus-visible { border-radius: 12px; outline: 2px solid rgba(125, 211, 252, 0.68); }

.base-pet {
  position: absolute;
  z-index: 13;
  right: 30%;
  bottom: 11%;
  width: 84px;
  height: 70px;
  opacity: 0.78;
  padding: 0;
  border: 0;
  background: transparent;
  color: #d8e8e4;
  cursor: pointer;
}

.base-pet__body,
.base-pet__head,
.base-pet__tail { position: absolute; display: block; }
.base-pet__body {
  right: 12%;
  bottom: 17px;
  width: 54px;
  height: 34px;
  border-radius: 50% 50% 42% 45%;
  background: linear-gradient(135deg, #7b8e8b, #354743);
}
.base-pet__body i { position: absolute; bottom: -8px; width: 7px; height: 16px; border-radius: 3px; background: #405752; }
.base-pet__body i:first-child { left: 11px; }
.base-pet__body i:last-child { right: 10px; }
.base-pet__head {
  right: 1%;
  bottom: 31px;
  width: 31px;
  height: 29px;
  border-radius: 44%;
  background: #687b77;
}
.base-pet__head i { position: absolute; top: -7px; width: 11px; height: 14px; background: #566b66; clip-path: polygon(50% 0, 100% 100%, 0 100%); }
.base-pet__head i:first-child { left: 0; transform: rotate(-15deg); }
.base-pet__head i:nth-child(2) { right: 0; transform: rotate(15deg); }
.base-pet__head b { position: absolute; top: 11px; width: 4px; height: 4px; border-radius: 50%; background: #122127; }
.base-pet__head b:nth-child(3) { left: 7px; }
.base-pet__head b:last-child { right: 7px; }
.base-pet__tail {
  bottom: 25px;
  left: 7px;
  width: 35px;
  height: 14px;
  border-top: 7px solid #6f9389;
  border-radius: 60% 0 0;
  transform-origin: 100% 50%;
  animation: pet-tail 3.8s ease-in-out infinite;
}
.base-pet small { position: absolute; right: 0; bottom: -4px; left: 0; font-size: 0.56rem; opacity: 0; }
.base-pet:hover small,
.base-pet:focus-visible small,
.base-pet--greeting small { opacity: 0.82; }
.base-pet:focus-visible { border-radius: 12px; outline: 2px solid rgba(138, 230, 198, 0.65); }
.base-pet--greeting { animation: pet-hop 440ms ease-in-out 2 alternate; }

.room-door {
  position: absolute;
  z-index: 11;
  right: 2.5%;
  bottom: 11%;
  display: grid;
  width: 116px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #dce8e9;
  text-align: center;
  cursor: pointer;
  gap: 2px;
}

.base-stage--workshop .room-door { right: auto; left: 50%; bottom: 8%; transform: translateX(-50%); }

.room-door__frame {
  position: relative;
  display: block;
  width: 84px;
  height: 126px;
  margin: 0 auto 7px;
  border: 7px solid #3c4d54;
  border-bottom: 0;
  border-radius: 10px 10px 0 0;
  background: linear-gradient(160deg, #101c23, #050a0e);
  box-shadow: inset 0 0 20px rgba(107, 196, 200, 0.12), 0 12px 18px rgba(0, 0, 0, 0.3);
}
.room-door__frame i { position: absolute; top: 18px; right: 8px; width: 3px; height: 28px; border-radius: 1px; background: #62bad0; box-shadow: 0 0 9px rgba(98, 186, 208, 0.66); }
.room-door strong { font-size: 0.7rem; font-weight: 620; }
.room-door small { color: rgba(203, 222, 225, 0.54); font-size: 0.55rem; text-transform: uppercase; letter-spacing: 0.08em; }
.room-door:hover .room-door__frame,
.room-door:focus-visible .room-door__frame { border-color: #7b979b; filter: brightness(1.12); }
.room-door:focus-visible { outline: 0; }

.workshop-sign {
  position: absolute;
  z-index: 4;
  top: 12%;
  left: 50%;
  display: grid;
  width: 230px;
  padding: 17px;
  transform: translateX(-50%);
  border: 1px solid rgba(193, 231, 234, 0.19);
  border-radius: 8px;
  background: rgba(24, 44, 48, 0.54);
  text-align: center;
  box-shadow: inset 0 0 22px rgba(95, 183, 188, 0.09);
}
.workshop-sign span { font-size: 0.76rem; font-weight: 650; letter-spacing: 0.18em; text-transform: uppercase; }
.workshop-sign small { margin-top: 4px; color: rgba(200, 222, 224, 0.5); font-size: 0.56rem; }

.selection-note {
  position: absolute;
  z-index: 18;
  bottom: 2.5%;
  left: 50%;
  display: grid;
  min-width: 220px;
  margin: 0;
  padding: 8px 14px;
  transform: translateX(-50%);
  border: 1px solid rgba(196, 226, 230, 0.16);
  border-radius: 999px;
  background: rgba(10, 19, 24, 0.74);
  text-align: center;
  backdrop-filter: blur(10px);
}
.selection-note strong { font-size: 0.65rem; font-weight: 620; }
.selection-note span { color: rgba(198, 216, 220, 0.53); font-size: 0.55rem; }

.base-status {
  position: relative;
  z-index: 2;
  display: grid;
  place-items: center;
  color: #a9bdc4;
  font-size: 0.75rem;
}
.base-status__signal { width: 36px; height: 36px; border: 1px solid rgba(129, 209, 210, 0.25); border-top-color: #81d1d2; border-radius: 50%; animation: spin 1.2s linear infinite; }
.base-status button { padding: 7px 12px; border: 1px solid rgba(220, 236, 239, 0.2); border-radius: 8px; background: transparent; cursor: pointer; }

@keyframes base-arrival { from { opacity: 0; transform: scale(0.94); filter: blur(8px); } }
@keyframes star-breathe { to { opacity: 0.38; transform: scale(0.72); } }
@keyframes pet-tail { 50% { transform: rotate(-18deg); } }
@keyframes pet-hop { to { transform: translateY(-6px); } }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1220px) {
  .base-environment { width: 88vw; }
  .base-pet { right: 27%; }
}

@media (prefers-reduced-motion: reduce) {
  .base-environment,
  .base-stage__cosmos i,
  .base-pet__tail,
  .base-pet--greeting,
  .base-status__signal { animation: none; }
}
</style>
