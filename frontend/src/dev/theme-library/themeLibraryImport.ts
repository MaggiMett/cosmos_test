import { ref, type Ref } from "vue";

import type { ApiError } from "../../runtime/contracts";
import type {
  ThemePackageImportApi,
  ThemePackageImportDiagnostic,
  ThemePackageImportSuccess,
} from "../../runtime/themePackageImportApi";

export const THEME_PACKAGE_MAXIMUM_BYTES = 256 * 1024 * 1024;

export type ThemeLibraryImportStatus = "idle" | "ready" | "importing" | "success" | "error";

export type ThemeLibraryImportFailureKind =
  | "missing-file"
  | "invalid-file"
  | "empty-file"
  | "too-large"
  | "invalid-package"
  | "unsupported-version"
  | "conflict"
  | "invalid-asset"
  | "integrity-failure"
  | "core-collision"
  | "generic";

export interface ThemeLibraryImportFailure {
  readonly kind: ThemeLibraryImportFailureKind;
  readonly title: string;
  readonly message: string;
  readonly technicalCode?: string;
  readonly diagnostics: readonly Readonly<ThemePackageImportDiagnostic>[];
}

export interface ThemeLibraryImportController {
  readonly selectedFile: Ref<File | null>;
  readonly importStatus: Ref<ThemeLibraryImportStatus>;
  readonly importResult: Ref<Readonly<ThemePackageImportSuccess> | null>;
  readonly importError: Ref<Readonly<ThemeLibraryImportFailure> | null>;
  selectFile(file: File | null): boolean;
  importSelected(): Promise<boolean>;
  reset(): boolean;
}

export function useThemeLibraryImport(
  api: Pick<ThemePackageImportApi, "importPackage">,
): ThemeLibraryImportController {
  const selectedFile = ref<File | null>(null);
  const importStatus = ref<ThemeLibraryImportStatus>("idle");
  const importResult = ref<Readonly<ThemePackageImportSuccess> | null>(null);
  const importError = ref<Readonly<ThemeLibraryImportFailure> | null>(null);

  function selectFile(file: File | null): boolean {
    if (importStatus.value === "importing") return false;
    selectedFile.value = file;
    importResult.value = null;
    const failure = precheckThemePackageFile(file);
    importError.value = failure;
    importStatus.value = failure ? "error" : "ready";
    return failure === null;
  }

  async function importSelected(): Promise<boolean> {
    if (importStatus.value === "importing") return false;
    const failure = precheckThemePackageFile(selectedFile.value);
    if (failure) {
      importError.value = failure;
      importResult.value = null;
      importStatus.value = "error";
      return false;
    }

    importStatus.value = "importing";
    importError.value = null;
    importResult.value = null;
    const result = await api.importPackage(selectedFile.value as File);
    if (result.ok) {
      importResult.value = Object.freeze(result.data);
      importStatus.value = "success";
      return true;
    }

    importError.value = importFailure(result.error);
    importStatus.value = "error";
    return false;
  }

  function reset(): boolean {
    if (importStatus.value === "importing") return false;
    selectedFile.value = null;
    importStatus.value = "idle";
    importResult.value = null;
    importError.value = null;
    return true;
  }

  return { selectedFile, importStatus, importResult, importError, selectFile, importSelected, reset };
}

export function precheckThemePackageFile(
  file: Pick<File, "name" | "size" | "type"> | null,
): Readonly<ThemeLibraryImportFailure> | null {
  if (!file) return localFailure("missing-file", "Choose a Theme Pack", "Select one ZIP file first.");
  if (!file.name.toLocaleLowerCase().endsWith(".zip")) {
    return localFailure(
      "invalid-file",
      "ZIP file required",
      "Theme Packs must use the .zip package container.",
    );
  }
  if (file.size === 0) {
    return localFailure("empty-file", "This file is empty", "Choose a non-empty Theme Pack ZIP.");
  }
  if (file.size > THEME_PACKAGE_MAXIMUM_BYTES) {
    return localFailure(
      "too-large",
      "Theme Pack is too large",
      "Theme Packs can be at most 256 MiB.",
    );
  }
  if (
    file.type &&
    !["application/zip", "application/x-zip-compressed", "application/octet-stream"].includes(
      file.type.toLocaleLowerCase(),
    )
  ) {
    return localFailure(
      "invalid-file",
      "ZIP file required",
      "The selected file is not identified as a ZIP package.",
    );
  }
  return null;
}

function localFailure(
  kind: ThemeLibraryImportFailureKind,
  title: string,
  message: string,
): Readonly<ThemeLibraryImportFailure> {
  return Object.freeze({ kind, title, message, diagnostics: Object.freeze([]) });
}

function importFailure(error: Readonly<ApiError>): Readonly<ThemeLibraryImportFailure> {
  const diagnostics = diagnosticsFrom(error.details);
  const code = error.code ?? diagnostics[0]?.code;
  const identity = code ?? "";

  if (error.status === 409 || identity === "theme_package_conflict") {
    return failure("conflict", "Theme Pack already installed", "This package version is already installed.", code, diagnostics);
  }
  if (error.status === 413 || identity.includes("too_large") || identity.includes("too_many")) {
    return failure("too-large", "Theme Pack is too large", "The package exceeds a safe import limit.", code, diagnostics);
  }
  if (identity.includes("unsupported") || identity.includes("incompatible")) {
    return failure("unsupported-version", "Theme Pack is not supported", "This package requires a different Cosmos or Theme Engine version.", code, diagnostics);
  }
  if (identity.includes("integrity")) {
    return failure("integrity-failure", "Integrity check failed", "The package contents do not match their declared digests.", code, diagnostics);
  }
  if (identity.includes("core_conflict")) {
    return failure("core-collision", "Cosmos Core cannot be replaced", "Choose a Theme Pack with its own Theme identity.", code, diagnostics);
  }
  if (identity.includes("asset") || identity === "unsafe_svg") {
    return failure("invalid-asset", "Theme asset was rejected", "One or more package assets failed the existing Asset Catalog safety checks.", code, diagnostics);
  }
  if (error.status === 400 || error.status === 422 || error.kind === "validation") {
    return failure("invalid-package", "Theme Pack is invalid", "Cosmos could not validate this Theme Pack.", code, diagnostics);
  }
  return failure("generic", "Theme Pack could not be imported", "Cosmos could not complete the import. Try again when the Runtime is available.", code, diagnostics);
}

function failure(
  kind: ThemeLibraryImportFailureKind,
  title: string,
  message: string,
  technicalCode: string | undefined,
  diagnostics: readonly Readonly<ThemePackageImportDiagnostic>[],
): Readonly<ThemeLibraryImportFailure> {
  return Object.freeze({
    kind,
    title,
    message,
    ...(technicalCode ? { technicalCode } : {}),
    diagnostics,
  });
}

function diagnosticsFrom(value: unknown): readonly Readonly<ThemePackageImportDiagnostic>[] {
  if (!value || typeof value !== "object" || !("diagnostics" in value)) return Object.freeze([]);
  const diagnostics = value.diagnostics;
  if (!Array.isArray(diagnostics)) return Object.freeze([]);
  return Object.freeze(
    diagnostics.flatMap((item) =>
      item &&
      typeof item === "object" &&
      "code" in item &&
      typeof item.code === "string" &&
      "message" in item &&
      typeof item.message === "string"
        ? [Object.freeze({ code: item.code, message: item.message })]
        : [],
    ),
  );
}
