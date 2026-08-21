import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BASE_MAIN_ROOM_TEMPLATE_ID,
  BASE_SLOT_IDS,
  TemplateRegistry,
  baseMainRoomTemplate,
  validateSkinPack,
  validateThemeBuilderProject,
  type ThemeBuilderProject,
} from "../../theme-engine";
import { projectLooksSlots, projectLooksStates } from "./looksStudioProjection";
import { projectThemeCoverage } from "./themeBoardProjection";
import { ThemeBuilderSession } from "./themeBuilderSession";
import { SkinDraftError, resolveSkinDraft } from "./themeBuilderSkinDraft";

const reference = Object.freeze({ id: "personal.visual-asset.real", version: "1.0.0" });

describe("persistent Skin draft commands", () => {
  it("creates a real SkinPack for a registered template without invented slots or assets", () => {
    const session = createSession();
    session.execute({ type: "create-skin-draft", targetTemplateId: BASE_MAIN_ROOM_TEMPLATE_ID });
    const pack = session.snapshot.project.artifacts.skinPacks[0]!;
    const skin = pack.skins[0]!;

    expect(validateSkinPack(pack)).toEqual(pack);
    expect(pack.assets).toEqual([]);
    expect(skin.target.templateRef).toEqual({ id: BASE_MAIN_ROOM_TEMPLATE_ID, versionRange: "1.0.0" });
    expect(skin.assetBindings).toEqual([]);
    expect(skin.materials).toEqual([]);
    expect(skin.stateVariants).toEqual([]);
    expect(Object.isFrozen(session.snapshot.project)).toBe(true);
  });

  it("duplicates a Skin Draft as an independent variant with new identities", () => {
    const session = skinSession();
    const original = currentSkin(session).skin;
    session.execute({ type: "duplicate-skin-draft", skinId: original.skinId });
    const packs = session.snapshot.project.artifacts.skinPacks;
    const duplicate = packs.flatMap((pack) => pack.skins).find((skin) => skin.skinId !== original.skinId)!;
    expect(duplicate.skinId).not.toBe(original.skinId);
    expect(duplicate.displayName).toBe(`${original.displayName} Copy`);
    expect(duplicate.target).toEqual(original.target);
    expect(duplicate.assetBindings).toEqual(original.assetBindings);
    expect(duplicate.materials).toEqual(original.materials);
    expect(packs.at(-1)?.packId).not.toBe(packs[0]?.packId);
    expect(Object.isFrozen(duplicate)).toBe(true);
  });

  it("rejects unknown templates and keeps the working snapshot unchanged", () => {
    const session = createSession();
    const before = session.snapshot.project;
    expect(() => session.execute({ type: "create-skin-draft", targetTemplateId: "unknown.template.v1" }))
      .toThrowError(SkinDraftError);
    expect(session.snapshot.project).toBe(before);
  });

  it("projects only real template slots and states with their declared fallbacks", () => {
    const session = skinSession();
    const resolved = currentSkin(session);
    const states = projectLooksStates(resolved.template);
    const slots = projectLooksSlots(resolved.skin, resolved.template, [], "hover");

    expect(states.map((state) => state.stateId)).toEqual(baseMainRoomTemplate.states.map((state) => state.stateId));
    expect(slots.map((slot) => slot.slotId)).toEqual(baseMainRoomTemplate.assetSlots.map((slot) => slot.slotId));
    expect(slots.every((slot) => slot.statusLabel === "Uses Core Fallback")).toBe(true);
    expect(JSON.stringify(slots)).not.toContain("Frame");
  });

  it("assigns only an exact Builder Asset Reference to a real slot and supports clear", () => {
    const session = skinSession();
    const skinId = currentSkin(session).skin.skinId;
    const before = session.snapshot.project;
    session.execute({
      type: "assign-skin-slot-asset",
      skinId,
      slotId: BASE_SLOT_IDS.background,
      stateId: "default",
      reference,
    }, catalogIndex());
    const assigned = currentSkin(session).skin.assetBindings[0]!;
    expect(assigned.assetId).toBe(reference.id);
    expect(session.snapshot.project).not.toBe(before);
    expect(before.artifacts.skinPacks[0]!.skins[0]!.assetBindings).toEqual([]);

    session.execute({ type: "clear-skin-slot-asset", skinId, slotId: BASE_SLOT_IDS.background, stateId: "default" });
    expect(currentSkin(session).skin.assetBindings).toEqual([]);
    expect(session.snapshot.project.assetRefs).toEqual([reference]);
  });

  it("rejects unreferenced assets, unknown slots, and unknown states immutably", () => {
    const session = skinSession();
    const skinId = currentSkin(session).skin.skinId;
    const before = session.snapshot.project;
    const base = { type: "assign-skin-slot-asset" as const, skinId, slotId: BASE_SLOT_IDS.background };
    expect(() => session.execute({ ...base, stateId: "default", reference: { id: "personal.asset.unknown", version: "1.0.0" } }, catalogIndex())).toThrowError(/not referenced/);
    expect(() => session.execute({ ...base, slotId: "unknown.slot", stateId: "default", reference }, catalogIndex())).toThrowError(/not declared/);
    expect(() => session.execute({ ...base, stateId: "idle", reference }, catalogIndex())).toThrowError(/not allowed/);
    expect(session.snapshot.project).toBe(before);
  });

  it("persists allowed state bindings and exposes default-state inheritance", () => {
    const session = skinSession();
    const skinId = currentSkin(session).skin.skinId;
    session.execute({ type: "assign-skin-slot-asset", skinId, slotId: BASE_SLOT_IDS.floor, stateId: "default", reference }, catalogIndex());
    let resolved = currentSkin(session);
    expect(projectLooksSlots(resolved.skin, resolved.template, [assetPresentation()], "hover").find((slot) => slot.slotId === BASE_SLOT_IDS.floor)?.statusLabel).toBe("Uses Default");

    session.execute({ type: "assign-skin-slot-asset", skinId, slotId: BASE_SLOT_IDS.floor, stateId: "hover", reference }, catalogIndex());
    resolved = currentSkin(session);
    expect(resolved.skin.stateVariants).toContainEqual(expect.objectContaining({ stateId: "hover" }));
    expect(resolved.skin.assetBindings.find((binding) => binding.states?.includes("hover"))).toBeDefined();
  });

  it("uses the renderer material allowlist for color, opacity, and texture references", () => {
    const session = skinSession();
    const skinId = currentSkin(session).skin.skinId;
    setMaterial(session, skinId, "core.material.fill", "#123456");
    setMaterial(session, skinId, "core.material.opacity", 0.45);
    setMaterial(session, skinId, "core.material.texture-ref", reference.id);
    expect(currentSkin(session).skin.materials[0]).toEqual({
      channelId: "core.material.dom-surface",
      parameters: {
        "core.material.fill": "#123456",
        "core.material.opacity": 0.45,
        "core.material.texture-ref": reference.id,
      },
    });

    const before = session.snapshot.project;
    expect(() => setMaterial(session, skinId, "core.material.script", "body{}" as never)).toThrowError(/unknown-parameter/);
    expect(() => setMaterial(session, skinId, "core.material.opacity", 2)).toThrowError(/parameter-out-of-range/);
    expect(() => setMaterial(session, skinId, "core.material.fill", "url(javascript:alert(1))")).toThrowError(/invalid-parameter-type/);
    expect(() => session.execute({ type: "set-skin-material-channel", skinId, channelId: "user.material.shader", parameterId: "user.shader.source", value: "void main(){}" })).toThrowError(/unknown-channel/);
    expect(() => setMaterial(session, skinId, "core.material.texture-ref", "personal.visual-asset.unknown")).toThrowError(/asset-unavailable/);
    expect(session.snapshot.project).toBe(before);
  });

  it("shares one undo/redo history across metadata, assets, Skin creation, binding, and material", () => {
    const session = createSession(false);
    session.execute({ type: "update-theme-metadata", metadata: { name: "Revised", description: "", author: "" } });
    session.execute({ type: "add-asset-reference", assetId: reference.id }, catalogIndex());
    session.execute({ type: "create-skin-draft", targetTemplateId: BASE_MAIN_ROOM_TEMPLATE_ID });
    const skinId = currentSkin(session).skin.skinId;
    session.execute({ type: "assign-skin-slot-asset", skinId, slotId: BASE_SLOT_IDS.background, stateId: "default", reference }, catalogIndex());
    setMaterial(session, skinId, "core.material.fill", "#abcdef");

    session.undo();
    expect(currentSkin(session).skin.materials).toEqual([]);
    session.undo();
    expect(currentSkin(session).skin.assetBindings).toEqual([]);
    session.undo();
    expect(session.snapshot.project.artifacts.skinPacks).toEqual([]);
    session.redo(); session.redo(); session.redo();
    expect(currentSkin(session).skin.materials[0]?.parameters["core.material.fill"]).toBe("#abcdef");
  });

  it("keeps a missing catalog asset binding visible instead of deleting it", () => {
    const session = skinSession();
    const skinId = currentSkin(session).skin.skinId;
    session.execute({ type: "assign-skin-slot-asset", skinId, slotId: BASE_SLOT_IDS.background, stateId: "default", reference }, catalogIndex());
    const resolved = currentSkin(session);
    const slot = projectLooksSlots(resolved.skin, resolved.template, [], "default").find((item) => item.slotId === BASE_SLOT_IDS.background);
    expect(slot).toMatchObject({ assetId: reference.id, assetStatus: "missing", statusLabel: "Missing / Unavailable" });
    expect(session.snapshot.project.assetRefs).toEqual([reference]);
  });

  it("saves Skin artifacts through the same CAS revision and restores the authoritative result", async () => {
    const session = skinSession();
    const skinId = currentSkin(session).skin.skinId;
    session.execute({ type: "assign-skin-slot-asset", skinId, slotId: BASE_SLOT_IDS.background, stateId: "default", reference }, catalogIndex());
    setMaterial(session, skinId, "core.material.fill", "#445566");
    let sentRevision = 0;
    let sentArtifacts: ThemeBuilderProject["artifacts"] | undefined;
    await session.save({ saveDraft: async (_id, revision, _metadata, _references, artifacts) => {
      sentRevision = revision;
      sentArtifacts = artifacts;
      return { ok: true, data: validateThemeBuilderProject({
        ...session.snapshot.project,
        revision: revision + 1,
      }) };
    } });

    expect(sentRevision).toBe(1);
    expect(sentArtifacts?.skinPacks[0]?.skins[0]?.assetBindings).toHaveLength(1);
    expect(session.snapshot.project.revision).toBe(2);
    expect(currentSkin(session).skin.materials[0]?.parameters["core.material.fill"]).toBe("#445566");
    expect(session.snapshot.dirty).toBe(false);
  });

  it("drives Theme Board Looks coverage from the real Skin artifact only", () => {
    const session = skinSession();
    expect(projectThemeCoverage(session.snapshot.project).find((item) => item.label.startsWith("Looks")))
      .toMatchObject({ status: "custom" });
  });

  it("has no dependency on installed or active Theme Runtime authorities", () => {
    const source = readFileSync(fileURLToPath(new URL("./themeBuilderSkinDraft.ts", import.meta.url)), "utf8");
    for (const forbidden of ["ThemeRuntime", "ThemeRegistry", "ThemePackageRegistry", "ActiveThemePresentationSnapshot"]) {
      expect(source).not.toContain(forbidden);
    }
  });
});

function registry(): TemplateRegistry { const value = new TemplateRegistry(); value.register(baseMainRoomTemplate); return value; }
function createSession(withReference = true): ThemeBuilderSession { return new ThemeBuilderSession(project(withReference), registry()); }
function skinSession(): ThemeBuilderSession { const value = createSession(); value.execute({ type: "create-skin-draft", targetTemplateId: BASE_MAIN_ROOM_TEMPLATE_ID }); return value; }
function currentSkin(session: ThemeBuilderSession) { return resolveSkinDraft(session.snapshot.project, session.snapshot.project.artifacts.skinPacks[0]!.skins[0]!.skinId, registry()); }
function setMaterial(session: ThemeBuilderSession, skinId: string, parameterId: string, value: string | number): void { session.execute({ type: "set-skin-material-channel", skinId, channelId: "core.material.dom-surface", parameterId, value }); }
function catalogIndex() {
  return {
    referenceFor: () => reference,
    recordFor: () => ({
      visualAsset: { id: reference.id, version: reference.version, kind: "vector", format: "svg" },
      catalogEntry: { deprecated: false },
      resourceAvailable: true,
    }),
  } as never;
}
function assetPresentation() {
  return { reference, status: "available" as const, name: "Real Asset", category: "Decoration" };
}

function project(withReference: boolean): Readonly<ThemeBuilderProject> {
  return Object.freeze({
    schemaVersion: 1, builderProjectId: "user.theme-builder-project.test", revision: 1,
    createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
    contractVersions: { themeBuilder: "1.0.0", themeEngine: "1.0.0" },
    themeId: "user.theme.test", packageId: "user.theme-package.test", name: "Orbit", description: "", author: "",
    packageType: "full-theme", themeVersion: "0.1.0", packageVersion: "0.1.0",
    manifestDraft: {
      schemaVersion: 1, themeId: "user.theme.test", version: "0.1.0", displayName: "Orbit", description: "",
      packageKind: "full-theme", compatibility: { themeEngine: "^1.0.0", cosmos: "^1.0.0" }, groups: [], packRefs: [], tokens: {}, systemTerms: {},
    },
    artifacts: { skinPacks: [], roomShells: [], catalogObjects: [] },
    assetRefs: withReference ? [reference] : [],
  } as ThemeBuilderProject);
}
