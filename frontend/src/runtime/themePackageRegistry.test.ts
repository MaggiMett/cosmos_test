import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import type { ThemeManifest } from "../theme-engine/types";
import { cosmosTheme } from "../themes/cosmos";
import type { CosmosApiClient } from "./apiClient";
import { ApplicationRuntime } from "./applicationRuntime";
import { ThemeRegistry } from "./themeRegistry";
import { ThemeRuntime, type ThemePresenter } from "./themeRuntime";
import type {
  PersistedThemeActivationState,
  ThemeActivationPersistence,
} from "./themeRuntimePersistence";
import {
  ApiThemePackageRecordSource,
  InstalledThemePackageLoader,
  createThemeManifestDigest,
  type InstalledThemePackageRecord,
  type ThemePackageRecordSource,
} from "./themePackageRegistry";
import { TransitionRuntime } from "./transitionRuntime";

const requiredGroups: ThemeManifest["groups"] = [
  "world",
  "map",
  "base-entry",
  "base-interior",
  "room",
  "workspace",
  "window",
  "companion",
  "icon",
  "node",
  "connection",
  "label",
  "status",
];

function manifest(
  themeId = "max.theme.aurora",
  version = "1.0.0",
): ThemeManifest {
  return {
    schemaVersion: 1,
    themeId,
    version,
    displayName: version === "1.0.0" ? "Aurora" : `Aurora ${version}`,
    description: "A persisted test Theme.",
    packageKind: "full-theme",
    compatibility: { themeEngine: "^1.0.0" },
    groups: requiredGroups,
    packRefs: [],
    defaultCompositionRef: {
      id: "max.composition.aurora",
      versionRange: `^${version}`,
    },
    tokens: {
      "cosmos.color.background": { type: "color", value: "#07111f" },
      "cosmos.color.accent": { type: "color", value: "#88ddff" },
    },
    systemTerms: { "system.base": { en: "Base" } },
    author: { name: "Max" },
  };
}

function installedSkinPack() {
  return {
    schemaVersion: 1,
    packId: "max.skin-pack.aurora",
    version: "1.0.0",
    packageKind: "skin-pack",
    displayName: "Aurora SkinPack",
    compatibility: { themeEngine: "^1.0.0" },
    assets: [],
    skins: [
      {
        skinId: "max.skin.aurora.base",
        version: "1.0.0",
        displayName: "Aurora Base",
        target: {
          presentationGroup: "base-interior",
          templateRef: { id: "base.main-room.v1", versionRange: "^1.0.0" },
        },
        assetBindings: [],
        tokens: {},
        materials: [],
        stateVariants: [],
      },
    ],
  } as const;
}

async function record(
  themeManifest = manifest(),
  packageId = "max.theme-package.aurora",
): Promise<InstalledThemePackageRecord> {
  return {
    schemaVersion: 1,
    packageId,
    packageVersion: themeManifest.version,
    themeId: themeManifest.themeId,
    manifestVersion: 1,
    displayName: themeManifest.displayName,
    description: themeManifest.description ?? null,
    author: themeManifest.author ?? null,
    installStatus: "installed",
    source: { kind: "prevalidated", provenance: "automated test" },
    manifestDigest: await createThemeManifestDigest(themeManifest),
    manifest: themeManifest,
    installedAt: "2026-08-09T10:00:00+00:00",
    updatedAt: "2026-08-09T10:00:00+00:00",
  };
}

class StaticSource implements ThemePackageRecordSource {
  constructor(private readonly records: readonly unknown[]) {}

  async listInstalled(): Promise<readonly unknown[]> {
    return this.records;
  }
}

function coreRegistry(): ThemeRegistry {
  const registry = new ThemeRegistry();
  registry.register(cosmosTheme);
  return registry;
}

describe("Installed Theme Package startup loader", () => {
  it("keeps Core registered and adds a valid installed Theme with its real ID", async () => {
    const registry = coreRegistry();
    const installed = await record();
    const loader = new InstalledThemePackageLoader(
      new StaticSource([installed]),
      registry,
      cosmosTheme.objectId,
    );

    const report = await loader.load();

    expect(registry.resolve(cosmosTheme.objectId)).toEqual(cosmosTheme);
    expect(registry.resolve(installed.themeId)).toMatchObject({
      objectId: installed.themeId,
      displayName: "Aurora",
      version: "1.0.0",
      description: "A persisted test Theme.",
      author: "Max",
      tokens: {
        "--cosmos-color-background": "#07111f",
        "--cosmos-color-accent": "#88ddff",
        "--cosmos-color-text": cosmosTheme.tokens["--cosmos-color-text"],
      },
    });
    expect(report.registeredThemeIds).toEqual([installed.themeId]);
    expect(loader.lastReport).toBe(report);
  });

  it("loads installed SkinPacks through the existing Package read boundary", async () => {
    const registry = coreRegistry();
    const pack = installedSkinPack();
    const packageManifest = {
      ...manifest(),
      packRefs: [{ id: pack.packId, versionRange: "^1.0.0" }],
    } satisfies ThemeManifest;
    const installed = {
      ...(await record(packageManifest)),
      skinPacks: [
        {
          path: "skin-packs/max.skin-pack.aurora/1.0.0/skin-pack.json",
          sha256: await createThemeManifestDigest(pack),
          packId: pack.packId,
          packVersion: pack.version,
          skinPack: pack,
        },
      ],
    };
    const loader = new InstalledThemePackageLoader(
      new StaticSource([installed]),
      registry,
      cosmosTheme.objectId,
    );

    await loader.load();

    const loaded = loader.readPresentationSkinPacks(installed.themeId);
    expect(loaded).toEqual([pack]);
    expect(Object.isFrozen(loaded)).toBe(true);
    expect(Object.isFrozen(loaded[0]?.skins)).toBe(true);
    expect(loader.readPresentationSkinPacks("max.theme.unknown")).toEqual([]);
  });

  it("isolates an installed SkinPack digest mismatch before Theme registration", async () => {
    const registry = coreRegistry();
    const pack = installedSkinPack();
    const packageManifest = {
      ...manifest(),
      packRefs: [{ id: pack.packId, versionRange: "^1.0.0" }],
    } satisfies ThemeManifest;
    const installed = {
      ...(await record(packageManifest)),
      skinPacks: [
        {
          path: "skin-packs/max.skin-pack.aurora/1.0.0/skin-pack.json",
          sha256: "0".repeat(64),
          packId: pack.packId,
          packVersion: pack.version,
          skinPack: pack,
        },
      ],
    };
    const loader = new InstalledThemePackageLoader(
      new StaticSource([installed]),
      registry,
      cosmosTheme.objectId,
    );

    const report = await loader.load();

    expect(report.diagnostics).toContainEqual(expect.objectContaining({ status: "invalid" }));
    expect(registry.has(installed.themeId)).toBe(false);
    expect(loader.readPresentationSkinPacks(installed.themeId)).toEqual([]);
  });

  it("is idempotent across ApplicationRuntime retries", async () => {
    const registry = coreRegistry();
    const source = new StaticSource([await record()]);
    const listInstalled = vi.spyOn(source, "listInstalled");
    const loader = new InstalledThemePackageLoader(
      source,
      registry,
      cosmosTheme.objectId,
    );

    const first = await loader.load();
    const second = await loader.load();

    expect(second).toBe(first);
    expect(listInstalled).toHaveBeenCalledTimes(1);
    expect(registry.resolve("max.theme.aurora").version).toBe("1.0.0");
  });

  it("makes installed Themes visible through the existing ThemeRuntime read snapshot", async () => {
    const registry = coreRegistry();
    const installed = await record();
    await new InstalledThemePackageLoader(
      new StaticSource([installed]),
      registry,
      cosmosTheme.objectId,
    ).load();
    const runtime = new ThemeRuntime(registry, new TransitionRuntime(), cosmosTheme.objectId);

    expect(runtime.readSnapshot().themes).toContainEqual(
      expect.objectContaining({
        themeId: installed.themeId,
        name: "Aurora",
        author: "Max",
        registryStatus: "registered",
      }),
    );
  });

  it("selects the highest valid version deterministically for the existing one-ID Registry", async () => {
    const registry = coreRegistry();
    const older = await record(manifest("max.theme.aurora", "1.0.0"), "max.package.aurora");
    const newer = await record(manifest("max.theme.aurora", "2.1.0"), "max.package.aurora");
    const loader = new InstalledThemePackageLoader(
      new StaticSource([newer, older]),
      registry,
      cosmosTheme.objectId,
    );

    const report = await loader.load();

    expect(registry.resolve("max.theme.aurora").version).toBe("2.1.0");
    expect(report.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ packageVersion: "1.0.0", status: "superseded" }),
        expect.objectContaining({ packageVersion: "2.1.0", status: "registered" }),
      ]),
    );
  });

  it("isolates a schema-invalid installed manifest without damaging startup", async () => {
    const registry = coreRegistry();
    const { groups: _groups, ...invalidManifest } = manifest();
    const invalid = {
      ...(await record()),
      manifest: invalidManifest,
      manifestDigest: await createThemeManifestDigest(invalidManifest),
    };
    const loader = new InstalledThemePackageLoader(
      new StaticSource([invalid]),
      registry,
      cosmosTheme.objectId,
    );

    await expect(loader.load()).resolves.toMatchObject({
      registeredThemeIds: [],
      diagnostics: [expect.objectContaining({ status: "invalid" })],
    });
    expect(registry.list().map((theme) => theme.objectId)).toEqual([cosmosTheme.objectId]);
  });

  it("blocks a manifest digest mismatch", async () => {
    const registry = coreRegistry();
    const invalid = { ...(await record()), manifestDigest: "0".repeat(64) };
    const report = await new InstalledThemePackageLoader(
      new StaticSource([invalid]),
      registry,
      cosmosTheme.objectId,
    ).load();

    expect(report.diagnostics[0]).toMatchObject({ status: "invalid" });
    expect(report.diagnostics[0]?.message).toContain("integrity");
    expect(registry.has(invalid.themeId)).toBe(false);
  });

  it("does not allow an installed package to overwrite the code-native Core Theme", async () => {
    const registry = coreRegistry();
    const coreCollision = await record(
      manifest(cosmosTheme.objectId, "9.0.0"),
      "max.package.core-collision",
    );
    const report = await new InstalledThemePackageLoader(
      new StaticSource([coreCollision]),
      registry,
      cosmosTheme.objectId,
    ).load();

    expect(report.diagnostics[0]).toMatchObject({ status: "conflict" });
    expect(registry.resolve(cosmosTheme.objectId)).toEqual(cosmosTheme);
  });

  it("keeps incompatible or non-full packages installed but unavailable", async () => {
    const registry = coreRegistry();
    const incompatibleManifest = {
      ...manifest(),
      compatibility: { themeEngine: "^2.0.0" },
    } satisfies ThemeManifest;
    const incompatible = await record(incompatibleManifest);

    const report = await new InstalledThemePackageLoader(
      new StaticSource([incompatible]),
      registry,
      cosmosTheme.objectId,
    ).load();

    expect(report.diagnostics[0]).toMatchObject({ status: "unavailable" });
    expect(registry.has(incompatible.themeId)).toBe(false);
  });

  it("restores persisted activation only after the installed Theme was registered", async () => {
    const installed = await record();
    const registry = coreRegistry();
    const order: string[] = [];
    const source: ThemePackageRecordSource = {
      listInstalled: vi.fn(async () => {
        order.push("packages");
        return [installed];
      }),
    };
    const activationPersistence: ThemeActivationPersistence = {
      load: vi.fn(async () => {
        order.push("activation");
        return {
          schemaVersion: 1,
          activeThemeId: installed.themeId,
          lastKnownGoodThemeId: cosmosTheme.objectId,
        } satisfies PersistedThemeActivationState;
      }),
      save: vi.fn(async () => undefined),
    };
    const presenter: ThemePresenter = {
      apply: vi.fn((definition) => {
        order.push(`apply:${definition.objectId}`);
      }),
    };
    const loader = new InstalledThemePackageLoader(source, registry, cosmosTheme.objectId);
    const themes = new ThemeRuntime(
      registry,
      new TransitionRuntime(),
      cosmosTheme.objectId,
      presenter,
      activationPersistence,
    );
    const api = {
      get: vi.fn().mockResolvedValue({
        ok: true,
        data: { service: "cosmos", status: "ready" },
      }),
    } as unknown as CosmosApiClient;

    await new ApplicationRuntime(api, themes, cosmosTheme.objectId, loader).start();

    expect(order.slice(0, 3)).toEqual([
      "packages",
      "activation",
      `apply:${installed.themeId}`,
    ]);
    expect(themes.readSnapshot().activeThemeId).toBe(installed.themeId);
  });

  it("falls back to Core if the formerly active installed Theme is no longer available", async () => {
    const registry = coreRegistry();
    const activationPersistence: ThemeActivationPersistence = {
      load: vi.fn().mockResolvedValue({
        schemaVersion: 1,
        activeThemeId: "max.theme.removed",
        lastKnownGoodThemeId: "max.theme.also-removed",
      }),
      save: vi.fn(async () => undefined),
    };
    const themes = new ThemeRuntime(
      registry,
      new TransitionRuntime(),
      cosmosTheme.objectId,
      { apply: vi.fn() },
      activationPersistence,
    );
    await new InstalledThemePackageLoader(
      new StaticSource([]),
      registry,
      cosmosTheme.objectId,
    ).load();

    await themes.restoreAtStartup(cosmosTheme.objectId);

    expect(themes.readSnapshot().activeThemeId).toBe(cosmosTheme.objectId);
  });

  it("turns package-source failure into diagnostics and preserves Core startup", async () => {
    const registry = coreRegistry();
    const source: ThemePackageRecordSource = {
      listInstalled: vi.fn().mockRejectedValue(new Error("Package registry unavailable")),
    };

    const report = await new InstalledThemePackageLoader(
      source,
      registry,
      cosmosTheme.objectId,
    ).load();

    expect(report.diagnostics).toEqual([
      expect.objectContaining({ status: "registry-unavailable" }),
    ]);
    expect(registry.has(cosmosTheme.objectId)).toBe(true);
  });

  it("reads packages through the API boundary without persistence or asset bytes", async () => {
    const installed = await record();
    const api = {
      get: vi.fn().mockResolvedValue({ ok: true, data: { items: [installed] } }),
    } as unknown as CosmosApiClient;

    await expect(new ApiThemePackageRecordSource(api).listInstalled()).resolves.toEqual([
      installed,
    ]);
    expect(api.get).toHaveBeenCalledWith("/theme-packages");
    expect(Object.keys(installed).sort()).not.toContain("assetBytes");

    const runtimeSource = readFileSync(
      fileURLToPath(new URL("./themeRuntime.ts", import.meta.url)),
      "utf8",
    );
    expect(runtimeSource).not.toContain("SQLite");
    expect(runtimeSource).not.toContain("/theme-packages");
  });
});
