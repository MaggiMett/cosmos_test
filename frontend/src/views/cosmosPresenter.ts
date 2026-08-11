export type CosmosPresenter = "legacy" | "new";

/**
 * The promoted presenter is the safe default. Only the documented explicit
 * `legacy` value opts into the rollback presenter; unset and invalid values
 * remain on `new`.
 */
export function resolveCosmosPresenter(value: unknown): CosmosPresenter {
  return value === "legacy" ? "legacy" : "new";
}

export const configuredCosmosPresenter = resolveCosmosPresenter(
  import.meta.env.VITE_COSMOS_PRESENTER,
);
