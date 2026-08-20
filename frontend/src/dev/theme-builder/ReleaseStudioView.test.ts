import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { compileScript, compileTemplate, parse } from "vue/compiler-sfc";
import { describe, expect, it } from "vitest";
const files=["./ReleaseStudioView.vue","./components/ReleasePackHero.vue","./components/ReleaseContentGrid.vue","./components/ReleaseValidationGrid.vue","./components/ReleaseNotesPanel.vue"] as const;
function sourceFor(path:(typeof files)[number]):string{return readFileSync(fileURLToPath(new URL(path,import.meta.url)),"utf8")}
describe("Release Studio V1",()=>{
  it.each(files)("compiles %s",(path)=>{const source=sourceFor(path);const d=parse(source,{filename:path}).descriptor;if(d.scriptSetup)compileScript(d,{id:`release-v1-${path}`});if(!d.template)throw new Error("template missing");expect(compileTemplate({id:`release-v1-${path}`,filename:path,source:d.template.content}).errors).toEqual([])});
  it("uses real draft counts and validation",()=>{const source=sourceFor("./ReleaseStudioView.vue");expect(source).toContain("validateThemeBuilderV1");expect(source).toContain("Room Shells");expect(source).toContain("Catalog Objects");expect(source).toContain("Looks");expect(source).toContain("Assets");});
  it("exports only through the package endpoint after save and validation",()=>{const source=sourceFor("./ReleaseStudioView.vue");const notes=sourceFor("./components/ReleaseNotesPanel.vue");expect(source).toContain("themeBuilderProjectApi.exportPackage(projectId.value)");expect(notes).toContain("Export Theme Pack");expect(notes).toContain(':disabled="!ready || dirty || exporting"');expect(notes).not.toContain("Activate");});
  it("provides actionable validation and explicit export completion feedback",()=>{const source=sourceFor("./ReleaseStudioView.vue");const validation=sourceFor("./components/ReleaseValidationGrid.vue");expect(validation).toContain("emit('open', item)");expect(source).toContain("openValidationTarget");expect(source).toContain("Theme Pack exported");expect(source).toContain("Export failed");expect(source).toContain("Try again");});
});
