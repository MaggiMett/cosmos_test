export interface HealthResponse {
  service: "cosmos";
  status: "ok";
  version: string;
}

export interface ReadinessResponse {
  service: "cosmos";
  status: "ready" | "not_ready";
}

export interface ApiError {
  kind: "unavailable" | "network" | "validation" | "http" | "unknown";
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
  cause?: unknown;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  signal?: AbortSignal;
}
