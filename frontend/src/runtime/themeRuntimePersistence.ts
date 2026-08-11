import type { CosmosApiClient } from "./apiClient";

export interface PersistedThemeActivationState {
  readonly schemaVersion: 1;
  readonly activeThemeId: string;
  readonly lastKnownGoodThemeId: string;
}

interface ThemeActivationStateResponse {
  schemaVersion: number;
  activeThemeId: string | null;
  lastKnownGoodThemeId: string | null;
}

export interface ThemeActivationPersistence {
  load(): Promise<Readonly<PersistedThemeActivationState> | null>;
  save(state: Readonly<PersistedThemeActivationState>): Promise<void>;
}

export class ApiThemeActivationPersistence implements ThemeActivationPersistence {
  constructor(private readonly api: CosmosApiClient) {}

  async load(): Promise<Readonly<PersistedThemeActivationState> | null> {
    const result = await this.api.get<ThemeActivationStateResponse>("/runtime-state/theme");
    if (!result.ok) throw new Error(result.error.message);
    const value = result.data;
    if (
      value.schemaVersion === 1 &&
      value.activeThemeId === null &&
      value.lastKnownGoodThemeId === null
    ) {
      return null;
    }
    if (
      value.schemaVersion !== 1 ||
      typeof value.activeThemeId !== "string" ||
      !value.activeThemeId.trim() ||
      typeof value.lastKnownGoodThemeId !== "string" ||
      !value.lastKnownGoodThemeId.trim()
    ) {
      throw new Error("Persisted Theme activation state is invalid.");
    }
    return Object.freeze({
      schemaVersion: 1,
      activeThemeId: value.activeThemeId,
      lastKnownGoodThemeId: value.lastKnownGoodThemeId,
    });
  }

  async save(state: Readonly<PersistedThemeActivationState>): Promise<void> {
    const result = await this.api.put<ThemeActivationStateResponse>("/runtime-state/theme", state);
    if (!result.ok) throw new Error(result.error.message);
  }
}
