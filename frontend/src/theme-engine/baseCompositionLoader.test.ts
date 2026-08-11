import { describe, expect, it } from "vitest";

import { AssetRegistry } from "./assetRegistry";
import {
  BaseCompositionLoader,
  BaseCompositionLoaderError,
} from "./baseCompositionLoader";
import {
  BASE_FUNCTIONAL_ZONE_IDS,
  BASE_SLOT_IDS,
  baseMainRoomTemplate,
} from "./baseTemplate";
import {
  CORE_DEFAULT_BASE_ASSET_ID,
  coreDefaultBaseAssetRegistration,
  coreDefaultBaseComposition,
  coreDefaultBaseFunctionBindings,
  coreDefaultBaseSkinPack,
} from "./coreDefaultBaseSkin";
import { TemplateRegistry } from "./templateRegistry";
import type {
  Composition,
  FunctionalObjectScenePayload,
  SceneNode,
  SkinPack,
} from "./types";

describe("BaseCompositionLoader", () => {
  it("produces an isolated renderable Base scene with complete fallback data", async () => {
    const { loader } = await createLoader();
    const scene = await loadCoreDefault(loader);

    expect(scene.template.templateId).toBe("base.main-room.v1");
    expect(scene.skin.skinId).toBe("core.skin.base.default");
    expect(scene.surfaces).toHaveLength(8);
    expect(scene.functionalObjects).toHaveLength(6);
    expect(
      scene.functionalObjects.find(
        (object) => object.functionalZone.zoneId === BASE_FUNCTIONAL_ZONE_IDS.leftDoor,
      )?.assetSlot?.slotId,
    ).toBe(BASE_SLOT_IDS.leftDoor);
    expect(scene.functionalObjects.every((object) => object.states.includes("default"))).toBe(
      true,
    );
  });

  it("keeps Visual and Interaction Bounds independent", async () => {
    const { loader } = await createLoader();
    const scene = await loadCoreDefault(loader);
    const leftDoor = scene.functionalObjects.find(
      (object) => object.functionalZone.zoneId === BASE_FUNCTIONAL_ZONE_IDS.leftDoor,
    );

    expect(leftDoor?.visualBounds).not.toEqual(leftDoor?.interactionBounds);
    expect(leftDoor?.effectBounds).not.toEqual(leftDoor?.interactionBounds);
    expect(leftDoor?.layoutBounds).not.toEqual(leftDoor?.visualBounds);
  });

  it("accepts freely positioned and scaled Interaction Bounds without normalizing them", async () => {
    const { loader } = await createLoader();
    const interactionBounds = {
      type: "rect" as const,
      x: 333,
      y: 222,
      width: 287,
      height: 119,
    };
    const composition = replaceFunctionalPayload(
      coreDefaultBaseComposition,
      BASE_FUNCTIONAL_ZONE_IDS.leftDoor,
      (payload) => ({ ...payload, interactionBounds }),
    );

    const scene = await loader.load(defaultInput(composition));
    const leftDoor = scene.functionalObjects.find(
      (object) => object.functionalZone.zoneId === BASE_FUNCTIONAL_ZONE_IDS.leftDoor,
    );
    expect(leftDoor?.interactionBounds).toEqual(interactionBounds);
  });

  it("uses the configured fallback asset when a selected Skin asset is missing", async () => {
    const { loader } = await createLoader();
    const missingAssetSkin = skinPackWith(
      "test.skin-pack.base.missing-asset",
      "test.skin.base.missing-asset",
      coreDefaultBaseSkinPack.skins[0]!.assetBindings.map((binding) => ({
        ...binding,
        bindingId: binding.bindingId.replace("core.binding", "test.binding"),
        assetId: "test.asset.missing",
      })),
    );

    const scene = await loader.load({
      ...defaultInput(coreDefaultBaseComposition),
      skinPacks: [coreDefaultBaseSkinPack, missingAssetSkin],
      activeThemeSkinRef: {
        id: "test.skin.base.missing-asset",
        versionRange: "^1.0.0",
      },
    });

    expect(scene.skin.skinId).toBe("test.skin.base.missing-asset");
    expect(scene.surfaces.every((surface) => surface.slot.usedAssetFallback)).toBe(true);
    expect(scene.surfaces[0]?.slot.asset.metadata.assetId).toBe(
      CORE_DEFAULT_BASE_ASSET_ID,
    );
  });

  it("rejects a Core fallback Skin with a missing required slot", async () => {
    const { loader } = await createLoader();
    const incomplete = skinPackWith(
      "test.skin-pack.base.incomplete",
      "test.skin.base.incomplete",
      coreDefaultBaseSkinPack.skins[0]!.assetBindings
        .filter((binding) => binding.slotId !== BASE_SLOT_IDS.background)
        .map((binding) => ({
          ...binding,
          bindingId: binding.bindingId.replace("core.binding", "test.binding"),
        })),
    );

    await expect(
      loader.load({
        ...defaultInput(coreDefaultBaseComposition),
        skinPacks: [incomplete],
        coreDefaultSkinRef: {
          id: "test.skin.base.incomplete",
          versionRange: "^1.0.0",
        },
      }),
    ).rejects.toMatchObject({ code: "base_required_slot_missing" });
  });

  it("preserves stable Function Bindings and rejects role changes", async () => {
    const { loader } = await createLoader();
    const first = await loadCoreDefault(loader);
    const second = await loadCoreDefault(loader);
    expect(
      first.functionalObjects.map((object) => object.functionBinding.descriptorId),
    ).toEqual(second.functionalObjects.map((object) => object.functionBinding.descriptorId));
    expect(first.functionalObjects.every((object) => Object.isFrozen(object.functionBinding))).toBe(
      true,
    );

    const invalidBindings = coreDefaultBaseFunctionBindings.map((binding) =>
      binding.functionalZoneId === BASE_FUNCTIONAL_ZONE_IDS.leftDoor
        ? { ...binding, descriptorRole: "tool.open" }
        : binding,
    );
    await expect(
      loader.load({
        ...defaultInput(coreDefaultBaseComposition),
        functionBindings: invalidBindings,
      }),
    ).rejects.toBeInstanceOf(BaseCompositionLoaderError);
  });
});

async function createLoader(): Promise<{
  loader: BaseCompositionLoader;
  assetRegistry: AssetRegistry;
}> {
  const templateRegistry = new TemplateRegistry();
  templateRegistry.register(baseMainRoomTemplate);
  const assetRegistry = new AssetRegistry();
  await assetRegistry.register(coreDefaultBaseAssetRegistration);
  assetRegistry.setFallbackAsset(CORE_DEFAULT_BASE_ASSET_ID);
  return {
    loader: new BaseCompositionLoader(templateRegistry, assetRegistry),
    assetRegistry,
  };
}

function defaultInput(composition: Composition) {
  return {
    composition,
    skinPacks: [coreDefaultBaseSkinPack],
    functionBindings: coreDefaultBaseFunctionBindings,
    context: {
      environmentId: "base.main-room",
      roomId: "room.main",
      instanceId: "base.instance.1",
    },
  };
}

function loadCoreDefault(loader: BaseCompositionLoader) {
  return loader.load(defaultInput(coreDefaultBaseComposition));
}

function skinPackWith(
  packId: string,
  skinId: string,
  assetBindings: SkinPack["skins"][number]["assetBindings"],
): SkinPack {
  const source = coreDefaultBaseSkinPack.skins[0]!;
  return {
    ...coreDefaultBaseSkinPack,
    packId,
    packageKind: "single-skin",
    assets: [],
    skins: [
      {
        ...source,
        skinId,
        assetBindings,
      },
    ],
  };
}

function replaceFunctionalPayload(
  composition: Composition,
  zoneId: string,
  replace: (payload: FunctionalObjectScenePayload) => FunctionalObjectScenePayload,
): Composition {
  const sourceScene = composition.environmentScenes[0]!;
  const nodes = sourceScene.nodes.map((node): SceneNode => {
    if (
      node.kind !== "functional-object" ||
      node.payload.kind !== "functional-object" ||
      node.payload.functionalZoneId !== zoneId
    ) {
      return node;
    }
    return { ...node, payload: replace(node.payload) };
  });
  return {
    ...composition,
    environmentScenes: [{ ...sourceScene, nodes }],
  };
}
