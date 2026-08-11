import {
  validateThemeBuilderProject,
  type ThemeBuilderProject,
  type ThemeBuilderProjectMetadata,
  type ThemeBuilderProjectArtifacts,
  type ExactVersionedRef,
} from "../theme-engine";
import { CosmosApiClient, cosmosApiClient } from "./apiClient";
import type { ApiResult } from "./contracts";

interface ThemeBuilderProjectListPayload { items: unknown[] }

export class ThemeBuilderProjectApi {
  constructor(private readonly client: CosmosApiClient = cosmosApiClient) {}

  async create(metadata: ThemeBuilderProjectMetadata): Promise<ApiResult<Readonly<ThemeBuilderProject>>> {
    return this.project(await this.client.post("/theme-builder/projects", metadata));
  }

  async get(builderProjectId: string): Promise<ApiResult<Readonly<ThemeBuilderProject>>> {
    return this.project(await this.client.get(`/theme-builder/projects/${encodeURIComponent(builderProjectId)}`));
  }

  async list(): Promise<ApiResult<readonly Readonly<ThemeBuilderProject>[]>> {
    const result = await this.client.get<ThemeBuilderProjectListPayload>("/theme-builder/projects");
    if (!result.ok) return result;
    try {
      return { ok: true, data: Object.freeze(result.data.items.map(validateThemeBuilderProject)) };
    } catch (cause) {
      return { ok: false, error: { kind: "validation", message: "Theme Builder Project list is invalid.", cause } };
    }
  }

  async saveDraft(
    builderProjectId: string,
    expectedRevision: number,
    metadata: ThemeBuilderProjectMetadata,
    assetRefs: readonly ExactVersionedRef[],
    artifacts?: Readonly<ThemeBuilderProjectArtifacts>,
  ): Promise<ApiResult<Readonly<ThemeBuilderProject>>> {
    return this.project(await this.client.put(
      `/theme-builder/projects/${encodeURIComponent(builderProjectId)}`,
      { expectedRevision, metadata, assetRefs, artifacts },
    ));
  }


  exportPackage(builderProjectId: string): Promise<ApiResult<Readonly<{ blob: Blob; filename?: string }>>> {
    return this.client.download(`/theme-builder/projects/${encodeURIComponent(builderProjectId)}/export`);
  }

  private project(result: ApiResult<unknown>): ApiResult<Readonly<ThemeBuilderProject>> {
    if (!result.ok) return result;
    try {
      return { ok: true, data: validateThemeBuilderProject(result.data) };
    } catch (cause) {
      return { ok: false, error: { kind: "validation", message: "Theme Builder Project response is invalid.", cause } };
    }
  }
}

export const themeBuilderProjectApi = new ThemeBuilderProjectApi();
