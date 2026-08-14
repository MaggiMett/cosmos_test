<template>
  <main class="builder-preview" data-testid="base-builder-preview">
    <header class="builder-preview__header">
      <div>
        <span class="builder-preview__badge">Development Preview</span>
        <strong>Base Builder Prototype</strong>
        <small>Lokale Fixture-Session · keine Runtime · keine Persistenz</small>
      </div>

      <nav class="builder-preview__toolbar" aria-label="Builder actions">
        <template v-if="!state.testMode">
          <button
            type="button"
            :disabled="!state.history.canUndo"
            :title="state.history.undoLabel"
            data-testid="builder-undo"
            @click="undo"
          >
            ↶ Undo
          </button>
          <button
            type="button"
            :disabled="!state.history.canRedo"
            :title="state.history.redoLabel"
            data-testid="builder-redo"
            @click="redo"
          >
            ↷ Redo
          </button>
          <span class="builder-preview__toolbar-divider" aria-hidden="true" />
          <button type="button" :disabled="persistenceBusy" data-testid="builder-save" @click="savePersisted">Speichern</button>
          <button type="button" :disabled="!activationAvailable" data-testid="builder-activate" @click="requestActivation">Aktivieren</button>
          <button type="button" :disabled="persistenceBusy" data-testid="builder-reload" @click="loadPersisted">Gespeichert laden</button>
          <button type="button" @click="resetPreset">Preset zurücksetzen</button>
          <button type="button" data-testid="builder-load-empty" @click="loadEmpty">
            Leerer Raum
          </button>
          <button type="button" data-testid="builder-load-standard" @click="loadStandard">
            Standardlayout
          </button>
          <button type="button" @click="simulateTheme">
            Theme: {{ state.activeTheme === "cool" ? "Kühl" : "Warm" }}
          </button>
          <label class="builder-preview__toggle">
            <input
              type="checkbox"
              :checked="state.gridEnabled"
              @change="toggleGrid"
            />
            Raster
          </label>
        </template>
        <button
          type="button"
          :class="{ active: state.testMode }"
          data-testid="builder-test-mode"
          @click="toggleTestMode"
        >
          {{ state.testMode ? "Testmodus beenden" : "Testmodus" }}
        </button>
      </nav>
    </header>

    <section v-if="persistenceMessage" class="builder-persistence" :data-phase="lifecycle.phase" role="status">
      <span>{{ persistenceMessage }}</span>
      <template v-if="activationConfirmationPending">
        <button type="button" data-testid="builder-activate-confirm" @click="confirmActivation">Gespeicherte Revision aktivieren</button>
        <button type="button" data-testid="builder-activate-cancel" @click="cancelActivation">Abbrechen</button>
      </template>
      <template v-else-if="reloadConfirmationPending">
        <button type="button" data-testid="builder-reload-confirm" @click="confirmLoadPersisted">Änderungen verwerfen & laden</button>
        <button type="button" data-testid="builder-reload-cancel" @click="cancelLoadPersisted">Abbrechen</button>
      </template>
      <template v-else-if="lifecycle.phase === 'conflict'">
        <button type="button" data-testid="builder-conflict-reload" @click="reloadConflict">Remote laden</button>
        <button type="button" data-testid="builder-conflict-discard" @click="discardConflict">Lokale Änderungen verwerfen</button>
      </template>
    </section>

    <section class="builder-preview__workspace">
      <aside v-if="!state.testMode" class="builder-panel builder-catalog">
        <div class="builder-panel__heading">
          <div>
            <span>Objektkatalog</span>
            <small>{{ filteredCatalog.length }} technische Objekte</small>
          </div>
        </div>

        <label class="builder-catalog__search">
          <span class="sr-only">Katalog durchsuchen</span>
          <input
            v-model="search"
            type="search"
            placeholder="Objekte suchen…"
            data-testid="builder-catalog-search"
          />
        </label>

        <div class="builder-catalog__categories" aria-label="Kategorien">
          <button
            v-for="category in categories"
            :key="category.id"
            type="button"
            :class="{ selected: selectedCategory === category.id }"
            @click="selectedCategory = category.id"
          >
            {{ category.label }}
          </button>
        </div>

        <div class="builder-catalog__items">
          <article
            v-for="entry in filteredCatalog"
            :key="entry.entryId"
            class="catalog-card"
            :data-tone="entry.placeholderTone"
            draggable="true"
            @dragstart="beginCatalogDrag($event, entry)"
            @dragend="endCatalogDrag"
          >
            <span class="catalog-card__glyph" aria-hidden="true">
              {{ catalogGlyph(entry) }}
            </span>
            <div>
              <strong>{{ entry.label }}</strong>
              <small>{{ entry.description }}</small>
            </div>
            <button type="button" @click="placeAtDefault(entry)">
              Hinzufügen
            </button>
          </article>
        </div>
      </aside>

      <section
        ref="canvasHost"
        class="builder-canvas"
        :class="{
          'builder-canvas--test': state.testMode,
          'builder-canvas--invalid': placementPreview && !placementPreview.valid,
        }"
        aria-label="Room Canvas"
        data-testid="builder-room-canvas"
        @dragover.prevent="previewCatalogDrop"
        @drop.prevent="dropCatalog"
        @dragleave.self="clearPlacementPreview"
      >
        <div v-if="!state.testMode" class="builder-canvas__legend">
          <span><i class="legend-valid" /> gültig</span>
          <span><i class="legend-invalid" /> ungültig</span>
          <span><i class="legend-snap" /> Snap Target</span>
        </div>

        <svg
          ref="canvasSvg"
          class="builder-canvas__svg"
          :viewBox="`0 0 ${session.shell.referenceViewport.width} ${session.shell.referenceViewport.height}`"
          role="img"
          aria-label="Neutral technical room"
          @pointerdown.self="clearSelection"
        >
          <defs>
            <pattern
              id="builder-grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" stroke-width="1" />
            </pattern>
          </defs>

          <rect class="room-surface room-surface--background" x="0" y="0" width="1600" height="900" />
          <rect
            v-for="surface in shellSurfaces"
            :key="surface.surfaceId"
            class="room-surface"
            :class="`room-surface--${surface.surfaceKind}`"
            v-bind="svgBounds(surface.bounds)"
          />
          <rect
            v-if="state.gridEnabled && !state.testMode"
            class="builder-canvas__grid"
            x="0"
            y="0"
            width="1600"
            height="900"
          />

          <g v-if="placementPreview && !state.testMode" class="placement-guides">
            <component
              :is="boundsElement(placementPreview.targetBounds)"
              v-if="placementPreview.targetBounds"
              class="placement-guides__target"
              :class="{ invalid: !placementPreview.valid }"
              v-bind="svgBounds(placementPreview.targetBounds)"
            />
            <line
              v-if="previewCenter"
              class="placement-guides__cross"
              :x1="previewCenter.x - 20"
              :y1="previewCenter.y"
              :x2="previewCenter.x + 20"
              :y2="previewCenter.y"
            />
            <line
              v-if="previewCenter"
              class="placement-guides__cross"
              :x1="previewCenter.x"
              :y1="previewCenter.y - 20"
              :x2="previewCenter.x"
              :y2="previewCenter.y + 20"
            />
          </g>

          <g
            v-for="instance in orderedInstances"
            :key="instance.instanceId"
            class="builder-object"
            :class="{
              selected: state.selectedObjectId === instance.instanceId,
              functional: Boolean(functionFor(instance.instanceId)),
            }"
            :data-instance-id="instance.instanceId"
            :transform="objectTransform(instance)"
            tabindex="0"
            role="button"
            :aria-label="objectLabel(instance)"
            @pointerdown.stop="beginObjectPointer($event, instance)"
            @keydown.delete.prevent="deleteObject(instance.instanceId)"
            @keydown.backspace.prevent="deleteObject(instance.instanceId)"
          >
            <rect
              class="builder-object__shape"
              :class="familyClass(instance)"
              v-bind="localVisualBounds(instance)"
              rx="12"
            />
            <path
              v-if="objectFor(instance).family === 'door'"
              class="builder-object__detail"
              :d="doorDetail(instance)"
            />
            <path
              v-else-if="objectFor(instance).family === 'light'"
              class="builder-object__detail"
              :d="lightDetail(instance)"
            />
            <line
              v-else
              class="builder-object__detail"
              x1="12"
              :y1="Math.max(20, visualSize(instance).y * 0.66)"
              :x2="Math.max(24, visualSize(instance).x - 12)"
              :y2="Math.max(20, visualSize(instance).y * 0.66)"
            />
            <text
              class="builder-object__label"
              :x="visualSize(instance).x / 2"
              :y="Math.max(22, visualSize(instance).y / 2)"
              text-anchor="middle"
            >
              {{ shortObjectLabel(instance) }}
            </text>

            <rect
              v-if="showBoundsFor(instance.instanceId)"
              class="builder-object__interaction"
              v-bind="interactionBounds(instance.instanceId)"
              @pointerdown.stop="testInteraction(instance.instanceId)"
            />

            <template
              v-if="state.selectedObjectId === instance.instanceId && !state.testMode"
            >
              <rect
                class="builder-object__selection"
                x="-8"
                y="-8"
                :width="visualSize(instance).x + 16"
                :height="visualSize(instance).y + 16"
                rx="14"
              />
              <circle
                class="builder-handle builder-handle--rotate"
                :cx="visualSize(instance).x / 2"
                cy="-34"
                r="12"
                @pointerdown.stop="beginTransformPointer($event, instance, 'rotate')"
              />
              <line
                class="builder-handle__stem"
                :x1="visualSize(instance).x / 2"
                y1="-8"
                :x2="visualSize(instance).x / 2"
                y2="-22"
              />
              <rect
                class="builder-handle builder-handle--resize"
                :x="visualSize(instance).x - 10"
                :y="visualSize(instance).y - 10"
                width="20"
                height="20"
                rx="4"
                @pointerdown.stop="beginTransformPointer($event, instance, 'resize')"
              />
            </template>
          </g>

          <g
            v-if="placementPreview && previewObject && !state.testMode"
            class="builder-object builder-object--preview"
            :class="{ invalid: !placementPreview.valid }"
            :transform="previewTransform"
          >
            <rect
              class="builder-object__shape"
              x="0"
              y="0"
              :width="previewObjectSize.x"
              :height="previewObjectSize.y"
              rx="12"
            />
            <text
              class="builder-object__label"
              :x="previewObjectSize.x / 2"
              :y="previewObjectSize.y / 2"
              text-anchor="middle"
            >
              {{ previewObject.displayName }}
            </text>
          </g>
        </svg>

        <p
          class="builder-canvas__feedback"
          :class="`builder-canvas__feedback--${activeFeedback.kind}`"
          role="status"
          aria-live="polite"
          data-testid="builder-feedback"
        >
          {{ activeFeedback.message }}
        </p>
      </section>

      <aside v-if="!state.testMode" class="builder-panel builder-properties">
        <div class="builder-panel__heading">
          <div>
            <span>Eigenschaften</span>
            <small v-if="selectedInstance">{{ objectLabel(selectedInstance) }}</small>
            <small v-else>Objekt auswählen</small>
          </div>
        </div>

        <div v-if="selectedInstance" class="builder-properties__content">
          <section class="property-section">
            <h2>Transform</h2>
            <div class="property-grid">
              <label>
                X
                <input
                  type="number"
                  :value="round(selectedInstance.position.x)"
                  @change="updatePosition('x', $event)"
                />
              </label>
              <label>
                Y
                <input
                  type="number"
                  :value="round(selectedInstance.position.y)"
                  @change="updatePosition('y', $event)"
                />
              </label>
              <button type="button" class="property-reset" @click="resetProperty('position')">
                Reset
              </button>
              <OverrideBadge :mode="override('position')" />

              <label>
                Rotation
                <input
                  type="number"
                  step="15"
                  :value="round(selectedInstance.rotation)"
                  @change="updateRotation"
                />
              </label>
              <button type="button" class="property-reset" @click="resetProperty('rotation')">
                Reset
              </button>
              <OverrideBadge :mode="override('rotation')" />

              <label>
                Skalierung
                <input
                  type="number"
                  min="0.5"
                  max="2"
                  step="0.1"
                  :value="round(selectedInstance.scale.x, 2)"
                  @change="updateScale"
                />
              </label>
              <button type="button" class="property-reset" @click="resetProperty('scale')">
                Reset
              </button>
              <OverrideBadge :mode="override('scale')" />
            </div>
          </section>

          <section class="property-section">
            <h2>Layer &amp; Depth</h2>
            <dl class="property-readout">
              <div><dt>Layer</dt><dd>{{ selectedInstance.layer }}</dd></div>
              <div><dt>Depth</dt><dd>{{ selectedInstance.depth }}</dd></div>
            </dl>
            <div class="property-actions">
              <button type="button" @click="moveDepth(-1)">Nach hinten</button>
              <button type="button" @click="moveDepth(1)">Nach vorne</button>
              <button type="button" @click="resetProperty('layer')">Layer Reset</button>
              <button type="button" @click="resetProperty('depth')">Depth Reset</button>
            </div>
            <OverrideBadge :mode="override('depth')" />
          </section>

          <section class="property-section">
            <h2>Skin</h2>
            <label>
              Skin-Referenz
              <select :value="selectedInstance.skinRef.id" @change="updateSkin">
                <option
                  v-for="skin in session.skins"
                  :key="skin.id"
                  :value="skin.id"
                >
                  {{ skin.label }}
                </option>
              </select>
            </label>
            <div class="property-inline">
              <code>{{ selectedInstance.skinRef.id }}</code>
              <button type="button" @click="resetProperty('skin')">Reset</button>
            </div>
            <OverrideBadge :mode="override('skin')" />
          </section>

          <section class="property-section">
            <h2>Function Container</h2>
            <template v-if="selectedFunction">
              <dl class="property-readout">
                <div>
                  <dt>Typ</dt>
                  <dd>{{ selectedFunction.definition.functionType }}</dd>
                </div>
                <div>
                  <dt>Binding</dt>
                  <dd>{{ selectedFunction.definition.functionBinding.actionRole }}</dd>
                </div>
                <div>
                  <dt>Quelle</dt>
                  <dd>Core Runtime Context</dd>
                </div>
              </dl>
              <label class="builder-preview__toggle">
                <input
                  type="checkbox"
                  :checked="state.showInteractionBounds"
                  @change="toggleInteractionBounds"
                />
                Interaction Bounds anzeigen
              </label>
              <button type="button" class="property-danger" @click="removeFunction">
                Lokal entfernen
              </button>
            </template>
            <template v-else>
              <p>Kein Function Container verbunden.</p>
              <button
                v-if="selectedCatalogEntry?.defaultFunctionContainer"
                type="button"
                @click="assignFunction"
              >
                Standardfunktion verbinden
              </button>
            </template>
          </section>

          <section class="property-section property-section--actions">
            <button type="button" @click="duplicateSelected">Duplizieren</button>
            <button type="button" class="property-danger" @click="deleteSelected">
              Löschen
            </button>
          </section>
        </div>

        <div v-else class="builder-properties__empty">
          <span aria-hidden="true">◇</span>
          <p>Wähle ein Objekt im Room Canvas aus.</p>
          <small>Transform, Skin und Funktion bleiben getrennt editierbar.</small>
        </div>
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  type PropType,
} from "vue";

import type {
  CatalogObject,
  FunctionContainerInstance,
  ObjectInstance,
  PropertyOverrideMode,
} from "../../theme-engine/roomCompositionTypes";
import type { BoundsShape, Point } from "../../theme-engine/types";
import { cosmosApiClient } from "../../runtime/apiClient";
import { BaseBuilderLifecycle } from "./baseBuilderLifecycle";
import {
  baseBuilderCatalogEntries,
  type BaseBuilderCatalogCategory,
  type BaseBuilderCatalogEntry,
} from "./baseBuilderFixtures";
import {
  BaseBuilderSession,
  overrideMode,
  type BaseBuilderPlacementPreview,
  type BaseBuilderProperty,
} from "./baseBuilderSession";

const OverrideBadge = defineComponent({
  props: {
    mode: {
      type: String as PropType<PropertyOverrideMode>,
      required: true,
    },
  },
  setup(props) {
    return () =>
      h(
        "span",
        {
          class: [
            "override-badge",
            `override-badge--${props.mode}`,
          ],
        },
        props.mode,
      );
  },
});

const session = new BaseBuilderSession();
const lifecycle = new BaseBuilderLifecycle(cosmosApiClient, "cosmos.base.default");
const state = ref(session.snapshot());
const persistenceTick = ref(0);
const persistedFingerprint = ref<string | null>(null);
const reloadConfirmationPending = ref(false);
const activationConfirmationPending = ref(false);
const activationMessage = ref<string | null>(null);
const currentFingerprint = computed(() => JSON.stringify(state.value.composition));
const persistenceDirty = computed(() => persistedFingerprint.value !== currentFingerprint.value);
const activationAvailable = computed(() => !persistenceBusy.value && !persistenceDirty.value && Boolean(lifecycle.revisionId));
const persistenceBusy = computed(() => {
  persistenceTick.value;
  return lifecycle.phase === "loading" || lifecycle.phase === "saving";
});
const persistenceMessage = computed(() => {
  persistenceTick.value;
  if (activationConfirmationPending.value) return `Revision ${lifecycle.revisionId} wirklich für die Runtime aktivieren?`;
  if (reloadConfirmationPending.value) return "Ungespeicherte Änderungen würden beim Laden verworfen.";
  if (activationMessage.value) return activationMessage.value;
  if (lifecycle.phase === "conflict") return "Speicherkonflikt: Remote-Stand laden oder lokale Änderungen verwerfen.";
  if (lifecycle.phase === "error") return lifecycle.error ?? "Persistenzfehler";
  if (lifecycle.phase === "saving") return "Base-Dokument wird gespeichert…";
  if (lifecycle.phase === "loading") return "Gespeichertes Base-Dokument wird geladen…";
  if (persistenceDirty.value) return lifecycle.revisionId ? `Ungespeicherte Änderungen · Revision ${lifecycle.revisionId}` : "Ungespeicherte Änderungen";
  return lifecycle.revisionId ? `Gespeichert · Revision ${lifecycle.revisionId}` : "";
});
const search = ref("");
const selectedCategory = ref<BaseBuilderCatalogCategory | "all">("all");
const placementPreview = ref<Readonly<BaseBuilderPlacementPreview> | null>(
  null,
);
const draggedCatalogId = ref<string | null>(null);
const canvasHost = ref<HTMLElement | null>(null);
const canvasSvg = ref<SVGSVGElement | null>(null);

const categories = [
  { id: "all" as const, label: "Alle" },
  { id: "architecture" as const, label: "Architektur" },
  { id: "workspace" as const, label: "Workspaces" },
  { id: "furniture" as const, label: "Möbel" },
  { id: "lighting" as const, label: "Licht" },
  { id: "decoration" as const, label: "Dekoration" },
  { id: "companion" as const, label: "Companion" },
];

const filteredCatalog = computed(() => {
  const query = search.value.trim().toLocaleLowerCase("de");
  return baseBuilderCatalogEntries.filter(
    (entry) =>
      (selectedCategory.value === "all" ||
        entry.category === selectedCategory.value) &&
      (!query ||
        entry.label.toLocaleLowerCase("de").includes(query) ||
        entry.description.toLocaleLowerCase("de").includes(query)),
  );
});
const shellSurfaces = computed(() =>
  session.shell.placementSurfaces.filter(
    (surface) =>
      surface.surfaceKind === "wall" ||
      surface.surfaceKind === "floor" ||
      surface.surfaceKind === "ceiling",
  ),
);
const orderedInstances = computed(() =>
  [...state.value.composition.objectInstances].sort(
    (left, right) =>
      left.depth - right.depth ||
      compareText(left.instanceId, right.instanceId),
  ),
);
const selectedInstance = computed(() =>
  state.value.composition.objectInstances.find(
    (instance) =>
      instance.instanceId === state.value.selectedObjectId,
  ),
);
const selectedCatalogEntry = computed(() =>
  selectedInstance.value
    ? session.catalog.find(
        (entry) =>
          entry.object.catalogObjectId ===
          selectedInstance.value!.catalogObjectRef.id,
      )
    : undefined,
);
const selectedFunction = computed(() => {
  if (!selectedInstance.value) return undefined;
  const instance =
    state.value.composition.functionContainers.find(
      (container) =>
        container.attachedObjectInstanceId ===
        selectedInstance.value!.instanceId,
    );
  return instance
    ? { instance, definition: session.functionDefinition(instance.definitionRef.id) }
    : undefined;
});
const activeFeedback = computed(() =>
  placementPreview.value
    ? {
        kind: placementPreview.value.valid ? "valid" : "invalid",
        message: placementPreview.value.message,
      }
    : state.value.feedback,
);
const previewObject = computed(() =>
  placementPreview.value
    ? session.catalogObject(placementPreview.value.catalogObjectId)
    : undefined,
);
const previewObjectSize = computed(() =>
  previewObject.value
    ? boundsSize(previewObject.value.defaultBounds.visual)
    : { x: 0, y: 0 },
);
const previewTransform = computed(() => {
  const preview = placementPreview.value;
  if (!preview) return "";
  const size = previewObjectSize.value;
  return [
    `translate(${preview.position.x} ${preview.position.y})`,
    `rotate(${preview.rotation} ${size.x / 2} ${size.y / 2})`,
    `scale(${preview.scale.x} ${preview.scale.y})`,
  ].join(" ");
});
const previewCenter = computed(() => {
  const preview = placementPreview.value;
  if (!preview) return undefined;
  return {
    x:
      preview.position.x +
      (previewObjectSize.value.x * preview.scale.x) / 2,
    y:
      preview.position.y +
      (previewObjectSize.value.y * preview.scale.y) / 2,
  };
});

type PointerMode = "move" | "resize" | "rotate";
interface ActivePointer {
  pointerId: number;
  instanceId: string;
  mode: PointerMode;
  start: Point;
  initialScale: Point;
  initialRotation: number;
  lastPoint: Point;
  previousTargetId?: string;
}
const activePointer = ref<ActivePointer | null>(null);

function refresh() {
  state.value = session.snapshot();
}

function undo() {
  session.undo();
  placementPreview.value = null;
  refresh();
}

function redo() {
  session.redo();
  placementPreview.value = null;
  refresh();
}

function resetPreset() {
  session.resetToPreset();
  placementPreview.value = null;
  refresh();
}

function loadEmpty() {
  session.loadEmpty();
  placementPreview.value = null;
  refresh();
}

function loadStandard() {
  session.loadStandard();
  placementPreview.value = null;
  refresh();
}

function simulateTheme() {
  session.simulateThemeChange();
  refresh();
}

function toggleGrid(event: Event) {
  session.setGridEnabled((event.target as HTMLInputElement).checked);
  refresh();
}

function toggleTestMode() {
  session.setTestMode(!state.value.testMode);
  placementPreview.value = null;
  refresh();
}

function toggleInteractionBounds(event: Event) {
  session.setInteractionBoundsVisible(
    (event.target as HTMLInputElement).checked,
  );
  refresh();
}

function beginCatalogDrag(
  event: DragEvent,
  entry: Readonly<BaseBuilderCatalogEntry>,
) {
  draggedCatalogId.value = entry.object.catalogObjectId;
  event.dataTransfer?.setData(
    "application/x-cosmos-catalog-object",
    entry.object.catalogObjectId,
  );
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "copy";
}

function endCatalogDrag() {
  draggedCatalogId.value = null;
  placementPreview.value = null;
}

function previewCatalogDrop(event: DragEvent) {
  const catalogId =
    draggedCatalogId.value ??
    event.dataTransfer?.getData(
      "application/x-cosmos-catalog-object",
    );
  if (!catalogId) return;
  placementPreview.value = session.previewCatalogPlacement(
    catalogId,
    eventPoint(event),
    placementPreview.value?.targetId,
  );
}

function dropCatalog(event: DragEvent) {
  const catalogId =
    draggedCatalogId.value ??
    event.dataTransfer?.getData(
      "application/x-cosmos-catalog-object",
    );
  if (!catalogId) return;
  session.place(
    catalogId,
    eventPoint(event),
    placementPreview.value?.targetId,
  );
  draggedCatalogId.value = null;
  placementPreview.value = null;
  refresh();
}

function placeAtDefault(entry: Readonly<BaseBuilderCatalogEntry>) {
  session.place(
    entry.object.catalogObjectId,
    entry.defaultPlacementPoint,
  );
  placementPreview.value = null;
  refresh();
}

function clearPlacementPreview() {
  if (!activePointer.value) placementPreview.value = null;
}

function clearSelection() {
  session.select(null);
  refresh();
}

function beginObjectPointer(event: PointerEvent, instance: ObjectInstance) {
  if (state.value.testMode) {
    testInteraction(instance.instanceId);
    return;
  }
  session.select(instance.instanceId);
  refresh();
  beginPointer(event, instance, "move");
}

function beginTransformPointer(
  event: PointerEvent,
  instance: ObjectInstance,
  mode: Exclude<PointerMode, "move">,
) {
  beginPointer(event, instance, mode);
}

function beginPointer(
  event: PointerEvent,
  instance: ObjectInstance,
  mode: PointerMode,
) {
  const point = eventPoint(event);
  activePointer.value = {
    pointerId: event.pointerId,
    instanceId: instance.instanceId,
    mode,
    start: point,
    initialScale: { ...instance.scale },
    initialRotation: instance.rotation,
    lastPoint: point,
    previousTargetId: instance.parentAttachment
      ? `${instance.parentAttachment.parentInstanceId}:${instance.parentAttachment.anchorId}`
      : instance.surfaceBinding.surfaceId,
  };
}

function handlePointerMove(event: PointerEvent) {
  const active = activePointer.value;
  if (!active || active.pointerId !== event.pointerId) return;
  const point = eventPoint(event);
  active.lastPoint = point;
  const instance = state.value.composition.objectInstances.find(
    (candidate) => candidate.instanceId === active.instanceId,
  );
  if (!instance) return;
  if (active.mode === "move") {
    placementPreview.value = session.previewMove(
      active.instanceId,
      point,
      placementPreview.value?.targetId ?? active.previousTargetId,
    );
  }
}

function handlePointerUp(event: PointerEvent) {
  const active = activePointer.value;
  if (!active || active.pointerId !== event.pointerId) return;
  const instance = state.value.composition.objectInstances.find(
    (candidate) => candidate.instanceId === active.instanceId,
  );
  if (instance) {
    if (active.mode === "move") {
      session.move(
        active.instanceId,
        active.lastPoint,
        placementPreview.value?.targetId ?? active.previousTargetId,
      );
    } else if (active.mode === "resize") {
      const delta = {
        x: active.lastPoint.x - active.start.x,
        y: active.lastPoint.y - active.start.y,
      };
      const size = visualSize(instance);
      const factor = Math.max(
        0.5,
        Math.min(
          2,
          active.initialScale.x +
            Math.max(delta.x / Math.max(size.x, 1), delta.y / Math.max(size.y, 1)),
        ),
      );
      session.scale(active.instanceId, { x: factor, y: factor });
    } else {
      const center = objectCenter(instance);
      const startAngle = Math.atan2(
        active.start.y - center.y,
        active.start.x - center.x,
      );
      const endAngle = Math.atan2(
        active.lastPoint.y - center.y,
        active.lastPoint.x - center.x,
      );
      const degrees =
        active.initialRotation +
        ((endAngle - startAngle) * 180) / Math.PI;
      session.rotate(active.instanceId, Math.round(degrees / 15) * 15);
    }
  }
  activePointer.value = null;
  placementPreview.value = null;
  refresh();
}

function deleteSelected() {
  if (!selectedInstance.value) return;
  deleteObject(selectedInstance.value.instanceId);
}

function deleteObject(instanceId: string) {
  session.delete(instanceId);
  placementPreview.value = null;
  refresh();
}

function duplicateSelected() {
  if (!selectedInstance.value) return;
  session.duplicate(selectedInstance.value.instanceId);
  refresh();
}

function moveDepth(direction: -1 | 1) {
  if (!selectedInstance.value) return;
  session.changeDepth(selectedInstance.value.instanceId, direction);
  refresh();
}

function resetProperty(property: BaseBuilderProperty) {
  if (!selectedInstance.value) return;
  session.resetProperty(selectedInstance.value.instanceId, property);
  refresh();
}

function updatePosition(axis: "x" | "y", event: Event) {
  const instance = selectedInstance.value;
  if (!instance) return;
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  const size = visualSize(instance);
  const desiredPosition = { ...instance.position, [axis]: value };
  session.move(instance.instanceId, {
    x: desiredPosition.x + (size.x * instance.scale.x) / 2,
    y: desiredPosition.y + (size.y * instance.scale.y) / 2,
  });
  refresh();
}

function updateRotation(event: Event) {
  if (!selectedInstance.value) return;
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  session.rotate(selectedInstance.value.instanceId, value);
  refresh();
}

function updateScale(event: Event) {
  if (!selectedInstance.value) return;
  const value = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(value)) return;
  session.scale(selectedInstance.value.instanceId, { x: value, y: value });
  refresh();
}

function updateSkin(event: Event) {
  if (!selectedInstance.value) return;
  const selected = session.skins.find(
    (skin) => skin.id === (event.target as HTMLSelectElement).value,
  );
  if (!selected) return;
  session.changeSkin(selectedInstance.value.instanceId, {
    id: selected.id,
    versionRange: selected.versionRange,
  });
  refresh();
}

function assignFunction() {
  if (!selectedInstance.value) return;
  session.assignDefaultFunction(selectedInstance.value.instanceId);
  refresh();
}

function removeFunction() {
  if (!selectedInstance.value) return;
  session.removeFunction(selectedInstance.value.instanceId);
  refresh();
}

function testInteraction(instanceId: string) {
  if (!state.value.testMode && !state.value.showInteractionBounds) return;
  session.testFunction(instanceId);
  refresh();
}

function showBoundsFor(instanceId: string): boolean {
  return Boolean(
    functionFor(instanceId) &&
      (state.value.showInteractionBounds || state.value.testMode),
  );
}

function functionFor(
  instanceId: string,
): FunctionContainerInstance | undefined {
  return state.value.composition.functionContainers.find(
    (container) => container.attachedObjectInstanceId === instanceId,
  );
}

function interactionBounds(instanceId: string) {
  const container = functionFor(instanceId);
  if (!container) return {};
  return svgBounds(
    session.functionDefinition(container.definitionRef.id).interactionBounds,
  );
}

function override(property: BaseBuilderProperty): PropertyOverrideMode {
  return selectedInstance.value
    ? overrideMode(selectedInstance.value, property)
    : "inherit";
}

function objectFor(instance: ObjectInstance): Readonly<CatalogObject> {
  return session.catalogObject(instance.catalogObjectRef.id);
}

function objectLabel(instance: ObjectInstance): string {
  const entry = session.catalog.find(
    (candidate) =>
      candidate.object.catalogObjectId === instance.catalogObjectRef.id,
  );
  return entry?.label ?? objectFor(instance).displayName;
}

function shortObjectLabel(instance: ObjectInstance): string {
  const label = objectLabel(instance);
  return label.length > 18 ? `${label.slice(0, 16)}…` : label;
}

function catalogGlyph(entry: Readonly<BaseBuilderCatalogEntry>): string {
  const glyphs: Record<BaseBuilderCatalogCategory, string> = {
    architecture: "▥",
    workspace: "⌑",
    furniture: "▱",
    lighting: "✦",
    decoration: "◇",
    companion: "◎",
  };
  return glyphs[entry.category];
}

function familyClass(instance: ObjectInstance): string {
  return `family-${objectFor(instance).family}`;
}

function objectTransform(instance: ObjectInstance): string {
  const size = visualSize(instance);
  return [
    `translate(${instance.position.x} ${instance.position.y})`,
    `rotate(${instance.rotation} ${size.x / 2} ${size.y / 2})`,
    `scale(${instance.scale.x} ${instance.scale.y})`,
  ].join(" ");
}

function visualSize(instance: ObjectInstance): Point {
  return boundsSize(objectFor(instance).defaultBounds.visual);
}

function objectCenter(instance: ObjectInstance): Point {
  const size = visualSize(instance);
  return {
    x: instance.position.x + (size.x * instance.scale.x) / 2,
    y: instance.position.y + (size.y * instance.scale.y) / 2,
  };
}

function localVisualBounds(instance: ObjectInstance) {
  return svgBounds(objectFor(instance).defaultBounds.visual);
}

function doorDetail(instance: ObjectInstance): string {
  const size = visualSize(instance);
  return `M ${size.x * 0.72} ${size.y * 0.18} L ${size.x * 0.72} ${size.y * 0.82}`;
}

function lightDetail(instance: ObjectInstance): string {
  const size = visualSize(instance);
  return `M ${size.x * 0.2} ${size.y * 0.66} L ${size.x * 0.5} ${size.y * 0.25} L ${size.x * 0.8} ${size.y * 0.66}`;
}

function svgBounds(shape: BoundsShape | undefined): Record<string, number | string> {
  if (!shape) return {};
  if (shape.type === "rect") {
    return {
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      ...(shape.radius !== undefined ? { rx: shape.radius } : {}),
    };
  }
  if (shape.type === "ellipse") {
    return {
      cx: shape.cx,
      cy: shape.cy,
      rx: shape.rx,
      ry: shape.ry,
    };
  }
  return {
    points: shape.points.map((point) => `${point.x},${point.y}`).join(" "),
  };
}

function boundsElement(shape: BoundsShape | undefined): string {
  if (!shape || shape.type === "rect") return "rect";
  if (shape.type === "ellipse") return "ellipse";
  return "polygon";
}

function boundsSize(shape: BoundsShape): Point {
  if (shape.type === "rect") return { x: shape.width, y: shape.height };
  if (shape.type === "ellipse") return { x: shape.rx * 2, y: shape.ry * 2 };
  const xs = shape.points.map((point) => point.x);
  const ys = shape.points.map((point) => point.y);
  return {
    x: Math.max(...xs) - Math.min(...xs),
    y: Math.max(...ys) - Math.min(...ys),
  };
}

function eventPoint(event: MouseEvent | PointerEvent | DragEvent): Point {
  const rect = canvasSvg.value?.getBoundingClientRect();
  if (!rect) return { x: 0, y: 0 };
  return {
    x:
      ((event.clientX - rect.left) / rect.width) *
      session.shell.referenceViewport.width,
    y:
      ((event.clientY - rect.top) / rect.height) *
      session.shell.referenceViewport.height,
  };
}

function syncPersistence(): void {
  persistenceTick.value += 1;
}

async function loadPersisted(): Promise<void> {
  if (persistenceDirty.value) {
    reloadConfirmationPending.value = true;
    syncPersistence();
    return;
  }
  await performLoadPersisted();
}

async function performLoadPersisted(): Promise<void> {
  reloadConfirmationPending.value = false;
  const document = await lifecycle.load();
  syncPersistence();
  if (document) {
    session.loadBaseDocument(document);
    refresh();
    persistedFingerprint.value = currentFingerprint.value;
  }
}

async function confirmLoadPersisted(): Promise<void> {
  await performLoadPersisted();
}

function cancelLoadPersisted(): void {
  reloadConfirmationPending.value = false;
  syncPersistence();
}

async function savePersisted(): Promise<void> {
  const saved = await lifecycle.save(session.baseDocument());
  if (saved) persistedFingerprint.value = currentFingerprint.value;
  syncPersistence();
}

function requestActivation(): void {
  if (!activationAvailable.value) return;
  activationMessage.value = null;
  activationConfirmationPending.value = true;
  syncPersistence();
}

async function confirmActivation(): Promise<void> {
  activationConfirmationPending.value = false;
  const revisionId = lifecycle.revisionId;
  const activated = await lifecycle.activateSavedRevision();
  activationMessage.value = activated ? `Revision ${revisionId} ist für die Runtime aktiviert.` : null;
  syncPersistence();
}

function cancelActivation(): void {
  activationConfirmationPending.value = false;
  syncPersistence();
}

async function reloadConflict(): Promise<void> {
  const remote = await lifecycle.reloadAfterConflict();
  syncPersistence();
  if (remote) {
    session.loadBaseDocument(remote);
    refresh();
    persistedFingerprint.value = currentFingerprint.value;
  }
}

function discardConflict(): void {
  lifecycle.discardPendingEdits();
  syncPersistence();
}

function round(value: number, precision = 0): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

onMounted(() => {
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointercancel", handlePointerUp);
});

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", handlePointerMove);
  window.removeEventListener("pointerup", handlePointerUp);
  window.removeEventListener("pointercancel", handlePointerUp);
});
</script>

<style scoped>
.builder-preview {
  --builder-bg: #11151a;
  --builder-panel: #181d23;
  --builder-panel-raised: #20262d;
  --builder-border: #303841;
  --builder-border-strong: #46515d;
  --builder-text: #e7edf2;
  --builder-muted: #9aa8b5;
  --builder-faint: #687684;
  --builder-accent: #72b7d6;
  --builder-valid: #69c292;
  --builder-invalid: #e27d7d;
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  background: var(--builder-bg);
  color: var(--builder-text);
  color-scheme: dark;
  font: 13px/1.4 "Aptos", "Segoe UI", sans-serif;
}

.builder-preview button,
.builder-preview input,
.builder-preview select {
  border: 1px solid var(--builder-border);
  border-radius: 6px;
  background: #151a20;
  color: inherit;
  font: inherit;
}

.builder-preview button {
  padding: 7px 10px;
  cursor: pointer;
}

.builder-preview button:hover:not(:disabled),
.builder-preview button:focus-visible,
.builder-preview button.active {
  border-color: var(--builder-accent);
  background: #202b33;
}

.builder-preview button:disabled {
  opacity: 0.38;
  cursor: default;
}

.builder-preview input,
.builder-preview select {
  min-width: 0;
  padding: 7px 8px;
}

.builder-preview__header {
  z-index: 4;
  display: flex;
  min-height: 68px;
  padding: 10px 14px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--builder-border);
  background: #15191f;
  gap: 18px;
}

.builder-preview__header > div:first-child {
  display: grid;
  min-width: 220px;
  gap: 1px;
}

.builder-preview__header strong {
  font-size: 15px;
}

.builder-preview__header small,
.builder-panel small,
.catalog-card small,
.builder-properties__empty small {
  color: var(--builder-muted);
}

.builder-preview__badge {
  width: fit-content;
  color: #f2c880;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.builder-preview__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.builder-preview__toolbar-divider {
  width: 1px;
  height: 24px;
  margin: 0 3px;
  background: var(--builder-border);
}

.builder-preview__toggle {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  color: var(--builder-muted);
  gap: 6px;
}

.builder-preview__toggle input {
  width: 15px;
  height: 15px;
  margin: 0;
  padding: 0;
}

.builder-preview__workspace {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-columns: 260px minmax(540px, 1fr) 290px;
}

.builder-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  background: var(--builder-panel);
}

.builder-panel__heading {
  min-height: 58px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--builder-border);
}

.builder-panel__heading > div {
  display: grid;
  gap: 2px;
}

.builder-panel__heading span {
  font-weight: 700;
}

.builder-catalog {
  border-right: 1px solid var(--builder-border);
}

.builder-catalog__search {
  padding: 10px;
}

.builder-catalog__search input {
  width: 100%;
}

.builder-catalog__categories {
  display: flex;
  padding: 0 10px 10px;
  flex-wrap: wrap;
  gap: 5px;
}

.builder-catalog__categories button {
  padding: 4px 7px;
  color: var(--builder-muted);
  font-size: 11px;
}

.builder-catalog__categories button.selected {
  border-color: var(--builder-accent);
  background: #23323b;
  color: var(--builder-text);
}

.builder-catalog__items {
  min-height: 0;
  overflow: auto;
  padding: 0 10px 16px;
}

.catalog-card {
  display: grid;
  margin-bottom: 7px;
  padding: 9px;
  grid-template-columns: 34px minmax(0, 1fr);
  border: 1px solid var(--builder-border);
  border-radius: 8px;
  background: var(--builder-panel-raised);
  cursor: grab;
  gap: 8px;
}

.catalog-card:active {
  cursor: grabbing;
}

.catalog-card > div {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.catalog-card small {
  overflow: hidden;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.catalog-card button {
  grid-column: 1 / -1;
  padding: 5px 8px;
  font-size: 11px;
}

.catalog-card__glyph {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 7px;
  background: #2c343d;
  color: #bac7d2;
  font-size: 19px;
}

.catalog-card[data-tone="blue"] .catalog-card__glyph { background: #233846; color: #86c5e1; }
.catalog-card[data-tone="amber"] .catalog-card__glyph { background: #443725; color: #e7bd79; }
.catalog-card[data-tone="green"] .catalog-card__glyph { background: #243b31; color: #81cba1; }
.catalog-card[data-tone="violet"] .catalog-card__glyph { background: #342e45; color: #b5a7df; }

.builder-canvas {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  place-items: center;
  background:
    radial-gradient(circle at 50% 40%, #242b32 0, #14191f 65%),
    #11151a;
}

.builder-canvas--test {
  grid-column: 1 / -1;
}

.builder-canvas__svg {
  display: block;
  width: min(100%, calc((100vh - 120px) * 1.7778));
  max-height: calc(100vh - 120px);
  aspect-ratio: 16 / 9;
  border: 1px solid #39434d;
  background: #171c22;
  box-shadow: 0 20px 55px rgb(0 0 0 / 28%);
  touch-action: none;
  user-select: none;
}

.builder-canvas__legend {
  position: absolute;
  z-index: 2;
  top: 12px;
  left: 12px;
  display: flex;
  padding: 7px 9px;
  border: 1px solid var(--builder-border);
  border-radius: 6px;
  background: rgb(17 21 26 / 88%);
  color: var(--builder-muted);
  font-size: 10px;
  gap: 10px;
}

.builder-canvas__legend span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.builder-canvas__legend i {
  width: 9px;
  height: 9px;
  border: 1px solid currentColor;
  border-radius: 2px;
}

.legend-valid { color: var(--builder-valid); }
.legend-invalid { color: var(--builder-invalid); }
.legend-snap { color: var(--builder-accent); }

.room-surface {
  stroke: #424b55;
  stroke-width: 2;
}

.room-surface--background { fill: #14191f; }
.room-surface--wall { fill: #252c33; }
.room-surface--floor { fill: #2c2d2d; }
.room-surface--ceiling { fill: #1d2329; }

.builder-canvas__grid {
  fill: url("#builder-grid");
  color: rgb(123 151 168 / 16%);
  pointer-events: none;
}

.builder-object {
  outline: none;
  cursor: grab;
}

.builder-object:active {
  cursor: grabbing;
}

.builder-object__shape {
  fill: #58636d;
  stroke: #8b99a5;
  stroke-width: 3;
  vector-effect: non-scaling-stroke;
}

.builder-object.functional .builder-object__shape {
  fill: #445a68;
  stroke: #75b9d5;
}

.builder-object__shape.family-light { fill: #6e624b; stroke: #ddbc79; }
.builder-object__shape.family-plant { fill: #476454; stroke: #81c398; }
.builder-object__shape.family-companion-visual { fill: #4a615a; stroke: #7fc3a4; }
.builder-object__shape.family-decoration { fill: #565767; stroke: #aaaac2; }

.builder-object__detail {
  fill: none;
  stroke: rgb(238 245 249 / 55%);
  stroke-width: 4;
  vector-effect: non-scaling-stroke;
}

.builder-object__label {
  fill: #f2f5f7;
  font-size: 20px;
  font-weight: 650;
  pointer-events: none;
}

.builder-object__selection {
  fill: none;
  stroke: #8fd2ef;
  stroke-dasharray: 11 6;
  stroke-width: 4;
  vector-effect: non-scaling-stroke;
  pointer-events: none;
}

.builder-object__interaction {
  fill: rgb(226 125 125 / 12%);
  stroke: #e88c8c;
  stroke-dasharray: 8 5;
  stroke-width: 4;
  vector-effect: non-scaling-stroke;
  cursor: pointer;
}

.builder-handle {
  fill: #dcecf4;
  stroke: #4c91af;
  stroke-width: 4;
  vector-effect: non-scaling-stroke;
  cursor: nwse-resize;
}

.builder-handle--rotate {
  cursor: crosshair;
}

.builder-handle__stem {
  stroke: #7abbd6;
  stroke-width: 3;
  vector-effect: non-scaling-stroke;
  pointer-events: none;
}

.placement-guides {
  pointer-events: none;
}

.placement-guides__target {
  fill: rgb(105 194 146 / 8%);
  stroke: var(--builder-valid);
  stroke-dasharray: 14 8;
  stroke-width: 5;
  vector-effect: non-scaling-stroke;
}

.placement-guides__target.invalid {
  fill: rgb(226 125 125 / 8%);
  stroke: var(--builder-invalid);
}

.placement-guides__cross {
  stroke: var(--builder-accent);
  stroke-width: 4;
  vector-effect: non-scaling-stroke;
}

.builder-object--preview {
  pointer-events: none;
  opacity: 0.72;
}

.builder-object--preview .builder-object__shape {
  fill: rgb(105 194 146 / 35%);
  stroke: var(--builder-valid);
  stroke-dasharray: 10 6;
}

.builder-object--preview.invalid .builder-object__shape {
  fill: rgb(226 125 125 / 28%);
  stroke: var(--builder-invalid);
}

.builder-canvas__feedback {
  position: absolute;
  z-index: 3;
  bottom: 14px;
  left: 50%;
  min-width: 260px;
  margin: 0;
  padding: 8px 14px;
  transform: translateX(-50%);
  border: 1px solid var(--builder-border);
  border-radius: 999px;
  background: rgb(19 24 29 / 92%);
  color: var(--builder-muted);
  text-align: center;
}

.builder-canvas__feedback--valid { border-color: #45795d; color: #92d2ad; }
.builder-canvas__feedback--invalid { border-color: #8d5151; color: #efaaaa; }

.builder-properties {
  border-left: 1px solid var(--builder-border);
}

.builder-properties__content {
  min-height: 0;
  overflow: auto;
  padding: 10px;
}

.builder-properties__empty {
  display: grid;
  margin: auto;
  padding: 24px;
  place-items: center;
  color: var(--builder-muted);
  text-align: center;
}

.builder-properties__empty > span {
  color: var(--builder-faint);
  font-size: 38px;
}

.property-section {
  display: grid;
  margin-bottom: 9px;
  padding: 11px;
  border: 1px solid var(--builder-border);
  border-radius: 8px;
  background: var(--builder-panel-raised);
  gap: 8px;
}

.property-section h2 {
  margin: 0;
  color: #c8d3dc;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.property-section label {
  display: grid;
  color: var(--builder-muted);
  font-size: 11px;
  gap: 4px;
}

.property-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: end;
  gap: 7px;
}

.property-grid label:nth-of-type(n + 3) {
  grid-column: 1 / -1;
}

.property-reset {
  padding: 6px 8px !important;
  font-size: 10px !important;
}

.property-readout {
  display: grid;
  margin: 0;
  gap: 5px;
}

.property-readout div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.property-readout dt {
  color: var(--builder-muted);
}

.property-readout dd {
  margin: 0;
  overflow: hidden;
  color: #dce4ea;
  font-size: 11px;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.property-actions,
.property-inline,
.property-section--actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.property-inline code {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: #b9c7d2;
  font-size: 10px;
  text-overflow: ellipsis;
}

.property-danger {
  border-color: #6c3f43 !important;
  color: #e6a4a8 !important;
}

.override-badge {
  display: inline-flex;
  width: fit-content;
  padding: 2px 6px;
  border: 1px solid var(--builder-border);
  border-radius: 999px;
  color: var(--builder-muted);
  font: 10px/1.3 ui-monospace, monospace;
}

.override-badge--pinned {
  border-color: #745f38;
  color: #e2be7a;
}

.override-badge--reset-to-parent {
  border-color: #435e73;
  color: #8bc3df;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

@media (max-width: 1280px) {
  .builder-preview__workspace {
    grid-template-columns: 220px minmax(500px, 1fr) 260px;
  }

  .builder-preview__header {
    align-items: flex-start;
  }

  .builder-preview__toolbar {
    max-width: 780px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .builder-preview *,
  .builder-preview *::before,
  .builder-preview *::after {
    scroll-behavior: auto !important;
    transition: none !important;
  }
}
</style>
