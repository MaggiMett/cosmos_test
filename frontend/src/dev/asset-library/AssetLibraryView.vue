<template>
  <main class="asset-library" data-testid="asset-library-prototype">
    <header class="asset-library__header">
      <div class="asset-library__identity">
        <span class="asset-library__eyebrow">Development Preview</span>
        <div>
          <h1>Asset Library</h1>
          <p>Browse &amp; Manage · Runtime-backed static Asset Catalog</p>
        </div>
      </div>
      <input
        ref="fileInput"
        class="sr-only"
        type="file"
        accept=".png,.webp,.svg,image/png,image/webp,image/svg+xml"
        multiple
        data-testid="asset-import-input"
        @change="importSelectedFiles"
      />
      <button
        v-if="returnBuilderProjectId"
        type="button"
        class="asset-library__return"
        @click="returnToBuilder"
      >
        ← {{ returnBuilderLabel }}
      </button>
      <button
        type="button"
        class="asset-library__import"
        :disabled="importing"
        data-testid="asset-import-action"
        @click="fileInput?.click()"
      >
        {{ importing ? "Reviewing…" : "Import assets" }}
      </button>
      <div class="asset-library__context" aria-label="Library context">
        <span>Current Theme</span>
        <strong>{{ prototypeState?.currentTheme || "Not selected" }}</strong>
      </div>
    </header>

    <div v-if="loading" class="asset-library__state" role="status">
      <span class="asset-library__spinner" aria-hidden="true" />
      Loading the persistent Asset Catalog…
    </div>
    <div v-else-if="loadError" class="asset-library__state asset-library__state--error" role="alert">
      <strong>The Asset Catalog could not be loaded.</strong>
      <span>{{ loadError }}</span>
      <button type="button" @click="reloadLibrary">Retry</button>
    </div>

    <div
      v-else-if="prototypeState"
      class="asset-library__body"
      :class="{ 'asset-library__body--detail': selectedItem }"
    >
      <nav class="library-nav" aria-label="Asset Library views">
        <div
          v-for="group in navigationGroups"
          :key="group"
          class="library-nav__group"
        >
          <span>{{ group }}</span>
          <button
            v-for="view in viewsForGroup(group)"
            :key="view.id"
            type="button"
            :class="{ active: selectedView === view.id }"
            :aria-current="selectedView === view.id ? 'page' : undefined"
            @click="selectView(view.id)"
          >
            <span>{{ view.label }}</span>
            <span
              v-if="view.id === 'drafts' || view.id === 'needs-attention'"
              class="library-nav__count"
              :aria-label="`${viewCount(view.id)} items`"
            >
              {{ viewCount(view.id) }}
            </span>
          </button>
        </div>

        <div class="library-nav__boundary">
          <span aria-hidden="true">◇</span>
          <p>Catalog discovery only</p>
          <small>No placement, interaction or function behavior.</small>
        </div>
      </nav>

      <section class="library-main" aria-labelledby="library-view-title">
        <div class="library-main__mobile-view">
          <label for="asset-library-view">View</label>
          <select
            id="asset-library-view"
            :value="selectedView"
            @change="selectViewFromEvent"
          >
            <option v-for="view in ASSET_LIBRARY_VIEWS" :key="view.id" :value="view.id">
              {{ view.label }}
            </option>
          </select>
        </div>

        <header class="library-main__heading">
          <div>
            <span>{{ activeView.group }}</span>
            <h2 id="library-view-title">{{ activeView.label }}</h2>
          </div>
          <p>
            <strong>{{ results.length }}</strong>
            {{ results.length === 1 ? "item" : "items" }}
          </p>
        </header>

        <div v-if="operationMessage" class="library-operation" role="status">
          {{ operationMessage }}
        </div>
        <div v-if="importError" class="library-operation library-operation--error" role="alert">
          <strong>Import needs attention.</strong>
          {{ importError }}
          <button type="button" @click="fileInput?.click()">Choose another file</button>
        </div>

        <div class="discovery-toolbar" aria-label="Search and filters">
          <label class="search-control">
            <span class="sr-only">Search this Asset Library view</span>
            <span aria-hidden="true">⌕</span>
            <input
              ref="searchInput"
              v-model="search"
              type="search"
              autocomplete="off"
              placeholder="Search name, category, tags or ID…"
              data-testid="asset-library-search"
              @keydown.esc.prevent="clearSearch"
            />
            <kbd>/</kbd>
          </label>

          <div class="filter-row" aria-label="Asset filters">
            <label>
              <span>Category</span>
              <select v-model="filters.category" data-testid="filter-category">
                <option value="">All categories</option>
                <option
                  v-for="category in categoryOptions"
                  :key="category"
                  :value="category"
                >
                  {{ humanizeAssetValue(category) }}
                </option>
              </select>
            </label>
            <label>
              <span>Scope</span>
              <select v-model="filters.scope" data-testid="filter-scope">
                <option value="">All scopes</option>
                <option value="core">Core Assets</option>
                <option value="personal">Personal</option>
                <option value="theme">Theme</option>
              </select>
            </label>
            <label>
              <span>Origin</span>
              <select v-model="filters.origin" data-testid="filter-origin">
                <option value="">All origins</option>
                <option value="built-in">Built-in</option>
                <option value="imported">Imported</option>
                <option value="generated">Generated</option>
              </select>
            </label>
            <label>
              <span>Status</span>
              <select v-model="filters.status" data-testid="filter-status">
                <option value="">All statuses</option>
                <option
                  v-for="status in statusOptions"
                  :key="status"
                  :value="status"
                >
                  {{ statusDetails(status).label }}
                </option>
              </select>
            </label>
          </div>
        </div>

        <div v-if="activeFilterChips.length" class="filter-chips" aria-label="Active filters">
          <button
            v-for="chip in activeFilterChips"
            :key="chip.key"
            type="button"
            :aria-label="`Remove ${chip.label} filter`"
            @click="clearFilter(chip.key)"
          >
            <span>{{ chip.label }}</span>
            <span aria-hidden="true">×</span>
          </button>
          <button type="button" class="filter-chips__clear" @click="clearAllFilters">
            Clear all
          </button>
        </div>

        <p class="sr-only" aria-live="polite">
          {{ results.length }} results in {{ activeView.label }}.
        </p>

        <div v-if="results.length" class="asset-grid-wrap">
          <div
            ref="assetGrid"
            class="asset-grid"
            role="grid"
            :aria-label="`${activeView.label} asset results`"
            data-testid="asset-library-grid"
          >
            <button
              v-for="(item, index) in results"
              :key="item.key"
              type="button"
              role="gridcell"
              class="asset-card"
              :class="{ selected: selectedItem?.key === item.key }"
              :data-status="item.status"
              :data-asset-index="index"
              :tabindex="focusedIndex === index ? 0 : -1"
              :aria-label="cardAccessibleLabel(item)"
              :aria-selected="selectedItem?.key === item.key"
              @click="openDetail(item, index)"
              @focus="focusedIndex = index"
              @keydown="navigateCard($event, index)"
            >
              <span
                class="asset-card__preview preview-surface"
                :class="previewSurfaceClass(item)"
              >
                <img
                  v-if="item.previewUrl"
                  :src="item.previewUrl"
                  :alt="`${item.name} thumbnail`"
                />
                <span v-else class="preview-fallback" aria-hidden="true">
                  <i />
                  <strong>{{ previewMark(item) }}</strong>
                  <small>{{ item.format?.toLocaleUpperCase() || "FILE" }}</small>
                </span>
                <span class="asset-card__kind">
                  {{ item.kind === "cataloged" ? "Catalog" : item.kind === "rejected-import" ? "Review" : "Draft" }}
                </span>
              </span>

              <span class="asset-card__copy">
                <strong>{{ item.name }}</strong>
                <span>{{ item.categoryLabel }}</span>
              </span>

              <span class="asset-card__footer">
                <span class="asset-card__scope">
                  <i aria-hidden="true">{{ scopeIcon(item.scope) }}</i>
                  {{ scopeLabel(item.scope) }}
                  <template v-if="item.scope === 'theme' && item.theme">
                    · {{ humanizeAssetValue(item.theme) }}
                  </template>
                </span>
                <span
                  class="status-badge"
                  :class="`status-badge--${item.status}`"
                  :aria-label="`Status: ${statusDetails(item.status).label}`"
                >
                  <i aria-hidden="true">{{ statusDetails(item.status).icon }}</i>
                  {{ statusDetails(item.status).label }}
                </span>
              </span>
            </button>
          </div>
        </div>

        <div v-else class="library-empty" data-testid="asset-library-empty">
          <span aria-hidden="true">⌕</span>
          <h3>No assets match this view</h3>
          <p v-if="search || activeFilterChips.length">
            Nothing matched
            <template v-if="search">“{{ search }}”</template>
            with the active filters.
          </p>
          <p v-else-if="selectedView === 'my-assets'">
            No Personal asset has been cataloged yet.
          </p>
          <p v-else>
            This system view is empty. Import a static PNG, WebP or safe SVG to begin.
          </p>
          <button
            v-if="search || activeFilterChips.length"
            type="button"
            @click="clearDiscovery"
          >
            Clear search and filters
          </button>
        </div>
      </section>

      <aside
        v-if="selectedItem"
        class="asset-detail"
        aria-labelledby="asset-detail-heading"
        data-testid="asset-library-detail"
        @keydown.esc.stop.prevent="closeDetail"
      >
        <header class="asset-detail__topbar">
          <button
            type="button"
            class="asset-detail__back"
            aria-label="Back to asset grid"
            @click="closeDetail"
          >
            <span aria-hidden="true">←</span>
            Back
          </button>
          <span>{{ selectedItem.kind === "cataloged" ? "Cataloged Asset" : "Library Work Item" }}</span>
          <button
            type="button"
            class="asset-detail__close"
            aria-label="Close asset details"
            @click="closeDetail"
          >
            ×
          </button>
        </header>

        <div class="asset-detail__scroll">
          <section class="detail-preview">
            <div class="detail-preview__toolbar" aria-label="Preview controls">
              <div>
                <button
                  type="button"
                  :aria-pressed="previewFit"
                  @click="setFit"
                >
                  Fit
                </button>
                <button
                  type="button"
                  :aria-pressed="!previewFit && previewScale === 1"
                  @click="setActualSize"
                >
                  100%
                </button>
                <button type="button" aria-label="Zoom out" @click="zoom(-0.25)">−</button>
                <span aria-live="polite">{{ Math.round(previewScale * 100) }}%</span>
                <button type="button" aria-label="Zoom in" @click="zoom(0.25)">+</button>
              </div>
              <div role="group" aria-label="Preview background">
                <button
                  v-for="background in previewBackgrounds"
                  :key="background.id"
                  type="button"
                  :class="{ active: previewBackground === background.id }"
                  :aria-label="`${background.label} preview background`"
                  :aria-pressed="previewBackground === background.id"
                  @click="previewBackground = background.id"
                >
                  <i :class="`background-swatch background-swatch--${background.id}`" aria-hidden="true" />
                  <span class="sr-only">{{ background.label }}</span>
                </button>
              </div>
            </div>
            <div
              class="detail-preview__canvas"
              :class="`detail-preview__canvas--${previewBackground}`"
              :aria-label="`${selectedItem.name} preview on ${previewBackgroundLabel} background`"
            >
              <img
                v-if="selectedItem.previewUrl"
                :src="selectedItem.previewUrl"
                :alt="`${selectedItem.name} detail preview`"
                :style="previewTransform"
              />
              <div v-else class="preview-fallback preview-fallback--large">
                <i aria-hidden="true" />
                <strong aria-hidden="true">{{ previewMark(selectedItem) }}</strong>
                <span>Fallback Preview</span>
                <small>{{ selectedItem.previewFallbackReason }}</small>
              </div>
            </div>
          </section>

          <section class="asset-detail__summary">
            <div class="asset-detail__title">
              <span
                class="status-badge"
                :class="`status-badge--${selectedItem.status}`"
              >
                <i aria-hidden="true">{{ statusDetails(selectedItem.status).icon }}</i>
                {{ statusDetails(selectedItem.status).label }}
              </span>
              <h2 id="asset-detail-heading" ref="detailHeading" tabindex="-1">
                {{ selectedItem.name }}
              </h2>
              <p>{{ selectedItem.description }}</p>
            </div>
            <div class="asset-detail__classification">
              <span>{{ selectedItem.categoryLabel }}</span>
              <span>{{ scopeLabel(selectedItem.scope) }}</span>
              <span v-if="selectedItem.theme">{{ humanizeAssetValue(selectedItem.theme) }}</span>
            </div>
            <p class="asset-detail__status-copy">
              <strong>{{ statusDetails(selectedItem.status).label }}</strong>
              {{ statusDetails(selectedItem.status).explanation }}
            </p>
            <div class="asset-detail__primary-actions">
              <button
                v-if="selectedItem.kind === 'catalog-draft' && selectedItem.catalogDraft.status === 'ready-for-catalog'"
                type="button"
                :disabled="promotionBusy"
                data-testid="catalog-promote-action"
                @click="promoteSelectedDraft"
              >
                {{ promotionBusy ? "Saving…" : "Add to Catalog" }}
              </button>
              <button
                v-if="selectedItem.kind === 'cataloged' && !selectedItem.previewUrl"
                type="button"
                @click="reloadLibrary"
              >
                Reload Resource status
              </button>
            </div>
            <div v-if="promotionError" class="promotion-error" role="alert">
              <strong>Catalog promotion failed.</strong>
              <span>{{ promotionError }}</span>
              <button
                v-if="selectedItem.kind === 'catalog-draft' && selectedItem.catalogDraft.status === 'ready-for-catalog'"
                type="button"
                :disabled="promotionBusy"
                @click="promoteSelectedDraft"
              >
                Retry save
              </button>
            </div>
          </section>

          <section v-if="selectedItem.issues.length" class="asset-detail__issues">
            <h3>Attention</h3>
            <ul>
              <li v-for="issue in selectedItem.issues" :key="`${issue.code}:${issue.message}`">
                <span aria-hidden="true">{{ issue.severity === "error" ? "×" : issue.severity === "warning" ? "△" : "i" }}</span>
                <span><strong>{{ humanizeAssetValue(issue.code) }}</strong>{{ issue.message }}</span>
              </li>
            </ul>
          </section>

          <form
            v-if="selectedItem.kind === 'catalog-draft'"
            class="catalog-editor"
            data-testid="catalog-metadata-editor"
            @submit.prevent="applyCatalogMetadata"
          >
            <header>
              <div>
                <span>Catalog completion</span>
                <h3>Describe this visual asset</h3>
              </div>
              <strong>{{ selectedItem.catalogDraft.validation.missingFields.length }} required fields missing</strong>
            </header>

            <div v-if="metadataIssues.length" class="catalog-editor__issues" role="status">
              <span v-for="issue in metadataIssues" :key="`${issue.field}:${issue.message}`">
                {{ issue.message }}
              </span>
            </div>

            <fieldset>
              <legend>Identity</legend>
              <label>
                <span>Display name</span>
                <input v-model="metadataForm.displayName" required maxlength="200" />
              </label>
              <label class="catalog-editor__wide">
                <span>Description</span>
                <textarea v-model="metadataForm.description" required maxlength="4000" rows="3" />
              </label>
              <label>
                <span>Category ID</span>
                <input
                  v-model="metadataForm.category"
                  required
                  placeholder="personal.category.decoration"
                />
              </label>
              <label>
                <span>User tags</span>
                <input v-model="metadataForm.userTags" placeholder="calm, green, decorative" />
              </label>
              <label class="catalog-editor__wide">
                <span>System tags</span>
                <input v-model="metadataForm.systemTags" required />
              </label>
            </fieldset>

            <fieldset>
              <legend>Library context</legend>
              <label>
                <span>Scope</span>
                <select v-model="metadataForm.scope" required>
                  <option value="personal">Personal</option>
                  <option value="theme">Theme</option>
                </select>
              </label>
              <label v-if="metadataForm.scope === 'theme'">
                <span>Theme ID</span>
                <input v-model="metadataForm.theme" required placeholder="personal.theme.example" />
              </label>
              <label>
                <span>Perspective</span>
                <select v-model="metadataForm.perspective" required>
                  <option value="unspecified">Unspecified</option>
                  <option value="front">Front</option>
                  <option value="side">Side</option>
                  <option value="top">Top</option>
                  <option value="isometric">Isometric</option>
                </select>
              </label>
              <label>
                <span>Orientation</span>
                <select v-model="metadataForm.orientation" required>
                  <option value="unspecified">Unspecified</option>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                  <option value="square">Square</option>
                </select>
              </label>
              <label>
                <span>Scale class</span>
                <select v-model="metadataForm.scaleClass" required>
                  <option value="unspecified">Unspecified</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </label>
            </fieldset>

            <fieldset>
              <legend>Creator and rights</legend>
              <label>
                <span>Creator</span>
                <input v-model="metadataForm.creator" required maxlength="200" />
              </label>
              <label>
                <span>License expression</span>
                <input v-model="metadataForm.license" required maxlength="500" />
              </label>
              <label class="catalog-editor__wide">
                <span>Provenance source</span>
                <input v-model="metadataForm.provenanceSource" required maxlength="1000" />
              </label>
              <label class="catalog-editor__wide">
                <span>Attribution (optional)</span>
                <input v-model="metadataForm.attribution" maxlength="1000" />
              </label>
            </fieldset>

            <label class="catalog-editor__confirmation">
              <input v-model="metadataForm.compatibilityConfirmed" type="checkbox" required />
              <span>
                Declare compatibility as explicitly empty for this first slice.
                This grants no placement or behavior.
              </span>
            </label>

            <button type="submit">Apply catalog metadata</button>
            <p>
              Applying metadata keeps this item as a draft. “Add to Catalog” is a separate action.
            </p>
          </form>

          <section class="detail-section">
            <h3>About</h3>
            <dl class="metadata-grid">
              <div><dt>Description</dt><dd>{{ selectedItem.description }}</dd></div>
              <div><dt>Category</dt><dd>{{ selectedItem.categoryLabel }}</dd></div>
              <div><dt>Perspective</dt><dd>{{ detailMetadata.perspective }}</dd></div>
              <div><dt>Orientation</dt><dd>{{ detailMetadata.orientation }}</dd></div>
              <div><dt>Scale class</dt><dd>{{ detailMetadata.scaleClass }}</dd></div>
              <div class="metadata-grid__wide">
                <dt>Tags</dt>
                <dd>
                  <span v-for="tag in allTags(selectedItem)" :key="tag" class="metadata-tag">
                    {{ humanizeAssetValue(tag) }}
                  </span>
                  <span v-if="allTags(selectedItem).length === 0">Not assigned</span>
                </dd>
              </div>
            </dl>
          </section>

          <section class="detail-section">
            <h3>Scope and origin</h3>
            <dl class="metadata-grid">
              <div><dt>Scope</dt><dd>{{ scopeLabel(selectedItem.scope) }}</dd></div>
              <div><dt>Origin</dt><dd>{{ originLabel(selectedItem.origin) }}</dd></div>
              <div class="metadata-grid__wide">
                <dt>Theme</dt>
                <dd>{{ selectedItem.theme ? humanizeAssetValue(selectedItem.theme) : "Not assigned" }}</dd>
              </div>
            </dl>
          </section>

          <section class="detail-section">
            <h3>Creator and rights</h3>
            <dl class="metadata-grid">
              <div><dt>Creator</dt><dd>{{ detailMetadata.creator }}</dd></div>
              <div><dt>License</dt><dd>{{ detailMetadata.license }}</dd></div>
              <div><dt>Provenance</dt><dd>{{ detailMetadata.provenance }}</dd></div>
              <div><dt>Attribution</dt><dd>{{ detailMetadata.attribution }}</dd></div>
            </dl>
          </section>

          <details class="detail-disclosure" open>
            <summary>Compatibility</summary>
            <div class="compatibility-list">
              <div>
                <strong>Templates</strong>
                <span v-for="value in detailCompatibility.templates" :key="value">{{ value }}</span>
                <span v-if="detailCompatibility.templates.length === 0">Explicitly empty</span>
              </div>
              <div>
                <strong>Surface Types</strong>
                <span v-for="value in detailCompatibility.surfaces" :key="value">{{ value }}</span>
                <span v-if="detailCompatibility.surfaces.length === 0">Explicitly empty</span>
              </div>
              <div>
                <strong>Visual Object Types</strong>
                <span v-for="value in detailCompatibility.visualObjects" :key="value">{{ value }}</span>
                <span v-if="detailCompatibility.visualObjects.length === 0">Explicitly empty</span>
              </div>
            </div>
            <p class="detail-note">Compatibility is discovery metadata. It grants no placement or behavior.</p>
          </details>

          <details class="detail-disclosure">
            <summary>Catalog contexts <span>{{ detailCatalogContexts.length }}</span></summary>
            <ul v-if="detailCatalogContexts.length" class="context-list">
              <li v-for="context in detailCatalogContexts" :key="`${context.id}@${context.version}`">
                <strong>{{ context.displayName }}</strong>
                <span>{{ humanizeAssetValue(context.category) }} · {{ scopeLabel(context.scope) }}</span>
                <code>{{ context.id }}@{{ context.version }}</code>
              </li>
            </ul>
            <p v-else class="detail-note">No registered Catalog Entry references this exact Visual Asset.</p>
          </details>

          <details class="detail-disclosure">
            <summary>Versions</summary>
            <dl class="metadata-grid">
              <div><dt>File version</dt><dd>{{ detailVersions.fileVersion }}</dd></div>
              <div><dt>Catalog revision</dt><dd>{{ detailVersions.catalogRevision }}</dd></div>
              <div class="metadata-grid__wide"><dt>Visual Asset ID</dt><dd><code>{{ detailVersions.visualAssetId }}</code></dd></div>
              <div class="metadata-grid__wide"><dt>Catalog Entry ID</dt><dd><code>{{ detailVersions.catalogEntryId }}</code></dd></div>
            </dl>
          </details>

          <details class="detail-disclosure">
            <summary>Preview resources</summary>
            <dl class="metadata-grid">
              <div><dt>Thumbnail</dt><dd>{{ detailPreviewResources.thumbnail }}</dd></div>
              <div><dt>Detail preview</dt><dd>{{ detailPreviewResources.detail }}</dd></div>
              <div class="metadata-grid__wide">
                <dt>Layer Preview</dt>
                <dd>{{ detailPreviewResources.layers }}</dd>
              </div>
            </dl>
          </details>

          <details class="detail-disclosure" open>
            <summary>Technical information</summary>
            <dl class="metadata-grid">
              <div><dt>Format</dt><dd>{{ detailTechnical.format }}</dd></div>
              <div><dt>MIME type</dt><dd>{{ detailTechnical.mimeType }}</dd></div>
              <div><dt>Dimensions</dt><dd>{{ detailTechnical.dimensions }}</dd></div>
              <div><dt>Byte size</dt><dd>{{ detailTechnical.byteSize }}</dd></div>
              <div><dt>Transparency</dt><dd>{{ detailTechnical.alpha }}</dd></div>
              <div class="metadata-grid__wide"><dt>SHA-256</dt><dd><code>{{ detailTechnical.sha256 }}</code></dd></div>
            </dl>
          </details>
        </div>
      </aside>
    </div>
  </main>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";

import type {
  AssetCatalogEntry,
  AssetCatalogOrigin,
  AssetCatalogScope,
  CatalogCompatibilityMetadata,
  CatalogCompletionIssue,
  CatalogDraft,
  CatalogDraftMetadata,
  DraftVisualAsset,
  ImportSession,
  VisualAsset,
} from "../../theme-engine";
import {
  AssetImportService,
  CatalogPromotionService,
  createImportedCatalogTarget,
  prepareCatalogPersistence,
} from "../../theme-engine";
import { assetCatalogApi } from "../../runtime/assetCatalogApi";
import {
  ASSET_LIBRARY_STATUS_DETAILS,
  ASSET_LIBRARY_VIEWS,
  AssetLibraryStatus,
  assetLibraryFacetValues,
  cardAccessibleLabel,
  catalogDraftItem,
  catalogContextsFor,
  countAssetLibraryView,
  createAssetLibraryPrototype,
  humanizeAssetValue,
  nextAssetGridIndex,
  queryAssetLibrary,
  rejectedImportItem,
  replaceAssetLibrarySessionItems,
  type AssetGridNavigationKey,
  type AssetLibraryFilters,
  type AssetLibraryItem,
  type AssetLibraryPrototype,
  type AssetLibraryIssue,
  type AssetLibraryStatus as AssetLibraryStatusValue,
  type AssetLibraryViewId,
} from "./assetLibraryPrototype";

const props = defineProps<{
  prototype?: Readonly<AssetLibraryPrototype>;
}>();

const route = useRoute();
const router = useRouter();
const returnBuilderProjectId = computed(() =>
  typeof route.query.returnBuilderProjectId === "string" ? route.query.returnBuilderProjectId.trim() : "",
);
const returnBuilderRoute = computed(() => {
  const requested = typeof route.query.returnBuilderRoute === "string" ? route.query.returnBuilderRoute : "";
  return ["theme-builder", "theme-builder-looks", "theme-builder-object", "theme-builder-room", "theme-builder-showcase", "theme-builder-release"].includes(requested)
    ? requested
    : "theme-builder";
});
const returnBuilderLabel = computed(() => returnBuilderRoute.value === "theme-builder-release" ? "Return to Release" : "Return to Theme Builder");
function returnToBuilder(): void {
  if (!returnBuilderProjectId.value) return;
  void router.push({ name: returnBuilderRoute.value, query: { builderProjectId: returnBuilderProjectId.value } });
}

interface CatalogMetadataForm {
  displayName: string;
  description: string;
  category: string;
  userTags: string;
  systemTags: string;
  scope: "personal" | "theme";
  theme: string;
  perspective: string;
  orientation: string;
  scaleClass: string;
  creator: string;
  license: string;
  attribution: string;
  provenanceSource: string;
  compatibilityConfirmed: boolean;
}

const prototypeState = shallowRef<Readonly<AssetLibraryPrototype> | null>(
  props.prototype ?? null,
);
const loading = ref(props.prototype === undefined);
const loadError = ref("");
const importing = ref(false);
const importError = ref("");
const operationMessage = ref("");
const promotionBusy = ref(false);
const promotionError = ref("");
const selectedView = ref<AssetLibraryViewId>("all-assets");
const search = ref("");
const filters = ref<AssetLibraryFilters>({
  category: "",
  scope: "",
  origin: "",
  status: "",
});
const selectedKey = ref<string | null>(null);
const selectedOriginIndex = ref(0);
const focusedIndex = ref(0);
const searchInput = ref<HTMLInputElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const assetGrid = ref<HTMLElement | null>(null);
const detailHeading = ref<HTMLElement | null>(null);
const previewBackground = ref<"checker" | "light" | "dark">("checker");
const previewFit = ref(true);
const previewScale = ref(1);
const metadataForm = ref<CatalogMetadataForm>(emptyMetadataForm());
const importService = new AssetImportService();
const completionService = new CatalogPromotionService();
let importSession: ImportSession | null = null;
let sessionItems: readonly Readonly<AssetLibraryItem>[] = Object.freeze([]);

const navigationGroups = ["Library", "Work"] as const;
const statusOptions: readonly AssetLibraryStatusValue[] = [
  AssetLibraryStatus.NeedsMetadata,
  AssetLibraryStatus.ReadyForCatalog,
  AssetLibraryStatus.Cataloged,
  AssetLibraryStatus.Warning,
  AssetLibraryStatus.Rejected,
];
const previewBackgrounds = [
  { id: "checker" as const, label: "Checkerboard" },
  { id: "light" as const, label: "Light neutral" },
  { id: "dark" as const, label: "Dark neutral" },
];

const activeView = computed(
  () =>
    ASSET_LIBRARY_VIEWS.find((view) => view.id === selectedView.value)
    ?? ASSET_LIBRARY_VIEWS[0]!,
);
const results = computed(() =>
  prototypeState.value === null
    ? []
    : queryAssetLibrary(prototypeState.value, {
        view: selectedView.value,
        search: search.value,
        filters: filters.value,
      }),
);
const selectedItem = computed(
  () =>
    prototypeState.value?.items.find((item) => item.key === selectedKey.value)
    ?? null,
);
const metadataIssues = computed<readonly Readonly<CatalogCompletionIssue>[]>(() =>
  selectedItem.value?.kind === "catalog-draft"
    ? selectedItem.value.catalogDraft.validation.issues
    : [],
);
const categoryOptions = computed(() =>
  prototypeState.value === null
    ? []
    : assetLibraryFacetValues(prototypeState.value.items, "category"),
);
const activeFilterChips = computed(() => {
  const chips: {
    key: keyof AssetLibraryFilters;
    label: string;
  }[] = [];
  if (filters.value.category) {
    chips.push({
      key: "category",
      label: `Category: ${humanizeAssetValue(filters.value.category)}`,
    });
  }
  if (filters.value.scope) {
    chips.push({
      key: "scope",
      label: `Scope: ${scopeLabel(filters.value.scope)}`,
    });
  }
  if (filters.value.origin) {
    chips.push({
      key: "origin",
      label: `Origin: ${originLabel(filters.value.origin)}`,
    });
  }
  if (filters.value.status) {
    chips.push({
      key: "status",
      label: `Status: ${statusDetails(filters.value.status).label}`,
    });
  }
  return chips;
});
const detailMetadata = computed(() => metadataDetail(selectedItem.value));
const detailCompatibility = computed(() =>
  compatibilityDetail(selectedItem.value),
);
const detailCatalogContexts = computed(() =>
  prototypeState.value === null || selectedItem.value === null
    ? []
    : catalogContextsFor(prototypeState.value, selectedItem.value),
);
const detailVersions = computed(() => versionDetail(selectedItem.value));
const detailPreviewResources = computed(() =>
  previewResourceDetail(selectedItem.value),
);
const detailTechnical = computed(() => technicalDetail(selectedItem.value));
const previewBackgroundLabel = computed(
  () =>
    previewBackgrounds.find(
      (background) => background.id === previewBackground.value,
    )?.label ?? "Checkerboard",
);
const previewTransform = computed(() => ({
  transform: `scale(${previewScale.value})`,
  maxWidth: previewFit.value ? "82%" : "none",
  maxHeight: previewFit.value ? "82%" : "none",
}));

watch(results, (nextResults) => {
  focusedIndex.value = Math.min(
    Math.max(0, focusedIndex.value),
    Math.max(0, nextResults.length - 1),
  );
  if (
    selectedKey.value !== null
    && !nextResults.some((item) => item.key === selectedKey.value)
  ) {
    selectedKey.value = null;
  }
});

onMounted(async () => {
  window.addEventListener("keydown", handleLibraryShortcut);
  if (prototypeState.value !== null) {
    initializeImportSession(prototypeState.value);
    return;
  }
  await reloadLibrary();
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleLibraryShortcut);
});

async function reloadLibrary(): Promise<void> {
  loading.value = prototypeState.value === null;
  loadError.value = "";
  try {
    const loaded = await createAssetLibraryPrototype();
    prototypeState.value = replaceAssetLibrarySessionItems(loaded, sessionItems);
    initializeImportSession(loaded);
    operationMessage.value = "Persistent Catalog reloaded.";
  } catch (cause) {
    loadError.value =
      cause instanceof Error ? cause.message : "The Cosmos Runtime is unavailable.";
  } finally {
    loading.value = false;
  }
}

function initializeImportSession(
  prototype: Readonly<AssetLibraryPrototype>,
): void {
  if (importSession !== null) return;
  importSession = importService.createSession({
    existingVisualAssets: prototype.registry.listVisualAssets().map((asset) => ({
      visualAssetRef: { id: asset.id, version: asset.version },
      sha256: asset.sha256,
    })),
  });
}

async function importSelectedFiles(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const files = [...(input.files ?? [])];
  input.value = "";
  if (files.length === 0 || prototypeState.value === null) return;
  initializeImportSession(prototypeState.value);
  if (importSession === null) return;

  importing.value = true;
  importError.value = "";
  operationMessage.value = "";
  try {
    const batch = await importSession.importFiles(
      await Promise.all(files.map(async (file) => ({
        fileName: file.name,
        declaredMimeType: file.type || undefined,
        bytes: new Uint8Array(await file.arrayBuffer()),
      }))),
    );
    const addedItems: Readonly<AssetLibraryItem>[] = batch.items.map((result) => {
      if (result.draftVisualAsset === undefined) {
        return rejectedImportItem(result);
      }
      const catalogDraft = completionService.createDraft({
        flow: "user-import",
        sourceVisualAsset: result.draftVisualAsset,
        target: createImportedCatalogTarget(result.draftVisualAsset),
        metadata: { origin: "imported" },
      });
      return catalogDraftItem(
        catalogDraft,
        result.issues as readonly Readonly<AssetLibraryIssue>[],
      );
    });
    sessionItems = Object.freeze([...sessionItems, ...addedItems]);
    prototypeState.value = replaceAssetLibrarySessionItems(
      prototypeState.value,
      sessionItems,
    );
    const firstDraft = addedItems.find((item) => item.kind === "catalog-draft");
    selectedView.value = firstDraft === undefined ? "needs-attention" : "drafts";
    selectedKey.value = (firstDraft ?? addedItems[0])?.key ?? null;
    if (firstDraft?.kind === "catalog-draft") {
      metadataForm.value = metadataFormFromDraft(firstDraft.catalogDraft);
    }
    operationMessage.value =
      `${batch.counts.total} file${batch.counts.total === 1 ? "" : "s"} reviewed; `
      + `${batch.counts.rejected} rejected.`;
    await nextTick();
    detailHeading.value?.focus();
  } catch (cause) {
    importError.value =
      cause instanceof Error ? cause.message : "The selected files could not be reviewed.";
  } finally {
    importing.value = false;
  }
}

function applyCatalogMetadata(): void {
  const item = selectedItem.value;
  if (item?.kind !== "catalog-draft") return;
  promotionError.value = "";
  const form = metadataForm.value;
  const metadata: CatalogDraftMetadata = {
    displayName: form.displayName.trim(),
    description: form.description.trim(),
    category: form.category.trim(),
    scope: form.scope,
    origin: "imported",
    systemTags: splitList(form.systemTags),
    userTags: splitList(form.userTags),
    perspective: form.perspective,
    orientation: form.orientation,
    scaleClass: form.scaleClass,
    ...(form.scope === "theme" && form.theme.trim()
      ? { theme: form.theme.trim() }
      : {}),
    creator: { name: form.creator.trim() },
    provenance: {
      kind: "imported",
      source: form.provenanceSource.trim(),
    },
    license: {
      expression: form.license.trim(),
      ...(form.attribution.trim()
        ? { attribution: form.attribution.trim() }
        : {}),
    },
    ...(form.compatibilityConfirmed
      ? {
          compatibility: {
            compatibleTemplates: [],
            compatibleSurfaceTypes: [],
            compatibleVisualObjectTypes: [],
          },
        }
      : {}),
  };
  const updatedDraft = completionService.setMetadata(item.catalogDraft, metadata);
  const replacement = catalogDraftItem(updatedDraft, item.issues);
  sessionItems = Object.freeze(
    sessionItems.map((candidate) =>
      candidate.key === item.key ? replacement : candidate,
    ),
  );
  if (prototypeState.value !== null) {
    prototypeState.value = replaceAssetLibrarySessionItems(
      prototypeState.value,
      sessionItems,
    );
  }
  operationMessage.value = updatedDraft.status === "ready-for-catalog"
    ? "Metadata applied. The draft is ready for explicit Catalog promotion."
    : "Metadata applied. Review the remaining validation messages.";
}

async function promoteSelectedDraft(): Promise<void> {
  const item = selectedItem.value;
  if (item?.kind !== "catalog-draft") return;
  promotionBusy.value = true;
  promotionError.value = "";
  operationMessage.value = "";
  try {
    const prepared = prepareCatalogPersistence(item.catalogDraft);
    const result = await assetCatalogApi.promote(prepared);
    if (!result.ok) {
      promotionError.value = result.error.message;
      return;
    }
    sessionItems = Object.freeze(
      sessionItems.filter((candidate) => candidate.key !== item.key),
    );
    const catalogKey =
      `catalog:${result.data.catalogEntry.id}@${result.data.catalogEntry.version}`;
    await reloadLibrary();
    selectedView.value = "all-assets";
    selectedKey.value = catalogKey;
    operationMessage.value =
      `"${result.data.catalogEntry.displayName}" is cataloged and persistent.`;
    await nextTick();
    detailHeading.value?.focus();
  } catch (cause) {
    promotionError.value =
      cause instanceof Error ? cause.message : "Catalog promotion failed.";
  } finally {
    promotionBusy.value = false;
  }
}

function viewsForGroup(group: (typeof navigationGroups)[number]) {
  return ASSET_LIBRARY_VIEWS.filter((view) => view.group === group);
}

function viewCount(view: AssetLibraryViewId): number {
  return prototypeState.value === null
    ? 0
    : countAssetLibraryView(prototypeState.value, view);
}

function selectView(view: AssetLibraryViewId): void {
  selectedView.value = view;
  selectedKey.value = null;
  focusedIndex.value = 0;
}

function selectViewFromEvent(event: Event): void {
  selectView((event.target as HTMLSelectElement).value as AssetLibraryViewId);
}

function statusDetails(status: AssetLibraryStatusValue) {
  return ASSET_LIBRARY_STATUS_DETAILS[status];
}

function clearFilter(key: keyof AssetLibraryFilters): void {
  filters.value[key] = "" as never;
}

function clearAllFilters(): void {
  filters.value = {
    category: "",
    scope: "",
    origin: "",
    status: "",
  };
}

function clearSearch(): void {
  search.value = "";
}

function clearDiscovery(): void {
  clearSearch();
  clearAllFilters();
}

function openDetail(item: Readonly<AssetLibraryItem>, index: number): void {
  selectedKey.value = item.key;
  selectedOriginIndex.value = index;
  promotionError.value = "";
  if (item.kind === "catalog-draft") {
    metadataForm.value = metadataFormFromDraft(item.catalogDraft);
  }
  previewBackground.value = "checker";
  previewFit.value = true;
  previewScale.value = 1;
  void nextTick(() => detailHeading.value?.focus());
}

function closeDetail(): void {
  selectedKey.value = null;
  focusedIndex.value = selectedOriginIndex.value;
  void nextTick(() => {
    assetGrid.value
      ?.querySelector<HTMLElement>(
        `[data-asset-index="${selectedOriginIndex.value}"]`,
      )
      ?.focus();
  });
}

function navigateCard(event: KeyboardEvent, index: number): void {
  const navigationKeys: readonly AssetGridNavigationKey[] = [
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
  ];
  if (!navigationKeys.includes(event.key as AssetGridNavigationKey)) return;
  event.preventDefault();
  const columns = gridColumnCount(assetGrid.value);
  const nextIndex = nextAssetGridIndex(
    index,
    event.key as AssetGridNavigationKey,
    columns,
    results.value.length,
  );
  focusedIndex.value = nextIndex;
  assetGrid.value
    ?.querySelector<HTMLElement>(`[data-asset-index="${nextIndex}"]`)
    ?.focus();
}

function handleLibraryShortcut(event: KeyboardEvent): void {
  const target = event.target;
  const isEditor = target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement;
  if (
    (event.key === "/" && !isEditor)
    || ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "f")
  ) {
    event.preventDefault();
    searchInput.value?.focus();
    return;
  }
  if (event.key === "Escape" && selectedItem.value !== null && !isEditor) {
    event.preventDefault();
    closeDetail();
  }
}

function setFit(): void {
  previewFit.value = true;
  previewScale.value = 1;
}

function setActualSize(): void {
  previewFit.value = false;
  previewScale.value = 1;
}

function zoom(delta: number): void {
  previewFit.value = false;
  previewScale.value = Math.min(3, Math.max(0.25, previewScale.value + delta));
}

function previewMark(item: Readonly<AssetLibraryItem>): string {
  const tokens = item.name.split(/\s+/u).filter(Boolean);
  const mark = tokens.length > 1
    ? `${tokens[0]?.charAt(0) ?? ""}${tokens[1]?.charAt(0) ?? ""}`
    : item.name.slice(0, 2);
  return mark.toLocaleUpperCase();
}

function previewSurfaceClass(item: Readonly<AssetLibraryItem>): string {
  if (item.kind === "rejected-import") return "preview-surface--rejected";
  if (item.kind === "cataloged") {
    return `preview-surface--${item.visualAsset.alpha ? "transparent" : "neutral"}`;
  }
  const draft = sourceDraft(item);
  return `preview-surface--${draft?.alpha ? "transparent" : "neutral"}`;
}

function scopeLabel(scope: AssetCatalogScope | undefined): string {
  if (scope === undefined) return "Scope not assigned";
  return scope === "core"
    ? "Core"
    : scope === "personal"
      ? "Personal"
      : "Theme";
}

function scopeIcon(scope: AssetCatalogScope | undefined): string {
  return scope === "core" ? "◇" : scope === "theme" ? "◆" : scope === "personal" ? "○" : "·";
}

function originLabel(origin: AssetCatalogOrigin | undefined): string {
  if (origin === undefined) return "Not assigned";
  return origin === "built-in"
    ? "Built-in"
    : origin === "imported"
      ? "Imported"
      : "Generated";
}

function allTags(item: Readonly<AssetLibraryItem>): readonly string[] {
  return [...item.systemTags, ...item.userTags];
}

function metadataDetail(item: Readonly<AssetLibraryItem> | null) {
  const metadata = item === null ? undefined : catalogMetadata(item);
  return {
    perspective: metadata?.perspective ?? "Not assigned",
    orientation: metadata?.orientation ?? "Not assigned",
    scaleClass: metadata?.scaleClass ?? "Not assigned",
    creator: metadata?.creator?.name ?? "Not assigned",
    license: metadata?.license?.expression ?? "Not declared",
    provenance: metadata?.provenance?.kind
      ? humanizeAssetValue(metadata.provenance.kind)
      : "Not assigned",
    attribution: metadata?.license?.attribution ?? "Not required or not assigned",
  };
}

function compatibilityDetail(item: Readonly<AssetLibraryItem> | null): {
  templates: readonly string[];
  surfaces: readonly string[];
  visualObjects: readonly string[];
} {
  if (item === null) return emptyCompatibility();
  const compatibility = catalogCompatibility(item);
  if (compatibility === undefined) return emptyCompatibility();
  return {
    templates: compatibility.compatibleTemplates.map(
      (reference) => `${reference.id} ${reference.versionRange}`,
    ),
    surfaces: compatibility.compatibleSurfaceTypes,
    visualObjects: compatibility.compatibleVisualObjectTypes,
  };
}

function versionDetail(item: Readonly<AssetLibraryItem> | null) {
  if (item === null) return emptyVersions();
  if (item.kind === "cataloged") {
    return {
      fileVersion: item.visualAsset.version,
      catalogRevision: item.catalogEntry.version,
      visualAssetId: item.visualAsset.id,
      catalogEntryId: item.catalogEntry.id,
    };
  }
  if (item.kind === "catalog-draft") {
    return {
      fileVersion: item.catalogDraft.target.visualAssetRef.version,
      catalogRevision: `Draft ${item.catalogDraft.target.version}`,
      visualAssetId: item.catalogDraft.target.visualAssetRef.id,
      catalogEntryId: item.catalogDraft.target.assetCatalogEntryId,
    };
  }
  if (item.kind === "technical-draft") {
    return {
      fileVersion: "Not assigned — technical draft",
      catalogRevision: "Not created",
      visualAssetId: "Not assigned",
      catalogEntryId: "Not created",
    };
  }
  return emptyVersions();
}

function previewResourceDetail(item: Readonly<AssetLibraryItem> | null) {
  if (item?.kind === "catalog-draft") {
    return {
      thumbnail: `Automatic descriptor · ${item.catalogDraft.automaticPreviews.thumbnail.width}×${item.catalogDraft.automaticPreviews.thumbnail.height}`,
      detail: `Automatic descriptor · ${item.catalogDraft.automaticPreviews.detailPreview.width}×${item.catalogDraft.automaticPreviews.detailPreview.height}`,
      layers: "No Layer Preview — this source contains no declared layers.",
    };
  }
  if (item?.kind === "cataloged") {
    return {
      thumbnail: item.catalogEntry.thumbnailRef
        ? exactReference(item.catalogEntry.thumbnailRef)
        : "Safe fallback preview",
      detail: item.catalogEntry.previewRef
        ? exactReference(item.catalogEntry.previewRef)
        : "Safe fallback preview",
      layers: item.catalogEntry.layerPreviewRef
        ? exactReference(item.catalogEntry.layerPreviewRef)
        : "No Layer Preview — this source contains no declared layers.",
    };
  }
  return {
    thumbnail: item?.previewUrl ? "Safe source preview" : "Unavailable",
    detail: item?.previewUrl ? "Safe source preview" : "Unavailable",
    layers: "No Layer Preview — this source contains no declared layers.",
  };
}

function technicalDetail(item: Readonly<AssetLibraryItem> | null) {
  const source = item === null ? undefined : technicalSource(item);
  return {
    format: source?.format?.toLocaleUpperCase() ?? "Unavailable",
    mimeType: source?.mimeType ?? "Unavailable",
    dimensions:
      source?.width !== undefined && source.height !== undefined
        ? `${source.width} × ${source.height} px`
        : "Unavailable",
    byteSize:
      source?.byteSize === undefined ? "Unavailable" : formatBytes(source.byteSize),
    alpha:
      source?.alpha === undefined
        ? "Not declared"
        : source.alpha
          ? "Contains transparency"
          : "Opaque",
    sha256: source?.sha256 ?? "Unavailable",
  };
}

function catalogMetadata(
  item: Readonly<AssetLibraryItem>,
): Readonly<CatalogDraftMetadata> | Readonly<AssetCatalogEntry> | undefined {
  return item.kind === "cataloged"
    ? item.catalogEntry
    : item.kind === "catalog-draft"
      ? item.catalogDraft.metadata
      : undefined;
}

function catalogCompatibility(
  item: Readonly<AssetLibraryItem>,
): Readonly<CatalogCompatibilityMetadata> | undefined {
  if (item.kind === "cataloged") {
    return {
      compatibleTemplates: item.catalogEntry.compatibleTemplates,
      compatibleSurfaceTypes: item.catalogEntry.compatibleSurfaceTypes,
      compatibleVisualObjectTypes:
        item.catalogEntry.compatibleVisualObjectTypes,
    };
  }
  return item.kind === "catalog-draft"
    ? item.catalogDraft.metadata.compatibility
    : undefined;
}

function technicalSource(
  item: Readonly<AssetLibraryItem>,
): Readonly<VisualAsset> | Readonly<DraftVisualAsset> | undefined {
  if (item.kind === "cataloged") return item.visualAsset;
  if (item.kind === "catalog-draft") return item.catalogDraft.sourceVisualAsset;
  if (item.kind === "technical-draft") return item.draftVisualAsset;
  return item.importResult.validation.metadata === undefined
    ? undefined
    : {
        lifecycle: "draft",
        draftId: "rejected",
        sourceFileName: item.importResult.fileName,
        ...item.importResult.validation.metadata,
        sha256: item.importResult.validation.sha256 ?? "",
        read: () => new Uint8Array(),
      };
}

function sourceDraft(
  item: Readonly<AssetLibraryItem>,
): Readonly<DraftVisualAsset> | undefined {
  return item.kind === "catalog-draft"
    ? item.catalogDraft.sourceVisualAsset
    : item.kind === "technical-draft"
      ? item.draftVisualAsset
      : undefined;
}

function exactReference(reference: { id: string; version: string }): string {
  return `${reference.id}@${reference.version}`;
}

function formatBytes(byteSize: number): string {
  if (byteSize < 1024) return `${byteSize} B`;
  return `${(byteSize / 1024).toFixed(1)} KiB`;
}

function emptyMetadataForm(): CatalogMetadataForm {
  return {
    displayName: "",
    description: "",
    category: "",
    userTags: "",
    systemTags: "cosmos.asset.visual",
    scope: "personal",
    theme: "",
    perspective: "unspecified",
    orientation: "unspecified",
    scaleClass: "unspecified",
    creator: "",
    license: "",
    attribution: "",
    provenanceSource: "",
    compatibilityConfirmed: false,
  };
}

function metadataFormFromDraft(
  draft: Readonly<CatalogDraft>,
): CatalogMetadataForm {
  const metadata = draft.metadata;
  return {
    displayName:
      metadata.displayName ?? suggestedDisplayName(draft.sourceVisualAsset.sourceFileName),
    description: metadata.description ?? "",
    category: metadata.category ?? "",
    userTags: (metadata.userTags ?? []).join(", "),
    systemTags: (metadata.systemTags ?? ["cosmos.asset.visual"]).join(", "),
    scope: metadata.scope === "theme" ? "theme" : "personal",
    theme: metadata.theme ?? "",
    perspective: metadata.perspective ?? "unspecified",
    orientation: metadata.orientation ?? "unspecified",
    scaleClass: metadata.scaleClass ?? "unspecified",
    creator: metadata.creator?.name ?? "",
    license: metadata.license?.expression ?? "",
    attribution: metadata.license?.attribution ?? "",
    provenanceSource:
      metadata.provenance?.source ?? draft.sourceVisualAsset.sourceFileName,
    compatibilityConfirmed: metadata.compatibility !== undefined,
  };
}

function suggestedDisplayName(fileName: string): string {
  const stem = fileName.replace(/\.[^.]+$/u, "");
  return stem
    .split(/[\s._-]+/u)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toLocaleUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function splitList(value: string): readonly string[] {
  return [
    ...new Set(
      value.split(",").map((item) => item.trim()).filter(Boolean),
    ),
  ];
}

function gridColumnCount(grid: HTMLElement | null): number {
  if (grid === null) return 1;
  const template = getComputedStyle(grid).gridTemplateColumns;
  if (!template || template === "none") return 1;
  return Math.max(1, template.split(" ").length);
}

function emptyCompatibility() {
  return {
    templates: [] as readonly string[],
    surfaces: [] as readonly string[],
    visualObjects: [] as readonly string[],
  };
}

function emptyVersions() {
  return {
    fileVersion: "Not created",
    catalogRevision: "Not created",
    visualAssetId: "Not created",
    catalogEntryId: "Not created",
  };
}
</script>

<style scoped>
.asset-library {
  --library-bg: #080b0d;
  --library-panel: #0d1114;
  --library-raised: #12181c;
  --library-border: #252d31;
  --library-border-soft: #1b2226;
  --library-text: #e8ede9;
  --library-muted: #929d98;
  --library-faint: #65706b;
  --library-accent: #8ec9ab;
  --library-accent-strong: #b7e8cf;
  --library-attention: #e1b764;
  --library-danger: #df8078;

  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  background:
    radial-gradient(circle at 62% -30%, rgb(76 116 95 / 16%), transparent 40%),
    var(--library-bg);
  color: var(--library-text);
  font-family: "Aptos", "Inter", "Segoe UI Variable", "Segoe UI", sans-serif;
}

.asset-library button,
.asset-library input,
.asset-library select {
  color: inherit;
  font: inherit;
}

.asset-library button:focus-visible,
.asset-library input:focus-visible,
.asset-library select:focus-visible,
.asset-library summary:focus-visible,
.asset-detail h2:focus-visible {
  outline: 2px solid var(--library-accent);
  outline-offset: 2px;
}

.asset-library__header {
  display: flex;
  min-height: 84px;
  padding: 18px 24px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--library-border);
  background: rgb(8 11 13 / 88%);
}

.asset-library__identity {
  display: flex;
  align-items: center;
  gap: 17px;
}

.asset-library__eyebrow {
  padding: 6px 9px;
  border: 1px solid #365448;
  border-radius: 4px;
  background: #13241d;
  color: #a8d6bd;
  font: 650 10px/1 "Segoe UI", sans-serif;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.asset-library__identity h1 {
  margin: 0;
  font: 560 22px/1.15 "Segoe UI Variable", sans-serif;
  letter-spacing: -0.02em;
}

.asset-library__identity p {
  margin: 5px 0 0;
  color: var(--library-muted);
  font-size: 12px;
}

.asset-library__context {
  display: grid;
  max-width: 300px;
  justify-items: end;
  gap: 4px;
}

.asset-library__context span {
  color: var(--library-faint);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.asset-library__context strong {
  overflow: hidden;
  color: #cbd5d0;
  font: 500 12px/1.2 ui-monospace, monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-library__return,
.asset-library__import {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid #397159;
  border-radius: 6px;
  background: #1d4b38;
  color: #e5f4ec;
  cursor: pointer;
  font-size: 10px;
  font-weight: 700;
}

.asset-library__import:disabled { cursor: wait; opacity: 0.65; }

.asset-library__state {
  display: grid;
  margin: auto;
  justify-items: center;
  color: var(--library-muted);
  gap: 14px;
}

.asset-library__state--error { color: var(--library-danger); }

.asset-library__state button,
.library-operation button {
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid var(--library-border);
  border-radius: 5px;
  background: #17201d;
  color: #cbd6d0;
}

.library-operation {
  margin: 0 16px 10px;
  padding: 9px 11px;
  border: 1px solid #28533f;
  border-radius: 6px;
  background: #10251c;
  color: #9ec9b4;
  font-size: 10px;
}

.library-operation--error {
  border-color: #6a3434;
  background: #2b1717;
  color: #e2aaaa;
}

.library-operation button { margin-left: 8px; }

.asset-library__spinner {
  width: 28px;
  height: 28px;
  border: 2px solid var(--library-border);
  border-top-color: var(--library-accent);
  border-radius: 50%;
  animation: library-spin 900ms linear infinite;
}

.asset-library__body {
  display: grid;
  min-width: 0;
  min-height: 0;
  flex: 1;
  grid-template-columns: 208px minmax(520px, 1fr);
}

.asset-library__body--detail {
  grid-template-columns: 208px minmax(520px, 1fr) minmax(340px, 420px);
}

.library-nav {
  display: flex;
  min-height: 0;
  padding: 18px 12px 14px;
  flex-direction: column;
  border-right: 1px solid var(--library-border);
  background: rgb(9 13 15 / 76%);
}

.library-nav__group {
  display: grid;
  margin-bottom: 22px;
  gap: 3px;
}

.library-nav__group > span {
  padding: 0 10px 7px;
  color: var(--library-faint);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.library-nav__group button {
  display: flex;
  width: 100%;
  min-height: 36px;
  padding: 0 10px;
  align-items: center;
  justify-content: space-between;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--library-muted);
  cursor: pointer;
  font-size: 12px;
  text-align: left;
}

.library-nav__group button:hover {
  background: #11171a;
  color: var(--library-text);
}

.library-nav__group button.active {
  border-color: #2a4137;
  background: linear-gradient(90deg, #17261f, #111917);
  color: var(--library-accent-strong);
}

.library-nav__count {
  min-width: 22px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #1c2427;
  color: #aab4af;
  font-size: 10px;
  text-align: center;
}

.library-nav__boundary {
  display: grid;
  margin-top: auto;
  padding: 13px;
  border: 1px solid var(--library-border-soft);
  border-radius: 7px;
  background: #0d1214;
  color: var(--library-faint);
  gap: 5px;
}

.library-nav__boundary > span {
  color: var(--library-accent);
  font-size: 18px;
}

.library-nav__boundary p,
.library-nav__boundary small { margin: 0; }
.library-nav__boundary p { color: #aab5af; font-size: 11px; }
.library-nav__boundary small { font-size: 10px; line-height: 1.4; }

.library-main {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}

.library-main__mobile-view { display: none; }

.library-main__heading {
  display: flex;
  min-height: 68px;
  padding: 14px 20px 12px;
  align-items: flex-end;
  justify-content: space-between;
}

.library-main__heading span {
  color: var(--library-faint);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.library-main__heading h2 {
  margin: 4px 0 0;
  font-size: 17px;
  font-weight: 540;
}

.library-main__heading p {
  margin: 0;
  color: var(--library-muted);
  font-size: 11px;
}

.library-main__heading p strong {
  color: #d3dcd7;
  font-size: 13px;
}

.discovery-toolbar {
  display: grid;
  padding: 0 20px 12px;
  border-bottom: 1px solid var(--library-border-soft);
  gap: 9px;
}

.search-control {
  display: grid;
  min-height: 40px;
  grid-template-columns: 22px minmax(0, 1fr) auto;
  align-items: center;
  padding: 0 10px;
  border: 1px solid var(--library-border);
  border-radius: 7px;
  background: #0d1214;
  color: var(--library-faint);
  gap: 5px;
}

.search-control:focus-within {
  border-color: #4f7766;
  box-shadow: 0 0 0 2px rgb(111 180 147 / 10%);
}

.search-control input {
  width: 100%;
  height: 36px;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--library-text);
  font-size: 12px;
}

.search-control input::placeholder { color: #5f6a65; }

.search-control kbd {
  padding: 2px 6px;
  border: 1px solid #2a3337;
  border-radius: 4px;
  background: #141a1d;
  color: #6f7a75;
  font: 10px/1.3 ui-monospace, monospace;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 7px;
}

.filter-row label {
  position: relative;
  display: grid;
}

.filter-row label > span {
  position: absolute;
  z-index: 1;
  top: 5px;
  left: 9px;
  color: var(--library-faint);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.09em;
  pointer-events: none;
  text-transform: uppercase;
}

.filter-row select,
.library-main__mobile-view select {
  min-width: 0;
  height: 42px;
  padding: 15px 27px 3px 8px;
  border: 1px solid var(--library-border);
  border-radius: 6px;
  outline: 0;
  background: #0d1214;
  color: #cbd4cf;
  font-size: 11px;
  cursor: pointer;
}

.filter-chips {
  display: flex;
  min-height: 42px;
  padding: 8px 20px;
  align-items: center;
  border-bottom: 1px solid var(--library-border-soft);
  gap: 6px;
}

.filter-chips button {
  display: inline-flex;
  min-height: 25px;
  padding: 3px 7px;
  align-items: center;
  border: 1px solid #315043;
  border-radius: 999px;
  background: #14231d;
  color: #abd4bf;
  cursor: pointer;
  font-size: 10px;
  gap: 7px;
}

.filter-chips .filter-chips__clear {
  border-color: transparent;
  background: transparent;
  color: var(--library-muted);
}

.asset-grid-wrap {
  min-height: 0;
  flex: 1;
  overflow: auto;
  scrollbar-color: #303a3e transparent;
}

.asset-grid {
  display: grid;
  padding: 18px 20px 40px;
  grid-template-columns: repeat(auto-fill, minmax(174px, 1fr));
  align-items: start;
  gap: 13px;
}

.asset-card {
  display: grid;
  min-width: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--library-border);
  border-radius: 8px;
  background: #0e1316;
  color: inherit;
  cursor: pointer;
  text-align: left;
  transition: border-color 140ms ease, background 140ms ease, transform 140ms ease;
}

.asset-card:hover {
  border-color: #3b494d;
  background: #11181b;
  transform: translateY(-1px);
}

.asset-card.selected {
  border-color: #5e927a;
  box-shadow: 0 0 0 1px rgb(125 190 158 / 22%);
}

.asset-card__preview {
  position: relative;
  display: grid;
  width: 100%;
  aspect-ratio: 1.32;
  overflow: hidden;
  place-items: center;
}

.preview-surface--transparent,
.detail-preview__canvas--checker,
.background-swatch--checker {
  background-color: #171d20;
  background-image:
    linear-gradient(45deg, #242b2e 25%, transparent 25%),
    linear-gradient(-45deg, #242b2e 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #242b2e 75%),
    linear-gradient(-45deg, transparent 75%, #242b2e 75%);
  background-position: 0 0, 0 6px, 6px -6px, -6px 0;
  background-size: 12px 12px;
}

.preview-surface--neutral {
  background:
    radial-gradient(circle at 50% 45%, #27312e, #161c1e 68%),
    #161c1e;
}

.preview-surface--rejected {
  background: repeating-linear-gradient(
    135deg,
    #211719,
    #211719 12px,
    #261a1c 12px,
    #261a1c 24px
  );
}

.asset-card__preview img {
  width: 68%;
  height: 68%;
  object-fit: contain;
  image-rendering: auto;
}

.preview-fallback {
  display: grid;
  place-items: center;
  color: #9aa8a1;
}

.preview-fallback > i {
  position: absolute;
  width: 54%;
  height: 54%;
  border: 1px solid #52615a;
  border-radius: 7px 17px 7px 17px;
  opacity: 0.48;
  transform: rotate(-7deg);
}

.preview-fallback > strong {
  z-index: 1;
  font: 600 24px/1 "Segoe UI Variable", sans-serif;
  letter-spacing: -0.08em;
}

.preview-fallback > small {
  z-index: 1;
  margin-top: 6px;
  color: #75807b;
  font: 8px/1 ui-monospace, monospace;
  letter-spacing: 0.12em;
}

.asset-card__kind {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 3px 6px;
  border: 1px solid rgb(210 225 217 / 13%);
  border-radius: 4px;
  background: rgb(7 11 13 / 72%);
  color: #9ba7a1;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  backdrop-filter: blur(6px);
}

.asset-card__copy {
  display: grid;
  min-height: 55px;
  padding: 10px 11px 6px;
  gap: 4px;
}

.asset-card__copy strong {
  display: -webkit-box;
  overflow: hidden;
  color: #e4eae6;
  font-size: 12px;
  font-weight: 580;
  line-height: 1.25;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.asset-card__copy > span {
  overflow: hidden;
  color: var(--library-muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-card__footer {
  display: grid;
  min-height: 49px;
  padding: 5px 11px 10px;
  align-content: end;
  gap: 6px;
}

.asset-card__scope {
  overflow: hidden;
  color: #78847e;
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asset-card__scope i {
  color: #8fb7a3;
  font-style: normal;
}

.status-badge {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  min-height: 21px;
  padding: 3px 6px;
  align-items: center;
  border: 1px solid #34413c;
  border-radius: 4px;
  background: #151c19;
  color: #aeb9b3;
  font-size: 9px;
  line-height: 1.1;
  gap: 5px;
}

.status-badge i {
  display: inline-grid;
  width: 13px;
  height: 13px;
  flex: 0 0 auto;
  border: 1px solid currentColor;
  border-radius: 50%;
  place-items: center;
  font: 700 9px/1 ui-monospace, monospace;
}

.status-badge--needs-metadata,
.status-badge--warning {
  border-color: #5a4928;
  background: #211b11;
  color: #e1bb6f;
}

.status-badge--ready-for-catalog {
  border-color: #2d5360;
  background: #102027;
  color: #83c5da;
}

.status-badge--rejected {
  border-color: #613a38;
  background: #241514;
  color: #e18a83;
}

.status-badge--cataloged {
  border-color: #315243;
  background: #13221b;
  color: #8ec9aa;
}

.library-empty {
  display: grid;
  min-height: 0;
  margin: auto;
  padding: 36px;
  justify-items: center;
  color: var(--library-muted);
  text-align: center;
}

.library-empty > span { color: #53605a; font-size: 36px; }
.library-empty h3 { margin: 12px 0 4px; color: #cbd4cf; font-size: 14px; }
.library-empty p { max-width: 360px; margin: 0; font-size: 11px; line-height: 1.55; }
.library-empty button {
  margin-top: 16px;
  padding: 7px 10px;
  border: 1px solid #365648;
  border-radius: 5px;
  background: #14231d;
  color: #abd4be;
  cursor: pointer;
  font-size: 11px;
}

.asset-detail {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border-left: 1px solid var(--library-border);
  background: #0b1012;
}

.asset-detail__topbar {
  display: grid;
  min-height: 42px;
  padding: 0 9px;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  border-bottom: 1px solid var(--library-border);
  color: var(--library-faint);
  font-size: 9px;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
}

.asset-detail__topbar button {
  min-height: 28px;
  padding: 4px 7px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #9ca8a2;
  cursor: pointer;
  font-size: 11px;
  letter-spacing: 0;
  text-transform: none;
}

.asset-detail__back { visibility: hidden; }
.asset-detail__close { font-size: 18px !important; }

.asset-detail__scroll {
  height: calc(100% - 42px);
  overflow: auto;
  scrollbar-color: #303a3e transparent;
}

.detail-preview {
  border-bottom: 1px solid var(--library-border);
}

.detail-preview__toolbar {
  display: flex;
  min-height: 38px;
  padding: 5px 8px;
  align-items: center;
  justify-content: space-between;
  background: #0d1214;
  gap: 6px;
}

.detail-preview__toolbar > div {
  display: flex;
  align-items: center;
  gap: 3px;
}

.detail-preview__toolbar button {
  display: inline-grid;
  min-width: 27px;
  min-height: 27px;
  padding: 3px 6px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #89958f;
  cursor: pointer;
  place-items: center;
  font-size: 10px;
}

.detail-preview__toolbar button:hover,
.detail-preview__toolbar button[aria-pressed="true"] {
  border-color: #34423d;
  background: #161e1b;
  color: #c7d2cc;
}

.detail-preview__toolbar span {
  width: 34px;
  color: #74807a;
  font-size: 9px;
  text-align: center;
}

.background-swatch {
  display: block;
  width: 13px;
  height: 13px;
  border: 1px solid #56615d;
  border-radius: 2px;
}

.background-swatch--light { background: #d5d7d2; }
.background-swatch--dark { background: #101416; }

.detail-preview__canvas {
  display: grid;
  height: 260px;
  overflow: auto;
  place-items: center;
}

.detail-preview__canvas--light { background: #d7d9d4; }
.detail-preview__canvas--dark { background: #080a0b; }

.detail-preview__canvas > img {
  width: auto;
  height: auto;
  object-fit: contain;
  transform-origin: center;
  transition: transform 100ms ease;
}

.preview-fallback--large {
  position: relative;
  display: grid;
  width: 72%;
  max-width: 240px;
  min-height: 150px;
  padding: 24px;
  align-content: center;
  border: 1px solid rgb(140 155 148 / 20%);
  border-radius: 10px;
  background: rgb(18 25 27 / 72%);
  text-align: center;
}

.preview-fallback--large > i { width: 48%; height: 48%; }
.preview-fallback--large > strong { font-size: 34px; }
.preview-fallback--large > span { z-index: 1; margin-top: 15px; color: #bdc7c2; font-size: 11px; }
.preview-fallback--large > small { z-index: 1; max-width: 190px; margin-top: 5px; line-height: 1.35; }

.asset-detail__summary,
.asset-detail__issues,
.detail-section,
.detail-disclosure {
  margin: 0;
  padding: 15px 16px;
  border-bottom: 1px solid var(--library-border-soft);
}

.asset-detail__title h2 {
  margin: 8px 0 4px;
  color: #eef2ef;
  font-size: 18px;
  font-weight: 560;
  letter-spacing: -0.02em;
}

.asset-detail__title p {
  margin: 0;
  color: var(--library-muted);
  font-size: 11px;
  line-height: 1.5;
}

.asset-detail__classification {
  display: flex;
  margin-top: 11px;
  flex-wrap: wrap;
  gap: 5px;
}

.asset-detail__classification span,
.metadata-tag {
  padding: 3px 6px;
  border: 1px solid #2b3538;
  border-radius: 4px;
  background: #111719;
  color: #96a29c;
  font-size: 9px;
}

.asset-detail__status-copy {
  margin: 12px 0 0;
  padding: 9px 10px;
  border-left: 2px solid #527363;
  background: #101715;
  color: #8f9a95;
  font-size: 10px;
  line-height: 1.45;
}

.asset-detail__status-copy strong {
  display: block;
  color: #bbc6c0;
}

.asset-detail__primary-actions {
  display: flex;
  margin-top: 10px;
  gap: 8px;
}

.asset-detail__primary-actions button,
.promotion-error button,
.catalog-editor > button {
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid #3b735a;
  border-radius: 5px;
  background: #1b4b37;
  color: #e1f0e8;
  cursor: pointer;
  font-size: 10px;
  font-weight: 700;
}

.promotion-error {
  display: grid;
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #743b3b;
  border-radius: 5px;
  background: #2a1717;
  color: #d9a3a3;
  font-size: 10px;
  gap: 5px;
}

.promotion-error button { justify-self: start; border-color: #805151; background: #4a2525; }

.catalog-editor {
  display: grid;
  margin: 0;
  padding: 15px 16px;
  border-bottom: 1px solid var(--library-border-soft);
  background: #101719;
  gap: 14px;
}

.catalog-editor > header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.catalog-editor > header span,
.catalog-editor legend {
  color: var(--library-faint);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.catalog-editor > header h3 { margin: 3px 0 0; color: #d0dad5; font-size: 13px; }
.catalog-editor > header strong { color: #c7a96d; font-size: 9px; }

.catalog-editor fieldset {
  display: grid;
  margin: 0;
  padding: 11px;
  border: 1px solid var(--library-border-soft);
  border-radius: 6px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.catalog-editor legend { padding: 0 5px; }

.catalog-editor label {
  display: grid;
  color: #8f9b95;
  font-size: 9px;
  gap: 4px;
}

.catalog-editor input,
.catalog-editor select,
.catalog-editor textarea {
  width: 100%;
  min-width: 0;
  padding: 7px 8px;
  border: 1px solid #303b3e;
  border-radius: 4px;
  background: #0b1012;
  color: #d3dcd7;
  font: 10px/1.35 "Segoe UI Variable", sans-serif;
}

.catalog-editor textarea { resize: vertical; }
.catalog-editor__wide { grid-column: 1 / -1; }

.catalog-editor__confirmation {
  grid-template-columns: auto minmax(0, 1fr) !important;
  align-items: start;
  line-height: 1.4;
}

.catalog-editor__confirmation input { width: auto; margin-top: 2px; }
.catalog-editor > button { justify-self: start; }
.catalog-editor > p { margin: -7px 0 0; color: var(--library-faint); font-size: 9px; }

.catalog-editor__issues {
  display: grid;
  padding: 8px;
  border-left: 2px solid var(--library-attention);
  background: #1b1810;
  color: #baa980;
  font-size: 9px;
  gap: 3px;
}

.asset-detail__issues h3,
.detail-section h3 {
  margin: 0 0 10px;
  color: #c7d1cc;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.asset-detail__issues {
  background: #15130e;
}

.asset-detail__issues ul {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
  gap: 7px;
}

.asset-detail__issues li {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  color: #b5a98e;
  font-size: 10px;
  line-height: 1.4;
}

.asset-detail__issues li > span:first-child {
  color: var(--library-attention);
  font-weight: 700;
}

.asset-detail__issues li strong {
  display: block;
  color: #d5c8a9;
  font-weight: 600;
}

.metadata-grid {
  display: grid;
  margin: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 11px 14px;
}

.metadata-grid > div {
  min-width: 0;
}

.metadata-grid__wide { grid-column: 1 / -1; }

.metadata-grid dt {
  margin-bottom: 3px;
  color: var(--library-faint);
  font-size: 9px;
}

.metadata-grid dd {
  margin: 0;
  overflow-wrap: anywhere;
  color: #b8c2bd;
  font-size: 10px;
  line-height: 1.4;
}

.metadata-grid dd:has(.metadata-tag) {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.metadata-grid code,
.context-list code {
  color: #90a19a;
  font: 9px/1.45 ui-monospace, monospace;
  overflow-wrap: anywhere;
}

.detail-disclosure {
  padding: 0;
}

.detail-disclosure summary {
  display: flex;
  min-height: 43px;
  padding: 0 16px;
  align-items: center;
  justify-content: space-between;
  color: #c0cac5;
  cursor: pointer;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  list-style: none;
  text-transform: uppercase;
}

.detail-disclosure summary::after {
  color: #64706a;
  content: "+";
  font-size: 15px;
}

.detail-disclosure[open] summary::after { content: "−"; }

.detail-disclosure > :not(summary) {
  margin-right: 16px;
  margin-left: 16px;
}

.detail-disclosure > .metadata-grid,
.detail-disclosure > .compatibility-list,
.detail-disclosure > .context-list {
  margin-bottom: 15px;
}

.compatibility-list {
  display: grid;
  gap: 9px;
}

.compatibility-list > div {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
}

.compatibility-list strong {
  width: 100%;
  color: #7c8882;
  font-size: 9px;
  font-weight: 500;
}

.compatibility-list span {
  padding: 3px 6px;
  border-radius: 4px;
  background: #141a1c;
  color: #aab5af;
  font-size: 9px;
}

.detail-note {
  margin-top: 0;
  margin-bottom: 15px;
  color: #6f7a75;
  font-size: 9px;
  line-height: 1.45;
}

.context-list {
  display: grid;
  padding: 0;
  list-style: none;
  gap: 7px;
}

.context-list li {
  display: grid;
  padding: 8px;
  border: 1px solid var(--library-border-soft);
  border-radius: 5px;
  background: #0f1416;
  gap: 3px;
}

.context-list strong { color: #bbc5c0; font-size: 10px; }
.context-list span { color: #78837e; font-size: 9px; }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (max-width: 1180px) {
  .asset-library__header { min-height: 72px; padding: 13px 16px; }
  .asset-library__identity p { display: none; }
  .asset-library__body,
  .asset-library__body--detail {
    grid-template-columns: 1fr;
  }
  .library-nav { display: none; }
  .library-main__mobile-view {
    display: flex;
    padding: 10px 14px 0;
    align-items: center;
    gap: 8px;
  }
  .library-main__mobile-view label {
    color: var(--library-faint);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .library-main__mobile-view select {
    height: 34px;
    padding: 4px 25px 4px 8px;
  }
  .asset-library__body--detail .library-main { display: none; }
  .asset-detail {
    grid-column: 1;
    border-left: 0;
  }
  .asset-detail__back { visibility: visible; }
  .asset-detail__close { visibility: hidden; }
  .detail-preview__canvas { height: 230px; }
}

@media (max-width: 1060px) {
  .filter-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .asset-grid { grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); }
}

@media (prefers-reduced-motion: reduce) {
  .asset-library *,
  .asset-library *::before,
  .asset-library *::after {
    animation-duration: 0.01ms !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}

@keyframes library-spin {
  to { transform: rotate(360deg); }
}
</style>
