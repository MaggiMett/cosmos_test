export type BaseThemeVisuals = "core" | "theme";

/** Core visuals remain an explicit rollback for the productive Theme path. */
export function resolveBaseThemeVisuals(value: unknown): BaseThemeVisuals {
  return value === "core" ? "core" : "theme";
}

export const configuredBaseThemeVisuals = resolveBaseThemeVisuals(
  import.meta.env.VITE_BASE_THEME_VISUALS,
);
