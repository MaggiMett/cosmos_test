import { adaptBaseMainRoomV1 } from "./baseRoomCompatibilityAdapter";
import type { BaseComposition } from "./roomCompositionTypes";

export const baseMainRoomCompatibilityProjection = adaptBaseMainRoomV1();

export const cosmosMainRoomShell =
  baseMainRoomCompatibilityProjection.shell;
export const cosmosMainRoomPreset =
  baseMainRoomCompatibilityProjection.preset;
export const cosmosMainRoomCatalogObjects =
  baseMainRoomCompatibilityProjection.catalogObjects;
export const cosmosMainRoomFunctionContainers =
  baseMainRoomCompatibilityProjection.functionContainers;
export const cosmosMainRoomComposition =
  baseMainRoomCompatibilityProjection.roomComposition;

export const cosmosCompatibilityBaseComposition: BaseComposition = {
  schemaVersion: 1,
  baseId: "core.base.compatibility",
  version: "1.0.0",
  rooms: [cosmosMainRoomComposition],
  connections: [],
  entryRoomId: cosmosMainRoomComposition.roomId,
  presentationOverrides: [],
  revision: { revisionId: "compatibility-read-only" },
};
