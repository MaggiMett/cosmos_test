import { reactive, readonly, type DeepReadonly } from "vue";

import type { CosmosApiClient } from "./apiClient";
import type { ReadinessResponse } from "./contracts";
import type { ThemeRuntime } from "./themeRuntime";
import type { ThemePackageStartupLoader } from "./themePackageRegistry";

export type ApplicationPhase =
  | "idle"
  | "loading_theme"
  | "checking_backend"
  | "ready"
  | "failed"
  | "stopped";

export interface ApplicationRuntimeState {
  phase: ApplicationPhase;
  error: string | null;
}

export class ApplicationRuntime {
  private readonly mutableState = reactive<ApplicationRuntimeState>({ phase: "idle", error: null });
  private startup: Promise<void> | null = null;

  readonly state: DeepReadonly<ApplicationRuntimeState> = readonly(this.mutableState);

  constructor(
    private readonly api: CosmosApiClient,
    private readonly themes: ThemeRuntime,
    private readonly initialThemeId: string,
    private readonly themePackages: ThemePackageStartupLoader | null = null,
  ) {}

  start(): Promise<void> {
    if (this.mutableState.phase === "ready") return Promise.resolve();
    if (this.startup) return this.startup;

    this.startup = this.runStartup().finally(() => {
      this.startup = null;
    });
    return this.startup;
  }

  stop(): void {
    this.mutableState.phase = "stopped";
    this.mutableState.error = null;
  }

  private async runStartup(): Promise<void> {
    this.mutableState.error = null;
    try {
      this.mutableState.phase = "loading_theme";
      await this.themePackages?.load();
      await this.themes.restoreAtStartup(this.initialThemeId);

      this.mutableState.phase = "checking_backend";
      const readiness = await this.api.get<ReadinessResponse>("/ready");
      if (!readiness.ok) throw new Error(readiness.error.message);
      if (readiness.data.status !== "ready") throw new Error("The Cosmos Runtime is not ready.");

      this.mutableState.phase = "ready";
    } catch (error) {
      this.mutableState.phase = "failed";
      this.mutableState.error = error instanceof Error ? error.message : "Cosmos could not start.";
      throw error;
    }
  }
}
