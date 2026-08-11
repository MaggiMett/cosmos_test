# Asset and Skin Contract

Status: normative specification
Contract family: Cosmos Theme Engine `1.0.0`
Schema: `schemas/skin-pack.schema.json`

## 1. Purpose

This contract defines how visual assets and skins enter Cosmos, how they are
validated, stored, resolved and rendered, and which security and performance
limits apply. It deliberately excludes executable extensions. A skin may alter
presentation, but never behavior, permissions, navigation or user data.

## 2. Normative terms

The words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT** and **MAY** are
normative.

- **Asset**: an immutable, content-addressed visual file and its metadata.
- **Asset slot**: a typed template location into which a compatible asset may
  be bound.
- **Skin**: declarative visual bindings, tokens, materials and state variants
  for one or more compatible templates or renderer roles.
- **Skin Pack**: a versioned package containing several related skins/assets.
- **Single Skin**: the same package format constrained to exactly one skin.
- **Material**: declarative paint parameters consumed by a trusted Core
  renderer.
- **System term**: an allowlisted Cosmos-owned visible label such as “Base”.
- **User content**: user-assigned names, tags, filenames, content and labels.

## 3. Ownership boundary

### 3.1 Catalog Object and Function Container refinement

Under `13_room_composition_system.md`, a Skin targets a Catalog Object or Room
Shell visual contract. It never targets a function directly.

- Catalog Objects declare bounds, placement metadata and compatible Skin slots.
- Function Containers declare interaction, action-role and accessibility
  contracts.
- A Room Object Instance may attach one compatible Function Container.
- Skin/asset replacement cannot attach, detach or retarget that container.
- Room Presets reference Catalog Objects and Skins; they never duplicate asset
  declarations or bytes.

This refinement preserves every media, sanitization, budget, fallback and
animation rule in this document.

Core owns:

- import, decoding, sanitization and content hashing;
- Resource Service storage and lifetime;
- slot compatibility checks;
- renderer implementations;
- interaction, navigation, permissions and runtime state;
- fallback and budget enforcement.

Templates own:

- slot IDs, accepted media kinds and semantic purpose;
- required/optional status;
- dimensions, fit modes, anchors and safe areas;
- available state and material channels.

Skins own only:

- compatible asset bindings;
- typed visual tokens;
- declarative materials;
- visual state variants and animations;
- allowlisted system-term replacements;
- optional visual/effect/label bounds where the template permits them.

Skins MUST NOT define actions, event handlers, capabilities, persistence,
network requests, arbitrary markup, shader code or renderer code.

## 4. Package data model

A package conforms to `skin-pack.schema.json` and has:

| Field | Required | Meaning |
|---|---:|---|
| `schemaVersion` | yes | Integer schema generation; `1` in this contract |
| `packId` | yes | Stable namespaced ID |
| `version` | yes | Semantic package version |
| `packageKind` | yes | `skin-pack` or `single-skin` |
| `displayName` | yes | Author-facing package name |
| `compatibility` | yes | Theme Engine and Cosmos compatibility |
| `assets` | yes | Asset declarations; may be empty |
| `skins` | yes | One or more skin declarations |
| `dependencies` | no | Versioned package/template dependencies |
| `license` | no | SPDX expression or documented proprietary marker |
| `author` | no | Display-only author metadata |

IDs are immutable within an identity. Changing the meaning of a skin or asset
without a version change is invalid. A `single-skin` package MUST contain
exactly one skin.

## 5. Supported media

Version 1 accepts only:

| Format | Media kind | Initial runtime support |
|---|---|---|
| PNG | `image` | required |
| WebP | `image` | required |
| SVG | `vector` | required after sanitization |
| WebM | `video` | contract-defined; runtime may capability-gate |
| MP4 | `video` | contract-defined; runtime may capability-gate |

File extension, declared MIME type and detected file signature MUST agree.
Renaming an unsupported file is not sufficient. Animated GIF, HTML, CSS,
JavaScript, TypeScript, Python, WASM, font files and shader sources are not
valid v1 assets.

Static assets are the mandatory first implementation target. Video fields are
specified now so package identity does not need a later incompatible redesign.

Light and dark variants MAY be modeled as optional compatible state/capability
variants, but v1 does not require a skin or theme to provide both. Core Default
fallback must remain sufficient for any platform appearance setting.

## 6. Asset declaration

Each asset contains:

- `assetId`: stable ID unique within the package;
- `kind`: `image`, `vector` or `video`;
- `format`: one of the supported formats;
- `path`: normalized package-relative path;
- `sha256`: lower-case SHA-256 digest of the imported bytes;
- `byteSize`: exact encoded size;
- `width` and `height`: intrinsic pixel/viewBox dimensions;
- optional `colorSpace`, `alpha`, `density` and `accessibilityDescription`;
- optional video `media` contract;
- optional budget hints.

Paths MUST:

- use `/` separators;
- be relative;
- contain no empty, `.` or `..` segments;
- contain no scheme, drive letter, query or fragment;
- resolve inside the package root after normalization.

Activated packages MUST NOT refer to network URLs, `data:` URLs, local absolute
paths or resources outside the package. At import, Cosmos copies accepted files
into Resource Service storage and addresses them by digest. The source path is
provenance, not a live runtime dependency.

## 7. Asset identity and deduplication

`assetId` is the authoring identity; `sha256` is the content identity.
Resource Service MAY deduplicate identical bytes across packages. Resolution
always checks the package-declared digest. A digest mismatch is a hard package
validation error, never a cache refresh.

Replacing asset bytes requires:

1. a new digest;
2. an updated asset declaration;
3. a new patch version at minimum.

Runtime snapshots pin the exact package version and digest so active visuals do
not change underneath a session.

## 8. SVG sanitization

SVG is parsed as XML and rewritten to a conservative internal representation.
The sanitizer MUST reject or remove:

- `script`, `foreignObject`, embedded HTML and executable animation elements;
- event attributes such as `onclick`;
- external `href`, `xlink:href`, CSS `url()` and imports;
- entity expansion, DTDs and processing instructions;
- network fonts and external stylesheets;
- unknown namespaces and active content;
- filters or path complexity exceeding configured budgets.

Allowed SVG features SHOULD include basic shapes, paths, groups, masks,
gradients, clips and static transforms. IDs and references MUST be
package-local. Sanitized bytes receive their own digest and are the bytes
registered for rendering. The original may be retained as quarantined import
provenance but MUST NOT be activated.

## 9. Video contract

Every video asset MUST declare:

- `posterAssetId`;
- `reducedMotionAssetId`;
- `loop`;
- `autoplay`;
- `muted`;
- `playbackRate` in the range `0.25` through `4`;
- `lazyLoad`: `eager`, `viewport` or `on-demand`.

Rules:

- autoplay is allowed only when `muted` is `true`;
- a poster and reduced-motion fallback MUST be static image/vector assets;
- reduced-motion mode MUST render the fallback and MUST NOT start decorative
  motion automatically;
- off-screen videos SHOULD be paused and released according to budget policy;
- functional meaning MUST NOT depend solely on video playback;
- audio tracks are ignored or stripped for decorative theme assets.

Failure to decode video falls back to poster, then reduced-motion asset, then
the slot fallback.

## 10. Budgets

Default import ceilings:

| Budget | Default |
|---|---:|
| One static/vector file | 16 MiB encoded |
| One video file | 64 MiB encoded |
| One dimension | 8192 px maximum |
| Recommended dimension | 4096 px or less |
| One pack | 256 MiB encoded |
| Simultaneous environment videos | 2 |

Core MAY enforce stricter device-profile budgets for decoded memory, GPU
textures, draw calls, SVG nodes and video decoders. Device-profile reduction
MUST preserve function and use declared fallbacks. A pack that exceeds hard
import limits is rejected. A runtime budget overrun degrades optional effects
before required visuals:

1. particles and ambient motion;
2. video to poster;
3. high-density optional overlays;
4. glow/filter complexity;
5. Core Default required visual.

## 11. Skin declaration

A skin has:

| Field | Required | Meaning |
|---|---:|---|
| `skinId`, `version`, `displayName` | yes | Identity |
| `target` | yes | Presentation group and compatible template/renderer refs |
| `assetBindings` | yes | Slot-to-asset mappings; may be empty |
| `tokens` | yes | Typed visual values; may be empty |
| `materials` | yes | Trusted-renderer parameters; may be empty |
| `stateVariants` | yes | Visual changes keyed by template state |
| `systemTerms` | no | Allowlisted localized replacements |
| `boundsOverrides` | no | Only bounds permitted by the template |
| `animation` | no | Declarative timelines and reduced-motion behavior |

Target groups are:

`world`, `map`, `base-entry`, `base-interior`, `room`, `workspace`, `window`,
`companion`, `icon`, `node`, `connection`, `label`, `status` and `ambient`.

The target identifies compatibility, not behavior. A skin cannot turn a node
skin into a workspace or bind an action.

## 12. Typed tokens

Token values are explicitly typed:

- `color`
- `length`
- `number`
- `duration`
- `shadow`
- `font-family`
- `opacity`
- `string`
- `boolean`

The schema checks structural type; the consuming template or renderer checks
semantic range and unit. Unknown token names are rejected unless the referenced
template/renderer publishes them. Tokens cannot contain CSS source. CSS custom
properties MAY be emitted as a browser backend, but their names and serialization
are runtime implementation details.

Typography in v1 may select only approved system font stacks. External font
assets are not part of this contract.

## 13. Asset bindings

An asset binding contains `slotId`, `assetId` and optional presentation values
such as:

- `fit`: `contain`, `cover`, `fill`, `none`;
- `alignment`;
- opacity and tint where the slot permits them;
- slicing metadata for a template-declared scalable frame;
- state restriction.

Validation resolves the target template and verifies:

- the slot exists;
- media kind/format is accepted;
- required dimensions/aspect constraints are met;
- the state exists;
- binding multiplicity is allowed;
- referenced asset belongs to the dependency closure.

Required slots MUST resolve through the selected skin or its fallback chain.
Optional slots may be absent or explicitly disabled.

## 14. Materials

Materials select a template/renderer-published material channel and supply a
closed set of typed parameters. Examples include fill, stroke, opacity, glow,
shadow, texture blend and emissive intensity. The renderer contract owns the
parameter schema and limits.

Materials MUST NOT contain raw CSS declarations, SVG markup, shader source,
DOM selectors or expression strings. Unknown channels and parameters are
errors. Values outside published limits are errors at package validation; the
runtime MUST NOT silently clamp signed package data except for device-profile
degradation defined by the renderer.

## 15. State variants and animation

State variants refer only to states declared by the target template. They may
override:

- asset binding selection;
- token/material values;
- opacity and visibility for optional decorative layers;
- declarative animation selection.

They MUST NOT add state transitions or determine functional state. Core reports
the current state; Theme Runtime chooses the corresponding presentation.

Animations are declarative named timelines over allowlisted visual properties.
Each must define:

- duration and iteration policy;
- affected visual channels;
- start/end or keyframe values;
- reduced-motion behavior (`disable`, `freeze-first`, `freeze-last` or
  `substitute`);
- optional performance class.

Infinite animation is allowed only for declared ambient/idle effects. Critical
feedback MUST remain understandable when motion is disabled.

## 16. Bounds overrides

A skin may override Visual Bounds, Effect Bounds and Label Bounds only when the
template marks that bound as `skin`-mutable. It cannot modify Interaction
Bounds, Layout Bounds, critical safe areas or functional anchors. Visual and
Effect Bounds may be larger than the Interaction Bounds. They MUST NOT capture
pointer input outside the Interaction Bounds.

## 17. System terms and protected content

System-term replacement is an allowlist operation. Initial keys include:

- `system.base`
- `system.room`
- `system.workspace`
- `system.companion`
- `system.map`
- Core-owned status words explicitly published by Theme Registry.

The universal domain term is **Base**. “Ship” is a valid skin-specific label for
`system.base`, not a different functional object.

Theme Runtime MUST bypass substitution for:

- Project, Node and Workspace names;
- user tags;
- filenames and content;
- user-authored labels;
- imported metadata not explicitly classified as a system term.

Unknown system-term keys are rejected. Missing locale uses the normal Cosmos
locale fallback and finally the Core Default term.

## 18. Validation stages

Validation occurs before registration:

1. schema and canonical JSON validation;
2. identity/version/dependency checks;
3. path containment and signature detection;
4. digest and byte-size verification;
5. media decoding and intrinsic metadata check;
6. SVG sanitization or video metadata validation;
7. budget checks;
8. template/renderer/slot compatibility;
9. token/material/state validation;
10. system-term and user-content policy validation;
11. fallback completeness;
12. deterministic package sealing.

Registration is atomic. A partially accepted pack is forbidden.

## 19. Fallbacks

Resolution for an asset slot is:

1. state-specific selected skin binding;
2. base binding in selected skin;
3. next compatible skin in the override chain;
4. target template fallback skin;
5. Core Default asset or emergency primitive.

Invalid package data is not skipped piecemeal after activation. If a previously
registered resource becomes unreadable, the runtime records a diagnostic and
uses the nearest safe fallback without changing Core state.

## 20. Errors

Stable error codes include:

- `asset_unsupported_format`
- `asset_signature_mismatch`
- `asset_path_escape`
- `asset_digest_mismatch`
- `asset_decode_failed`
- `asset_budget_exceeded`
- `svg_unsafe_content`
- `video_poster_required`
- `video_reduced_motion_required`
- `video_autoplay_requires_muted`
- `skin_target_incompatible`
- `skin_slot_unknown`
- `skin_slot_type_mismatch`
- `skin_token_unknown`
- `skin_material_invalid`
- `skin_state_unknown`
- `skin_bound_forbidden`
- `system_term_forbidden`

Diagnostics include package ID/version, JSON pointer, related template or
renderer ID and a remediation hint. They MUST NOT expose local absolute import
paths in exported packages.

## 21. Versioning and compatibility

- Package and skin identities use semantic versions.
- `schemaVersion` changes only for structural schema generations.
- Patch: visual bytes or values change without slot/target contract changes.
- Minor: backward-compatible optional skins/assets/state variants.
- Major: removed/renamed targets, bindings or changed visual meaning.

Compatibility declares Theme Engine version range, optional Cosmos version
range and dependency ranges. Activation pins exact resolved versions. Lock data
belongs to the installed package registry, not the distributable author
manifest.

## 22. Example

```json
{
  "schemaVersion": 1,
  "packId": "example.nebula.base-pack",
  "version": "1.2.0",
  "packageKind": "skin-pack",
  "displayName": "Nebula Base Pack",
  "compatibility": { "themeEngine": "^1.0.0" },
  "assets": [
    {
      "assetId": "example.nebula.base.background",
      "kind": "image",
      "format": "webp",
      "mimeType": "image/webp",
      "path": "assets/base-background.webp",
      "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "byteSize": 804212,
      "width": 1600,
      "height": 900
    }
  ],
  "skins": [
    {
      "skinId": "example.nebula.base",
      "version": "1.2.0",
      "displayName": "Nebula Base",
      "target": {
        "presentationGroup": "base-interior",
        "templateRef": {
          "id": "cosmos.environment-template.base.standard-v1",
          "versionRange": "^1.0.0"
        }
      },
      "assetBindings": [
        {
          "bindingId": "example.nebula.binding.base-background",
          "slotId": "surface.background",
          "assetId": "example.nebula.base.background",
          "fit": "cover"
        }
      ],
      "tokens": {},
      "materials": [],
      "stateVariants": []
    }
  ]
}
```

## 23. Required tests

- parse and validate every supported and unsupported signature;
- path traversal cases across Windows and POSIX forms;
- digest mismatch and duplicate-content behavior;
- malicious SVG corpus;
- corrupt image/video and decompression-bomb limits;
- autoplay/muted invariant;
- reduced-motion substitution;
- slot type, target, state and material compatibility;
- required/optional slot fallback;
- oversized asset/pack/device-budget degradation;
- user-content substitution bypass;
- package activation atomicity and pinned digest;
- deterministic sanitized output for identical SVG input.

## 24. Open risks

- Browser SVG and video decoders remain a security boundary and require updates.
- Decoded GPU memory is device-dependent; encoded byte budgets are insufficient
  alone.
- Conservative SVG sanitization may reject legitimate artwork and needs clear
  author diagnostics.
- Video codec availability differs by platform; poster fallback is therefore
  mandatory.
- A future font contract will need licensing, shaping and fingerprinting rules
  without weakening v1 package safety.
