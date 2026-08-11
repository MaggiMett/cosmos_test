# Asset Library Experience

Version: 1.0

Status: Binding product decision

Category: Theme Engine Foundation, Phase 1D

Implementation status: Product and user-experience definition only

Depends on:

- `17_visual_interaction_function_model.md`
- `18_asset_catalog_foundation.md`
- `19_asset_import_experience.md`
- `20_asset_import_technical_slice.md`
- `21_catalog_completion_experience.md`
- `22_catalog_completion_technical_slice.md`

## 1. Product decision

Cosmos has one Asset Library.

The same library is used:

- as a standalone creative catalog;
- inside the Theme Builder;
- later as a constrained asset picker for a specific task.

Cosmos does not create separate libraries for Core, Personal, Theme, Draft or
picker contexts. Those are views, filters and modes over one coherent library.

The Asset Library feels like a visual creative catalog. Its primary unit of
recognition is the preview, not the filename, technical ID, storage path or
database record.

The Library has two responsibilities:

1. **Discover and reuse cataloged assets.**
2. **Finish work that is not yet cataloged.**

It never creates placement, interaction or function behavior. Selecting an
asset returns an explicit visual or catalog reference to the calling context.
The calling workflow remains responsible for any later Visual Object
Definition, Surface assignment or Theme change.

## 2. Non-negotiable boundaries

The Asset Library may display and manage:

- `DraftVisualAsset`;
- `CatalogDraft`;
- `AssetCatalogEntry`;
- the exact `VisualAsset` referenced by a Catalog Entry;
- automatic catalog preview descriptors;
- explicit preview references when they exist;
- import results while their review session is active.

It must not infer or create:

- a Visual Object Definition;
- a Visual Object Instance;
- placement or transforms;
- an Interaction Zone or Profile;
- a Function Binding or Definition Pack;
- a Runtime target, action or behavior;
- Theme activation;
- invented image layers;
- perceptual or visual-similarity duplicates.

Import, catalog promotion, use, publishing, activation and placement remain
separate decisions.

## 3. Conceptual presentation model

The Library presents three kinds of item without pretending they are the same
domain record.

| Presented item | Meaning | Can be selected for use? |
| --- | --- | --- |
| Technical Draft | A validated `DraftVisualAsset` not yet prepared for catalog completion | No |
| Catalog Draft | A `CatalogDraft` with partial or complete metadata | No |
| Cataloged Asset | One current `AssetCatalogEntry` and its exact referenced `VisualAsset` | Yes, when compatible and not deprecated |

A rejected import is not an asset because it creates no `DraftVisualAsset`.
Rejected files appear only in the active Import Review and, while that session
is available, in Needs Attention. They never appear as normal catalog cards.

One Visual Asset may have:

- multiple Catalog Entries for different discovery contexts;
- multiple Visual Asset versions;
- multiple revisions of one Catalog Entry.

The Library preserves these distinctions rather than flattening them into one
ambiguous object.

## 4. Information architecture

### 4.1 Library shell

The full Library has six regions:

1. **Context header** — title, current mode, optional Theme context and one
   global Import action.
2. **View navigation** — small set of system views.
3. **Discovery toolbar** — search, active filter chips, filter control, sort and
   view density.
4. **Visual result area** — responsive asset-card grid.
5. **Detail area** — contextual inspector or full detail view.
6. **Context action area** — appears only in picker mode or when a draft has a
   clear next action.

The result grid remains the visual center. Navigation and metadata controls must
not reduce it to a narrow file list.

### 4.2 Navigation groups

Version 1 uses two navigation groups.

**Library**

- All Assets
- My Assets
- Current Theme

**Work**

- Drafts
- Needs Attention

Core Assets is a Scope filter and optional shortcut, not a permanent top-level
view. Recent, Favorites and Collections are deferred as described below.

### 4.3 Context modes

The same shell supports two modes.

#### Browse and Manage

- Opens details.
- Allows metadata completion where permitted.
- Exposes explicit promotion for ready Catalog Drafts.
- Allows import.
- Does not perform a downstream use action.

#### Picker

- Is opened by another workflow with a visible purpose.
- Shows one contextual primary action such as `Choose for skin`,
  `Assign visual` or `Add to Theme`.
- Applies caller-provided compatibility constraints.
- Returns a reference; it does not execute downstream placement or behavior.
- Shows only cataloged, active assets as selectable by default.

The mode is always named in the header. A picker must never look like an
unconstrained management view.

## 5. Version 1 main views

### 5.1 All Assets

All Assets shows current, cataloged entries across Core, Personal and Theme
scope.

Defaults:

- Drafts are excluded.
- Deprecated Catalog Entries are excluded.
- Only the current Catalog revision is shown.
- Core, Personal and Theme assets share one grid.

This preserves the contract that a draft is not catalog-discoverable.

### 5.2 My Assets

My Assets means Catalog Entries with `scope: personal`.

It does not mean every asset edited by the current user and does not include
Theme assets merely because the user created them. The Scope model remains the
source of truth.

### 5.3 Current Theme

Current Theme shows Catalog Entries whose Theme metadata matches the explicit
Theme context.

When the Library has no Theme context:

- the view asks the user to choose a Theme;
- it does not guess from recent activity;
- it never activates a Theme.

Inside the Theme Builder, the current Theme is preselected and visible in the
header.

### 5.4 Drafts

Drafts shows:

- technical Draft Visual Assets;
- Catalog Drafts needing metadata;
- Catalog Drafts ready for explicit promotion;
- drafts with warnings or preview concerns.

Drafts use the same visual grid grammar as cataloged items, but their status and
next action are explicit. Drafts are never selectable in picker mode.

### 5.5 Needs Attention

Needs Attention is an action-oriented system view. It contains:

- missing or invalid catalog metadata;
- unresolved technical warnings;
- unavailable required preview or fallback;
- active-session rejected imports;
- failed promotion attempts that need user correction.

`Ready for Catalog` is not Needs Attention unless another warning exists. It is
shown in Drafts with a clear promotion action.

The navigation label may show a numeric count. The count has an accessible text
equivalent and is never communicated only by color.

### 5.6 Views deferred from Version 1

| Candidate | Version 1 decision | Reason |
| --- | --- | --- |
| Core Assets | Scope filter and optional shortcut | A dedicated primary view duplicates filtering |
| Recently Used | Deferred | No approved usage-history or persistence model exists |
| Favorites | Deferred | Requires user-specific persistence |
| Personal Collections | Deferred | Requires collection ownership and persistence decisions |
| Theme Collections | Deferred | Theme scope and Theme filters already cover the first need |
| Saved custom views | Deferred | System views and visible filter chips are sufficient initially |
| Recently Imported | Session-local shortcut only | Persistent import timestamps are not yet part of the model |

## 6. Drafts and cataloged assets together

Drafts and cataloged entries share:

- card dimensions;
- preview treatment;
- keyboard navigation;
- selection and focus behavior;
- detail opening behavior.

They differ in:

- lifecycle/status treatment;
- available actions;
- catalog metadata completeness;
- use eligibility.

Drafts are not mixed into All Assets by default. Global navigation and the
Needs Attention count keep them visible without making incomplete work look
usable.

Search is scoped to the active view. When a query in a catalog view has matching
drafts, the empty or low-result state may offer a textual link such as
`3 matching drafts`, but it must not silently insert drafts into catalog
results.

## 7. Asset card model

### 7.1 Card hierarchy

Every card contains at most four persistent visual layers:

1. Preview area.
2. Display name or draft filename fallback.
3. One short classification/context line.
4. One status or attention treatment when needed.

The card must remain recognizable at a glance. Technical and legal metadata are
not compressed into the card.

### 7.2 Default visible content

| Information | Default card treatment |
| --- | --- |
| Thumbnail | Dominant preview area |
| Name | Always visible; two lines maximum |
| Category | Visible as the primary secondary label |
| Scope | Small text/icon label: Core, Personal or Theme |
| Theme | Shown only for Theme scope, truncated after one line |
| Status | One highest-priority text badge when not ordinary Cataloged |
| Warning | Warning icon plus accessible text; opens issue summary |
| Origin | Detail/quick-info only; not a permanent badge |
| Version | Detail/quick-info only |
| Creator | Detail/quick-info only |

Origin, version and creator remain searchable and filterable even though they
are not permanently rendered on every card.

### 7.3 Preview area

- Uses the automatic thumbnail descriptor when available.
- Uses an explicit thumbnail Visual Asset when one is explicitly referenced.
- Gives explicit preview assets precedence over the automatic derivative.
- Shows a safe source-preview fallback when no derived thumbnail is available.
- Shows a format placeholder and a reason when no safe preview is possible.
- Never invents layers, semantics or function icons.

Transparent visuals use a subtle checkerboard by default. Opaque visuals use a
neutral surface. The preview must retain enough contrast against both.

### 7.4 Status treatment

Only one primary status badge appears on a card. Additional warnings are
summarized as `+N issues` or in the accessible issue label.

Cataloged is the ordinary state and normally has no badge. Its status remains
available to assistive technology and filters.

### 7.5 Quick actions

A card exposes one context-dependent primary action and one overflow menu.

Browse and Manage:

- primary: Open details;
- ready draft: Add to Catalog;
- incomplete draft: Complete details;
- rejected session item: Review problem.

Picker:

- primary: the caller-provided selection action;
- incompatible item: View reason;
- draft: Complete first, when editing is allowed.

Overflow actions may include version/history navigation, deprecation details or
opening related catalog contexts. No destructive or versioning action is
executed immediately from the card.

Actions must also be reachable by keyboard and touch; hover is enhancement only.

## 8. Detail experience

### 8.1 Layout

On a wide desktop, selecting a card opens a persistent right-side detail
inspector while preserving the grid and current search context.

The inspector can expand into a full detail view for:

- 100% visual inspection;
- metadata editing;
- version history;
- comparison of Catalog Entries sharing one Visual Asset.

In a narrow embedded panel, detail replaces the grid and provides a clear Back
action that restores scroll position, search and filters.

### 8.2 Immediately visible

The top of detail shows:

- large preview;
- name;
- primary status and short reason;
- category;
- Scope and Theme context;
- one context-dependent primary action;
- the next required action for a draft.

The user should not need to expand a technical section to understand whether an
asset is usable.

### 8.3 Progressive sections

Sections appear in this order:

1. **About** — description, category, tags, perspective, orientation and scale
   class.
2. **Scope and origin** — Personal/Core/Theme, Theme association and imported,
   built-in or generated origin.
3. **Creator and rights** — creator, provenance, license and attribution.
4. **Compatibility** — Templates, Surface Types and Visual Object Types.
5. **Catalog contexts** — other Catalog Entries referencing the same exact
   Visual Asset.
6. **Versions** — Catalog revisions and Visual Asset versions, clearly
   separated.
7. **Preview resources** — automatic derivative descriptors, explicit preview
   references and Layer Preview availability.
8. **Technical facts** — format, MIME type, dimensions, byte size, alpha and
   digest.

About is open initially. Technical facts, compatibility, versions and preview
resources are progressively disclosed.

### 8.4 Preview controls

The detail preview provides:

- Fit;
- 100%;
- zoom in/out;
- checkerboard background;
- light neutral background;
- dark neutral background.

The current background is named for screen readers. Background changes affect
inspection only and never alter the asset.

For SVG:

- preview uses the approved safe source;
- zoom remains crisp where supported;
- unsafe SVG never reaches this view as a usable asset.

Fallback behavior:

- explicit preview reference, if available;
- automatic detail-preview descriptor;
- safe source preview;
- neutral format placeholder with explanation.

### 8.5 Layer Preview

Layer Preview is shown only when real layer information or explicit layer assets
exist.

For flattened PNG and WebP, detail states:

`No Layer Preview — this source contains no declared layers.`

It does not show an empty layer stack and does not infer layers from visual
content.

Animated preview remains a future capability. It must use explicit Play,
respect reduced motion and never autoplay in the grid.

## 9. Metadata editing

### 9.1 Editing model

Metadata is edited inside the detail experience through an explicit Edit mode.

Cosmos does not use:

- permanent editable cards;
- spreadsheet-like tables;
- one giant technical form;
- automatic promotion after the last field is filled.

Entering Edit mode keeps the preview visible and groups fields into four short
sections:

1. **Identity** — display name, description, category and tags.
2. **Library context** — Scope, Theme, perspective, orientation and scale.
3. **Creator and rights** — creator, provenance and license.
4. **Compatibility** — advanced and collapsed initially.

### 9.2 Field behavior

- Objective technical facts are read-only.
- Normal file import locks Origin to Imported.
- User import offers only Personal or Theme Scope.
- Choosing Theme Scope asks for Theme association in the experience, even
  though the current technical contract keeps Theme optional.
- Suggested names or tags are visibly suggestions until confirmed.
- Compatibility supports explicit empty values and explains that compatibility
  does not grant placement or behavior.

### 9.3 Validation and completion

The editor shows:

- missing required fields near the affected section;
- a compact completion summary;
- specific invalid-value messages;
- a persistent Draft state until the user applies changes.

Applying metadata updates the Catalog Draft and recomputes status.

When status becomes Ready for Catalog:

- the item remains a draft;
- a separate `Add to Catalog` action becomes available;
- the action shows a concise summary of name, Scope, Theme, Visual Asset
  reference and version;
- promotion occurs only after explicit confirmation.

Cataloged metadata is immutable by version. Editing an existing cataloged entry
starts a new Catalog revision; it never overwrites the existing version.

### 9.4 Batch editing

Batch editing is not part of Version 1.

A later batch experience may apply common values to selected drafts while
retaining per-item review. It must never silently replace conflicting values or
promote multiple items without an explicit review step.

## 10. Status system

The Library status is an experience projection over import results, draft
completion, preview availability and Catalog Entry metadata. It does not add
behavior to the underlying asset.

### 10.1 Status priority

When multiple conditions exist, the card shows the highest applicable priority:

1. Rejected
2. Deprecated
3. Needs Metadata
4. Needs Preview
5. Warning
6. Ready for Catalog
7. Cataloged

All conditions remain available in detail and through filters.

### 10.2 Status presentation

| Status | Meaning | Visual semantics | Primary response |
| --- | --- | --- | --- |
| Needs Metadata | Required catalog metadata is missing or invalid | Amber attention icon + text | Complete details |
| Needs Preview | No safe usable preview/fallback is currently available | Amber image-warning icon + text | Review preview |
| Ready for Catalog | Metadata is complete; promotion has not occurred | Blue check-outline icon + text | Add to Catalog |
| Cataloged | Registered and discoverable | Green/neutral library-check; badge normally hidden | Use or view |
| Warning | Usable draft has a non-blocking technical concern | Amber warning triangle + text | Review warning |
| Rejected | Import produced no draft | Red stop icon + text | Replace or dismiss |
| Deprecated | Catalog revision should not be newly selected | Gray archive/obsolete icon + text | View replacement |

No status is communicated by color alone. Every status has:

- text;
- an icon with a non-color shape;
- an accessible name;
- a filter value;
- a clear action or explanation.

### 10.3 Needs Preview clarification

`Needs Preview` is a Library health condition, not a third
`CatalogCompletionStatus`.

For the current static PNG, WebP and SVG slice, a deterministic automatic
preview descriptor normally prevents this condition. It appears only when no
safe automatic, explicit or source fallback can be presented.

If a future product decision makes preview availability a promotion blocker,
Contracts 21 and 22 must be revised before implementation.

## 11. Search, filters and sorting

### 11.1 Search

One search field appears in every Library mode.

Search covers:

- display name;
- description;
- category and subcategory;
- system and user tags;
- Theme;
- creator;
- exact Catalog or Visual Asset ID for expert lookup.

Search is scoped to the current system view. Picker compatibility constraints
are applied before textual ranking and remain visibly stated.

Keyboard:

- `/` or `Ctrl/Cmd+F` focuses Library search when focus is not in an editor;
- Escape clears a query when the search field is focused;
- result count is announced without moving focus.

### 11.2 Filter model

Common filters are quickly available:

- Category;
- Scope;
- Theme;
- Status;
- Format.

The expanded filter panel adds:

- Tags;
- Origin;
- Perspective;
- Scale Class;
- Creator;
- License completeness;
- Compatibility;
- current/older revisions;
- deprecated inclusion.

Filter rules:

- different facets combine with AND;
- multiple values inside one facet combine with OR;
- every active filter appears as a removable chip;
- `Clear all` is always visible when filters are active;
- picker-imposed constraints appear as locked chips rather than hidden rules.

License filtering in Version 1 means declared, missing or needing review. Cosmos
does not claim legal validity from a license string.

### 11.3 Sorting

Version 1 supports only sorting backed by current data:

- Relevance, when a search query exists;
- Name;
- Category;
- Status/attention priority.

Recently added, recently updated and recently used sorting remain unavailable
until timestamps and usage history receive an approved data and persistence
contract.

### 11.4 Empty results

An empty state:

- repeats the active query or meaningful filters;
- offers Clear filters;
- never widens the search silently;
- may offer Import in Browse and Manage mode;
- may link to matching Drafts without mixing them into catalog results;
- explains picker incompatibility when constraints removed all results.

### 11.5 Saved views

Version 1 provides only the system views defined in this contract. User-created
saved searches are deferred.

## 12. Organization without folders

Scope, Theme, category, tags and later Collections are independent facets.

Version 1 does not introduce:

- a source-folder tree;
- nested catalog folders;
- favorites;
- personal collections;
- Theme collections.

Future Collections:

- contain references, not copied assets;
- may include one asset in multiple collections;
- remain shallow by default;
- do not replace Scope, Theme or category;
- never change an asset's catalog identity or Theme association merely by
  membership.

Favorites are a personal one-click collection, not a status or Scope.

Recently Imported remains tied to the active import session until a persistence
model exists. Recently Used requires a separate usage-history decision.

## 13. Import entry points

All import entry points create the same Import Session and lead to the same
technical review.

### 13.1 Global Import

Browse and Manage mode has one global `Import assets` button.

Standalone Library:

- Personal Scope is preselected;
- the destination remains visible before completion;
- the user may choose a Theme instead.

Theme Builder:

- the current Theme is preselected;
- the Theme is shown in the import context;
- the user may switch to Personal;
- no Theme is activated.

### 13.2 Drag and Drop

Dropping supported files over the Library:

- shows a full-surface drop affordance;
- states the proposed destination;
- starts the same per-file validation and review.

Dropping onto a visible Theme target preselects that Theme. It does not skip
technical review or metadata completion.

Drop onto Collections is deferred with Collections.

### 13.3 Import from a picker

A picker may expose Import only when the caller permits creation and the user
has edit rights.

The imported file remains a draft and cannot be selected until it is explicitly
cataloged. The picker may keep the import review in context, but it must not
auto-promote or auto-select the result.

## 14. Contextual selection and use

### 14.1 One Library, explicit request

A calling workflow provides a visible selection request with:

- purpose;
- single or multiple selection;
- compatible media and catalog constraints;
- whether incompatible assets are hidden or inspectable;
- the primary action label;
- the reference type expected on completion.

Examples:

| Context | Primary action | Library result |
| --- | --- | --- |
| View only | Open details | No use mutation |
| Choose for Skin | Choose visual | Exact catalog/visual reference |
| Visual Object Definition | Use visual asset | Reference only; definition creation remains outside |
| Surface Slot | Assign visual | Reference only; placement remains outside |
| Add to Theme | Add catalog context | Explicit Theme-scoped catalog workflow |

### 14.2 Compatibility behavior

- Compatible current Catalog Entries are shown first.
- Incompatible entries may be shown through `Show incompatible`.
- Incompatibility is explained in text.
- Compatibility metadata is advisory discovery data; the downstream validator
  remains authoritative.
- Drafts, rejected imports and deprecated revisions are not selectable by
  default.

### 14.3 Adding an existing asset to a Theme

Adding a Personal or Core visual to a Theme does not:

- move or duplicate source bytes;
- change the original Catalog Entry;
- activate the Theme;
- create behavior.

It starts an explicit Theme-scoped catalog-context workflow that may create a
new `AssetCatalogEntry` referencing the same exact `VisualAsset`.

If an appropriate Theme Catalog Entry already exists, Cosmos offers reuse
instead of creating another context.

## 15. Duplicate experience

### 15.1 Card identity

One catalog card represents one current `AssetCatalogEntry`, not one hash.

Multiple Catalog Entries referencing the same Visual Asset remain separate
cards because their names, categories, Themes and compatibility may differ.
Version 1 does not automatically collapse them.

### 15.2 Exact duplicate message

An exact SHA-256 match is labeled:

`Same file`

The import review shows:

- the existing visual preview;
- existing Catalog Entries using it;
- Scope and Theme of those contexts;
- default action: Reuse existing Visual Asset;
- alternatives: Skip file or Create another catalog context.

The system does not label an exact duplicate as an error.

### 15.3 Required vocabulary

| Label | Meaning |
| --- | --- |
| Same file | Exact byte identity / validated SHA-256 match |
| Another catalog context | Different Catalog Entry referring to the same exact Visual Asset |
| New file version | New immutable Visual Asset version created through an explicit version action |
| New catalog revision | New immutable version of the same Catalog Entry identity |
| Different asset | Different byte digest and independent Visual Asset identity |

Cosmos never uses `duplicate` alone when a more precise label is available.

### 15.4 Related contexts in detail

The Catalog contexts section lists all Catalog Entries that refer to the exact
Visual Asset version. It shows:

- display name;
- category;
- Scope;
- Theme;
- Catalog revision;
- current/deprecated state.

This makes legitimate reuse visible without treating it as copied media.

## 16. Versioning experience

### 16.1 Two independent histories

Detail separates:

1. **File versions** — versions of the `VisualAsset`.
2. **Catalog revisions** — versions of the `AssetCatalogEntry`.

The labels `File version` and `Catalog revision` are used consistently.
The generic word `Version` is not shown without context.

### 16.2 Current revision

For one stable Catalog Entry ID, the current revision is the highest registered
semantic version.

If that revision is deprecated, Cosmos shows it as deprecated and points to its
declared replacement. It does not silently fall back to an older revision.

All Assets and picker mode show the current revision only by default. Older
revisions remain accessible in detail and through an explicit filter.

### 16.3 New Catalog revision

`Create catalog revision`:

- starts from the selected revision's metadata;
- requires an explicit new semantic version;
- shows the fields that changed;
- preserves the old revision;
- never promotes automatically.

### 16.4 New file version

`Create file version`:

- opens the normal technical import review for replacement media;
- requires an explicit Visual Asset version decision;
- does not overwrite bytes;
- does not silently update Catalog Entries;
- offers a separate Catalog revision that may reference the new file version.

### 16.5 Replace, deprecate and redirect

The ambiguous action `Replace asset` is not used as an immediate command.
Cosmos asks whether the user intends to:

- create a new file version;
- create a Catalog revision;
- choose another existing Visual Asset;
- deprecate the Catalog revision and declare a replacement.

Deprecation:

- is visible on cards and detail;
- removes the revision from default picker results;
- preserves existing references;
- requires an optional exact replacement reference when a successor exists.

A replacement link supports navigation. It does not rewrite existing references
or activate a Theme.

## 17. Responsive behavior

### 17.1 Wide desktop

- persistent view navigation;
- toolbar above the grid;
- adaptive multi-column cards;
- right detail inspector;
- optional expanded full detail.

The inspector is approximately one card-and-a-half to two cards wide and never
compresses the grid below a useful recognition size.

### 17.2 Narrow Builder side panel

- view navigation becomes a compact view switcher;
- filters open in a sheet/popover;
- cards use one or two columns;
- detail replaces the grid;
- the contextual primary action is sticky at the bottom;
- Back restores grid position and discovery state.

Card content reduces to preview, name, short category/context and primary
status. No required action is hover-only.

### 17.3 Fullscreen picker

- purpose and constraints remain visible in the header;
- grid and detail may use the wide split layout;
- selection appears in a sticky confirmation area;
- closing without confirmation returns no reference.

### 17.4 Touch

Touch-specific optimization is deferred, but Version 1 must avoid hover-only
controls and use touch-sized action targets so the layout can evolve without a
new information architecture.

## 18. Keyboard and accessibility

### 18.1 Keyboard

- Tab moves through toolbar, navigation and actionable controls.
- Arrow keys move card focus using a roving grid focus model.
- Enter opens detail.
- Space selects in picker or explicit multi-select mode.
- Escape closes detail, exits a filter surface or returns to the previous
  Library state.
- Focus returns to the originating card when detail closes.

### 18.2 Focus

- Every interactive element has a visible focus indicator.
- Opening detail moves focus to its heading.
- Background grid content is not announced as active while a modal surface is
  open.
- Virtualized grids must preserve logical focus and item position.

### 18.3 Screen readers

Each card exposes one concise accessible label containing:

- name;
- item kind: draft or cataloged;
- category;
- Scope/Theme;
- status;
- format;
- selection compatibility when in picker mode.

Status, warning, selection and deprecation are never color-only. Preview
background controls and zoom state are named.

## 19. Design Intelligence

### 19.1 Comparable systems

#### Blender Asset Browser

Useful principles:

- preview-first asset region;
- separate Asset Details region;
- metadata and tags supporting search;
- selected asset remains contextual to the browsing surface.

Not adopted:

- file-browser resemblance;
- nested catalog hierarchy as the dominant Cosmos organization;
- Blender data-block terminology.

Reference:
[Blender Asset Browser manual](https://docs.blender.org/manual/en/4.1/editors/asset_browser.html)

#### Unreal Content Browser

Useful principles:

- one searchable asset surface;
- text search combined with filters;
- collections as references rather than copies;
- visible problem states;
- context-specific browser instances.

Not adopted:

- package paths and folder trees as primary navigation;
- dense editor menus;
- asset-type and source-control complexity;
- automatic migration or reference rewriting.

References:

- [Unreal Content Browser](https://dev.epicgames.com/documentation/en-us/unreal-engine/content-browser-in-unreal-engine)
- [Unreal filters and collections](https://dev.epicgames.com/documentation/unreal-engine/filters-and-collections-in-unreal-engine?lang=en-US)

#### Figma Assets

Useful principles:

- one reusable-assets surface available in working context;
- search across local and enabled libraries;
- contextual insertion action;
- grid/list adaptation and progressive details.

Not adopted:

- component-instance semantics for raw visual media;
- automatic downstream update propagation;
- Figma library publishing model.

References:

- [Figma Assets view](https://help.figma.com/hc/en-us/articles/360039831974-View-layers-and-assets-in-the-Layers-Panel)
- [Figma library availability](https://help.figma.com/hc/en-us/articles/1500008731201-Enable-or-disable-a-library-in-a-design-file)

#### Adobe Creative Cloud Libraries

Useful principles:

- reusable creative elements across multiple application contexts;
- project/library organization separate from the source document;
- lightweight grouping around reuse.

Not adopted:

- cloud-sharing, collaboration and brand-management complexity;
- application-specific asset types;
- account and entitlement concepts.

Reference:
[Adobe Creative Cloud Libraries overview](https://helpx.adobe.com/creative-cloud/apps/create-and-manage-libraries/create-and-organize-libraries/libraries-overview.html)

#### The Sims Build Catalog

Useful principles:

- visual recognition before technical metadata;
- approachable category browsing;
- fast search and filtering;
- immediate contextual selection.

Not adopted:

- economy, inventory, gameplay categories and placement behavior;
- object functionality implied by catalog classification;
- game-specific visual identity.

Reference:
[The Sims 4 New Player Hub](https://www.ea.com/games/the-sims/the-sims-4/new-player-hub)

#### Wallpaper Engine

Useful principles:

- media becomes immediately inspectable after import;
- supported media can enter through one clear asset surface;
- previews are important for media selection.

Not adopted:

- immediate scene insertion after import;
- layer placement or transform controls;
- animation autoplay or scripting.

Reference:
[Wallpaper Engine Assets overview](https://docs.wallpaperengine.io/en/scene/assets/overview.html)

#### Apple Photos

Useful principles:

- visual grid as the calm default;
- filters layered onto the Library and collections;
- favorites and albums as secondary organization;
- detail inspection without turning the grid into a table.

Not adopted:

- automatic memories or semantic grouping;
- hidden content-management behavior;
- consumer-photo editing and sharing.

References:

- [Apple Photos User Guide](https://support.apple.com/guide/photos/welcome-pht30dc94100/mac)
- [Apple Photos filtering](https://support.apple.com/en-lamr/guide/photos/pht5f5daeb1b/mac)

### 19.2 Adopted Cosmos principles

- one Library, multiple explicit contexts;
- preview-first recognition;
- system views plus faceted filters;
- progressive detail disclosure;
- one primary contextual action;
- immutable versions and explicit promotion;
- collections as future references, not copied data;
- status text and actions that expose incomplete work;
- no folder hierarchy as the primary model.

### 19.3 Why Cosmos differs

Cosmos spans creative media intake and precise technical reuse while keeping
visuals, placement, interaction and functionality separate.

The Library therefore does less than a game editor Content Browser and more
than a passive photo grid:

- it exposes draft completion;
- it preserves exact Visual Asset and Catalog identities;
- it supports multiple catalog contexts for the same bytes;
- it never treats catalog presence as placement or behavior authority.

## 20. Required clarifications to existing documents

### 20.1 Draft discoverability

Document:
`19_asset_import_experience.md`

Location:
Sections 4.4 and 9.

Issue:
The document says incomplete Visual Assets are not catalog-discoverable and
names All Assets, My Assets and Current Theme Assets, but does not define whether
Drafts appear in those views.

Clarification:
All Assets, My Assets and Current Theme contain cataloged entries only. Drafts
use Drafts and Needs Attention. Search may link to matching drafts but does not
mix them silently into catalog results.

### 20.2 Preview resource versus rendered preview

Documents:

- `19_asset_import_experience.md`, Section 6;
- `22_catalog_completion_technical_slice.md`, Sections 5 and 10.

Issue:
The experience expects a visible thumbnail/detail preview while the technical
slice creates only deterministic descriptors and no rendered bytes.

Clarification:
The Library resolves preview presentation in this order: explicit preview
Visual Asset, automatic descriptor, safe source preview, explained placeholder.
Descriptor rendering and persistence remain a later implementation boundary.

### 20.3 Needs Preview status

Documents:

- `21_catalog_completion_experience.md`, Final Data Decisions;
- `22_catalog_completion_technical_slice.md`, Sections 3–5.

Issue:
Catalog Completion defines only `needs-metadata` and `ready-for-catalog`, while
the Asset Library requires a comprehensible Needs Preview state.

Clarification:
Needs Preview is a Library health condition, not a new Completion status. It
does not block current static-asset promotion unless a later binding contract
explicitly changes that rule.

### 20.4 Rejected item lifetime

Documents:

- `19_asset_import_experience.md`, Sections 4.2, 4.3 and 7;
- `20_asset_import_technical_slice.md`, Section 4.

Issue:
Rejected appears as a user-facing status, but a rejected file creates no Draft
Visual Asset.

Clarification:
Rejected files live only in Import Review and session-scoped Needs Attention.
They are not Library assets or persistent catalog cards.

### 20.5 Promotion handoff

Documents:

- `19_asset_import_experience.md`, Sections 4.4 and 4.5;
- `22_catalog_completion_technical_slice.md`, Sections 1, 6 and 10.

Issue:
The experience describes a Draft becoming cataloged, while the technical
promotion service requires an already registered matching canonical
`VisualAsset`; canonical identity and persistence are outside Phase 1C.

Clarification required before implementing the full promotion UI:
define the orchestration step that assigns/persists the canonical Visual Asset
identity before `CatalogPromotionService.promote()` is called. The Library must
present this as one explicit user action without hiding the technical boundary.

### 20.6 Theme association

Documents:

- `18_asset_catalog_foundation.md`, Section 2.2;
- `21_catalog_completion_experience.md`, Final Data Decisions;
- `22_catalog_completion_technical_slice.md`, Section 4.

Issue:
Theme is optional in the schema even when Scope is Theme.

Experience clarification:
The metadata editor asks for a Theme whenever Theme Scope is selected. A later
data-contract decision must determine whether this becomes a schema invariant.

### 20.7 Recency, favorites and collections

Document:
`19_asset_import_experience.md`, Section 9.

Issue:
The current contracts have no creation/update timestamps, use history,
favorite state or collection membership.

Clarification:
Persistent recent views, Favorites and Collections are deferred. No Version 1
UI may simulate them from unstable in-memory order.

### 20.8 Version actions

Document:
`19_asset_import_experience.md`, Section 14.

Issue:
Re-import and version decisions are explicitly open.

Experience clarification:
No overwrite is allowed. The Library distinguishes New file version from New
Catalog revision and requires an explicit version choice. Technical orchestration
and permissions remain open before implementation.

## 21. Open questions

These questions remain intentionally unresolved because they require data,
permission or workflow authority beyond Phase 1D:

1. Which component assigns and persists canonical Visual Asset identity between
   technical import and Catalog promotion?
2. Should Theme association become technically required whenever Scope is
   Theme?
3. Which license expressions are accepted for private use, Theme sharing and
   future package publishing?
4. What permissions control editing, deprecation and creation of Catalog
   revisions?
5. Which timestamps are canonical for recently imported, created and updated
   views?
6. What event qualifies as Recently Used, and where is that history stored?
7. Are Favorites private per user, local to a workspace or synchronized?
8. Who owns Personal and Theme Collections, and can Collections be shared?
9. How is a new semantic version proposed and validated in the user experience?
10. Should compatibility-incompatible assets be visible by default in every
    picker context or decided by the caller?
11. What preview-rendering component consumes automatic preview descriptors?
12. When video arrives, which missing poster/fallback conditions block Catalog
    promotion?

## 22. Risks

### 22.1 Entity ambiguity

Risk:
Users may confuse a Visual Asset, Catalog Entry and placed object.

Mitigation:
Use File version, Catalog revision and Catalog context labels. Never show
placement or function controls in the Library.

### 22.2 Status overload

Risk:
Cards become a field of colored badges.

Mitigation:
Show one highest-priority status, keep Cataloged visually quiet and disclose
additional issues in detail.

### 22.3 Draft invisibility

Risk:
Keeping drafts out of All Assets could make unfinished work feel lost.

Mitigation:
Persistent Drafts and Needs Attention navigation with counts; search may link to
matching drafts.

### 22.4 Metadata fatigue

Risk:
Creative flow is interrupted by a large form.

Mitigation:
Preview remains visible, fields are grouped, objective facts are read-only and
advanced compatibility is progressively disclosed.

### 22.5 Folder relapse

Risk:
Collections and Theme organization evolve into another file system.

Mitigation:
Scope, Theme, tags and categories remain primary facets. Future Collections
hold references and remain shallow.

### 22.6 Accidental downstream behavior

Risk:
Contextual actions such as Add to Theme or Assign visual are interpreted as
placement or function creation.

Mitigation:
Library actions return references or start explicit catalog-context workflows.
Downstream creation remains outside the Library and is named separately.

### 22.7 Hidden overwrite

Risk:
Metadata edits or re-import silently change existing use sites.

Mitigation:
Immutable revisions, explicit version choice, visible change summary and no
automatic reference rewriting.

### 22.8 Misleading legal status

Risk:
A non-empty license string looks legally approved.

Mitigation:
Filter and status labels say Declared, Missing or Needs review. Cosmos does not
claim legal validity without a later policy.

### 22.9 Preview mismatch

Risk:
An automatic preview looks different from actual use.

Mitigation:
Label preview resources, provide 100% source inspection and never infer layers
or rendering behavior.

### 22.10 Responsive density

Risk:
Embedding the full Library in a narrow Builder panel reproduces professional
editor complexity.

Mitigation:
Replace simultaneous panels with navigation, preserve one primary action and
keep advanced metadata in detail.

## 23. Smallest first Codex implementation slice

The first implementation should be one fixture-backed, in-memory Browse and
Manage vertical slice.

It contains:

1. A read-only Library projection over the existing canonical
   `AssetCatalogRegistry`, one `DraftVisualAsset` fixture and one `CatalogDraft`
   fixture.
2. Three initial views:
   - All Assets;
   - Drafts;
   - Needs Attention.
3. An accessible responsive card grid using the card hierarchy in this
   contract.
4. Text search over name, description, category and tags.
5. Visible Scope and Status filter chips with Clear all.
6. A right-side detail inspector on wide screens and replacement detail view on
   narrow screens.
7. Metadata Edit mode for one Catalog Draft using the existing immutable
   completion service.
8. Explicit Add to Catalog action against an in-memory registry only after the
   canonical Visual Asset fixture is registered.
9. Keyboard navigation, visible focus and text status labels.

It explicitly excludes:

- real persistence;
- real file-dialog or drag-and-drop wiring;
- batch editing;
- Favorites and Collections;
- recent-use history;
- version creation;
- explicit preview assets;
- picker integrations;
- Theme Builder integration;
- Visual Object, Interaction, Function, Renderer or Runtime work.

Acceptance criteria:

- cataloged entries never mix silently with drafts;
- incomplete drafts cannot be promoted;
- completing metadata does not promote automatically;
- promotion adds exactly one Catalog Entry;
- automatic preview descriptors are not presented as Visual Assets;
- every card status is understandable without color;
- the narrow layout preserves search, status and the primary action;
- no downstream visual-object or behavior model is created.
