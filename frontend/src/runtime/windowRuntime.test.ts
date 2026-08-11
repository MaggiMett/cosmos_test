import { describe, expect, it } from "vitest";

import { WindowRuntime, WindowRuntimeError, capabilitiesFor } from "./windowRuntime";

const environment = {
  objectId: "window.workspace.alpha",
  role: "workspace_environment" as const,
  title: "Alpha Workspace",
  bounds: { x: 0, y: 0, width: 1200, height: 800 },
};

describe("WindowRuntime", () => {
  it("enforces the approved Version 1 capability matrix", () => {
    expect(capabilitiesFor("base_environment")).toMatchObject({
      movable: false,
      resizable: false,
      borderless: true,
      header: false,
    });
    expect(capabilitiesFor("room_environment")).toMatchObject({
      movable: false,
      resizable: false,
      borderless: true,
      header: false,
    });
    expect(capabilitiesFor("workspace_environment")).toMatchObject({
      movable: false,
      resizable: false,
      closable: true,
    });
    expect(capabilitiesFor("tool")).toMatchObject({ movable: true, resizable: true, closable: true });
    expect(capabilitiesFor("tool")).not.toHaveProperty("minimizable");
    expect(capabilitiesFor("tool")).not.toHaveProperty("maximizable");
    expect(capabilitiesFor("tool")).not.toHaveProperty("dockable");
  });

  it("keeps Workspace Environment Windows fixed", () => {
    const runtime = new WindowRuntime();
    runtime.open(environment);

    expect(() => runtime.move(environment.objectId, { x: 10, y: 10 })).toThrowError(
      WindowRuntimeError,
    );
    expect(() => runtime.resize(environment.objectId, { width: 900, height: 600 })).toThrow(
      "not resizable",
    );
  });

  it("moves, resizes, focuses, constrains and closes Tool Windows", () => {
    const runtime = new WindowRuntime();
    runtime.open(environment);
    runtime.open({
      objectId: "window.tool.archive",
      role: "tool",
      title: "Archive",
      bounds: { x: 100, y: 100, width: 500, height: 400 },
      minimumSize: { width: 320, height: 240 },
      parentWindowId: environment.objectId,
    });

    expect(runtime.move("window.tool.archive", { x: 1100, y: 750 }).bounds).toEqual({
      x: 700,
      y: 400,
      width: 500,
      height: 400,
    });
    expect(runtime.resize("window.tool.archive", { width: 400, height: 300 }).bounds).toEqual({
      x: 700,
      y: 400,
      width: 400,
      height: 300,
    });
    expect(runtime.close("window.tool.archive").state).toBe("closed");
    expect(runtime.list().map((window) => window.objectId)).toEqual([environment.objectId]);
  });

  it("requires Surface Windows to belong to another Window", () => {
    const runtime = new WindowRuntime();

    expect(() =>
      runtime.open({
        objectId: "window.surface.menu",
        role: "surface",
        title: "Context menu",
        bounds: { x: 0, y: 0, width: 180, height: 240 },
      }),
    ).toThrow("require a parent");
  });
});
