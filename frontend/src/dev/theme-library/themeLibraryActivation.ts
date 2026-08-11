import { ref, type Ref } from "vue";

import {
  ThemeActivationError,
  type ThemeRuntime,
} from "../../runtime/themeRuntime";
import {
  loadThemeLibrarySnapshot,
  projectThemeLibrarySnapshot,
  type ThemeLibraryPresentation,
} from "./themeLibraryProjection";

export type ThemeLibraryActivationFailureKind =
  | "preflight-rejected"
  | "apply-failed"
  | "rollback-failed"
  | "persistence-failed";

export interface ThemeLibraryActivationFailure {
  readonly kind: ThemeLibraryActivationFailureKind;
  readonly message: string;
}

export interface ThemeLibraryActivationOutcome {
  readonly presentation: ThemeLibraryPresentation;
  readonly failure: Readonly<ThemeLibraryActivationFailure> | null;
}

export type ThemeLibraryActivationRuntime = Pick<
  ThemeRuntime,
  "prepareActivation" | "applyPreparedTheme" | "readSnapshot"
>;

export async function activateThemeInLibrary(
  runtime: ThemeLibraryActivationRuntime,
  themeId: string,
): Promise<Readonly<ThemeLibraryActivationOutcome>> {
  let failure: Readonly<ThemeLibraryActivationFailure> | null = null;

  try {
    const prepared = runtime.prepareActivation(themeId);
    try {
      await runtime.applyPreparedTheme(prepared);
    } catch (error) {
      failure = activationFailure(error, "apply");
    }
  } catch (error) {
    failure = activationFailure(error, "preflight");
  }

  const snapshot = await loadThemeLibrarySnapshot(runtime);
  return Object.freeze({
    presentation: projectThemeLibrarySnapshot(snapshot),
    failure,
  });
}

export interface ThemeLibraryActivationController {
  readonly activatingThemeId: Ref<string | null>;
  readonly activationError: Ref<Readonly<ThemeLibraryActivationFailure> | null>;
  activate(
    themeId: string,
    isAlreadyActive: boolean,
    updatePresentation: (presentation: ThemeLibraryPresentation) => void,
  ): Promise<boolean>;
}

export function useThemeLibraryActivation(
  runtime: ThemeLibraryActivationRuntime,
): ThemeLibraryActivationController {
  const activatingThemeId = ref<string | null>(null);
  const activationError = ref<Readonly<ThemeLibraryActivationFailure> | null>(null);

  async function activate(
    themeId: string,
    isAlreadyActive: boolean,
    updatePresentation: (presentation: ThemeLibraryPresentation) => void,
  ): Promise<boolean> {
    if (isAlreadyActive || activatingThemeId.value !== null) return false;

    activatingThemeId.value = themeId;
    activationError.value = null;
    try {
      const outcome = await activateThemeInLibrary(runtime, themeId);
      updatePresentation(outcome.presentation);
      activationError.value = outcome.failure;
      return outcome.failure === null;
    } catch {
      activationError.value = Object.freeze({
        kind: "apply-failed",
        message: "The Theme Runtime could not be refreshed. Your current library remains available.",
      });
      return false;
    } finally {
      activatingThemeId.value = null;
    }
  }

  return { activatingThemeId, activationError, activate };
}

function activationFailure(
  error: unknown,
  phase: "preflight" | "apply",
): Readonly<ThemeLibraryActivationFailure> {
  if (phase === "preflight") {
    return Object.freeze({
      kind: "preflight-rejected",
      message: "This theme is not ready to activate.",
    });
  }

  if (error instanceof ThemeActivationError && error.code === "rollback_failed") {
    return Object.freeze({
      kind: "rollback-failed",
      message: "The theme could not be activated and the safe theme could not be restored.",
    });
  }

  if (error instanceof ThemeActivationError && error.code === "stale_preparation") {
    return Object.freeze({
      kind: "preflight-rejected",
      message: "The theme changed before activation. Please try again.",
    });
  }

  if (error instanceof ThemeActivationError && error.code === "persistence_failed") {
    return Object.freeze({
      kind: "persistence-failed",
      message: "The theme is active for this session, but the selection could not be saved.",
    });
  }

  return Object.freeze({
    kind: "apply-failed",
    message: "The theme could not be activated. Your previous theme was restored.",
  });
}
