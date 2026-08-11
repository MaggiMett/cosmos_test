# Asset Catalog Foundation

**Status:** Phase 1A implemented

**Scope:** Visual Asset and versioned Asset Catalog metadata only

**Runtime impact:** none

**Schemas:**

- `schemas/visual-asset.schema.json`
- `schemas/asset-catalog-entry.schema.json`

## 1. Purpose

This phase establishes the first official, public and versioned Cosmos Asset
Catalog. It separates a safe media resource from the metadata used to discover
that resource.

The foundation contains no importer, browser, builder, renderer, runtime
activation, preview generation, thumbnail generation, placement engine,
interaction zone or Function Container behavior.

## 2. Ownership boundary

### 2.1 Visual Asset

`VisualAsset` describes only a safe immutable media resource:

- stable ID and semantic version;
- media kind, format and MIME type;
- normalized package-relative path;
- SHA-256 digest and encoded byte size;
- intrinsic width and height;
- optional color-space, alpha, density and accessibility metadata.

Its closed schema cannot express:

- position, transform or placement;
- Layout, Visual, Effect, Label or Interaction Bounds;
- hitboxes or pointer behavior;
- actions, functions, routes or Runtime descriptors;
- Renderer selection or parameters;
- Theme activation state.

The schema validates declared metadata. Byte-signature, digest, decode and SVG
sanitization remain responsibilities of the existing safe asset/import
pipeline; this phase does not implement an importer or pretend fixture bytes
exist.

### 2.2 Asset Catalog Entry

`AssetCatalogEntry` describes only discovery, classification, provenance,
preview references and declared compatibility for one exact Visual Asset
version.

Required fields are:

- `schemaVersion`, `id`, `version`;
- `visualAssetRef`;
- `displayName`, `description`;
- `category`;
- `scope`, `origin` as finalized by
  `21_catalog_completion_experience.md`;
- `systemTags`, `userTags`;
- `perspective`, `orientation`, `scaleClass`;
- `creator`, `provenance`, `license`;
- `compatibleTemplates`;
- `compatibleSurfaceTypes`;
- `compatibleVisualObjectTypes`;
- `deprecated`.

Optional fields are:

- `subCategory`;
- `theme`;
- `thumbnailRef`;
- `previewRef`;
- `layerPreviewRef`;
- `replacement`.

All arrays are explicit, including empty arrays. The schemas contain no
defaults, coercion or unknown-property removal.

Compatibility metadata is descriptive and queryable. It does not grant
placement, interaction, function or Runtime authority. A Catalog entry does
not create a Visual Object Definition. Future Visual Object Definition,
Interaction Zone, Interaction Zone Profile and Function Binding validators
remain authoritative at their own boundaries.

### 2.3 Approved Visual / Interaction / Function model

`17_visual_interaction_function_model.md` defines the canonical downstream
chain:

```text
Visual Asset
  -> Asset Catalog Entry
  -> Visual Object Definition
  -> Visual Object Instance
  -> optional Interaction Zone
  -> Interaction Zone Profile
  -> Function Binding
  -> Function Definition Pack
  -> Core Runtime Target
```

Phase 1A ends after the second node. `compatibleTemplates`,
`compatibleSurfaceTypes` and `compatibleVisualObjectTypes` are searchable
compatibility claims only. They neither create a Visual Object Definition nor
authorize placement. In particular:

- Visual Asset owns media only;
- Asset Catalog Entry owns discoverability only;
- Visual Object Definition will own visual bounds, layers, placement rules,
  anchors and Skin compatibility in a later phase;
- Interaction Zone and Interaction Zone Profile will own interaction geometry
  and reusable interaction rules in a later phase;
- Function Binding will be the only source of Runtime meaning.

The current Function Container remains a compatibility layer outside Phase 1A.
This foundation neither depends on it nor refactors it.

## 3. Identity and versioning

Visual Assets and Asset Catalog entries use independent namespaced IDs and
semantic versions.

Exact references use:

```ts
interface ExactVersionedRef {
  id: string;
  version: string;
}
```

The Catalog pins Visual Asset and preview references exactly. Template
compatibility uses explicit version ranges because it is a compatibility
declaration rather than resource identity.

Multiple versions of one ID may coexist. Duplicate means the complete
`id + version` identity. A replacement cannot reference the same entry version,
and non-deprecated entries cannot declare a replacement.

## 4. Validation

The existing strict Ajv Draft 2020-12 instance now compiles both public schemas.
Validation retains:

- `strict: true`;
- `coerceTypes: false`;
- `useDefaults: false`;
- `removeAdditional: false`;
- complete error collection;
- the shared executable-content guard.

Additional semantic validation rejects unsupported template version-range
syntax and self-replacement.

## 5. Registry

`AssetCatalogRegistry` is a definition-only registry with no Runtime
dependencies or global singleton.

It supports:

- individual and atomic batch registration;
- exact Visual Asset reference validation;
- exact replacement reference validation, including forward references in one
  batch;
- duplicate protection for Visual Assets and entries;
- multiple semantic versions per stable ID;
- lookup by ID;
- lookup by exact version;
- highest compatible version resolution;
- deterministic listing;
- category, tag, Theme, perspective, Template, Surface Type and Visual Object
  Type queries.

Caller values are defensively cloned. Stored objects and returned collections
are recursively frozen/read-only. Registration order never affects list or
query order; results sort by ID and then semantic version.

## 6. Canonical fixtures

Metadata-only fixtures are provided for:

- Bookshelf;
- Wooden Door;
- Steel Door;
- Plant;
- Workbench.

Each fixture has one corresponding Visual Asset metadata record and one
Asset Catalog entry. Core fixtures declare `scope: "core"` and
`origin: "built-in"`. Paths, digests and dimensions are fixture metadata only;
no PNG, SVG or preview bytes are created by this phase.

## 7. Design Intelligence

The review follows
`docs/Product_Bible_v2/00_Foundation/06_Design_Intelligence.md`.

### 7.1 Comparable systems

- Unreal Engine's Asset Registry exposes searchable metadata without requiring
  every asset to become loaded Runtime state. This supports the Cosmos
  separation between safe media identity and discovery metadata.
  [Official Unreal Asset Registry documentation](https://dev.epicgames.com/documentation/en-us/unreal-engine/asset-registry-in-unreal-engine)
- Blender Data Blocks use stable typed identities, references and shared reuse.
  This supports exact references and independent instances without copying
  source data.
  [Official Blender Data-Blocks manual](https://docs.blender.org/manual/en/5.0/files/data_blocks.html)
- Figma components and libraries separate reusable definitions from linked
  instances and make naming/organization part of discovery.
  [Official Figma components guide](https://help.figma.com/hc/en-us/articles/360038662654-Guide-to-components-in-Figma)
- The Sims Build Mode makes a broad object set approachable through a catalog
  instead of exposing source files.
  [Official EA Build Mode guide](https://www.ea.com/en/games/the-sims/the-sims-4/new-player-hub/build-mode)

### 7.2 Adopted principles

- metadata-first discovery;
- stable definition identity separate from use and placement;
- shared references instead of duplicated media;
- explicit categories, tags and compatibility facets;
- immutable versions and deterministic lookup;
- preview references as optional metadata, not generated content.

### 7.3 Intentionally rejected

- Unreal package scanning, background loading and editor callbacks;
- Blender lifetime/user-count mutation and file-linking behavior;
- Figma publishing, instance overrides and component update propagation;
- The Sims UI, economy, inventory, placement rules and gameplay categories;
- reference-system terminology, branding or visual design;
- free-form metadata maps where canonical fields provide a stable public
  contract.

### 7.4 Why Cosmos differs

Cosmos uses a smaller, data-only contract. A catalog result says that an asset
can be found and is declared compatible; it never says where it is placed,
which hitbox it receives, what it does or how Runtime renders it. Those
authorities remain in their existing specialized contracts.

## 8. Test coverage

`assetCatalog.test.ts` covers:

- Draft 2020-12 metaschema validation;
- canonical Visual Asset and Catalog fixtures;
- strict media format/MIME combinations;
- required and unknown fields;
- absence of silent defaults;
- semantic versions and version ranges;
- forbidden placement, hitbox, function and Runtime data;
- forbidden Visual Object, Interaction Zone/Profile and Function Binding data;
- exact Visual Asset and replacement references;
- atomic registration and duplicates;
- multiple versions and compatible resolution;
- all required query dimensions;
- registration-order independence;
- defensive cloning and immutable reads.

## 9. Public API

The Theme Engine public entry exports:

- `VisualAsset`;
- `AssetCatalogEntry` and related metadata/reference types;
- `validateVisualAsset`;
- `validateAssetCatalogEntry`;
- `AssetCatalogRegistry` and its stable error type;
- the five canonical fixture pairs.

No existing Runtime, Renderer, Base Builder, Theme Builder or Theme View is
changed.
