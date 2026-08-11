# Room Composition Foundation

**Status:** Phase 9R implemented
**Contract family:** Cosmos Theme Engine 1.1
**Runtime impact:** none
**Compatibility source:** `base.main-room.v1`

## 1. Scope

Phase 9R adds the data-only foundation for decomposing the existing monolithic
Base Vertical Slice into architecture, reusable visual objects, spatial
instances and independent function contracts.

It does not:

- change or import `BaseView.vue`;
- activate a Room Composition at runtime;
- implement Base Builder or Theme Builder UI;
- implement drag-and-drop, gizmos or an interactive snap loop;
- create or replace visual assets;
- change the existing Base Template, Composition, resolver or exporter.

All additions are public and additive.

## 2. Implemented modules

| File | Responsibility |
|---|---|
| `frontend/src/theme-engine/roomCompositionTypes.ts` | Public Room Shell, Preset, Catalog, Function, Composition, Placement, Snap, Override and Merge contracts |
| `frontend/src/theme-engine/validation.ts` | Shared Ajv validation, active-content guard and Room Shell semantic reference checks |
| `frontend/src/theme-engine/placement.ts` | Pure surface, contact, normal, rotation, scale, attachment, collision and clearance validation |
| `frontend/src/theme-engine/snapScoring.ts` | Pure deterministic Snap Candidate ranking and complete Snap Trace |
| `frontend/src/theme-engine/instanceOverrides.ts` | Per-property parent resolution and Theme-change handling |
| `frontend/src/theme-engine/presetMerge.ts` | Pure old-preset/new-preset/user-composition three-way merge foundation |
| `frontend/src/theme-engine/baseRoomCompatibilityAdapter.ts` | Read-only decomposition of `base.main-room.v1` with parity records |
| `frontend/src/theme-engine/roomCompositionFixtures.ts` | Frozen Cosmos Main Room Shell, Preset, Catalog, Function and Composition fixtures |
| `frontend/src/theme-engine/index.ts` | Additive public exports |

Tests are grouped in:

- `roomContracts.test.ts`;
- `placementAndSnap.test.ts`;
- `adapterAndMerge.test.ts`.

## 3. Public data contracts

### 3.1 Architecture

`RoomShell` contains only:

- canvas/reference viewport and camera;
- perspective profile;
- architecture surfaces;
- placement surfaces and areas;
- attachment and light anchors;
- safe areas;
- semantic layer bands and depth;
- a Core fallback Shell reference.

The schema is closed. Properties representing Doors, Workspaces, Companion,
furniture, decoration, function bindings or Object Instances are rejected.
Semantic validation additionally requires wall, floor and ceiling architecture
and checks every Surface/Area/Anchor reference.

### 3.2 Visual catalog

`CatalogObject` defines reusable presentation and placement behavior:

- one of the ten required `CatalogObjectFamily` values;
- visual Asset Slots, but no asset bytes;
- independent Visual, Layout, Effect and optional Label Bounds;
- Placement Profile and Collision Profile;
- Object attachment Anchors;
- states, Skin compatibility and Core fallback Skin;
- perspective/scale/layer compatibility;
- optional compatible Function Container types.

A Catalog Object has no room position, rotation, room-specific Surface Binding
or Runtime descriptor.

### 3.3 Spatial instance

`ObjectInstance` references a Catalog Object and stores:

- position, rotation and scale;
- semantic layer and depth;
- a versioned `SurfaceBinding`;
- optional parent/Anchor relation;
- optional Function Container instance relation;
- Skin, animation and material references;
- exact property provenance;
- optional Preset origin and placement-repair state.

It does not copy Catalog Object, Skin, asset or Function Container definitions.

### 3.4 Function

`FunctionContainer` owns:

- function identity and closed function type;
- Interaction Bounds;
- Core Runtime descriptor/action-role compatibility;
- allowed Catalog families;
- accessibility label source and Core focus behavior;
- Core states, minimum target size and optional required clearance;
- fallback presentation role.

It has no Skin, visual slot, asset, material or animation property. The
distributable definition stores only `source: "runtime-context"` and expected
roles. Local descriptor IDs remain Core Runtime data.

Supported initial types include Knowledge Workspace, Creation Workspace, Room
Transition, Companion Interaction and Tool Entry. `base-exit` exists only for
lossless legacy compatibility.

## 4. JSON Schemas

The implementation adds:

- `room-shell.schema.json`;
- `room-preset.schema.json`;
- `catalog-object.schema.json`;
- `function-container.schema.json`;
- `room-composition.schema.json`;
- `base-composition.schema.json`;
- `placement-profile.schema.json`.

`room-common.schema.json` is an additional internal schema that centralizes
namespaced IDs, SemVer, version ranges, bounds, references, Object Instances,
Function Container instances, Room Connections and override-state unions.

All schemas:

- use JSON Schema Draft 2020-12;
- use `urn:cosmos:schema:theme-engine:*:1`;
- reject unknown properties;
- use the existing namespaced ID and SemVer patterns;
- contain no defaults or coercion rules;
- accept references and declarative scalar data only.

The existing Ajv instance registers the shared schemas before compiling public
validators. Validation still uses `coerceTypes: false`, `useDefaults: false`
and `removeAdditional: false`. The existing recursive active-content guard is
also applied to every new artifact.

## 5. Placement model

`PlacementProfile` declares:

- `allowedSurfaces`;
- required Surface contact;
- allowed normal classes;
- wall stop, floor lock and ceiling lock;
- Snap and attachment target roles;
- rotation and scale policies;
- collision mode and clearance;
- preferred distance, hysteresis and priority.

`validatePlacement` is a pure function. It receives an immutable proposal and
returns ordered diagnostic issues. It does not clamp, rotate, reparent or
correct input.

Hard checks include:

1. Surface kind and exact Surface Binding;
2. required contact;
3. normal compatibility;
4. floor/ceiling locks;
5. rotation and surface-normal alignment;
6. scale range and uniformity;
7. attachment role/family compatibility;
8. axis-aligned Layout Bounds clearance against declared obstacles.

Bounds are derived from Layout Bounds, never painted pixels or Interaction
Bounds.

## 6. Snap Candidate foundation

This phase deliberately implements no pointer loop, magnetic threshold
discovery, Canvas integration or preview UI.

`evaluateSnapCandidates` ranks already discovered candidates by:

1. hard validity;
2. explicit Anchor match;
3. contact quality;
4. Object profile priority;
5. distance;
6. alignment quality;
7. clearance;
8. previous-target hysteresis;
9. target priority;
10. stable target ID and candidate ID.

The input array order never decides a tie. The returned `SnapTrace` includes
every candidate, failed rule IDs, the comparison score vector, applied
hysteresis and the winner explanation. No Runtime or cache state is mutated.

## 7. Property override channels

Every Object Instance has independent override states for:

- position;
- rotation;
- scale;
- Skin;
- animation;
- material;
- layer;
- depth.

States are closed discriminated unions:

- `inherit` has no local value;
- `pinned` requires a typed local value;
- `reset-to-parent` has no local value and is resolved only through the parent
  operation.

`applyThemeChange` updates only channels currently marked `inherit`. Pinned and
`reset-to-parent` records are preserved. `resolvePropertyOverride` is the
separate primitive used by an explicit parent/reset or preset-merge operation.

Function Container attachment and descriptor role are intentionally not
override channels.

## 8. Read-only compatibility adapter

`adaptBaseMainRoomV1` consumes the existing:

- `baseMainRoomTemplate`;
- Core Default Base Composition;
- Core Runtime Function Bindings.

It produces:

- one architecture-only Compatibility Room Shell;
- one Cosmos Main Room Preset;
- six Catalog Objects for two Doors, two Workspaces, Companion and the legacy
  Base Exit control;
- six independent Function Container definitions and instances;
- one Room Composition;
- a parity record for all eight legacy Surfaces and all functional objects.

The Shell contains no Door, Workspace, Companion, furniture or function data.
Legacy functional Bounds are converted to Catalog-/Container-local Bounds and
can be reconstructed exactly by adding the Object Instance position.

The result is recursively frozen, has no write-back method and never mutates
its input. It creates no Registry entry, Runtime snapshot or persistent Object.

The Base Exit remains outside the Room Shell. It is represented as a temporary
compatibility Object/Function pair in the projected Room Composition so its
existing bounds, layer and Core binding are not lost. A later Runtime adapter
must project it to the Application Shell/Base navigation layer.

Foreground and Ambient remain in the eight-entry parity map rather than
becoming architecture or executable Room content. A future lossless Runtime
projection must bind them to pointer-passive decoration/material presentation.

## 9. Preset merge foundation

`mergeRoomPreset` is a pure deterministic three-way comparison of:

```text
original Preset baseline
new Preset baseline
current user Room Composition
```

Stable identity comes from `presetItemId`, never array index.

Current behavior:

- inherited and explicitly reset channels accept the new Preset baseline;
- pinned channels preserve the user value;
- missing user items and tombstoned item IDs remain deleted;
- new Preset items are detected and added deterministically;
- user-owned non-Preset instances remain untouched;
- divergent Catalog reference edits are explicit conflicts;
- removed Preset items remain present and produce an explicit conflict pending
  a later transactional user choice;
- Function Container instances are retained only for present Objects and new
  compatible preset instances are added.

No merge silently changes a descriptor target. Collaborative revision merging,
UI choices and persistent transactions remain outside Phase 9R.

## 10. Security boundaries

- No new artifact carries scripts, HTML, callbacks, commands, routes or
  arbitrary Renderer parameters.
- Schemas reject unknown fields and binary/asset declarations in Presets.
- Catalog Objects reference slots and Skins; they contain no asset bytes.
- Function Containers reference Core descriptor roles, never callbacks or
  local executable identifiers.
- Room Shell surfaces are pointer-passive and function-free.
- Validation does not repair invalid data.
- Placement, Snap, Override, Adapter and Merge functions have no DOM, Canvas,
  network or filesystem dependency.
- The adapter is read-only and non-authoritative.

## 11. Test coverage

Phase 9R tests cover:

- metaschema and valid-fixture validation;
- invalid/unknown schema data and readable artifact kinds;
- Shell rejection of furniture, functions and instances;
- required Shell architecture and reference integrity;
- Catalog Object rejection of room position;
- Function Container Skin/asset independence and initial function families;
- Preset rejection of assets, bytes and executable fields;
- all typed override-state modes;
- Theme changes affecting only inherited channels;
- Door wall/floor-contact rules;
- Table floor lock and wall stop semantics;
- Wall and Ceiling Light Surface restrictions;
- Plant floor/Object-Anchor placement;
- incompatible attachments and clearance violations;
- order-independent Snap ranking, hysteresis and full rejection traces;
- exact legacy Bounds/layer/function parity;
- adapter input immutability and frozen output;
- Visual/Interaction Bounds separation;
- Three-Way-Merge inheritance, pins, deletions, additions and conflicts;
- merge determinism and input immutability.

Existing Theme Engine and frontend tests remain unchanged and provide
regression coverage for the Base loader, registries, assets, resolver,
exporters and current Runtime.

## 12. Design Intelligence

The technical comparison follows
`docs/Product_Bible_V2/00_Foundation/06_Design_Intelligence.md` and the
source-backed review in `13_room_composition_system.md`.

### Adopted principles

- From The Sims, Animal Crossing and House Flipper: a reusable catalog,
  preset-based starting points, contextual placement and immediate validity
  feedback.
- From Blender: typed snap targets, explicit pivots, Surface normals and
  independently constrained transform channels.
- From Figma: stable alignment decisions, visible reasons and deterministic
  ties instead of hidden layout order.
- From Unreal Engine: Surface/Anchor attachment, normal-aligned orientation,
  explicit offsets and separation of semantic attachment from optional grid
  precision.

### Intentionally rejected

- game economy, inventory and progression constraints;
- grid-first universal placement;
- hidden cheat modes for ordinary placement;
- raw mesh/vertex editing and professional-editor complexity;
- pixel-derived collision or hitboxes;
- UI layout, icons, terminology, art direction or brand identity from any
  reference product;
- executable object behavior in catalog or theme data.

### Why this fits Cosmos

Cosmos needs approachable Room composition without coupling a user's Knowledge
Workspace, navigation target or Companion function to one visual metaphor.
Catalog Objects and Function Containers therefore remain independently
replaceable. Typed placement gives the rigor needed for future builders, while
property provenance and explicit preset conflicts protect the user's personal
arrangement across Theme and Preset evolution.

## 13. Known limitations and risks

- Placement collision currently uses deterministic axis-aligned bounds; rotated
  polygon collision is deferred.
- Candidate discovery and magnetic thresholds are not implemented.
- Surface contact is supplied as a trusted Boolean proposal input; geometric
  contact derivation belongs to the future placement engine.
- The adapter maps legacy Base Exit only for parity; its final owner remains the
  Application Shell.
- Foreground/Ambient presentation is retained in parity metadata but not yet
  resolved as new Room decoration/material artifacts.
- There are no Shell, Catalog, Preset or Function registries yet.
- There is no persistence transaction, undo/redo, collaborative merge or UI.
- New Preset objects are added by this foundation; a future Base Builder must
  expose the explicit transaction/choice policy required by the product.
- Shell/Catalog major-version migrations intentionally remain explicit and
  unresolved.

## 14. Next phase

The next safe step is a non-UI registry/domain layer:

1. add Shell, Catalog Object, Function Container and Preset registries;
2. resolve their exact versions into an immutable Room Composition snapshot;
3. add geometric contact/boundary validation and rotated collision fixtures;
4. convert Foreground/Ambient compatibility mappings into declarative,
   pointer-passive presentation records;
5. compare the resolved Room snapshot with the existing Base scene in shadow
   mode.

`BaseView.vue` and current Runtime authority should remain unchanged until that
snapshot passes geometric, functional, fallback and rollback parity gates.
