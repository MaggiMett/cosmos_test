import type { ThemeDefinition } from "./themeRegistry";

export type ThemeRegistryReadStatus = "registered";
export type ThemeRuntimeReadStatus = "active" | "inactive";

export interface ThemeRuntimeReadTheme {
  readonly themeId: string;
  readonly name: string;
  readonly version: string | undefined;
  readonly author: string | undefined;
  readonly description: string | undefined;
  readonly registryStatus: ThemeRegistryReadStatus;
  readonly runtimeStatus: ThemeRuntimeReadStatus;
  readonly isFallback: boolean;
}

export interface ThemeRuntimeReadSnapshot {
  readonly themes: readonly Readonly<ThemeRuntimeReadTheme>[];
  readonly activeThemeId: string | null;
  readonly lastKnownGoodThemeId: string;
  readonly fallbackThemeId: string;
}

export function createThemeRuntimeReadSnapshot(
  definitions: readonly Readonly<ThemeDefinition>[],
  activeThemeId: string | null,
  lastKnownGoodThemeId: string,
  fallbackThemeId: string,
): Readonly<ThemeRuntimeReadSnapshot> {
  const themes = definitions.map((definition) =>
    Object.freeze<ThemeRuntimeReadTheme>({
      themeId: definition.objectId,
      name: definition.displayName,
      version: definition.version || undefined,
      author: definition.author,
      description: definition.description,
      registryStatus: "registered",
      runtimeStatus: definition.objectId === activeThemeId ? "active" : "inactive",
      isFallback: definition.objectId === fallbackThemeId,
    }),
  );

  return Object.freeze({
    themes: Object.freeze(themes),
    activeThemeId,
    lastKnownGoodThemeId,
    fallbackThemeId,
  });
}
