import { describe, expect, it } from "vitest";

import type { ThemeBuilderProject } from "../../theme-engine";
import { projectContinueWorking, projectThemeCoverage } from "./themeBoardProjection";

describe("real Theme Board projection", () => {
  it("derives coverage only from actual artifact collections", () => {
    const project = {
      name: "Real Draft",
      revision: 4,
      artifacts: {
        skinPacks: [{ skins: [{ materials: [{ channelId: "surface", parameters: {} }], animations: [] }] }],
        roomShells: [],
        catalogObjects: [{}],
      },
      assetRefs: [],
    } as unknown as Readonly<ThemeBuilderProject>;

    expect(projectThemeCoverage(project)).toEqual([
      { label: "Looks · 1", icon: "spark", status: "custom" },
      { label: "Rooms · 0", icon: "room", status: "fallback" },
      { label: "Objects · 1", icon: "object", status: "custom" },
      { label: "Materials · 1", icon: "material", status: "custom" },
      { label: "Motion · 0", icon: "motion", status: "fallback" },
      { label: "Assets · 0", icon: "window", status: "fallback" },
    ]);
    expect(projectContinueWorking(project, false)[0]?.state).toBe("Saved revision 4");
  });
});
