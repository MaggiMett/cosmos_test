import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { compileScript, compileTemplate, parse } from "vue/compiler-sfc";
import { describe, expect, it } from "vitest";

const files = ["./RoomShellStudioView.vue", "./components/ThemeBuilderShell.vue", "./components/StudioRail.vue"] as const;
function sourceFor(path:(typeof files)[number]):string{return readFileSync(fileURLToPath(new URL(path,import.meta.url)),"utf8")}

describe("Room Shell Studio V1",()=>{
  it.each(files)("compiles %s",(path)=>{const source=sourceFor(path);const descriptor=parse(source,{filename:path}).descriptor;if(descriptor.scriptSetup)compileScript(descriptor,{id:`room-v1-${path}`});const template=descriptor.template;expect(template).toBeDefined();if(!template)throw new Error("template missing");expect(compileTemplate({id:`room-v1-${path}`,filename:path,source:template.content}).errors).toEqual([])});
  it("uses the shared interactive Builder shell and real project context",()=>{const source=sourceFor("./RoomShellStudioView.vue");expect(source).toContain('active-studio="room"');expect(source).toContain(':builder-project-id="projectId"');expect(source).toContain("create-room-shell-draft");expect(source).toContain("update-room-shell-draft");expect(source).toContain("remove-room-shell-draft");});
  it("keeps Room Shell authoring draft-only and reuses validated Core geometry",()=>{const source=sourceFor("./RoomShellStudioView.vue");expect(source).toContain("Create from Core structure");expect(source).toContain("validated Core geometry");expect(source).not.toContain("ThemeRuntime");expect(source).not.toContain("fetch(");});
});
