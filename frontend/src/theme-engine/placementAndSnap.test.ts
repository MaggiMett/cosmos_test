import { describe, expect, it } from "vitest";

import {
  isAttachmentCompatible,
  validatePlacement,
} from "./placement";
import { cosmosMainRoomCatalogObjects } from "./roomCompositionFixtures";
import type {
  AttachmentAnchor,
  CatalogObject,
  CatalogObjectFamily,
  PlacementProfile,
  PlacementSurface,
  SnapCandidate,
  SurfaceBinding,
} from "./roomCompositionTypes";
import { evaluateSnapCandidates } from "./snapScoring";

describe("pure placement validation", () => {
  it("allows a Door only on a wall with floor contact and wall-normal alignment", () => {
    const door = objectWith("door", {
      allowedSurfaces: ["wall"],
      requiredSurfaceContact: true,
      allowedNormals: ["horizontal"],
      floorLock: false,
      rotationPolicy: {
        mode: "surface-normal",
        alignToSurfaceNormal: true,
        upright: true,
      },
    });
    expect(propose(door, surface("wall"), true).valid).toBe(true);
    expect(propose(door, surface("floor"), true).issues.map((issue) => issue.code)).toContain(
      "surface-incompatible",
    );
    expect(propose(door, surface("wall"), false).issues.map((issue) => issue.code)).toContain(
      "surface-contact-required",
    );
    expect(
      propose(door, surface("wall"), true, {
        orientationMode: "room",
      }).issues.map((issue) => issue.code),
    ).toContain("rotation-incompatible");
  });

  it("keeps a Table floor-locked and stops wall placement", () => {
    const table = objectWith("furniture", {
      allowedSurfaces: ["floor"],
      floorLock: true,
      wallStop: true,
      allowedNormals: ["up"],
    });
    expect(propose(table, surface("floor"), true).valid).toBe(true);
    expect(propose(table, surface("wall"), true).issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["surface-incompatible", "normal-incompatible", "floor-lock-violated"]),
    );
  });

  it("restricts wall and ceiling lights to their declared surfaces", () => {
    const wallLight = objectWith("light", {
      allowedSurfaces: ["wall"],
      allowedNormals: ["horizontal"],
      rotationPolicy: {
        mode: "surface-normal",
        alignToSurfaceNormal: true,
        upright: true,
      },
    });
    const ceilingLight = objectWith("light", {
      allowedSurfaces: ["ceiling"],
      allowedNormals: ["down"],
      ceilingLock: true,
      rotationPolicy: {
        mode: "surface-normal",
        alignToSurfaceNormal: true,
        upright: false,
      },
    });
    expect(propose(wallLight, surface("wall"), true).valid).toBe(true);
    expect(propose(wallLight, surface("floor"), true).valid).toBe(false);
    expect(propose(ceilingLight, surface("ceiling"), true).valid).toBe(true);
    expect(propose(ceilingLight, surface("wall"), true).valid).toBe(false);
  });

  it("allows a Plant on floor or a compatible furniture anchor", () => {
    const plant = objectWith("plant", {
      allowedSurfaces: ["floor", "object-anchor"],
      allowedNormals: ["up", "horizontal"],
      attachmentTargets: ["furniture.plant"],
      floorLock: false,
    });
    const anchor: AttachmentAnchor = {
      anchorId: "test.anchor.plant",
      role: "furniture.plant",
      position: { x: 0, y: 0 },
      normal: { x: 0, y: -1, z: 0 },
      compatibleFamilies: ["plant"],
      acceptedAttachmentRoles: ["plant.base"],
      priority: 10,
    };
    expect(propose(plant, surface("floor"), true).valid).toBe(true);
    expect(
      propose(
        plant,
        surface("object-anchor"),
        true,
        { anchorId: anchor.anchorId },
        anchor,
      ).valid,
    ).toBe(true);
    expect(isAttachmentCompatible(plant.placementProfile, anchor, "plant")).toBe(true);
    expect(
      isAttachmentCompatible(plant.placementProfile, {
        ...anchor,
        compatibleFamilies: ["decoration"],
      }, "plant"),
    ).toBe(false);
  });

  it("reports incompatible attachments and deterministic clearance collisions", () => {
    const plant = objectWith("plant", {
      allowedSurfaces: ["object-anchor"],
      allowedNormals: ["horizontal"],
      attachmentTargets: ["furniture.plant"],
    });
    const incompatible: AttachmentAnchor = {
      anchorId: "test.anchor.wrong",
      role: "furniture.monitor",
      position: { x: 0, y: 0 },
      normal: { x: 0, y: 0, z: 1 },
      compatibleFamilies: ["plant"],
      acceptedAttachmentRoles: [],
      priority: 0,
    };
    expect(
      propose(
        plant,
        surface("object-anchor"),
        true,
        { anchorId: incompatible.anchorId },
        incompatible,
      ).issues.map((issue) => issue.code),
    ).toContain("attachment-incompatible");

    const table = objectWith("furniture", {
      allowedSurfaces: ["floor"],
      allowedNormals: ["up"],
      floorLock: true,
      clearance: 10,
      collisionPolicy: "solid",
    });
    const result = validatePlacement({
      ...proposal(table, surface("floor"), true),
      obstacles: [
        {
          obstacleId: "test.obstacle.blocker",
          bounds: { type: "rect", x: 90, y: 90, width: 50, height: 50 },
        },
      ],
    });
    expect(result.issues.map((issue) => issue.code)).toContain("clearance-violated");
  });
});

describe("deterministic Snap Candidates and traces", () => {
  it("produces the same winner and ordered trace for randomized candidate order", () => {
    const candidates = [
      snapCandidate("test.candidate.beta", "test.target.beta", 10, 0.9),
      snapCandidate("test.candidate.alpha", "test.target.alpha", 10, 0.9),
      snapCandidate("test.candidate.rejected", "test.target.rejected", 1, 1, false),
    ];
    const forward = evaluateSnapCandidates(candidates);
    const reverse = evaluateSnapCandidates([...candidates].reverse());
    expect(forward.winner?.candidateId).toBe("test.candidate.alpha");
    expect(reverse).toEqual(forward);
    expect(forward.trace.candidates).toHaveLength(3);
    expect(
      forward.trace.candidates.find(
        (candidate) => candidate.candidateId === "test.candidate.rejected",
      )?.rejectedBy,
    ).toEqual(["surface-compatible"]);
  });

  it("records and applies previous-target hysteresis without hiding rules", () => {
    const candidates = [
      snapCandidate("test.candidate.alpha", "test.target.alpha", 8, 0.8),
      snapCandidate("test.candidate.beta", "test.target.beta", 8, 0.8),
    ];
    const result = evaluateSnapCandidates(candidates, {
      previousTargetId: "test.target.beta",
      hysteresis: 12,
    });
    expect(result.winner?.candidateId).toBe("test.candidate.beta");
    expect(
      result.trace.candidates.find(
        (candidate) => candidate.candidateId === "test.candidate.beta",
      )?.hysteresisApplied,
    ).toBe(12);
    expect(result.trace.winnerReason).toContain("deterministic");
  });

  it("returns a complete rejection trace when no candidate is valid", () => {
    const result = evaluateSnapCandidates([
      snapCandidate("test.candidate.one", "test.target.one", 1, 1, false),
      snapCandidate("test.candidate.two", "test.target.two", 2, 1, false),
    ]);
    expect(result.winner).toBeUndefined();
    expect(result.trace.candidates.every((candidate) => !candidate.valid)).toBe(true);
    expect(result.trace.winnerReason).toBe("No candidate satisfied every hard rule");
  });
});

function objectWith(
  family: CatalogObjectFamily,
  patch: Partial<PlacementProfile>,
): CatalogObject {
  const base = clone(cosmosMainRoomCatalogObjects[0]!);
  return {
    ...base,
    catalogObjectId: `test.catalog.${family}`,
    family,
    collisionProfile: {
      mode: "solid",
      boundsRole: "layout",
      blocksPlacement: true,
    },
    placementProfile: {
      ...base.placementProfile,
      requiredSurfaceContact: false,
      floorLock: false,
      ceilingLock: false,
      rotationPolicy: {
        mode: "free",
        alignToSurfaceNormal: false,
        upright: true,
      },
      ...patch,
    },
  };
}

function surface(kind: PlacementSurface["surfaceKind"]): PlacementSurface {
  return {
    surfaceId: `test.surface.${kind}`,
    surfaceKind: kind,
    bounds: { type: "rect", x: 0, y: 0, width: 1000, height: 800 },
    normal:
      kind === "floor"
        ? { x: 0, y: -1, z: 0 }
        : kind === "ceiling"
          ? { x: 0, y: 1, z: 0 }
          : { x: 0, y: 0, z: 1 },
    basisX: { x: 1, y: 0, z: 0 },
    basisY: { x: 0, y: 1, z: 0 },
    placementAreaIds: [`test.area.${kind}`],
    anchorIds: [],
    layerBandId: "scene",
    depth: 0,
    snapPriority: 0,
  };
}

function binding(
  target: PlacementSurface,
  patch: Partial<SurfaceBinding> = {},
): SurfaceBinding {
  return {
    surfaceId: target.surfaceId,
    placementAreaId: `test.area.${target.surfaceKind}`,
    localPosition: { x: 100, y: 100 },
    normalOffset: 0,
    orientationMode:
      target.surfaceKind === "wall" || target.surfaceKind === "ceiling"
        ? "surface-normal"
        : "room",
    shellVersion: "1.0.0",
    ...patch,
  };
}

function proposal(
  object: CatalogObject,
  target: PlacementSurface,
  contact: boolean,
  bindingPatch: Partial<SurfaceBinding> = {},
  attachmentAnchor?: AttachmentAnchor,
) {
  return {
    object,
    surface: target,
    binding: binding(target, bindingPatch),
    position: { x: 100, y: 100 },
    rotation: 0,
    scale: { x: 1, y: 1 },
    hasRequiredSurfaceContact: contact,
    ...(attachmentAnchor ? { attachmentAnchor } : {}),
  };
}

function propose(
  object: CatalogObject,
  target: PlacementSurface,
  contact: boolean,
  bindingPatch: Partial<SurfaceBinding> = {},
  attachmentAnchor?: AttachmentAnchor,
) {
  return validatePlacement(
    proposal(object, target, contact, bindingPatch, attachmentAnchor),
  );
}

function snapCandidate(
  candidateId: string,
  targetId: string,
  distance: number,
  alignment: number,
  valid = true,
): SnapCandidate {
  const target = surface("floor");
  return {
    candidateId,
    target: {
      targetId,
      kind: "surface",
      surfaceId: target.surfaceId,
      position: { x: 0, y: 0 },
      priority: 0,
    },
    binding: binding(target),
    explicitAnchorMatch: false,
    contactQuality: 1,
    profilePriority: 100,
    distance,
    alignmentQuality: alignment,
    clearance: 100,
    rules: [
      {
        ruleId: "surface-compatible",
        passed: valid,
        reason: valid ? "Surface accepted" : "Surface rejected",
      },
    ],
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
