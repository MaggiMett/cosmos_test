<template>
  <svg
    class="builder-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'spark'">
      <path d="M12 2c.7 5.1 2.9 8.1 7 10-4.1 1.9-6.3 4.9-7 10-.7-5.1-2.9-8.1-7-10 4.1-1.9 6.3-4.9 7-10Z" />
    </template>
    <template v-else-if="name === 'board'">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </template>
    <template v-else-if="name === 'library'">
      <path d="M4 4.5c3.1-.8 5.8-.3 8 1.5v14c-2.2-1.8-4.9-2.3-8-1.5v-14Z" />
      <path d="M20 4.5c-3.1-.8-5.8-.3-8 1.5v14c2.2-1.8 4.9-2.3 8-1.5v-14Z" />
    </template>
    <template v-else-if="name === 'templates'">
      <path d="M6 3h9l3 3v15H6V3Z" />
      <path d="M15 3v4h4M9 12h6M9 16h5" />
    </template>
    <template v-else-if="name === 'looks'">
      <path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 0-4h-1.1a1.8 1.8 0 0 1 0-3.6H15A6 6 0 0 0 12 3Z" />
      <path d="M7.5 10h.01M9.5 6.8h.01M14 6.5h.01M17 9h.01" />
    </template>
    <template v-else-if="name === 'showcase'">
      <rect x="3" y="4" width="18" height="13" rx="1.5" />
      <path d="M8 21h8M12 17v4M8 8l3 2.5L8 13V8Z" />
    </template>
    <template v-else-if="name === 'release'">
      <path d="m13 3 8 8-4 1-5 8-1-7-7-1 8-5 1-4Z" />
    </template>
    <template v-else-if="name === 'check'">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </template>
    <template v-else-if="name === 'undo'">
      <path d="m9 7-5 5 5 5M4 12h9a6 6 0 0 1 6 6" />
    </template>
    <template v-else-if="name === 'redo'">
      <path d="m15 7 5 5-5 5M20 12h-9a6 6 0 0 0-6 6" />
    </template>
    <template v-else-if="name === 'eye'">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.7" />
    </template>
    <template v-else-if="name === 'chevron'">
      <path d="m9 5 7 7-7 7" />
    </template>
    <template v-else-if="name === 'room'">
      <path d="m3 10 9-7 9 7v10H3V10Z" />
      <path d="M9 20v-7h6v7" />
    </template>
    <template v-else-if="name === 'object'">
      <path d="m12 2 8 4.5v11L12 22l-8-4.5v-11L12 2Z" />
      <path d="m4 6.5 8 4.5 8-4.5M12 11v11" />
    </template>
    <template v-else-if="name === 'window'">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 3v18M3 12h18" />
    </template>
    <template v-else-if="name === 'material'">
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
    </template>
    <template v-else-if="name === 'motion'">
      <path d="M4 17c3-8 5 2 8-6s5 2 8-5" />
      <circle cx="4" cy="17" r="1.5" />
      <circle cx="12" cy="11" r="1.5" />
      <circle cx="20" cy="6" r="1.5" />
    </template>
    <template v-else>
      <circle cx="12" cy="12" r="8" />
    </template>
  </svg>
</template>

<script setup lang="ts">
defineProps<{ name: string }>();
</script>

<style scoped>
.builder-icon {
  display: block;
  width: 1.35rem;
  height: 1.35rem;
  stroke-width: 1.45;
}
</style>
