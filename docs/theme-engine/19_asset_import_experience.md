# Asset Import Experience

**Version:** 1.0  
**Status:** Binding product decision  
**Category:** Theme Engine Foundation, Phase 1B  
**Authority:** `06_Design_Intelligence.md`, `17_visual_interaction_function_model.md` and `18_asset_catalog_foundation.md`

## 1. Purpose

Cosmos Asset Import is a creative library-intake experience, not a technical upload workflow.

Its purpose is to let an artist bring visual media into Cosmos safely, understand what was accepted, complete only meaningful metadata and discover the result later in the Asset Library.

Asset Import ends at Visual Assets and Asset Catalog Entries. It never creates visual placement, interaction geometry, functions or Runtime behaviour.

## 2. Non-negotiable boundaries

Import must never create:

- a Visual Object Definition;
- a Visual Object Instance;
- an Interaction Zone;
- an Interaction Zone Profile assignment;
- a Function Binding;
- a Function Definition Pack;
- a Runtime function, target or action.

A successfully imported file creates a draft VisualAsset after technical validation. An AssetCatalogEntry is created only after all required catalog metadata is complete.

Importing, publishing, activating and placing are separate user decisions.

## 3. Experience principles

- Import should feel like adding material to a personal or Theme library.
- Drag & Drop and the file dialog are equal entry points to the same flow.
- Technical facts are detected automatically.
- Cosmos asks only for creative, legal or context-dependent choices.
- A batch is never blocked because one individual file fails.
- An imported asset is initially a draft; import does not publish or activate it.
- Metadata should be completed progressively, not through a large initial form.
- The Artist always sees why an item needs attention and what will happen next.

## 4. Import flow

### 4.1 Start import

The Artist can:

- drag one or more files into the Theme Builder Asset Library;
- choose one or more files through an import dialog;
- choose a folder for batch import;
- later use separate Asset Pack or Theme Pack import actions.

Drag & Drop and file-dialog selection always lead to the same review experience.

### 4.2 Technical review

Cosmos immediately reviews every selected file independently and assigns one clear state:

- **Ready** — technically valid and ready for metadata;
- **Needs information** — technically valid, but catalog metadata is incomplete;
- **Warning** — usable with a visible non-blocking concern;
- **Cannot import** — rejected, with a concrete reason.

The Artist can continue with ready items while resolving or removing other files.

### 4.3 VisualAsset creation

After successful technical validation, Cosmos creates a draft VisualAsset.

Technical validation includes, where applicable:

- actual media format and MIME type;
- file signature;
- byte size;
- intrinsic dimensions;
- image/vector/video kind;
- alpha/transparency information;
- animation or video information;
- digest;
- damage or decode failure;
- supported safety and budget rules.

A rejected file creates no VisualAsset.

### 4.4 Catalog completion

A technically valid VisualAsset can remain a draft without being discoverable in the catalog.

Cosmos creates an AssetCatalogEntry only after all required catalog metadata is complete:

- display name and description;
- category;
- perspective;
- orientation;
- scale class;
- creator, provenance and license;
- declared compatibility.

For batch imports, common values can be applied to all selected items. Any item can still be adjusted individually.

### 4.5 Publication and activation

Import does not publish, package or activate an asset.

A draft asset becomes available for catalog use only after its catalog entry is complete. Publishing into an Asset Pack or Theme Pack remains a later, explicit action. Activating a Theme remains separate from publishing.

## 5. Automatic detection and user confirmation

| Cosmos detects automatically | Artist confirms or edits |
| --- | --- |
| format, MIME type and file signature | display name and description |
| dimensions, byte size and digest | category and tags |
| image, vector or video kind | perspective, orientation and scale class |
| alpha/transparency indication | Theme association |
| damaged or unsafe source | creator, provenance and license |
| exact byte duplicate | intended compatibility |
| suggested name from filename | video pairing and creative preview choices |
| suggested tags from import context | destination scope when context is ambiguous |

Cosmos may suggest metadata, but it must not infer semantics as fact. A file named or depicted as a door is not automatically a Door category, interactive object or Room Transition.

## 6. Preview experience

### 6.1 Thumbnail

A Thumbnail supports quick recognition in catalog browsing.

For still images and vectors, Cosmos generates or displays a safe default thumbnail automatically. An Artist may later replace it with an explicit thumbnail asset.

### 6.2 Preview

A Preview supports inspection in the asset detail view.

The default Preview is the asset itself rendered in a safe, fitting presentation. An explicit preview may replace the default where the artwork needs a more meaningful presentation.

### 6.3 Layer Preview

A Layer Preview shows intentionally supplied visual layers or reliably available source layers.

Cosmos must not invent layers from a flattened PNG, WebP or video. When no real layer information exists, the Asset Library states that no Layer Preview is available. Later, separately supplied layer assets may form a Layer Preview.

### 6.4 Animated and video preview

Video and animated assets use a static poster in browsing contexts. Playback begins only after an explicit user action and is muted by default.

Reduced-motion preview displays the declared static fallback rather than starting decorative motion. If poster or reduced-motion fallback is absent, the video remains incomplete and cannot be considered ready for catalog publication.

## 7. Error behaviour

Errors and warnings are displayed per file. One invalid file must never block a valid file in the same batch.

| Situation | Required experience |
| --- | --- |
| Unsupported format | Reject that file and state supported formats. |
| File too large | State detected and permitted size; do not silently compress. |
| Damaged file | Reject it clearly; allow retry after replacement. |
| Unsafe SVG | Quarantine and explain the security concern without exposing technical internals. |
| Missing transparency | Never treat as an error; show opacity only as information. |
| Missing perspective or category | Keep the VisualAsset as draft and request metadata before Catalog Entry creation. |
| Missing provenance or license | Keep the VisualAsset as draft and block catalog publication. |
| Missing video poster or reduced-motion fallback | Keep the video incomplete and explain the required companion asset. |
| Exact duplicate | Show the existing VisualAsset and offer reuse as the default. |

## 8. Duplicate policy

Cosmos identifies duplicates only through exact byte identity using the validated digest.

For an exact duplicate, Cosmos offers:

- reuse the existing VisualAsset;
- skip the repeated file;
- create a distinct AssetCatalogEntry when a genuinely different discovery context is needed.

Cosmos does not perform visual-similarity or perceptual duplicate detection in the first release. A false duplicate result would be more harmful than a missed similarity.

## 9. Organization model

Cosmos avoids competing folder hierarchies. Asset organization uses two independent facets.

### 9.1 Scope

- **Core** — built-in, read-only Cosmos assets.
- **Theme** — assets belonging to a specific Theme or package draft.
- **Personal** — assets owned by the current creator outside a specific Theme.

### 9.2 Origin

- **Built-in** — shipped by Cosmos.
- **Imported** — brought in from an external source.
- **Generated** — created through an approved generation workflow.

Scope answers where an asset belongs. Origin answers where it came from. They are labels and filters, not separate incompatible libraries.

The Asset Library starts with simple views:

- All Assets;
- My Assets;
- Current Theme Assets.

Category, tags, Theme, perspective, format, scope and origin remain filterable metadata.

## 10. Folder, Asset Pack and Theme Pack import

Folder import is a batch convenience. A source folder structure may help the Artist understand the batch, but it must not become a mandatory permanent catalog hierarchy.

Asset Pack and Theme Pack import are separate manifest-based workflows. Cosmos must first inspect and present:

- package identity and version;
- included assets;
- provenance and license information;
- conflicts and duplicates;
- validation status;
- publication or activation consequences.

A generic ZIP file is not treated as an Asset Pack merely because it contains media. Cosmos supports arbitrary ZIP intake only when it can safely distinguish a validated package from an unstructured archive.

## 11. Video prioritization

The first productive import slice supports static PNG, WebP and SVG.

Video support for WebM and MP4 follows after this static slice. The later video flow must include:

- poster asset;
- reduced-motion static fallback;
- explicit preview playback;
- budget and capability warnings;
- no automatic decorative playback in catalog browsing.

## 12. Builder responsibility

The Theme Builder owns asset import, technical review, draft status, catalog metadata, preview management and later package publication.

The Base Builder may browse and use catalog assets but never imports source media, sanitizes files or edits catalog definitions.

Room-Shell geometry remains Theme Builder-only. Import does not place an asset into a Room.

## 13. Design Intelligence

Cosmos adopts established principles without adopting another product’s interface or identity:

- **Blender:** libraries, catalogs, tags and reusable assets are distinct from scene placement.
- **Figma and Adobe Libraries:** reusable creative assets need clear provenance, discoverability and contextual reuse.
- **Unreal and Unity:** batch import should detect objective facts automatically while allowing per-item review.
- **Wallpaper Engine:** media should become immediately inspectable; animated media needs deliberate preview and performance awareness.
- **The Sims Build Mode:** discovery should be catalog-first and approachable, rather than file-system-first.

Cosmos intentionally rejects:

- automatic semantic inference from artwork;
- automatic function creation;
- opaque re-import side effects;
- complex folder systems as the primary organization model;
- autoplaying catalog video;
- unsafe visual-similarity duplicate detection.

## 14. Open questions

- Is Personal the default destination for every raw import, or should the current Theme be preselected when a Theme draft is open?
- Which license values are mandatory for private use, sharing and package publication?
- Are explicit thumbnails and previews independent VisualAssets or derived catalog resources?
- Which SVG structures are trustworthy enough to expose as Layer Previews?
- Does a later re-import always create a new version, or does it first offer an explicit versioning decision?
- What provenance requirements apply to Generated assets?
- When should arbitrary ZIP archives become supported, if ever?

## 15. Risks

- Excessive metadata demands can interrupt creative flow; progressive completion is essential.
- Insufficient metadata creates an unusable catalog; required fields must remain clear.
- Large media can be technically valid but unsuitable for target devices; budget findings need friendly language.
- Video codec differences require poster and reduced-motion fallbacks.
- Licensing and generated-content provenance need explicit product policy before sharing workflows.
- A future visual-duplicate feature could create mistrust through false matches and must not be introduced without a high-confidence product case.
- Legacy FunctionContainer terminology in older contracts must not leak into import experience or imply functional import.

## 16. First implementation slice

The smallest valuable implementation slice is:

1. Import one or more static PNG, WebP or SVG files into the Theme Builder Asset Library.
2. Validate every file independently.
3. Create a draft VisualAsset for every accepted file.
4. Show ready, needs-information and rejected states in one batch review.
5. Collect the minimum required catalog metadata.
6. Create an AssetCatalogEntry only for complete items.
7. Provide a static thumbnail and detail preview.

This slice must not create placement, Interaction Zones, Function Bindings, Runtime functions, packs or video behaviour.
