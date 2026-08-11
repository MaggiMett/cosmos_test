import type { RendererSafeAssetReference } from "./activeThemePresentationSnapshot";

const namespacedId = /^[a-z0-9]+(?:[._-][a-z0-9]+)+$/;
const semanticVersion = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const digest = /^[a-f0-9]{64}$/;

const staticMedia = Object.freeze({
  png: Object.freeze({ kind: "image", mimeType: "image/png" }),
  webp: Object.freeze({ kind: "image", mimeType: "image/webp" }),
  svg: Object.freeze({ kind: "vector", mimeType: "image/svg+xml" }),
} as const);

/**
 * Converts a validated Catalog reference into the existing authenticated
 * Resource read endpoint. Filesystem paths and Package artifact paths never
 * cross this boundary.
 */
export function resolveRendererAssetResourceUrl(
  reference: Readonly<RendererSafeAssetReference>,
  apiBaseUrl: string,
): string | null {
  const media = staticMedia[reference.format as keyof typeof staticMedia];
  if (
    !media ||
    media.kind !== reference.kind ||
    media.mimeType !== reference.mimeType ||
    reference.version === null ||
    !namespacedId.test(reference.assetId) ||
    !semanticVersion.test(reference.version) ||
    !digest.test(reference.sha256) ||
    !Number.isInteger(reference.byteSize) ||
    reference.byteSize <= 0 ||
    !Number.isInteger(reference.width) ||
    reference.width <= 0 ||
    !Number.isInteger(reference.height) ||
    reference.height <= 0
  ) {
    return null;
  }
  const base = safeApiBaseUrl(apiBaseUrl);
  if (!base) return null;
  return `${base}/asset-catalog/visual-assets/${encodeURIComponent(reference.assetId)}/versions/${encodeURIComponent(reference.version)}/content`;
}

function safeApiBaseUrl(value: string): string | null {
  const base = value.trim().replace(/\/+$/, "");
  if (!base || base.includes("\\") || /^[a-zA-Z]:/.test(base) || /^file:/i.test(base)) return null;
  if (base.startsWith("/")) {
    return base.startsWith("//") || base.includes("..") || /[?#]/.test(base) ? null : base;
  }
  try {
    const url = new URL(base);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}
