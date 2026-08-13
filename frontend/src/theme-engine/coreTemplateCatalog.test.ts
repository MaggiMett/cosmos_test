import { describe, expect, it } from "vitest";

import { baseMainRoomTemplate } from "./baseTemplate";
import { coreTemplateCatalog, coreTemplateCatalogByGroup } from "./coreTemplateCatalog";

describe("Core Cosmos template catalog", () => {
  it("defines one canonical Phase 1 inventory across the visible product layers", () => {
    expect(coreTemplateCatalog.map((entry) => entry.catalogId)).toEqual([
      "cosmos.map",
      "cosmos.node.project",
      "cosmos.node.base",
      "cosmos.node.room",
      "cosmos.node.workspace",
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

  it("recognizes the existing Base Room contract as the first implemented template", () => {
    const implemented = coreTemplateCatalog.filter(
      (entry) => entry.status === "implemented",
    );

    expect(implemented).toHaveLength(1);
    expect(implemented[0]).toMatchObject({
      catalogId: "base.room.main",
      templateId: baseMainRoomTemplate.templateId,
      targetRole: "base-interior",
    });
  });

  it("provides stable product groups for Theme Builder navigation", () => {
    expect(coreTemplateCatalogByGroup("cosmos")).toHaveLength(5);
    expect(coreTemplateCatalogByGroup("base")).toHaveLength(5);
    expect(coreTemplateCatalogByGroup("workspace")).toHaveLength(1);
    expect(coreTemplateCatalogByGroup("ui")).toHaveLength(1);
  });
});
