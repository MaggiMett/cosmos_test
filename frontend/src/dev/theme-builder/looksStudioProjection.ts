import type {
  RegisteredTemplate,
  SkinDefinition,
  TemplateAssetSlot,
  ThemeBuilderProject,
} from "../../theme-engine";
import type { BuilderAssetPresentation } from "./themeBuilderAssetReferences";

export interface LooksSlotPresentation {
  readonly slotId: string;
  readonly label: string;
  readonly purpose: string;
  readonly required: boolean;
  readonly fallbackPolicy: TemplateAssetSlot["fallbackPolicy"];
  readonly bindingId: string | null;
  readonly assetId: string | null;
  readonly assetName: string | null;
  readonly assetStatus: BuilderAssetPresentation["status"] | null;
  readonly previewUrl: string | null;
  readonly inherited: boolean;
  readonly statusLabel: string;
}

export interface LooksStatePresentation {
  readonly stateId: string;
  readonly label: string;
  readonly fallbackStateId: string;
  readonly fallbackLabel: string;
}

export function projectLooksSlots(
  skin: Readonly<SkinDefinition>,
  template: RegisteredTemplate,
  assets: readonly Readonly<BuilderAssetPresentation>[],
  activeStateId: string,
): readonly Readonly<LooksSlotPresentation>[] {
  return Object.freeze((template.assetSlots ?? []).map((slot) => {
    const direct = skin.assetBindings.find((binding) =>
      binding.slotId === slot.slotId && (binding.states?.[0] ?? "default") === activeStateId,
    );
    const inherited = !direct && activeStateId !== "default"
      ? skin.assetBindings.find((binding) => binding.slotId === slot.slotId && !binding.states?.length)
      : undefined;
    const binding = direct ?? inherited;
    const reference = binding
      ? assets.find((asset) => asset.reference.id === binding.assetId)
      : undefined;
    const assetStatus = reference?.status ?? (binding ? "missing" : null);
    return Object.freeze({
      slotId: slot.slotId,
      label: slotLabel(slot.slotId),
      purpose: slot.purpose,
      required: slot.required,
      fallbackPolicy: slot.fallbackPolicy,
      bindingId: binding?.bindingId ?? null,
      assetId: binding?.assetId ?? null,
      assetName: reference?.name ?? binding?.assetId ?? null,
      assetStatus,
      previewUrl: reference?.previewUrl ?? null,
      inherited: Boolean(inherited),
      statusLabel: binding
        ? assetStatus === "missing" ? "Missing / Unavailable" : inherited ? "Uses Default" : reference?.name ?? binding.assetId
        : fallbackLabel(slot),
    });
  }));
}

export function projectLooksStates(
  template: RegisteredTemplate,
): readonly Readonly<LooksStatePresentation>[] {
  return Object.freeze(template.states.map((state) => Object.freeze({
    stateId: state.stateId,
    label: titleCase(state.stateId),
    fallbackStateId: state.fallbackStateId,
    fallbackLabel: state.stateId === state.fallbackStateId
      ? "Base binding"
      : `Uses ${titleCase(state.fallbackStateId)}`,
  })));
}

export function findSkin(
  project: Readonly<ThemeBuilderProject>,
  skinId: string,
): Readonly<SkinDefinition> | undefined {
  return project.artifacts.skinPacks.flatMap((pack) => pack.skins)
    .find((skin) => skin.skinId === skinId);
}

function fallbackLabel(slot: Readonly<TemplateAssetSlot>): string {
  if (slot.fallbackPolicy === "core-emergency") return "Uses Core Fallback";
  if (slot.fallbackPolicy === "template-default") return "Uses Default";
  if (slot.fallbackPolicy === "skin-chain") return "Uses Theme Fallback";
  return slot.required ? "Required visual unavailable" : "Optional Slot";
}

function slotLabel(slotId: string): string {
  return titleCase(slotId.split(".").at(-1) ?? slotId);
}

function titleCase(value: string): string {
  return value.split(/[-_.]/g).filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`).join(" ");
}
