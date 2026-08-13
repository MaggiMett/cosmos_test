import { baseMainRoomTemplate } from "./baseTemplate";
import {
  clusterNodeTemplate,
  detailNodeTemplate,
  domainNodeTemplate,
  objectNodeTemplate,
  projectRootNodeTemplate,
} from "./nodeTemplates";
import type { EnvironmentTemplate, ObjectTemplate } from "./types";

export type CoreTemplateKind = "object" | "environment";
export type CoreTemplateStatus = "implemented" | "clear-template-planned";

export interface CoreTemplateCatalogEntry {
  readonly catalogId: string;
  readonly label: string;
  readonly group: "cosmos" | "base" | "workspace" | "ui";
  readonly kind: CoreTemplateKind;
  readonly targetRole: ObjectTemplate["targetRole"] | EnvironmentTemplate["targetRole"];
  readonly status: CoreTemplateStatus;
  readonly templateId?: string;
  readonly visualReference?: "CosmosMap.png" | "Base.png" | "WorkspaceWindow.png";
}

/**
 * Product-facing inventory for the first official Cosmos template kit.
 *
 * Entries marked `clear-template-planned` are intentionally catalogued before
 * their geometry contracts exist. This gives Theme Builder one canonical list
 * instead of letting individual studios invent their own template taxonomy.
 */
export const coreTemplateCatalog = [
  {
    catalogId: "cosmos.map",
    label: "Cosmos Map",
    group: "cosmos",
    kind: "environment",
    targetRole: "map",
    status: "clear-template-planned",
    visualReference: "CosmosMap.png",
  },
  {
    catalogId: "cosmos.node.project-root",
    label: "Project Root Node",
    group: "cosmos",
    kind: "object",
    targetRole: projectRootNodeTemplate.targetRole,
    status: "implemented",
    templateId: projectRootNodeTemplate.templateId,
    visualReference: "CosmosMap.png",
  },
  {
    catalogId: "cosmos.node.domain",
    label: "Domain Node",
    group: "cosmos",
    kind: "object",
    targetRole: domainNodeTemplate.targetRole,
    status: "implemented",
    templateId: domainNodeTemplate.templateId,
    visualReference: "CosmosMap.png",
  },
  {
    catalogId: "cosmos.node.cluster",
    label: "Cluster Node",
    group: "cosmos",
    kind: "object",
    targetRole: clusterNodeTemplate.targetRole,
    status: "implemented",
    templateId: clusterNodeTemplate.templateId,
    visualReference: "CosmosMap.png",
  },
  {
    catalogId: "cosmos.node.object",
    label: "Object Node",
    group: "cosmos",
    kind: "object",
    targetRole: objectNodeTemplate.targetRole,
    status: "implemented",
    templateId: objectNodeTemplate.templateId,
    visualReference: "CosmosMap.png",
  },
  {
    catalogId: "cosmos.node.detail",
    label: "Detail Node",
    group: "cosmos",
    kind: "object",
    targetRole: detailNodeTemplate.targetRole,
    status: "implemented",
    templateId: detailNodeTemplate.templateId,
    visualReference: "CosmosMap.png",
  },
  {
    catalogId: "base.room.main",
    label: "Base Room",
    group: "base",
    kind: "environment",
    targetRole: "base-interior",
    status: "implemented",
    templateId: baseMainRoomTemplate.templateId,
    visualReference: "Base.png",
  },
  {
    catalogId: "base.door",
    label: "Door",
    group: "base",
    kind: "object",
    targetRole: "door",
    status: "clear-template-planned",
    visualReference: "Base.png",
  },
  {
    catalogId: "base.workspace-entry",
    label: "Workspace Entry",
    group: "base",
    kind: "object",
    targetRole: "workspace-entry",
    status: "clear-template-planned",
    visualReference: "Base.png",
  },
  {
    catalogId: "base.companion",
    label: "Companion",
    group: "base",
    kind: "object",
    targetRole: "companion",
    status: "clear-template-planned",
    visualReference: "Base.png",
  },
  {
    catalogId: "base.decoration",
    label: "Decoration",
    group: "base",
    kind: "object",
    targetRole: "decoration",
    status: "clear-template-planned",
    visualReference: "Base.png",
  },
  {
    catalogId: "workspace.environment",
    label: "Workspace",
    group: "workspace",
    kind: "environment",
    targetRole: "workspace",
    status: "clear-template-planned",
    visualReference: "WorkspaceWindow.png",
  },
  {
    catalogId: "ui.window",
    label: "Window",
    group: "ui",
    kind: "object",
    targetRole: "window",
    status: "clear-template-planned",
    visualReference: "WorkspaceWindow.png",
  },
] as const satisfies readonly CoreTemplateCatalogEntry[];

export function coreTemplateCatalogByGroup(
  group: CoreTemplateCatalogEntry["group"],
): readonly CoreTemplateCatalogEntry[] {
  return coreTemplateCatalog.filter((entry) => entry.group === group);
}
