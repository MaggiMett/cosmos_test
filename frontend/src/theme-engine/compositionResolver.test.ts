import { describe, expect, it } from "vitest";

import {
  CompositionResolver,
  CompositionResolverError,
  type BaselineAssignment,
} from "./compositionResolver";
import { coreDefaultBaseComposition } from "./coreDefaultBaseSkin";
import type {
  Composition,
  OverrideAssignment,
  VersionedRef,
} from "./types";

const target = { presentationGroup: "base-interior" } as const;

describe("CompositionResolver", () => {
  it("uses deterministic Base precedence", () => {
    const assignments: OverrideAssignment[] = [
      assignment("test.assignment.global", { level: "composition-global" }, "test.skin.global"),
      assignment(
        "test.assignment.environment",
        { level: "environment", scopeId: "base.main-room" },
        "test.skin.environment",
      ),
      assignment(
        "test.assignment.room",
        { level: "room", scopeId: "room.main" },
        "test.skin.room",
      ),
      assignment(
        "test.assignment.instance",
        { level: "instance", objectId: "base.instance.1" },
        "test.skin.instance",
      ),
    ];
    const composition = makeComposition(
      "test.composition.precedence",
      assignments,
    );
    const activeTheme = baseline(
      "runtime.active-theme.base",
      "test.skin.active-theme",
    );
    const coreDefault = baseline("runtime.core-default.base", "core.skin.base.default");
    const resolver = new CompositionResolver(
      [composition],
      [activeTheme],
      [coreDefault],
    );
    const reference = ref(composition);

    expect(
      skinId(
        resolver.resolve(reference, target, {
          environmentId: "base.main-room",
          roomId: "room.main",
          instanceId: "base.instance.1",
        }),
      ),
    ).toBe("test.skin.instance");
    expect(
      skinId(
        resolver.resolve(reference, target, {
          environmentId: "base.main-room",
          roomId: "room.main",
        }),
      ),
    ).toBe("test.skin.room");
    expect(
      skinId(
        resolver.resolve(reference, target, {
          environmentId: "base.main-room",
        }),
      ),
    ).toBe("test.skin.environment");
    expect(
      skinId(
        resolver.resolve(reference, target, {
          environmentId: "different.environment",
        }),
      ),
    ).toBe("test.skin.global");

    const activeOnly = makeComposition("test.composition.active", []);
    const activeResolver = new CompositionResolver(
      [activeOnly],
      [activeTheme],
      [coreDefault],
    );
    expect(
      skinId(
        activeResolver.resolve(ref(activeOnly), target, {
          environmentId: "base.main-room",
        }),
      ),
    ).toBe("test.skin.active-theme");

    const coreOnly = new CompositionResolver([activeOnly], [], [coreDefault]);
    expect(
      skinId(
        coreOnly.resolve(ref(activeOnly), target, {
          environmentId: "base.main-room",
        }),
      ),
    ).toBe("core.skin.base.default");
  });

  it("falls through rejected values and exposes a debug trace", () => {
    const composition = makeComposition("test.composition.fallback", [
      assignment(
        "test.assignment.invalid",
        { level: "instance", objectId: "base.instance.1" },
        "missing.skin",
      ),
    ]);
    const resolver = new CompositionResolver(
      [composition],
      [],
      [baseline("runtime.core-default.base", "core.skin.base.default")],
    );

    const result = resolver.resolve(
      ref(composition),
      target,
      { environmentId: "base.main-room", instanceId: "base.instance.1" },
      (value) => value.kind === "skin-ref" && value.ref.id !== "missing.skin",
    );

    expect(skinId(result)).toBe("core.skin.base.default");
    expect(result.trace).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assignmentId: "test.assignment.invalid",
          reason: "value-rejected",
        }),
        expect.objectContaining({
          assignmentId: "runtime.core-default.base",
          reason: "winner",
        }),
      ]),
    );
  });

  it("rejects Composition dependency cycles", () => {
    const left = makeComposition("test.composition.left", [], [
      { id: "test.composition.right", versionRange: "1.0.0" },
    ]);
    const right = makeComposition("test.composition.right", [], [
      { id: "test.composition.left", versionRange: "1.0.0" },
    ]);
    const resolver = new CompositionResolver(
      [left, right],
      [],
      [baseline("runtime.core-default.base", "core.skin.base.default")],
    );

    expect(() =>
      resolver.resolve(ref(left), target, { environmentId: "base.main-room" }),
    ).toThrowError(CompositionResolverError);
  });
});

function makeComposition(
  compositionId: string,
  overrides: readonly OverrideAssignment[],
  parentCompositionRefs: readonly VersionedRef[] = [],
): Composition {
  return {
    ...structuredClone(coreDefaultBaseComposition),
    compositionId,
    overrides,
    parentCompositionRefs,
    environmentScenes: [],
  };
}

function assignment(
  assignmentId: string,
  scope: OverrideAssignment["scope"],
  skinIdValue: string,
): OverrideAssignment {
  return {
    assignmentId,
    enabled: true,
    scope,
    target,
    value: {
      kind: "skin-ref",
      ref: { id: skinIdValue, versionRange: "^1.0.0" },
    },
    priority: 0,
  };
}

function baseline(assignmentId: string, skinIdValue: string): BaselineAssignment {
  return {
    assignmentId,
    target,
    value: {
      kind: "skin-ref",
      ref: { id: skinIdValue, versionRange: "^1.0.0" },
    },
  };
}

function ref(composition: Composition): VersionedRef {
  return { id: composition.compositionId, versionRange: composition.version };
}

function skinId(result: ReturnType<CompositionResolver["resolve"]>): string {
  if (result.value.kind !== "skin-ref") throw new Error("Expected Skin resolution.");
  return result.value.ref.id;
}
