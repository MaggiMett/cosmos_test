# Base Builder Prototype

**Status:** isolated Development Preview

**Route:** `/dev/base-builder`

**Data authority:** canonical local fixtures only

**Runtime impact:** none

## 1. Purpose and scope

This phase implements a visible, removable prototype for evaluating the future
Base Builder experience. It deliberately exercises the Room Composition,
Placement Profile, Snap Candidate, Snap Trace, Function Container and
per-property override contracts without connecting them to the current Base
Runtime.

The prototype is not:

- a migration of `BaseView.vue`;
- a production Builder;
- a persistence editor;
- a Theme Builder;
- a final visual design;
- a renderer for final Cosmos art;
- a navigation or Workspace launcher.

All changes made in the preview are discarded when its route is left or
reloaded.

## 2. Isolation architecture

The Development route is declared separately:

```text
/dev/base-builder
  -> lazy BaseBuilderView
  -> local BaseBuilderSession
  -> canonical Builder fixtures
```

`App.vue` checks the explicit `developmentPreview` route metadata. Only this
route renders its own `RouterView` directly. Every normal route still renders
through `ApplicationShell`.

This boundary matters because `ApplicationShell` starts the current Cosmos
Runtime. The preview therefore does not mount:

- `ApplicationShell`;
- `BaseView.vue`;
- `EnvironmentView`;
- `useCosmosRuntime`;
- Base, Workspace, Navigation or Transition Runtime services.

The preview imports no API client, storage API or Runtime plugin. Route tests
verify that its component differs from the Base route and does not reference
`BaseView`.

## 3. Implemented files

| File | Responsibility |
|---|---|
| `frontend/src/dev/base-builder/baseBuilderFixtures.ts` | Canonical neutral Builder catalog, Room Preset and Room Composition fixtures |
| `frontend/src/dev/base-builder/baseBuilderSession.ts` | Local document state, Placement discovery, Snapping, overrides, functions and transactional History |
| `frontend/src/dev/base-builder/BaseBuilderView.vue` | Isolated catalog/canvas/properties preview UI |
| `frontend/src/dev/base-builder/baseBuilderSession.test.ts` | Placement, Snap, History, Function and override tests |
| `frontend/src/dev/base-builder/BaseBuilderView.test.ts` | Component structure and isolation-boundary tests |
| `frontend/src/router/routes.ts` | Lazy `/dev/base-builder` route |
| `frontend/src/router/types.d.ts` | Explicit `developmentPreview` metadata |
| `frontend/src/router/routes.test.ts` | Development/Base route separation |
| `frontend/src/App.vue` | ApplicationShell bypass for explicitly marked Development Preview routes |

`BaseView.vue` is unchanged.

## 4. Builder layout

The prototype uses a familiar but intentionally reduced three-panel layout:

- left: searchable, categorized Object catalog;
- center: Room Shell, placed objects, selection, placement preview and Snap
  guides;
- right: selected Object properties, overrides, Skin and Function Container;
- top: local History, Preset/empty/standard loads, Theme simulation, optional
  grid and Test Mode.

The neutral UI uses simple SVG rectangles, outlines and labels. It has no final
Cosmos art direction and creates no image assets.

On narrower supported desktop sizes the side panels become slightly smaller.
The prototype intentionally retains the project's current desktop minimum
viewport instead of adding an unrequested mobile Builder workflow.

## 5. Builder state

`BaseBuilderSession` owns one in-memory document:

- `RoomComposition`;
- selected Object Instance ID;
- simulated active Theme;
- local undo and redo stacks.

View-only flags remain outside the document:

- optional grid;
- Test Mode;
- Interaction Bounds visibility;
- current feedback message.

The public `snapshot()` method returns a defensive deep clone and recursively
frozen value. The View refreshes from snapshots after commands; it never edits
the Session's internal document directly.

The Session has no save, load-from-storage or Runtime apply method.

## 6. Canonical Room and catalog

The Builder derives its Room from `emptyRoomShellFixture`. The neutral standard
Preset contains:

- two Doors;
- two Workspace furniture instances;
- one Companion visual;
- two ceiling lights;
- one neutral floor decoration.

The temporary Base Exit compatibility object is intentionally excluded because
its final owner is the Application Shell rather than user Room composition.

The Builder catalog contains:

- Door;
- Workspace Furniture;
- Table;
- Shelf;
- Plant;
- Floor Lamp;
- Wall Light;
- Ceiling Light;
- Picture;
- Decoration;
- Companion Visual.

Catalog entries contain declarative `CatalogObject` definitions, Placement
Profiles, Bounds, slots and optional default Function Container references.
They contain no image bytes, final graphics or executable callbacks.

## 7. Placement

Placement uses the existing production `validatePlacement()` function. The
Builder adds a prototype candidate-discovery layer that converts pointer
positions into proposals for the Shell's semantic surfaces.

Rules exercised by the visible prototype:

| Object | Placement behavior |
|---|---|
| Door | wall-only, bottom contact, upright, Surface-normal orientation |
| Table | floor-only, Floor Lock, Wall Stop |
| Shelf | floor-only, publishes a top attachment Anchor |
| Plant | floor or compatible Shelf Anchor |
| Floor Lamp | floor-only |
| Wall Light | wall-only and Surface-normal orientation |
| Ceiling Light | ceiling-only and Surface-normal orientation |
| Picture | wall-only |
| Decoration | floor or compatible Shelf Anchor |

The prototype never silently commits an invalid proposal. During dragging it
shows a red preview and a user-facing reason. Pointer release creates a
transaction only when a valid candidate exists.

Current user-facing messages include:

- “An Boden platziert.”
- “An linker Wand ausgerichtet.”
- “An rechter Wand ausgerichtet.”
- “An Rückwand ausgerichtet.”
- “An Decke platziert.”
- “Auf Regal befestigt.”
- “Benötigt eine Wand.”
- “Benötigt die Decke.”
- “Zu wenig Platz.”

Technical validation codes remain available in the preview model and tests but
are not shown as normal UI copy.

## 8. Snapping

The interactive prototype builds existing `SnapCandidate` records and delegates
ranking and trace creation to `evaluateSnapCandidates()`.

Candidate sources:

- wall, floor and ceiling Placement Surfaces;
- compatible Object attachment Anchors;
- optional 40-unit grid, disabled by default.

Each candidate includes:

- exact target identity;
- proposed Surface Binding;
- contact and alignment quality;
- Object profile priority;
- distance;
- clearance;
- hard validator rules;
- stable candidate and target IDs.

The existing deterministic ranker remains the authority. Candidate discovery
adds a semantic distance threshold so an Object cannot jump to a valid but
distant Surface.

### 8.1 Hysteresis

The previous target receives the Placement Profile's hysteresis distance as a
temporary distance reduction before deterministic ranking. A slightly closer
neighbor therefore does not steal the active target until it is meaningfully
better. This prevents left-wall/rear-wall flicker near a boundary while keeping
the existing Snap Candidate and Snap Trace data contracts.

### 8.2 Wall Stop and locks

- Floor objects resolve their bottom contact against the floor boundary.
- Their horizontal position is clamped inside the logical floor/wall span.
- Ceiling objects resolve directly below the ceiling Surface.
- Doors resolve with bottom contact at the floor/wall boundary.
- Wall and ceiling objects use `orientationMode: "surface-normal"`.

These are candidate proposals, not hidden validator repairs. The preview shows
the resulting proposal before it can be committed.

## 9. Selection and transformation

The Room Canvas supports:

- click selection;
- direct drag movement;
- visible selection outline;
- resize handle;
- rotation handle with 15-degree prototype steps;
- numeric position, rotation and uniform scale fields;
- Delete/Backspace;
- duplicate;
- depth forward/back;
- per-property reset.

There is no multi-selection and no professional 3D gizmo. Dragging maintains a
temporary preview only; one pointer release becomes one History transaction.
This avoids an undo step for every pointer-move event.

Rotation-aware polygon collision is still outside this prototype. The existing
axis-aligned Layout Bounds validator remains authoritative.

## 10. Function Containers

Door, Workspace and Companion fixtures demonstrate the visual/function
boundary.

The Properties panel shows:

- Function type;
- stable action role;
- Runtime-context source;
- optional Interaction Bounds;
- local remove/reconnect controls for prototype testing.

A Skin change modifies only `skinRef` and its override channel. The attached
Function Container instance, definition reference and descriptor/action roles
remain unchanged.

Function Container edits are local History transactions. They never register a
real Core Runtime callback.

## 11. Property overrides and Theme simulation

The panel displays the current override mode for:

- position;
- rotation;
- scale;
- Skin;
- depth.

Direct user changes set the corresponding channel to `pinned`. Unchanged
channels retain `inherit`.

Reset behavior:

- a Preset-owned Object receives the Preset value and
  `reset-to-parent`;
- a user-created Object without a Preset parent returns to `inherit`.

The simulated Theme toggle alternates neutral warm and cool Skin references:

- inherited/reset Skin values follow the simulated Theme;
- pinned Skins remain unchanged;
- pinned transforms remain unchanged;
- inherited Preset transforms are restored from the stable `presetItemId`
  parent.

No real Theme Registry or Theme Runtime state is read or modified.

## 12. Undo and redo

History is local and transaction-based. Each entry stores immutable before and
after Builder documents plus a readable action label.

Covered transactions:

- place;
- move;
- scale;
- rotate;
- delete;
- duplicate;
- Skin change;
- Function Container remove/assignment;
- property reset;
- Theme simulation;
- load empty;
- load standard;
- reset to Preset;
- depth forward/back.

A new edit clears the redo stack. UI-only Test Mode and Bounds visibility do not
pollute document History.

History remains local and is not collaborative or cross-route. Persistence is now handled outside History by the dedicated Builder lifecycle: a saved revision establishes the persistence baseline, dirty local edits remain recoverable, and loading a saved revision requires explicit confirmation before discarding dirty work.

## 13. Test Mode

Test Mode expands the Room Canvas and hides Builder controls and guides.
Interaction Bounds become directly clickable for functional Objects.

Clicks resolve the declarative Function Binding to a message such as:

- “Würde Knowledge Workspace öffnen.”
- “Würde in den verbundenen Raum wechseln.”
- “Würde Companion öffnen.”

No Router call, Workspace opening, navigation action or Runtime command is
executed.

## 14. Test coverage

The prototype adds tests for:

- Development/Base route separation;
- App-level Runtime Shell isolation;
- standard Preset and empty Room loading;
- Catalog placement;
- Door rejection on the floor;
- Wall Light rejection on the floor;
- Ceiling Light rejection on a wall;
- Table Floor Lock and Wall Stop;
- Plant/Shelf Anchor attachment;
- target hysteresis;
- Function Binding stability across Skin changes;
- pinned and reset override modes;
- Theme changes respecting pinned/inherited values;
- local undo/redo across all core edit classes;
- Preset reset;
- Test Mode document immutability;
- required UI regions and manipulation controls;
- absence of BaseView, Runtime, storage and network dependencies.

Existing Room Composition, Registry, Shadow Mode and frontend tests remain the
regression boundary.

## 15. Design Intelligence

This review follows
`docs/Product_Bible_V2/00_Foundation/06_Design_Intelligence.md`: proven
interaction principles are adapted without copying product visuals, branding
or complete workflows.

### 15.1 Adopted principles

| Reference | Principle | Cosmos adaptation |
|---|---|---|
| The Sims Build Mode | Direct object movement, rotation, resizing, undo/redo and an optional grid are first-class building controls. [Official EA Build Mode guide](https://www.ea.com/en/games/the-sims/the-sims-4/new-player-hub/build-mode), [official controls](https://www.ea.com/games/the-sims/tips-and-tricks?isLocalized=true) | One-click/drag catalog placement, direct Canvas manipulation, local History and grid disabled by default. |
| Animal Crossing: Happy Home Paradise | Interior design starts from approachable furniture and client-room composition, with more techniques becoming available through use. [Nintendo overview](https://www.nintendo.com/us/whatsnew/animal-crossing-new-horizons-expands-into-new-waters-with-a-free-update-and-paid-expansion-on-nov-5/) | A small categorized catalog is immediately usable; Function/override detail appears only after selection. |
| House Flipper 2 | A separate Sandbox context supports experimentation without affecting the normal progression workflow. [Publisher storefront](https://store.steampowered.com/app/1190970/House_Flipper_2/), [Xbox product description](https://www.xbox.com/en-US/games/store/house-flipper-2/9N67Z2D5PHW2) | `/dev/base-builder` is an explicitly temporary, isolated, non-persistent preview context. |
| Figma | Component properties communicate intended customization points in one selected-instance panel. [Figma component properties](https://help.figma.com/hc/en-us/articles/5579474826519-Explore-component-properties) | The right panel exposes only selected Object transforms, Skin, function and override state. |
| Blender | Object transforms are available both through direct manipulation and precise numeric fields. [Blender Transform manual](https://docs.blender.org/manual/en/3.1/scene_layout/object/properties/transforms.html) | Simple handles cover common manipulation; the Properties panel provides precise values and resets. |
| Unreal Editor | A viewport, placeable Actors and selection-specific Details panel form a coherent editing loop; Surface Snapping may align rotation to the Surface normal. [Unreal Level Editor](https://dev.epicgames.com/documentation/en-us/unreal-engine/level-editor-in-unreal-engine), [Actor Snapping](https://dev.epicgames.com/documentation/unreal-engine/actor-snapping-in-unreal-engine?lang=en-US) | Catalog → Room Canvas → Properties follows the same information relationship, while semantic Surface Snaps and normal alignment remain domain-specific and automatic. |

Cross-reference principles adopted:

- direct manipulation with immediate visual feedback;
- logical Surface and Anchor placement before optional grid precision;
- readable catalog categories and search;
- selection-specific progressive disclosure;
- numeric precision as a complement to dragging;
- explicit History and reset affordances;
- a separate preview/test context.

### 15.2 Intentionally rejected

- The Sims economy, inventory, cheat-mode dependency and grid-first default;
- Animal Crossing progression locks and client-task framing;
- House Flipper first-person tool simulation and construction economy;
- Figma layer-tree depth, detach/apply-to-main workflows and design-system
  publishing;
- Blender's multi-mode professional gizmos, shortcuts and mesh editing;
- Unreal's Outliner, dockable professional-editor chrome, engine Actor
  components, Blueprint behavior and multiple specialized modes;
- any visual styling, icons, terminology or branding from those products.

### 15.3 Why the result fits Cosmos

The prototype keeps the initial loop small:

```text
find Object
  -> drag or add
  -> see valid target and reason
  -> select and refine
  -> optionally inspect function/override detail
```

Cosmos-specific separation remains visible throughout: a Workspace can change
Skin or position without losing its Knowledge Workspace binding. Logical
placement is strict enough to preserve Room meaning but avoids exposing
geometry jargon to normal users.

## 16. Known UX issues and prototype limits

- At the supported minimum desktop width, the three panels are dense. A
  production Builder should test collapsible panels and a larger Canvas focus
  mode.
- Catalog insertion by button uses a predefined semantic point. Drag/drop gives
  better intent feedback and should remain the primary learned interaction.
- The placeholder labels become crowded on small Catalog Objects.
- Rotation is represented in the 2D technical projection. Wall/ceiling normal
  alignment is semantically correct but not visually expressive without final
  perspective rendering.
- Collision uses axis-aligned Layout Bounds and can feel conservative around
  irregular shapes.
- Only a Shelf top Anchor is represented. Production furniture needs curated,
  visible Anchor affordances and conflict messaging.
- The current transform handles prioritize simplicity over touch target
  optimization.
- Keyboard support covers selection deletion, but full keyboard placement,
  focus order and screen-reader operation need a dedicated accessibility phase.
- Test Mode proves binding separation but not real navigation, focus transfer,
  permissions or rollback.
- No multi-selection, copy/paste, alignment distribution, zoom/pan or camera
  controls are included.
- No browser-based visual QA was recorded in this implementation environment
  because a reliably detached local Dev Server was unavailable. Component
  structure, TypeScript, build output and domain behavior remain covered by
  automated verification.

## 17. Phase-D contract freeze

The prototype has since crossed the persistence and Runtime boundary under an
explicit lifecycle contract:

```text
edit
  -> save revision
  -> activation candidate
  -> explicit activation of that exact revision
  -> Base Runtime snapshot exposes activeBuilder
  -> Room Composition presenter consumes only activeBuilder
```

The boundaries are intentional:

- saving never activates;
- dirty local edits cannot be activated;
- stale saves and stale activation requests fail with conflicts;
- the saved Builder document and `active_builder_document` remain separate Base
  properties;
- Runtime never reads the saved draft directly;
- without an activated Builder Room, the existing Base Runtime projection is a
  compatibility fallback;
- the activated Room Composition overrides geometry while the established
  Runtime projection continues to supply registry and binding context;
- Builder persistence remains behind `BaseBuilderLifecycle`; the View does not
  perform direct HTTP or browser-storage persistence.

The lifecycle is covered end-to-end by service tests and the Runtime presenter
has explicit coverage for activated-Builder precedence and inactive-draft
isolation.

## 18. Next phase boundary

Phase D is frozen at the architecture boundary above. Further changes to the
visual Theme experience should treat this lifecycle as infrastructure rather
than reopening save/activation semantics. Remaining usability work such as
keyboard/touch refinement, zoom/pan and broader accessibility can proceed as
separate product slices when evidence requires it.

The next planned phase may therefore begin the graphical Theme work, while the
legacy Base Runtime projection remains a deliberate compatibility fallback
until migration evidence supports removing it.
