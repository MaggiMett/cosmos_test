import type { ThemeManifest } from "../theme-engine/types";
import { cloneAndFreeze } from "../theme-engine/immutable";

export type ThemeDefinitionProvenance =
  | Readonly<{
      kind: "code-native";
      provenance: string;
    }>
  | Readonly<{
      kind: "theme-package";
      packageId: string;
      packageVersion: string;
      provenance: string;
      manifestDigest: string;
    }>;

export interface ThemeDefinition {
  objectId: string;
  displayName: string;
  version: string;
  description?: string;
  author?: string;
  tokens: Readonly<Record<string, string>>;
  /** Validated source metadata retained by the authoritative Theme Registry. */
  provenance: ThemeDefinitionProvenance;
  /** Present for manifest-backed Themes; code-native Themes need not invent one. */
  manifest?: Readonly<ThemeManifest>;
}

export class ThemeRegistryError extends Error {
  constructor(
    readonly code: "duplicate_theme" | "invalid_theme" | "unknown_theme",
    message: string,
  ) {
    super(message);
    this.name = "ThemeRegistryError";
  }
}

export class ThemeRegistry {
  private readonly definitions = new Map<string, Readonly<ThemeDefinition>>();

  register(definition: ThemeDefinition): Readonly<ThemeDefinition> {
    validateTheme(definition);
    if (this.definitions.has(definition.objectId)) {
      throw new ThemeRegistryError("duplicate_theme", `Theme is already registered: ${definition.objectId}`);
    }
    const registered = freezeDefinition(definition);
    this.definitions.set(registered.objectId, registered);
    return registered;
  }

  resolve(objectId: string): Readonly<ThemeDefinition> {
    const definition = this.definitions.get(objectId);
    if (!definition) {
      throw new ThemeRegistryError("unknown_theme", `Unknown Theme: ${objectId}`);
    }
    return definition;
  }

  has(objectId: string): boolean {
    return this.definitions.has(objectId);
  }

  list(): readonly Readonly<ThemeDefinition>[] {
    return [...this.definitions.values()].sort((left, right) =>
      left.objectId.localeCompare(right.objectId),
    );
  }
}

function validateTheme(definition: ThemeDefinition): void {
  if (!definition.objectId.trim() || !definition.displayName.trim() || !definition.version.trim()) {
    throw new ThemeRegistryError("invalid_theme", "Theme identity, display name and version are required.");
  }
  const entries = Object.entries(definition.tokens);
  if (entries.length === 0) {
    throw new ThemeRegistryError("invalid_theme", "A Theme must provide presentation tokens.");
  }
  if (entries.some(([name, value]) => !name.startsWith("--cosmos-") || !value.trim())) {
    throw new ThemeRegistryError(
      "invalid_theme",
      "Theme tokens must use the --cosmos- namespace and contain values.",
    );
  }
  if (
    !definition.provenance ||
    (definition.provenance.kind !== "code-native" &&
      definition.provenance.kind !== "theme-package") ||
    typeof definition.provenance.provenance !== "string" ||
    !definition.provenance.provenance.trim()
  ) {
    throw new ThemeRegistryError("invalid_theme", "Theme provenance is required.");
  }
  if (
    definition.provenance.kind === "theme-package" &&
    (!definition.manifest ||
      definition.manifest.themeId !== definition.objectId ||
      definition.manifest.version !== definition.version ||
      definition.provenance.packageVersion !== definition.version)
  ) {
    throw new ThemeRegistryError(
      "invalid_theme",
      "Package Theme provenance must match its validated manifest and Theme identity.",
    );
  }
}

function freezeDefinition(definition: ThemeDefinition): Readonly<ThemeDefinition> {
  return cloneAndFreeze(definition);
}
