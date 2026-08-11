import { describe, expect, it } from "vitest";
import { validateThemeBuilderProject } from "../../theme-engine";
import { validateThemeBuilderV1 } from "./themeBuilderV1Validation";

function project(){return validateThemeBuilderProject({schemaVersion:1,builderProjectId:"user.theme-builder-project.test",revision:1,createdAt:"2026-08-10T00:00:00+00:00",updatedAt:"2026-08-10T00:00:00+00:00",contractVersions:{themeBuilder:"1.0.0",themeEngine:"1.0.0"},themeId:"user.theme.test",packageId:"user.theme-package.test",name:"Test",description:"",author:"",packageType:"full-theme",themeVersion:"0.1.0",packageVersion:"0.1.0",manifestDraft:{schemaVersion:1,themeId:"user.theme.test",version:"0.1.0",displayName:"Test",description:"",packageKind:"full-theme",compatibility:{themeEngine:"^1.0.0",cosmos:"^1.0.0"},groups:[],packRefs:[],tokens:{},systemTerms:{}},artifacts:{skinPacks:[],roomShells:[],catalogObjects:[]},assetRefs:[]})}

describe("Theme Builder V1 release validation",()=>{
  it("blocks export until at least one Look exists",()=>{const result=validateThemeBuilderV1(project(),[],true);expect(result.ready).toBe(false);expect(result.findings.some((item)=>item.severity==="must-fix")).toBe(true)});
  it("does not invent missing catalog findings when there are no references",()=>{const result=validateThemeBuilderV1(project(),[],false);expect(result.missingAssets).toBe(0);expect(result.unavailableAssets).toBe(0)});
});
