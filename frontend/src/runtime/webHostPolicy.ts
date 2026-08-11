const DEFAULT_SANDBOX_CAPABILITIES = ["forms", "modals", "popups", "same-origin", "scripts"] as const;

const SANDBOX_TOKENS: Readonly<Record<string, string>> = {
  forms: "allow-forms",
  modals: "allow-modals",
  popups: "allow-popups",
  "same-origin": "allow-same-origin",
  scripts: "allow-scripts",
};

export function resolveWebSandbox(configuration: Record<string, unknown>): string {
  const configured = configuration.sandbox;
  const capabilities = Array.isArray(configured) ? configured : DEFAULT_SANDBOX_CAPABILITIES;
  return capabilities
    .filter((capability): capability is string => typeof capability === "string")
    .map((capability) => SANDBOX_TOKENS[capability])
    .filter((token): token is string => token !== undefined)
    .join(" ");
}
