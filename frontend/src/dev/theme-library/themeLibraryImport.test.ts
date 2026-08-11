import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import type { ApiError, ApiResult } from "../../runtime/contracts";
import type { ThemePackageImportSuccess } from "../../runtime/themePackageImportApi";
import {
  THEME_PACKAGE_MAXIMUM_BYTES,
  precheckThemePackageFile,
  useThemeLibraryImport,
} from "./themeLibraryImport";

const success: ThemePackageImportSuccess = {
  success: true,
  packageId: "max.theme-package.aurora",
  packageVersion: "1.0.0",
  themeId: "max.theme.aurora",
  themeName: "Aurora",
  installStatus: "installed",
  diagnostics: [],
  assets: { total: 2, installed: 2, reused: 0 },
  integrity: {
    status: "verified",
    archiveSha256: "a".repeat(64),
    manifestSha256: "b".repeat(64),
  },
  runtimeRegistration: "next-startup",
};

describe("Theme Library package import controller", () => {
  it("accepts one non-empty ZIP without duplicating backend security validation", () => {
    expect(precheckThemePackageFile(file())).toBeNull();
    expect(precheckThemePackageFile(file("AURORA.ZIP", 10, ""))).toBeNull();
    expect(precheckThemePackageFile(file("aurora.zip", 10, "application/x-zip-compressed"))).toBeNull();
  });

  it("rejects missing, non-ZIP, empty, oversized, and contradictory files locally", () => {
    expect(precheckThemePackageFile(null)?.kind).toBe("missing-file");
    expect(precheckThemePackageFile(file("aurora.theme"))?.kind).toBe("invalid-file");
    expect(precheckThemePackageFile(file("aurora.zip", 0))?.kind).toBe("empty-file");
    expect(
      precheckThemePackageFile({
        name: "aurora.zip",
        size: THEME_PACKAGE_MAXIMUM_BYTES + 1,
        type: "application/zip",
      })?.kind,
    ).toBe("too-large");
    expect(precheckThemePackageFile(file("aurora.zip", 10, "text/plain"))?.kind).toBe(
      "invalid-file",
    );
  });

  it("uploads a valid selection and exposes only real backend result metadata", async () => {
    const importPackage = vi.fn().mockResolvedValue({ ok: true, data: success });
    const controller = useThemeLibraryImport({ importPackage });
    const selected = file();

    expect(controller.selectFile(selected)).toBe(true);
    expect(controller.importStatus.value).toBe("ready");
    await expect(controller.importSelected()).resolves.toBe(true);

    expect(importPackage).toHaveBeenCalledWith(selected);
    expect(controller.importStatus.value).toBe("success");
    expect(controller.importResult.value).toEqual(success);
    expect(controller.importResult.value?.themeName).toBe("Aurora");
  });

  it("prevents a parallel import and exposes no fabricated progress", async () => {
    let release: ((result: ApiResult<ThemePackageImportSuccess>) => void) | undefined;
    const waiting = new Promise<ApiResult<ThemePackageImportSuccess>>((resolve) => {
      release = resolve;
    });
    const importPackage = vi.fn(() => waiting);
    const controller = useThemeLibraryImport({ importPackage });
    controller.selectFile(file());

    const first = controller.importSelected();
    expect(controller.importStatus.value).toBe("importing");
    await expect(controller.importSelected()).resolves.toBe(false);
    expect(importPackage).toHaveBeenCalledOnce();

    release?.({ ok: true, data: success });
    await first;
    expect(controller.importStatus.value).toBe("success");
  });

  it.each([
    [409, "theme_package_conflict", "conflict"],
    [413, "theme_package_too_large", "too-large"],
    [422, "theme_package_contract_unsupported", "unsupported-version"],
    [422, "theme_package_asset_missing", "invalid-asset"],
    [422, "theme_package_integrity_failed", "integrity-failure"],
    [422, "theme_package_core_conflict", "core-collision"],
    [422, "theme_package_manifest_invalid", "invalid-package"],
    [503, "theme_package_storage_failed", "generic"],
  ] as const)(
    "maps HTTP %i / %s to a comprehensible %s result",
    async (status, code, expectedKind) => {
      const controller = useThemeLibraryImport({
        importPackage: vi.fn().mockResolvedValue(failed(status, code)),
      });
      controller.selectFile(file());

      await expect(controller.importSelected()).resolves.toBe(false);

      expect(controller.importError.value?.kind).toBe(expectedKind);
      expect(controller.importError.value?.technicalCode).toBe(code);
      expect(controller.importError.value?.message).not.toContain("Traceback");
      expect(controller.importResult.value).toBeNull();
    },
  );

  it("keeps only transient import state and never mutates ThemeRuntime or persistence", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./themeLibraryImport.ts", import.meta.url)),
      "utf8",
    );

    for (const state of ["selectedFile", "importStatus", "importResult", "importError"]) {
      expect(source).toContain(state);
    }
    expect(source).not.toContain("installedThemes");
    expect(source).not.toContain("ThemeRegistry");
    expect(source).not.toContain("activate(");
    expect(source).not.toContain("localStorage");
    expect(source).not.toContain("sessionStorage");
    expect(source).not.toContain("fetch(");
  });
});

function file(
  name = "aurora.zip",
  size = 16,
  type = "application/zip",
): File {
  return new File([new Uint8Array(size)], name, { type });
}

function failed(status: number, code: string): ApiResult<never> {
  const details = {
    success: false,
    diagnostics: [{ code, message: "Internal technical diagnostic." }],
  };
  const error: ApiError = {
    kind: status === 422 ? "validation" : "http",
    status,
    code,
    message: `Cosmos API responded with ${status}.`,
    details,
  };
  return { ok: false, error };
}
