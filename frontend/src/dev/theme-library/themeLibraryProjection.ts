import type { ThemeRuntime } from "../../runtime/themeRuntime";
import type {
  ThemeRuntimeReadSnapshot,
  ThemeRuntimeReadTheme,
} from "../../runtime/themeRuntimeReadSnapshot";

export type ThemeLibraryTone = "cosmos";

export interface ThemeLibraryTheme {
  readonly themeId: string;
  readonly name: string;
  readonly description: string | undefined;
  readonly version: string | undefined;
  readonly author: string | undefined;
  readonly status: "Active" | "Installed";
  readonly registryStatus: "registered";
  readonly isFallback: boolean;
  readonly tone: ThemeLibraryTone;
}

export type ThemeLibraryPresentation =
  | { readonly phase: "loading" }
  | { readonly phase: "error"; readonly message: string }
  | { readonly phase: "empty"; readonly themeCount: 0 }
  | {
      readonly phase: "active-missing";
      readonly themeCount: number;
      readonly activeThemeId: string | null;
    }
  | {
      readonly phase: "success";
      readonly themeCount: number;
      readonly themes: readonly Readonly<ThemeLibraryTheme>[];
      readonly activeTheme: Readonly<ThemeLibraryTheme>;
    };

export async function loadThemeLibrarySnapshot(
  runtime: Pick<ThemeRuntime, "readSnapshot">,
): Promise<Readonly<ThemeRuntimeReadSnapshot>> {
  await Promise.resolve();
  return runtime.readSnapshot();
}

export function projectThemeLibrarySnapshot(
  snapshot: Readonly<ThemeRuntimeReadSnapshot>,
): ThemeLibraryPresentation {
  if (snapshot.themes.length === 0) return { phase: "empty", themeCount: 0 };

  const active = snapshot.themes.find(
    (theme) => theme.themeId === snapshot.activeThemeId && theme.runtimeStatus === "active",
  );
  if (!active) {
    return {
      phase: "active-missing",
      themeCount: snapshot.themes.length,
      activeThemeId: snapshot.activeThemeId,
    };
  }

  const themes = Object.freeze(snapshot.themes.map(projectTheme));
  const activeTheme = themes.find((theme) => theme.themeId === active.themeId);
  if (!activeTheme) {
    return {
      phase: "active-missing",
      themeCount: snapshot.themes.length,
      activeThemeId: snapshot.activeThemeId,
    };
  }

  return {
    phase: "success",
    themeCount: themes.length,
    themes,
    activeTheme,
  };
}

function projectTheme(theme: Readonly<ThemeRuntimeReadTheme>): Readonly<ThemeLibraryTheme> {
  return Object.freeze({
    themeId: theme.themeId,
    name: theme.name,
    description: theme.description,
    version: theme.version,
    author: theme.author,
    status: theme.runtimeStatus === "active" ? "Active" : "Installed",
    registryStatus: theme.registryStatus,
    isFallback: theme.isFallback,
    tone: "cosmos",
  });
}
