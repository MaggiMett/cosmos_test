import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const adapterSource = readFileSync(fileURLToPath(new URL("./toolAdapters.ts", import.meta.url)), "utf8");
const workspaceSource = readFileSync(fileURLToPath(new URL("../views/WorkspaceView.vue", import.meta.url)), "utf8");

describe("Tool renderer adapters", () => {
  it("owns native core component registration outside WorkspaceView", () => {
    expect(adapterSource).toContain('"@cosmos/frontend-runtime:archive": ArchiveTool');
    expect(adapterSource).toContain('"@cosmos/frontend-runtime:capture": CaptureTool');
    expect(adapterSource).toContain('"@cosmos/frontend-runtime:files": FilesTool');
    expect(adapterSource).toContain('"@cosmos/frontend-runtime:journeyman": JourneymanTool');
    expect(adapterSource).toContain('"@cosmos/frontend-runtime:review": ReviewTool');
    expect(adapterSource).toContain("definition.entryPoint");
  });

  it("keeps WorkspaceView independent of concrete core tool components", () => {
    expect(workspaceSource).toContain("runtime.toolRenderers.resolve(instance.definition)");
    expect(workspaceSource).not.toContain("ArchiveTool");
    expect(workspaceSource).not.toContain("CaptureTool");
    expect(workspaceSource).not.toContain("FilesTool");
    expect(workspaceSource).not.toContain("JourneymanTool");
    expect(workspaceSource).not.toContain("ReviewTool");
    expect(workspaceSource).not.toContain("toolComponents");
  });
});
