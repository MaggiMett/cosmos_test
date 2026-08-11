<template>
  <button type="button" class="asset-shelf-bar" data-testid="asset-shelf-bar">
    <span>Asset Shelf</span>
    <span aria-hidden="true">⌃</span>
  </button>
</template>

<style scoped>
.asset-shelf-bar {
  display: flex;
  width: 100%;
  min-height: 44px;
  padding: 0 18px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--builder-border);
  border-radius: var(--builder-radius-control);
  background: rgba(13, 18, 23, 0.7);
  color: var(--builder-text);
  cursor: pointer;
  font-size: 0.72rem;
  gap: 16px;
  transition:
    border-color var(--builder-control-transition),
    background var(--builder-control-transition);
}

.asset-shelf-bar:hover {
  border-color: var(--builder-border-strong);
  background: var(--builder-surface);
}

.asset-shelf-bar span:last-child {
  color: var(--builder-muted);
}
</style>
