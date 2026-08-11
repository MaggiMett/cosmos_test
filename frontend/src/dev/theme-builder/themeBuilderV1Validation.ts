import type { PersistedAssetCatalogRecord } from "../../runtime/assetCatalogApi";
import type { ThemeBuilderProject } from "../../theme-engine";

export type BuilderV1FindingSeverity = "must-fix" | "attention" | "recommendation" | "fallback";
export interface BuilderV1Finding {
  readonly severity: BuilderV1FindingSeverity;
  readonly message: string;
}
export interface BuilderV1Validation {
  readonly ready: boolean;
  readonly findings: readonly Readonly<BuilderV1Finding>[];
  readonly missingAssets: number;
  readonly unavailableAssets: number;
}

export function validateThemeBuilderV1(
  project: Readonly<ThemeBuilderProject>,
  catalog: readonly Readonly<PersistedAssetCatalogRecord>[],
  catalogLoaded: boolean,
): Readonly<BuilderV1Validation> {
  const findings: BuilderV1Finding[] = [];
  if (!project.name.trim()) findings.push({ severity: "must-fix", message: "Theme name is required." });
  const skins = project.artifacts.skinPacks.flatMap((pack) => pack.skins);
  if (!skins.length) findings.push({ severity: "must-fix", message: "Create at least one Look before export." });
  if (project.artifacts.roomShells.length || project.artifacts.catalogObjects.length) {
    findings.push({
      severity: "attention",
      message: "Room Shell and Catalog Object drafts remain Builder-only in Theme Package v1; Looks and referenced assets will export.",
    });
  }
  const catalogKeys = new Map(catalog.map((record) => [
    `${record.visualAsset.id}@${record.visualAsset.version}`,
    record,
  ]));
  let missingAssets = 0;
  let unavailableAssets = 0;
  if (catalogLoaded) {
    for (const reference of project.assetRefs) {
      const record = catalogKeys.get(`${reference.id}@${reference.version}`);
      if (!record) {
        missingAssets += 1;
        findings.push({ severity: "must-fix", message: `Missing catalog asset: ${reference.id}@${reference.version}.` });
      } else if (!record.resourceAvailable || record.catalogEntry.deprecated) {
        unavailableAssets += 1;
        findings.push({ severity: "must-fix", message: `Unavailable asset: ${reference.id}@${reference.version}.` });
      }
    }
  } else if (project.assetRefs.length) {
    findings.push({ severity: "attention", message: "Asset Catalog status could not be verified yet." });
  }
  const bindingCount = project.artifacts.skinPacks.reduce(
    (count, pack) => count + pack.skins.reduce((sum, skin) => sum + skin.assetBindings.length, 0),
    0,
  );
  const materialCount = project.artifacts.skinPacks.reduce(
    (count, pack) => count + pack.skins.reduce((sum, skin) => sum + skin.materials.length, 0),
    0,
  );
  if (skins.length && !bindingCount && !materialCount) {
    findings.push({ severity: "recommendation", message: "Your Look currently relies entirely on Core presentation." });
  }
  if (skins.length) findings.push({ severity: "fallback", message: "Unassigned visual slots continue to use validated Core fallback presentation." });
  return Object.freeze({
    ready: !findings.some((finding) => finding.severity === "must-fix"),
    findings: Object.freeze(findings.map(Object.freeze)),
    missingAssets,
    unavailableAssets,
  });
}
