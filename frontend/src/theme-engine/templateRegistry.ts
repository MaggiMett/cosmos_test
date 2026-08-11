import type { EnvironmentTemplate, ObjectTemplate, VersionedRef } from "./types";
import {
  validateEnvironmentTemplate,
  validateObjectTemplate,
} from "./validation";
import { compareVersions, satisfiesVersionRange } from "./version";

export type RegisteredTemplate = Readonly<ObjectTemplate | EnvironmentTemplate>;

export class TemplateRegistryError extends Error {
  constructor(
    readonly code:
      | "duplicate_template"
      | "invalid_template"
      | "unknown_template"
      | "template_version_mismatch",
    message: string,
  ) {
    super(message);
    this.name = "TemplateRegistryError";
  }
}

export class TemplateRegistry {
  private readonly templates = new Map<string, Map<string, RegisteredTemplate>>();

  register(value: unknown): RegisteredTemplate {
    let template: ObjectTemplate | EnvironmentTemplate;
    try {
      template = isObjectTemplateCandidate(value)
        ? validateObjectTemplate(value)
        : validateEnvironmentTemplate(value);
    } catch (error) {
      if (error instanceof TemplateRegistryError) throw error;
      throw new TemplateRegistryError(
        "invalid_template",
        error instanceof Error ? error.message : "Template validation failed.",
      );
    }

    const versions = this.templates.get(template.templateId) ?? new Map();
    if (versions.has(template.version)) {
      throw new TemplateRegistryError(
        "duplicate_template",
        `Template ${template.templateId}@${template.version} is already registered.`,
      );
    }

    const registered = deepFreeze(template);
    versions.set(registered.version, registered);
    this.templates.set(registered.templateId, versions);
    return registered;
  }

  get(templateId: string, version: string): RegisteredTemplate | undefined {
    return this.templates.get(templateId)?.get(version);
  }

  resolve(templateId: string, version: string): RegisteredTemplate {
    const template = this.get(templateId, version);
    if (!template) {
      throw new TemplateRegistryError(
        "unknown_template",
        `Template ${templateId}@${version} is not registered.`,
      );
    }
    return template;
  }

  resolveRef(reference: VersionedRef): RegisteredTemplate {
    const versions = this.templates.get(reference.id);
    if (!versions) {
      throw new TemplateRegistryError(
        "unknown_template",
        `Template ${reference.id} is not registered.`,
      );
    }

    const compatible = [...versions.values()]
      .filter((template) => satisfiesVersionRange(template.version, reference.versionRange))
      .sort((left, right) => compareVersions(right.version, left.version));
    const resolved = compatible[0];
    if (!resolved) {
      throw new TemplateRegistryError(
        "template_version_mismatch",
        `No version of ${reference.id} satisfies ${reference.versionRange}. Available: ${
          [...versions.keys()].sort(compareVersions).join(", ") || "none"
        }.`,
      );
    }
    return resolved;
  }

  list(templateId?: string): readonly RegisteredTemplate[] {
    const values = templateId
      ? [...(this.templates.get(templateId)?.values() ?? [])]
      : [...this.templates.values()].flatMap((versions) => [...versions.values()]);
    return values.sort(
      (left, right) =>
        left.templateId.localeCompare(right.templateId) ||
        compareVersions(left.version, right.version),
    );
  }
}

function isObjectTemplateCandidate(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    "templateKind" in value &&
    (value as { templateKind?: unknown }).templateKind === "object"
  );
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value as Readonly<T>;
  }
  Object.freeze(value);
  for (const child of Object.values(value)) {
    deepFreeze(child);
  }
  return value as Readonly<T>;
}
