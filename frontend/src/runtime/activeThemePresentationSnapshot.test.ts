import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import {
  BASE_MAIN_ROOM_TEMPLATE_ID,
  BASE_SLOT_IDS,
  baseMainRoomTemplate,
} from "../theme-engine/baseTemplate";
import {
  CORE_DEFAULT_BASE_ASSET_ID,
  CORE_DEFAULT_BASE_PACK_ID,
  coreDefaultBaseSkinPack,
} from "../theme-engine/coreDefaultBaseSkin";
import { TemplateRegistry } from "../theme-engine/templateRegistry";
import type {
  EnvironmentTemplate,
  SkinPack,
  ThemeManifest,
} from "../theme-engine/types";
import { cosmosTheme } from "../themes/cosmos";
import type { PersistedAssetCatalogRecord } from "./assetCatalogApi";
import {
  loadActiveThemePresentationSnapshot,
  resolveActiveThemePresentationSnapshot,
} from "./activeThemePresentationSnapshot";
import { ThemeRegistry, type ThemeDefinition } from "./themeRegistry";
import { ThemeRuntime, type ThemePresenter } from "./themeRuntime";
import type { ThemeActivationPersistence } from "./themeRuntimePersistence";
import {
  InstalledThemePackageLoader,
  createThemeManifestDigest,
  type InstalledThemePackageRecord,
} from "./themePackageRegistry";
import { TransitionRuntime } from "./transitionRuntime";

const themeId = "max.theme.presentation";
const packId = "max.skin-pack.presentation";
const assetId = "max.asset.presentation.background";

function manifest(id = themeId, version = "1.2.0", refs = [{ id: packId, versionRange: "^1.0.0" }]): ThemeManifest {
  return {
    schemaVersion: 1,
    themeId: id,
    version,
    displayName: "Presentation Theme",
    packageKind: "full-theme",
    compatibility: { themeEngine: "^1.0.0" },
    groups: [
      "world", "map", "base-entry", "base-interior", "room", "workspace", "window",
      "companion", "icon", "node", "connection", "label", "status",
    ],
    packRefs: refs,
    defaultCompositionRef: {
      id: `max.composition.${id.split(".").at(-1) ?? "presentation"}`,
      versionRange: `^${version}`,
    },
    tokens: {
      "cosmos.color.background": { type: "color", value: "#102030" },
    },
    systemTerms: {},
    author: { name: "Max" },
  };
}

function packageThemeDefinition(themeManifest = manifest()): ThemeDefinition {
  return {
    objectId: themeManifest.themeId,
    displayName: themeManifest.displayName,
    version: themeManifest.version,
    author: themeManifest.author?.name,
    tokens: {
      ...cosmosTheme.tokens,
      "--cosmos-color-background": "#102030",
    },
    provenance: {
      kind: "theme-package",
      packageId: "max.package.presentation",
      packageVersion: themeManifest.version,
      provenance: "validated package fixture",
      manifestDigest: "a".repeat(64),
    },
    manifest: themeManifest,
  };
}

function skinPack(options: {
  requestedAssetId?: string;
  templateId?: string;
  material?: "unknown" | "known" | "texture";
  withDefaultState?: boolean;
} = {}): SkinPack {
  const bindingId = "max.binding.presentation.background";
  return {
    schemaVersion: 1,
    packId,
    version: "1.0.0",
    packageKind: "skin-pack",
    displayName: "Presentation Skin Pack",
    compatibility: { themeEngine: "^1.0.0" },
    assets: [{
      assetId: options.requestedAssetId ?? assetId,
      kind: "image",
      format: "png",
      mimeType: "image/png",
      path: `assets/${options.requestedAssetId ?? assetId}.png`,
      sha256: "b".repeat(64),
      byteSize: 128,
      width: 64,
      height: 64,
    }],
    skins: [{
      skinId: "max.skin.presentation.base",
      version: "1.0.0",
      displayName: "Presentation Base",
      target: {
        presentationGroup: "base-interior",
        templateRef: {
          id: options.templateId ?? BASE_MAIN_ROOM_TEMPLATE_ID,
          versionRange: "^1.0.0",
        },
      },
      assetBindings: [{
        bindingId,
        slotId: BASE_SLOT_IDS.background,
        assetId: options.requestedAssetId ?? assetId,
      }],
      tokens: {},
      materials:
        options.material === "unknown"
          ? [{ channelId: "base.material.wall", parameters: { "base.material.opacity": 0.8 } }]
          : options.material === "known"
            ? [{
                channelId: "core.material.dom-surface",
                parameters: {
                  "core.material.fill": "#102030",
                  "core.material.opacity": 0.8,
                },
              }]
            : options.material === "texture"
              ? [{
                  channelId: "core.material.dom-surface",
                  parameters: { "core.material.texture-ref": options.requestedAssetId ?? assetId },
                }]
              : [],
      stateVariants: options.withDefaultState
        ? [{ stateId: "default", assetBindingIds: [bindingId] }]
        : [],
    }],
  };
}

function catalogRecord(options: {
  id?: string;
  theme?: string;
  resourceAvailable?: boolean;
  refId?: string;
} = {}): PersistedAssetCatalogRecord {
  const id = options.id ?? assetId;
  return {
    visualAsset: {
      schemaVersion: 1,
      id,
      version: "1.0.0",
      kind: "image",
      format: "png",
      mimeType: "image/png",
      path: `assets/${id}.png`,
      sha256: "b".repeat(64),
      byteSize: 128,
      width: 64,
      height: 64,
    },
    catalogEntry: {
      schemaVersion: 1,
      id: `max.catalog.${id}`,
      version: "1.0.0",
      visualAssetRef: { id: options.refId ?? id, version: "1.0.0" },
      displayName: "Presentation asset",
      description: "Validated test asset",
      category: "environment",
      scope: "theme",
      origin: "imported",
      systemTags: [],
      userTags: [],
      perspective: "front",
      orientation: "landscape",
      scaleClass: "room",
      theme: options.theme ?? themeId,
      creator: { name: "Max" },
      provenance: { kind: "imported", source: "test package" },
      license: { expression: "Internal" },
      compatibleTemplates: [{ id: BASE_MAIN_ROOM_TEMPLATE_ID, versionRange: "^1.0.0" }],
      compatibleSurfaceTypes: [],
      compatibleVisualObjectTypes: [],
      deprecated: false,
    },
    resourceAvailable: options.resourceAvailable ?? true,
    previewUrl: `/api/asset-catalog/${id}/content`,
  };
}

function createRuntime(definitions: readonly ThemeDefinition[] = [packageThemeDefinition()]) {
  const registry = new ThemeRegistry();
  registry.register(cosmosTheme);
  definitions.forEach((definition) => registry.register(definition));
  const presenter: ThemePresenter = { apply: vi.fn() };
  const runtime = new ThemeRuntime(registry, new TransitionRuntime(), cosmosTheme.objectId, presenter);
  return { registry, runtime, presenter };
}

async function activePackageRuntime(definition = packageThemeDefinition()) {
  const context = createRuntime([definition]);
  await context.runtime.activate(definition.objectId);
  return context;
}

function resolvePackage(
  runtime: ThemeRuntime,
  options: {
    records?: readonly PersistedAssetCatalogRecord[];
    packs?: readonly SkinPack[];
    templates?: TemplateRegistry;
  } = {},
) {
  return resolveActiveThemePresentationSnapshot({
    themeRuntime: runtime,
    assetCatalogRecords: options.records ?? [catalogRecord()],
    skinPacks: options.packs ?? [skinPack()],
    templateRegistry: options.templates,
  });
}

function customTemplateRegistry(): TemplateRegistry {
  const registry = new TemplateRegistry();
  registry.register(baseMainRoomTemplate);
  const noFallbackTemplate = {
    ...baseMainRoomTemplate,
    templateId: "max.template.no-fallback",
    coreFallbackSkinRef: { id: "max.skin.none", versionRange: "^1.0.0" },
    assetSlots: baseMainRoomTemplate.assetSlots.map((slot) => ({
      ...slot,
      fallbackPolicy: slot.slotId === BASE_SLOT_IDS.background ? "none" as const : slot.fallbackPolicy,
    })),
  } satisfies EnvironmentTemplate;
  registry.register(noFallbackTemplate);
  return registry;
}

async function installedRecord(themeManifest = manifest(themeId, "1.2.0", [])): Promise<InstalledThemePackageRecord> {
  return {
    schemaVersion: 1,
    packageId: "max.package.presentation",
    packageVersion: themeManifest.version,
    themeId: themeManifest.themeId,
    manifestVersion: 1,
    displayName: themeManifest.displayName,
    description: themeManifest.description ?? null,
    author: themeManifest.author ?? null,
    installStatus: "installed",
    source: { kind: "prevalidated", provenance: "persisted import" },
    manifestDigest: await createThemeManifestDigest(themeManifest),
    manifest: themeManifest,
    installedAt: "2026-08-09T10:00:00+00:00",
    updatedAt: "2026-08-09T10:00:00+00:00",
  };
}

describe("Active Theme Presentation Snapshot", () => {
  it("creates a complete immutable Core snapshot without invented package data", async () => {
    const { runtime } = createRuntime([]);
    await runtime.activate(cosmosTheme.objectId);

    const snapshot = resolveActiveThemePresentationSnapshot({
      themeRuntime: runtime,
      assetCatalogRecords: [],
    });

    expect(snapshot).toMatchObject({
      activeThemeId: cosmosTheme.objectId,
      themeVersion: cosmosTheme.version,
      resolutionStatus: "resolved",
      provenance: {
        theme: { kind: "code-native" },
        package: null,
      },
      coreFallback: {
        runtimeThemeId: cosmosTheme.objectId,
        packId: CORE_DEFAULT_BASE_PACK_ID,
        assetId: CORE_DEFAULT_BASE_ASSET_ID,
      },
    });
    expect(snapshot.skins).toContainEqual(expect.objectContaining({ source: "core-fallback" }));
    expect(snapshot.tokens.length).toBeGreaterThan(0);
  });

  it("retains installed package identity, version, manifest and package provenance", async () => {
    const registry = new ThemeRegistry();
    registry.register(cosmosTheme);
    const record = await installedRecord();
    await new InstalledThemePackageLoader({ listInstalled: vi.fn(async () => [record]) }, registry, cosmosTheme.objectId).load();
    const runtime = new ThemeRuntime(registry, new TransitionRuntime(), cosmosTheme.objectId, { apply: vi.fn() });
    await runtime.activate(record.themeId);

    const snapshot = resolveActiveThemePresentationSnapshot({ themeRuntime: runtime, assetCatalogRecords: [] });

    expect(snapshot.activeThemeId).toBe(record.themeId);
    expect(snapshot.themeVersion).toBe(record.packageVersion);
    expect(snapshot.provenance?.package).toEqual({
      packageId: record.packageId,
      packageVersion: record.packageVersion,
      provenance: record.source.provenance,
      manifestDigest: record.manifestDigest,
    });
    expect(snapshot.tokens).toContainEqual({
      tokenId: "--cosmos-color-background",
      declaredTokenId: "cosmos.color.background",
      type: "color",
      value: "#102030",
      source: "active-theme",
    });
  });

  it("loads and resolves an installed Package Skin through the Package read boundary", async () => {
    const pack = skinPack();
    const packageManifest = manifest(themeId, "1.2.0", [
      { id: pack.packId, versionRange: "^1.0.0" },
    ]);
    const persisted = {
      ...(await installedRecord(packageManifest)),
      skinPacks: [{
        path: "skin-packs/max.skin-pack.presentation/1.0.0/skin-pack.json",
        sha256: await createThemeManifestDigest(pack),
        packId: pack.packId,
        packVersion: pack.version,
        skinPack: pack,
      }],
    };
    const registry = new ThemeRegistry();
    registry.register(cosmosTheme);
    const loader = new InstalledThemePackageLoader(
      { listInstalled: vi.fn(async () => [persisted]) },
      registry,
      cosmosTheme.objectId,
    );
    await loader.load();
    const runtime = new ThemeRuntime(registry, new TransitionRuntime(), cosmosTheme.objectId, { apply: vi.fn() });
    await runtime.activate(themeId);

    const snapshot = await loadActiveThemePresentationSnapshot({
      themeRuntime: runtime,
      skinPackSource: loader,
      assetCatalog: { list: vi.fn(async () => ({ ok: true as const, data: [catalogRecord()] })) },
    });

    expect(snapshot.skins).toContainEqual(expect.objectContaining({
      skinId: "max.skin.presentation.base",
      source: "active-theme",
      status: "resolved",
    }));
    expect(snapshot.assets).toContainEqual(expect.objectContaining({
      requestedAssetId: assetId,
      status: "resolved",
    }));
  });

  it("resolves a validated Catalog resource to a renderer-safe reference", async () => {
    const { runtime } = await activePackageRuntime();
    const snapshot = resolvePackage(runtime);
    const asset = snapshot.assets.find((entry) => entry.requestedAssetId === assetId);

    expect(asset).toMatchObject({
      lookupStatus: "resolved",
      status: "resolved",
      source: "active-theme",
      reference: { assetId, catalogEntryId: `max.catalog.${assetId}` },
    });
    expect(asset?.reference).not.toHaveProperty("path");
    expect(asset?.reference).not.toHaveProperty("previewUrl");
  });

  it("uses the declared Core slot fallback for a missing Theme asset", async () => {
    const { runtime } = await activePackageRuntime();
    const snapshot = resolvePackage(runtime, { records: [] });
    const asset = snapshot.assets.find((entry) => entry.requestedAssetId === assetId);

    expect(asset).toMatchObject({
      lookupStatus: "missing",
      status: "fallback",
      source: "core-fallback",
      usedCoreFallback: true,
      reference: { assetId: CORE_DEFAULT_BASE_ASSET_ID },
    });
    expect(snapshot.resolutionStatus).toBe("resolved-with-fallbacks");
  });

  it("keeps a missing asset unavailable when the template forbids fallback", async () => {
    const themeManifest = manifest(themeId, "1.2.0", [{ id: packId, versionRange: "^1.0.0" }]);
    const { runtime } = await activePackageRuntime(packageThemeDefinition(themeManifest));
    const pack = skinPack({ templateId: "max.template.no-fallback" });
    const snapshot = resolvePackage(runtime, {
      records: [],
      packs: [pack],
      templates: customTemplateRegistry(),
    });

    expect(snapshot.assets.find((entry) => entry.requestedAssetId === assetId)).toMatchObject({
      lookupStatus: "missing",
      status: "unavailable",
      source: null,
    });
    expect(snapshot.resolutionStatus).toBe("partial");
  });

  it.each([
    [false, "unavailable"],
    [true, "invalid"],
  ] as const)("distinguishes unavailable and invalid Catalog resources", async (resourceAvailable, expected) => {
    const { runtime } = await activePackageRuntime();
    const record = resourceAvailable
      ? catalogRecord({ refId: "max.asset.conflict" })
      : catalogRecord({ resourceAvailable: false });
    const snapshot = resolvePackage(runtime, { records: [record] });
    expect(snapshot.assets.find((entry) => entry.requestedAssetId === assetId)?.lookupStatus).toBe(expected);
  });

  it("preserves template, slot and optional-state fallback semantics", async () => {
    const { runtime } = await activePackageRuntime();
    const snapshot = resolvePackage(runtime, { packs: [skinPack({ withDefaultState: true })] });
    const skin = snapshot.skins.find((entry) => entry.source === "active-theme");

    expect(skin?.bindings[0]).toMatchObject({
      templateId: BASE_MAIN_ROOM_TEMPLATE_ID,
      slotId: BASE_SLOT_IDS.background,
    });
    expect(skin?.states.find((state) => state.stateId === "hover")).toMatchObject({
      resolvedStateId: "default",
      source: "state-fallback",
    });
  });

  it("keeps declared materials unavailable until a renderer-owned channel contract exists", async () => {
    const { runtime } = await activePackageRuntime();
    const snapshot = resolvePackage(runtime, { packs: [skinPack({ material: "unknown" })] });

    expect(snapshot.materials).toEqual([
      expect.objectContaining({
        channelId: "base.material.wall",
        status: "unavailable",
        reason: "unknown-channel",
      }),
    ]);
    expect(snapshot.materials[0]?.parameters).toEqual([]);
    expect(snapshot.resolutionStatus).toBe("partial");
  });

  it("resolves renderer-allowlisted material values and safe texture references", async () => {
    const { runtime } = await activePackageRuntime();
    const values = resolvePackage(runtime, { packs: [skinPack({ material: "known" })] });
    const texture = resolvePackage(runtime, { packs: [skinPack({ material: "texture" })] });

    expect(values.materials).toContainEqual(expect.objectContaining({
      channelId: "core.material.dom-surface",
      status: "resolved",
      reason: null,
    }));
    expect(texture.materials[0]?.parameters).toContainEqual(expect.objectContaining({
      parameterId: "core.material.texture-ref",
      kind: "asset-reference",
      value: expect.objectContaining({ assetId }),
    }));
    expect(JSON.stringify(texture.materials)).not.toContain(`assets/${assetId}.png`);
  });

  it("does not project Function or Interaction authority from Skins", async () => {
    const { runtime } = await activePackageRuntime();
    const serialized = JSON.stringify(resolvePackage(runtime).skins);
    expect(serialized).not.toMatch(/function/i);
    expect(serialized).not.toMatch(/interaction/i);
  });

  it("does not expose raw resource locations anywhere in the snapshot", async () => {
    const { runtime } = await activePackageRuntime();
    const serialized = JSON.stringify(resolvePackage(runtime));
    expect(serialized).not.toContain(`assets/${assetId}.png`);
    expect(serialized).not.toContain(`/api/asset-catalog/${assetId}/content`);
  });

  it("is deeply immutable and deterministic for identical loaded inputs", async () => {
    const { runtime } = await activePackageRuntime();
    const first = resolvePackage(runtime);
    const second = resolvePackage(runtime);

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expectDeepFrozen(first);
  });

  it("reprojects the authoritative active Theme across A, B and a failed-activation rollback", async () => {
    const themeA = packageThemeDefinition(manifest("max.theme.a", "1.0.0", []));
    const themeB = packageThemeDefinition(manifest("max.theme.b", "2.0.0", []));
    let rejectB = false;
    const presenter: ThemePresenter = {
      apply: vi.fn((definition) => {
        if (rejectB && definition.objectId === themeB.objectId) throw new Error("B failed");
      }),
    };
    const registry = new ThemeRegistry();
    registry.register(cosmosTheme);
    registry.register(themeA);
    registry.register(themeB);
    const runtime = new ThemeRuntime(registry, new TransitionRuntime(), cosmosTheme.objectId, presenter);

    await runtime.applyPreparedTheme(runtime.prepareActivation(themeA.objectId));
    expect(resolveActiveThemePresentationSnapshot({ themeRuntime: runtime, assetCatalogRecords: [] }).activeThemeId).toBe(themeA.objectId);
    await runtime.applyPreparedTheme(runtime.prepareActivation(themeB.objectId));
    expect(resolveActiveThemePresentationSnapshot({ themeRuntime: runtime, assetCatalogRecords: [] }).activeThemeId).toBe(themeB.objectId);

    await runtime.applyPreparedTheme(runtime.prepareActivation(themeA.objectId));
    rejectB = true;
    await expect(runtime.applyPreparedTheme(runtime.prepareActivation(themeB.objectId))).rejects.toThrow();
    expect(resolveActiveThemePresentationSnapshot({ themeRuntime: runtime, assetCatalogRecords: [] }).activeThemeId).toBe(themeA.objectId);
  });

  it("uses the same pure resolver entry point for code-native and package Themes", async () => {
    const core = createRuntime([]);
    await core.runtime.activate(cosmosTheme.objectId);
    const packaged = await activePackageRuntime(packageThemeDefinition(manifest(themeId, "1.2.0", [])));

    const coreSnapshot = resolveActiveThemePresentationSnapshot({ themeRuntime: core.runtime, assetCatalogRecords: [] });
    const packageSnapshot = resolveActiveThemePresentationSnapshot({ themeRuntime: packaged.runtime, assetCatalogRecords: [] });

    expect(coreSnapshot.coreFallback).toEqual(packageSnapshot.coreFallback);
    expect(coreSnapshot.skins.map((skin) => skin.skinId)).toEqual(packageSnapshot.skins.map((skin) => skin.skinId));
  });

  it("performs no Theme activation, persistence, DOM or network work during pure resolution", async () => {
    const save = vi.fn(async () => undefined);
    const persistence: ThemeActivationPersistence = { load: vi.fn(async () => null), save };
    const registry = new ThemeRegistry();
    registry.register(cosmosTheme);
    const presenter: ThemePresenter = { apply: vi.fn() };
    const runtime = new ThemeRuntime(registry, new TransitionRuntime(), cosmosTheme.objectId, presenter, persistence);
    await runtime.applyPreparedTheme(runtime.prepareActivation(cosmosTheme.objectId));
    const applyCount = vi.mocked(presenter.apply).mock.calls.length;
    const saveCount = save.mock.calls.length;
    const catalog = { list: vi.fn() };

    resolveActiveThemePresentationSnapshot({ themeRuntime: runtime, assetCatalogRecords: [] });

    expect(presenter.apply).toHaveBeenCalledTimes(applyCount);
    expect(save).toHaveBeenCalledTimes(saveCount);
    expect(catalog.list).not.toHaveBeenCalled();
    const source = readFileSync(fileURLToPath(new URL("./activeThemePresentationSnapshot.ts", import.meta.url)), "utf8");
    expect(source).not.toContain("document.");
    expect(source).not.toContain("style.setProperty");
  });

  it("keeps Catalog loading in a separate read-only boundary and reports read failure", async () => {
    const { runtime } = createRuntime([]);
    await runtime.activate(cosmosTheme.objectId);
    const assetCatalog = {
      list: vi.fn().mockResolvedValue({ ok: false, error: { code: "offline", message: "offline" } }),
    };

    const snapshot = await loadActiveThemePresentationSnapshot({ themeRuntime: runtime, assetCatalog });

    expect(assetCatalog.list).toHaveBeenCalledTimes(1);
    expect(snapshot.diagnostics).toContainEqual(expect.objectContaining({ code: "asset-catalog-unavailable" }));
    expect(snapshot.resolutionStatus).toBe("resolved");
  });

  it("marks unresolved manifest pack references without inventing a Skin registry", async () => {
    const { runtime } = await activePackageRuntime();
    const snapshot = resolvePackage(runtime, { packs: [] });
    expect(snapshot.diagnostics).toContainEqual(expect.objectContaining({ code: "pack-unavailable", subjectId: packId }));
    expect(snapshot.skins.every((skin) => skin.source === "core-fallback")).toBe(true);
  });
});

function expectDeepFrozen(value: unknown, seen = new WeakSet<object>()): void {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  Object.values(value).forEach((child) => expectDeepFrozen(child, seen));
}
