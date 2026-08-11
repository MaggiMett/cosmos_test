# Asset Import Technical Slice

Status: Implemented foundation

Scope: Static media validation through `DraftVisualAsset`

Depends on:

- `17_visual_interaction_function_model.md`
- `18_asset_catalog_foundation.md`
- `19_asset_import_experience.md`

## 1. Boundary

This slice accepts technical file input and ends at an in-memory
`DraftVisualAsset`.

It does not create or mutate:

- `VisualAsset`;
- `AssetCatalogEntry`;
- `VisualObjectDefinition`;
- `InteractionZone`;
- `FunctionBinding`;
- any registry, runtime, renderer or builder state.

A draft deliberately has no canonical asset ID, semantic version, storage path,
catalog metadata, placement data or runtime meaning. Promotion and persistence
are later pipeline steps.

## 2. Public API

The public theme-engine barrel exports:

- `AssetImportService`;
- `ImportSession`;
- `BatchImportResult`;
- `FileValidationResult`;
- `DraftVisualAsset`;
- `validateAssetImportFile`;
- the import status and supporting strict TypeScript types;
- isolated canonical test fixtures for PNG, WebP, SVG, unsafe SVG and video.

`AssetImportService.validateFile()` performs technical validation only.
`AssetImportService.importFiles()` creates a fresh session and imports a batch.
`AssetImportService.createSession()` supports multiple batches with session-local
duplicate memory.

No browser `File` dependency is required. Callers provide a filename, optional
declared MIME type and owned `Uint8Array` bytes. The service copies those bytes
at its boundary.

## 3. Supported media

Only static media is accepted:

| Format | Technical checks |
| --- | --- |
| PNG | Eight-byte signature, chunk boundaries, CRCs, required header/data/end chunks, dimensions and alpha-bearing color data |
| WebP | RIFF/WEBP signature, RIFF and chunk boundaries, VP8/VP8L/VP8X frame headers, dimensions and alpha flags |
| SVG | UTF-8, SVG root, intrinsic dimensions or `viewBox`, and a conservative active/external-content safety policy |

Animated WebP is rejected. Video, ZIP and all other formats are rejected.
Declared MIME type is checked against the detected byte format. A missing MIME
type is allowed because signature detection is authoritative; the generic
`application/octet-stream` type produces a warning. Filename extension mismatch
is also a warning.

Default technical budgets are explicit:

- maximum byte size: 16 MiB;
- maximum width or height: 8192 px;
- recommended maximum width or height: 4096 px.

The service constructor can replace these values, but invalid or contradictory
limits are rejected. There are no hidden fallback mutations of a result.

## 4. Per-file states

Every input has an independent result:

- `Ready`: technical validation passed without concerns;
- `NeedsInformation`: a draft exists, but catalog metadata is intentionally not
  part of this slice;
- `Warning`: a draft exists with one or more non-blocking technical or duplicate
  concerns;
- `Rejected`: a technical or security check failed and no draft exists.

`FileValidationResult` uses `Ready`, `Warning` and `Rejected`. A batch promotes a
clean technical result to `NeedsInformation`, because the batch deliberately
stops before catalog metadata. This keeps technical validity distinct from
catalog readiness.

One rejected file does not reject or roll back other files in its batch.

## 5. Exact duplicate detection

SHA-256 is calculated over the original bytes. `ImportSession` compares the
digest with:

- explicitly supplied existing `VisualAsset` references and digests;
- drafts created earlier in the same session, including earlier batches.

Matches are exact-byte matches only. They produce a visible warning and retain
the draft so a later experience can decide whether to reuse or skip it. This
slice performs no perceptual matching, automatic replacement, registry lookup
or persistence.

## 6. Determinism and ownership

Results preserve input order. Session and draft identifiers are deterministic
within a service instance. Concurrent calls on one session are serialized.
Returned result structures are frozen, and `DraftVisualAsset.read()` always
returns a byte copy.

These properties borrow the useful separation and stable identity principles of
established asset systems while retaining the Cosmos product boundary: media,
discovery metadata, visual objects, interaction and function remain separate
concerns.

## 7. Verification

The test suite covers:

- all supported formats;
- signatures, MIME and extension behavior;
- dimensions, alpha and byte budgets;
- unsafe SVG, malformed media, animated WebP and video rejection;
- independent batch results and counts;
- draft-only output;
- exact duplicates against a session and existing versioned references;
- session isolation, deterministic identifiers and byte ownership;
- invalid service configuration.
