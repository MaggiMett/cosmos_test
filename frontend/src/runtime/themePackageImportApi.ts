import { CosmosApiClient, cosmosApiClient } from "./apiClient";
import type { ApiResult } from "./contracts";

export interface ThemePackageImportDiagnostic {
  readonly code: string;
  readonly message: string;
}

export interface ThemePackageImportSuccess {
  readonly success: true;
  readonly packageId: string;
  readonly packageVersion: string;
  readonly themeId: string;
  readonly themeName: string;
  readonly installStatus: "installed";
  readonly diagnostics: readonly ThemePackageImportDiagnostic[];
  readonly assets: {
    readonly total: number;
    readonly installed: number;
    readonly reused: number;
  };
  readonly integrity: {
    readonly status: "verified";
    readonly archiveSha256: string;
    readonly manifestSha256: string;
  };
  readonly runtimeRegistration: "next-startup";
}

export class ThemePackageImportApi {
  constructor(private readonly client: CosmosApiClient = cosmosApiClient) {}

  importPackage(
    archive: Blob,
    signal?: AbortSignal,
  ): Promise<ApiResult<Readonly<ThemePackageImportSuccess>>> {
    return this.client.upload<ThemePackageImportSuccess>(
      "/theme-packages/import",
      archive,
      "application/zip",
      signal,
    );
  }
}

export const themePackageImportApi = new ThemePackageImportApi();
