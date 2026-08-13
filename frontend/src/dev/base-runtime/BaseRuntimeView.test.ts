import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { compileScript, compileTemplate, parse } from "vue/compiler-sfc";
import { describe, expect, it } from "vitest";

const files = [
  "./BaseRuntimeView.vue",
  "./components/BaseRuntimeChrome.vue",
  "./components/BaseCompanionPresence.vue",
  "./components/BasePetPresence.vue",
  "./components/BaseRoomScene.vue",
  "./components/RoomCompositionRuntimeScene.vue",
] as const;

function sourceFor(path: (typeof files)[number]): string {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
}

describe("Base Room Runtime visual slice", () => {
  it.each(files)("compiles %s without script or template errors", (path) => {
    const source = sourceFor(path);
    const descriptor = parse(source, { filename: path }).descriptor;
    if (descriptor.scriptSetup) compileScript(descriptor, { id: `base-runtime-${path}` });
    const template = descriptor.template;
    expect(template).toBeDefined();
    if (template === null) throw new Error(`${path} template missing.`);
    const compiled = compileTemplate({
      id: `base-runtime-${path}`,
      filename: path,
      source: template.content,
    });
    expect(compiled.errors).toEqual([]);
  });

  it("reuses Cosmos navigation and excludes Builder infrastructure", () => {
    const combined = files.map(sourceFor).join("\n");
    const chrome = sourceFor("./components/BaseRuntimeChrome.vue");

    expect(chrome).toContain("<CosmosNavigation");
    expect(combined).not.toContain("ThemeBuilderShell");
    expect(combined).not.toContain("StudioRail");
    expect(combined).not.toContain("BuilderTopNavigation");
    expect(combined).not.toContain("themeBuilder.css");
  });

  it("projects real location, Room target and Companion state into existing edge chrome", () => {
    const view = sourceFor("./BaseRuntimeView.vue");
    const chrome = sourceFor("./components/BaseRuntimeChrome.vue");

    expect(view).toContain(':current-location="presentation.currentLocation"');
    expect(view).toContain(':right-neighbor="rightNeighbor"');
    expect(view).toContain("presentation.room.companion");
    expect(chrome).not.toContain("Local · Synced");
    expect(chrome).not.toContain("Quiet mode");
    expect(chrome).not.toContain("roomStatus");
    expect(chrome).toContain("Companion unavailable");
    expect(chrome).toContain(':disabled="!companion"');
    expect(chrome).toContain("@travel=\"$emit('travel-room', $event)\"");
  });

  it("resolves Main and Workshop exclusively from the route query and Base projection", () => {
    const view = sourceFor("./BaseRuntimeView.vue");

    expect(view).toContain("useRoute()");
    expect(view).toContain("route.query.roomId");
    expect(view).toContain("requestedRoomId.value");
    expect(view).toContain('presentation.value.phase === "not-found"');
    expect(view).toContain('return "Room not found"');
    expect(view).not.toContain("ref<string");
    expect(view).not.toContain("selectedRoomId");
  });

  it("keeps Door travel inside the development presenter", () => {
    const view = sourceFor("./BaseRuntimeView.vue");
    const interactions = readFileSync(
      fileURLToPath(new URL("./baseRuntimeInteractions.ts", import.meta.url)),
      "utf8",
    );

    expect(view).toContain("targetRoomId, props.navigationScope");
    expect(interactions).toContain('path: "/dev/base-runtime"');
    expect(interactions).toContain("roomId: room.objectId");
    expect(interactions).not.toContain("room.workshop");
  });

  it("keeps the room primary while rendering only projected Runtime entities", () => {
    const room = sourceFor("./components/BaseRoomScene.vue");

    expect(room).toContain(':data-room-id="room.objectId"');
    expect(room).toContain(':class="`base-room-scene--${room.slug}`"');
    expect(room).toContain('v-if="room.cockpit"');
    expect(room).toContain('v-for="door in room.doorTargets"');
    expect(room).toContain(':data-door-id="door.objectId"');
    expect(room).toContain(':data-target-room-id="door.targetRoomId"');
    expect(room).toContain('v-for="slot in room.workspaceSlots"');
    expect(room).toContain(':data-slot-id="slot.slotObjectId"');
    expect(room).toContain(':data-workspace-id="slot.workspaceObjectId"');
    expect(room).toContain(':companion="room.companion"');
    expect(room).toContain(':pet="room.pet"');
    expect(room).toContain("<button");
    expect(room).toContain("@click=\"door.targetRoomId && $emit('travel-room', door.targetRoomId)\"");
    expect(room).toContain('class="base-room-scene__door-label"');
    expect(room).toContain("{{ door.targetRoomName }}");
    expect(room).toContain("@click=\"slot.occupied && $emit('open-workspace', slot)\"");
    expect(room).toContain(':disabled="!slot.occupied"');
    expect(room).toContain(':aria-pressed="selectedObjectId === slot.slotObjectId"');
    expect(room).toContain("placementClass(slot.placement)");
  });

  it("keeps fixed Workspaces in the Room scene instead of duplicating them as dashboard windows", () => {
    const view = sourceFor("./BaseRuntimeView.vue");
    const room = sourceFor("./components/BaseRoomScene.vue");

    expect(room).toContain('v-for="slot in room.workspaceSlots"');
    expect(room).toContain("@click=\"slot.occupied && $emit('open-workspace', slot)\"");
    expect(room).toContain(':disabled="!slot.occupied"');
    expect(view).not.toContain("<BaseKnowledgeWindow");
    expect(view).not.toContain("<BaseCaptureWindow");
    expect(view).not.toContain("base-runtime-view__knowledge");
    expect(view).not.toContain("base-runtime-view__capture");
  });

  it("uses only existing Router and Runtime interaction paths and remains asset-free", () => {
    const combined = files.map(sourceFor).join("\n");
    const view = sourceFor("./BaseRuntimeView.vue");

    expect(combined).not.toContain("fetch(");
    expect(combined).not.toContain("/api");
    expect(view).toContain("useCosmosRuntime");
    expect(view).toContain("loadBaseRuntimeSnapshot(runtime.base)");
    expect(view).toContain("navigateToBaseRoom(router, runtime.base");
    expect(view).toContain("navigateToBaseWorkspace(router, runtime.base");
    expect(view).toContain('typeof route.query.fromProjectId === "string"');
    expect(view).toContain("runtime.cosmosMap.state.snapshot?.focusedProjectId ?? null");
    expect(view).toContain("navigateFromBase(router, entryProjectId)");
    expect(view).toContain("<CompanionWindowHost");
    expect(view).toContain("companionWindowHost.value?.open()");
    expect(view).toContain("<ObjectInteractionHost");
    expect(view).toContain('openObject(objectId, "details")');
    expect(combined).not.toContain("localStorage");
    expect(combined).not.toContain("sessionStorage");
    expect(combined).not.toContain("<img");
    expect(combined).not.toContain("@pointerdown");
    expect(combined).not.toContain("runtime.transitions");
    expect(combined).not.toContain("CosmosMapRuntime");
    expect(combined).not.toContain("moveNode");
  });

  it("runs Room Composition Shadow diagnostics only after the real Base load", () => {
    const view = sourceFor("./BaseRuntimeView.vue");
    const diagnostics = readFileSync(
      fileURLToPath(new URL("./baseRoomShadowDiagnostics.ts", import.meta.url)),
      "utf8",
    );

    expect(view).toContain("scheduleBaseRoomShadowDiagnostics(runtime.base)");
    expect(view.indexOf("loadBaseRuntimeSnapshot(runtime.base)")).toBeLessThan(
      view.indexOf("scheduleBaseRoomShadowDiagnostics(runtime.base)"),
    );
    expect(diagnostics).toContain('Pick<BaseRuntime, "state">');
    expect(diagnostics).toContain("runBaseMainRoomShadowMode");
    expect(diagnostics).not.toContain("console.");
    expect(diagnostics).not.toContain("runtime.base.select");
    expect(diagnostics).not.toContain("fetch(");
  });

  it("uses Composition as the Base room renderer with safe scene fallback", () => {
    const view = sourceFor("./BaseRuntimeView.vue");
    const gate = readFileSync(
      fileURLToPath(new URL("./baseRoomCompositionPresenter.ts", import.meta.url)),
      "utf8",
    );

    expect(view).not.toContain("configuredBaseRoomRenderer");
    expect(view).not.toContain("VITE_BASE_ROOM_RENDERER");
    expect(view).toContain("resolveBaseRoomCompositionPresenter(");
    expect(view).toContain("compositionResult.value?.status === \"active\"");
    expect(view).toContain("<RoomCompositionRuntimeScene");
    expect(view).toContain("<BaseRoomScene");
    expect(view).toContain("v-else-if=\"presentation.phase === 'success'\"");
    expect(gate).toContain('shadow.parity.status === "blocking-difference"');
    expect(gate).toContain('interactions.parity.status === "blocking-difference"');
    expect(gate).toContain('visualParity.status === "blocking-difference"');
    expect(gate).toContain("validationStatus.valid");
  });

  it("uses Theme visuals as the productive path with Core fallback", () => {
    const view = sourceFor("./BaseRuntimeView.vue");
    expect(view).not.toContain("VITE_BASE_THEME_VISUALS");
    expect(view).not.toContain("configuredBaseThemeVisuals");
    expect(view).toContain('mode: "theme"');
    expect(view).toContain("loadBaseRoomThemePresentation({");
    expect(view).toContain(':theme-presentation="themePresentation"');
    expect(view).toContain(':data-theme-visuals="themePresentation ? \'theme\' : \'core\'"');
  });

  it("refreshes mounted and background-only Base presentation from committed ThemeRuntime state", () => {
    const view = sourceFor("./BaseRuntimeView.vue");

    expect(view).toContain("runtime.themes.subscribeActiveTheme");
    expect(view).toContain("void refreshThemePresentation()");
    expect(view).toContain("onBeforeUnmount");
    expect(view).toContain("unsubscribeActiveTheme?.()");
    expect(view).not.toMatch(/ref<[^>]*activeThemeId/);
    expect(view).not.toContain("Full-App-Restart");
    expect(view).not.toContain("themePackages.load(");
    const subscription = view.slice(
      view.indexOf("runtime.themes.subscribeActiveTheme"),
      view.indexOf("loadBase();"),
    );
    expect(subscription).toContain("refreshThemePresentation");
    expect(subscription).not.toContain("props.backgroundOnly");
    expect(subscription).not.toContain("runtime.base");
    expect(subscription).not.toContain("runtime.application");
  });

  it("mounts exactly one accessible Composition interaction structure", () => {
    const scene = sourceFor("./components/RoomCompositionRuntimeScene.vue");

    expect(scene).toContain("<RoomCompositionShadowRenderer");
    expect(scene).toContain('mode="visual"');
    expect(scene).toContain('v-if="!backgroundOnly"');
    expect(scene).toContain('role="group"');
    expect(scene).toContain('type="button"');
    expect(scene).toContain(':disabled="!target.available"');
    expect(scene).toContain(':aria-label="target.semanticLabel"');
    expect(scene).toContain(':data-focus-order="target.focusOrder"');
    expect(scene).not.toContain("tabindex");
    expect(scene).not.toContain("@keydown");
    expect(scene).not.toContain("@keyup");
    expect(scene).toContain(":focus-visible");
    expect(scene).toContain(".room-composition-runtime-scene__target:disabled span");
    expect(scene).toContain(":deep(.room-composition-renderer__function-label)");
    expect(scene).toContain("display: none");
    expect(scene).toContain("border-style: dashed");
    expect(scene).toContain("opacity: 0.72");
    expect(scene).toContain("opacity: 1");
  });

  it("keeps backgroundOnly Composition aria-hidden, inert and without controls", () => {
    const view = sourceFor("./BaseRuntimeView.vue");
    const scene = sourceFor("./components/RoomCompositionRuntimeScene.vue");

    expect(view).toContain(':background-only="backgroundOnly"');
    expect(scene).toContain(':aria-hidden="backgroundOnly ? \'true\' : undefined"');
    expect(scene).toContain(':inert="backgroundOnly || undefined"');
    expect(scene).toContain('v-if="!backgroundOnly"');
    expect(scene).toContain("pointer-events: none");
    expect(scene).toContain(':presentation="themePresentation"');
  });

  it("forwards Composition Functions only to existing Base presenter actions", () => {
    const view = sourceFor("./BaseRuntimeView.vue");
    const forwarding = readFileSync(
      fileURLToPath(new URL("./baseRoomCompositionInteractions.ts", import.meta.url)),
      "utf8",
    );

    expect(view).toContain("forwardRoomCompositionTarget(target");
    expect(view).toContain("openWorkspace(slot)");
    expect(view).toContain("travelRoom: travelToRoom");
    expect(view).toContain("openCompanion");
    expect(view).toContain("closeBase");
    expect(forwarding).not.toContain("useRouter");
    expect(forwarding).not.toContain("useCosmosRuntime");
    expect(forwarding).not.toContain("fetch(");
  });

  it("reuses the existing ObjectInteractionHost for Composition context menus", () => {
    const view = sourceFor("./BaseRuntimeView.vue");
    const scene = sourceFor("./components/RoomCompositionRuntimeScene.vue");

    expect(scene).toContain("target.bindingKind !== \"workspace\"");
    expect(scene).toContain('target.bindingKind === "base-exit"');
    expect(scene).toContain('emit("open-context-menu", event');
    expect(view).toContain('@open-context-menu="openObjectContextMenu"');
    expect(view).toContain("objectInteractionHost.value");
    expect(view).toContain("?.openContextMenu(objectId");
  });

  it("reuses the server-driven Object Context Menu for Base and Workspace objects", () => {
    const view = sourceFor("./BaseRuntimeView.vue");
    const room = sourceFor("./components/BaseRoomScene.vue");

    expect(room).toContain("@contextmenu.self.prevent");
    expect(room).toContain("room.baseObjectId");
    expect(room).toContain("@contextmenu.prevent.stop");
    expect(room).toContain("slot.workspaceObjectId ?? slot.slotObjectId");
    expect(view).toContain("objectInteractionHost.value");
    expect(view).toContain("?.openContextMenu(objectId");
    expect(view).toContain("x: event.clientX, y: event.clientY");
    expect(view).not.toContain("ContextMenuState");
    expect(view).not.toContain("ObjectAction");
  });

  it("projects the real Pet and preserves the Legacy greeting behavior", () => {
    const pet = sourceFor("./components/BasePetPresence.vue");

    expect(pet).toContain(':data-pet-id="pet.objectId"');
    expect(pet).toContain('`Pet ${pet.displayName}`');
    expect(pet).toContain("const greeting = ref(false)");
    expect(pet).toContain("greetingTimer = setTimeout");
    expect(pet).toContain("}, 1600)");
    expect(pet).toContain("onBeforeUnmount");
    expect(pet).not.toContain("cosmos.entity");
    expect(pet).not.toContain("runtime.");
  });

  it("retains retry and return-to-Cosmos while keeping empty Workspace slots passive", () => {
    const view = sourceFor("./BaseRuntimeView.vue");
    const room = sourceFor("./components/BaseRoomScene.vue");
    const chrome = sourceFor("./components/BaseRuntimeChrome.vue");

    expect(view).toContain('presentation.phase === \'error\'');
    expect(view).toContain('@click="loadBase"');
    expect(view).toContain('@close-base="closeBase"');
    expect(chrome).toContain(':aria-label="returnLabel"');
    expect(chrome).toContain("`Return to ${props.returnProjectName} in Cosmos`");
    expect(view).toContain(':return-project-name="entryProjectName"');
    expect(room).toContain(':disabled="!slot.occupied"');
    expect(room).toContain("Available workspace slot");
    expect(room).not.toContain("Opening Workspace");
  });

  it("keeps keyboard activation native and visually distinguishes focus", () => {
    const room = sourceFor("./components/BaseRoomScene.vue");
    const companion = sourceFor("./components/BaseCompanionPresence.vue");
    const chrome = sourceFor("./components/BaseRuntimeChrome.vue");

    expect(room).toContain('type="button"');
    expect(companion).toContain('type="button"');
    expect(sourceFor("./components/BasePetPresence.vue")).toContain('type="button"');
    expect(room).toContain(":focus-visible");
    expect(companion).toContain(":focus-visible");
    expect(chrome).toContain(":focus-visible");
    expect(`${room}\n${companion}\n${chrome}`).not.toContain("tabindex");
    expect(`${room}\n${companion}\n${chrome}`).not.toContain("@keydown");
  });

  it("reuses the productive Workspace and Window lifecycle rather than duplicating it", () => {
    const view = sourceFor("./BaseRuntimeView.vue");
    const workspaceView = readFileSync(
      fileURLToPath(new URL("../../views/WorkspaceView.vue", import.meta.url)),
      "utf8",
    );
    const companionHost = readFileSync(
      fileURLToPath(new URL("../../components/cosmos/CompanionWindowHost.vue", import.meta.url)),
      "utf8",
    );

    expect(view).toContain("navigateToBaseWorkspace");
    expect(workspaceView).toContain("runtime.workspaces.open");
    expect(workspaceView).toContain("runtime.tools.loadDefinitions()");
    expect(workspaceView).toContain("runtime.tools");
    expect(companionHost).toContain("runtime.windows.open");
    expect(companionHost).toContain("runtime.windows.focus");
    expect(view).not.toContain("runtime.workspaces.open");
    expect(view).not.toContain("runtime.windows.open");
    expect(view).not.toContain("runtime.tools.open");
  });

  it("contains quiet Loading, Error and Empty states", () => {
    const view = sourceFor("./BaseRuntimeView.vue");

    expect(view).toContain("Opening Base");
    expect(view).not.toContain("Base · Runtime");
    expect(view).toContain("Base is unavailable");
    expect(view).toContain("Base is quiet");
    expect(view).toContain("Room not found");
    expect(view).toContain("presentation.phase === 'success'");
  });
});
