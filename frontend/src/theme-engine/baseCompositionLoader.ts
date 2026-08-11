import {
  AssetRegistry,
  type RegisteredAsset,
} from "./assetRegistry";
import {
  BASE_FUNCTIONAL_ZONE_IDS,
  BASE_MAIN_ROOM_TEMPLATE_ID,
  BASE_SLOT_IDS,
  CORE_DEFAULT_BASE_SKIN_ID,
} from "./baseTemplate";
import {
  CompositionResolver,
  type BaselineAssignment,
  type ResolutionContext,
  type ResolutionResult,
} from "./compositionResolver";
import { TemplateRegistry } from "./templateRegistry";
import type {
  Anchor,
  AssetBinding,
  BoundsShape,
  Composition,
  EnvironmentScene,
  EnvironmentSurface,
  EnvironmentTemplate,
  FunctionalObjectScenePayload,
  FunctionalZone,
  OverrideValue,
  RuntimeFunctionBinding,
  SceneNode,
  SkinDefinition,
  SkinPack,
  SymbolId,
  VersionedRef,
} from "./types";
import {
  validateComposition,
  validateSkinPack,
} from "./validation";
import { compareVersions, satisfiesVersionRange } from "./version";

export interface BaseLoaderContext extends ResolutionContext {
  roomId?: string;
}

export interface BaseCompositionLoadInput {
  composition: unknown;
  parentCompositions?: readonly unknown[];
  skinPacks: readonly unknown[];
  assetContents?: Readonly<Record<string, string | Uint8Array>>;
  functionBindings: readonly RuntimeFunctionBinding[];
  context: BaseLoaderContext;
  templateRef?: VersionedRef;
  activeThemeSkinRef?: VersionedRef;
  coreDefaultSkinRef?: VersionedRef;
}

export interface ResolvedBaseSlot {
  slotId: string;
  binding: Readonly<AssetBinding>;
  asset: RegisteredAsset;
  skinId: string;
  usedSkinFallback: boolean;
  usedAssetFallback: boolean;
}

export interface ResolvedBaseSurface {
  surface: Readonly<EnvironmentSurface>;
  slot: ResolvedBaseSlot;
}

export interface ResolvedBaseFunctionalObject {
  nodeId: string;
  functionalZone: Readonly<FunctionalZone>;
  visualBounds: BoundsShape;
  interactionBounds: BoundsShape;
  layoutBounds: BoundsShape;
  effectBounds: BoundsShape;
  labelBounds?: BoundsShape;
  anchor: Readonly<Anchor>;
  layerBand: SymbolId;
  localOrder: number;
  states: readonly SymbolId[];
  assetSlot?: ResolvedBaseSlot;
  functionBinding: Readonly<RuntimeFunctionBinding>;
}

export interface ResolvedBaseScene {
  template: Readonly<EnvironmentTemplate>;
  composition: Readonly<Composition>;
  scene: Readonly<EnvironmentScene>;
  skin: Readonly<SkinDefinition>;
  surfaces: readonly ResolvedBaseSurface[];
  functionalObjects: readonly ResolvedBaseFunctionalObject[];
  resolution: ResolutionResult;
}

export class BaseCompositionLoaderError extends Error {
  constructor(
    readonly code:
      | "base_template_invalid"
      | "base_skin_missing"
      | "base_skin_incompatible"
      | "base_scene_missing"
      | "base_scene_cycle"
      | "base_required_slot_missing"
      | "base_function_binding_missing"
      | "base_function_binding_invalid"
      | "base_required_object_missing"
      | "base_bounds_invalid"
      | "base_anchor_missing",
    message: string,
  ) {
    super(message);
    this.name = "BaseCompositionLoaderError";
  }
}

const functionalSlotByZone: Readonly<Record<string, string | undefined>> = {
  [BASE_FUNCTIONAL_ZONE_IDS.leftDoor]: BASE_SLOT_IDS.leftDoor,
  [BASE_FUNCTIONAL_ZONE_IDS.rightDoor]: BASE_SLOT_IDS.rightDoor,
  [BASE_FUNCTIONAL_ZONE_IDS.leftWorkspace]: BASE_SLOT_IDS.leftWorkspace,
  [BASE_FUNCTIONAL_ZONE_IDS.rightWorkspace]: BASE_SLOT_IDS.rightWorkspace,
  [BASE_FUNCTIONAL_ZONE_IDS.companion]: BASE_SLOT_IDS.companion,
  [BASE_FUNCTIONAL_ZONE_IDS.baseExit]: undefined,
};

export class BaseCompositionLoader {
  constructor(
    private readonly templateRegistry: TemplateRegistry,
    private readonly assetRegistry: AssetRegistry,
  ) {}

  async load(input: BaseCompositionLoadInput): Promise<ResolvedBaseScene> {
    const composition = validateComposition(input.composition);
    const parentCompositions = (input.parentCompositions ?? []).map((value) =>
      validateComposition(value),
    );
    const skinPacks = input.skinPacks.map((value) => validateSkinPack(value));

    await this.loadAssets(skinPacks, input.assetContents ?? {});

    const template = this.templateRegistry.resolveRef(
      input.templateRef ?? {
        id: BASE_MAIN_ROOM_TEMPLATE_ID,
        versionRange: "^1.0.0",
      },
    );
    if (template.templateKind !== "environment" || template.environmentKind !== "base-interior") {
      throw new BaseCompositionLoaderError(
        "base_template_invalid",
        `Template ${template.templateId}@${template.version} is not a Base environment.`,
      );
    }

    const coreDefaultRef = input.coreDefaultSkinRef ?? {
      id: CORE_DEFAULT_BASE_SKIN_ID,
      versionRange: "^1.0.0",
    };
    const coreDefaultSkin = resolveSkin(skinPacks, coreDefaultRef);
    ensureSkinCompatibility(coreDefaultSkin, template);

    const activeTheme: BaselineAssignment[] = input.activeThemeSkinRef
      ? [
          {
            assignmentId: "runtime.active-theme.base",
            target: { presentationGroup: "base-interior" },
            value: { kind: "skin-ref", ref: input.activeThemeSkinRef },
          },
        ]
      : [];
    const coreDefault: BaselineAssignment[] = [
      {
        assignmentId: "runtime.core-default.base",
        target: { presentationGroup: "base-interior" },
        value: { kind: "skin-ref", ref: coreDefaultRef },
      },
    ];
    const resolver = new CompositionResolver(
      [composition, ...parentCompositions],
      activeTheme,
      coreDefault,
    );
    const resolution = resolver.resolve(
      { id: composition.compositionId, versionRange: composition.version },
      { presentationGroup: "base-interior" },
      input.context,
      (value) => isCompatibleSkinValue(value, skinPacks, template),
    );
    if (resolution.value.kind !== "skin-ref") {
      throw new BaseCompositionLoaderError(
        "base_skin_incompatible",
        `Base presentation resolved unsupported value ${resolution.value.kind}.`,
      );
    }
    const selectedSkin = resolveSkin(skinPacks, resolution.value.ref);
    ensureSkinCompatibility(selectedSkin, template);

    const slots = resolveSlots(template, selectedSkin, coreDefaultSkin, this.assetRegistry);
    const scene = selectScene(composition, template, input.context);
    validateSceneTree(scene.nodes);
    const functionBindings = validateFunctionBindings(input.functionBindings);
    const functionalObjects = resolveFunctionalObjects(
      template,
      scene,
      slots,
      functionBindings,
    );

    return Object.freeze({
      template,
      composition,
      scene,
      skin: selectedSkin,
      surfaces: Object.freeze(
        template.surfaces.map((surface) =>
          Object.freeze({
            surface,
            slot: requireResolvedSlot(slots, surface.assetSlotId),
          }),
        ),
      ),
      functionalObjects: Object.freeze(functionalObjects),
      resolution,
    });
  }

  private async loadAssets(
    packs: readonly SkinPack[],
    contents: Readonly<Record<string, string | Uint8Array>>,
  ): Promise<void> {
    for (const pack of packs) {
      const unloaded = pack.assets.filter(
        (asset) => !this.assetRegistry.assertCompatibleDeclaration(asset),
      );
      if (unloaded.length === 0) continue;
      const partialPack: SkinPack = { ...pack, assets: unloaded };
      await this.assetRegistry.registerPack(partialPack, contents);
    }
  }
}

function resolveSlots(
  template: EnvironmentTemplate,
  selectedSkin: SkinDefinition,
  coreDefaultSkin: SkinDefinition,
  registry: AssetRegistry,
): ReadonlyMap<string, ResolvedBaseSlot> {
  const result = new Map<string, ResolvedBaseSlot>();
  for (const slot of template.assetSlots ?? []) {
    const selectedBinding = selectedSkin.assetBindings.find((binding) => binding.slotId === slot.slotId);
    const fallbackBinding = coreDefaultSkin.assetBindings.find(
      (binding) => binding.slotId === slot.slotId,
    );
    let resolved:
      | {
          binding: AssetBinding;
          asset: ReturnType<AssetRegistry["resolve"]>;
          skinId: string;
          usedSkinFallback: boolean;
        }
      | undefined;

    if (selectedBinding) {
      const asset = registry.resolve(selectedBinding.assetId);
      if (
        slot.acceptedKinds.includes(asset.asset.metadata.kind) &&
        slot.acceptedFormats.includes(asset.asset.metadata.format)
      ) {
        resolved = {
          binding: selectedBinding,
          asset,
          skinId: selectedSkin.skinId,
          usedSkinFallback: false,
        };
      }
    }
    if (!resolved && fallbackBinding) {
      const asset = registry.resolve(fallbackBinding.assetId);
      if (
        slot.acceptedKinds.includes(asset.asset.metadata.kind) &&
        slot.acceptedFormats.includes(asset.asset.metadata.format)
      ) {
        resolved = {
          binding: fallbackBinding,
          asset,
          skinId: coreDefaultSkin.skinId,
          usedSkinFallback: true,
        };
      }
    }

    if (!resolved) {
      if (slot.required) {
        throw new BaseCompositionLoaderError(
          "base_required_slot_missing",
          `Required Base slot ${slot.slotId} has no compatible selected or Core Default binding.`,
        );
      }
      continue;
    }
    result.set(
      slot.slotId,
      Object.freeze({
        slotId: slot.slotId,
        binding: resolved.binding,
        asset: resolved.asset.asset,
        skinId: resolved.skinId,
        usedSkinFallback: resolved.usedSkinFallback,
        usedAssetFallback: resolved.asset.usedFallback,
      }),
    );
  }
  return result;
}

function resolveFunctionalObjects(
  template: EnvironmentTemplate,
  scene: EnvironmentScene,
  slots: ReadonlyMap<string, ResolvedBaseSlot>,
  functionBindings: ReadonlyMap<string, Readonly<RuntimeFunctionBinding>>,
): readonly ResolvedBaseFunctionalObject[] {
  const nodesByZone = new Map<string, SceneNode>();
  for (const node of scene.nodes) {
    if (node.kind !== "functional-object" || node.payload.kind !== "functional-object") continue;
    if (nodesByZone.has(node.payload.functionalZoneId)) {
      throw new BaseCompositionLoaderError(
        "base_required_object_missing",
        `Multiple scene nodes bind functional zone ${node.payload.functionalZoneId}.`,
      );
    }
    nodesByZone.set(node.payload.functionalZoneId, node);
  }
  const knownZones = new Set(template.functionalZones.map((zone) => zone.zoneId));
  for (const zoneId of nodesByZone.keys()) {
    if (!knownZones.has(zoneId)) {
      throw new BaseCompositionLoaderError(
        "base_required_object_missing",
        `Scene binds unknown functional Base zone ${zoneId}.`,
      );
    }
  }

  const result: ResolvedBaseFunctionalObject[] = [];
  for (const zone of template.functionalZones) {
    const node = nodesByZone.get(zone.zoneId);
    if (!node) {
      if (zone.required) {
        throw new BaseCompositionLoaderError(
          "base_required_object_missing",
          `Required functional Base zone ${zone.zoneId} has no scene node.`,
        );
      }
      continue;
    }
    const payload = node.payload as FunctionalObjectScenePayload;
    validateBounds(payload, node.nodeId);

    if (!zone.actionRoles.includes(payload.actionRole)) {
      throw new BaseCompositionLoaderError(
        "base_function_binding_invalid",
        `Action role ${payload.actionRole} is not allowed for ${zone.zoneId}.`,
      );
    }
    const functionBinding = functionBindings.get(zone.zoneId);
    if (!functionBinding) {
      throw new BaseCompositionLoaderError(
        "base_function_binding_missing",
        `Functional zone ${zone.zoneId} has no runtime Function Binding.`,
      );
    }
    if (
      functionBinding.descriptorRole !== payload.descriptorBinding.descriptorRole ||
      functionBinding.descriptorRole !== payload.actionRole
    ) {
      throw new BaseCompositionLoaderError(
        "base_function_binding_invalid",
        `Function Binding ${functionBinding.bindingId} does not match ${zone.zoneId} action role ${payload.actionRole}.`,
      );
    }

    const anchor = template.anchors.find((candidate) => candidate.anchorId === node.anchorId);
    if (!anchor) {
      throw new BaseCompositionLoaderError(
        "base_anchor_missing",
        `Scene node ${node.nodeId} references unknown anchor ${node.anchorId}.`,
      );
    }
    const slotId = functionalSlotByZone[zone.zoneId];
    result.push(
      Object.freeze({
        nodeId: node.nodeId,
        functionalZone: zone,
        visualBounds: payload.visualBounds,
        interactionBounds: payload.interactionBounds,
        layoutBounds: payload.layoutBounds,
        effectBounds: payload.effectBounds,
        ...(payload.labelBounds ? { labelBounds: payload.labelBounds } : {}),
        anchor,
        layerBand: node.layerBand,
        localOrder: node.localOrder,
        states: Object.freeze(template.states.map((state) => state.stateId)),
        ...(slotId ? { assetSlot: requireResolvedSlot(slots, slotId) } : {}),
        functionBinding,
      }),
    );
  }
  return result.sort((left, right) => left.localOrder - right.localOrder);
}

function selectScene(
  composition: Composition,
  template: EnvironmentTemplate,
  context: BaseLoaderContext,
): EnvironmentScene {
  const candidates = composition.environmentScenes
    .filter(
      (scene) =>
        scene.environmentTemplateRef.id === template.templateId &&
        satisfiesVersionRange(template.version, scene.environmentTemplateRef.versionRange),
    )
    .filter((scene) => sceneScopeMatches(scene, context))
    .sort(
      (left, right) =>
        sceneScopeRank(right) - sceneScopeRank(left) || left.sceneId.localeCompare(right.sceneId),
    );
  const scene = candidates[0];
  if (!scene) {
    throw new BaseCompositionLoaderError(
      "base_scene_missing",
      `Composition ${composition.compositionId} has no Base scene for ${context.environmentId}.`,
    );
  }
  return scene;
}

function sceneScopeMatches(scene: EnvironmentScene, context: BaseLoaderContext): boolean {
  switch (scene.scope.level) {
    case "instance":
      return scene.scope.objectId === context.instanceId;
    case "room":
      return scene.scope.scopeId === context.roomId;
    case "environment":
      return scene.scope.scopeId === context.environmentId;
    case "composition-global":
      return true;
    case "rule":
    case "cluster":
    case "project":
      return false;
  }
}

function sceneScopeRank(scene: EnvironmentScene): number {
  switch (scene.scope.level) {
    case "instance":
      return 4;
    case "room":
      return 3;
    case "environment":
      return 2;
    case "composition-global":
      return 1;
    case "rule":
    case "cluster":
    case "project":
      return 0;
  }
}

function resolveSkin(packs: readonly SkinPack[], reference: VersionedRef): SkinDefinition {
  const candidates = packs
    .flatMap((pack) => pack.skins)
    .filter(
      (skin) =>
        skin.skinId === reference.id &&
        satisfiesVersionRange(skin.version, reference.versionRange),
    )
    .sort((left, right) => compareVersions(right.version, left.version));
  const skin = candidates[0];
  if (!skin) {
    throw new BaseCompositionLoaderError(
      "base_skin_missing",
      `Skin ${reference.id}@${reference.versionRange} is not available.`,
    );
  }
  return skin;
}

function isCompatibleSkinValue(
  value: OverrideValue,
  packs: readonly SkinPack[],
  template: EnvironmentTemplate,
): boolean {
  if (value.kind !== "skin-ref") return false;
  try {
    ensureSkinCompatibility(resolveSkin(packs, value.ref), template);
    return true;
  } catch {
    return false;
  }
}

function ensureSkinCompatibility(
  skin: SkinDefinition,
  template: EnvironmentTemplate,
): void {
  const target = skin.target;
  if (
    target.presentationGroup !== "base-interior" ||
    (target.templateRef &&
      (target.templateRef.id !== template.templateId ||
        !satisfiesVersionRange(template.version, target.templateRef.versionRange)))
  ) {
    throw new BaseCompositionLoaderError(
      "base_skin_incompatible",
      `Skin ${skin.skinId}@${skin.version} is incompatible with ${template.templateId}@${template.version}.`,
    );
  }
}

function validateFunctionBindings(
  bindings: readonly RuntimeFunctionBinding[],
): ReadonlyMap<string, Readonly<RuntimeFunctionBinding>> {
  const result = new Map<string, Readonly<RuntimeFunctionBinding>>();
  const allowedKeys = new Set([
    "bindingId",
    "functionalZoneId",
    "descriptorRole",
    "descriptorId",
    "source",
  ]);
  for (const binding of bindings) {
    if (
      Object.keys(binding).some((key) => !allowedKeys.has(key)) ||
      !binding.bindingId ||
      !binding.functionalZoneId ||
      !binding.descriptorRole ||
      !binding.descriptorId ||
      Object.values(binding).some((value) => typeof value !== "string") ||
      binding.source !== "core"
    ) {
      throw new BaseCompositionLoaderError(
        "base_function_binding_invalid",
        "Function Bindings require stable string identities, a descriptor role and Core source.",
      );
    }
    if (result.has(binding.functionalZoneId)) {
      throw new BaseCompositionLoaderError(
        "base_function_binding_invalid",
        `Duplicate Function Binding for ${binding.functionalZoneId}.`,
      );
    }
    result.set(binding.functionalZoneId, Object.freeze({ ...binding }));
  }
  return result;
}

function validateBounds(payload: FunctionalObjectScenePayload, nodeId: string): void {
  for (const [name, bounds] of Object.entries({
    visualBounds: payload.visualBounds,
    interactionBounds: payload.interactionBounds,
    layoutBounds: payload.layoutBounds,
    effectBounds: payload.effectBounds,
    ...(payload.labelBounds ? { labelBounds: payload.labelBounds } : {}),
  })) {
    if (!isFinitePositiveBounds(bounds)) {
      throw new BaseCompositionLoaderError(
        "base_bounds_invalid",
        `${nodeId} has invalid ${name}. Bounds are not silently corrected.`,
      );
    }
  }
}

function isFinitePositiveBounds(bounds: BoundsShape): boolean {
  const values =
    bounds.type === "rect"
      ? [bounds.x, bounds.y, bounds.width, bounds.height]
      : bounds.type === "ellipse"
        ? [bounds.cx, bounds.cy, bounds.rx, bounds.ry]
        : bounds.points.flatMap((point) => [point.x, point.y]);
  if (!values.every(Number.isFinite)) return false;
  if (bounds.type === "rect") return bounds.width > 0 && bounds.height > 0;
  if (bounds.type === "ellipse") return bounds.rx > 0 && bounds.ry > 0;
  return bounds.points.length >= 3;
}

function validateSceneTree(nodes: readonly SceneNode[]): void {
  const byId = new Map(nodes.map((node) => [node.nodeId, node]));
  if (byId.size !== nodes.length) {
    throw new BaseCompositionLoaderError(
      "base_scene_cycle",
      "Base scene contains duplicate node IDs.",
    );
  }
  for (const node of nodes) {
    const visiting = new Set<string>();
    let current: SceneNode | undefined = node;
    while (current?.parentNodeId) {
      if (visiting.has(current.nodeId)) {
        throw new BaseCompositionLoaderError(
          "base_scene_cycle",
          `Base scene parent cycle includes ${current.nodeId}.`,
        );
      }
      visiting.add(current.nodeId);
      current = byId.get(current.parentNodeId);
      if (!current) {
        throw new BaseCompositionLoaderError(
          "base_scene_cycle",
          `Base scene node ${node.nodeId} references missing parent ${node.parentNodeId}.`,
        );
      }
    }
  }
}

function requireResolvedSlot(
  slots: ReadonlyMap<string, ResolvedBaseSlot>,
  slotId: string,
): ResolvedBaseSlot {
  const slot = slots.get(slotId);
  if (!slot) {
    throw new BaseCompositionLoaderError(
      "base_required_slot_missing",
      `Required Base slot ${slotId} was not resolved.`,
    );
  }
  return slot;
}
