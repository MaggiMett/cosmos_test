<template>
  <span class="companion-avatar" :class="`companion-avatar--${mode}`" aria-hidden="true">
    <span v-if="notificationAvailable" class="companion-avatar__notification">!</span>
    <span v-if="mode === 'seated'" class="companion-avatar__body">
      <i class="companion-avatar__arm companion-avatar__arm--left" />
      <i class="companion-avatar__arm companion-avatar__arm--right" />
      <i class="companion-avatar__leg companion-avatar__leg--left" />
      <i class="companion-avatar__leg companion-avatar__leg--right" />
    </span>
    <span class="companion-avatar__helmet">
      <span class="companion-avatar__visor">
        <span class="companion-avatar__face">
          <i class="companion-avatar__eye companion-avatar__eye--left" />
          <i class="companion-avatar__eye companion-avatar__eye--right" />
          <i class="companion-avatar__smile" />
        </span>
        <span class="companion-avatar__reflection" />
      </span>
      <span class="companion-avatar__collar" />
    </span>
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{ mode?: "compact" | "seated"; notificationAvailable?: boolean }>(),
  { mode: "compact", notificationAvailable: false },
);
</script>

<style scoped>
.companion-avatar {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
}

.companion-avatar__notification {
  position: absolute;
  z-index: 8;
  top: -2%;
  right: 2%;
  display: grid;
  width: 22%;
  min-width: 16px;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid rgba(182, 222, 238, 0.52);
  border-radius: 50%;
  background: #0b1721;
  box-shadow: 0 0 12px rgba(98, 200, 234, 0.42);
  color: var(--cosmos-color-accent, #62c8ea);
  font-size: clamp(0.58rem, 42%, 0.8rem);
  font-weight: 800;
}

.companion-avatar__helmet {
  position: absolute;
  z-index: 2;
  inset: 4%;
  border: 1px solid rgba(190, 210, 219, 0.48);
  border-radius: 49% 49% 45% 45%;
  background:
    radial-gradient(circle at 33% 24%, rgba(255, 255, 255, 0.2), transparent 18%),
    linear-gradient(145deg, #6f7b83 0 16%, #303d47 44%, #111a22 82%);
  box-shadow: 0 0 28px rgba(72, 159, 192, 0.13), inset -9px -12px 18px rgba(0, 0, 0, 0.42), inset 2px 2px rgba(255, 255, 255, 0.12);
  transition: filter 160ms ease, transform 160ms ease;
}

.companion-avatar__visor {
  position: absolute;
  inset: 11% 9% 17%;
  overflow: hidden;
  border: 1px solid rgba(122, 186, 210, 0.38);
  border-radius: 48% 48% 43% 43%;
  background: radial-gradient(circle at 48% 50%, rgba(35, 62, 75, 0.76), #050b10 76%);
  box-shadow: inset 0 0 18px rgba(70, 162, 194, 0.14), 0 0 0 1px rgba(0, 0, 0, 0.36);
}

.companion-avatar__face {
  position: absolute;
  inset: 17% 17% 12%;
  border-radius: 52% 52% 46% 46% / 42% 42% 58% 58%;
  background:
    radial-gradient(circle at 48% 28%, rgba(231, 241, 239, 0.3), transparent 21%),
    linear-gradient(152deg, #aab6b5, #687775 62%, #414d4d);
  box-shadow: inset -5px -7px 9px rgba(16, 27, 29, 0.28);
}

.companion-avatar__eye {
  position: absolute;
  top: 34%;
  width: 22%;
  height: 28%;
  border-radius: 68% 32% 64% 36%;
  background: radial-gradient(circle at 38% 34%, rgba(165, 222, 238, 0.32) 0 4%, #071015 18%, #010305 78%);
  box-shadow: inset 0 0 5px #000, 0 0 5px rgba(78, 165, 192, 0.12);
  animation: companion-blink 6.5s infinite;
}

.companion-avatar__eye--left { left: 18%; rotate: 13deg; }
.companion-avatar__eye--right { right: 18%; rotate: -13deg; }

.companion-avatar__smile {
  position: absolute;
  bottom: 15%;
  left: 42%;
  width: 16%;
  height: 5%;
  border-top: 1px solid rgba(24, 37, 38, 0.62);
  border-radius: 50%;
}

.companion-avatar__reflection {
  position: absolute;
  top: 9%;
  left: 14%;
  width: 36%;
  height: 13%;
  transform: rotate(-15deg);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.13);
}

.companion-avatar__collar {
  position: absolute;
  z-index: -1;
  right: 18%;
  bottom: -10%;
  left: 18%;
  height: 30%;
  border: 1px solid rgba(170, 196, 207, 0.22);
  border-radius: 12px 12px 5px 5px;
  background: linear-gradient(90deg, #202d37, #71808a 45%, #202d37);
}

.companion-avatar--seated .companion-avatar__helmet {
  inset: 0 18% 42%;
}

.companion-avatar__body {
  position: absolute;
  z-index: 1;
  right: 24%;
  bottom: 12%;
  left: 24%;
  height: 48%;
  border: 1px solid rgba(181, 205, 214, 0.34);
  border-radius: 38% 38% 22% 22%;
  background:
    linear-gradient(90deg, transparent 47%, rgba(126, 179, 196, 0.28) 48% 51%, transparent 52%),
    linear-gradient(155deg, #596772, #222f39 72%);
  box-shadow: inset -8px -8px 12px rgba(4, 10, 15, 0.34);
}

.companion-avatar__arm,
.companion-avatar__leg {
  position: absolute;
  border: 1px solid rgba(174, 201, 211, 0.2);
  background: linear-gradient(155deg, #53636e, #202d36);
}

.companion-avatar__arm {
  top: 18%;
  width: 28%;
  height: 56%;
  border-radius: 999px;
}

.companion-avatar__arm--left { left: -18%; transform: rotate(18deg); }
.companion-avatar__arm--right { right: -18%; transform: rotate(-18deg); }

.companion-avatar__leg {
  bottom: -18%;
  width: 42%;
  height: 34%;
  border-radius: 8px 8px 18px 18px;
}

.companion-avatar__leg--left { left: 4%; transform: rotate(18deg); }
.companion-avatar__leg--right { right: 4%; transform: rotate(-18deg); }

@keyframes companion-blink {
  0%, 46%, 50%, 100% { transform: scaleY(1); }
  48% { transform: scaleY(0.12); }
}

@media (prefers-reduced-motion: reduce) {
  .companion-avatar__eye { animation: none; }
}
</style>
