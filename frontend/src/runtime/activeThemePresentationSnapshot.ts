import {
  CORE_DEFAULT_BASE_SKIN_ID,
  baseMainRoomTemplate,
} from "../theme-engine/baseTemplate";
import {
  CORE_DEFAULT_BASE_ASSET_ID,
  CORE_DEFAULT_BASE_PACK_ID,
  CORE_DEFAULT_BASE_THEME_ID,
  coreDefaultBaseSkinPack,
} from "../theme-engine/coreDefaultBaseSkin";
import { cloneAndFreeze } from "../theme-engine/immutable";
import { TemplateRegistry, type RegisteredTemplate } from "../theme-engine/templateRegistry";
import {
  rendererMaterialChannelRegistry,
  type RendererMaterialUnavailableReason,
  type ResolvedRendererMaterialParameter,
} from "../theme-engine/rendererMaterialChannels";
import type {
  AssetBinding,
  AssetFormat,
  AssetKind,
  AssetMimeType,
  Material,
  PresentationGroup,
  SkinDefinition,
  SkinPack,
  StateVariant,
  TemplateState,
  TokenType,
  VersionedRef,
} from "../theme-engine/types";
import { compareVersions, satisfiesVersionRange } from "../theme-engine/version";
import type {
  AssetCatalogApi,
  PersistedAssetCatalogRecord,
} from "./assetCatalogApi";
import type { ThemeDefinition, ThemeDefinitionProvenance } from "./themeRegistry";
import type { ThemeRuntime } from "./themeRuntime";
import type { ThemePackagePresentationSource } from "./themePackageRegistry";

export type ActiveThemePresentationResolutionStatus =
  | "resolved"
  | "resolved-with-fallbacks"
  | "partial"
  | "unavailable";
export type PresentationReferenceStatus = "resolved" | "unavailable";
export type PresentationAssetLookupStatus =
  | "resolved"
  | "missing"
  | "unavailable"
  | "invalid";
export type PresentationAssetResolutionStatus =
  | "resolved"
  | "fallback"
  | "unavailable"
  | "invalid";

export interface ActiveThemePackageProvenance {
  readonly packageId: string;
  readonly packageVersion: string;
  readonly provenance: string;
  readonly manifestDigest: string;
}

export interface ActiveThemePresentationProvenance {
  readonly theme: ThemeDefinitionProvenance;
  readonly package: Readonly<ActiveThemePackageProvenance> | null;
}

export interface ResolvedPresentationToken {
  readonly tokenId: string;
  readonly declaredTokenId: string | null;
  readonly type: TokenType | "runtime-string";
  readonly value: string;
  readonly source: "active-theme" | "core-fallback";
}

export interface RendererSafeAssetReference {
  readonly assetId: string;
  readonly version: string | null;
  readonly kind: AssetKind;
  readonly format: AssetFormat;
  readonly mimeType: AssetMimeType;
  readonly sha256: string;
  readonly byteSize: number;
  readonly width: number;
  readonly height: number;
  readonly catalogEntryId: string | null;
  readonly catalogEntryVersion: string | null;
}

export interface ResolvedPresentationAsset {
  readonly requestId: string;
  readonly requestedAssetId: string;
  readonly templateId: string;
  readonly slotId: string;
  readonly lookupStatus: PresentationAssetLookupStatus;
  readonly status: PresentationAssetResolutionStatus;
  readonly source: "active-theme" | "core-fallback" | null;
  readonly usedCoreFallback: boolean;
  readonly reference: Readonly<RendererSafeAssetReference> | null;
}

export interface ResolvedPresentationBinding {
  readonly bindingId: string;
  readonly templateId: string;
  readonly templateVersion: string;
  readonly slotId: string;
  readonly fit: "contain" | "cover" | "fill" | "none";
  readonly alignment:
    | "center"
    | "top"
    | "right"
    | "bottom"
    | "left"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
  readonly opacity: number;
  readonly tint: string | null;
  readonly states: readonly string[];
  readonly assetRequestId: string;
}

export interface ResolvedPresentationState {
  readonly stateId: string;
  readonly resolvedStateId: string | null;
  readonly source: "state-variant" | "state-fallback" | "base-binding";
  readonly assetBindingIds: readonly string[];
}

export interface ResolvedPresentationSkin {
  readonly packId: string;
  readonly packVersion: string;
  readonly skinId: string;
  readonly skinVersion: string;
  readonly source: "active-theme" | "core-fallback";
  readonly status: PresentationReferenceStatus;
  readonly presentationGroup: PresentationGroup;
  readonly templateId: string | null;
  readonly templateVersion: string | null;
  readonly bindings: readonly Readonly<ResolvedPresentationBinding>[];
  readonly states: readonly Readonly<ResolvedPresentationState>[];
}

export interface ResolvedPresentationMaterial {
  readonly skinId: string;
  readonly templateId: string | null;
  readonly channelId: string;
  readonly status: "resolved" | "unavailable";
  readonly parameters: readonly Readonly<ResolvedRendererMaterialParameter>[];
  readonly reason: RendererMaterialUnavailableReason | null;
}

export type ActiveThemePresentationDiagnosticCode =
  | "theme-inactive"
  | "asset-catalog-unavailable"
  | "pack-unavailable"
  | "skin-template-unavailable"
  | "skin-slot-invalid"
  | "asset-missing"
  | "asset-unavailable"
  | "asset-invalid"
  | "asset-core-fallback"
  | "material-runtime-unavailable";

export interface ActiveThemePresentationDiagnostic {
  readonly code: ActiveThemePresentationDiagnosticCode;
  readonly subjectId: string;
  readonly message: string;
}

export interface ActiveThemePresentationTraceEntry {
  readonly kind: "theme" | "pack" | "skin" | "asset" | "material";
  readonly requestedId: string;
  readonly resolvedId: string | null;
  readonly source: "active-theme" | "core-fallback" | null;
  readonly status: string;
}

export interface ActiveThemePresentationSnapshot {
  readonly activeThemeId: string | null;
  readonly themeVersion: string | null;
  readonly provenance: Readonly<ActiveThemePresentationProvenance> | null;
  readonly resolutionStatus: ActiveThemePresentationResolutionStatus;
  readonly tokens: readonly Readonly<ResolvedPresentationToken>[];
  readonly skins: readonly Readonly<ResolvedPresentationSkin>[];
  readonly materials: readonly Readonly<ResolvedPresentationMaterial>[];
  readonly assets: readonly Readonly<ResolvedPresentationAsset>[];
  readonly coreFallback: Readonly<{
    runtimeThemeId: string;
    presentationThemeId: string;
    packId: string;
    skinId: string;
    assetId: string;
  }>;
  readonly diagnostics: readonly Readonly<ActiveThemePresentationDiagnostic>[];
  readonly trace: readonly Readonly<ActiveThemePresentationTraceEntry>[];
}

export interface ResolveActiveThemePresentationInput {
  readonly themeRuntime: Pick<ThemeRuntime, "active" | "readSnapshot">;
  readonly assetCatalogRecords: readonly Readonly<PersistedAssetCatalogRecord>[];
  readonly assetCatalogStatus?: "available" | "unavailable";
  readonly skinPacks?: readonly Readonly<SkinPack>[];
  readonly templateRegistry?: TemplateRegistry;
}

export interface LoadActiveThemePresentationInput
  extends Omit<ResolveActiveThemePresentationInput, "assetCatalogRecords" | "assetCatalogStatus"> {
  readonly assetCatalog: Pick<AssetCatalogApi, "list">;
  readonly skinPackSource?: Pick<ThemePackagePresentationSource, "readPresentationSkinPacks">;
}

interface SkinContext {
  readonly pack: Readonly<SkinPack>;
  readonly skin: Readonly<SkinDefinition>;
  readonly source: "active-theme" | "core-fallback";
  readonly template: RegisteredTemplate | null;
}

interface MutableResolution {
  diagnostics: ActiveThemePresentationDiagnostic[];
  trace: ActiveThemePresentationTraceEntry[];
  usedFallback: boolean;
  partial: boolean;
}

const coreTemplateRegistry = new TemplateRegistry();
coreTemplateRegistry.register(baseMainRoomTemplate);

/**
 * Read boundary: catalog metadata is loaded before the pure snapshot projection.
 * It performs no activation, persistence or presentation writes.
 */
export async function loadActiveThemePresentationSnapshot(
  input: Readonly<LoadActiveThemePresentationInput>,
): Promise<Readonly<ActiveThemePresentationSnapshot>> {
  const result = await input.assetCatalog.list();
  const activeThemeId = input.themeRuntime.readSnapshot().activeThemeId;
  const installedSkinPacks = activeThemeId
    ? input.skinPackSource?.readPresentationSkinPacks(activeThemeId) ?? []
    : [];
  return resolveActiveThemePresentationSnapshot({
    themeRuntime: input.themeRuntime,
    skinPacks: mergeSkinPacks(input.skinPacks ?? [], installedSkinPacks),
    templateRegistry: input.templateRegistry,
    assetCatalogRecords: result.ok ? result.data : [],
    assetCatalogStatus: result.ok ? "available" : "unavailable",
  });
}

function mergeSkinPacks(
  first: readonly Readonly<SkinPack>[],
  second: readonly Readonly<SkinPack>[],
): readonly Readonly<SkinPack>[] {
  const values = new Map<string, Readonly<SkinPack>>();
  for (const skinPack of [...first, ...second]) {
    values.set(`${skinPack.packId}@${skinPack.version}`, skinPack);
  }
  return [...values.values()].sort(
    (left, right) =>
      left.packId.localeCompare(right.packId) || compareVersions(left.version, right.version),
  );
}

/** Pure, deterministic projection over already loaded and validated Runtime data. */
export function resolveActiveThemePresentationSnapshot(
  input: Readonly<ResolveActiveThemePresentationInput>,
): Readonly<ActiveThemePresentationSnapshot> {
  const runtimeSnapshot = input.themeRuntime.readSnapshot();
  const definition = input.themeRuntime.active;
  const state: MutableResolution = {
    diagnostics: [],
    trace: [],
    usedFallback: false,
    partial: false,
  };
  const coreFallback = {
    runtimeThemeId: runtimeSnapshot.fallbackThemeId,
    presentationThemeId: CORE_DEFAULT_BASE_THEME_ID,
    packId: CORE_DEFAULT_BASE_PACK_ID,
    skinId: CORE_DEFAULT_BASE_SKIN_ID,
    assetId: CORE_DEFAULT_BASE_ASSET_ID,
  } as const;

  if (!definition || definition.objectId !== runtimeSnapshot.activeThemeId) {
    state.diagnostics.push({
      code: "theme-inactive",
      subjectId: runtimeSnapshot.activeThemeId ?? "theme-runtime",
      message: "Theme Runtime has no active registered Theme to project.",
    });
    return cloneAndFreeze({
      activeThemeId: runtimeSnapshot.activeThemeId,
      themeVersion: null,
      provenance: null,
      resolutionStatus: "unavailable" as const,
      tokens: [],
      skins: [],
      materials: [],
      assets: [],
      coreFallback,
      diagnostics: state.diagnostics,
      trace: [],
    });
  }

  state.trace.push(trace("theme", definition.objectId, definition.objectId, "active-theme", "resolved"));
  if (input.assetCatalogStatus === "unavailable") {
    state.diagnostics.push({
      code: "asset-catalog-unavailable",
      subjectId: definition.objectId,
      message: "Validated Asset Catalog metadata is unavailable for this resolution pass.",
    });
  }

  const templateRegistry = input.templateRegistry ?? coreTemplateRegistry;
  const skinContexts = resolveSkinContexts(definition, input.skinPacks ?? [], templateRegistry, state);
  if (
    definition.objectId !== runtimeSnapshot.fallbackThemeId &&
    !skinContexts.some((context) => context.source === "active-theme")
  ) {
    state.usedFallback = true;
  }
  const assets = resolveAssets(
    definition,
    skinContexts,
    input.assetCatalogRecords,
    input.assetCatalogStatus ?? "available",
    state,
  );
  const skins = skinContexts.map((context) => projectSkin(context, assets, state));
  const materials = skinContexts.flatMap((context) => projectMaterials(context, assets, state));
  const provenance = projectProvenance(definition);
  const tokens = projectTokens(definition, runtimeSnapshot.fallbackThemeId);

  state.diagnostics.sort(compareDiagnostic);
  state.trace.sort(compareTrace);
  const resolutionStatus: ActiveThemePresentationResolutionStatus = state.partial
    ? "partial"
    : state.usedFallback
      ? "resolved-with-fallbacks"
      : "resolved";

  return cloneAndFreeze({
    activeThemeId: definition.objectId,
    themeVersion: definition.version,
    provenance,
    resolutionStatus,
    tokens,
    skins,
    materials,
    assets,
    coreFallback,
    diagnostics: state.diagnostics,
    trace: state.trace,
  });
}

function projectProvenance(
  definition: Readonly<ThemeDefinition>,
): ActiveThemePresentationProvenance {
  const theme = definition.provenance;
  return {
    theme,
    package:
      theme.kind === "theme-package"
        ? {
            packageId: theme.packageId,
            packageVersion: theme.packageVersion,
            provenance: theme.provenance,
            manifestDigest: theme.manifestDigest,
          }
        : null,
  };
}

function projectTokens(
  definition: Readonly<ThemeDefinition>,
  fallbackThemeId: string,
): ResolvedPresentationToken[] {
  const declared = new Map(
    Object.entries(definition.manifest?.tokens ?? {}).map(([tokenId, token]) => [
      toRuntimeTokenId(tokenId),
      { tokenId, token },
    ] as const),
  );
  return Object.entries(definition.tokens)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([tokenId, value]) => {
      const declaration = declared.get(tokenId);
      return {
        tokenId,
        declaredTokenId: declaration?.tokenId ?? null,
        type: declaration?.token.type ?? "runtime-string",
        value,
        source:
          definition.objectId === fallbackThemeId || !declaration
            ? "core-fallback"
            : "active-theme",
      };
    });
}

function resolveSkinContexts(
  definition: Readonly<ThemeDefinition>,
  availablePacks: readonly Readonly<SkinPack>[],
  templates: TemplateRegistry,
  state: MutableResolution,
): SkinContext[] {
  const activePacks: Readonly<SkinPack>[] = [];
  for (const reference of [...(definition.manifest?.packRefs ?? [])].sort(compareRef)) {
    const pack = availablePacks
      .filter(
        (candidate) =>
          candidate.packId === reference.id &&
          satisfiesVersionRange(candidate.version, reference.versionRange),
      )
      .sort((left, right) => compareVersions(right.version, left.version))[0];
    if (!pack) {
      state.diagnostics.push({
        code: "pack-unavailable",
        subjectId: reference.id,
        message: `Referenced presentation pack ${reference.id} is not loaded.`,
      });
      state.trace.push(trace("pack", reference.id, null, null, "unavailable"));
      state.partial = true;
      continue;
    }
    activePacks.push(pack);
    state.trace.push(trace("pack", reference.id, pack.packId, "active-theme", "resolved"));
  }

  const contexts: SkinContext[] = [];
  for (const entry of [
    ...activePacks.map((pack) => ({ pack, source: "active-theme" as const })),
    { pack: coreDefaultBaseSkinPack, source: "core-fallback" as const },
  ]) {
    for (const skin of [...entry.pack.skins].sort((left, right) => left.skinId.localeCompare(right.skinId))) {
      let template: RegisteredTemplate | null = null;
      if (skin.target.templateRef) {
        try {
          template = templates.resolveRef(skin.target.templateRef);
        } catch {
          state.diagnostics.push({
            code: "skin-template-unavailable",
            subjectId: skin.skinId,
            message: `Target template ${skin.target.templateRef.id} is not registered.`,
          });
          state.trace.push(trace("skin", skin.skinId, null, entry.source, "unavailable"));
          state.partial = true;
        }
      }
      if (template || !skin.target.templateRef) {
        state.trace.push(trace("skin", skin.skinId, skin.skinId, entry.source, "resolved"));
      }
      contexts.push({ pack: entry.pack, skin, source: entry.source, template });
    }
  }
  return contexts.sort(
    (left, right) =>
      sourceOrder(left.source) - sourceOrder(right.source) ||
      left.skin.skinId.localeCompare(right.skin.skinId),
  );
}

function resolveAssets(
  definition: Readonly<ThemeDefinition>,
  contexts: readonly SkinContext[],
  catalogRecords: readonly Readonly<PersistedAssetCatalogRecord>[],
  catalogStatus: "available" | "unavailable",
  state: MutableResolution,
): ResolvedPresentationAsset[] {
  const records = [...catalogRecords].sort(
    (left, right) =>
      left.visualAsset.id.localeCompare(right.visualAsset.id) ||
      compareVersions(right.visualAsset.version, left.visualAsset.version),
  );
  const coreAssets = new Map<string, Readonly<(typeof coreDefaultBaseSkinPack.assets)[number]>>(
    coreDefaultBaseSkinPack.assets.map((asset) => [asset.assetId, asset] as const),
  );
  const coreBindings = coreDefaultBaseSkinPack.skins.flatMap((skin) =>
    skin.assetBindings.map((binding) => ({ skin, binding })),
  );
  const output: ResolvedPresentationAsset[] = [];

  for (const context of contexts) {
    for (const binding of [...context.skin.assetBindings].sort((left, right) => left.bindingId.localeCompare(right.bindingId))) {
      const templateId = context.skin.target.templateRef?.id ?? "unscoped";
      const requestId = `${context.skin.skinId}:${binding.bindingId}`;
      const slot = context.template?.assetSlots?.find((candidate) => candidate.slotId === binding.slotId);
      if (context.template && !slot) {
        state.diagnostics.push({
          code: "skin-slot-invalid",
          subjectId: binding.bindingId,
          message: `Skin binding targets unknown slot ${binding.slotId}.`,
        });
        state.partial = true;
        output.push({
          requestId,
          requestedAssetId: binding.assetId,
          templateId,
          slotId: binding.slotId,
          lookupStatus: "invalid",
          status: "invalid",
          source: null,
          usedCoreFallback: false,
          reference: null,
        });
        continue;
      }

      if (context.source === "core-fallback") {
        const coreAsset = coreAssets.get(binding.assetId);
        output.push({
          requestId,
          requestedAssetId: binding.assetId,
          templateId,
          slotId: binding.slotId,
          lookupStatus: coreAsset ? "resolved" : "invalid",
          status: coreAsset ? "resolved" : "invalid",
          source: coreAsset ? "core-fallback" : null,
          usedCoreFallback: true,
          reference: coreAsset ? safeCoreAsset(coreAsset) : null,
        });
        if (!coreAsset) state.partial = true;
        continue;
      }

      const candidates = records.filter((record) => record.visualAsset.id === binding.assetId);
      const record = candidates[0];
      const lookupStatus = lookupCatalogAsset(record, definition.objectId, catalogStatus);
      const fallbackBinding = coreBindings.find(
        (candidate) =>
          candidate.binding.slotId === binding.slotId &&
          sameTemplate(candidate.skin.target.templateRef, context.skin.target.templateRef),
      );
      const fallbackAllowed = Boolean(slot && slot.fallbackPolicy !== "none" && fallbackBinding);

      if (lookupStatus === "resolved" && record) {
        output.push({
          requestId,
          requestedAssetId: binding.assetId,
          templateId,
          slotId: binding.slotId,
          lookupStatus,
          status: "resolved",
          source: "active-theme",
          usedCoreFallback: false,
          reference: safeCatalogAsset(record),
        });
        state.trace.push(trace("asset", binding.assetId, binding.assetId, "active-theme", "resolved"));
        continue;
      }

      if (fallbackAllowed && fallbackBinding) {
        const fallbackAsset = coreAssets.get(fallbackBinding.binding.assetId);
        if (fallbackAsset) {
          state.usedFallback = true;
          state.diagnostics.push({
            code: "asset-core-fallback",
            subjectId: binding.assetId,
            message: `Asset ${binding.assetId} resolved through the declared Core slot fallback.`,
          });
          output.push({
            requestId,
            requestedAssetId: binding.assetId,
            templateId,
            slotId: binding.slotId,
            lookupStatus,
            status: "fallback",
            source: "core-fallback",
            usedCoreFallback: true,
            reference: safeCoreAsset(fallbackAsset),
          });
          state.trace.push(trace("asset", binding.assetId, fallbackAsset.assetId, "core-fallback", lookupStatus));
          addAssetDiagnostic(binding.assetId, lookupStatus, state);
          continue;
        }
      }

      state.partial = true;
      output.push({
        requestId,
        requestedAssetId: binding.assetId,
        templateId,
        slotId: binding.slotId,
        lookupStatus,
        status: lookupStatus === "invalid" ? "invalid" : "unavailable",
        source: null,
        usedCoreFallback: false,
        reference: null,
      });
      state.trace.push(trace("asset", binding.assetId, null, null, lookupStatus));
      addAssetDiagnostic(binding.assetId, lookupStatus, state);
    }
    for (const material of context.skin.materials) {
      for (const assetId of rendererMaterialChannelRegistry.referencedAssetIds(material)) {
        if (output.some((asset) => asset.reference?.assetId === assetId)) continue;
        const requestId = `${context.skin.skinId}:material:${material.channelId}:${assetId}`;
        const record = records.find((candidate) => candidate.visualAsset.id === assetId);
        const lookupStatus = lookupCatalogAsset(record, definition.objectId, catalogStatus);
        const resolved = lookupStatus === "resolved" && record;
        output.push({
          requestId,
          requestedAssetId: assetId,
          templateId: context.skin.target.templateRef?.id ?? "unscoped",
          slotId: `material:${material.channelId}`,
          lookupStatus,
          status: resolved ? "resolved" : lookupStatus === "invalid" ? "invalid" : "unavailable",
          source: resolved ? context.source : null,
          usedCoreFallback: false,
          reference: resolved ? safeCatalogAsset(record) : null,
        });
        state.trace.push(
          trace("asset", assetId, resolved ? assetId : null, resolved ? context.source : null, lookupStatus),
        );
        if (!resolved) addAssetDiagnostic(assetId, lookupStatus, state);
      }
    }
  }
  return output.sort((left, right) => left.requestId.localeCompare(right.requestId));
}

function projectSkin(
  context: SkinContext,
  assets: readonly ResolvedPresentationAsset[],
  state: MutableResolution,
): ResolvedPresentationSkin {
  const templateId = context.skin.target.templateRef?.id ?? null;
  const bindings = context.skin.assetBindings
    .map((binding) => projectBinding(context, binding))
    .sort((left, right) => left.bindingId.localeCompare(right.bindingId));
  const states = context.template
    ? context.template.states
        .map((templateState) => resolveState(templateState, context.template?.states ?? [], context.skin.stateVariants, context.skin.assetBindings))
        .sort((left, right) => left.stateId.localeCompare(right.stateId))
    : [];
  const unavailable = Boolean(context.skin.target.templateRef && !context.template);
  if (unavailable) state.partial = true;
  const hasInvalidAsset = assets.some(
    (asset) =>
      asset.requestId.startsWith(`${context.skin.skinId}:`) && asset.status === "invalid",
  );
  return {
    packId: context.pack.packId,
    packVersion: context.pack.version,
    skinId: context.skin.skinId,
    skinVersion: context.skin.version,
    source: context.source,
    status: unavailable || hasInvalidAsset ? "unavailable" : "resolved",
    presentationGroup: context.skin.target.presentationGroup,
    templateId,
    templateVersion: context.template?.version ?? null,
    bindings,
    states,
  };
}

function projectBinding(context: SkinContext, binding: Readonly<AssetBinding>): ResolvedPresentationBinding {
  return {
    bindingId: binding.bindingId,
    templateId: context.skin.target.templateRef?.id ?? "unscoped",
    templateVersion: context.template?.version ?? "unavailable",
    slotId: binding.slotId,
    fit: binding.fit ?? "contain",
    alignment: binding.alignment ?? "center",
    opacity: binding.opacity ?? 1,
    tint: binding.tint ?? null,
    states: Object.freeze([...(binding.states ?? [])].sort()),
    assetRequestId: `${context.skin.skinId}:${binding.bindingId}`,
  };
}

function resolveState(
  requested: Readonly<TemplateState>,
  templateStates: readonly Readonly<TemplateState>[],
  variants: readonly Readonly<StateVariant>[],
  baseBindings: readonly Readonly<AssetBinding>[],
): ResolvedPresentationState {
  const direct = variants.find((variant) => variant.stateId === requested.stateId);
  if (direct) return stateResult(requested.stateId, direct, "state-variant", baseBindings);

  const seen = new Set<string>([requested.stateId]);
  let fallbackId = requested.fallbackStateId;
  while (!seen.has(fallbackId)) {
    seen.add(fallbackId);
    const variant = variants.find((candidate) => candidate.stateId === fallbackId);
    if (variant) return stateResult(requested.stateId, variant, "state-fallback", baseBindings);
    const templateState = templateStates.find((candidate) => candidate.stateId === fallbackId);
    if (!templateState || templateState.fallbackStateId === fallbackId) break;
    fallbackId = templateState.fallbackStateId;
  }
  return {
    stateId: requested.stateId,
    resolvedStateId: null,
    source: "base-binding",
    assetBindingIds: baseBindings.map((binding) => binding.bindingId).sort(),
  };
}

function stateResult(
  requestedStateId: string,
  variant: Readonly<StateVariant>,
  source: "state-variant" | "state-fallback",
  baseBindings: readonly Readonly<AssetBinding>[],
): ResolvedPresentationState {
  return {
    stateId: requestedStateId,
    resolvedStateId: variant.stateId,
    source,
    assetBindingIds: [...(variant.assetBindingIds ?? baseBindings.map((binding) => binding.bindingId))].sort(),
  };
}

function projectMaterials(
  context: SkinContext,
  assets: readonly ResolvedPresentationAsset[],
  state: MutableResolution,
): ResolvedPresentationMaterial[] {
  return [...context.skin.materials]
    .sort((left, right) => left.channelId.localeCompare(right.channelId))
    .map((material: Readonly<Material>) => {
      const resolution = rendererMaterialChannelRegistry.resolve(material, (assetId) =>
        assets.find(
          (asset) =>
            asset.reference?.assetId === assetId &&
            (asset.status === "resolved" || asset.status === "fallback"),
        )?.reference ?? null,
      );
      if (resolution.status === "unavailable") {
        state.partial = true;
        state.diagnostics.push({
          code: "material-runtime-unavailable",
          subjectId: `${context.skin.skinId}:${material.channelId}`,
          message: `Material channel ${material.channelId} is unavailable: ${resolution.reason}.`,
        });
      }
      state.trace.push(
        trace(
          "material",
          material.channelId,
          resolution.status === "resolved" ? material.channelId : null,
          context.source,
          resolution.status,
        ),
      );
      return {
        skinId: context.skin.skinId,
        templateId: context.skin.target.templateRef?.id ?? null,
        channelId: material.channelId,
        status: resolution.status,
        parameters: resolution.parameters,
        reason: resolution.reason,
      };
    });
}

function lookupCatalogAsset(
  record: Readonly<PersistedAssetCatalogRecord> | undefined,
  activeThemeId: string,
  catalogStatus: "available" | "unavailable",
): PresentationAssetLookupStatus {
  if (!record) return catalogStatus === "available" ? "missing" : "unavailable";
  const { catalogEntry, visualAsset } = record;
  if (
    catalogEntry.visualAssetRef.id !== visualAsset.id ||
    catalogEntry.visualAssetRef.version !== visualAsset.version ||
    catalogEntry.deprecated ||
    (catalogEntry.scope === "theme" && catalogEntry.theme !== activeThemeId)
  ) {
    return "invalid";
  }
  return record.resourceAvailable ? "resolved" : "unavailable";
}

function safeCatalogAsset(record: Readonly<PersistedAssetCatalogRecord>): RendererSafeAssetReference {
  const asset = record.visualAsset;
  return {
    assetId: asset.id,
    version: asset.version,
    kind: asset.kind,
    format: asset.format,
    mimeType: asset.mimeType,
    sha256: asset.sha256,
    byteSize: asset.byteSize,
    width: asset.width,
    height: asset.height,
    catalogEntryId: record.catalogEntry.id,
    catalogEntryVersion: record.catalogEntry.version,
  };
}

function safeCoreAsset(
  asset: Readonly<(typeof coreDefaultBaseSkinPack.assets)[number]>,
): RendererSafeAssetReference {
  return {
    assetId: asset.assetId,
    version: null,
    kind: asset.kind,
    format: asset.format,
    mimeType: asset.mimeType,
    sha256: asset.sha256,
    byteSize: asset.byteSize,
    width: asset.width,
    height: asset.height,
    catalogEntryId: null,
    catalogEntryVersion: null,
  };
}

function addAssetDiagnostic(
  assetId: string,
  status: PresentationAssetLookupStatus,
  state: MutableResolution,
): void {
  const code =
    status === "missing"
      ? "asset-missing"
      : status === "invalid"
        ? "asset-invalid"
        : "asset-unavailable";
  state.diagnostics.push({
    code,
    subjectId: assetId,
    message: `Theme asset ${assetId} is ${status}.`,
  });
}

function sameTemplate(left: VersionedRef | undefined, right: VersionedRef | undefined): boolean {
  return Boolean(left && right && left.id === right.id);
}

function trace(
  kind: ActiveThemePresentationTraceEntry["kind"],
  requestedId: string,
  resolvedId: string | null,
  source: ActiveThemePresentationTraceEntry["source"],
  status: string,
): ActiveThemePresentationTraceEntry {
  return { kind, requestedId, resolvedId, source, status };
}

function compareRef(left: VersionedRef, right: VersionedRef): number {
  return left.id.localeCompare(right.id) || left.versionRange.localeCompare(right.versionRange);
}

function sourceOrder(source: "active-theme" | "core-fallback"): number {
  return source === "active-theme" ? 0 : 1;
}

function compareDiagnostic(
  left: ActiveThemePresentationDiagnostic,
  right: ActiveThemePresentationDiagnostic,
): number {
  return left.code.localeCompare(right.code) || left.subjectId.localeCompare(right.subjectId);
}

function compareTrace(
  left: ActiveThemePresentationTraceEntry,
  right: ActiveThemePresentationTraceEntry,
): number {
  return (
    left.kind.localeCompare(right.kind) ||
    left.requestedId.localeCompare(right.requestedId) ||
    (left.resolvedId ?? "").localeCompare(right.resolvedId ?? "")
  );
}

function toRuntimeTokenId(tokenId: string): string {
  return `--${tokenId.replace(/[._]/g, "-")}`;
}
