import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import {
  cameraAfterPan,
  cameraAfterZoomAtPointer,
  cameraWorldStyle,
  fitCosmosCamera,
} from "./useCosmosCameraPresenter";

describe("Cosmos camera presenter behavior", () => {
  it("projects pan deltas through the current Runtime zoom", () => {
    expect(
      cameraAfterPan(
        { x: 100, y: 50, zoom: 2 },
        {
          pointerId: 1,
          startClientX: 20,
          startClientY: 40,
          startCameraX: 100,
          startCameraY: 50,
        },
        { clientX: 60, clientY: 20 },
      ),
    ).toEqual({ x: 80, y: 60, zoom: 2 });
  });

  it("zooms around the pointer while preserving its world position", () => {
    const camera = { x: 100, y: 50, zoom: 1 };
    const viewport = { left: 0, top: 0, width: 1000, height: 800 };
    const pointer = { clientX: 750, clientY: 500, deltaY: -240 };
    const next = cameraAfterZoomAtPointer(camera, viewport, pointer);
    const cursorX = pointer.clientX - viewport.width / 2;
    const cursorY = pointer.clientY - viewport.height / 2;

    expect(next.zoom).toBeGreaterThan(camera.zoom);
    expect(next.x + cursorX / next.zoom).toBeCloseTo(camera.x + cursorX / camera.zoom);
    expect(next.y + cursorY / next.zoom).toBeCloseTo(camera.y + cursorY / camera.zoom);
  });

  it("reprojects the camera restored by the Runtime snapshot without local state", () => {
    expect(
      cameraWorldStyle(
        { x: 120, y: -80, zoom: 0.5 },
        { width: 1600, height: 1000 },
      ),
    ).toEqual({ transform: "translate(740px, 540px) scale(0.5)" });
  });

  it("uses the existing focus methods for Global and Project Fit", () => {
    const runtime = {
      state: { snapshot: { projects: [{ objectId: "project.real" }] } },
      focusProject: vi.fn(),
      focusCosmos: vi.fn(),
    } as unknown as Parameters<typeof fitCosmosCamera>[0];
    const viewport = { width: 1600, height: 1000 };

    expect(fitCosmosCamera(runtime, null, viewport)).toBe(true);
    expect(runtime.focusCosmos).toHaveBeenCalledWith(viewport);
    expect(fitCosmosCamera(runtime, "project.real", viewport)).toBe(true);
    expect(runtime.focusProject).toHaveBeenCalledWith("project.real", viewport);
    expect(fitCosmosCamera(runtime, "project.removed", viewport)).toBe(false);
  });

  it("persists through CosmosMapRuntime without a camera store or backend client", () => {
    const source = readFileSync(fileURLToPath(new URL("./useCosmosCameraPresenter.ts", import.meta.url)), "utf8");

    expect(source).toContain("runtime.setCamera");
    expect(source).toContain("runtime.persistCamera()");
    expect(source).toContain("runtime.focusCosmos");
    expect(source).toContain("runtime.focusProject");
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("new CosmosMapRuntime");
    expect(source).not.toContain("createStore");
  });
});
