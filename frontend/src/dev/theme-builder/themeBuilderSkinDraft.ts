import {
  cloneAndFreeze,
  rendererMaterialChannelRegistry,
  validateSkinPack,
  type ExactVersionedRef,
  type JsonValue,
  type Material,
  type RegisteredTemplate,
  type SkinDefinition,
  type SkinPack,
  type TemplateAssetSlot,
  type TemplateRegistry,
  type ThemeBuilderProject,
} from "../../theme-engine";
import type { BuilderAssetCatalogIndex } from "./themeBuilderAssetReferences";

export type SkinDraftCommand =
  | Readonly<{ type: "create-skin-draft"; targetTemplateId: string; name?: string }>
  | Readonly<{
      type: "assign-skin-slot-asset";
      skinId: string;
      slotId: string;
      stateId: string;
      reference: Readonly<ExactVersionedRef>;
    }>
  | Readonly<{
      type: "clear-skin-slot-asset";
      skinId: string;
      slotId: string;
      stateId: string;
    }>
  | Readonly<{
      type: "set-skin-material-channel";
      skinId: string;
      channelId: string;
      parameterId: string;
      value: JsonValue;
      stateId?: string;
    }>
  | Readonly<{
      type: "clear-skin-material-channel";
      skinId: string;
      channelId: string;
      parameterId?: string;
      stateId?: string;
    }>;

export type SkinDraftErrorCode =
  | "unknown-template"
  | "unsupported-template"
  | "duplicate-skin"
  | "unknown-skin"
  | "missing-template"
  | "unknown-slot"
  | "unknown-state"
  | "unknown-asset-reference"
  | "incompatible-asset"
  | "invalid-material";

export class SkinDraftError extends Error {
  constructor(readonly code: SkinDraftErrorCode, message: string) {
    super(message);
    this.name = "SkinDraftError";
  }
}

export interface ResolvedSkinDraft {
  readonly pack: Readonly<SkinPack>;
  readonly skin: Readonly<SkinDefinition>;
  readonly template: RegisteredTemplate;
  readonly slots: readonly Readonly<TemplateAssetSlot>[];
}

export function applySkinDraftCommand(
  project: Readonly<ThemeBuilderProject>,
  command: Readonly<SkinDraftCommand>,
  templates: TemplateRegistry,
  catalog?: BuilderAssetCatalogIndex,
): Readonly<ThemeBuilderProject> {
  if (command.type === "create-skin-draft") return createSkinDraft(project, command, templates);
  const resolved = resolveSkinDraft(project, command.skinId, templates);
  if (command.type === "assign-skin-slot-asset") {
    assertSlotAndState(resolved, command.slotId, command.stateId);
    const matchingReferences = project.assetRefs.filter((reference) => reference.id === command.reference.id);
    if (!matchingReferences.some((reference) => sameReference(reference, command.reference))) {
      throw new SkinDraftError(
        "unknown-asset-reference",
        `Asset ${command.reference.id}@${command.reference.version} is not referenced by this draft.`,
      );
    }
    if (matchingReferences.length !== 1) {
      throw new SkinDraftError(
        "unknown-asset-reference",
        `Asset ${command.reference.id} does not resolve to one exact Builder Asset Reference.`,
      );
    }
    const slot = resolved.slots.find((candidate) => candidate.slotId === command.slotId)!;
    const record = catalog?.recordFor(command.reference);
    if (!record || !record.resourceAvailable || record.catalogEntry.deprecated) {
      throw new SkinDraftError("unknown-asset-reference", "The referenced Asset is not available in the Catalog.");
    }
    if (!slot.acceptedKinds.includes(record.visualAsset.kind) || !slot.acceptedFormats.includes(record.visualAsset.format)) {
      throw new SkinDraftError(
        "incompatible-asset",
        `Asset ${command.reference.id} is not compatible with slot ${command.slotId}.`,
      );
    }
    return replaceSkin(project, resolved.skin.skinId, (skin) => assignAsset(skin, command));
  }
  if (command.type === "clear-skin-slot-asset") {
    assertSlotAndState(resolved, command.slotId, command.stateId);
    return replaceSkin(project, resolved.skin.skinId, (skin) => clearAsset(skin, command));
  }
  if (command.type === "set-skin-material-channel") {
    if (command.stateId && command.stateId !== "default") assertState(resolved, command.stateId);
    const sourceMaterials = command.stateId && command.stateId !== "default"
      ? resolved.skin.stateVariants.find((variant) => variant.stateId === command.stateId)?.materialOverrides ?? []
      : resolved.skin.materials;
    const material = setMaterialParameter(sourceMaterials, command.channelId, command.parameterId, command.value);
    const validation = rendererMaterialChannelRegistry.validate(
      material,
      (assetId) => project.assetRefs.filter((reference) => reference.id === assetId).length === 1,
    );
    if (!validation.valid) {
      throw new SkinDraftError("invalid-material", `Material value is invalid: ${validation.reason}.`);
    }
    return replaceSkin(project, resolved.skin.skinId, (skin) => command.stateId && command.stateId !== "default"
      ? upsertStateMaterial(skin, command.stateId!, material)
      : ({ ...skin, materials: upsertMaterial(skin.materials, material) }));
  }
  if (command.stateId && command.stateId !== "default") assertState(resolved, command.stateId);
  return replaceSkin(project, resolved.skin.skinId, (skin) => command.stateId && command.stateId !== "default"
    ? clearStateMaterial(skin, command.stateId!, command.channelId, command.parameterId)
    : ({ ...skin, materials: clearMaterialParameter(skin.materials, command.channelId, command.parameterId) }));
}

export function resolveSkinDraft(
  project: Readonly<ThemeBuilderProject>,
  skinId: string,
  templates: TemplateRegistry,
): Readonly<ResolvedSkinDraft> {
  for (const pack of project.artifacts.skinPacks) {
    const skin = pack.skins.find((candidate) => candidate.skinId === skinId);
    if (!skin) continue;
    if (!skin.target.templateRef) {
      throw new SkinDraftError("missing-template", `Skin ${skinId} has no target template.`);
    }
    try {
      const template = templates.resolveRef(skin.target.templateRef);
      return Object.freeze({ pack, skin, template, slots: Object.freeze([...(template.assetSlots ?? [])]) });
    } catch {
      throw new SkinDraftError(
        "missing-template",
        `Target template ${skin.target.templateRef.id}@${skin.target.templateRef.versionRange} is unavailable.`,
      );
    }
  }
  throw new SkinDraftError("unknown-skin", `Skin ${skinId} is not in this draft.`);
}

function createSkinDraft(
  project: Readonly<ThemeBuilderProject>,
  command: Extract<SkinDraftCommand, { type: "create-skin-draft" }>,
  templates: TemplateRegistry,
): Readonly<ThemeBuilderProject> {
  const candidates = templates.list(command.targetTemplateId);
  const template = candidates.at(-1);
  if (!template) throw new SkinDraftError("unknown-template", `Template ${command.targetTemplateId} is unknown.`);
  if (!(template.assetSlots?.length)) {
    throw new SkinDraftError("unsupported-template", `Template ${command.targetTemplateId} has no visual slots.`);
  }
  const ordinal = project.artifacts.skinPacks.reduce((count, pack) => count + pack.skins.length, 0) + 1;
  const suffix = project.builderProjectId.split(".").at(-1) ?? "draft";
  const skinId = `user.skin.${suffix}.${ordinal}`;
  const packId = `user.skin-pack.${suffix}.${ordinal}`;
  if (project.artifacts.skinPacks.some((pack) => pack.skins.some((skin) => skin.skinId === skinId))) {
    throw new SkinDraftError("duplicate-skin", `Skin ${skinId} already exists.`);
  }
  const displayName = command.name?.trim() || `${template.displayName} Look`;
  const skin: SkinDefinition = {
    skinId,
    version: project.themeVersion,
    displayName,
    target: {
      presentationGroup: presentationGroupFor(template),
      templateRef: { id: template.templateId, versionRange: template.version },
    },
    assetBindings: [],
    tokens: {},
    materials: [],
    stateVariants: [],
  };
  const pack: SkinPack = validateSkinPack({
    schemaVersion: 1,
    packId,
    version: project.packageVersion,
    packageKind: "single-skin",
    displayName,
    compatibility: { themeEngine: project.manifestDraft.compatibility.themeEngine },
    assets: [],
    skins: [skin],
    ...(project.author ? { author: project.author } : {}),
  });
  return cloneAndFreeze({
    ...project,
    artifacts: {
      ...project.artifacts,
      skinPacks: [...project.artifacts.skinPacks, pack],
    },
  });
}

function presentationGroupFor(template: RegisteredTemplate): SkinDefinition["target"]["presentationGroup"] {
  if (template.templateKind === "environment") return template.environmentKind;
  const known = ["window", "companion", "icon", "node", "connection", "label", "status", "ambient"] as const;
  const match = known.find((group) => template.targetRole === group || template.targetRole.endsWith(`.${group}`));
  if (!match) throw new SkinDraftError("unsupported-template", `Template ${template.templateId} has no supported presentation group.`);
  return match;
}

function assertState(resolved: Readonly<ResolvedSkinDraft>, stateId: string): void {
  if (!resolved.template.states.some((candidate) => candidate.stateId === stateId)) {
    throw new SkinDraftError("unknown-state", `State ${stateId} is not declared by template ${resolved.template.templateId}.`);
  }
}

function assertSlotAndState(resolved: Readonly<ResolvedSkinDraft>, slotId: string, stateId: string): void {
  const slot = resolved.slots.find((candidate) => candidate.slotId === slotId);
  if (!slot) throw new SkinDraftError("unknown-slot", `Slot ${slotId} is not declared by the target template.`);
  const state = resolved.template.states.find((candidate) => candidate.stateId === stateId);
  if (!state || (slot.states && !slot.states.includes(stateId))) {
    throw new SkinDraftError("unknown-state", `State ${stateId} is not allowed for slot ${slotId}.`);
  }
}

function assignAsset(
  skin: Readonly<SkinDefinition>,
  command: Extract<SkinDraftCommand, { type: "assign-skin-slot-asset" }>,
): SkinDefinition {
  const isDefault = command.stateId === "default";
  const bindingId = bindingIdFor(skin.skinId, command.slotId, command.stateId);
  const bindings = skin.assetBindings.filter((binding) =>
    !(binding.slotId === command.slotId && stateKey(binding) === command.stateId),
  );
  bindings.push({
    bindingId,
    slotId: command.slotId,
    assetId: command.reference.id,
    fit: "cover",
    ...(!isDefault ? { states: [command.stateId] } : {}),
  });
  return {
    ...skin,
    assetBindings: bindings,
    stateVariants: isDefault
      ? skin.stateVariants
      : upsertStateVariant(skin, command.stateId, bindingId),
  };
}

function clearAsset(
  skin: Readonly<SkinDefinition>,
  command: Extract<SkinDraftCommand, { type: "clear-skin-slot-asset" }>,
): SkinDefinition {
  const removed = skin.assetBindings.find((binding) =>
    binding.slotId === command.slotId && stateKey(binding) === command.stateId,
  );
  const assetBindings = skin.assetBindings.filter((binding) => binding !== removed);
  const stateVariants = removed
    ? skin.stateVariants
        .map((variant) => variant.stateId === command.stateId
          ? { ...variant, assetBindingIds: variant.assetBindingIds?.filter((id) => id !== removed.bindingId) }
          : variant)
        .filter((variant) => variant.stateId !== command.stateId || (variant.assetBindingIds?.length ?? 0) > 0)
    : skin.stateVariants;
  return { ...skin, assetBindings, stateVariants };
}

function upsertStateVariant(skin: Readonly<SkinDefinition>, stateId: string, bindingId: string) {
  const existing = skin.stateVariants.find((variant) => variant.stateId === stateId);
  if (!existing) return [...skin.stateVariants, { stateId, assetBindingIds: [bindingId] }];
  return skin.stateVariants.map((variant) => variant.stateId === stateId
    ? { ...variant, assetBindingIds: [...(variant.assetBindingIds ?? []), bindingId].filter((id, index, all) => all.indexOf(id) === index) }
    : variant);
}

function setMaterialParameter(
  materials: readonly Readonly<Material>[],
  channelId: string,
  parameterId: string,
  value: JsonValue,
): Readonly<Material> {
  const current = materials.find((material) => material.channelId === channelId);
  return { channelId, parameters: { ...(current?.parameters ?? {}), [parameterId]: value } };
}

function upsertMaterial(materials: readonly Readonly<Material>[], material: Readonly<Material>): readonly Readonly<Material>[] {
  return [...materials.filter((candidate) => candidate.channelId !== material.channelId), material];
}

function upsertStateMaterial(skin: Readonly<SkinDefinition>, stateId: string, material: Readonly<Material>): SkinDefinition {
  const existing = skin.stateVariants.find((variant) => variant.stateId === stateId);
  const variant = existing
    ? { ...existing, materialOverrides: upsertMaterial(existing.materialOverrides ?? [], material) }
    : { stateId, materialOverrides: [material] };
  return { ...skin, stateVariants: [...skin.stateVariants.filter((candidate) => candidate.stateId !== stateId), variant] };
}

function clearStateMaterial(skin: Readonly<SkinDefinition>, stateId: string, channelId: string, parameterId?: string): SkinDefinition {
  return {
    ...skin,
    stateVariants: skin.stateVariants.map((variant) => variant.stateId !== stateId ? variant : {
      ...variant,
      materialOverrides: clearMaterialParameter(variant.materialOverrides ?? [], channelId, parameterId),
    }),
  };
}

function clearMaterialParameter(
  materials: readonly Readonly<Material>[],
  channelId: string,
  parameterId?: string,
): readonly Readonly<Material>[] {
  if (!parameterId) return materials.filter((material) => material.channelId !== channelId);
  return materials.flatMap((material) => {
    if (material.channelId !== channelId) return [material];
    const parameters = { ...material.parameters };
    delete parameters[parameterId];
    return Object.keys(parameters).length ? [{ ...material, parameters }] : [];
  });
}

function replaceSkin(
  project: Readonly<ThemeBuilderProject>,
  skinId: string,
  update: (skin: Readonly<SkinDefinition>) => SkinDefinition,
): Readonly<ThemeBuilderProject> {
  const skinPacks = project.artifacts.skinPacks.map((pack) => {
    if (!pack.skins.some((skin) => skin.skinId === skinId)) return pack;
    return validateSkinPack({
      ...pack,
      skins: pack.skins.map((skin) => skin.skinId === skinId ? update(skin) : skin),
    });
  });
  return cloneAndFreeze({ ...project, artifacts: { ...project.artifacts, skinPacks } });
}

function stateKey(binding: Readonly<SkinDefinition["assetBindings"][number]>): string {
  return binding.states?.[0] ?? "default";
}

function bindingIdFor(skinId: string, slotId: string, stateId: string): string {
  const suffix = skinId.split(".").slice(-2).join("-");
  return `user.binding.${suffix}.${slotId.replace(/[^a-z0-9]+/g, "-")}.${stateId.replace(/[^a-z0-9]+/g, "-")}`;
}

function sameReference(left: Readonly<ExactVersionedRef>, right: Readonly<ExactVersionedRef>): boolean {
  return left.id === right.id && left.version === right.version;
}
