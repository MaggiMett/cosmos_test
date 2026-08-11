<template>
  <div class="theme-import" data-testid="theme-package-import-review">
    <button
      class="theme-import__backdrop"
      type="button"
      aria-label="Close Theme Pack import"
      :disabled="status === 'importing'"
      @click="$emit('close')"
    />
    <section
      class="theme-import__panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-import-title"
      :aria-busy="status === 'importing'"
    >
      <header>
        <div>
          <p>Theme Package Intake</p>
          <h2 id="theme-import-title">{{ title }}</h2>
        </div>
        <button
          type="button"
          class="theme-import__close"
          aria-label="Close import review"
          :disabled="status === 'importing'"
          @click="$emit('close')"
        >
          ×
        </button>
      </header>

      <template v-if="status === 'success' && result">
        <div class="theme-import__status theme-import__status--success">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>Theme installed</strong>
            <p>Theme installed. Reload Cosmos to make it available.</p>
          </div>
        </div>
        <dl class="theme-import__result">
          <div class="theme-import__result-name">
            <dt>Theme</dt>
            <dd>{{ result.themeName }}</dd>
            <small>{{ result.themeId }}</small>
          </div>
          <div><dt>Package ID</dt><dd>{{ result.packageId }}</dd></div>
          <div><dt>Package Version</dt><dd>{{ result.packageVersion }}</dd></div>
          <div><dt>Install Status</dt><dd>{{ result.installStatus }}</dd></div>
          <div><dt>Assets</dt><dd>{{ result.assets.total }}</dd></div>
          <div><dt>Integrity</dt><dd>{{ result.integrity.status }}</dd></div>
        </dl>
        <p class="theme-import__reload-note">
          Available after Cosmos reload. The current Theme remains active until you explicitly
          activate another registered Theme after restarting.
        </p>
      </template>

      <template v-else>
        <div v-if="file" class="theme-import__file">
          <span aria-hidden="true">ZIP</span>
          <div>
            <strong>{{ file.name }}</strong>
            <small>{{ formattedSize }}</small>
          </div>
          <em>{{ status === "ready" ? "Ready to inspect" : fileStatus }}</em>
        </div>

        <div
          v-if="status === 'error' && error"
          class="theme-import__status theme-import__status--error"
          role="alert"
        >
          <span aria-hidden="true">!</span>
          <div>
            <strong>{{ error.title }}</strong>
            <p>{{ error.message }}</p>
          </div>
        </div>

        <div v-if="status === 'importing'" class="theme-import__status">
          <span class="theme-import__spinner" aria-hidden="true" />
          <div>
            <strong>Importing…</strong>
            <p>Cosmos is securely inspecting and installing this Theme Pack.</p>
          </div>
        </div>

        <details v-if="error?.technicalCode" class="theme-import__details">
          <summary>Advanced details</summary>
          <code>{{ error.technicalCode }}</code>
          <ul v-if="error.diagnostics.length">
            <li v-for="diagnostic in error.diagnostics" :key="diagnostic.code">
              <code>{{ diagnostic.code }}</code>
              <span>{{ diagnostic.message }}</span>
            </li>
          </ul>
        </details>
      </template>

      <footer>
        <button
          v-if="status !== 'success'"
          type="button"
          class="theme-import__secondary"
          :disabled="status === 'importing'"
          @click="$emit('choose-another')"
        >
          Choose another ZIP
        </button>
        <button
          v-if="status === 'ready'"
          type="button"
          class="theme-import__primary"
          :disabled="!file"
          @click="$emit('import')"
        >
          Import Theme Pack
        </button>
        <button
          v-else-if="status === 'importing'"
          type="button"
          class="theme-import__primary"
          disabled
        >
          Importing…
        </button>
        <button
          v-else
          type="button"
          class="theme-import__primary"
          @click="$emit('close')"
        >
          {{ status === "success" ? "Done" : "Close" }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { ThemePackageImportSuccess } from "../../../runtime/themePackageImportApi";
import type {
  ThemeLibraryImportFailure,
  ThemeLibraryImportStatus,
} from "../themeLibraryImport";

const props = defineProps<{
  file: File | null;
  status: ThemeLibraryImportStatus;
  result: Readonly<ThemePackageImportSuccess> | null;
  error: Readonly<ThemeLibraryImportFailure> | null;
}>();

defineEmits<{
  close: [];
  import: [];
  "choose-another": [];
}>();

const title = computed(() => {
  if (props.status === "success") return "Import complete";
  if (props.status === "error") return "Import needs attention";
  return "Review Theme Pack";
});

const formattedSize = computed(() => {
  if (!props.file) return "";
  if (props.file.size < 1024) return `${props.file.size} B`;
  if (props.file.size < 1024 * 1024) return `${(props.file.size / 1024).toFixed(1)} KiB`;
  return `${(props.file.size / (1024 * 1024)).toFixed(1)} MiB`;
});

const fileStatus = computed(() => {
  if (props.status === "importing") return "Secure intake in progress";
  if (props.status === "error") return "Not installed";
  return "Selected";
});
</script>

<style scoped>
.theme-import {
  position: fixed;
  z-index: 80;
  inset: 0;
  display: grid;
  padding: 32px;
  place-items: center;
}

.theme-import__backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: rgba(1, 4, 8, 0.78);
  cursor: default;
  backdrop-filter: blur(12px);
}

.theme-import__panel {
  position: relative;
  display: grid;
  width: min(600px, calc(100vw - 64px));
  max-height: calc(100vh - 64px);
  padding: 24px;
  overflow: auto;
  border: 1px solid rgba(164, 196, 210, 0.22);
  border-radius: var(--cosmos-radius-panel);
  background:
    radial-gradient(circle at 78% 0%, rgba(77, 145, 174, 0.13), transparent 34%),
    linear-gradient(145deg, rgba(12, 20, 31, 0.98), rgba(5, 10, 17, 0.99));
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.58);
  color: var(--cosmos-color-text);
  box-sizing: border-box;
  gap: 20px;
}

.theme-import__panel > header,
.theme-import__panel > footer,
.theme-import__file,
.theme-import__status {
  display: flex;
  align-items: center;
}

.theme-import__panel > header {
  justify-content: space-between;
  gap: 20px;
}

.theme-import__panel > header p,
.theme-import__status p,
.theme-import__reload-note {
  margin: 0;
}

.theme-import__panel > header p {
  color: var(--cosmos-color-accent);
  font-size: 0.58rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.theme-import__panel h2 {
  margin: 5px 0 0;
  color: #eadfce;
  font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  font-size: 1.75rem;
  font-weight: 400;
}

.theme-import__panel button {
  min-height: 40px;
  border: 1px solid var(--cosmos-color-border);
  border-radius: var(--cosmos-radius-control);
  background: rgba(255, 255, 255, 0.025);
  color: var(--cosmos-color-text);
  cursor: pointer;
}

.theme-import__panel button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.theme-import__close {
  width: 38px;
  padding: 0;
  font-size: 1.25rem;
}

.theme-import__file {
  min-height: 78px;
  padding: 12px 14px;
  border: 1px solid var(--cosmos-color-border);
  border-radius: var(--cosmos-radius-card);
  background: rgba(255, 255, 255, 0.018);
  gap: 13px;
}

.theme-import__file > span,
.theme-import__status > span {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgba(116, 188, 217, 0.32);
  border-radius: 50%;
  color: #a9d7e8;
  font-size: 0.58rem;
}

.theme-import__file > div {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.theme-import__file strong,
.theme-import__file small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.theme-import__file strong {
  font-size: 0.76rem;
  font-weight: 520;
}

.theme-import__file small,
.theme-import__file em {
  color: var(--cosmos-color-muted);
  font-size: 0.62rem;
  font-style: normal;
}

.theme-import__file em {
  margin-left: auto;
}

.theme-import__status {
  padding: 14px;
  border: 1px solid rgba(119, 190, 221, 0.18);
  border-radius: var(--cosmos-radius-card);
  background: rgba(53, 112, 139, 0.08);
  gap: 13px;
}

.theme-import__status strong {
  font-size: 0.76rem;
  font-weight: 540;
}

.theme-import__status p {
  margin-top: 4px;
  color: #aab7bd;
  font-size: 0.68rem;
  line-height: 1.5;
}

.theme-import__status--success {
  border-color: rgba(105, 183, 158, 0.24);
  background: rgba(57, 124, 104, 0.1);
}

.theme-import__status--error {
  border-color: rgba(199, 149, 120, 0.28);
  background: rgba(95, 57, 43, 0.14);
}

.theme-import__spinner {
  border-color: rgba(116, 188, 217, 0.2) !important;
  border-top-color: #8fc8df !important;
  animation: theme-import-spin 900ms linear infinite;
}

.theme-import__result {
  display: grid;
  margin: 0;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.theme-import__result > div {
  display: grid;
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--cosmos-color-border);
  border-radius: var(--cosmos-radius-control);
  background: rgba(255, 255, 255, 0.015);
  gap: 4px;
}

.theme-import__result-name {
  grid-column: 1 / -1;
}

.theme-import__result dt {
  color: var(--cosmos-color-muted);
  font-size: 0.56rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.theme-import__result dd {
  margin: 0;
  overflow: hidden;
  color: #dfd8ca;
  font-size: 0.76rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.theme-import__result small {
  color: var(--cosmos-color-muted);
  font-size: 0.6rem;
}

.theme-import__reload-note {
  padding: 12px 14px;
  border-left: 2px solid rgba(119, 190, 221, 0.52);
  color: #aebcc2;
  font-size: 0.68rem;
  line-height: 1.55;
}

.theme-import__details {
  color: var(--cosmos-color-muted);
  font-size: 0.62rem;
}

.theme-import__details summary {
  cursor: pointer;
}

.theme-import__details > code,
.theme-import__details li {
  display: block;
  margin-top: 8px;
}

.theme-import__details ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.theme-import__details li {
  display: grid;
  gap: 3px;
}

.theme-import__panel > footer {
  justify-content: flex-end;
  gap: 10px;
}

.theme-import__panel > footer button {
  min-width: 146px;
  padding: 0 16px;
  font-size: 0.68rem;
}

.theme-import__primary {
  border-color: rgba(119, 190, 221, 0.66) !important;
  background: linear-gradient(180deg, rgba(71, 128, 162, 0.3), rgba(33, 70, 95, 0.23)) !important;
  box-shadow: 0 0 20px rgba(98, 200, 234, 0.1);
}

@keyframes theme-import-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .theme-import__spinner {
    animation: none;
  }
}
</style>
