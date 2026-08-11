import type { Point, VersionedRef } from "./types";
import type {
  ObjectInstance,
  PropertyOverrideState,
} from "./roomCompositionTypes";

export interface ObjectInstancePresentationValues {
  position: Point;
  rotation: number;
  scale: Point;
  skin: VersionedRef;
  animation: VersionedRef | null;
  material: VersionedRef | null;
  layer: string;
  depth: number;
}

export function resolvePropertyOverride<T>(
  state: PropertyOverrideState<T>,
  parentValue: T,
): T {
  return state.mode === "pinned" ? state.value : parentValue;
}

export function applyInheritedPresentation(
  instance: ObjectInstance,
  parent: ObjectInstancePresentationValues,
): ObjectInstance {
  const overrides = instance.propertyOverrides;
  const animation = resolvePropertyOverride(overrides.animation, parent.animation);
  const material = resolvePropertyOverride(overrides.material, parent.material);
  return {
    ...instance,
    position: resolvePropertyOverride(overrides.position, parent.position),
    rotation: resolvePropertyOverride(overrides.rotation, parent.rotation),
    scale: resolvePropertyOverride(overrides.scale, parent.scale),
    skinRef: resolvePropertyOverride(overrides.skin, parent.skin),
    ...(animation ? { animationRef: animation } : { animationRef: undefined }),
    ...(material ? { materialRef: material } : { materialRef: undefined }),
    layer: resolvePropertyOverride(overrides.layer, parent.layer),
    depth: resolvePropertyOverride(overrides.depth, parent.depth),
  };
}

export function applyThemeChange(
  instance: ObjectInstance,
  theme: ObjectInstancePresentationValues,
): ObjectInstance {
  const overrides = instance.propertyOverrides;
  return {
    ...instance,
    position:
      overrides.position.mode === "inherit" ? theme.position : instance.position,
    rotation:
      overrides.rotation.mode === "inherit" ? theme.rotation : instance.rotation,
    scale: overrides.scale.mode === "inherit" ? theme.scale : instance.scale,
    skinRef: overrides.skin.mode === "inherit" ? theme.skin : instance.skinRef,
    ...(overrides.animation.mode === "inherit"
      ? theme.animation
        ? { animationRef: theme.animation }
        : { animationRef: undefined }
      : {}),
    ...(overrides.material.mode === "inherit"
      ? theme.material
        ? { materialRef: theme.material }
        : { materialRef: undefined }
      : {}),
    layer: overrides.layer.mode === "inherit" ? theme.layer : instance.layer,
    depth: overrides.depth.mode === "inherit" ? theme.depth : instance.depth,
  };
}
