import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";

import baseCompositionSchema from "../../../docs/theme-engine/schemas/base-composition.schema.json";
import catalogObjectSchema from "../../../docs/theme-engine/schemas/catalog-object.schema.json";
import functionContainerSchema from "../../../docs/theme-engine/schemas/function-container.schema.json";
import placementProfileSchema from "../../../docs/theme-engine/schemas/placement-profile.schema.json";
import roomCommonSchema from "../../../docs/theme-engine/schemas/room-common.schema.json";
import roomCompositionSchema from "../../../docs/theme-engine/schemas/room-composition.schema.json";
import roomPresetSchema from "../../../docs/theme-engine/schemas/room-preset.schema.json";
import roomShellSchema from "../../../docs/theme-engine/schemas/room-shell.schema.json";
import {
  cosmosCompatibilityBaseComposition,
  cosmosMainRoomCatalogObjects,
  cosmosMainRoomComposition,
  cosmosMainRoomFunctionContainers,
  cosmosMainRoomPreset,
  cosmosMainRoomShell,
} from "./roomCompositionFixtures";
import {
  ThemeValidationError,
  validateBaseComposition,
  validateCatalogObject,
  validateFunctionContainer,
  validatePlacementProfile,
  validateRoomComposition,
  validateRoomPreset,
  validateRoomShell,
} from "./validation";

describe("Room Composition schemas", () => {
  it("accepts every canonical Phase 9R fixture", () => {
    expect(validateRoomShell(cosmosMainRoomShell).shellId).toBe(
      "core.room-shell.base-main-room-compat",
    );
    expect(cosmosMainRoomCatalogObjects.map(validateCatalogObject)).toHaveLength(6);
    expect(cosmosMainRoomFunctionContainers.map(validateFunctionContainer)).toHaveLength(6);
    expect(validateRoomPreset(cosmosMainRoomPreset).objectInstances).toHaveLength(6);
    expect(validateRoomComposition(cosmosMainRoomComposition).functionContainers).toHaveLength(6);
    expect(validateBaseComposition(cosmosCompatibilityBaseComposition).rooms).toHaveLength(1);
    expect(
      validatePlacementProfile(cosmosMainRoomCatalogObjects[0]!.placementProfile)
        .allowedSurfaces,
    ).not.toHaveLength(0);
  });

  it("validates every new schema against the Draft 2020-12 metaschema", () => {
    const ajv = new Ajv2020({ strict: false });
    for (const schema of [
      roomCommonSchema,
      placementProfileSchema,
      roomShellSchema,
      roomPresetSchema,
      catalogObjectSchema,
      functionContainerSchema,
      roomCompositionSchema,
      baseCompositionSchema,
    ]) {
      expect(ajv.validateSchema(schema), JSON.stringify(ajv.errors)).toBe(true);
    }
  });

  it("rejects architecture shells that contain furniture, functions or fixed instances", () => {
    for (const forbidden of [
      { doors: [] },
      { workspaces: [] },
      { companion: {} },
      { furniture: [] },
      { decorations: [] },
      { functionBindings: [] },
      { objectInstances: [] },
    ]) {
      expect(() =>
        validateRoomShell({ ...clone(cosmosMainRoomShell), ...forbidden }),
      ).toThrow(ThemeValidationError);
    }
  });

  it("requires wall, floor and ceiling architecture and valid internal references", () => {
    const missingFloor = clone(cosmosMainRoomShell);
    missingFloor.architectureSurfaces = missingFloor.architectureSurfaces.filter(
      (surface) => surface.surfaceKind !== "floor",
    );
    expect(() => validateRoomShell(missingFloor)).toThrow(/surface kind "floor"/);

    const invalidReference = clone(cosmosMainRoomShell);
    invalidReference.placementAreas[0]!.surfaceId = "missing.surface";
    expect(() => validateRoomShell(invalidReference)).toThrow(/unknown placement surface/);
  });

  it("rejects concrete room position on a Catalog Object", () => {
    const invalid = {
      ...clone(cosmosMainRoomCatalogObjects[0]!),
      position: { x: 100, y: 200 },
    };
    expect(() => validateCatalogObject(invalid)).toThrow(/unknown property "position"/);
  });

  it("keeps Function Containers independent from skins and assets", () => {
    const container = cosmosMainRoomFunctionContainers[0]!;
    expect(container).not.toHaveProperty("skinRef");
    expect(container).not.toHaveProperty("visualSlots");
    expect(() =>
      validateFunctionContainer({
        ...clone(container),
        skinRef: { id: "test.skin.invalid", versionRange: "^1.0.0" },
      }),
    ).toThrow(/unknown property "skinRef"/);
  });

  it("supports the required Core function families without visual authority", () => {
    const base = clone(cosmosMainRoomFunctionContainers[0]!);
    const examples = [
      ["creation-workspace", "workspace.create"],
      ["tool-entry", "tool.open"],
      ["room-transition", "room.transition"],
      ["companion-interaction", "companion.open"],
    ] as const;
    for (const [functionType, actionRole] of examples) {
      const container = {
        ...base,
        containerId: `test.function-container.${functionType}`,
        functionId: `test.function.${functionType}`,
        functionType,
        functionBinding: {
          source: "runtime-context" as const,
          descriptorRole: actionRole,
          actionRole,
        },
      };
      expect(validateFunctionContainer(container).functionType).toBe(functionType);
      expect(container).not.toHaveProperty("skinRef");
    }
  });

  it("rejects asset bytes, executable fields and unknown data in presets", () => {
    expect(() =>
      validateRoomPreset({
        ...clone(cosmosMainRoomPreset),
        assets: [{ bytes: "AA==" }],
      }),
    ).toThrow(/unknown property "assets"/);
    expect(() =>
      validateRoomPreset({
        ...clone(cosmosMainRoomPreset),
        script: "javascript:alert(1)",
      }),
    ).toThrow(ThemeValidationError);
  });

  it("rejects malformed property override states instead of correcting them", () => {
    const invalid = clone(cosmosMainRoomComposition);
    invalid.objectInstances[0]!.propertyOverrides.position = {
      mode: "pinned",
    } as never;
    expect(() => validateRoomComposition(invalid)).toThrow(/required property "value"/);
    expect(invalid.objectInstances[0]!.propertyOverrides.position).not.toHaveProperty(
      "value",
    );
  });

  it("reports invalid artifacts with the public artifact kind", () => {
    try {
      validateBaseComposition({ schemaVersion: 1 });
      throw new Error("Expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ThemeValidationError);
      expect((error as ThemeValidationError).artifactKind).toBe("base-composition");
    }
  });
});

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
