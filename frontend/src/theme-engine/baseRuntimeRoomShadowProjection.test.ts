import { describe, expect, it } from "vitest";

import type {
  BaseObjectSummary,
  BaseRoom,
  BaseSnapshot,
  WorkspaceSlot,
} from "../runtime/baseRuntime";
import { deepClone } from "./immutable";
import { compareLegacyBaseToRoomSnapshot } from "./roomParity";
import {
  compareBaseRuntimeRoomShadowProjection,
  projectBaseRoomToRoomCompositionShadow,
  projectBaseMainRoomToRoomCompositionShadow,
} from "./baseRuntimeRoomShadowProjection";
import { runBaseMainRoomShadowMode, runBaseRoomShadowMode } from "./roomShadowMode";
import type { ImmutableRoomSnapshot } from "./roomSnapshotResolver";

describe("real Base Main Room Room-Composition Shadow projection", () => {
  it("projects a real Workshop through the same resolver and parity path", () => {
    const value = snapshot();
    value.rooms[1]!.workspaceSlots = [
      workspaceSlot(
        "runtime.slot.workshop.1",
        "left_rear",
        null,
      ),
      workspaceSlot("runtime.slot.workshop.2", "left_front", null),
      workspaceSlot("runtime.slot.workshop.3", "right_rear", null),
      workspaceSlot("runtime.slot.workshop.4", "right_front", null),
    ];
    const projection = projectBaseRoomToRoomCompositionShadow(
      value,
      "runtime.room.workshop",
    );
    const result = runBaseRoomShadowMode({
      baseSnapshot: value,
      roomId: "runtime.room.workshop",
    });

    expect(projection.source).toMatchObject({
      roomId: "runtime.room.workshop",
      roomName: "Workshop",
      petId: null,
    });
    expect(result.snapshot.roomId).toBe("runtime.room.workshop");
    expect(result.parity.status).toBe("equal");
    expect(result.runtimeBindings?.filter((binding) => binding.kind === "workspace")).toHaveLength(4);
    expect(result.runtimeBindings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "workspace",
        workspaceSlotId: "runtime.slot.workshop.1",
        workspaceId: null,
      }),
      expect.objectContaining({
        kind: "room-transition",
        targetRoomId: "runtime.room.main",
      }),
      expect.objectContaining({ kind: "base-exit" }),
    ]));
    expect(result.runtimeBindings?.some((binding) => binding.kind === "companion")).toBe(false);
  });

  it("projects the authoritative Main Room through the existing Shadow path", () => {
    const result = runBaseMainRoomShadowMode({ baseSnapshot: snapshot() });

    expect(result.authoritativeRuntime).toBe("base-runtime");
    expect(result.snapshot.roomId).toBe("runtime.room.main");
    expect(result.runtimeReference).toMatchObject({
      baseObjectId: "runtime.base.home",
      roomId: "runtime.room.main",
      roomName: "Main Room",
    });
    expect(result.parity.status).toBe("equal");
    expect(result.parity.comparedFunctionalObjects).toBe(5);
  });

  it("preserves real Workspace Slot and target IDs without fixture identities", () => {
    const result = runBaseMainRoomShadowMode({ baseSnapshot: snapshot() });

    expect(result.runtimeBindings?.filter((entry) => entry.kind === "workspace")).toEqual([
      expect.objectContaining({
        objectInstanceId: "runtime.slot.knowledge",
        workspaceSlotId: "runtime.slot.knowledge",
        workspaceId: "runtime.workspace.knowledge",
        functionContainerRole: "knowledge-workspace",
      }),
      expect.objectContaining({
        objectInstanceId: "runtime.slot.creation",
        workspaceSlotId: "runtime.slot.creation",
        workspaceId: "runtime.workspace.creation",
        functionContainerRole: "creation-workspace",
      }),
    ]);
    expect(result.runtimeBindings?.filter((entry) => entry.kind === "workspace")).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ targetObjectId: expect.anything() }),
      ]),
    );
    expect(result.snapshot.objectInstances.map((entry) => entry.instanceId)).not.toEqual(
      expect.arrayContaining([
        "core.scene.base.left-workspace",
        "core.scene.base.right-workspace",
      ]),
    );
  });

  it("preserves the real Door and destination Room IDs as a read-only connection", () => {
    const result = runBaseMainRoomShadowMode({ baseSnapshot: snapshot() });

    expect(result.runtimeBindings).toContainEqual(
      expect.objectContaining({
        kind: "room-transition",
        doorId: "runtime.door.main-workshop",
        targetRoomId: "runtime.room.workshop",
        functionContainerRole: "room-transition",
      }),
    );
    expect(result.snapshot.roomConnections).toEqual([
      expect.objectContaining({
        fromRoomId: "runtime.room.main",
        toRoomId: "runtime.room.workshop",
        visualObjectInstanceIds: ["runtime.door.main-workshop"],
      }),
    ]);
  });

  it("retains the contract-relevant Companion and records the non-composition Pet", () => {
    const result = runBaseMainRoomShadowMode({ baseSnapshot: snapshot() });

    expect(result.runtimeReference).toMatchObject({
      petId: "runtime.pet.resident",
    });
    expect(result.snapshot.objectInstances.map((entry) => entry.instanceId)).toContain(
      "runtime.companion.guide",
    );
    expect(result.snapshot.objectInstances.map((entry) => entry.instanceId)).not.toContain(
      "runtime.pet.resident",
    );
    expect(result.runtimeBindings).toContainEqual(
      expect.objectContaining({
        kind: "companion",
        companionId: "runtime.companion.guide",
        functionContainerRole: "companion-interaction",
      }),
    );
  });

  it("projects Foreground and Ambient as passive presentation Surfaces", () => {
    const result = runBaseMainRoomShadowMode({ baseSnapshot: snapshot() });
    const foreground = result.snapshot.surfaces.find(
      (surface) => surface.surfaceId === "base.surface.foreground",
    );
    const ambient = result.snapshot.surfaces.find(
      (surface) => surface.surfaceId === "base.surface.ambient",
    );

    expect(foreground).toMatchObject({
      surfaceKind: "architecture",
      layerBandId: "foreground",
      pointerPolicy: "passive",
    });
    expect(ambient).toMatchObject({
      surfaceKind: "architecture",
      layerBandId: "ambient-front",
      pointerPolicy: "passive",
    });
    expect(result.snapshot.shell.placementSurfaces.map((surface) => surface.surfaceId)).not.toEqual(
      expect.arrayContaining(["base.surface.foreground", "base.surface.ambient"]),
    );
    expect(result.snapshot.functionContainers.some((container) =>
      ["base.surface.foreground", "base.surface.ambient"].includes(
        container.attachedObjectInstanceId,
      ),
    )).toBe(false);
    expect(foreground).not.toHaveProperty("interactionBounds");
    expect(foreground).not.toHaveProperty("functionBinding");
    expect(ambient).not.toHaveProperty("interactionBounds");
    expect(ambient).not.toHaveProperty("functionBinding");
  });

  it("keeps existing Function Container roles, Bounds, layers and Core fallbacks", () => {
    const result = runBaseMainRoomShadowMode({ baseSnapshot: snapshot() });
    const roles = result.snapshot.functionContainers.map(
      (container) => container.descriptorRole,
    );

    expect(roles.filter((role) => role === "workspace.open")).toHaveLength(2);
    expect(roles).toEqual(
      expect.arrayContaining([
        "workspace.open",
        "base.open",
        "companion.open",
        "base.close",
      ]),
    );
    expect(result.snapshot.objectInstances.every(
      (object) => object.propertyResolution.skin.source === "core-default",
    )).toBe(true);
    expect(result.parity.status).toBe("equal");
  });

  it("preserves an unavailable Workspace target as null instead of inventing one", () => {
    const value = snapshot();
    value.rooms[0]!.workspaceSlots[1]!.workspace = null;

    const result = runBaseMainRoomShadowMode({ baseSnapshot: value });

    expect(result.runtimeBindings).toContainEqual(
      expect.objectContaining({
        workspaceSlotId: "runtime.slot.creation",
        workspaceId: null,
      }),
    );
    expect(result.parity.status).toBe("equal");
  });

  it("uses the existing compatible-difference class for presentation-only Skin changes", () => {
    const projection = projectBaseMainRoomToRoomCompositionShadow(snapshot());
    const result = runBaseMainRoomShadowMode({
      baseSnapshot: snapshot(),
      skins: {
        activeThemeId: "runtime.theme.test",
        availableSkins: [
          { skinId: "core.skin.base.default", version: "1.0.0" },
          { skinId: "runtime.skin.test", version: "1.0.0" },
        ],
        assignments: projection.compatibility.catalogObjects.map((object) => ({
          assignmentId: `runtime.assignment.${object.catalogObjectId}`,
          targetCatalogObjectId: object.catalogObjectId,
          skinRef: { id: "runtime.skin.test", versionRange: "^1.0.0" },
          source: "active-theme" as const,
        })),
      },
    });

    expect(result.parity.status).toBe("compatible-difference");
    expect(result.parity.differences.every(
      (difference) => difference.category === "skin",
    )).toBe(true);
  });

  it("uses blocking-difference for a missing function or wrong Workspace target", () => {
    const projection = projectBaseMainRoomToRoomCompositionShadow(snapshot());
    const result = runBaseMainRoomShadowMode({ baseSnapshot: snapshot() });
    const missing = deepClone(result.snapshot) as ImmutableRoomSnapshot;
    missing.functionContainers = missing.functionContainers.filter(
      (container) => container.attachedObjectInstanceId !== "runtime.slot.knowledge",
    );
    const missingStructural = compareLegacyBaseToRoomSnapshot(
      projection.compatibility,
      missing,
    );
    expect(
      compareBaseRuntimeRoomShadowProjection(
        projection,
        missing,
        missingStructural,
      ).status,
    ).toBe("blocking-difference");

    const wrongTarget = deepClone(projection);
    const workspace = (wrongTarget.runtimeBindings as unknown as Array<{
      kind: string;
      workspaceId: string | null;
    }>).find(
      (binding) => binding.kind === "workspace",
    )!;
    workspace.workspaceId = "runtime.workspace.wrong";
    const wrongTargetParity = compareBaseRuntimeRoomShadowProjection(
      wrongTarget,
      result.snapshot,
      compareLegacyBaseToRoomSnapshot(wrongTarget.compatibility, result.snapshot),
    );
    expect(wrongTargetParity.status).toBe("blocking-difference");
    expect(wrongTargetParity.differences).toEqual([
      expect.objectContaining({ category: "workspace-assignment" }),
    ]);
  });

  it("blocks wrong Room targets and Door or Companion identities", () => {
    const source = projectBaseMainRoomToRoomCompositionShadow(snapshot());
    const result = runBaseMainRoomShadowMode({ baseSnapshot: snapshot() });

    for (const [field, value, category] of [
      ["targetRoomId", "runtime.room.wrong", "room-transition"],
      ["doorId", "runtime.door.wrong", "room-transition"],
      ["companionId", "runtime.companion.wrong", "companion"],
    ] as const) {
      const altered = deepClone(source);
      const binding = (altered.runtimeBindings as unknown as Array<Record<string, unknown>>)
        .find((candidate) => field === "companionId"
          ? candidate.kind === "companion"
          : candidate.kind === "room-transition")!;
      binding[field] = value;
      const parity = compareBaseRuntimeRoomShadowProjection(
        altered,
        result.snapshot,
        compareLegacyBaseToRoomSnapshot(altered.compatibility, result.snapshot),
      );

      expect(parity.status).toBe("blocking-difference");
      expect(parity.differences).toContainEqual(
        expect.objectContaining({ category }),
      );
    }
  });

  it("classifies passive presentation differences with existing compatible rules", () => {
    const projection = projectBaseMainRoomToRoomCompositionShadow(snapshot());
    const result = runBaseMainRoomShadowMode({ baseSnapshot: snapshot() });
    const altered = deepClone(result.snapshot) as ImmutableRoomSnapshot;
    altered.surfaces = altered.surfaces.filter(
      (surface) => surface.surfaceId !== "base.surface.foreground",
    );
    const structural = compareLegacyBaseToRoomSnapshot(
      projection.compatibility,
      altered,
    );
    const parity = compareBaseRuntimeRoomShadowProjection(
      projection,
      altered,
      structural,
    );

    expect(parity.status).toBe("compatible-difference");
    expect(parity.differences).toEqual([
      expect.objectContaining({
        category: "decoration",
        legacyId: "base.surface.foreground",
      }),
    ]);
  });

  it("maps an additional real Workspace Slot through a stable compatibility template", () => {
    const value = snapshot();
    value.rooms[0]!.workspaceSlots.push(
      workspaceSlot("runtime.slot.extra", "center", "runtime.workspace.extra"),
    );

    const result = runBaseMainRoomShadowMode({ baseSnapshot: value });

    expect(result.parity.status).toBe("equal");
    expect(result.runtimeBindings).toContainEqual(
      expect.objectContaining({
        kind: "workspace",
        workspaceSlotId: "runtime.slot.extra",
        workspaceId: "runtime.workspace.extra",
      }),
    );
  });

  it("does not mutate the authoritative Base Snapshot", () => {
    const value = snapshot();
    const before = JSON.stringify(value);

    const result = runBaseMainRoomShadowMode({ baseSnapshot: value });

    expect(JSON.stringify(value)).toBe(before);
    expect(Object.isFrozen(value)).toBe(false);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.snapshot.surfaces)).toBe(true);
    expect(Object.isFrozen(result.snapshot.surfaces[0])).toBe(true);
    expect(Object.isFrozen(result.runtimeBindings)).toBe(true);
    expect(result).not.toHaveProperty("writeBack");
    expect(result).not.toHaveProperty("persist");
  });
});

function snapshot(): BaseSnapshot {
  return {
    base: summary("runtime.base.home", "Home Base", ["Base"]),
    rooms: [
      room("runtime.room.main", "Main Room", "main", [
        workspaceSlot(
          "runtime.slot.knowledge",
          "rear_left",
          "runtime.workspace.knowledge",
        ),
        workspaceSlot(
          "runtime.slot.creation",
          "rear_right",
          "runtime.workspace.creation",
        ),
      ]),
      room("runtime.room.workshop", "Workshop", "workshop", []),
    ],
    door: {
      ...summary("runtime.door.main-workshop", "Workshop Door", ["Door"]),
      roomAId: "runtime.room.main",
      roomBId: "runtime.room.workshop",
    },
    cockpit: {
      ...summary("runtime.cockpit.main", "Cockpit", ["Cockpit"]),
      roomId: "runtime.room.main",
    },
    companion: {
      ...summary("runtime.companion.guide", "Companion", ["Companion"]),
      notificationAvailable: false,
    },
    pet: summary("runtime.pet.resident", "Base Pet", ["Pet"]),
    unassignedWorkspaces: [],
  };
}

function room(
  objectId: string,
  displayName: string,
  slug: BaseRoom["slug"],
  workspaceSlots: WorkspaceSlot[],
): BaseRoom {
  return {
    ...summary(objectId, displayName, ["Room"]),
    slug,
    order: slug === "main" ? 0 : 1,
    atmosphere: "Quiet",
    workspaceSlots,
  };
}

function workspaceSlot(
  objectId: string,
  placement: string,
  workspaceObjectId: string | null,
): WorkspaceSlot {
  return {
    ...summary(objectId, "Workspace Slot", ["WorkspaceSlot"]),
    placement,
    skin: "Core",
    workspace: workspaceObjectId
      ? {
          ...summary(workspaceObjectId, "Workspace", ["Workspace"]),
          icon: placement.includes("left") ? "Knowledge" : "Creation",
          overlay: "Workspace",
          sourceProjectId: "runtime.project.source",
        }
      : null,
  };
}

function summary(
  objectId: string,
  displayName: string,
  systemTags: string[],
): BaseObjectSummary {
  return { objectId, displayName, description: "", systemTags, userTags: [] };
}
