import type { CosmosMapRuntime } from "../../runtime/cosmosMapRuntime";
import type { ProjectCosmosPresentation } from "./projectCosmosProjection";

export interface ProjectCosmosObjectHost {
  openObject(objectId: string, section: "details"): Promise<unknown>;
}

export interface ProjectNodeMoveGesture {
  pointerId: number;
  objectId: string;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  moved: boolean;
}

export async function selectProjectCosmosNode(
  runtime: Readonly<Pick<CosmosMapRuntime, "select" | "persistSelection">>,
  project: Readonly<ProjectCosmosPresentation>,
  objectId: string,
): Promise<boolean> {
  if (project.objectId !== objectId && !project.nodes.some((node) => node.objectId === objectId)) return false;
  runtime.select(objectId);
  await runtime.persistSelection();
  return true;
}

export async function openSelectedProjectCosmosNode(
  host: ProjectCosmosObjectHost,
  project: Readonly<ProjectCosmosPresentation>,
  objectId: string,
): Promise<boolean> {
  const selected = objectId === project.objectId
    ? project.isCoreSelected
    : project.nodes.find((candidate) => candidate.objectId === objectId)?.isSelected;
  if (!selected) return false;
  await host.openObject(objectId, "details");
  return true;
}

export function beginProjectNodeMove(
  project: Readonly<ProjectCosmosPresentation>,
  objectId: string,
  pointer: Readonly<{ pointerId: number; clientX: number; clientY: number }>,
): ProjectNodeMoveGesture | null {
  const node = project.nodes.find((candidate) => candidate.objectId === objectId);
  if (!node) return null;
  return {
    pointerId: pointer.pointerId,
    objectId,
    startClientX: pointer.clientX,
    startClientY: pointer.clientY,
    startX: node.x,
    startY: node.y,
    moved: false,
  };
}

export function moveProjectNode(
  runtime: Readonly<Pick<CosmosMapRuntime, "moveNodeLocally">>,
  gesture: ProjectNodeMoveGesture,
  pointer: Readonly<{ clientX: number; clientY: number }>,
  zoom: number,
): boolean {
  const safeZoom = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  const deltaX = (pointer.clientX - gesture.startClientX) / safeZoom;
  const deltaY = (pointer.clientY - gesture.startClientY) / safeZoom;
  if (Math.hypot(deltaX, deltaY) > 3) gesture.moved = true;
  return runtime.moveNodeLocally(
    gesture.objectId,
    gesture.startX + deltaX,
    gesture.startY + deltaY,
  );
}

export async function persistProjectNodeMove(
  runtime: Readonly<Pick<CosmosMapRuntime, "persistNodePosition">>,
  gesture: Readonly<ProjectNodeMoveGesture>,
): Promise<boolean> {
  if (!gesture.moved) return false;
  await runtime.persistNodePosition(gesture.objectId);
  return true;
}
