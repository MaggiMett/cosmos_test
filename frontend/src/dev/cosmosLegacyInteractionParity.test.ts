import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { compileScript, compileTemplate, parse } from "vue/compiler-sfc";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
}

const globalView = source("./cosmos-global/CosmosGlobalView.vue");
const globalUniverse = source("./cosmos-global/components/GlobalCosmosUniverse.vue");
const projectView = source("./cosmos-project/CosmosProjectView.vue");
const constellation = source("./cosmos-project/components/AsteriaConstellation.vue");
const quickTravelPath = "../components/cosmos/CosmosQuickTravel.vue";
const quickTravel = source(quickTravelPath);
const contextMenu = source("../components/windows/ContextMenu.vue");
const interactionHost = source("../components/windows/ObjectInteractionHost.vue");

describe("Cosmos interaction contract", () => {
  it("compiles the shared Quick Travel surface", () => {
    const descriptor = parse(quickTravel, { filename: quickTravelPath }).descriptor;
    compileScript(descriptor, { id: "cosmos-quick-travel" });
    if (!descriptor.template) throw new Error("Quick Travel template missing.");
    expect(compileTemplate({
      id: "cosmos-quick-travel",
      filename: quickTravelPath,
      source: descriptor.template.content,
    }).errors).toEqual([]);
  });

  it("uses one Quick Travel component in Global and Project presenters", () => {
    expect(globalView).toContain("<CosmosQuickTravel");
    expect(projectView).toContain("<CosmosQuickTravel");
    expect(quickTravel).toContain('aria-label="Quick Travel"');
    expect(quickTravel).toContain('v-for="project in projects"');
    expect(quickTravel).toContain("$emit('travel-global')");
    expect(quickTravel).toContain("$emit('travel-project', project.objectId)");
  });

  it("keeps Quick Travel keyboard-accessible with native controls and current location", () => {
    expect(quickTravel).toContain('type="button"');
    expect(quickTravel).toContain(':aria-current="focusedProjectId === null"');
    expect(quickTravel).toContain(':aria-current="focusedProjectId === project.objectId"');
    expect(quickTravel).toContain('aria-label="Close Quick Travel"');
    expect(quickTravel).toContain(":focus-visible");
  });

  it("opens Global Project and Project Node menus through the canonical interaction host", () => {
    expect(globalUniverse).toContain("@contextmenu.prevent.stop");
    expect(globalView).toContain("host.openContextMenu(projectId");
    expect(constellation.match(/@contextmenu\.prevent\.stop/gu)).toHaveLength(2);
    expect(projectView).toContain("host.openContextMenu(objectId");
    expect(`${globalView}\n${projectView}`).toContain("runtime.cosmosMap.persistSelection()");
    expect(`${globalView}\n${projectView}`).not.toContain("const actions =");
  });

  it("retains server-driven Context Menu actions and their existing canonical destinations", () => {
    expect(interactionHost).toContain("runtime.objectInteractions.showContextMenu");
    expect(interactionHost).toContain('action.id === "open_workspace"');
    expect(interactionHost).toContain('router.push(`/workspaces/${menu.objectId}`)');
    expect(interactionHost).toContain('action.id === "appearance"');
    expect(interactionHost).toContain('action.id === "connections"');
    expect(interactionHost).toContain('action.id === "open"');
    expect(interactionHost).toContain("runtime.objectInteractions.openObject");
  });

  it("retains Context Menu focus, menu semantics and Escape handling", () => {
    expect(contextMenu).toContain('role="menu"');
    expect(contextMenu).toContain('role="menuitem"');
    expect(contextMenu).toContain('event.key === "Escape"');
    expect(contextMenu).toContain('querySelector<HTMLButtonElement>("button")?.focus()');
  });

  it("uses existing Base and Companion destinations without new routes or Runtime state", () => {
    const newPresenters = `${globalView}\n${projectView}`;
    expect(newPresenters).toContain("navigateToBase(router)");
    expect(newPresenters).toContain("<CompanionWindowHost");
    expect(newPresenters).toContain("companionWindowHost.value?.open()");
    expect(newPresenters).not.toContain("createStore");
    expect(newPresenters).not.toContain("new CosmosMapRuntime");
  });
});
