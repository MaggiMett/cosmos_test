import type { RouteLocationRaw, Router } from "vue-router";

export type CosmosNavigationScope = "development" | "production";

export interface CosmosProjectDestination {
  objectId: string;
  displayName: string;
  x: number;
}

export interface CosmosProjectNeighbors {
  left: Readonly<CosmosProjectDestination> | null;
  right: Readonly<CosmosProjectDestination> | null;
}

export function cosmosProjectNeighbors(
  projects: readonly Readonly<CosmosProjectDestination>[],
  focusedProjectId: string | null,
  cameraX: number,
): CosmosProjectNeighbors {
  const ordered = [...projects].sort((left, right) => left.x - right.x);
  const focusedIndex = ordered.findIndex((project) => project.objectId === focusedProjectId);
  if (focusedIndex >= 0) {
    return {
      left: ordered[focusedIndex - 1] ?? null,
      right: ordered[focusedIndex + 1] ?? null,
    };
  }
  return {
    left: ordered.filter((project) => project.x < cameraX).at(-1) ?? null,
    right: ordered.find((project) => project.x > cameraX) ?? null,
  };
}

export function projectCosmosRoute(
  projectId: string,
  scope: CosmosNavigationScope = "development",
): RouteLocationRaw {
  if (scope === "production") {
    return { name: "cosmos", query: { projectId } };
  }
  return {
    name: "dev-cosmos-project",
    query: { projectId },
  };
}

export function globalCosmosRoute(
  scope: CosmosNavigationScope = "development",
): RouteLocationRaw {
  return scope === "production" ? { name: "cosmos" } : { name: "dev-cosmos-global" };
}

export function baseRoute(sourceProjectId: string | null = null): RouteLocationRaw {
  return sourceProjectId
    ? { name: "base", query: { fromProjectId: sourceProjectId } }
    : { name: "base" };
}

export function navigateToProject(
  router: Readonly<Pick<Router, "push">>,
  projectId: string,
  scope: CosmosNavigationScope = "development",
): ReturnType<Router["push"]> {
  return router.push(projectCosmosRoute(projectId, scope));
}

export function navigateToGlobal(
  router: Readonly<Pick<Router, "push">>,
  scope: CosmosNavigationScope = "development",
): ReturnType<Router["push"]> {
  return router.push(globalCosmosRoute(scope));
}

export function navigateToBase(
  router: Readonly<Pick<Router, "push">>,
  sourceProjectId: string | null = null,
): ReturnType<Router["push"]> {
  return router.push(baseRoute(sourceProjectId));
}
