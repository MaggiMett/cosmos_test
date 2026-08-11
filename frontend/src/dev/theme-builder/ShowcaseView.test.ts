import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { compileScript, compileTemplate, parse } from "vue/compiler-sfc";
import { describe, expect, it } from "vitest";
const files=["./ShowcaseView.vue","./components/LooksStudioCanvas.vue"] as const;
function sourceFor(path:(typeof files)[number]):string{return readFileSync(fileURLToPath(new URL(path,import.meta.url)),"utf8")}
describe("Showcase V1 draft preview",()=>{
  it.each(files)("compiles %s",(path)=>{const source=sourceFor(path);const d=parse(source,{filename:path}).descriptor;if(d.scriptSetup)compileScript(d,{id:`showcase-v1-${path}`});if(!d.template)throw new Error("template missing");expect(compileTemplate({id:`showcase-v1-${path}`,filename:path,source:d.template.content}).errors).toEqual([])});
  it("projects the real Builder draft without touching ThemeRuntime",()=>{const source=sourceFor("./ShowcaseView.vue");expect(source).toContain('active-studio="showcase"');expect(source).toContain("projectBuilderAssets");expect(source).toContain("resolveSkinDraft");expect(source).toContain("LooksStudioCanvas");expect(source).toContain("isolated Builder Draft preview");expect(source).not.toContain("ThemeRuntime");});
});
