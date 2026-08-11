import { describe, expect, it } from "vitest";
import { validateThemeBuilderProject, type ThemeBuilderProject } from "../../theme-engine";
import { applyBuilderArtifactDraftCommand } from "./themeBuilderArtifactDrafts";

const baseProject: ThemeBuilderProject = validateThemeBuilderProject({
  schemaVersion:1,builderProjectId:"user.theme-builder-project.test",revision:1,createdAt:"2026-08-10T00:00:00+00:00",updatedAt:"2026-08-10T00:00:00+00:00",
  contractVersions:{themeBuilder:"1.0.0",themeEngine:"1.0.0"},themeId:"user.theme.test",packageId:"user.theme-package.test",name:"Test",description:"",author:"",packageType:"full-theme",themeVersion:"0.1.0",packageVersion:"0.1.0",
  manifestDraft:{schemaVersion:1,themeId:"user.theme.test",version:"0.1.0",displayName:"Test",description:"",packageKind:"full-theme",compatibility:{themeEngine:"^1.0.0",cosmos:"^1.0.0"},groups:[],packRefs:[],tokens:{},systemTerms:{}},
  artifacts:{skinPacks:[],roomShells:[],catalogObjects:[]},assetRefs:[],
});

describe("Theme Builder structure draft commands",()=>{
  it("creates and updates a validated Room Shell without mutating the input",()=>{
    const created=applyBuilderArtifactDraftCommand(baseProject,{type:"create-room-shell-draft",name:"Quiet Room"});
    expect(created).not.toBe(baseProject);expect(baseProject.artifacts.roomShells).toHaveLength(0);expect(created.artifacts.roomShells).toHaveLength(1);
    const shell=created.artifacts.roomShells[0]!;expect(shell.displayName).toBe("Quiet Room");expect(shell.shellId).toMatch(/^user\.room-shell\./);
    const updated=applyBuilderArtifactDraftCommand(created,{type:"update-room-shell-draft",shellId:shell.shellId,displayName:"Quiet Room II",perspectiveProfile:shell.perspectiveProfile});
    expect(updated.artifacts.roomShells[0]!.displayName).toBe("Quiet Room II");
  });
  it("creates and updates a validated Catalog Object from a canonical Core source",()=>{
    const created=applyBuilderArtifactDraftCommand(baseProject,{type:"create-catalog-object-draft",name:"Orbit Object"});
    const object=created.artifacts.catalogObjects[0]!;expect(object.displayName).toBe("Orbit Object");expect(object.catalogObjectId).toMatch(/^user\.catalog-object\./);
    const scale=Math.min(object.scale.maximum,Math.max(object.scale.minimum,object.scale.defaultX));
    const updated=applyBuilderArtifactDraftCommand(created,{type:"update-catalog-object-draft",catalogObjectId:object.catalogObjectId,displayName:"Orbit Object II",scale});
    expect(updated.artifacts.catalogObjects[0]!.displayName).toBe("Orbit Object II");
  });
});
