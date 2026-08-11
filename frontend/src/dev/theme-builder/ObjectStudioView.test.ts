import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { compileScript, compileTemplate, parse } from "vue/compiler-sfc";
import { describe, expect, it } from "vitest";
const files=["./ObjectStudioView.vue","./components/ThemeBuilderShell.vue"] as const;
function sourceFor(path:(typeof files)[number]):string{return readFileSync(fileURLToPath(new URL(path,import.meta.url)),"utf8")}
describe("Object Studio V1",()=>{
  it.each(files)("compiles %s",(path)=>{const source=sourceFor(path);const d=parse(source,{filename:path}).descriptor;if(d.scriptSetup)compileScript(d,{id:`object-v1-${path}`});if(!d.template)throw new Error("template missing");expect(compileTemplate({id:`object-v1-${path}`,filename:path,source:d.template.content}).errors).toEqual([])});
  it("edits real Catalog Object drafts through the shared Builder session",()=>{const source=sourceFor("./ObjectStudioView.vue");expect(source).toContain('active-studio="object"');expect(source).toContain("create-catalog-object-draft");expect(source).toContain("update-catalog-object-draft");expect(source).toContain("remove-catalog-object-draft");expect(source).toContain("cosmosMainRoomCatalogObjects");});
  it("does not create a parallel Runtime or persistence path",()=>{const source=sourceFor("./ObjectStudioView.vue");expect(source).not.toContain("ThemeRuntime");expect(source).not.toContain("localStorage");expect(source).not.toContain("fetch(");});
});
