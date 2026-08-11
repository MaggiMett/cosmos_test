<template>
  <section
    class="theme-library-view environment-view"
    :aria-busy="presentation.phase === 'loading'"
    data-testid="theme-library-view"
  >
    <div class="theme-library-view__stars" aria-hidden="true" />
    <ThemeLibrarySystemHeader @import="openImportPicker" @builder="openThemeBuilder" @travel="travelFromLibrary" />

    <input
      ref="importInput"
      class="theme-library-view__file-input"
      type="file"
      accept=".zip,application/zip"
      tabindex="-1"
      aria-label="Choose Theme Pack ZIP"
      data-testid="theme-package-file-input"
      @change="selectImportFile"
    />

    <main class="theme-library-view__content">
      <header class="theme-library-view__heading">
        <div>
          <h1>Theme Library</h1>
          <p>
            Your installed worlds, ready to revisit.
            <span>{{ themeCount }} {{ themeCount === 1 ? "theme" : "themes" }}</span>
          </p>
        </div>
        <p
          v-if="activationError"
          class="theme-library-view__activation-error"
          role="alert"
          data-testid="theme-library-activation-error"
        >
          {{ activationError.message }}
        </p>
      </header>

      <template v-if="presentation.phase === 'success'">
        <ThemeLibraryHero :theme="presentation.activeTheme" @builder="openThemeBuilder" />
        <ThemeLibraryFilters />
        <section class="theme-library-view__collection" aria-labelledby="installed-themes-title">
          <div class="theme-library-view__gallery">
            <h2 id="installed-themes-title">Installed Themes</h2>
            <ThemeLibraryGallery
              :themes="presentation.themes"
              :activating-theme-id="activatingThemeId"
              @activate="activateTheme"
              @builder="openThemeBuilder"
            />
          </div>
          <ThemeLibraryDetails
            :theme="presentation.activeTheme"
            :activating-theme-id="activatingThemeId"
            @activate="activateTheme"
            @builder="openThemeBuilder"
          />
        </section>
      </template>

      <ThemeLibraryEmptyState v-else-if="presentation.phase === 'empty'" @import="openImportPicker" @builder="openThemeBuilder" />
      <ThemeLibraryRuntimeState
        v-else
        :phase="presentation.phase"
        :message="presentation.phase === 'error' ? presentation.message : undefined"
        :active-theme-id="
          presentation.phase === 'active-missing' ? presentation.activeThemeId : undefined
        "
      />
    </main>

    <ThemePackageImportReview
      v-if="themeImport.importStatus.value !== 'idle'"
      :file="themeImport.selectedFile.value"
      :status="themeImport.importStatus.value"
      :result="themeImport.importResult.value"
      :error="themeImport.importError.value"
      @close="themeImport.reset"
      @choose-another="openImportPicker"
      @import="themeImport.importSelected"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import { useCosmosRuntime } from "../../runtime/plugin";
import { ThemePackageImportApi } from "../../runtime/themePackageImportApi";
import ThemeLibraryDetails from "./components/ThemeLibraryDetails.vue";
import ThemeLibraryEmptyState from "./components/ThemeLibraryEmptyState.vue";
import ThemeLibraryFilters from "./components/ThemeLibraryFilters.vue";
import ThemeLibraryGallery from "./components/ThemeLibraryGallery.vue";
import ThemeLibraryHero from "./components/ThemeLibraryHero.vue";
import ThemeLibraryRuntimeState from "./components/ThemeLibraryRuntimeState.vue";
import ThemeLibrarySystemHeader from "./components/ThemeLibrarySystemHeader.vue";
import ThemePackageImportReview from "./components/ThemePackageImportReview.vue";
import { useThemeLibraryActivation } from "./themeLibraryActivation";
import { useThemeLibraryImport } from "./themeLibraryImport";
import {
  loadThemeLibrarySnapshot,
  projectThemeLibrarySnapshot,
  type ThemeLibraryPresentation,
} from "./themeLibraryProjection";

const runtime = useCosmosRuntime();
const router = useRouter();
const importInput = ref<HTMLInputElement | null>(null);
const presentation = ref<ThemeLibraryPresentation>({ phase: "loading" });
const themeCount = computed(() =>
  "themeCount" in presentation.value ? presentation.value.themeCount : 0,
);
const { activatingThemeId, activationError, activate } = useThemeLibraryActivation(runtime.themes);
const themeImport = useThemeLibraryImport(new ThemePackageImportApi(runtime.api));

function openImportPicker(): void {
  if (themeImport.importStatus.value === "importing") return;
  importInput.value?.click();
}

function openThemeBuilder(): void {
  void router.push({ name: "theme-builder" });
}

function selectImportFile(event: Event): void {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.item(0) ?? null;
  if (file) themeImport.selectFile(file);
  input.value = "";
}

function travelFromLibrary(destinationId: string): void {
  if (destinationId === "cosmos") {
    void router.push({ name: "cosmos" });
  } else if (destinationId === "base") {
    void router.push({ name: "base" });
  }
}

async function activateTheme(themeId: string): Promise<void> {
  const current = presentation.value;
  if (current.phase !== "success") return;

  await activate(
    themeId,
    current.activeTheme.themeId === themeId,
    (nextPresentation) => {
      presentation.value = nextPresentation;
    },
  );
}

onMounted(async () => {
  try {
    const snapshot = await loadThemeLibrarySnapshot(runtime.themes);
    presentation.value = projectThemeLibrarySnapshot(snapshot);
  } catch (error) {
    presentation.value = {
      phase: "error",
      message: error instanceof Error ? error.message : "Theme Runtime is unavailable.",
    };
  }
});
</script>

<style scoped>
.theme-library-view {
  overflow: hidden;
  background:
    radial-gradient(ellipse at 52% 4%, rgba(34, 83, 112, 0.16), transparent 30%),
    radial-gradient(ellipse at 10% 26%, rgba(22, 55, 78, 0.11), transparent 28%),
    linear-gradient(145deg, #02050a, #040a11 58%, #02050a);
  color: var(--cosmos-color-text);
}

.theme-library-view__stars {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle, rgba(220, 234, 240, 0.28) 0 0.6px, transparent 1px),
    radial-gradient(circle, rgba(98, 200, 234, 0.19) 0 0.7px, transparent 1.1px);
  background-position: 7px 17px, 48px 73px;
  background-size: 91px 91px, 151px 151px;
  opacity: 0.25;
  pointer-events: none;
}

.theme-library-view__file-input {
  position: fixed;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.theme-library-view__content {
  position: relative;
  z-index: 2;
  display: grid;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 76px 34px 24px;
  grid-template-rows: 68px 252px 42px minmax(0, 1fr);
  box-sizing: border-box;
  gap: 12px;
}

.theme-library-view__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.theme-library-view__activation-error {
  max-width: 440px;
  padding: 8px 12px;
  border: 1px solid rgba(199, 149, 120, 0.28);
  border-radius: var(--cosmos-radius-control);
  background: rgba(95, 57, 43, 0.16);
  color: #d4b4a2;
  font-size: 0.64rem;
  line-height: 1.4;
}

.theme-library-view__heading h1,
.theme-library-view__collection h2 {
  margin: 0;
  color: #eadfce;
  font-family: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  font-weight: 400;
}

.theme-library-view__heading h1 {
  font-size: 2.25rem;
  line-height: 1;
}

.theme-library-view__heading p {
  margin: 8px 0 0;
  color: #b5c0c5;
  font-size: 0.72rem;
}

.theme-library-view__heading p span {
  margin-left: 18px;
  color: var(--cosmos-color-muted);
  font-size: 0.64rem;
}

.theme-library-view__collection {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-columns: minmax(0, 1fr) 446px;
  gap: 24px;
}

.theme-library-view__gallery {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-rows: 28px minmax(0, 1fr);
}

.theme-library-view__collection h2 {
  align-self: center;
  font-size: 1.03rem;
}

.theme-library-view__content > :deep(.theme-library-empty) {
  grid-row: 2 / -1;
}

.theme-library-view__content > :deep(.theme-library-runtime-state) {
  grid-row: 2 / -1;
}

@media (max-width: 1280px) {
  .theme-library-view__content {
    padding-inline: 24px;
  }

  .theme-library-view__collection {
    grid-template-columns: minmax(0, 1fr) 390px;
    gap: 16px;
  }
}
</style>
