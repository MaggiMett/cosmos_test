export type BasePresenter = "legacy" | "new";

/** Only the explicit `legacy` value activates the rollback presenter. */
export function resolveBasePresenter(value: unknown): BasePresenter {
  return value === "legacy" ? "legacy" : "new";
}

export const configuredBasePresenter = resolveBasePresenter(
  import.meta.env.VITE_BASE_PRESENTER,
);
