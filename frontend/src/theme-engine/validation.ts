import Ajv2020, {
  type ErrorObject,
  type ValidateFunction,
} from "ajv/dist/2020";

import assetCatalogEntrySchema from "../../../docs/theme-engine/schemas/asset-catalog-entry.schema.json";
import compositionSchema from "../../../docs/theme-engine/schemas/composition.schema.json";
import baseCompositionSchema from "../../../docs/theme-engine/schemas/base-composition.schema.json";
import catalogObjectSchema from "../../../docs/theme-engine/schemas/catalog-object.schema.json";
import environmentTemplateSchema from "../../../docs/theme-engine/schemas/environment-template.schema.json";
import functionContainerSchema from "../../../docs/theme-engine/schemas/function-container.schema.json";
import objectTemplateSchema from "../../../docs/theme-engine/schemas/object-template.schema.json";
import placementProfileSchema from "../../../docs/theme-engine/schemas/placement-profile.schema.json";
import roomCommonSchema from "../../../docs/theme-engine/schemas/room-common.schema.json";
import roomCompositionSchema from "../../../docs/theme-engine/schemas/room-composition.schema.json";
import roomPresetSchema from "../../../docs/theme-engine/schemas/room-preset.schema.json";
import roomShellSchema from "../../../docs/theme-engine/schemas/room-shell.schema.json";
import skinPackSchema from "../../../docs/theme-engine/schemas/skin-pack.schema.json";
import themeManifestSchema from "../../../docs/theme-engine/schemas/theme-manifest.schema.json";
import visualAssetSchema from "../../../docs/theme-engine/schemas/visual-asset.schema.json";
import type {
  AssetCatalogEntry,
  VisualAsset,
} from "./assetCatalogTypes";
import type {
  BaseComposition,
  CatalogObject,
  FunctionContainer,
  PlacementProfile,
  RoomComposition,
  RoomPreset,
  RoomShell,
} from "./roomCompositionTypes";
import type {
  Composition,
  EnvironmentTemplate,
  ObjectTemplate,
  SkinPack,
  ThemeManifest,
} from "./types";
import { parseVersion } from "./version";

export type ThemeArtifactKind =
  | "visual-asset"
  | "asset-catalog-entry"
  | "theme-manifest"
  | "skin-pack"
  | "object-template"
  | "environment-template"
  | "composition"
  | "room-shell"
  | "room-preset"
  | "catalog-object"
  | "function-container"
  | "room-composition"
  | "base-composition"
  | "placement-profile";

export interface ThemeValidationIssue {
  path: string;
  keyword: string;
  message: string;
}

export class ThemeValidationError extends Error {
  readonly code = "theme_schema_invalid";

  constructor(
    readonly artifactKind: ThemeArtifactKind,
    readonly issues: readonly ThemeValidationIssue[],
  ) {
    super(
      `${artifactKind} validation failed: ${issues
        .map((issue) => `${issue.path}: ${issue.message}`)
        .join("; ")}`,
    );
    this.name = "ThemeValidationError";
  }
}

const ajv = new Ajv2020({
  allErrors: true,
  coerceTypes: false,
  removeAdditional: false,
  useDefaults: false,
  strict: true,
  strictRequired: false,
  strictTypes: false,
  validateFormats: true,
});

ajv.addFormat("uri", {
  type: "string",
  validate(value: string): boolean {
    try {
      const parsed = new URL(value);
      return Boolean(parsed.protocol);
    } catch {
      return false;
    }
  },
});

ajv.addFormat(
  "date-time",
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
);

ajv.addSchema(roomCommonSchema);
ajv.addSchema(placementProfileSchema);
ajv.addSchema(roomShellSchema);
ajv.addSchema(catalogObjectSchema);
ajv.addSchema(functionContainerSchema);
ajv.addSchema(roomPresetSchema);
ajv.addSchema(roomCompositionSchema);
ajv.addSchema(baseCompositionSchema);
ajv.addSchema(visualAssetSchema);
ajv.addSchema(assetCatalogEntrySchema);

const validators = {
  "visual-asset": requireSchemaValidator(visualAssetSchema.$id),
  "asset-catalog-entry": requireSchemaValidator(assetCatalogEntrySchema.$id),
  "theme-manifest": ajv.compile(themeManifestSchema),
  "skin-pack": ajv.compile(skinPackSchema),
  "object-template": ajv.compile(objectTemplateSchema),
  "environment-template": ajv.compile(environmentTemplateSchema),
  composition: ajv.compile(compositionSchema),
  "room-shell": requireSchemaValidator(roomShellSchema.$id),
  "room-preset": requireSchemaValidator(roomPresetSchema.$id),
  "catalog-object": requireSchemaValidator(catalogObjectSchema.$id),
  "function-container": requireSchemaValidator(functionContainerSchema.$id),
  "room-composition": requireSchemaValidator(roomCompositionSchema.$id),
  "base-composition": requireSchemaValidator(baseCompositionSchema.$id),
  "placement-profile": requireSchemaValidator(placementProfileSchema.$id),
} satisfies Record<ThemeArtifactKind, ValidateFunction>;

const forbiddenPropertyNames = new Set([
  "code",
  "eventhandler",
  "eventhandlers",
  "executable",
  "handler",
  "html",
  "javascript",
  "onclick",
  "onerror",
  "python",
  "script",
  "scripts",
  "shader",
  "typescript",
]);

const forbiddenStringPatterns: readonly RegExp[] = [
  /<\s*script\b/i,
  /<\s*(?:iframe|object|embed|foreignObject)\b/i,
  /\bjavascript\s*:/i,
  /\bdata\s*:\s*text\/html/i,
  /\bon(?:click|error|load|pointer\w*)\s*=/i,
];

export function validateThemeManifest(value: unknown): ThemeManifest {
  return validateArtifact("theme-manifest", validators["theme-manifest"], value);
}

export function validateVisualAsset(value: unknown): VisualAsset {
  return validateArtifact("visual-asset", validators["visual-asset"], value);
}

export function validateAssetCatalogEntry(value: unknown): AssetCatalogEntry {
  const entry = validateArtifact<AssetCatalogEntry>(
    "asset-catalog-entry",
    validators["asset-catalog-entry"],
    value,
  );
  const issues: ThemeValidationIssue[] = [];

  entry.compatibleTemplates.forEach((reference, index) => {
    if (!isSupportedVersionRange(reference.versionRange)) {
      issues.push({
        path: `/compatibleTemplates/${index}/versionRange`,
        keyword: "version-range",
        message: `unsupported semantic version range "${reference.versionRange}"`,
      });
    }
  });

  if (
    entry.replacement?.id === entry.id &&
    entry.replacement.version === entry.version
  ) {
    issues.push({
      path: "/replacement",
      keyword: "reference",
      message: "replacement must not reference the same catalog entry version",
    });
  }

  throwSemanticIssues("asset-catalog-entry", issues);
  return entry;
}

export function validateSkinPack(value: unknown): SkinPack {
  return validateArtifact("skin-pack", validators["skin-pack"], value);
}

export function validateObjectTemplate(value: unknown): ObjectTemplate {
  return validateArtifact("object-template", validators["object-template"], value);
}

export function validateEnvironmentTemplate(value: unknown): EnvironmentTemplate {
  return validateArtifact(
    "environment-template",
    validators["environment-template"],
    value,
  );
}

export function validateComposition(value: unknown): Composition {
  return validateArtifact("composition", validators.composition, value);
}

export function validateRoomShell(value: unknown): RoomShell {
  const shell = validateArtifact<RoomShell>("room-shell", validators["room-shell"], value);
  const kinds = new Set(shell.architectureSurfaces.map((surface) => surface.surfaceKind));
  const issues: ThemeValidationIssue[] = [];
  for (const requiredKind of ["wall", "floor", "ceiling"] as const) {
    if (!kinds.has(requiredKind)) {
      issues.push({
        path: "/architectureSurfaces",
        keyword: "required-surface-kind",
        message: `required architecture surface kind "${requiredKind}" is missing`,
      });
    }
  }

  const surfaceIds = new Set(shell.placementSurfaces.map((surface) => surface.surfaceId));
  const areaIds = new Set(shell.placementAreas.map((area) => area.areaId));
  const anchorIds = new Set(shell.attachmentAnchors.map((anchor) => anchor.anchorId));
  shell.placementAreas.forEach((area, index) => {
    if (!surfaceIds.has(area.surfaceId)) {
      issues.push({
        path: `/placementAreas/${index}/surfaceId`,
        keyword: "reference",
        message: `unknown placement surface "${area.surfaceId}"`,
      });
    }
  });
  shell.placementSurfaces.forEach((surface, index) => {
    surface.placementAreaIds.forEach((areaId) => {
      if (!areaIds.has(areaId)) {
        issues.push({
          path: `/placementSurfaces/${index}/placementAreaIds`,
          keyword: "reference",
          message: `unknown placement area "${areaId}"`,
        });
      }
    });
    surface.anchorIds.forEach((anchorId) => {
      if (!anchorIds.has(anchorId)) {
        issues.push({
          path: `/placementSurfaces/${index}/anchorIds`,
          keyword: "reference",
          message: `unknown attachment anchor "${anchorId}"`,
        });
      }
    });
  });
  throwSemanticIssues("room-shell", issues);
  return shell;
}

export function validateRoomPreset(value: unknown): RoomPreset {
  return validateArtifact("room-preset", validators["room-preset"], value);
}

export function validateCatalogObject(value: unknown): CatalogObject {
  const object = validateArtifact<CatalogObject>(
    "catalog-object",
    validators["catalog-object"],
    value,
  );
  if (
    object.scale.minimum > object.scale.maximum ||
    object.placementProfile.scalePolicy.minimum >
      object.placementProfile.scalePolicy.maximum
  ) {
    throw new ThemeValidationError("catalog-object", [
      {
        path: "/scale",
        keyword: "range",
        message: "minimum scale must not exceed maximum scale",
      },
    ]);
  }
  return object;
}

export function validateFunctionContainer(value: unknown): FunctionContainer {
  return validateArtifact(
    "function-container",
    validators["function-container"],
    value,
  );
}

export function validateRoomComposition(value: unknown): RoomComposition {
  return validateArtifact(
    "room-composition",
    validators["room-composition"],
    value,
  );
}

export function validateBaseComposition(value: unknown): BaseComposition {
  return validateArtifact(
    "base-composition",
    validators["base-composition"],
    value,
  );
}

export function validatePlacementProfile(value: unknown): PlacementProfile {
  const profile = validateArtifact<PlacementProfile>(
    "placement-profile",
    validators["placement-profile"],
    value,
  );
  if (profile.scalePolicy.minimum > profile.scalePolicy.maximum) {
    throw new ThemeValidationError("placement-profile", [
      {
        path: "/scalePolicy",
        keyword: "range",
        message: "minimum scale must not exceed maximum scale",
      },
    ]);
  }
  return profile;
}

function requireSchemaValidator(id: string): ValidateFunction {
  const validator = ajv.getSchema(id);
  if (!validator) throw new Error(`Ajv schema "${id}" was not registered`);
  return validator;
}

function isSupportedVersionRange(range: string): boolean {
  const normalized = range.trim();
  if (normalized === "*" || normalized.toLowerCase() === "latest") {
    return true;
  }
  const exact = normalized.startsWith("^") || normalized.startsWith("~")
    ? normalized.slice(1)
    : normalized;
  return parseVersion(exact) !== null;
}

function throwSemanticIssues(
  artifactKind: ThemeArtifactKind,
  issues: readonly ThemeValidationIssue[],
): void {
  if (issues.length > 0) {
    throw new ThemeValidationError(artifactKind, issues);
  }
}

function validateArtifact<T>(
  artifactKind: ThemeArtifactKind,
  validator: ValidateFunction,
  value: unknown,
): T {
  const valid = validator(value);
  if (!valid) {
    throw new ThemeValidationError(artifactKind, formatAjvErrors(validator.errors ?? []));
  }

  const executableIssues = findExecutableContent(value);
  if (executableIssues.length > 0) {
    throw new ThemeValidationError(artifactKind, executableIssues);
  }

  return value as T;
}

function formatAjvErrors(errors: readonly ErrorObject[]): ThemeValidationIssue[] {
  return errors.map((error) => {
    const additional =
      error.keyword === "additionalProperties" &&
      typeof error.params.additionalProperty === "string"
        ? `/${escapeJsonPointer(error.params.additionalProperty)}`
        : "";
    const path = `${error.instancePath || "/"}${additional}`;
    return {
      path,
      keyword: error.keyword,
      message: humanizeAjvError(error),
    };
  });
}

function humanizeAjvError(error: ErrorObject): string {
  if (error.keyword === "required" && typeof error.params.missingProperty === "string") {
    return `required property "${error.params.missingProperty}" is missing`;
  }
  if (
    error.keyword === "additionalProperties" &&
    typeof error.params.additionalProperty === "string"
  ) {
    return `unknown property "${error.params.additionalProperty}" is not allowed`;
  }
  return error.message ?? `failed ${error.keyword} validation`;
}

function findExecutableContent(value: unknown): ThemeValidationIssue[] {
  const issues: ThemeValidationIssue[] = [];
  const seen = new WeakSet<object>();

  const visit = (candidate: unknown, path: string): void => {
    if (typeof candidate === "string") {
      if (forbiddenStringPatterns.some((pattern) => pattern.test(candidate))) {
        issues.push({
          path,
          keyword: "executable-content",
          message: "executable HTML or script-like content is forbidden",
        });
      }
      return;
    }
    if (!candidate || typeof candidate !== "object") return;
    if (seen.has(candidate)) return;
    seen.add(candidate);

    if (Array.isArray(candidate)) {
      candidate.forEach((entry, index) => visit(entry, `${path}/${index}`));
      return;
    }

    for (const [key, entry] of Object.entries(candidate)) {
      const normalizedKey = key.replace(/[-_.]/g, "").toLowerCase();
      if (forbiddenPropertyNames.has(normalizedKey)) {
        issues.push({
          path: `${path}/${escapeJsonPointer(key)}`,
          keyword: "executable-property",
          message: `executable property "${key}" is forbidden`,
        });
      }
      visit(entry, `${path}/${escapeJsonPointer(key)}`);
    }
  };

  visit(value, "");
  return issues;
}

function escapeJsonPointer(value: string): string {
  return value.replace(/~/g, "~0").replace(/\//g, "~1");
}
