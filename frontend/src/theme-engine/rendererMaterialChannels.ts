import type { JsonValue, Material } from "./types";

export type RendererMaterialUnavailableReason =
  | "unknown-channel"
  | "empty-material"
  | "unknown-parameter"
  | "invalid-parameter-type"
  | "parameter-out-of-range"
  | "asset-unavailable";

export interface SafeMaterialAssetReference {
  readonly assetId: string;
  readonly version: string | null;
  readonly kind: string;
  readonly format: string;
  readonly mimeType: string;
  readonly sha256: string;
  readonly byteSize: number;
  readonly width: number;
  readonly height: number;
  readonly catalogEntryId: string | null;
  readonly catalogEntryVersion: string | null;
}

export type ResolvedRendererMaterialParameter =
  | Readonly<{ parameterId: string; kind: "color"; value: string }>
  | Readonly<{ parameterId: string; kind: "number"; value: number }>
  | Readonly<{
      parameterId: string;
      kind: "asset-reference";
      value: Readonly<SafeMaterialAssetReference>;
    }>;

export type RendererMaterialResolution =
  | Readonly<{
      status: "resolved";
      channelId: string;
      parameters: readonly Readonly<ResolvedRendererMaterialParameter>[];
      reason: null;
    }>
  | Readonly<{
      status: "unavailable";
      channelId: string;
      parameters: readonly [];
      reason: RendererMaterialUnavailableReason;
    }>;

export type RendererMaterialValidation = Readonly<
  { valid: true } | { valid: false; reason: RendererMaterialUnavailableReason }
>;

type MaterialAssetResolver = (assetId: string) => Readonly<SafeMaterialAssetReference> | null;

interface MaterialParameterDefinition {
  readonly kind: "color" | "number" | "asset-reference";
  readonly minimum?: number;
  readonly maximum?: number;
}

interface RendererMaterialChannelDefinition {
  readonly channelId: string;
  readonly parameters: Readonly<Record<string, Readonly<MaterialParameterDefinition>>>;
}

const namespacedId = /^[a-z0-9]+(?:[._-][a-z0-9]+)+$/;
const safeHexColor = /^#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?$/i;

const surfaceParameters = Object.freeze({
  "core.material.fill": Object.freeze({ kind: "color" as const }),
  "core.material.stroke": Object.freeze({ kind: "color" as const }),
  "core.material.opacity": Object.freeze({ kind: "number" as const, minimum: 0, maximum: 1 }),
  "core.material.texture-ref": Object.freeze({ kind: "asset-reference" as const }),
});

const DOM_SURFACE_CHANNEL = Object.freeze<RendererMaterialChannelDefinition>({
  channelId: "core.material.dom-surface",
  parameters: surfaceParameters,
});

const PART_SURFACE_CHANNEL = Object.freeze<RendererMaterialChannelDefinition>({
  channelId: "core.material.part-surface",
  parameters: surfaceParameters,
});

/** A closed renderer-owned allowlist. It emits data only; it never writes CSS or DOM state. */
export class RendererMaterialChannelRegistry {
  private readonly channels: Readonly<Record<string, Readonly<RendererMaterialChannelDefinition>>>;

  constructor(definitions: readonly Readonly<RendererMaterialChannelDefinition>[]) {
    this.channels = Object.freeze(
      Object.fromEntries(definitions.map((definition) => [definition.channelId, definition])),
    );
  }

  resolve(
    material: Readonly<Material>,
    resolveAsset: MaterialAssetResolver,
  ): RendererMaterialResolution {
    const channel = this.channelFor(material.channelId);
    if (!channel) return unavailable(material.channelId, "unknown-channel");
    const entries = Object.entries(material.parameters).sort(([left], [right]) =>
      left.localeCompare(right),
    );
    if (entries.length === 0) return unavailable(material.channelId, "empty-material");

    const parameters: ResolvedRendererMaterialParameter[] = [];
    for (const [parameterId, value] of entries) {
      const definition = channel.parameters[parameterId];
      if (!definition) return unavailable(material.channelId, "unknown-parameter");
      const resolved = resolveParameter(parameterId, definition, value, resolveAsset);
      if (typeof resolved === "string") return unavailable(material.channelId, resolved);
      parameters.push(resolved);
    }
    return Object.freeze({
      status: "resolved",
      channelId: material.channelId,
      parameters: Object.freeze(parameters),
      reason: null,
    });
  }

  /** Validates draft data against the same closed renderer allowlist without resolving bytes. */
  validate(
    material: Readonly<Material>,
    hasAsset: (assetId: string) => boolean,
  ): RendererMaterialValidation {
    const channel = this.channelFor(material.channelId);
    if (!channel) return Object.freeze({ valid: false, reason: "unknown-channel" });
    const entries = Object.entries(material.parameters);
    if (entries.length === 0) return Object.freeze({ valid: false, reason: "empty-material" });
    for (const [parameterId, value] of entries) {
      const definition = channel.parameters[parameterId];
      if (!definition) return Object.freeze({ valid: false, reason: "unknown-parameter" });
      const reason = validateParameter(definition, value, hasAsset);
      if (reason) return Object.freeze({ valid: false, reason });
    }
    return Object.freeze({ valid: true });
  }

  private channelFor(channelId: string): Readonly<RendererMaterialChannelDefinition> | undefined {
    if (channelId.startsWith(`${PART_SURFACE_CHANNEL.channelId}.`)) return PART_SURFACE_CHANNEL;
    return this.channels[channelId];
  }

  referencedAssetIds(material: Readonly<Material>): readonly string[] {
    const channel = this.channelFor(material.channelId);
    if (!channel) return Object.freeze([]);
    return Object.freeze(
      Object.entries(material.parameters)
        .filter(
          ([parameterId, value]) =>
            channel.parameters[parameterId]?.kind === "asset-reference" &&
            typeof value === "string" &&
            namespacedId.test(value),
        )
        .map(([, value]) => value as string)
        .sort(),
    );
  }
}

function validateParameter(
  definition: Readonly<MaterialParameterDefinition>,
  value: JsonValue,
  hasAsset: (assetId: string) => boolean,
): RendererMaterialUnavailableReason | null {
  if (definition.kind === "color") {
    return typeof value === "string" && safeHexColor.test(value)
      ? null
      : "invalid-parameter-type";
  }
  if (definition.kind === "number") {
    if (typeof value !== "number" || !Number.isFinite(value)) return "invalid-parameter-type";
    return (definition.minimum !== undefined && value < definition.minimum) ||
      (definition.maximum !== undefined && value > definition.maximum)
      ? "parameter-out-of-range"
      : null;
  }
  if (typeof value !== "string" || !namespacedId.test(value)) return "invalid-parameter-type";
  return hasAsset(value) ? null : "asset-unavailable";
}

export const rendererMaterialChannelRegistry = new RendererMaterialChannelRegistry([
  DOM_SURFACE_CHANNEL,
  PART_SURFACE_CHANNEL,
]);

function resolveParameter(
  parameterId: string,
  definition: Readonly<MaterialParameterDefinition>,
  value: JsonValue,
  resolveAsset: MaterialAssetResolver,
): ResolvedRendererMaterialParameter | RendererMaterialUnavailableReason {
  if (definition.kind === "color") {
    return typeof value === "string" && safeHexColor.test(value)
      ? Object.freeze({ parameterId, kind: "color", value })
      : "invalid-parameter-type";
  }
  if (definition.kind === "number") {
    if (typeof value !== "number" || !Number.isFinite(value)) return "invalid-parameter-type";
    if (
      (definition.minimum !== undefined && value < definition.minimum) ||
      (definition.maximum !== undefined && value > definition.maximum)
    ) {
      return "parameter-out-of-range";
    }
    return Object.freeze({ parameterId, kind: "number", value });
  }
  if (typeof value !== "string" || !namespacedId.test(value)) {
    return "invalid-parameter-type";
  }
  const asset = resolveAsset(value);
  return asset
    ? Object.freeze({ parameterId, kind: "asset-reference", value: asset })
    : "asset-unavailable";
}

function unavailable(
  channelId: string,
  reason: RendererMaterialUnavailableReason,
): RendererMaterialResolution {
  return Object.freeze({
    status: "unavailable",
    channelId,
    parameters: Object.freeze([]) as readonly [],
    reason,
  });
}
