export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

export type NamespacedId = string;
export type SymbolId = string;
export type SemanticVersion = string;
export type VersionRange = string;

export interface VersionedRef {
  id: NamespacedId;
  versionRange: VersionRange;
}

export interface Compatibility {
  themeEngine: VersionRange;
  cosmos?: VersionRange;
}

export type PresentationGroup =
  | "world"
  | "map"
  | "base-entry"
  | "base-interior"
  | "room"
  | "workspace"
  | "window"
  | "companion"
  | "icon"
  | "node"
  | "connection"
  | "label"
  | "status"
  | "ambient";

export type TokenType =
  | "color"
  | "length"
  | "number"
  | "duration"
  | "shadow"
  | "font-family"
  | "opacity"
  | "string"
  | "boolean";

export interface TypedToken {
  type: TokenType;
  value: string | number | boolean;
  description?: string;
}

export interface ArtifactAuthor {
  name: string;
  url?: string;
}

export interface ArtifactMetadata {
  createdAt?: string;
  updatedAt?: string;
  keywords?: readonly string[];
}

export interface ThemeDependency extends VersionedRef {
  kind: "theme" | "skin-pack" | "template-pack" | "renderer-pack";
  optional?: boolean;
}

export interface ThemeManifest {
  $schema?: string;
  schemaVersion: 1;
  themeId: NamespacedId;
  version: SemanticVersion;
  displayName: string;
  description?: string;
  packageKind: "full-theme" | "group-pack";
  compatibility: Compatibility;
  groups: readonly PresentationGroup[];
  packRefs: readonly VersionedRef[];
  defaultCompositionRef?: VersionedRef;
  dependencies?: readonly ThemeDependency[];
  tokens: Readonly<Record<NamespacedId, TypedToken>>;
  systemTerms: SystemTerms;
  author?: ArtifactAuthor;
  license?: string;
  metadata?: ArtifactMetadata;
}

export type AssetKind = "image" | "vector" | "video";
export type AssetFormat = "png" | "webp" | "svg" | "webm" | "mp4";
export type AssetMimeType =
  | "image/png"
  | "image/webp"
  | "image/svg+xml"
  | "video/webm"
  | "video/mp4";

export interface VideoMediaContract {
  posterAssetId: NamespacedId;
  reducedMotionAssetId: NamespacedId;
  loop: boolean;
  autoplay: boolean;
  muted: boolean;
  playbackRate: number;
  lazyLoad: "eager" | "viewport" | "on-demand";
}

export interface AssetReference {
  assetId: NamespacedId;
  kind: AssetKind;
  format: AssetFormat;
  mimeType: AssetMimeType;
  path: string;
  sha256: string;
  byteSize: number;
  width: number;
  height: number;
  colorSpace?: "srgb" | "display-p3" | "unknown";
  alpha?: boolean;
  density?: number;
  accessibilityDescription?: string;
  media?: VideoMediaContract;
}

export interface SkinTarget {
  presentationGroup: PresentationGroup;
  templateRef?: VersionedRef;
  rendererRef?: VersionedRef;
  targetRoles?: readonly NamespacedId[];
}

export interface AssetBinding {
  bindingId: NamespacedId;
  slotId: NamespacedId;
  assetId: NamespacedId;
  fit?: "contain" | "cover" | "fill" | "none";
  alignment?:
    | "center"
    | "top"
    | "right"
    | "bottom"
    | "left"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
  opacity?: number;
  tint?: string;
  states?: readonly SymbolId[];
}

export interface Material {
  channelId: NamespacedId;
  parameters: Readonly<Record<NamespacedId, JsonValue>>;
}

export interface StateVariant {
  stateId: SymbolId;
  assetBindingIds?: readonly NamespacedId[];
  tokenOverrides?: Readonly<Record<NamespacedId, TypedToken>>;
  materialOverrides?: readonly Material[];
  animationId?: NamespacedId;
}

export type SystemTerms = Readonly<Record<string, Readonly<Record<string, string>>>>;

export interface BoundsOverride {
  boundsId: NamespacedId;
  role: "visual" | "effect" | "label";
  shape: BoundsShape;
}

export interface AnimationKeyframe {
  offset: number;
  values: Readonly<Record<string, string | number | boolean>>;
}

export interface DeclarativeAnimation {
  animationId: NamespacedId;
  durationMs: number;
  iterations: number | "infinite";
  reducedMotion: "disable" | "freeze-first" | "freeze-last" | "substitute";
  substituteAnimationId?: NamespacedId;
  keyframes: readonly AnimationKeyframe[];
}

export interface SkinDefinition {
  skinId: NamespacedId;
  version: SemanticVersion;
  displayName: string;
  target: SkinTarget;
  assetBindings: readonly AssetBinding[];
  tokens: Readonly<Record<NamespacedId, TypedToken>>;
  materials: readonly Material[];
  stateVariants: readonly StateVariant[];
  systemTerms?: SystemTerms;
  boundsOverrides?: readonly BoundsOverride[];
  animations?: readonly DeclarativeAnimation[];
}

export interface SkinPack {
  $schema?: string;
  schemaVersion: 1;
  packId: NamespacedId;
  version: SemanticVersion;
  packageKind: "skin-pack" | "single-skin";
  displayName: string;
  description?: string;
  compatibility: Compatibility;
  dependencies?: readonly VersionedRef[];
  assets: readonly AssetReference[];
  skins: readonly SkinDefinition[];
  license?: string;
  author?: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface RectBounds {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
}

export interface EllipseBounds {
  type: "ellipse";
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface PolygonBounds {
  type: "polygon";
  points: readonly Point[];
}

export type BoundsShape = RectBounds | EllipseBounds | PolygonBounds;
export type BoundsRole = "interaction" | "layout" | "visual" | "effect" | "label";
export type MutableOwner = "core" | "template" | "composition" | "skin";

export interface BoundsDefinition {
  boundsId: NamespacedId;
  role: BoundsRole;
  shape: BoundsShape;
  mutableBy: MutableOwner;
  critical: boolean;
  pointerPolicy: "active" | "passive" | "none";
  minimumTarget?: {
    width: number;
    height: number;
  };
}

export interface Anchor {
  anchorId: NamespacedId;
  x: number;
  y: number;
  rotation?: number;
  owner: "visual" | "interaction" | "layout" | "label" | "transition";
  mutableBy: MutableOwner;
  safeAreaId?: NamespacedId;
}

export interface ReferenceViewport {
  width: number;
  height: number;
  unit: "du";
  origin: "top-left";
}

export interface ObjectCoordinateMapping {
  fit: "contain" | "cover" | "stretch";
  alignment:
    | "center"
    | "top"
    | "right"
    | "bottom"
    | "left"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
  functionalFit: "contain";
}

export interface EnvironmentCoordinateMapping {
  decorativeFit: "contain" | "cover" | "stretch";
  functionalFit: "contain";
  alignment:
    | "center"
    | "top"
    | "right"
    | "bottom"
    | "left"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
}

export interface Cardinality {
  minimum: number;
  maximum: number;
}

export interface FunctionalRole {
  roleId: NamespacedId;
  actionRoles: readonly NamespacedId[];
  required: boolean;
  interactionBoundsId: NamespacedId;
  visualAnchorId?: NamespacedId;
  labelAnchorId?: NamespacedId;
  cardinality?: Cardinality;
  critical?: boolean;
}

export interface TemplateState {
  stateId: SymbolId;
  source: "core";
  fallbackStateId: SymbolId;
  description?: string;
}

export interface TemplateAssetSlot {
  slotId: NamespacedId;
  purpose: string;
  acceptedKinds: readonly AssetKind[];
  acceptedFormats: readonly AssetFormat[];
  required: boolean;
  fallbackPolicy: "skin-chain" | "template-default" | "core-emergency" | "none";
  boundsId?: NamespacedId;
  states?: readonly SymbolId[];
}

export interface LayerBand {
  bandId: SymbolId;
  minimum: number;
  maximum: number;
  owner:
    | "environment"
    | "object"
    | "objects"
    | "window"
    | "windows"
    | "surface"
    | "modal"
    | "emergency";
}

export interface RendererCompatibility {
  rendererRef: VersionedRef;
  role: NamespacedId;
  required: boolean;
}

export interface ScaleRules {
  universalScale: number;
  minimum: number;
  maximum: number;
  hierarchy: Readonly<Record<NamespacedId, number>>;
  autoScale?: boolean;
}

export interface ObjectTemplate {
  $schema?: string;
  schemaVersion: 1;
  templateId: NamespacedId;
  version: SemanticVersion;
  templateKind: "object";
  displayName: string;
  description?: string;
  targetRole: NamespacedId;
  compatibility: Compatibility;
  referenceViewport: ReferenceViewport;
  coordinateMapping: ObjectCoordinateMapping;
  functionalRoles: readonly FunctionalRole[];
  states: readonly TemplateState[];
  statePriority?: readonly SymbolId[];
  anchors: readonly Anchor[];
  bounds: readonly BoundsDefinition[];
  assetSlots: readonly TemplateAssetSlot[];
  layerBands: readonly LayerBand[];
  rendererCompatibility: readonly RendererCompatibility[];
  coreFallbackSkinRef: VersionedRef;
  scaleRules?: ScaleRules;
  cardinality?: Cardinality;
  metadata?: {
    owner?: string;
    notes?: string;
  };
}

export type EnvironmentKind = "world" | "map" | "base-interior" | "room" | "workspace";
export type SurfaceRole =
  | "background"
  | "rear"
  | "left"
  | "right"
  | "floor"
  | "ceiling"
  | "foreground"
  | "ambient";

export interface EnvironmentSurface {
  surfaceId: NamespacedId;
  surfaceRole: SurfaceRole;
  required: boolean;
  assetSlotId: NamespacedId;
  layerBandId: SymbolId;
  pointerPolicy: "passive";
  shape?: BoundsShape;
  allowedFit?: readonly ("contain" | "cover" | "stretch")[];
}

export type FunctionalZoneRole =
  | "door"
  | "workspace.entry"
  | "companion.anchor"
  | "base.exit"
  | "room.transition"
  | "tool.entry"
  | "map.navigation";

export interface FunctionalZone {
  zoneId: NamespacedId;
  role: FunctionalZoneRole;
  actionRoles: readonly NamespacedId[];
  shape: BoundsShape;
  required: boolean;
  critical: boolean;
  mutableBy: "core" | "template" | "composition";
  layerBandId: SymbolId;
  visualAnchorId: NamespacedId;
  interactionAnchorId: NamespacedId;
  labelAnchorId?: NamespacedId;
  minimumTarget?: {
    width: number;
    height: number;
  };
}

export interface SafeArea {
  safeAreaId: NamespacedId;
  purpose:
    | "functional-content"
    | "window-recovery"
    | "label"
    | "viewport"
    | "art-documentation";
  shape: BoundsShape;
  critical: boolean;
  mutableBy: "core" | "template" | "composition";
}

export interface SceneRoot {
  rootId: NamespacedId;
  layerBandId: SymbolId;
  allowedNodeKinds: readonly SceneNodeKind[];
}

export interface PortalPolicy {
  windowPortal: "geometry-neutral";
  geometryOwner: "window-system";
  forbiddenAncestorEffects: readonly (
    | "transform"
    | "filter"
    | "backdrop-filter"
    | "perspective"
    | "contain"
    | "overflow-clipping"
  )[];
  focusLayerBandId: SymbolId;
}

export interface EnvironmentTemplate {
  $schema?: string;
  schemaVersion: 1;
  templateId: NamespacedId;
  version: SemanticVersion;
  templateKind: "environment";
  displayName: string;
  description?: string;
  environmentKind: EnvironmentKind;
  compatibility: Compatibility;
  referenceViewport: ReferenceViewport;
  coordinateMapping: EnvironmentCoordinateMapping;
  surfaces: readonly EnvironmentSurface[];
  functionalZones: readonly FunctionalZone[];
  safeAreas: readonly SafeArea[];
  anchors: readonly Anchor[];
  layerBands: readonly LayerBand[];
  sceneRoots: readonly SceneRoot[];
  states: readonly TemplateState[];
  assetSlots?: readonly TemplateAssetSlot[];
  cardinality?: Readonly<Record<NamespacedId, Cardinality>>;
  portalPolicy?: PortalPolicy;
  coreFallbackSkinRef: VersionedRef;
}

export type ScopeLevel =
  | "instance"
  | "rule"
  | "cluster"
  | "project"
  | "room"
  | "environment"
  | "composition-global";

export type CompositionScope =
  | { level: "instance"; objectId: string; objectKind?: NamespacedId }
  | { level: "rule" }
  | { level: "cluster" | "project" | "room" | "environment"; scopeId: string }
  | { level: "composition-global" };

export type SelectorField =
  | "objectId"
  | "objectKind"
  | "templateRole"
  | "hierarchyLevel"
  | "tagId"
  | "tagNamespace"
  | "state"
  | "environmentId"
  | "roomId"
  | "projectId"
  | "clusterId"
  | "presentationTrait";

export interface SelectorPredicate {
  field: SelectorField;
  operator: "equals" | "in" | "range" | "has";
  value:
    | string
    | number
    | boolean
    | readonly (string | number | boolean)[]
    | { minimum: number; maximum: number };
}

export interface CompositionSelector {
  all: readonly SelectorPredicate[];
  any?: readonly SelectorPredicate[];
  not?: readonly SelectorPredicate[];
}

export interface PresentationTarget {
  presentationGroup: PresentationGroup;
  role?: NamespacedId;
  slotId?: NamespacedId;
  channelId?: NamespacedId;
  tokenId?: NamespacedId;
}

export type OverrideValue =
  | {
      kind: "skin-ref" | "template-ref" | "asset-ref" | "renderer-ref";
      ref: VersionedRef;
    }
  | {
      kind: "token-values";
      values: Readonly<Record<NamespacedId, TypedToken>>;
    }
  | {
      kind: "material-values";
      channelId: NamespacedId;
      parameters: Readonly<Record<NamespacedId, JsonValue>>;
    }
  | {
      kind: "disabled";
    };

export interface OverrideAssignment {
  assignmentId: NamespacedId;
  enabled: boolean;
  scope: CompositionScope;
  selector?: CompositionSelector;
  target: PresentationTarget;
  value: OverrideValue;
  priority: number;
  note?: string;
}

export interface PlacementTransform {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  pivotX: number;
  pivotY: number;
}

export type SceneNodeKind =
  | "group"
  | "surface"
  | "asset"
  | "functional-object"
  | "renderer"
  | "label"
  | "ambient";

export interface RuntimeDescriptorBinding {
  source: "runtime-context";
  descriptorRole: NamespacedId;
}

export interface GroupScenePayload {
  kind: "group";
}

export interface SurfaceScenePayload {
  kind: "surface";
  surfaceId: NamespacedId;
  assetRef?: VersionedRef;
}

export interface AssetScenePayload {
  kind: "asset";
  assetRef: VersionedRef;
  visualBounds: BoundsShape;
  effectBounds?: BoundsShape;
}

export interface FunctionalObjectScenePayload {
  kind: "functional-object";
  functionalZoneId: NamespacedId;
  actionRole: NamespacedId;
  descriptorBinding: RuntimeDescriptorBinding;
  visualBounds: BoundsShape;
  interactionBounds: BoundsShape;
  layoutBounds: BoundsShape;
  effectBounds: BoundsShape;
  labelBounds?: BoundsShape;
  anchorIds: readonly NamespacedId[];
}

export interface RendererScenePayload {
  kind: "renderer";
  rendererRef: VersionedRef;
  parameters: Readonly<Record<NamespacedId, JsonValue>>;
}

export interface LabelScenePayload {
  kind: "label";
  textOwnership: "system-term" | "user-content" | "runtime-status";
  systemTermKey?: string;
  labelBounds: BoundsShape;
}

export interface AmbientScenePayload {
  kind: "ambient";
  rendererRef: VersionedRef;
  pointerPolicy: "passive";
}

export type ScenePayload =
  | GroupScenePayload
  | SurfaceScenePayload
  | AssetScenePayload
  | FunctionalObjectScenePayload
  | RendererScenePayload
  | LabelScenePayload
  | AmbientScenePayload;

export interface SceneNode {
  nodeId: NamespacedId;
  kind: SceneNodeKind;
  parentNodeId?: NamespacedId;
  anchorId: NamespacedId;
  localOrder: number;
  layerBand: SymbolId;
  transform: PlacementTransform;
  visibleWhen?: readonly SymbolId[];
  payload: ScenePayload;
}

export interface EnvironmentScene {
  sceneId: NamespacedId;
  environmentTemplateRef: VersionedRef;
  scope: CompositionScope;
  nodes: readonly SceneNode[];
}

export interface ScopeAlias {
  aliasId: NamespacedId;
  kind: "cluster" | "project" | "room" | "environment";
  targetId: string;
}

export interface Composition {
  $schema?: string;
  schemaVersion: 1;
  compositionId: NamespacedId;
  version: SemanticVersion;
  resolverVersion: SemanticVersion;
  displayName: string;
  description?: string;
  activeThemeRef: VersionedRef;
  packRefs: readonly VersionedRef[];
  parentCompositionRefs: readonly VersionedRef[];
  scopes: readonly ScopeAlias[];
  overrides: readonly OverrideAssignment[];
  environmentScenes: readonly EnvironmentScene[];
  portability: "distributable" | "installation-local";
  revision?: {
    revisionId: string;
    updatedAt: string;
  };
}

export interface RuntimeFunctionBinding {
  bindingId: NamespacedId;
  functionalZoneId: NamespacedId;
  descriptorRole: NamespacedId;
  descriptorId: string;
  source: "core";
}

export type ThemeArtifact =
  | ThemeManifest
  | SkinPack
  | ObjectTemplate
  | EnvironmentTemplate
  | Composition;
