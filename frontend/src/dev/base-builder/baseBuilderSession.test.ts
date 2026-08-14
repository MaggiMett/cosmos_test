import { describe, expect, it } from "vitest";

import {
  validateCatalogObject,
  validateRoomComposition,
  validateRoomPreset,
} from "../../theme-engine/validation";
import type { ObjectInstance } from "../../theme-engine/roomCompositionTypes";
import {
  baseBuilderCatalogObjects,
  baseBuilderCatalogEntries,
  baseBuilderStandardCompositionFixture,
  baseBuilderStandardPresetFixture,
} from "./baseBuilderFixtures";
import { BaseBuilderSession } from "./baseBuilderSession";

describe("isolated Base Builder prototype session", () => {
  it("exports edits through an explicit Base Composition document boundary", () => {
    const session = new BaseBuilderSession();
    const document = session.baseDocument();

    expect(document.activeRoomId).toBe(session.snapshot().composition.roomId);
    expect(document.base.rooms[0]).toEqual(session.snapshot().composition);
    expect(document.base.entryRoomId).toBe(session.snapshot().composition.roomId);
  });

  it("keeps every Builder fixture valid under the production schemas", () => {
    expect(() =>
      baseBuilderCatalogObjects.forEach((object) =>
        validateCatalogObject(object),
      ),
    ).not.toThrow();
    expect(validateRoomPreset(baseBuilderStandardPresetFixture)).toEqual(
      baseBuilderStandardPresetFixture,
    );
    expect(
      validateRoomComposition(baseBuilderStandardCompositionFixture),
    ).toEqual(baseBuilderStandardCompositionFixture);
  });

  it("loads the active Room from a persisted Base document", () => {
    const source = new BaseBuilderSession();
    source.loadEmpty();
    const document = source.baseDocument();
    const session = new BaseBuilderSession();

    session.loadBaseDocument(document);

    expect(session.snapshot().composition).toEqual(document.base.rooms[0]);
    expect(session.snapshot().selectedObjectId).toBeNull();
  });

  it("loads the canonical standard preset with the required functional objects", () => {
    const session = new BaseBuilderSession();
    const state = session.snapshot();
    const families = state.composition.objectInstances.map(
      (instance) => session.catalogObject(instance.catalogObjectRef.id).family,
    );

    expect(families.filter((family) => family === "door")).toHaveLength(2);
    expect(
      families.filter((family) => family === "workspace-furniture"),
    ).toHaveLength(2);
    expect(families).toContain("companion-visual");
    expect(families.filter((family) => family === "light")).toHaveLength(2);
    expect(state.composition.functionContainers).toHaveLength(5);
  });

  it("loads an empty Room without touching the canonical fixture", () => {
    const session = new BaseBuilderSession();
    const before = JSON.stringify(baseBuilderStandardCompositionFixture);

    session.loadEmpty();

    expect(session.snapshot().composition.objectInstances).toEqual([]);
    expect(session.snapshot().composition.functionContainers).toEqual([]);
    expect(JSON.stringify(baseBuilderStandardCompositionFixture)).toBe(before);
  });

  it("places a Catalog Object through semantic floor snapping", () => {
    const session = emptySession();
    const table = catalog(session, "Table");
    const instanceId = session.place(
      table.object.catalogObjectId,
      table.defaultPlacementPoint,
    );

    expect(instanceId).toBeTruthy();
    const instance = session
      .snapshot()
      .composition.objectInstances.find(
        (candidate) => candidate.instanceId === instanceId,
      )!;
    expect(instance.surfaceBinding.surfaceId).toBe("base.surface.floor");
    expect(instance.propertyOverrides.position.mode).toBe("pinned");
  });

  it("does not allow a Door to stand freely on the floor", () => {
    const session = emptySession();
    const door = catalog(session, "Door");
    const preview = session.previewCatalogPlacement(
      door.object.catalogObjectId,
      { x: 800, y: 840 },
    );

    expect(preview.valid).toBe(false);
    expect(preview.message).toBe("Benötigt eine Wand.");
    expect(session.place(door.object.catalogObjectId, { x: 800, y: 840 })).toBe(
      null,
    );
  });

  it("keeps a Door upright while allowing its wall target to change", () => {
    const session = emptySession();
    const door = catalog(session, "Door");
    const instanceId = session.place(
      door.object.catalogObjectId,
      door.defaultPlacementPoint,
    )!;

    expect(session.rotate(instanceId, 15)).toBe(false);
    expect(findInstance(session, instanceId).rotation).toBe(0);
  });

  it("rejects a Wall Light on the floor", () => {
    const session = emptySession();
    const light = catalog(session, "Wall Light");
    const preview = session.previewCatalogPlacement(
      light.object.catalogObjectId,
      { x: 800, y: 850 },
    );

    expect(preview.valid).toBe(false);
    expect(preview.message).toBe("Benötigt eine Wand.");
  });

  it("rejects a Ceiling Light on a wall", () => {
    const session = emptySession();
    const light = catalog(session, "Ceiling Light");
    const preview = session.previewCatalogPlacement(
      light.object.catalogObjectId,
      { x: 800, y: 420 },
    );

    expect(preview.valid).toBe(false);
    expect(preview.message).toBe("Benötigt die Decke.");
  });

  it("keeps a Table locked to the floor and stopped inside the wall span", () => {
    const session = emptySession();
    const table = catalog(session, "Table");
    const instanceId = session.place(
      table.object.catalogObjectId,
      { x: 350, y: 650 },
    )!;
    const instance = findInstance(session, instanceId);
    const size = rectSize(table.object.defaultBounds.visual);

    expect(instance.position.x).toBeGreaterThanOrEqual(320);
    expect(instance.position.y + size.height).toBe(720);
    expect(instance.surfaceBinding.surfaceId).toBe("base.surface.floor");
  });

  it("attaches a Plant to a compatible Shelf anchor", () => {
    const session = emptySession();
    const shelf = catalog(session, "Shelf");
    const plant = catalog(session, "Plant");
    const shelfId = session.place(
      shelf.object.catalogObjectId,
      shelf.defaultPlacementPoint,
    )!;
    const shelfInstance = findInstance(session, shelfId);
    const anchor = shelf.object.attachmentAnchors[0]!;
    const anchorPoint = {
      x: shelfInstance.position.x + anchor.position.x,
      y: shelfInstance.position.y + anchor.position.y,
    };

    const preview = session.previewCatalogPlacement(
      plant.object.catalogObjectId,
      anchorPoint,
    );
    expect(preview.valid).toBe(true);
    expect(preview.parentAttachment).toEqual({
      parentInstanceId: shelfId,
      anchorId: anchor.anchorId,
    });
    expect(preview.message).toBe("Auf Regal befestigt.");
  });

  it("uses hysteresis to retain a previous wall target near a boundary", () => {
    const session = emptySession();
    const light = catalog(session, "Wall Light");
    const first = session.previewCatalogPlacement(
      light.object.catalogObjectId,
      { x: 319, y: 330 },
      "base.surface.left-wall",
    );
    const retained = session.previewCatalogPlacement(
      light.object.catalogObjectId,
      { x: 326, y: 330 },
      "base.surface.left-wall",
    );
    const withoutHistory = session.previewCatalogPlacement(
      light.object.catalogObjectId,
      { x: 326, y: 330 },
    );

    expect(first.targetId).toBe("base.surface.left-wall");
    expect(retained.targetId).toBe("base.surface.left-wall");
    expect(withoutHistory.targetId).toBe("base.surface.rear-wall");
  });

  it("keeps Function Bindings stable when the visual Skin changes", () => {
    const session = new BaseBuilderSession();
    const workspace = findByFamily(session, "workspace-furniture");
    const before = functionFor(session, workspace.instanceId);

    session.changeSkin(workspace.instanceId, {
      id: "dev.skin.builder.warm",
      versionRange: "^1.0.0",
    });

    expect(functionFor(session, workspace.instanceId)).toEqual(before);
    expect(findInstance(session, workspace.instanceId).skinRef.id).toBe(
      "dev.skin.builder.warm",
    );
  });

  it("sets per-property overrides and resets them to the Preset parent", () => {
    const session = new BaseBuilderSession();
    const door = findByFamily(session, "door");

    expect(
      session.move(door.instanceId, { x: 190, y: 505 }),
    ).toBe(true);
    expect(
      findInstance(session, door.instanceId).propertyOverrides.position.mode,
    ).toBe("pinned");
    expect(
      findInstance(session, door.instanceId).propertyOverrides.skin.mode,
    ).toBe("inherit");

    session.resetProperty(door.instanceId, "position");
    expect(
      findInstance(session, door.instanceId).propertyOverrides.position.mode,
    ).toBe("reset-to-parent");
  });

  it("respects pinned and inherited values during a simulated Theme change", () => {
    const session = new BaseBuilderSession();
    const doors = session
      .snapshot()
      .composition.objectInstances.filter(
        (instance) =>
          session.catalogObject(instance.catalogObjectRef.id).family === "door",
      );
    const pinned = doors[0]!;
    const inherited = doors[1]!;

    session.changeSkin(pinned.instanceId, {
      id: "dev.skin.builder.cool",
      versionRange: "^1.0.0",
    });
    session.move(pinned.instanceId, { x: 190, y: 505 });
    const pinnedPosition = findInstance(session, pinned.instanceId).position;
    session.simulateThemeChange();

    expect(findInstance(session, pinned.instanceId).skinRef.id).toBe(
      "dev.skin.builder.cool",
    );
    expect(findInstance(session, pinned.instanceId).position).toEqual(
      pinnedPosition,
    );
    expect(findInstance(session, inherited.instanceId).skinRef.id).toBe(
      "dev.skin.builder.warm",
    );
  });

  it("records every core edit as a local undo/redo transaction", () => {
    const session = emptySession();
    const table = catalog(session, "Table");
    const workspace = catalog(session, "Workspace Furniture");
    const tableId = session.place(
      table.object.catalogObjectId,
      table.defaultPlacementPoint,
    )!;
    expect(session.snapshot().history.undoLabel).toBe("Table platzieren");

    session.move(tableId, { x: 820, y: 650 });
    expect(session.snapshot().history.undoLabel).toBe("Objekt verschieben");
    session.scale(tableId, { x: 1.2, y: 1.2 });
    expect(session.snapshot().history.undoLabel).toBe("Objekt skalieren");
    session.rotate(tableId, 15);
    expect(session.snapshot().history.undoLabel).toBe("Objekt rotieren");
    session.changeSkin(tableId, {
      id: "dev.skin.builder.cool",
      versionRange: "^1.0.0",
    });
    expect(session.snapshot().history.undoLabel).toBe("Skin wechseln");
    const duplicateId = session.duplicate(tableId)!;
    expect(session.snapshot().history.undoLabel).toBe("Objekt duplizieren");
    session.delete(duplicateId);
    expect(session.snapshot().history.undoLabel).toBe("Objekt löschen");

    const workspaceId = session.place(
      workspace.object.catalogObjectId,
      workspace.defaultPlacementPoint,
    )!;
    session.removeFunction(workspaceId);
    expect(session.snapshot().history.undoLabel).toBe(
      "Function Container entfernen",
    );
    expect(session.assignDefaultFunction(workspaceId)).toBe(true);
    expect(session.snapshot().history.undoLabel).toBe(
      "Function Container zuweisen",
    );
    session.resetProperty(workspaceId, "skin");
    expect(session.snapshot().history.undoLabel).toBe("skin zurücksetzen");

    const beforeUndo = JSON.stringify(session.snapshot().composition);
    expect(session.undo()).toBe(true);
    expect(JSON.stringify(session.snapshot().composition)).not.toBe(beforeUndo);
    expect(session.redo()).toBe(true);
    expect(JSON.stringify(session.snapshot().composition)).toBe(beforeUndo);
  });

  it("resets the complete local document to the canonical Preset", () => {
    const session = new BaseBuilderSession();
    const first = session.snapshot().composition.objectInstances[0]!;
    session.delete(first.instanceId);
    expect(session.snapshot().composition.objectInstances).toHaveLength(
      baseBuilderStandardCompositionFixture.objectInstances.length - 1,
    );

    session.resetToPreset();

    expect(session.snapshot().composition.objectInstances).toEqual(
      baseBuilderStandardCompositionFixture.objectInstances,
    );
  });

  it("runs Test Mode and Function previews without Runtime or document mutation", () => {
    const session = new BaseBuilderSession();
    const workspace = findByFamily(session, "workspace-furniture");
    const documentBefore = JSON.stringify(session.snapshot().composition);

    session.setTestMode(true);
    const message = session.testFunction(workspace.instanceId);

    expect(session.snapshot().testMode).toBe(true);
    expect(message).toBe("Würde Knowledge Workspace öffnen.");
    expect(JSON.stringify(session.snapshot().composition)).toBe(documentBefore);
  });
});

function emptySession(): BaseBuilderSession {
  const session = new BaseBuilderSession();
  session.loadEmpty();
  return session;
}

function catalog(session: BaseBuilderSession, label: string) {
  return session.catalog.find((entry) => entry.label === label)!;
}

function findInstance(
  session: BaseBuilderSession,
  instanceId: string,
): ObjectInstance {
  return session
    .snapshot()
    .composition.objectInstances.find(
      (instance) => instance.instanceId === instanceId,
    ) as ObjectInstance;
}

function findByFamily(
  session: BaseBuilderSession,
  family: string,
): ObjectInstance {
  return session
    .snapshot()
    .composition.objectInstances.find(
      (instance) =>
        session.catalogObject(instance.catalogObjectRef.id).family === family,
    ) as ObjectInstance;
}

function functionFor(session: BaseBuilderSession, instanceId: string) {
  return session
    .snapshot()
    .composition.functionContainers.find(
      (container) => container.attachedObjectInstanceId === instanceId,
    );
}

function rectSize(shape: { type: string; width?: number; height?: number }) {
  return { width: shape.width ?? 0, height: shape.height ?? 0 };
}
