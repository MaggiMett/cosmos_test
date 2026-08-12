import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import type {
  ActiveThemePresentationSnapshot,
  RendererSafeAssetReference,
  ResolvedPresentationAsset,
  ResolvedPresentationBinding,
  ResolvedPresentationMaterial,
  ResolvedPresentationSkin,
} from "../../runtime/activeThemePresentationSnapshot";
import type { PersistedAssetCatalogRecord } from "../../runtime/assetCatalogApi";
import { ThemeRegistry } from "../../runtime/themeRegistry";
import { ThemeRuntime } from "../../runtime/themeRuntime";
import { TransitionRuntime } from "../../runtime/transitionRuntime";
import { cosmosTheme } from "../../themes/cosmos";
import type { ImmutableRoomSnapshot } from "../../theme-engine/roomSnapshotResolver";
import type { SkinPack, ThemeManifest } from "../../theme-engine/types";
import {
  loadBaseRoomThemePresentation,
  resolveBaseRoomThemePresentation,
  type BaseRoomThemeParityGate,
} from "./baseRoomThemePresentation";
const activeThemeId = "max.theme.aurora";
const activeSkinId = "max.skin.base.aurora";
const coreSkinId = "core.skin.base.default";
const backgroundSlot = "base.slot.background";
const workspaceSlot = "base.slot.left-workspace";

describe("Base Room Theme presentation", () => {
  it("does not load Package or Catalog presentation while Core mode is active", async () => {
    const readPresentationSkinPacks = vi.fn();
    const list = vi.fn();
    const result = await loadBaseRoomThemePresentation({
      mode: "core",
      themeRuntime: {
        active: null,
        readSnapshot: () => ({ activeThemeId: null }) as ReturnType<ThemeRuntime["readSnapshot"]>,
      },
      skinPackSource: { readPresentationSkinPacks },
      assetCatalog: { list },
      roomSnapshot: roomSnapshot(),
      parity: equalParity,
      resolveResourceUrl: () => null,
    });

    expect(result).toEqual({ status: "core", reason: "disabled" });
    expect(readPresentationSkinPacks).not.toHaveBeenCalled();
    expect(list).not.toHaveBeenCalled();
  });

  it("projects installed Theme bindings onto real Room surface and Function Container slots", () => {
    const result = resolve(presentation());

    expect(result.status).toBe("active");
    if (result.status !== "active") throw new Error("Expected Theme presentation.");
    expect(result.presentation.activeThemeId).toBe(activeThemeId);
    expect(result.presentation.skinId).toBe(activeSkinId);
    expect(result.presentation.visuals).toEqual([
      expect.objectContaining({
        itemId: "base.surface.background",
        slotId: backgroundSlot,
        source: "active-theme",
        assetUrl: "/api/assets/max.asset.background/1.0.0",
      }),
      expect.objectContaining({
        itemId: "workspace.slot.real",
        slotId: workspaceSlot,
        source: "active-theme",
        assetUrl: "/api/assets/max.asset.workspace/1.0.0",
      }),
    ]);
  });

  it("loads an installed SkinPack through the existing read boundaries before projection", async () => {
    const registry = new ThemeRegistry();
    registry.register(cosmosTheme);
    const manifest = installedManifest();
    registry.register({
      objectId: activeThemeId,
      displayName: "Aurora",
      version: "1.0.0",
      tokens: { "--cosmos-color-background": "#102030" },
      provenance: {
        kind: "theme-package",
        packageId: "max.package.aurora",
        packageVersion: "1.0.0",
        provenance: "test:installed",
        manifestDigest: "b".repeat(64),
      },
      manifest,
    });
    const runtime = new ThemeRuntime(registry, new TransitionRuntime(), cosmosTheme.objectId);
    await runtime.activate(activeThemeId);
    const result = await loadBaseRoomThemePresentation({
      mode: "theme",
      themeRuntime: runtime,
      skinPackSource: { readPresentationSkinPacks: () => [installedSkinPack()] },
      assetCatalog: { list: async () => ({ ok: true, data: [catalogRecord()] }) },
      roomSnapshot: roomSnapshot(),
      parity: equalParity,
      resolveResourceUrl: (reference) => `/api/assets/${reference.assetId}/${reference.version}`,
    });

    expect(result.status).toBe("active");
    if (result.status !== "active") throw new Error("Expected installed Theme presentation.");
    expect(result.presentation.activeThemeId).toBe(activeThemeId);
    expect(result.presentation.visuals.find((visual) => visual.slotId === backgroundSlot)).toMatchObject({
      source: "active-theme",
      assetUrl: "/api/assets/max.asset.background/1.0.0",
    });
  });

  it("keeps a valid Core Theme presentation when no package skin is active", () => {
    const snapshot = presentation({
      activeThemeId: "cosmos.theme.core",
      skins: [skin("core-fallback", coreSkinId)],
      assets: coreAssets(),
      materials: [],
    });
    const result = resolve(snapshot, { activeThemeId: "cosmos.theme.core" });

    expect(result.status).toBe("active");
    if (result.status !== "active") throw new Error("Expected Core presentation.");
    expect(result.presentation.visuals.every((visual) => visual.source === "core-fallback")).toBe(true);
    expect(result.presentation.visuals.every((visual) => visual.assetUrl === null)).toBe(true);
  });

  it("falls back per slot when a Theme asset is unavailable", () => {
    const snapshot = presentation({
      resolutionStatus: "resolved-with-fallbacks",
      assets: [
        ...activeAssets().map((asset) =>
          asset.requestedAssetId === "max.asset.background"
            ? { ...asset, status: "unavailable" as const, reference: null, source: null }
            : asset,
        ),
        ...coreAssets(),
      ],
    });
    const result = resolve(snapshot);

    expect(result.status).toBe("active");
    if (result.status !== "active") throw new Error("Expected slot fallback.");
    expect(result.presentation.visuals.find((visual) => visual.slotId === backgroundSlot)).toMatchObject({
      source: "core-fallback",
      assetUrl: null,
    });
    expect(result.presentation.visuals.find((visual) => visual.slotId === workspaceSlot)?.source).toBe(
      "active-theme",
    );
  });

  it("falls back to the Core renderer when a required slot has no Core fallback", () => {
    const snapshot = presentation({
      skins: [
        skin("active-theme", activeSkinId, [binding("active.background", backgroundSlot)]),
        skin("core-fallback", coreSkinId, [binding("core.background", backgroundSlot)]),
      ],
      assets: [activeAssets()[0]!, coreAssets()[0]!],
    });

    expect(resolve(snapshot)).toEqual({ status: "core", reason: "fallback-incomplete" });
  });

  it("applies only resolved fill, stroke, opacity and texture URL values", () => {
    const texture = assetReference("max.asset.texture");
    const snapshot = presentation({
      materials: [material({
        parameters: [
          { parameterId: "core.material.fill", kind: "color", value: "#102030" },
          { parameterId: "core.material.stroke", kind: "color", value: "#405060" },
          { parameterId: "core.material.opacity", kind: "number", value: 0.72 },
          { parameterId: "core.material.texture-ref", kind: "asset-reference", value: texture },
        ],
      })],
    });
    const result = resolve(snapshot);

    expect(result.status).toBe("active");
    if (result.status !== "active") throw new Error("Expected material presentation.");
    expect(result.presentation.visuals[0]).toMatchObject({
      fill: "#102030",
      stroke: "#405060",
      materialOpacity: 0.72,
      textureUrl: "/api/assets/max.asset.texture/1.0.0",
    });
  });

  it("can safely material-skin a slot while its asset remains on Core fallback", () => {
    const snapshot = presentation({
      skins: [
        skin("active-theme", activeSkinId, []),
        skin("core-fallback", coreSkinId),
      ],
      materials: [material({
        parameters: [{ parameterId: "core.material.fill", kind: "color", value: "#223344" }],
      })],
    });
    const result = resolve(snapshot);

    expect(result.status).toBe("active");
    if (result.status !== "active") throw new Error("Expected material-only presentation.");
    expect(result.presentation.visuals[0]).toMatchObject({
      source: "core-fallback",
      assetUrl: null,
      fill: "#223344",
    });
  });

  it("never applies an unavailable or unknown material channel", () => {
    const snapshot = presentation({
      resolutionStatus: "partial",
      materials: [material({ status: "unavailable", channelId: "max.material.unknown" })],
    });

    expect(resolve(snapshot)).toEqual({ status: "core", reason: "presentation-unavailable" });
  });

  it("uses Core when an otherwise resolved Resource URL cannot be prepared", () => {
    expect(resolve(presentation(), { resolveResourceUrl: () => null })).toEqual({
      status: "core",
      reason: "resource-url-unavailable",
    });
  });

  it("rejects stale Theme snapshots and each blocking parity gate", () => {
    expect(resolve(presentation(), { activeThemeId: "max.theme.changed" })).toEqual({
      status: "core",
      reason: "stale-snapshot",
    });
    const cases: readonly [keyof BaseRoomThemeParityGate, string][] = [
      ["room", "blocking-room-parity"],
      ["interaction", "blocking-interaction-parity"],
      ["visual", "blocking-visual-parity"],
    ];
    for (const [kind, reason] of cases) {
      expect(resolve(presentation(), {
        parity: { ...equalParity, [kind]: "blocking-difference" },
      })).toEqual({ status: "core", reason });
    }
  });

  it("projects Main Room and Workshop IDs without changing Room authority", () => {
    for (const roomId of ["room.main.real", "room.workshop.real"]) {
      const room = roomSnapshot(roomId);
      const before = JSON.stringify(room);
      const result = resolve(presentation(), { roomSnapshot: room });

      expect(result.status).toBe("active");
      expect(JSON.stringify(room)).toBe(before);
      expect(Object.isFrozen(result)).toBe(true);
    }
  });

  it("does not project Interaction Bounds, Runtime bindings or Focus order", () => {
    const serialized = JSON.stringify(resolve(presentation()));
    expect(serialized).not.toContain("interactionBounds");
    expect(serialized).not.toContain("workspaceId");
    expect(serialized).not.toContain("doorId");
    expect(serialized).not.toContain("focusOrder");
  });

  it("follows repeated authoritative Theme A, Theme B and rollback snapshots", () => {
    const themeA = resolve(presentation());
    const themeBId = "max.theme.nebula";
    const themeB = resolve(
      presentation({ activeThemeId: themeBId }),
      { activeThemeId: themeBId },
    );
    const rollback = resolve(presentation());

    expect(themeA.status === "active" && themeA.presentation.activeThemeId).toBe(activeThemeId);
    expect(themeB.status === "active" && themeB.presentation.activeThemeId).toBe(themeBId);
    expect(rollback.status === "active" && rollback.presentation.activeThemeId).toBe(activeThemeId);
  });

  it("keeps Registry, Package and Asset persistence reads outside the renderer", () => {
    const renderer = source("../room-composition-preview/RoomCompositionShadowRenderer.vue");
    const scene = source("./components/RoomCompositionRuntimeScene.vue");
    for (const value of [renderer, scene]) {
      expect(value).not.toContain("ThemeRegistry");
      expect(value).not.toContain("themePackageRegistry");
      expect(value).not.toContain("AssetCatalogApi");
      expect(value).not.toContain("SQLite");
      expect(value).not.toContain("manifest");
    }
    expect(renderer).toContain(":href=\"renderableAssetUrl(item.id) ?? undefined\"");
    expect(renderer).not.toContain("reference.path");
  });

  it("falls failed Theme resources back to the underlying Core visual at the renderer edge", () => {
    const renderer = source("../room-composition-preview/RoomCompositionShadowRenderer.vue");

    expect(renderer).toContain("@error=\"markResourceFailed(visualFor(item.id)?.assetUrl)\"");
    expect(renderer).toContain("@error=\"markResourceFailed(visualFor(item.id)?.textureUrl)\"");
    expect(renderer).toContain(':data-theme-resource-fallback="usesResourceFallback(item.id) || undefined"');
    expect(renderer).toContain('? "core-fallback"');
    expect(renderer.indexOf("<RoomShadowShape")).toBeLessThan(renderer.indexOf("<image"));
    expect(renderer).not.toContain("runtime.");
    expect(renderer).not.toContain("fetch(");
  });
});

const equalParity: BaseRoomThemeParityGate = {
  room: "equal",
  interaction: "equal",
  visual: "equal",
};

function resolve(
  snapshot: ActiveThemePresentationSnapshot,
  overrides: Partial<Parameters<typeof resolveBaseRoomThemePresentation>[0]> = {},
) {
  return resolveBaseRoomThemePresentation({
    mode: "theme",
    activeThemeId,
    presentationSnapshot: snapshot,
    roomSnapshot: roomSnapshot(),
    parity: equalParity,
    resolveResourceUrl: (reference) => `/api/assets/${reference.assetId}/${reference.version}`,
    ...overrides,
  });
}

function presentation(
  overrides: Partial<ActiveThemePresentationSnapshot> = {},
): ActiveThemePresentationSnapshot {
  return {
    activeThemeId,
    themeVersion: "1.0.0",
    provenance: null,
    resolutionStatus: "resolved",
    tokens: [],
    skins: [skin("active-theme", activeSkinId), skin("core-fallback", coreSkinId)],
    materials: [material()],
    assets: [...activeAssets(), ...coreAssets()],
    coreFallback: {
      runtimeThemeId: "cosmos.theme.core",
      presentationThemeId: "core.theme.base-vertical-slice",
      packId: "core.skin-pack.base.default",
      skinId: coreSkinId,
      assetId: "core.asset.base.placeholder",
    },
    diagnostics: [],
    trace: [],
    ...overrides,
  };
}

function skin(
  source: ResolvedPresentationSkin["source"],
  skinId: string,
  bindings: ResolvedPresentationBinding[] = [
    binding(`${source}.background`, backgroundSlot),
    binding(`${source}.workspace`, workspaceSlot),
  ],
): ResolvedPresentationSkin {
  return {
    packId: source === "active-theme" ? "max.pack.aurora" : "core.skin-pack.base.default",
    packVersion: "1.0.0",
    skinId,
    skinVersion: "1.0.0",
    source,
    status: "resolved",
    presentationGroup: "base-interior",
    templateId: "base.main-room.v1",
    templateVersion: "1.0.0",
    bindings,
    states: [{
      stateId: "default",
      resolvedStateId: null,
      source: "base-binding",
      assetBindingIds: bindings.map((candidate) => candidate.bindingId),
    }],
  };
}

function binding(bindingId: string, slotId: string): ResolvedPresentationBinding {
  return {
    bindingId,
    templateId: "base.main-room.v1",
    templateVersion: "1.0.0",
    slotId,
    fit: "cover",
    alignment: "center",
    opacity: 0.9,
    tint: null,
    states: [],
    assetRequestId: `${bindingId}:asset`,
  };
}

function activeAssets(): ResolvedPresentationAsset[] {
  return [
    resolvedAsset("active-theme.background:asset", "max.asset.background", "active-theme"),
    resolvedAsset("active-theme.workspace:asset", "max.asset.workspace", "active-theme"),
  ];
}

function coreAssets(): ResolvedPresentationAsset[] {
  return [
    resolvedAsset("core-fallback.background:asset", "core.asset.base.placeholder", "core-fallback", null),
    resolvedAsset("core-fallback.workspace:asset", "core.asset.base.placeholder", "core-fallback", null),
  ];
}

function resolvedAsset(
  requestId: string,
  assetId: string,
  source: NonNullable<ResolvedPresentationAsset["source"]>,
  version: string | null = "1.0.0",
): ResolvedPresentationAsset {
  return {
    requestId,
    requestedAssetId: assetId,
    templateId: "base.main-room.v1",
    slotId: requestId.includes("background") ? backgroundSlot : workspaceSlot,
    lookupStatus: "resolved",
    status: "resolved",
    source,
    usedCoreFallback: source === "core-fallback",
    reference: assetReference(assetId, version),
  };
}

function assetReference(
  assetId: string,
  version: string | null = "1.0.0",
): RendererSafeAssetReference {
  return {
    assetId,
    version,
    kind: "image",
    format: "png",
    mimeType: "image/png",
    sha256: "a".repeat(64),
    byteSize: 1024,
    width: 1600,
    height: 900,
    catalogEntryId: version ? `${assetId}.catalog` : null,
    catalogEntryVersion: version,
  };
}

function material(
  overrides: Partial<ResolvedPresentationMaterial> = {},
): ResolvedPresentationMaterial {
  return {
    skinId: activeSkinId,
    templateId: "base.main-room.v1",
    channelId: "core.material.dom-surface",
    status: "resolved",
    parameters: [],
    reason: null,
    ...overrides,
  };
}

function roomSnapshot(roomId = "room.main.real"): ImmutableRoomSnapshot {
  return {
    snapshotId: `snapshot:${roomId}`,
    snapshotVersion: 1,
    roomId,
    shell: {
      referenceViewport: { width: 1600, height: 900 },
    },
    surfaces: [{
      surfaceId: "base.surface.background",
      surfaceKind: "background-opening",
      geometry: { type: "rect", x: 0, y: 0, width: 1600, height: 900 },
      normal: { x: 0, y: 0, z: 1 },
      layerBandId: "background",
      depth: -1000,
      pointerPolicy: "passive",
    }],
    objectInstances: [{
      instanceId: "workspace.slot.real",
      catalogObject: {
        visualSlots: [{
          slotId: workspaceSlot,
          purpose: "Workspace visual",
          acceptedKinds: ["image", "vector"],
          acceptedFormats: ["png", "webp", "svg"],
          required: true,
          fallbackPolicy: "core-emergency",
          states: ["default"],
        }],
      },
    }],
    functionContainers: [],
    roomConnections: [],
    layers: [],
    validationStatus: { valid: true, warnings: [], conflicts: [] },
    resolutionTrace: {},
  } as unknown as ImmutableRoomSnapshot;
}

function source(path: string): string {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
}

function installedManifest(): ThemeManifest {
  return {
    schemaVersion: 1,
    themeId: activeThemeId,
    version: "1.0.0",
    displayName: "Aurora",
    packageKind: "group-pack",
    compatibility: { themeEngine: "^1.0.0" },
    groups: ["base-interior"],
    packRefs: [{ id: "max.pack.aurora", versionRange: "^1.0.0" }],
    tokens: {
      "cosmos.color.background": { type: "color", value: "#102030" },
    },
    systemTerms: {},
  };
}

function installedSkinPack(): SkinPack {
  return {
    schemaVersion: 1,
    packId: "max.pack.aurora",
    version: "1.0.0",
    packageKind: "single-skin",
    displayName: "Aurora Base",
    compatibility: { themeEngine: "^1.0.0" },
    assets: [{
      assetId: "max.asset.background",
      kind: "image",
      format: "png",
      mimeType: "image/png",
      path: "assets/background.png",
      sha256: "a".repeat(64),
      byteSize: 1024,
      width: 1600,
      height: 900,
    }],
    skins: [{
      skinId: activeSkinId,
      version: "1.0.0",
      displayName: "Aurora Base",
      target: {
        presentationGroup: "base-interior",
        templateRef: { id: "base.main-room.v1", versionRange: "^1.0.0" },
      },
      assetBindings: [{
        bindingId: "max.binding.background",
        slotId: backgroundSlot,
        assetId: "max.asset.background",
        fit: "cover",
      }],
      tokens: {},
      materials: [],
      stateVariants: [],
    }],
  };
}

function catalogRecord(): PersistedAssetCatalogRecord {
  return {
    visualAsset: {
      schemaVersion: 1,
      id: "max.asset.background",
      version: "1.0.0",
      kind: "image",
      format: "png",
      mimeType: "image/png",
      path: "assets/background.png",
      sha256: "a".repeat(64),
      byteSize: 1024,
      width: 1600,
      height: 900,
    },
    catalogEntry: {
      schemaVersion: 1,
      id: "max.catalog.background",
      version: "1.0.0",
      displayName: "Aurora Background",
      description: "",
      visualAssetRef: { id: "max.asset.background", version: "1.0.0" },
      category: "base.environment",
      scope: "theme",
      origin: "imported",
      theme: activeThemeId,
      systemTags: [],
      userTags: [],
      perspective: "front",
      orientation: "landscape",
      scaleClass: "room",
      creator: { name: "Max" },
      provenance: { kind: "imported", source: "aurora.cosmostheme" },
      license: { expression: "Internal" },
      compatibleTemplates: [{ id: "base.main-room.v1", versionRange: "^1.0.0" }],
      compatibleSurfaceTypes: ["background"],
      compatibleVisualObjectTypes: [],
      deprecated: false,
    },
    resourceAvailable: true,
  };
}
