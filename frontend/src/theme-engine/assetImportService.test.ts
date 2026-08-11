import { describe, expect, it } from "vitest";

import { createCanonicalAssetImportFixtures } from "./assetImportFixtures";
import {
  AssetImportService,
  AssetImportServiceError,
} from "./assetImportService";
import {
  AssetImportStatus,
  type AssetImportFile,
} from "./assetImportTypes";
import { validateAssetImportFile } from "./assetImportValidation";

describe("asset import file validation", () => {
  it("detects PNG, WebP and SVG from their signatures and reads metadata", async () => {
    const fixtures = createCanonicalAssetImportFixtures();
    const results = await Promise.all([
      validateAssetImportFile(fixtures.png),
      validateAssetImportFile(fixtures.webp),
      validateAssetImportFile(fixtures.svg),
    ]);

    expect(results.map((result) => result.status)).toEqual([
      AssetImportStatus.Ready,
      AssetImportStatus.Ready,
      AssetImportStatus.Ready,
    ]);
    expect(results.map((result) => result.metadata)).toEqual([
      {
        kind: "image",
        format: "png",
        mimeType: "image/png",
        byteSize: fixtures.png.bytes.byteLength,
        width: 1,
        height: 1,
        alpha: true,
      },
      {
        kind: "image",
        format: "webp",
        mimeType: "image/webp",
        byteSize: fixtures.webp.bytes.byteLength,
        width: 1,
        height: 1,
        alpha: false,
      },
      {
        kind: "vector",
        format: "svg",
        mimeType: "image/svg+xml",
        byteSize: fixtures.svg.bytes.byteLength,
        width: 64,
        height: 32,
        alpha: true,
      },
    ]);
    for (const result of results) {
      expect(result.sha256).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("rejects signature and MIME mismatches", async () => {
    const fixtures = createCanonicalAssetImportFixtures();
    const badSignature = await validateAssetImportFile({
      fileName: "pretend.png",
      declaredMimeType: "image/png",
      bytes: new TextEncoder().encode("not a png"),
    });
    const badMime = await validateAssetImportFile({
      ...fixtures.png,
      declaredMimeType: "image/webp",
    });

    expect(badSignature.status).toBe(AssetImportStatus.Rejected);
    expect(badSignature.issues.map((issue) => issue.code)).toContain(
      "signature_mismatch",
    );
    expect(badMime.status).toBe(AssetImportStatus.Rejected);
    expect(badMime.issues.map((issue) => issue.code)).toContain(
      "mime_mismatch",
    );
  });

  it("rejects damaged media, unsafe SVG and video independently", async () => {
    const fixtures = createCanonicalAssetImportFixtures();
    const damagedPng = {
      ...fixtures.png,
      bytes: fixtures.png.bytes.slice(0, -1),
    };
    const results = await Promise.all([
      validateAssetImportFile(damagedPng),
      validateAssetImportFile(fixtures.unsafeSvg),
      validateAssetImportFile(fixtures.video),
    ]);

    expect(results.map((result) => result.status)).toEqual([
      AssetImportStatus.Rejected,
      AssetImportStatus.Rejected,
      AssetImportStatus.Rejected,
    ]);
    expect(results[0].issues.map((issue) => issue.code)).toContain(
      "decode_failed",
    );
    expect(results[1].issues.map((issue) => issue.code)).toContain("unsafe_svg");
    expect(results[2].issues.map((issue) => issue.code)).toContain(
      "unsupported_format",
    );
  });

  it("rejects empty input and externally referenced SVG content", async () => {
    const [empty, externalSvg] = await Promise.all([
      validateAssetImportFile({
        fileName: "empty.png",
        declaredMimeType: "image/png",
        bytes: new Uint8Array(),
      }),
      validateAssetImportFile({
        fileName: "external.svg",
        declaredMimeType: "image/svg+xml",
        bytes: new TextEncoder().encode(
          '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">'
          + '<image href="https://example.invalid/image.png"/></svg>',
        ),
      }),
    ]);

    expect(empty.status).toBe(AssetImportStatus.Rejected);
    expect(empty.issues.map((issue) => issue.code)).toContain("empty_file");
    expect(externalSvg.status).toBe(AssetImportStatus.Rejected);
    expect(externalSvg.issues.map((issue) => issue.code)).toContain(
      "unsafe_svg",
    );
  });

  it("rejects animated WebP in the static-only slice", async () => {
    const fixture = createCanonicalAssetImportFixtures().webp;

    const result = await validateAssetImportFile({
      ...fixture,
      bytes: animatedWebpBytes(),
    });

    expect(result.status).toBe(AssetImportStatus.Rejected);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "unsupported_animation",
    );
  });

  it("reports non-blocking extension, generic MIME and dimension warnings", async () => {
    const result = await validateAssetImportFile({
      fileName: "large.bin",
      declaredMimeType: "application/octet-stream",
      bytes: svgBytes(5000, 2000),
    });

    expect(result.status).toBe(AssetImportStatus.Warning);
    expect(result.issues.map((issue) => issue.code)).toEqual([
      "generic_mime_type",
      "file_extension_mismatch",
      "large_dimensions",
    ]);
  });

  it("enforces byte and dimension limits without silent defaults", async () => {
    const dimensions = await validateAssetImportFile(
      {
        fileName: "huge.svg",
        declaredMimeType: "image/svg+xml",
        bytes: svgBytes(9000, 10),
      },
      {
        maximumByteSize: 1024,
        maximumDimension: 8192,
        recommendedDimension: 4096,
      },
    );
    const bytes = await validateAssetImportFile(
      createCanonicalAssetImportFixtures().png,
      {
        maximumByteSize: 10,
        maximumDimension: 8192,
        recommendedDimension: 4096,
      },
    );

    expect(dimensions.status).toBe(AssetImportStatus.Rejected);
    expect(dimensions.issues.map((issue) => issue.code)).toContain(
      "dimensions_exceeded",
    );
    expect(bytes.status).toBe(AssetImportStatus.Rejected);
    expect(bytes.issues.map((issue) => issue.code)).toContain("file_too_large");
  });
});

describe("AssetImportService and ImportSession", () => {
  it("returns one independent result per input and drafts only successful files", async () => {
    const fixtures = createCanonicalAssetImportFixtures();
    const service = new AssetImportService();
    const result = await service.importFiles(
      [fixtures.png, fixtures.video, fixtures.svg, fixtures.unsafeSvg],
      { sessionId: "fixture-batch" },
    );

    expect(result.sessionId).toBe("fixture-batch");
    expect(result.items.map((item) => item.status)).toEqual([
      AssetImportStatus.NeedsInformation,
      AssetImportStatus.Rejected,
      AssetImportStatus.NeedsInformation,
      AssetImportStatus.Rejected,
    ]);
    expect(result.counts).toEqual({
      total: 4,
      ready: 0,
      needsInformation: 2,
      warning: 0,
      rejected: 2,
    });
    expect(result.items[0].draftVisualAsset?.draftId).toBe(
      "fixture-batch:draft:0001",
    );
    expect(result.items[1].draftVisualAsset).toBeUndefined();
    expect(result.items[2].draftVisualAsset?.draftId).toBe(
      "fixture-batch:draft:0002",
    );
    expect(result.items[3].draftVisualAsset).toBeUndefined();
  });

  it("stops at DraftVisualAsset without producing downstream models", async () => {
    const result = await new AssetImportService().importFiles(
      [createCanonicalAssetImportFixtures().png],
      { sessionId: "draft-boundary" },
    );
    const item = result.items[0];
    const draft = item.draftVisualAsset;

    expect(item.status).toBe(AssetImportStatus.NeedsInformation);
    expect(item.issues.map((issue) => issue.code)).toContain(
      "catalog_metadata_required",
    );
    expect(draft?.lifecycle).toBe("draft");
    expect(Object.keys(draft ?? {})).not.toEqual(expect.arrayContaining([
      "id",
      "version",
      "path",
      "displayName",
      "category",
      "visualAssetRef",
      "visualObjectDefinition",
      "interactionZone",
      "functionBinding",
    ]));
  });

  it("detects exact duplicates inside one session by SHA-256", async () => {
    const fixture = createCanonicalAssetImportFixtures().png;
    const session = new AssetImportService().createSession({
      sessionId: "duplicate-session",
    });
    const result = await session.importFiles([
      fixture,
      { ...fixture, fileName: "copy.png", bytes: fixture.bytes.slice() },
    ]);

    expect(result.items[0].status).toBe(AssetImportStatus.NeedsInformation);
    expect(result.items[0].duplicate).toBeUndefined();
    expect(result.items[1].status).toBe(AssetImportStatus.Warning);
    expect(result.items[1].duplicate).toEqual({
      sha256: result.items[0].draftVisualAsset?.sha256,
      exact: true,
      matches: [{
        source: "import-session",
        draftId: "duplicate-session:draft:0001",
        sourceFileName: "transparent.png",
      }],
    });
  });

  it("detects duplicates against exact existing VisualAsset references", async () => {
    const fixture = createCanonicalAssetImportFixtures().svg;
    const validation = await new AssetImportService().validateFile(fixture);
    const result = await new AssetImportService().importFiles([fixture], {
      sessionId: "existing-duplicate",
      existingVisualAssets: [{
        visualAssetRef: {
          id: "core.visual-asset.vector",
          version: "1.0.0",
        },
        sha256: validation.sha256!,
      }],
    });

    expect(result.items[0].status).toBe(AssetImportStatus.Warning);
    expect(result.items[0].duplicate?.matches).toEqual([{
      source: "existing-visual-asset",
      visualAssetRef: {
        id: "core.visual-asset.vector",
        version: "1.0.0",
      },
    }]);
  });

  it("retains duplicate knowledge across batches but isolates fresh sessions", async () => {
    const fixture = createCanonicalAssetImportFixtures().webp;
    const service = new AssetImportService();
    const session = service.createSession({ sessionId: "retained" });

    const first = await session.importFiles([fixture]);
    const second = await session.importFiles([fixture]);
    const isolated = await service.importFiles([fixture], {
      sessionId: "isolated",
    });

    expect(first.items[0].status).toBe(AssetImportStatus.NeedsInformation);
    expect(second.items[0].status).toBe(AssetImportStatus.Warning);
    expect(second.items[0].draftVisualAsset?.draftId).toBe(
      "retained:draft:0002",
    );
    expect(isolated.items[0].status).toBe(AssetImportStatus.NeedsInformation);
  });

  it("owns input bytes and exposes copies from immutable drafts", async () => {
    const fixture = createCanonicalAssetImportFixtures().png;
    const originalFirstByte = fixture.bytes[0];
    const resultPromise = new AssetImportService().importFiles([fixture], {
      sessionId: "owned-bytes",
    });
    fixture.bytes[0] = 0;
    const draft = (await resultPromise).items[0].draftVisualAsset!;
    const firstRead = draft.read();
    firstRead[0] = 0;

    expect(draft.read()[0]).toBe(originalFirstByte);
    expect(Object.isFrozen(draft)).toBe(true);
  });

  it("validates service options and existing digests", () => {
    expect(() => new AssetImportService({
      maximumDimension: 100,
      recommendedDimension: 101,
    })).toThrow(AssetImportServiceError);

    expect(() => new AssetImportService().createSession({
      existingVisualAssets: [{
        visualAssetRef: { id: "core.asset.invalid", version: "1.0.0" },
        sha256: "not-a-sha",
      }],
    })).toThrow(AssetImportServiceError);
  });

  it("uses deterministic session and draft identifiers", async () => {
    const service = new AssetImportService();
    const fixture = createCanonicalAssetImportFixtures().svg;
    const first = await service.importFiles([fixture]);
    const second = await service.importFiles([fixture]);

    expect(first.sessionId).toBe("asset-import-0001");
    expect(second.sessionId).toBe("asset-import-0002");
    expect(first.items[0].draftVisualAsset?.draftId).toBe(
      "asset-import-0001:draft:0001",
    );
    expect(second.items[0].draftVisualAsset?.draftId).toBe(
      "asset-import-0002:draft:0001",
    );
  });
});

function svgBytes(width: number, height: number): Uint8Array {
  return new TextEncoder().encode(
    `<svg xmlns="http://www.w3.org/2000/svg" `
    + `viewBox="0 0 ${width} ${height}"><path d="M0 0"/></svg>`,
  );
}

function animatedWebpBytes(): Uint8Array {
  return new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
    0x57, 0x45, 0x42, 0x50,
    0x56, 0x50, 0x38, 0x58, 0x0a, 0x00, 0x00, 0x00,
    0x12, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00,
    0x56, 0x50, 0x38, 0x4c, 0x05, 0x00, 0x00, 0x00,
    0x2f, 0x00, 0x00, 0x00, 0x10, 0x00,
  ]);
}
