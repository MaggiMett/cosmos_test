import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const viewSource = readFileSync(
  fileURLToPath(new URL("./BaseBuilderView.vue", import.meta.url)),
  "utf8",
);
const appSource = readFileSync(
  fileURLToPath(new URL("../../App.vue", import.meta.url)),
  "utf8",
);

describe("Base Builder development view boundaries", () => {
  it("contains the catalog, canvas, properties and development markings", () => {
    expect(viewSource).toContain("Development Preview");
    expect(viewSource).toContain("Objektkatalog");
    expect(viewSource).toContain('data-testid="builder-room-canvas"');
    expect(viewSource).toContain("Eigenschaften");
    expect(viewSource).toContain("Function Container");
    expect(viewSource).toContain("OverrideBadge");
  });

  it("exposes direct manipulation, history and Test Mode controls", () => {
    expect(viewSource).toContain('data-testid="builder-undo"');
    expect(viewSource).toContain('data-testid="builder-redo"');
    expect(viewSource).toContain("beginObjectPointer");
    expect(viewSource).toContain("beginTransformPointer");
    expect(viewSource).toContain("dropCatalog");
    expect(viewSource).toContain('data-testid="builder-test-mode"');
  });

  it("does not import BaseView, Runtime APIs, persistence or networking", () => {
    expect(viewSource).not.toContain("BaseView");
    expect(viewSource).not.toContain("useCosmosRuntime");
    expect(viewSource).not.toContain("localStorage");
    expect(viewSource).not.toContain("sessionStorage");
    expect(viewSource).not.toContain("fetch(");
    expect(viewSource).not.toContain("/api");
  });

  it("bypasses ApplicationShell only for explicitly marked development routes", () => {
    expect(appSource).toContain('v-if="route.meta.developmentPreview || route.meta.standaloneExperience"');
    expect(appSource).toContain("<ApplicationShell v-else");
    expect(appSource).not.toContain("BaseBuilderView");
  });
});
