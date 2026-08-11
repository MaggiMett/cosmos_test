import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
  type Router,
  type RouterHistory,
} from "vue-router";

import type { TransitionRuntime } from "../runtime/transitionRuntime";
import { routeRecords } from "./routes";

export interface CosmosRouterOptions {
  history?: RouterHistory;
  transitions?: TransitionRuntime;
}

export function shouldEnqueueRuntimeTransition(
  to: { developmentPreview?: boolean; standaloneExperience?: boolean },
  from: { developmentPreview?: boolean; standaloneExperience?: boolean },
): boolean {
  return !to.developmentPreview && !from.developmentPreview && !to.standaloneExperience && !from.standaloneExperience;
}

export function createCosmosRouter(options: CosmosRouterOptions = {}): Router {
  const history = options.history ??
    (typeof window === "undefined" ? createMemoryHistory() : createWebHistory(import.meta.env.BASE_URL));
  const router = createRouter({ history, routes: routeRecords });

  if (options.transitions) {
    router.beforeEach((to, from) => {
      if (!shouldEnqueueRuntimeTransition(to.meta, from.meta)) {
        return true;
      }
      return options.transitions?.enqueue({
        kind: to.meta.environment === from.meta.environment ? "navigation" : "environment",
        targetId: String(to.name ?? to.path),
        run: () => true,
      });
    });
  }

  router.afterEach((to) => {
    if (typeof document !== "undefined") document.title = `${String(to.meta.title)} — Cosmos`;
  });
  return router;
}
