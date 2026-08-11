# Catalog Completion Technical Slice

Status: Implemented foundation

Scope: Immutable catalog metadata completion and explicit promotion

Depends on:

- `17_visual_interaction_function_model.md`
- `18_asset_catalog_foundation.md`
- `19_asset_import_experience.md`
- `20_asset_import_technical_slice.md`
- `21_catalog_completion_experience.md`

## 1. Boundary

This slice begins with one technically valid `DraftVisualAsset`. It collects
discovery metadata in an immutable `CatalogDraft`, validates readiness and ends
with an explicit promotion to exactly one `AssetCatalogEntry`.

It does not create:

- a canonical `VisualAsset` record or persistence path;
- a Visual Object Definition or Instance;
- an Interaction Zone or Profile;
- a Function Binding or Definition Pack;
- Runtime behavior;
- rendered thumbnail or preview bytes.

The canonical `VisualAsset` identity and storage handoff remain outside this
slice. Promotion therefore requires an exact `visualAssetRef` whose registered
record matches the draft's technical metadata.

## 2. Persistent Catalog fields

Contract 21 extends `AssetCatalogEntry` with two required fields:

- `scope`: `core`, `theme` or `personal`;
- `origin`: `built-in`, `imported` or `generated`.

Both fields are present in the public TypeScript type, JSON Schema and canonical
fixtures. Existing Core fixtures use `scope: "core"` and
`origin: "built-in"`.

The Catalog Completion service supports two explicit flows:

| Flow | Allowed scope | Required origin |
| --- | --- | --- |
| `user-import` | `personal` or `theme` | `imported` |
| `core-internal` | `core` | `built-in` |

The `generated` origin remains valid catalog data for a future approved
generation workflow, but that workflow is not implemented here.

## 3. Public model

The public Theme Engine entry exports:

- `CatalogDraft`;
- `CatalogDraftMetadata`;
- `CatalogCompletionStatus`;
- `CatalogCompletionValidationResult`;
- `CatalogPromotionService`;
- `CatalogPromotionServiceError`;
- automatic preview descriptor types;
- canonical Catalog Completion fixtures.

A `CatalogDraft` owns:

- a defensive copy of the technical draft;
- an exact future Catalog Entry identity and exact `visualAssetRef`;
- progressive catalog metadata;
- deterministic automatic preview descriptors;
- its current validation and completion status.

Its only statuses are:

- `needs-metadata`;
- `ready-for-catalog`.

## 4. Required metadata

Readiness requires:

- display name;
- description;
- category;
- perspective;
- orientation;
- scale class;
- scope;
- origin;
- creator;
- provenance;
- license;
- compatibility;
- system tags.

Compatibility explicitly contains Template, Surface Type and Visual Object Type
arrays. Empty arrays are valid declarations. Optional subcategory, user tags and
Theme association remain optional.

Validation returns ordered missing fields and concrete issues. Final field
shape, IDs, versions, references, arrays, URLs and version ranges reuse the
canonical strict `AssetCatalogEntry` validator. Invalid metadata does not mutate
or discard a draft.

## 5. Automatic preview descriptors

Every Catalog Draft deterministically derives:

- one thumbnail descriptor fitted within 256 by 256 pixels;
- one detail-preview descriptor fitted within 1024 by 1024 pixels.

Descriptors are recipes for future derived catalog resources. Their identity is
based on the validated source SHA-256, role, derivation strategy and descriptor
version. They have no canonical Visual Asset ID, semantic version, media path or
`visualAssetRef`.

No thumbnail or preview bytes are rendered in this slice. Explicit replacement
preview assets and Layer Preview composition remain separate future workflows.

## 6. Explicit promotion

Draft creation, metadata replacement and validation are side-effect free.
They never touch `AssetCatalogRegistry`.

`CatalogPromotionService.promote(draft, registry)` is the only completion
operation that changes the registry. It:

1. recomputes validation instead of trusting stored status;
2. rejects incomplete or invalid drafts;
3. requires the referenced canonical Visual Asset to exist;
4. verifies its digest, media facts, byte size and dimensions against the
   technical draft;
5. constructs one strict `AssetCatalogEntry`;
6. registers that one entry through the existing registry duplicate guard.

Fresh promotions set `deprecated` to `false`; absent optional user tags become
an explicit empty array required by the Catalog schema. Automatic descriptors
do not populate `thumbnailRef` or `previewRef`, because those references are
reserved for explicit Visual Assets.

Repeated promotion of the same identity is rejected by the existing registry
duplicate protection.

## 7. Immutability and determinism

Inputs, nested metadata, target references and source bytes are defensively
copied. Drafts, validations, issue arrays, descriptors and promotion results are
frozen. Reading draft bytes always returns a copy.

Given the same source draft, target and metadata, validation and preview
descriptors are deterministic.

## 8. Design Intelligence

The implementation adopts only established architectural principles that fit
Cosmos:

- stable referenced source data and immutable derived definitions, as in
  Blender-style data blocks;
- metadata completion before library availability, as in creative asset
  libraries;
- explicit publication-like action rather than hidden side effects, as in
  Figma and Unreal content workflows;
- catalog discovery remaining separate from placement and behavior, as in Build
  catalogs.

It intentionally rejects editor UI, automatic semantic inference, automatic
promotion, hidden registry writes, asset generation and downstream object or
function creation.

## 9. Verification

Tests cover:

- missing and invalid required fields;
- `needs-metadata` and `ready-for-catalog`;
- user and internal scope/origin rules;
- no automatic promotion;
- promotion only from a complete draft;
- exactly one Catalog Entry per promotion;
- registry duplicate protection;
- technical draft/reference consistency;
- deterministic non-VisualAsset preview descriptors;
- defensive copying and immutable results;
- absence of Visual Object, Interaction, Function and Runtime output.

## 10. Known limits

- Canonical Visual Asset identity assignment, storage and persistence are not
  part of Catalog Completion.
- Generated-origin workflows are not implemented.
- Preview descriptors do not render or persist media.
- Explicit thumbnail, detail preview and layer assets are not supported.
- Batch editing and UI are not implemented.
