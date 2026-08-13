import { createMemoryHistory } from "vue-router";
import { describe, expect, it } from "vitest";

import { TransitionRuntime } from "../runtime/transitionRuntime";
import {
  createCosmosRouter,
  shouldEnqueueRuntimeTransition,
} from "./index";
import { routeRecords } from "./routes";

describe("Cosmos routing", () => {
  it("resolves the spatial environment hierarchy without page-style feature routes", () => {
    const router = createCosmosRouter({ history: createMemoryHistory() });

    expect(router.resolve({ name: "cosmos" }).path).toBe("/");
    expect(router.resolve({ name: "base" }).path).toBe("/base");
    expect(router.resolve({ name: "room", params: { roomId: "main" } }).path).toBe(
      "/base/rooms/main",
    );
    expect(
      router.resolve({ name: "workspace", params: { workspaceId: "knowledge" } }).path,
    ).toBe("/workspaces/knowledge");
  });

  it("serializes navigation through the shared Shell transition runtime", async () => {
    const transitions = new TransitionRuntime();
    const router = createCosmosRouter({ history: createMemoryHistory(), transitions });
    const kinds: string[] = [];
    const enqueue = transitions.enqueue.bind(transitions);
    transitions.enqueue = (request) => {
      kinds.push(request.kind);
      return enqueue(request);
    };

    await router.push("/base");
    await router.push("/base/rooms/main");

    expect(router.currentRoute.value.meta.environment).toBe("room");
    expect(kinds).toEqual(["environment", "environment"]);
    expect(transitions.active).toBeNull();
  });

  it("returns unknown locations to Cosmos", async () => {
    const router = createCosmosRouter({ history: createMemoryHistory() });

    await router.push("/not-a-cosmos-location");

    expect(router.currentRoute.value.name).toBe("cosmos");
  });

  it("keeps the Base Builder preview isolated from the Base environment route", () => {
    const router = createCosmosRouter({ history: createMemoryHistory() });
    const preview = router.resolve("/dev/base-builder");
    const previewRecord = routeRecords.find(
      (record) => record.name === "dev-base-builder",
    );
    const baseRecord = routeRecords.find((record) => record.name === "base");

    expect(preview.name).toBe("dev-base-builder");
    expect(preview.meta).toMatchObject({
      environment: "development",
      developmentPreview: true,
    });
    expect(previewRecord?.component).not.toBe(baseRecord?.component);
    expect(String(previewRecord?.component)).not.toContain("BaseView");
  });

  it("resolves the Asset Library as a separate isolated development preview", () => {
    const router = createCosmosRouter({ history: createMemoryHistory() });
    const preview = router.resolve("/dev/asset-library");
    const previewRecord = routeRecords.find(
      (record) => record.name === "dev-asset-library",
    );
    const baseBuilderRecord = routeRecords.find(
      (record) => record.name === "dev-base-builder",
    );

    expect(preview.name).toBe("dev-asset-library");
    expect(preview.meta).toMatchObject({
      title: "Asset Library Development Preview",
      environment: "development",
      developmentPreview: true,
    });
    expect(previewRecord?.component).not.toBe(baseBuilderRecord?.component);
    expect(String(previewRecord?.component)).toContain("AssetLibraryView.vue");
  });

  it("exposes the complete Theme Builder V1 as standalone productive routes", () => {
    const router = createCosmosRouter({ history: createMemoryHistory() });
    const expected = [
      ["/theme-builder", "theme-builder", "ThemeBoardView.vue"],
      ["/theme-builder/assets", "theme-builder-assets", "AssetLibraryView.vue"],
      ["/theme-builder/room-shells", "theme-builder-room-shell", "RoomShellStudioView.vue"],
      ["/theme-builder/objects", "theme-builder-object", "ObjectStudioView.vue"],
      ["/theme-builder/looks", "theme-builder-looks", "LooksStudioView.vue"],
      ["/theme-builder/preview", "theme-builder-preview", "ShowcaseView.vue"],
      ["/theme-builder/release", "theme-builder-release", "ReleaseStudioView.vue"],
    ] as const;

    for (const [path, name, componentName] of expected) {
      const resolved = router.resolve(path);
      const record = routeRecords.find((item) => item.name === name);
      expect(resolved.name).toBe(name);
      expect(resolved.meta).toMatchObject({ environment: "development", standaloneExperience: true });
      expect(String(record?.component)).toContain(componentName);
    }
  });

  it("keeps standalone Theme Builder navigation outside runtime environment transitions", () => {
    expect(shouldEnqueueRuntimeTransition({ standaloneExperience: true }, {})).toBe(false);
    expect(shouldEnqueueRuntimeTransition({}, { standaloneExperience: true })).toBe(false);
  });

  it("resolves the Theme Board as an isolated Builder development preview", () => {
    const router = createCosmosRouter({ history: createMemoryHistory() });
    const preview = router.resolve("/dev/theme-board");
    const previewRecord = routeRecords.find(
      (record) => record.name === "dev-theme-board",
    );

    expect(preview.name).toBe("dev-theme-board");
    expect(preview.meta).toMatchObject({
      title: "Theme Board Development Preview",
      environment: "development",
      developmentPreview: true,
    });
    expect(String(previewRecord?.component)).toContain("ThemeBoardView.vue");
  });

  it("resolves the Room Shell Studio with the shared Builder preview boundary", () => {
    const router = createCosmosRouter({ history: createMemoryHistory() });
    const preview = router.resolve("/dev/room-shell-studio");
    const previewRecord = routeRecords.find(
      (record) => record.name === "dev-room-shell-studio",
    );

    expect(preview.name).toBe("dev-room-shell-studio");
    expect(preview.meta).toMatchObject({
      title: "Room Shell Studio Development Preview",
      environment: "development",
      developmentPreview: true,
    });
    expect(String(previewRecord?.component)).toContain("RoomShellStudioView.vue");
  });

  it("resolves the Object Studio with the shared Builder preview boundary", () => {
    const router = createCosmosRouter({ history: createMemoryHistory() });
    const preview = router.resolve("/dev/object-studio");
    const previewRecord = routeRecords.find(
      (record) => record.name === "dev-object-studio",
    );

    expect(preview.name).toBe("dev-object-studio");
    expect(preview.meta).toMatchObject({
      title: "Object Studio Development Preview",
      environment: "development",
      developmentPreview: true,
    });
    expect(String(previewRecord?.component)).toContain("ObjectStudioView.vue");
  });

  it("resolves the Looks Studio with the shared Builder preview boundary", () => {
    const router = createCosmosRouter({ history: createMemoryHistory() });
    const preview = router.resolve("/dev/looks-studio");
    const previewRecord = routeRecords.find(
      (record) => record.name === "dev-looks-studio",
    );

    expect(preview.name).toBe("dev-looks-studio");
    expect(preview.meta).toMatchObject({
      title: "Looks Studio Development Preview",
      environment: "development",
      developmentPreview: true,
    });
    expect(String(previewRecord?.component)).toContain("LooksStudioView.vue");
  });

  it("resolves Showcase with the shared Builder preview boundary", () => {
    const router = createCosmosRouter({ history: createMemoryHistory() });
    const preview = router.resolve("/dev/showcase");
    const previewRecord = routeRecords.find(
      (record) => record.name === "dev-showcase",
    );

    expect(preview.name).toBe("dev-showcase");
    expect(preview.meta).toMatchObject({
      title: "Showcase Development Preview",
      environment: "development",
      developmentPreview: true,
    });
    expect(String(previewRecord?.component)).toContain("ShowcaseView.vue");
  });

  it("resolves Release Studio with the shared Builder preview boundary", () => {
    const router = createCosmosRouter({ history: createMemoryHistory() });
    const preview = router.resolve("/dev/release-studio");
    const previewRecord = routeRecords.find(
      (record) => record.name === "dev-release-studio",
    );

    expect(preview.name).toBe("dev-release-studio");
    expect(preview.meta).toMatchObject({
      title: "Release Studio Development Preview",
      environment: "development",
      developmentPreview: true,
    });
    expect(String(previewRecord?.component)).toContain("ReleaseStudioView.vue");
  });

  it("exposes Theme Library only through the productive /themes route", () => {
    const router = createCosmosRouter({ history: createMemoryHistory() });
    const productive = router.resolve("/themes");
    const productiveRecord = routeRecords.find(
      (record) => record.name === "theme-library",
    );
    expect(productive.name).toBe("theme-library");
    expect(productive.meta).toMatchObject({
      title: "Theme Library",
      environment: "cosmos",
    });
    expect(productive.meta.developmentPreview).not.toBe(true);
    expect(String(productiveRecord?.component)).toContain("ThemeLibraryView.vue");
    expect(routeRecords.some((record) => record.name === "dev-theme-library")).toBe(false);
  });

  it("resolves Base Runtime inside the normal ApplicationShell boundary", () => {
    const router = createCosmosRouter({ history: createMemoryHistory() });
    const baseRuntime = router.resolve("/dev/base-runtime");
    const baseRuntimeRecord = routeRecords.find(
      (record) => record.name === "dev-base-runtime",
    );

    expect(baseRuntime.name).toBe("dev-base-runtime");
    expect(baseRuntime.meta).toMatchObject({
      title: "Base Runtime",
      environment: "base",
    });
    expect(baseRuntime.meta.developmentPreview).not.toBe(true);
    expect(String(baseRuntimeRecord?.component)).toContain("BaseRuntimeView.vue");
  });

  it("resolves the Room Composition Shadow Preview without changing productive Base routes", () => {
    const router = createCosmosRouter({ history: createMemoryHistory() });
    const preview = router.resolve("/dev/room-composition-preview");
    const previewRecord = routeRecords.find(
      (record) => record.name === "dev-room-composition-preview",
    );

    expect(preview.name).toBe("dev-room-composition-preview");
    expect(preview.meta).toMatchObject({
      title: "Room Composition Shadow Preview",
      environment: "base",
    });
    expect(preview.meta.developmentPreview).not.toBe(true);
    expect(String(previewRecord?.component)).toContain("RoomCompositionPreviewView.vue");
    expect(router.resolve("/base").name).toBe("base");
  });

  it("resolves Project Cosmos inside the normal ApplicationShell boundary", () => {
    const router = createCosmosRouter({ history: createMemoryHistory() });
    const projectCosmos = router.resolve("/dev/cosmos-project");
    const projectCosmosRecord = routeRecords.find(
      (record) => record.name === "dev-cosmos-project",
    );

    expect(projectCosmos.name).toBe("dev-cosmos-project");
    expect(projectCosmos.meta).toMatchObject({
      title: "Project Cosmos",
      environment: "cosmos",
    });
    expect(String(projectCosmos.meta.title)).not.toContain("Asteria");
    expect(projectCosmos.meta.developmentPreview).not.toBe(true);
    expect(String(projectCosmosRecord?.component)).toContain("CosmosProjectView.vue");
  });

  it("resolves Global Cosmos inside the normal ApplicationShell boundary", () => {
    const router = createCosmosRouter({ history: createMemoryHistory() });
    const globalCosmos = router.resolve("/dev/cosmos-global");
    const globalCosmosRecord = routeRecords.find(
      (record) => record.name === "dev-cosmos-global",
    );

    expect(globalCosmos.name).toBe("dev-cosmos-global");
    expect(globalCosmos.meta).toMatchObject({
      title: "Global Cosmos View",
      environment: "cosmos",
    });
    expect(globalCosmos.meta.developmentPreview).not.toBe(true);
    expect(String(globalCosmosRecord?.component)).toContain("CosmosGlobalView.vue");
  });

  it("does not enqueue Runtime transitions into or out of the Development Preview", () => {
    expect(
      shouldEnqueueRuntimeTransition(
        { developmentPreview: true },
        { developmentPreview: false },
      ),
    ).toBe(false);
    expect(
      shouldEnqueueRuntimeTransition(
        { developmentPreview: false },
        { developmentPreview: true },
      ),
    ).toBe(false);
    expect(shouldEnqueueRuntimeTransition({}, {})).toBe(true);
  });
});
