import type { ThemeBuilderProject } from "../../theme-engine";
import type { CoverageItem } from "./components/ThemeCoverage.vue";
import type { WorkingItem } from "./components/ContinueWorking.vue";

export function projectThemeCoverage(project: Readonly<ThemeBuilderProject>): readonly CoverageItem[] {
  const skins = project.artifacts.skinPacks.flatMap((pack) => pack.skins);
  const materialCount = skins.reduce((count, skin) => count + skin.materials.length, 0);
  const animationCount = skins.reduce((count, skin) => count + (skin.animations?.length ?? 0), 0);
  return Object.freeze([
    coverage("Looks", "spark", project.artifacts.skinPacks.length),
    coverage("Rooms", "room", project.artifacts.roomShells.length),
    coverage("Objects", "object", project.artifacts.catalogObjects.length),
    coverage("Materials", "material", materialCount),
    coverage("Motion", "motion", animationCount),
    coverage("Assets", "window", project.assetRefs.length),
  ]);
}

export function projectContinueWorking(
  project: Readonly<ThemeBuilderProject>,
  dirty: boolean,
): readonly WorkingItem[] {
  return Object.freeze([{
    name: project.name,
    type: "Theme Builder Project",
    state: dirty ? "Unsaved metadata" : `Saved revision ${project.revision}`,
  }]);
}

function coverage(label: string, icon: string, count: number): CoverageItem {
  return { label: `${label} · ${count}`, icon, status: count > 0 ? "custom" : "fallback" };
}
