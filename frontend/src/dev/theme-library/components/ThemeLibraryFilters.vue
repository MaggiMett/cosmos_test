<template>
  <section class="theme-library-filters" aria-label="Theme filters" data-testid="theme-library-filters">
    <label class="theme-library-filters__search">
      <span aria-hidden="true">⌕</span>
      <span class="theme-library-visually-hidden">Search themes</span>
      <input type="search" placeholder="Search installed themes" />
    </label>
    <button v-for="filter in filters" :key="filter" type="button">
      {{ filter }} <span aria-hidden="true">⌄</span>
    </button>
  </section>
</template>

<script setup lang="ts">
const filters = ["Category", "Installed", "Favorites", "Recently Used", "Creator"] as const;
</script>

<style scoped>
.theme-library-filters {
  display: grid;
  width: min(100%, 990px);
  min-width: 0;
  grid-template-columns: 310px 118px 118px 118px 142px 118px;
  gap: 10px;
}

.theme-library-filters__search,
.theme-library-filters button {
  min-width: 0;
  border: 1px solid var(--cosmos-color-border);
  border-radius: var(--cosmos-radius-control);
  background: rgba(7, 13, 22, 0.78);
  color: var(--cosmos-color-muted);
}

.theme-library-filters__search {
  display: flex;
  align-items: center;
  padding: 0 13px;
  gap: 8px;
}

.theme-library-filters__search > span:first-child {
  color: #d6dfe3;
  font-size: 1.1rem;
}

.theme-library-filters input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--cosmos-color-text);
  font-size: 0.68rem;
}

.theme-library-filters input::placeholder {
  color: var(--cosmos-color-muted);
}

.theme-library-filters button {
  display: flex;
  padding: 0 13px;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-size: 0.65rem;
}

.theme-library-filters button:nth-of-type(2) {
  border-color: rgba(98, 200, 234, 0.48);
  background: rgba(98, 200, 234, 0.08);
  color: var(--cosmos-color-text);
}

.theme-library-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
</style>
