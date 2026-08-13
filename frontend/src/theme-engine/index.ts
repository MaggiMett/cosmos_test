export {
  BaseRoomCompatibilityAdapterError,
  COMPATIBILITY_ROOM_SHELL_ID,
  COSMOS_MAIN_ROOM_ID,
  COSMOS_MAIN_ROOM_PRESET_ID,
  adaptBaseMainRoomV1,
  resolveCompatibilityBounds,
} from "./baseRoomCompatibilityAdapter";
export type {
  BaseRoomCompatibilityAdapterInput,
  BaseRoomCompatibilityProjection,
  CompatibilityBoundsRecord,
} from "./baseRoomCompatibilityAdapter";
export {
  AssetRegistry,
  AssetRegistryError,
  validateAssetPath,
} from "./assetRegistry";
export type {
  AssetRegistration,
  RegisteredAsset,
  ResolvedAsset,
} from "./assetRegistry";
export {
  canonicalAssetCatalogEntries,
  canonicalVisualAssets,
} from "./assetCatalogFixtures";
export {
  coreTemplateCatalog,
  coreTemplateCatalogByGroup,
} from "./coreTemplateCatalog";
export {
  clusterNodeTemplate,
  coreNodeTemplates,
  detailNodeTemplate,
  domainNodeTemplate,
  objectNodeTemplate,
  projectRootNodeTemplate,
} from "./nodeTemplates";
export type {
  CoreTemplateCatalogEntry,
  CoreTemplateKind,
  CoreTemplateStatus,
} from "./coreTemplateCatalog";
export {
  createCanonicalAssetImportFixtures,
} from "./assetImportFixtures";
export {
  createCatalogCompletionFixture,
} from "./catalogCompletionFixtures";
export {
  CatalogPromotionService,
  CatalogPromotionServiceError,
} from "./catalogPromotionService";
export {
  clonePreparedCatalogPromotion,
  createImportedCatalogTarget,
  prepareCatalogPersistence,
} from "./catalogPersistenceHandoff";
export type { PreparedCatalogPromotion } from "./catalogPersistenceHandoff";
export type * from "./catalogCompletionTypes";
export {
  AssetImportService,
  AssetImportServiceError,
  ImportSession,
} from "./assetImportService";
export {
  DEFAULT_MAXIMUM_ASSET_BYTE_SIZE,
  DEFAULT_MAXIMUM_ASSET_DIMENSION,
  DEFAULT_RECOMMENDED_ASSET_DIMENSION,
  validateAssetImportFile,
} from "./assetImportValidation";
export type { AssetImportValidationLimits } from "./assetImportValidation";
export type * from "./assetImportTypes";
export {
  AssetCatalogRegistry,
  AssetCatalogRegistryError,
} from "./assetCatalogRegistry";
export type { AssetCatalogTagMatch } from "./assetCatalogRegistry";
export type * from "./assetCatalogTypes";
export {
  BaseCompositionLoader,
  BaseCompositionLoaderError,
} from "./baseCompositionLoader";
export type {
  BaseCompositionLoadInput,
  BaseLoaderContext,
  ResolvedBaseFunctionalObject,
  ResolvedBaseScene,
  ResolvedBaseSlot,
  ResolvedBaseSurface,
} from "./baseCompositionLoader";
export {
  BASE_FUNCTIONAL_ZONE_IDS,
  BASE_MAIN_ROOM_TEMPLATE_ID,
  BASE_SLOT_IDS,
  CORE_DEFAULT_BASE_SKIN_ID,
  baseMainRoomTemplate,
} from "./baseTemplate";
export type { BaseSlotName } from "./baseTemplate";
export {
  CompositionResolver,
  CompositionResolverError,
} from "./compositionResolver";
export type {
  BaselineAssignment,
  ResolutionContext,
  ResolutionResult,
  ResolutionSource,
  ResolutionTraceEntry,
} from "./compositionResolver";
export {
  CORE_DEFAULT_BASE_ASSET_ID,
  CORE_DEFAULT_BASE_COMPOSITION_ID,
  CORE_DEFAULT_BASE_PACK_ID,
  CORE_DEFAULT_BASE_THEME_ID,
  coreDefaultBaseAssetRegistration,
  coreDefaultBaseComposition,
  coreDefaultBaseFunctionBindings,
  coreDefaultBaseSkinPack,
  coreDefaultBaseThemeManifest,
} from "./coreDefaultBaseSkin";
export {
  TemplateRegistry,
  TemplateRegistryError,
} from "./templateRegistry";
export type { RegisteredTemplate } from "./templateRegistry";
export {
  ThemeValidationError,
  validateAssetCatalogEntry,
  validateBaseComposition,
  validateCatalogObject,
  validateComposition,
  validateEnvironmentTemplate,
  validateFunctionContainer,
  validateObjectTemplate,
  validatePlacementProfile,
  validateRoomComposition,
  validateRoomPreset,
  validateRoomShell,
  validateSkinPack,
  validateThemeManifest,
  validateVisualAsset,
} from "./validation";
export type {
  ThemeArtifactKind,
  ThemeValidationIssue,
} from "./validation";
export {
  assertVersion,
  compareVersions,
  parseVersion,
  satisfiesVersionRange,
} from "./version";
export type { ParsedVersion } from "./version";
export { cloneAndFreeze, deepClone, deepFreeze } from "./immutable";
export {
  applyInheritedPresentation,
  applyThemeChange,
  resolvePropertyOverride,
} from "./instanceOverrides";
export type { ObjectInstancePresentationValues } from "./instanceOverrides";
export {
  isAttachmentCompatible,
  isRequiredSurfaceContactSatisfied,
  isRotationAllowed,
  isScaleAllowed,
  isSurfaceCompatible,
  validatePlacement,
  violatesClearance,
} from "./placement";
export { mergeRoomPreset } from "./presetMerge";
export type { MergeRoomPresetInput } from "./presetMerge";
export { evaluateSnapCandidates } from "./snapScoring";
export type { SnapEvaluationOptions } from "./snapScoring";
export {
  baseMainRoomCompatibilityProjection,
  cosmosCompatibilityBaseComposition,
  cosmosMainRoomCatalogObjects,
  cosmosMainRoomComposition,
  cosmosMainRoomFunctionContainers,
  cosmosMainRoomPreset,
  cosmosMainRoomShell,
} from "./roomCompositionFixtures";
export {
  compareLegacyBaseToRoomSnapshot,
} from "./roomParity";
export type {
  RoomParityDifference,
  RoomParityResult,
  RoomParityStatus,
} from "./roomParity";
export {
  BaseCompositionRegistry,
  CatalogObjectRegistry,
  FunctionContainerRegistry,
  RoomPresetRegistry,
  RoomRegistryError,
  RoomShellRegistry,
  createRoomCompositionRegistries,
} from "./roomRegistries";
export type {
  RoomCompositionRegistries,
  RoomRegistryKind,
} from "./roomRegistries";
export {
  EMPTY_ROOM_SHELL_ID,
  STANDARD_ROOM_PRESET_ID,
  cosmosMainRoomStandardCompositionFixture,
  cosmosMainRoomStandardPresetFixture,
  emptyRoomShellFixture,
  pinnedUserRoomCompositionFixture,
  registerRoomShadowFixtures,
  roomShadowBaseCompositionFixture,
  roomShadowCatalogObjectsFixture,
  roomShadowSkinResolutionFixture,
} from "./roomShadowFixtures";
export {
  runBaseRoomShadowMode,
  runBaseMainRoomShadowMode,
} from "./roomShadowMode";
export type {
  RoomShadowModeResult,
  RunBaseRoomShadowModeInput,
} from "./roomShadowMode";
export {
  BaseRuntimeRoomShadowProjectionError,
  compareBaseRuntimeRoomShadowProjection,
  projectBaseRoomToRoomCompositionShadow,
  projectBaseMainRoomToRoomCompositionShadow,
} from "./baseRuntimeRoomShadowProjection";
export type {
  BaseRuntimeBaseExitBinding,
  BaseRuntimeCompanionBinding,
  BaseRuntimeMainRoomReference,
  BaseRuntimeMainRoomShadowProjection,
  BaseRuntimeRoomReference,
  BaseRuntimeRoomShadowProjection,
  BaseRuntimeRoomTransitionBinding,
  BaseRuntimeSnapshotReadModel,
  BaseRuntimeShadowBinding,
  BaseRuntimeShadowBindingKind,
  BaseRuntimeWorkspaceBinding,
} from "./baseRuntimeRoomShadowProjection";
export {
  RoomCompositionResolver,
  RoomResolutionError,
} from "./roomSnapshotResolver";
export type {
  AvailableRoomSkin,
  ImmutableRoomSnapshot,
  ResolveRoomSnapshotInput,
  ResolvedRoomFunctionContainer,
  ResolvedRoomObjectInstance,
  ResolvedSkinReference,
  RoomPropertyResolution,
  RoomResolutionScope,
  RoomResolutionSource,
  RoomResolutionTrace,
  RoomResolutionTraceEntry,
  RoomResolvedProperty,
  RoomSkinAssignment,
  RoomSkinResolutionInput,
  RoomSnapshotValidationStatus,
} from "./roomSnapshotResolver";
export type * from "./roomCompositionTypes";
export type * from "./types";
export type * from "./themeBuilderProject";
export { validateThemeBuilderProject } from "./themeBuilderProject";
export {
  RendererMaterialChannelRegistry,
  rendererMaterialChannelRegistry,
} from "./rendererMaterialChannels";
export type {
  RendererMaterialResolution,
  RendererMaterialValidation,
  RendererMaterialUnavailableReason,
  ResolvedRendererMaterialParameter,
  SafeMaterialAssetReference,
} from "./rendererMaterialChannels";
