import {
  AssetImportStatus,
  type AssetImportFile,
  type AssetImportIssue,
  type DetectedStaticAssetMetadata,
  type FileValidationResult,
  type StaticAssetFormat,
  type StaticAssetMimeType,
} from "./assetImportTypes";

export const DEFAULT_MAXIMUM_ASSET_BYTE_SIZE = 16 * 1024 * 1024;
export const DEFAULT_MAXIMUM_ASSET_DIMENSION = 8192;
export const DEFAULT_RECOMMENDED_ASSET_DIMENSION = 4096;

export interface AssetImportValidationLimits {
  maximumByteSize: number;
  maximumDimension: number;
  recommendedDimension: number;
}

interface ParsedAsset {
  metadata: DetectedStaticAssetMetadata;
}

class StaticAssetParseError extends Error {
  constructor(
    readonly code: "decode_failed" | "unsupported_animation" | "unsafe_svg",
    message: string,
  ) {
    super(message);
    this.name = "StaticAssetParseError";
  }
}

const PNG_SIGNATURE = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });
const FORMAT_MIME_TYPES: Readonly<Record<StaticAssetFormat, StaticAssetMimeType>> =
  Object.freeze({
    png: "image/png",
    webp: "image/webp",
    svg: "image/svg+xml",
  });
const FORMAT_EXTENSIONS: Readonly<Record<StaticAssetFormat, string>> =
  Object.freeze({
    png: "png",
    webp: "webp",
    svg: "svg",
  });

export async function validateAssetImportFile(
  file: Readonly<AssetImportFile>,
  limits: Readonly<AssetImportValidationLimits> = {
    maximumByteSize: DEFAULT_MAXIMUM_ASSET_BYTE_SIZE,
    maximumDimension: DEFAULT_MAXIMUM_ASSET_DIMENSION,
    recommendedDimension: DEFAULT_RECOMMENDED_ASSET_DIMENSION,
  },
): Promise<Readonly<FileValidationResult>> {
  const bytes = file.bytes.slice();
  const issues: AssetImportIssue[] = [];
  let sha256: string | undefined;
  let metadata: DetectedStaticAssetMetadata | undefined;

  try {
    sha256 = await calculateSha256(bytes);
  } catch {
    issues.push(errorIssue(
      "hash_unavailable",
      "SHA-256 could not be calculated for this file.",
    ));
  }

  if (bytes.byteLength === 0) {
    issues.push(errorIssue("empty_file", "The file is empty."));
  }

  if (bytes.byteLength > limits.maximumByteSize) {
    issues.push(errorIssue(
      "file_too_large",
      `The file exceeds the ${limits.maximumByteSize} byte import limit.`,
    ));
  }

  const format = detectStaticAssetFormat(bytes);
  if (format === undefined) {
    const looksSupported = hasSupportedDeclaration(file);
    issues.push(errorIssue(
      looksSupported ? "signature_mismatch" : "unsupported_format",
      looksSupported
        ? "The file signature does not match its supported file declaration."
        : "Only static PNG, WebP and SVG files are supported.",
    ));
  } else {
    try {
      metadata = parseStaticAsset(format, bytes);
    } catch (cause) {
      const parseError = cause instanceof StaticAssetParseError
        ? cause
        : new StaticAssetParseError(
            "decode_failed",
            "The file structure could not be decoded.",
          );
      issues.push(errorIssue(parseError.code, parseError.message));
    }

    validateDeclaredMimeType(file.declaredMimeType, format, issues);
    validateFileExtension(file.fileName, format, issues);
  }

  if (metadata !== undefined) {
    const largestDimension = Math.max(metadata.width, metadata.height);
    if (largestDimension > limits.maximumDimension) {
      issues.push(errorIssue(
        "dimensions_exceeded",
        `The asset exceeds the ${limits.maximumDimension}px dimension limit.`,
      ));
    } else if (largestDimension > limits.recommendedDimension) {
      issues.push(warningIssue(
        "large_dimensions",
        `The asset exceeds the recommended ${limits.recommendedDimension}px dimension.`,
      ));
    }
  }

  const status = issues.some((issue) => issue.severity === "error")
    ? AssetImportStatus.Rejected
    : issues.some((issue) => issue.severity === "warning")
      ? AssetImportStatus.Warning
      : AssetImportStatus.Ready;

  return Object.freeze({
    fileName: file.fileName,
    status,
    ...(sha256 === undefined ? {} : { sha256 }),
    ...(metadata === undefined ? {} : { metadata: Object.freeze(metadata) }),
    issues: Object.freeze(issues.map((issue) => Object.freeze(issue))),
  });
}

async function calculateSha256(bytes: Uint8Array): Promise<string> {
  if (globalThis.crypto?.subtle === undefined) {
    throw new Error("Web Crypto is unavailable.");
  }
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    bytes.slice().buffer,
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")).join("");
}

function detectStaticAssetFormat(
  bytes: Uint8Array,
): StaticAssetFormat | undefined {
  if (startsWith(bytes, PNG_SIGNATURE)) {
    return "png";
  }
  if (
    bytes.byteLength >= 12
    && ascii(bytes, 0, 4) === "RIFF"
    && ascii(bytes, 8, 4) === "WEBP"
  ) {
    return "webp";
  }
  if (looksLikeSvg(bytes)) {
    return "svg";
  }
  return undefined;
}

function looksLikeSvg(bytes: Uint8Array): boolean {
  try {
    const source = UTF8_DECODER.decode(stripUtf8Bom(bytes));
    return /^(?:\s|<\?xml[\s\S]*?\?>|<!--[\s\S]*?-->)*<svg(?:\s|>)/i.test(
      source,
    );
  } catch {
    return false;
  }
}

function parseStaticAsset(
  format: StaticAssetFormat,
  bytes: Uint8Array,
): ParsedAsset["metadata"] {
  switch (format) {
    case "png":
      return parsePng(bytes);
    case "webp":
      return parseWebp(bytes);
    case "svg":
      return parseSvg(bytes);
  }
}

function parsePng(bytes: Uint8Array): DetectedStaticAssetMetadata {
  let offset = PNG_SIGNATURE.byteLength;
  let width: number | undefined;
  let height: number | undefined;
  let alpha = false;
  let sawImageData = false;
  let sawEnd = false;
  let sawHeader = false;

  while (offset < bytes.byteLength) {
    if (offset + 12 > bytes.byteLength) {
      throw decodeError("The PNG contains a truncated chunk.");
    }
    const length = readUint32BigEndian(bytes, offset);
    const typeOffset = offset + 4;
    const dataOffset = offset + 8;
    const crcOffset = dataOffset + length;
    if (crcOffset + 4 > bytes.byteLength) {
      throw decodeError("The PNG contains a truncated chunk.");
    }
    const chunkType = ascii(bytes, typeOffset, 4);
    const expectedCrc = readUint32BigEndian(bytes, crcOffset);
    const actualCrc = crc32(bytes.subarray(typeOffset, crcOffset));
    if (actualCrc !== expectedCrc) {
      throw decodeError(`The PNG ${chunkType} chunk has an invalid checksum.`);
    }

    if (chunkType === "IHDR") {
      if (
        sawHeader
        || offset !== PNG_SIGNATURE.byteLength
        || length !== 13
      ) {
        throw decodeError("The PNG header is invalid.");
      }
      sawHeader = true;
      width = readUint32BigEndian(bytes, dataOffset);
      height = readUint32BigEndian(bytes, dataOffset + 4);
      const bitDepth = bytes[dataOffset + 8];
      const colorType = bytes[dataOffset + 9];
      if (![0, 2, 3, 4, 6].includes(colorType)) {
        throw decodeError("The PNG uses an invalid color type.");
      }
      const allowedBitDepths: Readonly<Record<number, readonly number[]>> = {
        0: [1, 2, 4, 8, 16],
        2: [8, 16],
        3: [1, 2, 4, 8],
        4: [8, 16],
        6: [8, 16],
      };
      if (!allowedBitDepths[colorType].includes(bitDepth)) {
        throw decodeError("The PNG bit depth is invalid for its color type.");
      }
      if (
        bytes[dataOffset + 10] !== 0
        || bytes[dataOffset + 11] !== 0
        || ![0, 1].includes(bytes[dataOffset + 12])
      ) {
        throw decodeError("The PNG compression, filter or interlace method is invalid.");
      }
      alpha = colorType === 4 || colorType === 6;
    } else if (chunkType === "IDAT") {
      if (!sawHeader) {
        throw decodeError("The PNG image data appears before its header.");
      }
      sawImageData = true;
    } else if (chunkType === "tRNS") {
      alpha = true;
    } else if (chunkType === "IEND") {
      if (length !== 0 || crcOffset + 4 !== bytes.byteLength) {
        throw decodeError("The PNG end marker is invalid.");
      }
      sawEnd = true;
    }

    offset = crcOffset + 4;
  }

  if (
    width === undefined
    || height === undefined
    || width === 0
    || height === 0
    || !sawImageData
    || !sawEnd
  ) {
    throw decodeError("The PNG is missing required image data.");
  }

  return {
    kind: "image",
    format: "png",
    mimeType: "image/png",
    byteSize: bytes.byteLength,
    width,
    height,
    alpha,
  };
}

function parseWebp(bytes: Uint8Array): DetectedStaticAssetMetadata {
  if (bytes.byteLength < 20) {
    throw decodeError("The WebP file is truncated.");
  }
  const riffSize = readUint32LittleEndian(bytes, 4);
  if (riffSize + 8 !== bytes.byteLength) {
    throw decodeError("The WebP RIFF size is invalid.");
  }

  let offset = 12;
  let width: number | undefined;
  let height: number | undefined;
  let alpha = false;
  let sawImageData = false;
  let animated = false;
  let extendedWidth: number | undefined;
  let extendedHeight: number | undefined;
  let frameWidth: number | undefined;
  let frameHeight: number | undefined;

  while (offset < bytes.byteLength) {
    if (offset + 8 > bytes.byteLength) {
      throw decodeError("The WebP contains a truncated chunk header.");
    }
    const chunkType = ascii(bytes, offset, 4);
    const length = readUint32LittleEndian(bytes, offset + 4);
    const dataOffset = offset + 8;
    const nextOffset = dataOffset + length + (length % 2);
    if (nextOffset > bytes.byteLength) {
      throw decodeError("The WebP contains a truncated chunk.");
    }
    const payload = bytes.subarray(dataOffset, dataOffset + length);

    if (chunkType === "VP8X") {
      if (
        offset !== 12
        || payload.byteLength !== 10
        || (payload[0] & 0xc1) !== 0
        || payload[1] !== 0
        || payload[2] !== 0
        || payload[3] !== 0
      ) {
        throw decodeError("The WebP extended header is invalid.");
      }
      alpha ||= (payload[0] & 0x10) !== 0;
      animated ||= (payload[0] & 0x02) !== 0;
      extendedWidth = readUint24LittleEndian(payload, 4) + 1;
      extendedHeight = readUint24LittleEndian(payload, 7) + 1;
      width = extendedWidth;
      height = extendedHeight;
    } else if (chunkType === "VP8 ") {
      if (
        payload.byteLength < 10
        || payload[3] !== 0x9d
        || payload[4] !== 0x01
        || payload[5] !== 0x2a
      ) {
        throw decodeError("The WebP VP8 frame header is invalid.");
      }
      frameWidth = readUint16LittleEndian(payload, 6) & 0x3fff;
      frameHeight = readUint16LittleEndian(payload, 8) & 0x3fff;
      width ??= frameWidth;
      height ??= frameHeight;
      sawImageData = true;
    } else if (chunkType === "VP8L") {
      if (payload.byteLength < 5 || payload[0] !== 0x2f) {
        throw decodeError("The WebP lossless frame header is invalid.");
      }
      const bits = readUint32LittleEndian(payload, 1);
      if ((bits >>> 29) !== 0) {
        throw decodeError("The WebP lossless version is unsupported.");
      }
      frameWidth = (bits & 0x3fff) + 1;
      frameHeight = ((bits >>> 14) & 0x3fff) + 1;
      width ??= frameWidth;
      height ??= frameHeight;
      alpha ||= ((bits >>> 28) & 0x01) === 1;
      sawImageData = true;
    } else if (chunkType === "ALPH") {
      alpha = true;
    } else if (chunkType === "ANIM" || chunkType === "ANMF") {
      animated = true;
    }

    offset = nextOffset;
  }

  if (animated) {
    throw new StaticAssetParseError(
      "unsupported_animation",
      "Animated WebP files are not supported in this static import slice.",
    );
  }
  if (
    extendedWidth !== undefined
    && extendedHeight !== undefined
    && frameWidth !== undefined
    && frameHeight !== undefined
    && (extendedWidth !== frameWidth || extendedHeight !== frameHeight)
  ) {
    throw decodeError("The WebP canvas and frame dimensions do not match.");
  }
  if (
    width === undefined
    || height === undefined
    || width === 0
    || height === 0
    || !sawImageData
  ) {
    throw decodeError("The WebP is missing required image data.");
  }

  return {
    kind: "image",
    format: "webp",
    mimeType: "image/webp",
    byteSize: bytes.byteLength,
    width,
    height,
    alpha,
  };
}

function parseSvg(bytes: Uint8Array): DetectedStaticAssetMetadata {
  let source: string;
  try {
    source = UTF8_DECODER.decode(stripUtf8Bom(bytes));
  } catch {
    throw decodeError("The SVG is not valid UTF-8.");
  }

  assertSafeSvg(source);
  const rootMatch = source.match(
    /^(?:\s|<\?xml[\s\S]*?\?>|<!--[\s\S]*?-->)*<svg\b([^>]*)>/i,
  );
  if (rootMatch === null) {
    throw decodeError("The SVG root element is missing.");
  }
  if (
    !/\/>\s*$/.test(rootMatch[0])
    && !/<\/svg\s*>(?:\s|<!--[\s\S]*?-->)*$/i.test(source)
  ) {
    throw decodeError("The SVG root element is not closed.");
  }

  const attributes = rootMatch[1];
  const viewBox = parseViewBox(readXmlAttribute(attributes, "viewBox"));
  const explicitWidth = parseSvgLength(readXmlAttribute(attributes, "width"));
  const explicitHeight = parseSvgLength(readXmlAttribute(attributes, "height"));
  const width = explicitWidth ?? viewBox?.width;
  const height = explicitHeight ?? viewBox?.height;

  if (
    width === undefined
    || height === undefined
    || !Number.isFinite(width)
    || !Number.isFinite(height)
    || width <= 0
    || height <= 0
  ) {
    throw decodeError(
      "The SVG needs positive intrinsic dimensions or a valid viewBox.",
    );
  }

  return {
    kind: "vector",
    format: "svg",
    mimeType: "image/svg+xml",
    byteSize: bytes.byteLength,
    width,
    height,
    alpha: true,
  };
}

function assertSafeSvg(source: string): void {
  const forbiddenMarkup = [
    /<!doctype\b/i,
    /<!entity\b/i,
    /<\s*(?:script|foreignObject|iframe|object|embed|audio|video)\b/i,
    /<\s*(?:animate|animateMotion|animateTransform|set)\b/i,
    /\son[a-z][a-z0-9:_-]*\s*=/i,
    /\bjavascript\s*:/i,
    /@import\b/i,
    /\burl\(\s*(['"]?)(?!#)[^)]+\1\s*\)/i,
    /\b(?:href|xlink:href)\s*=\s*(['"])(?!#)[\s\S]*?\1/i,
    /\bxmlns:(?!xlink\b)[a-z][a-z0-9_-]*\s*=/i,
  ];
  if (forbiddenMarkup.some((pattern) => pattern.test(source))) {
    throw new StaticAssetParseError(
      "unsafe_svg",
      "The SVG contains active or externally referenced content.",
    );
  }

  const namespace = source.match(/\bxmlns\s*=\s*(['"])(.*?)\1/i)?.[2];
  if (namespace !== undefined && namespace !== "http://www.w3.org/2000/svg") {
    throw new StaticAssetParseError(
      "unsafe_svg",
      "The SVG uses an unsupported namespace.",
    );
  }
  const xlinkNamespace = source.match(
    /\bxmlns:xlink\s*=\s*(['"])(.*?)\1/i,
  )?.[2];
  if (
    xlinkNamespace !== undefined
    && xlinkNamespace !== "http://www.w3.org/1999/xlink"
  ) {
    throw new StaticAssetParseError(
      "unsafe_svg",
      "The SVG uses an unsupported namespace.",
    );
  }
}

function validateDeclaredMimeType(
  declaredMimeType: string | undefined,
  format: StaticAssetFormat,
  issues: AssetImportIssue[],
): void {
  if (declaredMimeType === undefined || declaredMimeType.trim() === "") {
    return;
  }
  const normalized = declaredMimeType.split(";", 1)[0].trim().toLowerCase();
  if (normalized === "application/octet-stream") {
    issues.push(warningIssue(
      "generic_mime_type",
      "The file declares a generic MIME type; its signature was used instead.",
    ));
    return;
  }
  if (normalized !== FORMAT_MIME_TYPES[format]) {
    issues.push(errorIssue(
      "mime_mismatch",
      `The declared MIME type does not match the detected ${format.toUpperCase()} format.`,
    ));
  }
}

function validateFileExtension(
  fileName: string,
  format: StaticAssetFormat,
  issues: AssetImportIssue[],
): void {
  const dot = fileName.lastIndexOf(".");
  const extension = dot < 0 ? "" : fileName.slice(dot + 1).toLowerCase();
  if (extension !== FORMAT_EXTENSIONS[format]) {
    issues.push(warningIssue(
      "file_extension_mismatch",
      `The filename extension does not match the detected ${format.toUpperCase()} format.`,
    ));
  }
}

function hasSupportedDeclaration(file: Readonly<AssetImportFile>): boolean {
  const extension = file.fileName.split(".").pop()?.toLowerCase();
  const mime = file.declaredMimeType?.split(";", 1)[0].trim().toLowerCase();
  return extension === "png"
    || extension === "webp"
    || extension === "svg"
    || Object.values(FORMAT_MIME_TYPES).includes(
      mime as StaticAssetMimeType,
    );
}

function parseViewBox(
  value: string | undefined,
): { width: number; height: number } | undefined {
  if (value === undefined) {
    return undefined;
  }
  const values = value.trim().split(/[\s,]+/).map(Number);
  if (
    values.length !== 4
    || values.some((entry) => !Number.isFinite(entry))
    || values[2] <= 0
    || values[3] <= 0
  ) {
    return undefined;
  }
  return { width: values[2], height: values[3] };
}

function parseSvgLength(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const match = value.trim().match(
    /^([+]?(?:\d+(?:\.\d*)?|\.\d+))(?:px)?$/i,
  );
  if (match === null) {
    return undefined;
  }
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function readXmlAttribute(
  attributes: string,
  name: string,
): string | undefined {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = attributes.match(
    new RegExp(`(?:^|\\s)${escapedName}\\s*=\\s*(['"])(.*?)\\1`, "i"),
  );
  return match?.[2];
}

function stripUtf8Bom(bytes: Uint8Array): Uint8Array {
  return bytes.byteLength >= 3
    && bytes[0] === 0xef
    && bytes[1] === 0xbb
    && bytes[2] === 0xbf
    ? bytes.subarray(3)
    : bytes;
}

function startsWith(bytes: Uint8Array, prefix: Uint8Array): boolean {
  return bytes.byteLength >= prefix.byteLength
    && prefix.every((byte, index) => bytes[index] === byte);
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function readUint16LittleEndian(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUint24LittleEndian(bytes: Uint8Array, offset: number): number {
  return bytes[offset]
    | (bytes[offset + 1] << 8)
    | (bytes[offset + 2] << 16);
}

function readUint32BigEndian(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] * 0x1000000)
    + (bytes[offset + 1] << 16)
    + (bytes[offset + 2] << 8)
    + bytes[offset + 3]
  ) >>> 0;
}

function readUint32LittleEndian(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset]
    | (bytes[offset + 1] << 8)
    | (bytes[offset + 2] << 16)
    | (bytes[offset + 3] << 24)
  ) >>> 0;
}

const CRC32_TABLE = createCrc32Table();

function createCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1
        ? (value >>> 1) ^ 0xedb88320
        : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function decodeError(message: string): StaticAssetParseError {
  return new StaticAssetParseError("decode_failed", message);
}

function warningIssue(
  code: AssetImportIssue["code"],
  message: string,
): AssetImportIssue {
  return { code, severity: "warning", message };
}

function errorIssue(
  code: AssetImportIssue["code"],
  message: string,
): AssetImportIssue {
  return { code, severity: "error", message };
}
