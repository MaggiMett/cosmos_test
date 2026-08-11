import type {
  AssetFormat,
  AssetMimeType,
  AssetReference,
  SkinPack,
} from "./types";

export interface AssetRegistration {
  metadata: AssetReference;
  content: string | Uint8Array;
}

export interface RegisteredAsset {
  readonly metadata: Readonly<AssetReference>;
  read(): Uint8Array;
}

export interface ResolvedAsset {
  readonly asset: RegisteredAsset;
  readonly requestedAssetId: string;
  readonly usedFallback: boolean;
}

export class AssetRegistryError extends Error {
  constructor(
    readonly code:
      | "asset_duplicate"
      | "asset_unknown"
      | "asset_fallback_missing"
      | "asset_path_invalid"
      | "asset_mime_mismatch"
      | "asset_signature_mismatch"
      | "asset_size_mismatch"
      | "asset_digest_mismatch"
      | "asset_hash_unavailable"
      | "asset_unsafe_content",
    message: string,
  ) {
    super(message);
    this.name = "AssetRegistryError";
  }
}

const formatContracts: Readonly<
  Record<AssetFormat, { kind: AssetReference["kind"]; mimeType: AssetMimeType }>
> = {
  png: { kind: "image", mimeType: "image/png" },
  webp: { kind: "image", mimeType: "image/webp" },
  svg: { kind: "vector", mimeType: "image/svg+xml" },
  webm: { kind: "video", mimeType: "video/webm" },
  mp4: { kind: "video", mimeType: "video/mp4" },
};

const unsafeSvgPatterns: readonly RegExp[] = [
  /<!DOCTYPE/i,
  /<\s*script\b/i,
  /<\s*foreignObject\b/i,
  /<\s*(?:iframe|object|embed)\b/i,
  /\bon[a-z]+\s*=/i,
  /\b(?:xlink:)?href\s*=\s*["'](?!#)[^"']+/i,
  /@import/i,
  /\burl\(\s*["']?(?!#)/i,
  /\bjavascript\s*:/i,
  /\bdata\s*:\s*text\/html/i,
];

export class AssetRegistry {
  private readonly assets = new Map<string, RegisteredAsset>();
  private fallbackAssetId: string | null;

  constructor(fallbackAssetId: string | null = null) {
    this.fallbackAssetId = fallbackAssetId;
  }

  setFallbackAsset(assetId: string): void {
    if (!this.assets.has(assetId)) {
      throw new AssetRegistryError(
        "asset_fallback_missing",
        `Cannot select unregistered fallback asset ${assetId}.`,
      );
    }
    this.fallbackAssetId = assetId;
  }

  async register(registration: AssetRegistration): Promise<RegisteredAsset> {
    const metadata = registration.metadata;
    if (this.assets.has(metadata.assetId)) {
      throw new AssetRegistryError(
        "asset_duplicate",
        `Asset ${metadata.assetId} is already registered.`,
      );
    }
    const registered = await prepareRegistration(registration);
    this.assets.set(metadata.assetId, registered);
    return registered;
  }

  async registerPack(
    pack: SkinPack,
    contents: Readonly<Record<string, string | Uint8Array>>,
  ): Promise<readonly RegisteredAsset[]> {
    const registrations = pack.assets.map((metadata) => {
      const content = contents[metadata.assetId];
      if (content === undefined) {
        throw new AssetRegistryError(
          "asset_unknown",
          `Content for declared asset ${metadata.assetId} is missing.`,
        );
      }
      return { metadata, content };
    });

    const ids = new Set<string>();
    for (const registration of registrations) {
      if (ids.has(registration.metadata.assetId) || this.assets.has(registration.metadata.assetId)) {
        throw new AssetRegistryError(
          "asset_duplicate",
          `Asset ${registration.metadata.assetId} is already registered.`,
        );
      }
      ids.add(registration.metadata.assetId);
    }

    const prepared: RegisteredAsset[] = [];
    for (const registration of registrations) {
      prepared.push(await prepareRegistration(registration));
    }
    for (const asset of prepared) this.assets.set(asset.metadata.assetId, asset);
    return prepared;
  }

  get(assetId: string): RegisteredAsset | undefined {
    return this.assets.get(assetId);
  }

  assertCompatibleDeclaration(metadata: AssetReference): RegisteredAsset | undefined {
    const registered = this.assets.get(metadata.assetId);
    if (!registered) return undefined;
    const current = registered.metadata;
    if (
      current.sha256 !== metadata.sha256 ||
      current.byteSize !== metadata.byteSize ||
      current.format !== metadata.format ||
      current.mimeType !== metadata.mimeType ||
      current.path !== metadata.path
    ) {
      throw new AssetRegistryError(
        "asset_duplicate",
        `Asset ${metadata.assetId} is already registered with different immutable metadata.`,
      );
    }
    return registered;
  }

  require(assetId: string): RegisteredAsset {
    const asset = this.assets.get(assetId);
    if (!asset) {
      throw new AssetRegistryError("asset_unknown", `Asset ${assetId} is not registered.`);
    }
    return asset;
  }

  resolve(assetId: string): ResolvedAsset {
    const requested = this.assets.get(assetId);
    if (requested) {
      return { asset: requested, requestedAssetId: assetId, usedFallback: false };
    }
    if (!this.fallbackAssetId) {
      throw new AssetRegistryError(
        "asset_fallback_missing",
        `Asset ${assetId} is missing and no fallback asset is configured.`,
      );
    }
    const fallback = this.assets.get(this.fallbackAssetId);
    if (!fallback) {
      throw new AssetRegistryError(
        "asset_fallback_missing",
        `Configured fallback asset ${this.fallbackAssetId} is not registered.`,
      );
    }
    return { asset: fallback, requestedAssetId: assetId, usedFallback: true };
  }

  list(): readonly RegisteredAsset[] {
    return [...this.assets.values()].sort((left, right) =>
      left.metadata.assetId.localeCompare(right.metadata.assetId),
    );
  }
}

async function prepareRegistration(
  registration: AssetRegistration,
): Promise<RegisteredAsset> {
  const metadata = registration.metadata;
  validateAssetPath(metadata.path);
  validateAssetMediaContract(metadata);

  const bytes =
    typeof registration.content === "string"
      ? new TextEncoder().encode(registration.content)
      : new Uint8Array(registration.content);

  if (bytes.byteLength !== metadata.byteSize) {
    throw new AssetRegistryError(
      "asset_size_mismatch",
      `Asset ${metadata.assetId} declares ${metadata.byteSize} bytes but contains ${bytes.byteLength}.`,
    );
  }

  validateSignature(metadata, bytes);
  if (metadata.format === "svg") {
    validateSvgContent(metadata.assetId, new TextDecoder().decode(bytes));
  }

  const digest = await sha256(bytes);
  if (digest !== metadata.sha256) {
    throw new AssetRegistryError(
      "asset_digest_mismatch",
      `Asset ${metadata.assetId} SHA-256 mismatch: expected ${metadata.sha256}, received ${digest}.`,
    );
  }

  const storedBytes = new Uint8Array(bytes);
  const frozenMetadata = deepFreeze({ ...metadata });
  return Object.freeze({
    metadata: frozenMetadata,
    read: () => new Uint8Array(storedBytes),
  });
}

export function validateAssetPath(path: string): void {
  const segments = path.split("/");
  if (
    !path ||
    path.startsWith("/") ||
    /^[A-Za-z]:/.test(path) ||
    path.includes("\\") ||
    path.includes("://") ||
    path.includes("?") ||
    path.includes("#") ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new AssetRegistryError(
      "asset_path_invalid",
      `Asset path must be a normalized package-relative path: ${path || "<empty>"}.`,
    );
  }
}

function validateAssetMediaContract(metadata: AssetReference): void {
  const contract = formatContracts[metadata.format];
  if (metadata.kind !== contract.kind || metadata.mimeType !== contract.mimeType) {
    throw new AssetRegistryError(
      "asset_mime_mismatch",
      `Asset ${metadata.assetId} format ${metadata.format} requires kind ${contract.kind} and MIME ${contract.mimeType}.`,
    );
  }
  if (metadata.kind === "video" && !metadata.media) {
    throw new AssetRegistryError(
      "asset_mime_mismatch",
      `Video asset ${metadata.assetId} requires its media fallback contract.`,
    );
  }
}

function validateSignature(metadata: AssetReference, bytes: Uint8Array): void {
  const matches =
    metadata.format === "png"
      ? startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      : metadata.format === "webp"
        ? ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP"
        : metadata.format === "webm"
          ? startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])
          : metadata.format === "mp4"
            ? ascii(bytes, 4, 4) === "ftyp"
            : /^\s*<svg(?:\s|>)/i.test(new TextDecoder().decode(bytes));

  if (!matches) {
    throw new AssetRegistryError(
      "asset_signature_mismatch",
      `Asset ${metadata.assetId} content does not match declared format ${metadata.format}.`,
    );
  }
}

function validateSvgContent(assetId: string, svg: string): void {
  if (unsafeSvgPatterns.some((pattern) => pattern.test(svg))) {
    throw new AssetRegistryError(
      "asset_unsafe_content",
      `SVG asset ${assetId} contains scripts, HTML, external references, events or other active content.`,
    );
  }
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

async function sha256(bytes: Uint8Array): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new AssetRegistryError(
      "asset_hash_unavailable",
      "SHA-256 is unavailable in the current runtime.",
    );
  }
  const digestInput = new Uint8Array(bytes.byteLength);
  digestInput.set(bytes);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", digestInput.buffer);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value as Readonly<T>;
  }
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value as Readonly<T>;
}
