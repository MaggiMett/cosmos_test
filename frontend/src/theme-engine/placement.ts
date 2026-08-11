import type { BoundsShape, Point } from "./types";
import type {
  AttachmentAnchor,
  CatalogObject,
  CatalogObjectFamily,
  PlacementObstacle,
  PlacementProfile,
  PlacementSurface,
  PlacementValidationInput,
  PlacementValidationIssue,
  PlacementValidationResult,
  SurfaceBinding,
  SurfaceNormal,
} from "./roomCompositionTypes";

const EPSILON = 1e-9;

export function isSurfaceCompatible(
  profile: PlacementProfile,
  surface: PlacementSurface,
): boolean {
  return profile.allowedSurfaces.includes(surface.surfaceKind);
}

export function isRequiredSurfaceContactSatisfied(
  profile: PlacementProfile,
  hasSurfaceContact: boolean,
): boolean {
  return !profile.requiredSurfaceContact || hasSurfaceContact;
}

export function isRotationAllowed(
  profile: PlacementProfile,
  rotation: number,
  binding: SurfaceBinding,
): boolean {
  const policy = profile.rotationPolicy;
  if (policy.alignToSurfaceNormal || policy.mode === "surface-normal") {
    if (binding.orientationMode !== "surface-normal") return false;
  }
  if (policy.mode === "free" || policy.mode === "surface-normal") return true;
  if (policy.mode === "fixed") {
    return (policy.allowedDegrees ?? [0]).some(
      (allowed) => angularDistance(rotation, allowed) <= EPSILON,
    );
  }
  const step = policy.stepDegrees;
  if (!step) return false;
  const normalized = ((rotation % step) + step) % step;
  return normalized <= EPSILON || Math.abs(normalized - step) <= EPSILON;
}

export function isScaleAllowed(profile: PlacementProfile, scale: Point): boolean {
  const { minimum, maximum, uniform } = profile.scalePolicy;
  if (
    scale.x < minimum ||
    scale.x > maximum ||
    scale.y < minimum ||
    scale.y > maximum
  ) {
    return false;
  }
  return !uniform || Math.abs(scale.x - scale.y) <= EPSILON;
}

export function isAttachmentCompatible(
  profile: PlacementProfile,
  anchor: AttachmentAnchor | undefined,
  family: CatalogObjectFamily,
): boolean {
  if (!anchor) return false;
  return (
    profile.attachmentTargets.includes(anchor.role) &&
    anchor.compatibleFamilies.includes(family)
  );
}

export function violatesClearance(
  layoutBounds: BoundsShape,
  position: Point,
  scale: Point,
  clearance: number,
  obstacles: readonly PlacementObstacle[],
): boolean {
  const subject = expandBounds(
    transformBounds(toAxisAlignedBounds(layoutBounds), position, scale),
    clearance,
  );
  return obstacles.some((obstacle) =>
    overlaps(subject, toAxisAlignedBounds(obstacle.bounds)),
  );
}

export function validatePlacement(
  input: PlacementValidationInput,
): PlacementValidationResult {
  const issues: PlacementValidationIssue[] = [];
  const profile = input.object.placementProfile;

  if (!isSurfaceCompatible(profile, input.surface)) {
    issues.push(issue("surface-incompatible", `Surface kind "${input.surface.surfaceKind}" is not allowed`, input.surface.surfaceId));
  }
  if (input.binding.surfaceId !== input.surface.surfaceId) {
    issues.push(issue("surface-binding-mismatch", "Surface binding does not reference the evaluated surface", input.binding.surfaceId));
  }
  if (!isRequiredSurfaceContactSatisfied(profile, input.hasRequiredSurfaceContact)) {
    issues.push(issue("surface-contact-required", "Required surface contact is missing", input.surface.surfaceId));
  }
  if (!isNormalAllowed(profile.allowedNormals, input.surface.surfaceKind)) {
    issues.push(issue("normal-incompatible", "Surface normal class is not allowed", input.surface.surfaceId));
  }
  if (profile.floorLock && input.surface.surfaceKind !== "floor") {
    issues.push(issue("floor-lock-violated", "Object is locked to floor surfaces", input.surface.surfaceId));
  }
  if (profile.ceilingLock && input.surface.surfaceKind !== "ceiling") {
    issues.push(issue("ceiling-lock-violated", "Object is locked to ceiling surfaces", input.surface.surfaceId));
  }
  if (!isRotationAllowed(profile, input.rotation, input.binding)) {
    issues.push(issue("rotation-incompatible", "Rotation or surface-normal orientation violates the placement profile"));
  }
  if (!isScaleAllowed(profile, input.scale)) {
    issues.push(issue("scale-incompatible", "Scale violates the placement profile"));
  }

  const attachmentRequired =
    input.surface.surfaceKind === "object-anchor" || input.binding.anchorId !== undefined;
  if (
    attachmentRequired &&
    !isAttachmentCompatible(profile, input.attachmentAnchor, input.object.family)
  ) {
    issues.push(issue("attachment-incompatible", "Attachment anchor is missing or incompatible", input.binding.anchorId));
  }

  if (
    profile.collisionPolicy === "solid" &&
    input.object.collisionProfile.blocksPlacement &&
    violatesClearance(
      input.object.defaultBounds.layout,
      input.position,
      input.scale,
      profile.clearance,
      input.obstacles ?? [],
    )
  ) {
    issues.push(issue("clearance-violated", "Layout bounds violate required clearance"));
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

function isNormalAllowed(
  allowed: readonly SurfaceNormal[],
  surfaceKind: PlacementSurface["surfaceKind"],
): boolean {
  if (allowed.includes("any")) return true;
  const normal: SurfaceNormal =
    surfaceKind === "floor"
      ? "up"
      : surfaceKind === "ceiling"
        ? "down"
        : "horizontal";
  return allowed.includes(normal);
}

function angularDistance(left: number, right: number): number {
  const delta = Math.abs(((left - right + 180) % 360 + 360) % 360 - 180);
  return delta;
}

interface AxisAlignedBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function toAxisAlignedBounds(shape: BoundsShape): AxisAlignedBounds {
  if (shape.type === "rect") {
    return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
  }
  if (shape.type === "ellipse") {
    return {
      x: shape.cx - shape.rx,
      y: shape.cy - shape.ry,
      width: shape.rx * 2,
      height: shape.ry * 2,
    };
  }
  const xs = shape.points.map((point) => point.x);
  const ys = shape.points.map((point) => point.y);
  const minimumX = Math.min(...xs);
  const minimumY = Math.min(...ys);
  return {
    x: minimumX,
    y: minimumY,
    width: Math.max(...xs) - minimumX,
    height: Math.max(...ys) - minimumY,
  };
}

function transformBounds(
  bounds: AxisAlignedBounds,
  position: Point,
  scale: Point,
): AxisAlignedBounds {
  return {
    x: position.x + bounds.x * scale.x,
    y: position.y + bounds.y * scale.y,
    width: bounds.width * scale.x,
    height: bounds.height * scale.y,
  };
}

function expandBounds(bounds: AxisAlignedBounds, value: number): AxisAlignedBounds {
  return {
    x: bounds.x - value,
    y: bounds.y - value,
    width: bounds.width + value * 2,
    height: bounds.height + value * 2,
  };
}

function overlaps(left: AxisAlignedBounds, right: AxisAlignedBounds): boolean {
  return (
    left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y
  );
}

function issue(
  code: PlacementValidationIssue["code"],
  message: string,
  relatedId?: string,
): PlacementValidationIssue {
  return { code, message, ...(relatedId ? { relatedId } : {}) };
}
