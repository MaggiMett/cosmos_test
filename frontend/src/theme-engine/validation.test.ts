import { describe, expect, it } from "vitest";

import { baseMainRoomTemplate } from "./baseTemplate";
import {
  coreDefaultBaseComposition,
  coreDefaultBaseSkinPack,
  coreDefaultBaseThemeManifest,
} from "./coreDefaultBaseSkin";
import {
  ThemeValidationError,
  validateComposition,
  validateEnvironmentTemplate,
  validateObjectTemplate,
  validateSkinPack,
  validateThemeManifest,
} from "./validation";

describe("Theme artifact validation", () => {
  it("accepts the canonical Base artifacts", () => {
    expect(validateThemeManifest(coreDefaultBaseThemeManifest).themeId).toBe(
      "core.theme.base-vertical-slice",
    );
    expect(validateSkinPack(coreDefaultBaseSkinPack).skins).toHaveLength(1);
    expect(validateEnvironmentTemplate(baseMainRoomTemplate).templateId).toBe(
      "base.main-room.v1",
    );
    expect(validateComposition(coreDefaultBaseComposition).environmentScenes).toHaveLength(1);
  });

  it("accepts a schema-conforming Object Template", () => {
    const objectTemplate = {
      schemaVersion: 1,
      templateId: "test.object-template.placeholder",
      version: "1.0.0",
      templateKind: "object",
      displayName: "Placeholder",
      targetRole: "test.role.placeholder",
      compatibility: { themeEngine: "^1.0.0" },
      referenceViewport: { width: 100, height: 100, unit: "du", origin: "top-left" },
      coordinateMapping: {
        fit: "contain",
        alignment: "center",
        functionalFit: "contain",
      },
      functionalRoles: [],
      states: [{ stateId: "default", source: "core", fallbackStateId: "default" }],
      anchors: [],
      bounds: [
        {
          boundsId: "test.bounds.interaction",
          role: "interaction",
          shape: { type: "rect", x: 0, y: 0, width: 100, height: 100 },
          mutableBy: "template",
          critical: false,
          pointerPolicy: "active",
        },
        {
          boundsId: "test.bounds.visual",
          role: "visual",
          shape: { type: "rect", x: 0, y: 0, width: 100, height: 100 },
          mutableBy: "skin",
          critical: false,
          pointerPolicy: "none",
        },
      ],
      assetSlots: [],
      layerBands: [
        { bandId: "scene", minimum: -100, maximum: 100, owner: "object" },
      ],
      rendererCompatibility: [
        {
          rendererRef: { id: "core.renderer.emergency", versionRange: "^1.0.0" },
          role: "test.renderer.placeholder",
          required: true,
        },
      ],
      coreFallbackSkinRef: {
        id: "core.skin.placeholder",
        versionRange: "^1.0.0",
      },
    };

    expect(validateObjectTemplate(objectTemplate).templateKind).toBe("object");
  });

  it("reports missing and unknown fields without correcting the input", () => {
    const invalid = {
      ...coreDefaultBaseThemeManifest,
      groups: undefined,
      unexpected: true,
    };

    expect(() => validateThemeManifest(invalid)).toThrowError(ThemeValidationError);
    try {
      validateThemeManifest(invalid);
    } catch (error) {
      expect(error).toBeInstanceOf(ThemeValidationError);
      expect((error as Error).message).toContain('required property "groups" is missing');
      expect((error as Error).message).toContain('unknown property "unexpected"');
    }
    expect("unexpected" in invalid).toBe(true);
  });

  it("rejects executable strings even in otherwise valid visible terms", () => {
    const invalid = {
      ...coreDefaultBaseThemeManifest,
      systemTerms: {
        ...coreDefaultBaseThemeManifest.systemTerms,
        "system.base": {
          ...coreDefaultBaseThemeManifest.systemTerms["system.base"],
          en: "<script>alert(1)</script>",
        },
      },
    };

    expect(() => validateThemeManifest(invalid)).toThrow(/executable HTML/i);
  });
});
