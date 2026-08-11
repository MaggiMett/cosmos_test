import { ThemeRegistry, type ThemeDefinition } from "./themeRegistry";
import {
  createThemeRuntimeReadSnapshot,
  type ThemeRuntimeReadSnapshot,
} from "./themeRuntimeReadSnapshot";
import type {
  PersistedThemeActivationState,
  ThemeActivationPersistence,
} from "./themeRuntimePersistence";
import { TransitionRuntime } from "./transitionRuntime";

export interface ThemePresenter {
  apply(definition: Readonly<ThemeDefinition>): void | Promise<void>;
}

export interface PreparedThemeActivation {
  readonly themeId: string;
  readonly lastKnownGoodThemeId: string;
}

export interface ActiveThemeCommit {
  readonly activeThemeId: string;
  readonly presentationRevision: number;
}

export type ActiveThemeCommitSubscriber = (
  commit: Readonly<ActiveThemeCommit>,
) => void;

export type ThemeActivationErrorCode =
  | "invalid_preflight"
  | "stale_preparation"
  | "apply_failed"
  | "rollback_failed"
  | "persistence_failed";

export class ThemeActivationError extends Error {
  constructor(
    readonly code: ThemeActivationErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ThemeActivationError";
  }
}

export class DomThemePresenter implements ThemePresenter {
  private appliedTokens = new Set<string>();

  apply(definition: Readonly<ThemeDefinition>): void {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    for (const name of this.appliedTokens) {
      if (!(name in definition.tokens)) root.style.removeProperty(name);
    }
    for (const [name, value] of Object.entries(definition.tokens)) {
      root.style.setProperty(name, value);
    }
    this.appliedTokens = new Set(Object.keys(definition.tokens));
    root.dataset.themeObject = definition.objectId;
  }
}

export class ThemeRuntime {
  private activeDefinition: Readonly<ThemeDefinition> | null = null;
  private lastKnownGoodThemeId: string;
  private presentationRevision = 0;
  private readonly activeThemeSubscribers = new Set<ActiveThemeCommitSubscriber>();

  constructor(
    private readonly registry: ThemeRegistry,
    private readonly transitions: TransitionRuntime,
    private readonly fallbackThemeId: string,
    private readonly presenter: ThemePresenter = new DomThemePresenter(),
    private readonly persistence: ThemeActivationPersistence | null = null,
  ) {
    const fallback = this.registry.resolve(this.fallbackThemeId);
    assertRuntimeReady(fallback);
    this.lastKnownGoodThemeId = fallback.objectId;
  }

  get active(): Readonly<ThemeDefinition> | null {
    return this.activeDefinition;
  }

  readSnapshot(): Readonly<ThemeRuntimeReadSnapshot> {
    return createThemeRuntimeReadSnapshot(
      this.registry.list(),
      this.activeDefinition?.objectId ?? null,
      this.lastKnownGoodThemeId,
      this.fallbackThemeId,
    );
  }

  subscribeActiveTheme(subscriber: ActiveThemeCommitSubscriber): () => void {
    this.activeThemeSubscribers.add(subscriber);
    return () => {
      this.activeThemeSubscribers.delete(subscriber);
    };
  }

  prepareActivation(themeId: string): Readonly<PreparedThemeActivation> {
    const requested = this.registry.resolve(themeId);
    const lastKnownGood = this.registry.resolve(this.lastKnownGoodThemeId);
    assertRuntimeReady(requested);
    assertRuntimeReady(lastKnownGood);

    return Object.freeze({
      themeId: requested.objectId,
      lastKnownGoodThemeId: lastKnownGood.objectId,
    });
  }

  async restoreAtStartup(initialThemeId: string): Promise<Readonly<ThemeDefinition>> {
    let persisted: Readonly<PersistedThemeActivationState> | null = null;
    let persistenceReadFailed = false;
    if (this.persistence) {
      try {
        persisted = await this.persistence.load();
      } catch {
        persistenceReadFailed = true;
      }
    }

    const persistedLastKnownGoodId = this.registeredThemeId(
      persisted?.lastKnownGoodThemeId,
    );
    if (persisted) {
      this.lastKnownGoodThemeId = persistedLastKnownGoodId ?? this.fallbackThemeId;
    }

    const candidateId = persistenceReadFailed
      ? this.fallbackThemeId
      : persisted
        ? (this.registeredThemeId(persisted.activeThemeId) ??
          persistedLastKnownGoodId ??
          this.fallbackThemeId)
        : (this.registeredThemeId(initialThemeId) ?? this.fallbackThemeId);

    try {
      return await this.applyPreparedThemeInternal(
        this.prepareActivation(candidateId),
        !persistenceReadFailed,
      );
    } catch (error) {
      if (this.activeDefinition) return this.activeDefinition;
      if (candidateId !== this.fallbackThemeId) {
        try {
          return await this.applyPreparedThemeInternal(
            this.prepareActivation(this.fallbackThemeId),
            !persistenceReadFailed,
          );
        } catch {
          if (this.activeDefinition) return this.activeDefinition;
        }
      }
      throw error;
    }
  }

  applyPreparedTheme(
    prepared: Readonly<PreparedThemeActivation>,
  ): Promise<Readonly<ThemeDefinition>> {
    return this.applyPreparedThemeInternal(prepared, true);
  }

  private applyPreparedThemeInternal(
    prepared: Readonly<PreparedThemeActivation>,
    persist: boolean,
  ): Promise<Readonly<ThemeDefinition>> {
    const requested = this.registry.resolve(prepared.themeId);
    assertRuntimeReady(requested);

    return this.transitions.enqueue({
      kind: "theme",
      targetId: requested.objectId,
      run: async () => {
        if (prepared.lastKnownGoodThemeId !== this.lastKnownGoodThemeId) {
          throw new ThemeActivationError(
            "stale_preparation",
            `Prepared Theme activation is stale: ${prepared.themeId}`,
          );
        }

        const rollbackDefinition = this.registry.resolve(this.lastKnownGoodThemeId);
        assertRuntimeReady(rollbackDefinition);

        try {
          await this.presenter.apply(requested);
        } catch (applyError) {
          await this.restoreAfterFailedApply(rollbackDefinition, requested, applyError);
        }

        this.commit(requested);
        if (persist) await this.persistCommittedState();
        return requested;
      },
    });
  }

  rollbackToLastKnownGood(): Promise<Readonly<ThemeDefinition>> {
    const lastKnownGood = this.registry.resolve(this.lastKnownGoodThemeId);
    assertRuntimeReady(lastKnownGood);

    return this.transitions.enqueue({
      kind: "theme",
      targetId: lastKnownGood.objectId,
      run: async () => {
        let restored: Readonly<ThemeDefinition>;
        try {
          await this.presenter.apply(lastKnownGood);
          this.commit(lastKnownGood);
          restored = lastKnownGood;
        } catch (error) {
          restored = await this.restoreCoreFallback(lastKnownGood, error);
        }
        await this.persistCommittedState();
        return restored;
      },
    });
  }

  load(objectId: string): Readonly<ThemeDefinition> {
    try {
      return this.registry.resolve(objectId);
    } catch {
      return this.registry.resolve(this.fallbackThemeId);
    }
  }

  activate(objectId: string): Promise<Readonly<ThemeDefinition>> {
    const requested = this.load(objectId);
    return this.transitions.enqueue({
      kind: "theme",
      targetId: requested.objectId,
      run: async () => {
        try {
          await this.presenter.apply(requested);
          this.commit(requested);
          return requested;
        } catch (error) {
          const fallback = this.registry.resolve(this.fallbackThemeId);
          if (requested.objectId === fallback.objectId) throw error;
          await this.presenter.apply(fallback);
          this.commit(fallback);
          return fallback;
        }
      },
    });
  }

  private commit(definition: Readonly<ThemeDefinition>): void {
    this.lastKnownGoodThemeId = definition.objectId;
    this.setActiveDefinition(definition);
  }

  private setActiveDefinition(definition: Readonly<ThemeDefinition>): void {
    const changed = this.activeDefinition?.objectId !== definition.objectId;
    this.activeDefinition = definition;
    if (!changed) return;

    const commit = Object.freeze({
      activeThemeId: definition.objectId,
      presentationRevision: ++this.presentationRevision,
    });
    for (const subscriber of this.activeThemeSubscribers) {
      try {
        subscriber(commit);
      } catch {
        // Runtime commits are authoritative; observers are isolated read boundaries.
      }
    }
  }

  private async restoreAfterFailedApply(
    rollbackDefinition: Readonly<ThemeDefinition>,
    requested: Readonly<ThemeDefinition>,
    applyError: unknown,
  ): Promise<never> {
    try {
      await this.presenter.apply(rollbackDefinition);
      this.setActiveDefinition(rollbackDefinition);
    } catch (rollbackError) {
      await this.restoreCoreFallback(rollbackDefinition, rollbackError);
    }

    await this.persistCommittedState();

    throw new ThemeActivationError(
      "apply_failed",
      `Theme could not be applied and was rolled back: ${requested.objectId}`,
      { cause: applyError },
    );
  }

  private async restoreCoreFallback(
    failedRollback: Readonly<ThemeDefinition>,
    rollbackError: unknown,
  ): Promise<Readonly<ThemeDefinition>> {
    const fallback = this.registry.resolve(this.fallbackThemeId);
    assertRuntimeReady(fallback);
    if (fallback.objectId === failedRollback.objectId) {
      this.activeDefinition = null;
      throw new ThemeActivationError(
        "rollback_failed",
        `Could not restore Core fallback Theme: ${fallback.objectId}`,
        { cause: rollbackError },
      );
    }

    try {
      await this.presenter.apply(fallback);
      this.commit(fallback);
      return fallback;
    } catch (fallbackError) {
      this.activeDefinition = null;
      throw new ThemeActivationError(
        "rollback_failed",
        `Could not restore Core fallback Theme: ${fallback.objectId}`,
        { cause: fallbackError },
      );
    }
  }

  private registeredThemeId(themeId: string | undefined): string | null {
    if (!themeId) return null;
    try {
      return this.registry.resolve(themeId).objectId;
    } catch {
      return null;
    }
  }

  private async persistCommittedState(): Promise<void> {
    if (!this.persistence || !this.activeDefinition) return;
    try {
      await this.persistence.save(
        Object.freeze({
          schemaVersion: 1,
          activeThemeId: this.activeDefinition.objectId,
          lastKnownGoodThemeId: this.lastKnownGoodThemeId,
        }),
      );
    } catch (error) {
      throw new ThemeActivationError(
        "persistence_failed",
        `Theme ${this.activeDefinition.objectId} is active for this session but could not be persisted.`,
        { cause: error },
      );
    }
  }
}

function assertRuntimeReady(definition: Readonly<ThemeDefinition>): void {
  const tokenEntries = Object.entries(definition.tokens);
  const invalid =
    !definition.objectId.trim() ||
    !definition.displayName.trim() ||
    !definition.version.trim() ||
    tokenEntries.length === 0 ||
    tokenEntries.some(([name, value]) => !name.startsWith("--cosmos-") || !value.trim());

  if (invalid) {
    throw new ThemeActivationError(
      "invalid_preflight",
      `Theme is not ready for Runtime activation: ${definition.objectId || "unknown"}`,
    );
  }
}
