import "vue-router";

import type { EnvironmentKind } from "./routes";

declare module "vue-router" {
  interface RouteMeta {
    title: string;
    environment: EnvironmentKind;
    developmentPreview?: boolean;
  }
}
