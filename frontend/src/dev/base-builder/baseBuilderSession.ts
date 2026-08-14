import { cloneAndFreeze, deepClone } from "../../theme-engine/immutable";
import { validatePlacement } from "../../theme-engine/placement";
import { evaluateSnapCandidates } from "../../theme-engine/snapScoring";
import type {
  AttachmentAnchor,
  CatalogObject,
  FunctionContainer,
  FunctionContainerInstance,
  ObjectInstance,
  PlacementObstacle,
  PlacementSurface,
  PropertyOverrideMode,
  RoomComposition,
  RoomShell,
  SnapCandidate,
  SnapResult,
  SurfaceBinding,
} from "../../theme-engine/roomCompositionTypes";
import type {
  BoundsShape,
  NamespacedId,
  Point,
  VersionedRef,
} from "../../theme-engine/types";
import { emptyRoomShellFixture } from "../../theme-engine/roomShadowFixtures";
import { createBaseBuilderDocument, replaceBaseBuilderRoom } from "./baseBuilderDocument";
import {
  BASE_BUILDER_SKINS,
  baseBuilderCatalogEntries,
  baseBuilderCatalogObjects,
  baseBuilderEmptyCompositionFixture,
  baseBuilderFunctionContainers,
  baseBuilderStandardCompositionFixture,
  baseBuilderStandardPresetFixture,
  type BaseBuilderCatalogEntry,
} from "./baseBuilderFixtures";

export type BaseBuilderProperty =
  | "position"
  | "rotation"
  | "scale"
  | "skin"
  | "layer"
  | "depth";

export interface BaseBuilderHistoryState {
  canUndo: boolean;
  canRedo: boolean;
  undoLabel?: string;
  redoLabel?: string;
}

export interface BaseBuilderFeedback {
  kind: "valid" | "invalid" | "information";
  message: string;
}

export interface BaseBuilderState {
  composition: RoomComposition;
  selectedObjectId: NamespacedId | null;
  activeTheme: "cool" | "warm";
  gridEnabled: boolean;
  testMode: boolean;
  showInteractionBounds: boolean;
  feedback: BaseBuilderFeedback;
  history: BaseBuilderHistoryState;
}

export interface BaseBuilderPlacementPreview {
  instanceId?: NamespacedId;
  catalogObjectId: NamespacedId;
  position: Point;
  rotation: number;
  scale: Point;
  valid: boolean;
  targetId?: NamespacedId;
  targetSurfaceId?: NamespacedId;
  targetBounds?: BoundsShape;
  surfaceBinding?: SurfaceBinding;
  parentAttachment?: {
    parentInstanceId: NamespacedId;
    anchorId: NamespacedId;
  };
  message: string;
  issueCodes: readonly string[];
  snapResult: SnapResult;
}

interface BuilderDocument {
  composition: RoomComposition;
  selectedObjectId: NamespacedId | null;
  activeTheme: "cool" | "warm";
}

interface HistoryEntry {
  label: string;
  before: BuilderDocument;
  after: BuilderDocument;
}

interface CandidateMetadata {
  candidate: SnapCandidate;
  position: Point;
  rawDistance: number;
  surface: PlacementSurface;
  binding: SurfaceBinding;
  issueCodes: readonly string[];
  targetBounds: BoundsShape;
  parentAttachment?: {
    parentInstanceId: NamespacedId;
    anchorId: NamespacedId;
  };
}

export class BaseBuilderSession {
  readonly shell: Readonly<RoomShell> = emptyRoomShellFixture;
  readonly catalog: readonly Readonly<BaseBuilderCatalogEntry>[] =
    baseBuilderCatalogEntries;
  readonly skins = BASE_BUILDER_SKINS;

  #document: BuilderDocument;
  #undo: HistoryEntry[] = [];
  #redo: HistoryEntry[] = [];
  #gridEnabled = false;
  #testMode = false;
  #showInteractionBounds = false;
  #feedback: BaseBuilderFeedback = {
    kind: "information",
    message: "Standardlayout geladen.",
  };
  #instanceSequence = 0;
  #revisionSequence = 0;

  constructor(
    composition: Readonly<RoomComposition> =
      baseBuilderStandardCompositionFixture,
  ) {
    this.#document = {
      composition: deepClone(composition),
      selectedObjectId: null,
      activeTheme: "cool",
    };
  }

  snapshot(): Readonly<BaseBuilderState> {
    return cloneAndFreeze({
      composition: this.#document.composition,
      selectedObjectId: this.#document.selectedObjectId,
      activeTheme: this.#document.activeTheme,
      gridEnabled: this.#gridEnabled,
      testMode: this.#testMode,
      showInteractionBounds: this.#showInteractionBounds,
      feedback: this.#feedback,
      history: {
        canUndo: this.#undo.length > 0,
        canRedo: this.#redo.length > 0,
        ...(this.#undo.at(-1) ? { undoLabel: this.#undo.at(-1)!.label } : {}),
        ...(this.#redo.at(-1) ? { redoLabel: this.#redo.at(-1)!.label } : {}),
      },
    });
  }

  baseDocument() {
    const initial = createBaseBuilderDocument(baseBuilderStandardCompositionFixture);
    return replaceBaseBuilderRoom(initial, this.#document.composition);
  }

  select(instanceId: NamespacedId | null): void {
    if (
      instanceId &&
      !this.#document.composition.objectInstances.some(
        (instance) => instance.instanceId === instanceId,
      )
    ) {
      return;
    }
    this.#document.selectedObjectId = instanceId;
  }

  loadStandard(): void {
    this.transact("Standardlayout laden", () => {
      this.#document.composition = deepClone(
        baseBuilderStandardCompositionFixture,
      );
      this.#document.selectedObjectId = null;
    });
    this.inform("valid", "Standardlayout geladen.");
  }

  loadEmpty(): void {
    this.transact("Leeren Raum laden", () => {
      this.#document.composition = deepClone(
        baseBuilderEmptyCompositionFixture,
      );
      this.#document.selectedObjectId = null;
    });
    this.inform("valid", "Leerer Raum geladen.");
  }

  resetToPreset(): void {
    this.transact("Auf Standardpreset zurücksetzen", () => {
      this.#document.composition = deepClone(
        baseBuilderStandardCompositionFixture,
      );
      this.#document.selectedObjectId = null;
    });
    this.inform("valid", "Auf Standardpreset zurückgesetzt.");
  }

  setGridEnabled(enabled: boolean): void {
    this.#gridEnabled = enabled;
    this.inform(
      "information",
      enabled ? "Optionales Raster aktiviert." : "Logisches Snapping aktiv.",
    );
  }

  setTestMode(enabled: boolean): void {
    this.#testMode = enabled;
    this.inform(
      "information",
      enabled
        ? "Testmodus aktiv. Es werden nur Preview-Aktionen ausgeführt."
        : "Builder-Hilfen wieder eingeblendet.",
    );
  }

  setInteractionBoundsVisible(visible: boolean): void {
    this.#showInteractionBounds = visible;
  }

  previewCatalogPlacement(
    catalogObjectId: NamespacedId,
    pointer: Point,
    previousTargetId?: NamespacedId,
  ): Readonly<BaseBuilderPlacementPreview> {
    const catalogObject = this.catalogObject(catalogObjectId);
    return this.previewFor(
      catalogObject,
      pointer,
      {
        rotation: 0,
        scale: { x: 1, y: 1 },
      },
      undefined,
      previousTargetId,
    );
  }

  previewMove(
    instanceId: NamespacedId,
    pointer: Point,
    previousTargetId?: NamespacedId,
  ): Readonly<BaseBuilderPlacementPreview> {
    const instance = this.instance(instanceId);
    return this.previewFor(
      this.catalogObject(instance.catalogObjectRef.id),
      pointer,
      { rotation: instance.rotation, scale: instance.scale },
      instance,
      previousTargetId,
    );
  }

  place(
    catalogObjectId: NamespacedId,
    pointer: Point,
    previousTargetId?: NamespacedId,
  ): NamespacedId | null {
    const preview = this.previewCatalogPlacement(
      catalogObjectId,
      pointer,
      previousTargetId,
    );
    if (!preview.valid || !preview.surfaceBinding) {
      this.inform("invalid", preview.message);
      return null;
    }
    const entry = this.catalogEntry(catalogObjectId);
    const instanceId = this.nextInstanceId(entry.object.catalogObjectId);
    this.transact(`${entry.label} platzieren`, () => {
      const instance = createInstance(instanceId, entry, preview);
      const functions = [
        ...this.#document.composition.functionContainers,
      ];
      if (entry.defaultFunctionContainer) {
        const functionInstance = createFunctionInstance(
          instanceId,
          entry.defaultFunctionContainer,
        );
        instance.functionContainerInstanceId =
          functionInstance.containerInstanceId;
        functions.push(functionInstance);
      }
      this.#document.composition = this.nextComposition({
        ...this.#document.composition,
        objectInstances: [
          ...this.#document.composition.objectInstances,
          instance,
        ],
        functionContainers: functions,
      });
      this.#document.selectedObjectId = instanceId;
    });
    this.inform("valid", preview.message);
    return instanceId;
  }

  move(
    instanceId: NamespacedId,
    pointer: Point,
    previousTargetId?: NamespacedId,
  ): boolean {
    const preview = this.previewMove(instanceId, pointer, previousTargetId);
    if (!preview.valid || !preview.surfaceBinding) {
      this.inform("invalid", preview.message);
      return false;
    }
    this.transact("Objekt verschieben", () => {
      this.updateInstance(instanceId, (instance) => ({
        ...instance,
        position: preview.position,
        surfaceBinding: preview.surfaceBinding!,
        ...(preview.parentAttachment
          ? { parentAttachment: preview.parentAttachment }
          : { parentAttachment: undefined }),
        propertyOverrides: {
          ...instance.propertyOverrides,
          position: { mode: "pinned", value: preview.position },
        },
        placementState: "valid",
      }));
    });
    this.inform("valid", preview.message);
    return true;
  }

  scale(instanceId: NamespacedId, scale: Point): boolean {
    const instance = this.instance(instanceId);
    const object = this.catalogObject(instance.catalogObjectRef.id);
    const preview = this.previewFor(
      object,
      centerOfInstance(instance, object),
      { rotation: instance.rotation, scale },
      instance,
      instance.surfaceBinding.anchorId
        ? `${instance.parentAttachment?.parentInstanceId}:${instance.surfaceBinding.anchorId}`
        : instance.surfaceBinding.surfaceId,
    );
    if (!preview.valid) {
      this.inform("invalid", preview.message);
      return false;
    }
    this.transact("Objekt skalieren", () => {
      this.updateInstance(instanceId, (value) => ({
        ...value,
        scale,
        propertyOverrides: {
          ...value.propertyOverrides,
          scale: { mode: "pinned", value: scale },
        },
      }));
    });
    this.inform("valid", "Skalierung übernommen.");
    return true;
  }

  rotate(instanceId: NamespacedId, rotation: number): boolean {
    const instance = this.instance(instanceId);
    const object = this.catalogObject(instance.catalogObjectRef.id);
    const preview = this.previewFor(
      object,
      centerOfInstance(instance, object),
      { rotation, scale: instance.scale },
      instance,
      instance.surfaceBinding.surfaceId,
    );
    if (!preview.valid) {
      this.inform("invalid", preview.message);
      return false;
    }
    this.transact("Objekt rotieren", () => {
      this.updateInstance(instanceId, (value) => ({
        ...value,
        rotation,
        propertyOverrides: {
          ...value.propertyOverrides,
          rotation: { mode: "pinned", value: rotation },
        },
      }));
    });
    this.inform("valid", "Rotation übernommen.");
    return true;
  }

  delete(instanceId: NamespacedId): void {
    this.instance(instanceId);
    this.transact("Objekt löschen", () => {
      this.#document.composition = this.nextComposition({
        ...this.#document.composition,
        objectInstances:
          this.#document.composition.objectInstances.filter(
            (instance) => instance.instanceId !== instanceId,
          ),
        functionContainers:
          this.#document.composition.functionContainers.filter(
            (container) => container.attachedObjectInstanceId !== instanceId,
          ),
      });
      this.#document.selectedObjectId = null;
    });
    this.inform("valid", "Objekt gelöscht.");
  }

  duplicate(instanceId: NamespacedId): NamespacedId | null {
    const instance = this.instance(instanceId);
    const object = this.catalogObject(instance.catalogObjectRef.id);
    const size = visualSize(object);
    const pointer = {
      x:
        instance.position.x +
        size.x * instance.scale.x * 1.5 +
        36,
      y: instance.position.y + size.y * instance.scale.y / 2,
    };
    const preview = this.previewFor(
      object,
      pointer,
      { rotation: instance.rotation, scale: instance.scale },
      undefined,
      instance.surfaceBinding.surfaceId,
    );
    if (!preview.valid || !preview.surfaceBinding) {
      this.inform("invalid", preview.message);
      return null;
    }
    const nextId = this.nextInstanceId(object.catalogObjectId);
    this.transact("Objekt duplizieren", () => {
      const copy: ObjectInstance = {
        ...deepClone(instance),
        instanceId: nextId,
        position: preview.position,
        surfaceBinding: preview.surfaceBinding!,
        origin: undefined,
        propertyOverrides: {
          ...deepClone(instance.propertyOverrides),
          position: { mode: "pinned", value: preview.position },
        },
        ...(preview.parentAttachment
          ? { parentAttachment: preview.parentAttachment }
          : { parentAttachment: undefined }),
      };
      const functions = [
        ...this.#document.composition.functionContainers,
      ];
      const sourceFunction =
        this.#document.composition.functionContainers.find(
          (container) => container.attachedObjectInstanceId === instanceId,
        );
      if (sourceFunction) {
        const definition = this.functionDefinition(
          sourceFunction.definitionRef.id,
        );
        const functionCopy = createFunctionInstance(nextId, definition);
        copy.functionContainerInstanceId = functionCopy.containerInstanceId;
        functions.push(functionCopy);
      } else {
        copy.functionContainerInstanceId = undefined;
      }
      this.#document.composition = this.nextComposition({
        ...this.#document.composition,
        objectInstances: [
          ...this.#document.composition.objectInstances,
          copy,
        ],
        functionContainers: functions,
      });
      this.#document.selectedObjectId = nextId;
    });
    this.inform("valid", "Objekt dupliziert.");
    return nextId;
  }

  changeSkin(instanceId: NamespacedId, skin: VersionedRef): void {
    this.transact("Skin wechseln", () => {
      this.updateInstance(instanceId, (instance) => ({
        ...instance,
        skinRef: deepClone(skin),
        propertyOverrides: {
          ...instance.propertyOverrides,
          skin: { mode: "pinned", value: deepClone(skin) },
        },
      }));
    });
    this.inform("valid", "Skin gewechselt; Function Binding bleibt erhalten.");
  }

  assignDefaultFunction(instanceId: NamespacedId): boolean {
    const instance = this.instance(instanceId);
    const entry = this.catalog.find(
      (candidate) =>
        candidate.object.catalogObjectId === instance.catalogObjectRef.id,
    );
    if (!entry?.defaultFunctionContainer) return false;
    this.transact("Function Container zuweisen", () => {
      const next = createFunctionInstance(
        instanceId,
        entry.defaultFunctionContainer!,
      );
      this.#document.composition = this.nextComposition({
        ...this.#document.composition,
        functionContainers: [
          ...this.#document.composition.functionContainers.filter(
            (container) =>
              container.attachedObjectInstanceId !== instanceId,
          ),
          next,
        ],
        objectInstances: this.#document.composition.objectInstances.map(
          (candidate) =>
            candidate.instanceId === instanceId
              ? {
                  ...candidate,
                  functionContainerInstanceId: next.containerInstanceId,
                }
              : candidate,
        ),
      });
    });
    this.inform("valid", "Function Container stabil zugewiesen.");
    return true;
  }

  removeFunction(instanceId: NamespacedId): void {
    this.instance(instanceId);
    this.transact("Function Container entfernen", () => {
      this.#document.composition = this.nextComposition({
        ...this.#document.composition,
        functionContainers:
          this.#document.composition.functionContainers.filter(
            (container) => container.attachedObjectInstanceId !== instanceId,
          ),
        objectInstances: this.#document.composition.objectInstances.map(
          (candidate) =>
            candidate.instanceId === instanceId
              ? { ...candidate, functionContainerInstanceId: undefined }
              : candidate,
        ),
      });
    });
    this.inform("information", "Function Container lokal entfernt.");
  }

  changeDepth(instanceId: NamespacedId, direction: -1 | 1): void {
    this.transact(
      direction > 0 ? "Layer nach vorne" : "Layer nach hinten",
      () => {
        this.updateInstance(instanceId, (instance) => {
          const depth = instance.depth + direction;
          return {
            ...instance,
            depth,
            propertyOverrides: {
              ...instance.propertyOverrides,
              depth: { mode: "pinned", value: depth },
            },
          };
        });
      },
    );
    this.inform("valid", direction > 0 ? "Nach vorne." : "Nach hinten.");
  }

  resetProperty(
    instanceId: NamespacedId,
    property: BaseBuilderProperty,
  ): void {
    const instance = this.instance(instanceId);
    const parent = this.presetParent(instance);
    this.transact(`${property} zurücksetzen`, () => {
      this.updateInstance(instanceId, (value) =>
        resetInstanceProperty(value, parent, property),
      );
    });
    this.inform(
      "information",
      parent
        ? `${property} folgt wieder dem Standardpreset.`
        : `${property} auf Vererbung zurückgesetzt.`,
    );
  }

  simulateThemeChange(): void {
    const nextTheme = this.#document.activeTheme === "cool" ? "warm" : "cool";
    const skin: VersionedRef = {
      id:
        nextTheme === "cool"
          ? "dev.skin.builder.cool"
          : "dev.skin.builder.warm",
      versionRange: "^1.0.0",
    };
    this.transact("Theme simulieren", () => {
      this.#document.activeTheme = nextTheme;
      this.#document.composition = this.nextComposition({
        ...this.#document.composition,
        objectInstances: this.#document.composition.objectInstances.map(
          (instance) => {
            const parent = this.presetParent(instance);
            const overrides = instance.propertyOverrides;
            return {
              ...instance,
              ...(overrides.position.mode !== "pinned" && parent
                ? { position: deepClone(parent.position) }
                : {}),
              ...(overrides.rotation.mode !== "pinned" && parent
                ? { rotation: parent.rotation }
                : {}),
              ...(overrides.scale.mode !== "pinned" && parent
                ? { scale: deepClone(parent.scale) }
                : {}),
              ...(overrides.layer.mode !== "pinned" && parent
                ? { layer: parent.layer }
                : {}),
              ...(overrides.depth.mode !== "pinned" && parent
                ? { depth: parent.depth }
                : {}),
              ...(overrides.skin.mode !== "pinned"
                ? { skinRef: deepClone(skin) }
                : {}),
            };
          },
        ),
      });
    });
    this.inform(
      "valid",
      `Theme ${nextTheme === "cool" ? "Kühl" : "Warm"} simuliert. Gepinnte Werte bleiben erhalten.`,
    );
  }

  testFunction(instanceId: NamespacedId): string {
    const container =
      this.#document.composition.functionContainers.find(
        (candidate) => candidate.attachedObjectInstanceId === instanceId,
      );
    if (!container) {
      const message = "Dieses Objekt hat keine interaktive Funktion.";
      this.inform("information", message);
      return message;
    }
    const definition = this.functionDefinition(container.definitionRef.id);
    const role = definition.functionBinding.actionRole;
    const message =
      role === "workspace.open"
        ? "Würde Knowledge Workspace öffnen."
        : role === "companion.open"
          ? "Würde Companion öffnen."
          : role === "base.open" || role === "room.transition"
            ? "Würde in den verbundenen Raum wechseln."
            : `Würde ${definition.displayName} ausführen.`;
    this.inform("information", message);
    return message;
  }

  undo(): boolean {
    const entry = this.#undo.pop();
    if (!entry) return false;
    this.#redo.push(entry);
    this.#document = deepClone(entry.before);
    this.inform("information", `${entry.label} rückgängig gemacht.`);
    return true;
  }

  redo(): boolean {
    const entry = this.#redo.pop();
    if (!entry) return false;
    this.#undo.push(entry);
    this.#document = deepClone(entry.after);
    this.inform("information", `${entry.label} wiederhergestellt.`);
    return true;
  }

  catalogObject(id: NamespacedId): Readonly<CatalogObject> {
    const object = baseBuilderCatalogObjects.find(
      (candidate) => candidate.catalogObjectId === id,
    );
    if (!object) throw new Error(`Unknown Base Builder Catalog Object "${id}"`);
    return object;
  }

  functionDefinition(id: NamespacedId): Readonly<FunctionContainer> {
    const definition = baseBuilderFunctionContainers.find(
      (candidate) => candidate.containerId === id,
    );
    if (!definition) {
      throw new Error(`Unknown Base Builder Function Container "${id}"`);
    }
    return definition;
  }

  private previewFor(
    object: Readonly<CatalogObject>,
    pointer: Point,
    transform: { rotation: number; scale: Point },
    movingInstance?: Readonly<ObjectInstance>,
    previousTargetId?: NamespacedId,
  ): Readonly<BaseBuilderPlacementPreview> {
    const metadata = [
      ...this.surfaceCandidates(
        object,
        pointer,
        transform,
        movingInstance,
        previousTargetId,
      ),
      ...this.anchorCandidates(
        object,
        pointer,
        transform,
        movingInstance,
        previousTargetId,
      ),
    ];
    const snapResult = evaluateSnapCandidates(
      metadata.map((entry) => entry.candidate),
      {
        previousTargetId,
        hysteresis: object.placementProfile.hysteresis,
      },
    );
    const winner = snapResult.winner
      ? metadata.find(
          (entry) =>
            entry.candidate.candidateId === snapResult.winner!.candidateId,
        )
      : undefined;
    const nearest = [...metadata].sort(
      (left, right) =>
        left.rawDistance - right.rawDistance ||
        compareText(
          left.candidate.target.targetId,
          right.candidate.target.targetId,
        ),
    )[0];
    const selected = winner ?? nearest;
    if (!selected) {
      return cloneAndFreeze({
        ...(movingInstance ? { instanceId: movingInstance.instanceId } : {}),
        catalogObjectId: object.catalogObjectId,
        position: pointer,
        rotation: transform.rotation,
        scale: transform.scale,
        valid: false,
        message: "Keine passende Platzierungsfläche verfügbar.",
        issueCodes: ["surface-missing"],
        snapResult,
      });
    }
    const valid = Boolean(winner);
    return cloneAndFreeze({
      ...(movingInstance ? { instanceId: movingInstance.instanceId } : {}),
      catalogObjectId: object.catalogObjectId,
      position: selected.position,
      rotation: transform.rotation,
      scale: transform.scale,
      valid,
      targetId: selected.candidate.target.targetId,
      targetSurfaceId: selected.surface.surfaceId,
      targetBounds: selected.targetBounds,
      surfaceBinding: selected.binding,
      ...(selected.parentAttachment
        ? { parentAttachment: selected.parentAttachment }
        : {}),
      message: placementMessage(
        object,
        selected,
        valid,
      ),
      issueCodes: selected.issueCodes,
      snapResult,
    });
  }

  private surfaceCandidates(
    object: Readonly<CatalogObject>,
    pointer: Point,
    transform: { rotation: number; scale: Point },
    movingInstance: Readonly<ObjectInstance> | undefined,
    previousTargetId: NamespacedId | undefined,
  ): CandidateMetadata[] {
    return this.shell.placementSurfaces.map((surface) => {
      const position = positionOnSurface(
        object,
        surface,
        pointer,
        transform.scale,
        this.#gridEnabled,
      );
      const binding = bindingFor(surface, position, object);
      const rawDistance = pointDistance(
        pointer,
        centerAt(position, object, transform.scale),
      );
      const validation = validatePlacement({
        object: object as CatalogObject,
        surface: surface as PlacementSurface,
        binding,
        position,
        rotation: transform.rotation,
        scale: transform.scale,
        hasRequiredSurfaceContact:
          object.family !== "door" ||
          Math.abs(
            position.y +
              visualSize(object).y * transform.scale.y -
              floorTop(this.shell),
          ) < 0.01,
        obstacles: this.obstacles(movingInstance?.instanceId),
      });
      const uprightViolation =
        object.family === "door" &&
        Math.abs(normalizeAngle(transform.rotation)) > 0.01;
      const withinRange =
        rawDistance <= snapRange(object, surface.surfaceKind);
      const issueCodes = [
        ...validation.issues.map((issue) => issue.code),
        ...(uprightViolation ? ["rotation-incompatible"] : []),
        ...(withinRange ? [] : ["outside-snap-range"]),
      ].sort(compareText);
      const targetId = surface.surfaceId;
      const effectiveDistance =
        targetId === previousTargetId
          ? Math.max(0, rawDistance - object.placementProfile.hysteresis)
          : rawDistance;
      return {
        candidate: {
          candidateId: `${object.catalogObjectId}.${surface.surfaceId}`,
          target: {
            targetId,
            kind: "surface",
            surfaceId: surface.surfaceId,
            position: centerAt(position, object, transform.scale),
            priority: surface.snapPriority,
          },
          binding,
          explicitAnchorMatch: false,
          contactQuality: validation.valid ? 1 : 0,
          profilePriority: object.placementProfile.priority,
          distance: effectiveDistance,
          alignmentQuality: validation.issues.some(
            (issue) => issue.code === "rotation-incompatible",
          ) || uprightViolation
            ? 0
            : 1,
          clearance: validation.issues.some(
            (issue) => issue.code === "clearance-violated",
          )
            ? 0
            : 1,
          rules: [
            ...validation.issues.map((issue) => ({
              ruleId: `builder.placement.${issue.code}`,
              passed: false,
              reason: issue.message,
            })),
            {
              ruleId: "builder.placement.door-upright",
              passed: !uprightViolation,
              reason: uprightViolation
                ? "Doors remain upright"
                : "Door upright rule is satisfied",
            },
            {
              ruleId: "builder.snap.within-range",
              passed: withinRange,
              reason: withinRange
                ? "Pointer is within the semantic snap range"
                : "Pointer is outside the semantic snap range",
            },
          ],
        },
        position,
        rawDistance,
        surface: surface as PlacementSurface,
        binding,
        issueCodes,
        targetBounds: deepClone(surface.bounds),
      };
    });
  }

  private anchorCandidates(
    object: Readonly<CatalogObject>,
    pointer: Point,
    transform: { rotation: number; scale: Point },
    movingInstance: Readonly<ObjectInstance> | undefined,
    previousTargetId: NamespacedId | undefined,
  ): CandidateMetadata[] {
    const candidates: CandidateMetadata[] = [];
    for (const parent of this.#document.composition.objectInstances) {
      if (parent.instanceId === movingInstance?.instanceId) continue;
      const parentObject = this.catalogObject(parent.catalogObjectRef.id);
      for (const anchor of parentObject.attachmentAnchors) {
        const worldAnchor = {
          x: parent.position.x + anchor.position.x * parent.scale.x,
          y: parent.position.y + anchor.position.y * parent.scale.y,
        };
        const size = visualSize(object);
        const position = gridPoint(
          {
            x: worldAnchor.x - (size.x * transform.scale.x) / 2,
            y: worldAnchor.y - size.y * transform.scale.y,
          },
          this.#gridEnabled,
        );
        const surface = objectAnchorSurface(parent, anchor, worldAnchor);
        const binding: SurfaceBinding = {
          surfaceId: surface.surfaceId,
          placementAreaId: surface.placementAreaIds[0]!,
          anchorId: anchor.anchorId,
          localPosition: position,
          normalOffset: 0,
          orientationMode: "room",
          shellVersion: this.shell.version,
        };
        const rawDistance = pointDistance(pointer, worldAnchor);
        const validation = validatePlacement({
          object: object as CatalogObject,
          surface,
          binding,
          position,
          rotation: transform.rotation,
          scale: transform.scale,
          hasRequiredSurfaceContact: true,
          attachmentAnchor: anchor,
          obstacles: this.obstacles(movingInstance?.instanceId).filter(
            (obstacle) => obstacle.obstacleId !== parent.instanceId,
          ),
        });
        const withinRange = rawDistance <= 72;
        const targetId = `${parent.instanceId}:${anchor.anchorId}`;
        const effectiveDistance =
          targetId === previousTargetId
            ? Math.max(0, rawDistance - object.placementProfile.hysteresis)
            : rawDistance;
        const issueCodes = [
          ...validation.issues.map((issue) => issue.code),
          ...(withinRange ? [] : ["outside-snap-range"]),
        ].sort(compareText);
        candidates.push({
          candidate: {
            candidateId: `${object.catalogObjectId}.${targetId}`,
            target: {
              targetId,
              kind: "object-anchor",
              surfaceId: surface.surfaceId,
              anchorId: anchor.anchorId,
              position: worldAnchor,
              priority: anchor.priority,
            },
            binding,
            explicitAnchorMatch: validation.issues.every(
              (issue) => issue.code !== "attachment-incompatible",
            ),
            contactQuality: validation.valid ? 1 : 0,
            profilePriority: object.placementProfile.priority,
            distance: effectiveDistance,
            alignmentQuality: 1,
            clearance: validation.issues.some(
              (issue) => issue.code === "clearance-violated",
            )
              ? 0
              : 1,
            rules: [
              ...validation.issues.map((issue) => ({
                ruleId: `builder.placement.${issue.code}`,
                passed: false,
                reason: issue.message,
              })),
              {
                ruleId: "builder.snap.within-range",
                passed: withinRange,
                reason: withinRange
                  ? "Pointer is within the anchor snap range"
                  : "Pointer is outside the anchor snap range",
              },
            ],
          },
          position,
          rawDistance,
          surface,
          binding,
          issueCodes,
          targetBounds: {
            type: "ellipse",
            cx: worldAnchor.x,
            cy: worldAnchor.y,
            rx: 18,
            ry: 18,
          },
          parentAttachment: {
            parentInstanceId: parent.instanceId,
            anchorId: anchor.anchorId,
          },
        });
      }
    }
    return candidates;
  }

  private obstacles(excludedId?: NamespacedId): PlacementObstacle[] {
    return this.#document.composition.objectInstances.flatMap((instance) => {
      if (instance.instanceId === excludedId) return [];
      const object = this.catalogObject(instance.catalogObjectRef.id);
      if (!object.collisionProfile.blocksPlacement) return [];
      return [
        {
          obstacleId: instance.instanceId,
          bounds: transformShape(
            object.defaultBounds.layout,
            instance.position,
            instance.scale,
          ),
        },
      ];
    });
  }

  private instance(instanceId: NamespacedId): Readonly<ObjectInstance> {
    const instance = this.#document.composition.objectInstances.find(
      (candidate) => candidate.instanceId === instanceId,
    );
    if (!instance) throw new Error(`Unknown Base Builder Object "${instanceId}"`);
    return instance;
  }

  private catalogEntry(catalogObjectId: NamespacedId): BaseBuilderCatalogEntry {
    const entry = this.catalog.find(
      (candidate) =>
        candidate.object.catalogObjectId === catalogObjectId,
    );
    if (!entry) {
      throw new Error(
        `Catalog Object "${catalogObjectId}" is not directly placeable`,
      );
    }
    return entry as BaseBuilderCatalogEntry;
  }

  private presetParent(
    instance: Readonly<ObjectInstance>,
  ): Readonly<ObjectInstance> | undefined {
    if (!instance.origin?.presetItemId) return undefined;
    return baseBuilderStandardPresetFixture.objectInstances.find(
      (candidate) =>
        candidate.origin?.presetItemId === instance.origin!.presetItemId,
    );
  }

  private updateInstance(
    instanceId: NamespacedId,
    update: (instance: ObjectInstance) => ObjectInstance,
  ): void {
    this.#document.composition = this.nextComposition({
      ...this.#document.composition,
      objectInstances: this.#document.composition.objectInstances.map(
        (instance) =>
          instance.instanceId === instanceId
            ? update(deepClone(instance))
            : instance,
      ),
    });
  }

  private nextComposition(composition: RoomComposition): RoomComposition {
    this.#revisionSequence += 1;
    return {
      ...composition,
      revision: {
        revisionId: `dev-base-builder-${this.#revisionSequence}`,
      },
    };
  }

  private nextInstanceId(catalogObjectId: NamespacedId): NamespacedId {
    this.#instanceSequence += 1;
    return `dev.instance.${catalogObjectId
      .replace(/^dev\.catalog\.builder\./, "")
      .replace(/^core\.catalog\.compat\./, "")}.${this.#instanceSequence}`;
  }

  private transact(label: string, operation: () => void): void {
    const before = deepClone(this.#document);
    operation();
    const after = deepClone(this.#document);
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    this.#undo.push({ label, before, after });
    this.#redo = [];
  }

  private inform(
    kind: BaseBuilderFeedback["kind"],
    message: string,
  ): void {
    this.#feedback = { kind, message };
  }
}

function createInstance(
  instanceId: NamespacedId,
  entry: BaseBuilderCatalogEntry,
  preview: Readonly<BaseBuilderPlacementPreview>,
): ObjectInstance {
  return {
    instanceId,
    catalogObjectRef: {
      id: entry.object.catalogObjectId,
      versionRange: `^${entry.object.version}`,
    },
    position: deepClone(preview.position),
    rotation: preview.rotation,
    scale: deepClone(preview.scale),
    layer: "scene",
    depth: 0,
    surfaceBinding: deepClone(preview.surfaceBinding!),
    ...(preview.parentAttachment
      ? { parentAttachment: deepClone(preview.parentAttachment) }
      : {}),
    skinRef: deepClone(entry.object.skinCompatibility.coreFallbackSkinRef),
    propertyOverrides: {
      position: { mode: "pinned", value: deepClone(preview.position) },
      rotation: { mode: "inherit" },
      scale: { mode: "inherit" },
      skin: { mode: "inherit" },
      animation: { mode: "inherit" },
      material: { mode: "inherit" },
      layer: { mode: "inherit" },
      depth: { mode: "inherit" },
    },
    placementState: "valid",
  };
}

function createFunctionInstance(
  instanceId: NamespacedId,
  definition: Readonly<FunctionContainer>,
): FunctionContainerInstance {
  return {
    containerInstanceId: `dev.function-instance.${instanceId.replaceAll(".", "-")}`,
    definitionRef: {
      id: definition.containerId,
      versionRange: `^${definition.version}`,
    },
    attachedObjectInstanceId: instanceId,
    expectedDescriptorRole: definition.functionBinding.descriptorRole,
  };
}

function resetInstanceProperty(
  instance: ObjectInstance,
  parent: Readonly<ObjectInstance> | undefined,
  property: BaseBuilderProperty,
): ObjectInstance {
  const propertyOverrides = {
    ...instance.propertyOverrides,
    [property]: {
      mode: parent ? "reset-to-parent" : "inherit",
    },
  } as ObjectInstance["propertyOverrides"];
  if (!parent) return { ...instance, propertyOverrides };
  if (property === "position") {
    return {
      ...instance,
      position: deepClone(parent.position),
      surfaceBinding: deepClone(parent.surfaceBinding),
      propertyOverrides,
    };
  }
  if (property === "rotation") {
    return { ...instance, rotation: parent.rotation, propertyOverrides };
  }
  if (property === "scale") {
    return {
      ...instance,
      scale: deepClone(parent.scale),
      propertyOverrides,
    };
  }
  if (property === "skin") {
    return {
      ...instance,
      skinRef: deepClone(parent.skinRef),
      propertyOverrides,
    };
  }
  if (property === "layer") {
    return { ...instance, layer: parent.layer, propertyOverrides };
  }
  return { ...instance, depth: parent.depth, propertyOverrides };
}

function positionOnSurface(
  object: Readonly<CatalogObject>,
  surface: Readonly<PlacementSurface>,
  pointer: Point,
  scale: Point,
  gridEnabled: boolean,
): Point {
  const bounds = axisBounds(surface.bounds);
  const size = visualSize(object);
  const width = size.x * scale.x;
  const height = size.y * scale.y;
  let position: Point;
  if (surface.surfaceKind === "floor") {
    position = {
      x: clamp(pointer.x - width / 2, bounds.x, bounds.x + bounds.width - width),
      y: bounds.y - height,
    };
  } else if (surface.surfaceKind === "ceiling") {
    position = {
      x: clamp(pointer.x - width / 2, bounds.x, bounds.x + bounds.width - width),
      y: bounds.y + bounds.height,
    };
  } else if (surface.surfaceKind === "wall") {
    const isLeft = surface.surfaceId.includes("left-wall");
    const isRight = surface.surfaceId.includes("right-wall");
    position = {
      x: isLeft
        ? bounds.x + bounds.width - width
        : isRight
          ? bounds.x
          : clamp(
              pointer.x - width / 2,
              bounds.x,
              bounds.x + bounds.width - width,
            ),
      y:
        object.family === "door"
          ? floorTop(emptyRoomShellFixture) - height
          : clamp(
              pointer.y - height / 2,
              bounds.y,
              bounds.y + bounds.height - height,
            ),
    };
  } else {
    position = {
      x: pointer.x - width / 2,
      y: pointer.y - height / 2,
    };
  }
  return gridPoint(position, gridEnabled);
}

function bindingFor(
  surface: Readonly<PlacementSurface>,
  position: Point,
  object: Readonly<CatalogObject>,
): SurfaceBinding {
  const aligned =
    object.placementProfile.rotationPolicy.alignToSurfaceNormal ||
    object.placementProfile.rotationPolicy.mode === "surface-normal";
  return {
    surfaceId: surface.surfaceId,
    placementAreaId: surface.placementAreaIds[0]!,
    localPosition: position,
    normalOffset: 0,
    orientationMode: aligned ? "surface-normal" : "room",
    shellVersion: emptyRoomShellFixture.version,
  };
}

function objectAnchorSurface(
  parent: Readonly<ObjectInstance>,
  anchor: Readonly<AttachmentAnchor>,
  point: Point,
): PlacementSurface {
  return {
    surfaceId: `dev.surface.object-anchor.${parent.instanceId.replaceAll(".", "-")}`,
    surfaceKind: "object-anchor",
    bounds: {
      type: "ellipse",
      cx: point.x,
      cy: point.y,
      rx: 18,
      ry: 18,
    },
    normal: deepClone(anchor.normal),
    basisX: { x: 1, y: 0, z: 0 },
    basisY: { x: 0, y: 1, z: 0 },
    placementAreaIds: [
      `dev.area.object-anchor.${parent.instanceId.replaceAll(".", "-")}`,
    ],
    anchorIds: [anchor.anchorId],
    layerBandId: parent.layer,
    depth: parent.depth + 1,
    snapPriority: anchor.priority,
  };
}

function placementMessage(
  object: Readonly<CatalogObject>,
  metadata: CandidateMetadata,
  valid: boolean,
): string {
  if (!valid) {
    if (metadata.issueCodes.includes("clearance-violated")) {
      return "Zu wenig Platz.";
    }
    if (
      object.placementProfile.allowedSurfaces.includes("wall") &&
      metadata.surface.surfaceKind !== "wall"
    ) {
      return "Benötigt eine Wand.";
    }
    if (
      object.placementProfile.allowedSurfaces.includes("ceiling") &&
      metadata.surface.surfaceKind !== "ceiling"
    ) {
      return "Benötigt die Decke.";
    }
    if (
      object.placementProfile.allowedSurfaces.includes("floor") &&
      metadata.surface.surfaceKind !== "floor" &&
      metadata.surface.surfaceKind !== "object-anchor"
    ) {
      return "Benötigt den Boden oder einen passenden Anker.";
    }
    return "Hier ist keine gültige Platzierung möglich.";
  }
  if (metadata.parentAttachment) return "Auf Regal befestigt.";
  if (metadata.surface.surfaceKind === "floor") return "An Boden platziert.";
  if (metadata.surface.surfaceKind === "ceiling") return "An Decke platziert.";
  if (metadata.surface.surfaceId.includes("left-wall")) {
    return "An linker Wand ausgerichtet.";
  }
  if (metadata.surface.surfaceId.includes("right-wall")) {
    return "An rechter Wand ausgerichtet.";
  }
  return "An Rückwand ausgerichtet.";
}

function snapRange(
  object: Readonly<CatalogObject>,
  surfaceKind: PlacementSurface["surfaceKind"],
): number {
  if (surfaceKind === "floor" && object.placementProfile.wallStop) return 150;
  return Math.max(120, object.placementProfile.preferredDistance * 3);
}

function visualSize(object: Readonly<CatalogObject>): Point {
  const bounds = axisBounds(object.defaultBounds.visual);
  return { x: bounds.width, y: bounds.height };
}

function centerOfInstance(
  instance: Readonly<ObjectInstance>,
  object: Readonly<CatalogObject>,
): Point {
  return centerAt(instance.position, object, instance.scale);
}

function centerAt(
  position: Point,
  object: Readonly<CatalogObject>,
  scale: Point,
): Point {
  const size = visualSize(object);
  return {
    x: position.x + (size.x * scale.x) / 2,
    y: position.y + (size.y * scale.y) / 2,
  };
}

function transformShape(
  shape: BoundsShape,
  position: Point,
  scale: Point,
): BoundsShape {
  const bounds = axisBounds(shape);
  return {
    type: "rect",
    x: position.x + bounds.x * scale.x,
    y: position.y + bounds.y * scale.y,
    width: bounds.width * scale.x,
    height: bounds.height * scale.y,
  };
}

function axisBounds(shape: BoundsShape): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (shape.type === "rect") return shape;
  if (shape.type === "ellipse") {
    return {
      x: shape.cx - shape.rx,
      y: shape.cy - shape.ry,
      width: shape.rx * 2,
      height: shape.ry * 2,
    };
  }
  const xs = shape.points.map((point) => point.x);
  const ys = shape.points.map((point) => point.y);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

function floorTop(shell: Readonly<RoomShell>): number {
  const floor = shell.placementSurfaces.find(
    (surface) => surface.surfaceKind === "floor",
  );
  return floor ? axisBounds(floor.bounds).y : 720;
}

function gridPoint(point: Point, enabled: boolean): Point {
  if (!enabled) return point;
  return {
    x: Math.round(point.x / 40) * 40,
    y: Math.round(point.y / 40) * 40,
  };
}

function pointDistance(left: Point, right: Point): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function normalizeAngle(value: number): number {
  return ((value % 360) + 360) % 360;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function overrideMode(
  instance: Readonly<ObjectInstance>,
  property: BaseBuilderProperty,
): PropertyOverrideMode {
  return instance.propertyOverrides[property].mode;
}
