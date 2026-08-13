import { describe, expect, it } from "vitest";

import { baseMainRoomTemplate } from "./baseTemplate";
import { coreTemplateCatalog, coreTemplateCatalogByGroup } from "./coreTemplateCatalog";

describe("Core Cosmos template catalog", () => {
  it("defines one canonical Phase 1 inventory across the visible product layers", () => {
    expect(coreTemplateCatalog.map((entry) => entry.catalogId)).toEqual([
      "cosmos.map",
      "cosmos.node.project-root",
      "cosmos.node.domain",
      "cosmos.node.cluster",
      "cosmos.node.object",
      "cosmos.node.detail",
      "base.room.main",
      "base.door",
      "base.workspace-entry",
      "base.companion",
      "base.decoration",
      "workspace.environment",
      "ui.window",
    ]);
  });

  it("ties every Phase 1 entry to one of the approved visual references", () => {
    expect(
      coreTemplateCatalog.every((entry) =>
        ["CosmosMap.png", "Base.png", "WorkspaceWindow.png"].includes(
          entry.visualReference ?? "",
        ),
      ),
    ).toBe(true);
  });

  it("recognizes Base Room and the clear Node hierarchy as implemented templates", () => {
    const implemented = coreTemplateCatalog.filter(
      (entry) => entry.status === "implemented",
    );

    expect(implemented).toHaveLength(6);
    expect(implemented).toContainEqual(
      expect.objectContaining({
        catalogId: "base.room.main",
        templateId: baseMainRoomTemplate.templateId,
        targetRole: "base-interior",
      }),
    );
    expect(implemented.map((entry) => entry.catalogId)).toEqual(
      expect.arrayContaining([
        "cosmos.node.project-root",
        "cosmos.node.domain",
        "cosmos.node.cluster",
        "cosmos.node.object",
        "cosmos.node.detail",
      ]),
    );
  });

  it("provides stable product groups for Theme Builder navigation", () => {
    expect(coreTemplateCatalogByGroup("cosmos")).toHaveLength(6);
    expect(coreTemplateCatalogByGroup("base")).toHaveLength(5);
    expect(coreTemplateCatalogByGroup("workspace")).toHaveLength(1);
    expect(coreTemplateCatalogByGroup("ui")).toHaveLength(1);
  });
});
