import { describe, expect, it } from "vitest";

import { resolveWebSandbox } from "./webHostPolicy";

describe("resolveWebSandbox", () => {
  it("keeps the existing secure default sandbox", () => {
    expect(resolveWebSandbox({})).toBe(
      "allow-forms allow-modals allow-popups allow-same-origin allow-scripts",
    );
  });

  it("maps only known declarative capabilities to iframe tokens", () => {
    expect(resolveWebSandbox({ sandbox: ["scripts", "forms"] })).toBe("allow-scripts allow-forms");
    expect(resolveWebSandbox({ sandbox: ["scripts", "top-navigation"] })).toBe("allow-scripts");
  });

  it("supports a deliberately empty sandbox policy", () => {
    expect(resolveWebSandbox({ sandbox: [] })).toBe("");
  });
});
