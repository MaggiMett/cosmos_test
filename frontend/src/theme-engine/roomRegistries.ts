import type {
  BaseComposition,
  CatalogObject,
  FunctionContainer,
  RoomPreset,
  RoomShell,
} from "./roomCompositionTypes";
import type { VersionedRef } from "./types";
import { cloneAndFreeze } from "./immutable";
import {
  validateBaseComposition,
  validateCatalogObject,
  validateFunctionContainer,
  validateRoomPreset,
  validateRoomShell,
} from "./validation";
import { compareVersions, satisfiesVersionRange } from "./version";

export type RoomRegistryKind =
  | "room-shell"
  | "room-preset"
  | "catalog-object"
  | "function-container"
  | "base-composition";

export class RoomRegistryError extends Error {
  constructor(
    readonly code:
      | "room_registry_duplicate"
      | "room_registry_missing"
      | "room_registry_version_incompatible",
    readonly registryKind: RoomRegistryKind,
    message: string,
  ) {
    super(message);
    this.name = "RoomRegistryError";
  }
}

interface VersionedArtifact {
  readonly version: string;
}

interface RegistryAdapter<T extends VersionedArtifact> {
  kind: RoomRegistryKind;
  identity(value: T): string;
  validate(value: unknown): T;
}

class VersionedRoomRegistry<T extends VersionedArtifact> {
  readonly #entries = new Map<string, Map<string, Readonly<T>>>();

  constructor(private readonly adapter: RegistryAdapter<T>) {}

  register(value: unknown): Readonly<T> {
    const validated = this.adapter.validate(value);
    const id = this.adapter.identity(validated);
    const versions = this.#entries.get(id);
    if (versions?.has(validated.version)) {
      throw new RoomRegistryError(
        "room_registry_duplicate",
        this.adapter.kind,
        `${this.adapter.kind} "${id}@${validated.version}" is already registered`,
      );
    }
    const stored = cloneAndFreeze(validated);
    const next = versions ?? new Map<string, Readonly<T>>();
    next.set(validated.version, stored);
    this.#entries.set(id, next);
    return stored;
  }

  registerMany(values: readonly unknown[]): readonly Readonly<T>[] {
    const validated = values.map((value) => this.adapter.validate(value));
    const batchKeys = new Set<string>();
    for (const value of validated) {
      const id = this.adapter.identity(value);
      const key = `${id}@${value.version}`;
      if (batchKeys.has(key) || this.#entries.get(id)?.has(value.version)) {
        throw new RoomRegistryError(
          "room_registry_duplicate",
          this.adapter.kind,
          `${this.adapter.kind} "${key}" is already registered`,
        );
      }
      batchKeys.add(key);
    }
    return validated.map((value) => this.register(value));
  }

  getExact(id: string, version: string): Readonly<T> {
    const versions = this.#entries.get(id);
    if (!versions) {
      throw new RoomRegistryError(
        "room_registry_missing",
        this.adapter.kind,
        `${this.adapter.kind} "${id}" is not registered`,
      );
    }
    const value = versions.get(version);
    if (!value) {
      throw new RoomRegistryError(
        "room_registry_version_incompatible",
        this.adapter.kind,
        `${this.adapter.kind} "${id}" has no registered version "${version}"`,
      );
    }
    return value;
  }

  resolve(reference: VersionedRef): Readonly<T> {
    const versions = this.#entries.get(reference.id);
    if (!versions) {
      throw new RoomRegistryError(
        "room_registry_missing",
        this.adapter.kind,
        `${this.adapter.kind} "${reference.id}" is not registered`,
      );
    }
    const version = [...versions.keys()]
      .filter((candidate) =>
        satisfiesVersionRange(candidate, reference.versionRange),
      )
      .sort((left, right) => compareVersions(right, left))[0];
    if (!version) {
      throw new RoomRegistryError(
        "room_registry_version_incompatible",
        this.adapter.kind,
        `${this.adapter.kind} "${reference.id}" has no version compatible with "${reference.versionRange}"`,
      );
    }
    return versions.get(version)!;
  }

  has(reference: VersionedRef): boolean {
    try {
      this.resolve(reference);
      return true;
    } catch {
      return false;
    }
  }

  list(): readonly Readonly<T>[] {
    return [...this.#entries.entries()]
      .sort(([left], [right]) => compareText(left, right))
      .flatMap(([, versions]) =>
        [...versions.entries()]
          .sort(([left], [right]) => compareVersions(left, right))
          .map(([, value]) => value),
      );
  }
}

export class RoomShellRegistry extends VersionedRoomRegistry<RoomShell> {
  constructor() {
    super({
      kind: "room-shell",
      identity: (value) => value.shellId,
      validate: validateRoomShell,
    });
  }
}

export class RoomPresetRegistry extends VersionedRoomRegistry<RoomPreset> {
  constructor() {
    super({
      kind: "room-preset",
      identity: (value) => value.presetId,
      validate: validateRoomPreset,
    });
  }
}

export class CatalogObjectRegistry extends VersionedRoomRegistry<CatalogObject> {
  constructor() {
    super({
      kind: "catalog-object",
      identity: (value) => value.catalogObjectId,
      validate: validateCatalogObject,
    });
  }
}

export class FunctionContainerRegistry extends VersionedRoomRegistry<FunctionContainer> {
  constructor() {
    super({
      kind: "function-container",
      identity: (value) => value.containerId,
      validate: validateFunctionContainer,
    });
  }
}

export class BaseCompositionRegistry extends VersionedRoomRegistry<BaseComposition> {
  constructor() {
    super({
      kind: "base-composition",
      identity: (value) => value.baseId,
      validate: validateBaseComposition,
    });
  }
}

export interface RoomCompositionRegistries {
  shells: RoomShellRegistry;
  presets: RoomPresetRegistry;
  catalogObjects: CatalogObjectRegistry;
  functionContainers: FunctionContainerRegistry;
  baseCompositions: BaseCompositionRegistry;
}

export function createRoomCompositionRegistries(): RoomCompositionRegistries {
  return {
    shells: new RoomShellRegistry(),
    presets: new RoomPresetRegistry(),
    catalogObjects: new CatalogObjectRegistry(),
    functionContainers: new FunctionContainerRegistry(),
    baseCompositions: new BaseCompositionRegistry(),
  };
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
