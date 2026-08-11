# Room Registry and Shadow Mode

**Status:** Phase 9R shadow foundation implemented

**Contract family:** Cosmos Theme Engine 1.1

**Runtime impact:** none

**Authoritative runtime:** existing legacy Base

**Compatibility source:** `base.main-room.v1`

## 1. Scope

This phase adds the read-only domain layer that was intentionally deferred by
the Room Composition Foundation:

- five versioned registries;
- deterministic Room Composition resolution;
- an immutable Room Snapshot and property-level Resolution Trace;
- a read-only `base.main-room.v1` shadow projection;
- pure legacy/snapshot parity comparison;
- neutral fixtures for the next non-UI integration phase.

It does not:

- import or change `BaseView.vue`;
- activate the snapshot in Vue, the DOM, Canvas or the renderer;
- write Runtime state, navigation state or persistence;
- implement Base Builder or Theme Builder UI;
- migrate existing Base data;
- add graphics or replace the current Cosmos presentation.

The legacy Base remains the sole visible and functional authority.

## 2. Implemented modules

| File | Responsibility |
|---|---|
| `frontend/src/theme-engine/immutable.ts` | Defensive deep clone and recursive freeze primitives |
| `frontend/src/theme-engine/roomRegistries.ts` | Separate Shell, Preset, Catalog Object, Function Container and Base Composition registries |
| `frontend/src/theme-engine/roomSnapshotResolver.ts` | Deterministic reference, preset, property, function and Skin resolution |
| `frontend/src/theme-engine/roomParity.ts` | Pure legacy/snapshot parity gates and ordered diagnostics |
| `frontend/src/theme-engine/roomShadowMode.ts` | Read-only compatibility adapter, resolver and parity orchestration |
| `frontend/src/theme-engine/roomShadowFixtures.ts` | Empty Shell, standard Preset, neutral objects, pinned user composition and Skin fixtures |
| `frontend/src/theme-engine/index.ts` | Additive public exports |

Tests are grouped in:

- `roomRegistries.test.ts`;
- `roomSnapshotResolver.test.ts`;
- `roomShadowMode.test.ts`.

No existing schema or Runtime component is changed by this phase.

## 3. Registries

Five public registries deliberately remain separate:

| Registry | Stable identity |
|---|---|
| `RoomShellRegistry` | `shellId + version` |
| `RoomPresetRegistry` | `presetId + version` |
| `CatalogObjectRegistry` | `catalogObjectId + version` |
| `FunctionContainerRegistry` | `containerId + version` |
| `BaseCompositionRegistry` | `baseId + version` |

Every registration passes the existing JSON Schema and semantic validator
before storage. The caller's value is cloned and recursively frozen, so later
caller mutation cannot alter registered data. Registration of an already
present identity/version pair fails with `room_registry_duplicate`.

Exact reads reject an unknown identity with `room_registry_missing` and an
unknown version with `room_registry_version_incompatible`. Version-range reads
select the highest compatible SemVer. They never substitute an incompatible
major version. Listing is deterministic: identity ascending, then version
ascending.

Multiple versions of one stable identity may coexist. “Duplicate” therefore
means the complete versioned identity, not the logical identity alone.

`createRoomCompositionRegistries()` creates an isolated registry set. There is
no global singleton and no implicit Runtime registration.

## 4. Resolution

`RoomCompositionResolver` receives:

- a validated `RoomComposition`;
- an optional explicit Room Preset reference;
- immutable Skin availability and assignment inputs;
- the five registries through constructor injection.

The Room Composition already carries its per-property user overrides and
Catalog/Function references. Resolution follows this pipeline:

```text
validate Room Composition
  -> resolve Shell and optional Preset versions
  -> verify Preset/Shell compatibility
  -> reject duplicate instance identities
  -> reject missing parents and attachment cycles
  -> resolve Catalog Objects and placement bindings
  -> resolve each property channel
  -> resolve Skin assignments and Core fallbacks
  -> resolve Function Containers and reciprocal bindings
  -> sort Objects, Functions, Connections, Layers and Trace
  -> clone and recursively freeze the Room Snapshot
```

Array input order never decides a result. Object rendering order is:

1. Shell layer-band minimum;
2. Object depth;
3. stable Object Instance ID.

Functions, Connections, Surfaces, registry lists, diagnostics and trace entries
also have explicit stable sort keys.

### 4.1 Property precedence

Transform, animation, material, layer and depth channels use:

```text
pinned user property
  > matching Preset item property
  > current Room Composition property
```

The Preset match uses `presetItemId`, never an array index.

Skin inheritance uses:

```text
pinned user Skin
  > Room assignment
  > Active Theme assignment
  > declared Core Default assignment
  > Catalog Object Core fallback Skin
```

Assignments with equal scope use stable assignment ID order. A compatible Skin
reference selects the highest available version. An unavailable non-Core Skin
produces a warning and falls back to Core. An unavailable Core fallback remains
explicitly unresolved and produces a conflict; the resolver does not silently
repair the input.

## 5. Immutable Room Snapshot

`ImmutableRoomSnapshot` is a data-only output with:

- `roomId`, deterministic `snapshotId` and snapshot format version;
- resolved Room Shell and architecture Surfaces;
- ordered, resolved Object Instances;
- resolved Function Container definitions and bindings;
- Room Connections;
- semantic Layers and numeric depth on each Object;
- Placement/Surface Bindings;
- resolved Skin identity and version;
- property-level override provenance;
- aggregate validation status;
- complete Resolution Trace.

It has no Vue reactivity, DOM reference, callback, command or write method.
Resolver inputs, registry values and outputs are defensively cloned where the
ownership boundary is crossed. The returned graph is recursively frozen.
Changing an input after resolution cannot change an existing snapshot.

## 6. Resolution Trace

Every resolved Object property has one trace record:

- `value`;
- `source`;
- `inheritedScope`;
- `overrideStatus`;
- `fallback`;
- ordered warnings;
- ordered conflicts.

The initial property set is:

- position;
- rotation;
- scale;
- Skin;
- animation;
- material;
- layer;
- depth.

Example outcomes:

| Property | Source | Scope | Override | Fallback |
|---|---|---|---|---|
| pinned Door position | `user-composition` | `instance` | `pinned` | no |
| inherited Preset depth | `room-preset` | `room` | `inherit` | no |
| Theme Skin | `active-theme` | `active-theme` | `inherit` | no |
| missing Theme Skin | `core-default` | `core-default` | `inherit` | yes |

Shell and Preset sections record both requested version references and resolved
exact versions. Aggregate warnings and conflicts are sorted and deduplicated.

## 7. Shadow Mode

`runBaseMainRoomShadowMode()` is the only orchestration entry point introduced
for the current Base.

It:

1. invokes the existing read-only `adaptBaseMainRoomV1`;
2. creates an isolated local registry set;
3. registers only the compatibility projection;
4. resolves a new immutable Room Snapshot;
5. compares it with the adapter's legacy parity records;
6. returns ordered diagnostics.

The result explicitly reports:

```text
mode: shadow
authoritativeRuntime: legacy-base
```

The function performs no filesystem, network, console, Vue, DOM, navigation or
Runtime-state operation. It exposes no apply or write-back path. Consumers may
load, inspect, validate and log the returned data, but the module itself does
not alter the active application.

## 8. Parity comparison

`compareLegacyBaseToRoomSnapshot()` is a pure comparison function. It checks
all six projected functional objects:

- left Door;
- right Door;
- left Workspace;
- right Workspace;
- Companion;
- Base Exit.

The compared dimensions are:

- presence of functional Object and Function Container;
- descriptor and action roles;
- reciprocal Object/Function binding;
- Visual, Interaction, Layout, Effect and optional Label Bounds;
- position;
- semantic layer and numeric depth;
- Catalog family as the visible functional role;
- Workspace, transition, Companion and Base Exit categories.

Bounds are reconstructed from Catalog-/Container-local Bounds plus the resolved
Object transform. Visual and Interaction Bounds remain independent.

Results are:

| Status | Meaning |
|---|---|
| `equal` | No compared difference |
| `compatible-difference` | Function-preserving Skin change or added pointer-passive decoration |
| `blocking-difference` | Missing/extra function, changed binding, bounds, position, layer or functional role |

Differences are deterministically ordered and contain category, severity,
relevant IDs and a readable reason. A single blocking difference determines
the aggregate blocking status.

The default `base.main-room.v1` shadow projection currently resolves to
`equal`.

## 9. Canonical fixtures

The fixtures contain no final Cosmos art or asset bytes:

- `emptyRoomShellFixture`: architecture-only technical Shell without lights or
  attachment anchors;
- `cosmosMainRoomStandardPresetFixture`: two Doors, two Workspaces, Companion,
  Base Exit, two simple ceiling lights and one floor decoration;
- `cosmosMainRoomStandardCompositionFixture`: standard user Room composition;
- `pinnedUserRoomCompositionFixture`: a single pinned left-Door position;
- `roomShadowCatalogObjectsFixture`: compatibility Catalog plus three neutral
  technical objects;
- `roomShadowSkinResolutionFixture`: Core and Active Theme Skin candidates;
- `roomShadowBaseCompositionFixture`: one-room Base Composition.

Neutral Catalog Objects declare slots, bounds and placement contracts only.
They contain no graphic asset or executable content.

## 10. Security and authority boundaries

- All registry writes validate before storage; invalid data is rejected.
- Existing closed schemas and the active-content guard remain authoritative.
- No schema defaults, coercion, unknown-property removal or silent correction
  is introduced.
- Registries and resolver accept declarative data only.
- No HTML, script, callback, route, command or arbitrary executable parameter is
  introduced.
- Function Containers resolve expected Core roles, not executable callbacks.
- Missing and version-incompatible references fail with typed readable errors.
- Attachment cycles fail before snapshot creation.
- Invalid layer/function compatibility remains visible as validation conflicts.
- Shadow Mode cannot write to the legacy Base or application state.
- The snapshot is non-authoritative and cannot drive interaction or navigation.

## 11. Test coverage

The phase adds coverage for:

- creation and successful reads of all five registries;
- duplicate versioned identities;
- missing references and version conflicts;
- deterministic version selection and listing;
- immutable registry copies;
- deterministic resolution under reversed registration and input order;
- immutable snapshots and input independence;
- complete property traces;
- pinned position preservation;
- inherited Active Theme Skin;
- missing Skin fallback to Core;
- missing Shell/Catalog/Function references;
- attachment cycles;
- stable reciprocal Function Bindings;
- Shadow Mode Runtime-input immutability;
- exact legacy parity;
- compatible Skin and decoration differences;
- blocking position, bounds, missing Companion and missing binding differences.

The existing schema/fixture tests continue to validate the underlying Room
Shell, Preset, Catalog Object, Function Container, Room Composition and Base
Composition artifacts.

## 12. Design Intelligence

This review applies the local
`docs/Product_Bible_V2/00_Foundation/06_Design_Intelligence.md` rule: learn from
proven principles without copying appearance, branding or complete workflows.

### 12.1 Comparable systems and adopted principles

| System | Proven principle | Cosmos adaptation |
|---|---|---|
| Figma Components | A main component defines reusable structure; instances retain deliberate property overrides and expose intended customization points. [Figma documentation](https://help.figma.com/hc/en-us/articles/360039150733-Apply-changes-to-instances) | Presets/Catalog Objects remain shared sources; per-property `inherit`/`pinned` provenance is explicit and inspectable. |
| Blender Data-Blocks | Typed data blocks have type-local unique names, reference each other and can be shared by multiple users. [Blender manual](https://docs.blender.org/manual/en/5.0/files/data_blocks.html) | Separate typed registries preserve stable identities and references without copying definitions into every Object Instance. |
| Unity Prefabs | Prefab assets feed linked instances while instance overrides take precedence and remain distinguishable. [Unity manual](https://docs.unity3d.com/ja/current/Manual/PrefabInstanceOverrides.html) | Preset inheritance and pinned instance properties are resolved independently and recorded in the Trace. |
| Unreal Assets | Asset metadata can be queried through a registry without loading the complete asset, and Data Registries are intended for general read-only data. [Unreal Asset Registry](https://dev.epicgames.com/documentation/en-us/unreal-engine/asset-registry-in-unreal-engine), [Unreal Data Registries](https://dev.epicgames.com/documentation/en-us/unreal-engine/data-registries-in-unreal-engine) | Definition lookup is separate from Runtime activation; resolution uses declarative metadata and immutable values. |
| The Sims Build Mode | A discoverable object catalog and room-building workflow provide reusable starting material instead of baking every room as one picture. [EA new-player Build Mode hub](https://www.ea.com/games/the-sims/the-sims-4/new-player-hub) | Catalog Objects and a standard Room Preset are reusable data, while function and visual identity remain separate. |

Additional principles adopted across these references:

- stable references instead of array-position identity;
- shared definitions plus lightweight instances;
- explicit per-property override provenance;
- read-only query layers before Runtime activation;
- typed categories and compatibility rules;
- deterministic fallback and visible conflicts.

### 12.2 Intentionally rejected principles

- Figma-style structural detachment or applying instance overrides back to the
  source;
- Blender's automatic numeric renaming and automatic removal of unused data;
- Unity component/GameObject mutation and Prefab unpacking;
- Unreal editor-time asynchronous discovery, global singleton registries and
  engine object loading;
- The Sims economy, inventory, progression, grid-first placement and catalog
  UI;
- any referenced visual language, branding, keyboard scheme or editor chrome.

Automatic renaming, deletion, detachment and write-back would hide identity or
authority changes. Cosmos therefore rejects duplicates and conflicts explicitly
and keeps this phase read-only.

### 12.3 Why the solution fits Cosmos

Cosmos must preserve Knowledge Workspace, Room transition, Companion and Base
Exit behavior while allowing a Room's appearance and composition to evolve.
Separate Catalog Objects and Function Containers prevent the visual metaphor
from becoming the function contract. Presets provide reusable starting points;
property-level provenance protects personal layout decisions; immutable
snapshots create a safe diagnostic boundary before any visible Runtime
migration.

The result combines editor-grade determinism with a smaller domain model:
there is no general scene engine, no arbitrary component scripting and no UI
surface in this phase.

## 13. Known limitations and risks

- The snapshot resolves one Room at a time. Base-wide connection graph
  resolution remains a later layer over `BaseCompositionRegistry`.
- Skin definitions are represented by immutable availability metadata rather
  than a sixth persistent registry. Full Theme/Skin Pack resolution remains
  owned by the existing Theme Engine contracts.
- Room- and Active-Theme Skin assignments are supported; project-, tag-,
  cluster- and node-related scopes are not part of this Room phase.
- The adapter can prove stable Workspace/transition descriptor roles and
  reciprocal bindings, but Phase 9R contains no legacy target identity for a
  concrete Workspace or destination Room. Target-level navigation parity must
  be added when the Runtime adapter exposes read-only target data.
- Base Exit remains a compatibility Object even though its final owner should
  be the Application Shell.
- Foreground and Ambient remain in legacy Surface parity metadata; they are not
  yet resolved as pointer-passive Room presentation records.
- Bounds comparison supports current rect, ellipse and polygon translation and
  scale. Rotation-aware geometric comparison is not yet needed by the fixed
  compatibility scene.
- Invalid semantic layer/function compatibility produces an invalid snapshot
  with explicit conflicts instead of throwing. Missing references, schema
  violations and cycles reject resolution entirely.
- No persistence transaction, undo/redo, collaborative merge, builder UI,
  renderer bridge or telemetry sink exists.

## 14. Next phase

The next safe step is a read-only Runtime integration gate:

1. invoke Shadow Mode from a diagnostics-only development service, still
   without importing it into `BaseView.vue`;
2. expose read-only Workspace and Room destination identities to extend target
   parity;
3. resolve Base-wide Room Connections through `BaseCompositionRegistry`;
4. add Foreground/Ambient pointer-passive presentation records;
5. collect parity snapshots over representative Base states;
6. require sustained `equal` or reviewed `compatible-difference` results before
   designing any Runtime projection.

Only after those gates pass should a separate phase propose a renderer adapter.
The legacy Base must remain authoritative until rollback, navigation, focus,
hitbox and state parity are demonstrated end to end.
