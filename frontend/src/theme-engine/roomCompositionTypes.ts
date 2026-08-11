import type {
  BoundsShape,
  Compatibility,
  LayerBand,
  NamespacedId,
  Point,
  ReferenceViewport,
  SafeArea,
  SemanticVersion,
  SymbolId,
  TemplateAssetSlot,
  TemplateState,
  VersionedRef,
} from "./types";

export type CatalogObjectFamily =
  | "door"
  | "workspace-furniture"
  | "furniture"
  | "decoration"
  | "plant"
  | "light"
  | "surface-material"
  | "window"
  | "architecture-object"
  | "companion-visual";

export type PlacementSurfaceKind =
  | "floor"
  | "wall"
  | "ceiling"
  | "background-opening"
  | "architecture"
  | "object-anchor";

export type SurfaceNormal = "up" | "down" | "horizontal" | "any";

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface RoomCamera {
  projection: "orthographic" | "perspective" | "illustrated-fixed";
  angleDegrees: number;
  horizon: number;
  depthPolicy: "layer-depth" | "surface-depth";
  scaleReference: number;
}

export interface SurfaceDefinition {
  surfaceId: NamespacedId;
  surfaceKind: Exclude<PlacementSurfaceKind, "object-anchor">;
  geometry: BoundsShape;
  normal: Vector3;
  layerBandId: SymbolId;
  depth: number;
  pointerPolicy: "passive";
}

export interface PlacementSurface {
  surfaceId: NamespacedId;
  surfaceKind: PlacementSurfaceKind;
  bounds: BoundsShape;
  normal: Vector3;
  basisX: Vector3;
  basisY: Vector3;
  placementAreaIds: readonly NamespacedId[];
  anchorIds: readonly NamespacedId[];
  layerBandId: SymbolId;
  depth: number;
  snapPriority: number;
}

export interface PlacementArea {
  areaId: NamespacedId;
  surfaceId: NamespacedId;
  bounds: BoundsShape;
  safe: boolean;
}

export interface AttachmentAnchor {
  anchorId: NamespacedId;
  role: SymbolId;
  position: Point;
  normal: Vector3;
  compatibleFamilies: readonly CatalogObjectFamily[];
  acceptedAttachmentRoles: readonly SymbolId[];
  priority: number;
}

export interface LightAnchor {
  anchorId: NamespacedId;
  position: Point;
  normal: Vector3;
  lightRole: "ambient" | "key" | "fill" | "accent";
}

export interface RoomShell {
  $schema?: string;
  schemaVersion: 1;
  shellId: NamespacedId;
  version: SemanticVersion;
  displayName: string;
  compatibility: Compatibility;
  referenceViewport: ReferenceViewport;
  camera: RoomCamera;
  perspectiveProfile: SymbolId;
  architectureSurfaces: readonly SurfaceDefinition[];
  placementSurfaces: readonly PlacementSurface[];
  placementAreas: readonly PlacementArea[];
  attachmentAnchors: readonly AttachmentAnchor[];
  lightAnchors: readonly LightAnchor[];
  safeAreas: readonly SafeArea[];
  layerBands: readonly LayerBand[];
  coreFallbackShellRef: VersionedRef;
}

export interface RotationPolicy {
  mode: "fixed" | "steps" | "free" | "surface-normal";
  allowedDegrees?: readonly number[];
  stepDegrees?: number;
  alignToSurfaceNormal: boolean;
  upright: boolean;
}

export interface ScalePolicy {
  minimum: number;
  maximum: number;
  uniform: boolean;
}

export interface CollisionProfile {
  mode: "solid" | "soft" | "overlap-allowed";
  boundsRole: "layout";
  blocksPlacement: boolean;
}

export type SnapTargetKind =
  | "surface"
  | "edge"
  | "corner"
  | "anchor"
  | "object-anchor"
  | "grid";

export interface PlacementProfile {
  allowedSurfaces: readonly PlacementSurfaceKind[];
  requiredSurfaceContact: boolean;
  allowedNormals: readonly SurfaceNormal[];
  wallStop: boolean;
  floorLock: boolean;
  ceilingLock: boolean;
  snapTargets: readonly SnapTargetKind[];
  attachmentTargets: readonly SymbolId[];
  rotationPolicy: RotationPolicy;
  scalePolicy: ScalePolicy;
  collisionPolicy: CollisionProfile["mode"];
  clearance: number;
  preferredDistance: number;
  hysteresis: number;
  priority: number;
}

export interface CatalogObjectBounds {
  visual: BoundsShape;
  layout: BoundsShape;
  effect: BoundsShape;
  label?: BoundsShape;
}

export interface SkinCompatibility {
  presentationGroup: "room";
  requiredSlotIds: readonly NamespacedId[];
  coreFallbackSkinRef: VersionedRef;
}

export interface CatalogObject {
  $schema?: string;
  schemaVersion: 1;
  catalogObjectId: NamespacedId;
  version: SemanticVersion;
  displayName: string;
  family: CatalogObjectFamily;
  compatibility: Compatibility;
  visualSlots: readonly TemplateAssetSlot[];
  defaultBounds: CatalogObjectBounds;
  pivot: Point;
  placementProfile: PlacementProfile;
  attachmentAnchors: readonly AttachmentAnchor[];
  collisionProfile: CollisionProfile;
  states: readonly TemplateState[];
  skinCompatibility: SkinCompatibility;
  perspectiveProfile: SymbolId;
  scale: {
    defaultX: number;
    defaultY: number;
    minimum: number;
    maximum: number;
  };
  layerCompatibility: readonly SymbolId[];
  functionContainerCompatibility?: readonly FunctionType[];
}

export type FunctionType =
  | "knowledge-workspace"
  | "creation-workspace"
  | "room-transition"
  | "companion-interaction"
  | "tool-entry"
  | "base-exit";

export interface FunctionBindingContract {
  source: "runtime-context";
  descriptorRole: NamespacedId;
  actionRole: NamespacedId;
}

export interface FunctionContainer {
  $schema?: string;
  schemaVersion: 1;
  containerId: NamespacedId;
  version: SemanticVersion;
  displayName: string;
  functionId: NamespacedId;
  functionType: FunctionType;
  interactionBounds: BoundsShape;
  functionBinding: FunctionBindingContract;
  allowedCatalogFamilies: readonly CatalogObjectFamily[];
  accessibilityLabel: {
    source: "runtime-context" | "system-term";
    key?: NamespacedId;
  };
  focusBehavior: {
    focusable: true;
    focusRing: "core";
    tabOrder: "core";
  };
  states: readonly TemplateState[];
  minimumTarget: {
    width: number;
    height: number;
  };
  requiredClearance?: BoundsShape;
  fallbackPresentationRef: VersionedRef;
}

export interface SurfaceBinding {
  surfaceId: NamespacedId;
  placementAreaId: NamespacedId;
  anchorId?: NamespacedId;
  localPosition: Point;
  normalOffset: number;
  orientationMode: "surface-normal" | "room" | "custom";
  shellVersion: SemanticVersion;
}

export type PropertyOverrideMode = "inherit" | "pinned" | "reset-to-parent";

export type PropertyOverrideState<T> =
  | { readonly mode: "inherit"; readonly authoredAgainst?: VersionedRef }
  | { readonly mode: "pinned"; readonly value: T; readonly authoredAgainst?: VersionedRef }
  | { readonly mode: "reset-to-parent"; readonly authoredAgainst?: VersionedRef };

export interface PresetVersionReference {
  presetId: NamespacedId;
  version: SemanticVersion;
  presetItemId?: NamespacedId;
}

export interface ParentAttachmentReference {
  parentInstanceId: NamespacedId;
  anchorId: NamespacedId;
}

export interface ObjectInstance {
  instanceId: NamespacedId;
  catalogObjectRef: VersionedRef;
  position: Point;
  rotation: number;
  scale: Point;
  layer: SymbolId;
  depth: number;
  surfaceBinding: SurfaceBinding;
  parentAttachment?: ParentAttachmentReference;
  functionContainerInstanceId?: NamespacedId;
  skinRef: VersionedRef;
  animationRef?: VersionedRef;
  materialRef?: VersionedRef;
  propertyOverrides: {
    position: PropertyOverrideState<Point>;
    rotation: PropertyOverrideState<number>;
    scale: PropertyOverrideState<Point>;
    skin: PropertyOverrideState<VersionedRef>;
    animation: PropertyOverrideState<VersionedRef | null>;
    material: PropertyOverrideState<VersionedRef | null>;
    layer: PropertyOverrideState<SymbolId>;
    depth: PropertyOverrideState<number>;
  };
  origin?: PresetVersionReference;
  placementState?: "valid" | "needs-placement-repair";
}

export interface FunctionContainerInstance {
  containerInstanceId: NamespacedId;
  definitionRef: VersionedRef;
  attachedObjectInstanceId: NamespacedId;
  expectedDescriptorRole: NamespacedId;
}

export interface SurfaceMaterialBinding {
  bindingId: NamespacedId;
  surfaceId: NamespacedId;
  materialRef: VersionedRef;
}

export interface RoomConnection {
  connectionId: NamespacedId;
  fromRoomId: NamespacedId;
  toRoomId: NamespacedId;
  bidirectional: boolean;
  visualObjectInstanceIds?: readonly NamespacedId[];
}

export interface RoomPreset {
  $schema?: string;
  schemaVersion: 1;
  presetId: NamespacedId;
  version: SemanticVersion;
  displayName: string;
  origin: "core" | "theme-pack" | "user";
  shellRef: VersionedRef;
  objectInstances: readonly ObjectInstance[];
  functionContainers: readonly FunctionContainerInstance[];
  decorations?: readonly NamespacedId[];
  connections?: readonly RoomConnection[];
}

export interface RoomComposition {
  $schema?: string;
  schemaVersion: 1;
  roomId: NamespacedId;
  version: SemanticVersion;
  shellRef: VersionedRef;
  presetOrigin?: PresetVersionReference;
  objectInstances: readonly ObjectInstance[];
  functionContainers: readonly FunctionContainerInstance[];
  decorations?: readonly NamespacedId[];
  surfaceMaterials?: readonly SurfaceMaterialBinding[];
  connections?: readonly RoomConnection[];
  deletedPresetItemIds?: readonly NamespacedId[];
  revision: {
    revisionId: string;
  };
}

export interface BaseComposition {
  $schema?: string;
  schemaVersion: 1;
  baseId: NamespacedId;
  version: SemanticVersion;
  rooms: readonly RoomComposition[];
  connections: readonly RoomConnection[];
  entryRoomId?: NamespacedId;
  presentationOverrides: readonly VersionedRef[];
  revision: {
    revisionId: string;
  };
}

export interface PlacementObstacle {
  obstacleId: NamespacedId;
  bounds: BoundsShape;
}

export interface PlacementValidationInput {
  object: CatalogObject;
  surface: PlacementSurface;
  binding: SurfaceBinding;
  position: Point;
  rotation: number;
  scale: Point;
  hasRequiredSurfaceContact: boolean;
  attachmentAnchor?: AttachmentAnchor;
  obstacles?: readonly PlacementObstacle[];
}

export interface PlacementValidationIssue {
  code:
    | "surface-incompatible"
    | "surface-binding-mismatch"
    | "surface-contact-required"
    | "normal-incompatible"
    | "floor-lock-violated"
    | "ceiling-lock-violated"
    | "rotation-incompatible"
    | "scale-incompatible"
    | "clearance-violated"
    | "attachment-incompatible";
  message: string;
  relatedId?: NamespacedId;
}

export interface PlacementValidationResult {
  valid: boolean;
  issues: readonly PlacementValidationIssue[];
}

export interface SnapTarget {
  targetId: NamespacedId;
  kind: SnapTargetKind;
  surfaceId?: NamespacedId;
  anchorId?: NamespacedId;
  position: Point;
  priority: number;
}

export interface SnapRuleEvaluation {
  ruleId: SymbolId;
  passed: boolean;
  reason: string;
}

export interface SnapCandidate {
  candidateId: NamespacedId;
  target: SnapTarget;
  binding: SurfaceBinding;
  explicitAnchorMatch: boolean;
  contactQuality: number;
  profilePriority: number;
  distance: number;
  alignmentQuality: number;
  clearance: number;
  rules: readonly SnapRuleEvaluation[];
}

export interface SnapTraceCandidate {
  candidateId: NamespacedId;
  valid: boolean;
  rejectedBy: readonly SymbolId[];
  score: readonly number[];
  hysteresisApplied: number;
  selected: boolean;
}

export interface SnapTrace {
  candidates: readonly SnapTraceCandidate[];
  winnerCandidateId?: NamespacedId;
  winnerReason: string;
}

export interface SnapResult {
  winner?: SnapCandidate;
  trace: SnapTrace;
}

export type PresetMergeState =
  | "unchanged"
  | "updated"
  | "added"
  | "user-deleted"
  | "detached"
  | "conflict";

export interface PresetMergeItem {
  presetItemId: NamespacedId;
  state: PresetMergeState;
  instanceId?: NamespacedId;
  message: string;
}

export interface PresetMergeConflict {
  presetItemId: NamespacedId;
  code: "catalog-reference-changed" | "preset-item-removed" | "origin-ambiguous";
  message: string;
}

export interface PresetMergeResult {
  composition: RoomComposition;
  items: readonly PresetMergeItem[];
  conflicts: readonly PresetMergeConflict[];
}
