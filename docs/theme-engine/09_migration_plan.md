# Theme Engine Migration Plan

Status: normative implementation sequence; no implementation in this document
Target contract family: Cosmos Theme Engine `1.0.0`

## 1. Purpose

This plan migrates the audited WebUI to contracts 02–08 without a big-bang
rewrite. It preserves Core behavior and user state, keeps the current visuals as
Core Default until parity is proven, and introduces external packages and Theme
Builder only on validated foundations.

### 1.1 Architecture correction after the Base Vertical Slice

The Base Vertical Slice and Art Pack Exporter successfully proved schemas,
registries, fallbacks, bounds separation and deterministic export. They also
proved that the monolithic Base Template is too coarse for long-term
creativity.

`13_room_composition_system.md` therefore inserts a mandatory architecture
refactoring before Theme Builder UI or `BaseView.vue` migration:

1. Room Shell contract;
2. Room Preset contract;
3. Catalog Object families;
4. Function Container contract;
5. semantic Placement/Snap contract;
6. Base/Room Composition and instance property provenance;
7. lossless compatibility decomposition of `base.main-room.v1`.

Phases 8 and 9 remain successful foundation phases. Their aggregate Template is
a migration source and fallback, not the target authoring granularity. Phase 10
MUST NOT start as currently described until the inserted Phase 9R below passes.

## 2. Terms and migration data model

- **Phase gate**: required evidence before the next numbered phase begins.
- **Compatibility adapter**: temporary typed bridge from a legacy field or
  presenter to a new contract.
- **Parity fixture**: visual, interaction or resolution evidence comparing the
  legacy and candidate paths.
- **Shadow mode**: new logic executes and traces but does not control the UI.
- **Last known good snapshot**: immutable active presentation used for rollback.
- **Migration record**: `{sourceId, sourceRevision, targetRefs, phase,
  validatorVersion, parityResult, timestamp}`.

Required migration-record fields are the source identity/revision, generated
target references, phase, validator version and result. A timestamp and
human-readable note are optional and non-semantic. Original values remain
available until their published removal phase.

## 3. Invariants

- The 14 numbered phases plus mandatory Phase 9R run in the exact order below.
- Core continues to own data, behavior, navigation, interactions, states and
  permissions.
- No migration step embeds behavior in templates, skins or compositions.
- One serialized Theme Transition Runtime owns activation.
- Every required target terminates at immutable Core Default.
- A failed phase or activation preserves Core Object, Window, selection,
  navigation and permission state.
- Removal of old hardcodings occurs only in Phase 14 after successful fallback
  tests.

## 4. Existing basis disposition

| Current basis | Decision | Target |
|---|---|---|
| `ThemeRegistry` | continue and type | versioned Theme definition registry |
| `ThemeRuntime` | continue, narrow | activation/resolution/snapshots |
| DOM Presenter | continue as backend | trusted Core renderers |
| CSS Custom Properties | continue as output | generated from typed tokens |
| `data-theme` | migrate | snapshot marker/debug aid only |
| embedded SVG/component CSS | migrate | Asset Slots/Core Default skins |
| `skin` | adapt, then deprecate | exact-instance skin override |
| `icon` | adapt, then deprecate | typed icon asset slot |
| `overlay` | adapt, then deprecate | Workspace environment composition |
| `atmosphere` | adapt, then deprecate | ambient skin/token preset |
| `themeOverride` | adapt, then deprecate | scoped composition/theme reference |

## 5. Validation and fallback policy

Every phase must pass:

- schema/type/security validation for its artifacts;
- unchanged Core behavior traces;
- required-target Core Default fallback;
- supported viewport and reduced-motion fixtures;
- deterministic output under randomized registration/load order where relevant;
- rollback drill to the legacy path or last known good snapshot.

Errors are reported with phase, source identity, target artifact, stable error
code and remediation. A failed record is not partially committed. Validation
warnings do not silently become errors or vice versa across validator patch
versions.

## 6. Phase 1 — Data models and schemas

**Goal:** establish versioned types before any new runtime authority.

Deliverables:

- the five Draft 2020-12 schemas and typed runtime equivalents;
- ID, SemVer, version range, reference and compatibility rules;
- User Composition identity/persistence model;
- canonical JSON serialization and stable diagnostics;
- security rejection for code, unsafe paths and unsupported assets;
- positive/negative fixture corpus.

Gate:

- schemas pass metaschema validation;
- examples and invalid fixtures produce expected codes;
- dependency and reference shapes are consistent;
- no UI depends on the new models.

Fallback/rollback: remove the unused schema loader; persisted/runtime behavior is
unchanged.

## 7. Phase 2 — Template Registry

**Goal:** register versioned Object and Environment Template definitions.

Deliverables:

- Template Registry as a definition index, not active-state storage;
- template compatibility and dependency validation;
- functional roles, slots, anchors, states, bounds and layer bands;
- immutable critical Window Close/Resize/Drag/focus contracts;
- registration transaction and conflict diagnostics.

Gate:

- every audited visible object has a proposed template role;
- duplicate IDs, incompatible versions and missing fallbacks reject atomically;
- registry load order does not alter lookup.

Fallback/rollback: templates remain descriptive in shadow mode; legacy
components remain authoritative.

## 8. Phase 3 — Asset Registry

**Goal:** safely register immutable visual resources and slots.

Deliverables:

- Resource Service quarantine/copy/hash workflow;
- Asset Registry definitions by ID/version/digest;
- PNG/WebP/SVG/WebM/MP4 signature and metadata validation;
- SVG sanitizer, video poster/reduced-motion contract and budgets;
- Core Default asset inventory for embedded SVG/icons/backgrounds;
- typed icon slots and legacy `icon` adapter.

Gate:

- malicious/corrupt/path-traversal corpus;
- digest reproducibility and content deduplication;
- required asset slots always reach an emergency fallback;
- registered packages contain no external/live paths.

Fallback/rollback: adapter returns original embedded assets; quarantined imports
are not activated.

## 9. Phase 4 — Token system

**Goal:** represent scalar presentation without changing component structure.

Deliverables:

- classify audited hardcoded colors, measures, radii, shadows, opacity,
  typography and durations;
- typed, namespaced token definitions and semantic ranges;
- current values captured as Core Default;
- CSS Custom Property emission adapter;
- explicit inventory of existing unused tokens with remove/deprecate/revive
  decision;
- prohibition on raw CSS in package data.

Gate:

- screenshot/state parity for extracted values;
- hardcoded inventory decreases only where mapped;
- every consumed token has a typed fallback;
- unused tokens are not accidentally treated as stable public API.

Fallback/rollback: emitter supplies frozen legacy values.

## 10. Phase 5 — Resolver

**Goal:** implement deterministic modular selection in shadow mode.

Deliverables:

- exact precedence: instance, rule/tag, cluster, project, room, environment,
  composition-global, active Theme, Core Default;
- specificity, priority, pack-order and lexical tie-breaks;
- per-key merge and list-replace semantics;
- acyclic dependency locking and bounded evaluation;
- immutable snapshots, cache keys and resolution trace;
- adapters for `skin`, `overlay`, `atmosphere`, `themeOverride`.

Gate:

- exhaustive adjacent-precedence fixtures;
- random load/registry order gives identical winners;
- dependency/alias cycles reject;
- user Project/Node/Workspace names, tags, filenames/content and labels bypass
  theme terms;
- every required lookup terminates.

Fallback/rollback: shadow results are discarded; legacy ThemeRuntime stays
authoritative.

## 11. Phase 6 — Renderer contracts

**Goal:** establish trusted rendering boundaries before moving presentation.

Deliverables:

- Renderer Registry and closed parameter schemas;
- DOM/SVG/Canvas-independent render request/plan;
- semantic bounded layers and device degradation;
- separate Interaction/Layout/Visual/Effect/Label Bounds;
- geometry-neutral Window portal contract;
- emergency renderer coverage.

This phase must explicitly solve in the target runtime:

- `backdrop-filter`/`filter`/`transform`/`perspective`/`contain` ancestors cannot
  contain fixed Tool Windows;
- exactly one owner applies the Workspace-to-viewport offset, eliminating the
  audited visually doubled offset;
- environment containers cannot clip Tool Windows;
- the existing unbounded `focusOrder` behavior is replaced by renormalization
  inside the Window band;
- Window z-indices cannot overtake Surface, Modal or Emergency bands.

Gate:

- containing-block browser fixture for every forbidden ancestor property;
- 10,000 focus operations remain bounded;
- Workspace origin is applied exactly once;
- edge-positioned Windows remain recoverable;
- renderer fault changes presentation only.

Fallback/rollback: trusted presenter selects legacy rendering per role; portal
adapter remounts the legacy Window host without rewriting stored geometry.

## 12. Phase 7 — Core Default Theme

**Goal:** describe the entire current first-party presentation through contracts.

Deliverables:

- immutable/uninstallable Full Theme covering world, Map, Base Entry, Base
  Interior, Room, Workspace, Window, Companion, icons, Nodes, Connections,
  labels and statuses;
- current tokens/assets/materials/state variants;
- emergency primitives for every functional target;
- protected label ownership classification;
- parity map back to the audit.

Gate:

- clean install dry-resolves every required target;
- all legacy screenshots and behavior traces pass approved parity thresholds;
- reduced-motion/media failure/resource failure uses a safe fallback;
- Core Default does not change visible user content.

Fallback/rollback: legacy presenters continue to render the same captured
values; Core Default artifacts remain registered but inactive.

## 13. Phase 8 — Base vertical slice

**Goal:** prove Environment Template/composition and hybrid skinning end to end.

Deliverables:

- `cosmos.environment-template.base.standard-v1`, `1600 × 900 DU`, functional
  `contain` mapping;
- Background, Rear, Left, Right, Floor, Ceiling, Foreground and Ambient;
- two Door zones, two Workspace Entry zones, Companion anchor and immutable
  Base Exit;
- decorative and functional scene nodes;
- runtime action-descriptor binding without theme-created navigation;
- vehicle-livery bounds/safe-area contract.

Gate:

- two Doors/two Workspaces independently place and bind only available
  descriptors;
- missing optional descriptor hides/disables per template;
- narrow/wide/ultrawide preserve functional targets;
- Interaction Bounds stay independent from oversized visuals;
- Window portal remains outside themed surface effects.

Fallback/rollback: Base environment host mounts the existing `BaseView.vue`.

## 14. Phase 9 — Design-template exporter

**Goal:** create reproducible art/engineering deliverables from the Base slice.

Deliverables:

1. clean design template PNG;
2. zone overlay PNG;
3. hitbox overlay PNG;
4. safe-area overlay PNG;
5. depth/layer overlay PNG;
6. SVG template;
7. machine-readable JSON specification;
8. Art Brief Markdown.

Gate:

- all outputs share the same reference viewport/version;
- SVG/JSON/raster coordinates agree within `0.5 DU`;
- overlays have stable legends and distinguish all bound types;
- export contains no local paths, draft fixtures or executable content;
- round-trip JSON validates.

Fallback/rollback: exporter is offline/non-authoritative; runtime is unaffected.

## 14.1 Mandatory Phase 9R — Room Composition foundation

**Goal:** decompose the successful Base aggregate without changing Runtime.

Deliverables:

- schemas and TypeScript contracts for Room Shell, Room Preset, Catalog Object,
  Function Container, Room Composition and Base Composition;
- placement surface/profile/binding and deterministic snap trace contracts;
- per-property instance pins for position, rotation, scale, Skin and animation;
- reference-only preset three-way merge;
- compatibility adapter from `base.main-room.v1`;
- synthetic Cosmos Main Room Shell and Preset fixtures;
- independent Shell and Catalog Object Art Pack contracts.

Gate:

- compatibility scene preserves current bounds, layers and Function Bindings;
- presets contain no asset duplication;
- Function Containers remain stable across Skin changes;
- instance pins survive global Theme changes;
- snapping is deterministic and semantic constraints outrank optional grid;
- no `BaseView.vue` or active Runtime behavior changes.

Fallback/rollback: keep the existing Base Vertical Slice and exporter adapter
unchanged and authoritative.

## 15. Phase 10 — Theme Builder and Base Builder foundations

### 15.1 Revised Phase 10 scope

After Phase 9R, Phase 10 splits:

- Theme Builder MVP authors Shells, Catalog Objects, Skins, materials,
  animations, assets and Art Packs;
- Base Builder domain foundation manages Rooms, placement, decoration,
  connections, Function Containers and presets.

There is no Room Builder. A UI implementation for either tool is not authorized
by Phase 9R.

**Legacy Phase 10 goal:** author, test, save, apply and export the Base slice
inside Cosmos. The deliverables below MUST be reclassified between Theme Builder
and Base Builder before implementation.

Deliverables:

- Scene Tree, Canvas, Properties, Asset Library, State Preview, Test Mode;
- import/drag/place/size/rotate/layer/anchor/bounds/action-role/state editing;
- atomic decorative and functional insertion;
- undo/redo command log and draft persistence;
- sandbox action/resolution trace;
- transactional validate/register/preview/apply;
- Phase 9 export.

Gate:

- all Theme Builder contract first-slice acceptance tests;
- Test Mode proves zero production side effects;
- apply preserves navigation/Window/Object state and rolls back on fault;
- exported package reimports and resolves identically.

Fallback/rollback: Builder remains save/export-only; existing active theme is
unchanged.

## 16. Phase 11 — Node Templates

**Goal:** migrate Node presentation while preserving graph behavior.

Deliverables:

- Project, Cluster and Object Node templates;
- universal Node skin with automatic hierarchy scaling;
- optional hierarchy-specific skins;
- asymmetric Visual/Layout/Effect/Label Bounds;
- state/layer composition and exact-instance/project/rule overrides;
- component behavior separated from trusted Node renderer request.

Gate:

- hierarchy and universal fallback matrix;
- visuals outside Interaction Bounds remain pointer-passive;
- drag/select/open/context behavior traces are unchanged;
- mixed packs within one Project and exact Node instance resolve correctly.

Fallback/rollback: per-role presenter switch returns to existing Node visual;
Core graph state is unchanged.

## 17. Phase 12 — Connection renderer

**Goal:** migrate Connections to trusted declarative renderers.

Deliverables:

- Stroke, Texture Path, Animated Flow, Repeating Objects, Particles and
  Composite renderers;
- Base Path, Border, Glow, Repeating Texture, Moving Objects, Particles, Start
  Cap, End Cap and Midpoint Decoration layers;
- trusted path input, budgets, stable seed and reduced-motion behavior;
- exact-instance/project/rule override support.

Gate:

- fixtures for light beam, laser, road, moving trade route, pipeline and
  Redstone-like line;
- graph topology/endpoints/hitbox remain Core-owned;
- deterministic motion/particles;
- budget degradation reaches static Core Default;
- package cannot supply code/shader/script.

Fallback/rollback: existing Connection presenter remains available per
connection role.

## 18. Phase 13 — Incremental migration of existing components

**Goal:** make contract rendering authoritative one component at a time.

Required order within the phase:

1. structural Window portal/layer host if not already activated;
2. `CosmosView.vue`;
3. `BaseView.vue`;
4. `WorkspaceView.vue`;
5. Map/Rooms/Window presenters;
6. Companion/icons/labels/status;
7. remaining Node/Connection presenters after their phase gates.

For each component:

- retain behavior/state/action wiring in Core/controller;
- replace visual branches with typed template/render requests;
- move component-local hardcoded colors, CSS backgrounds, inline styles and
  replaceable assets into Core Default artifacts;
- compare behavior/hitbox/state/visual fixtures;
- activate via a per-component compatibility switch;
- keep original path until the component fallback test succeeds.

Gate:

- mixed responsibility findings from the audit close with ownership evidence;
- no migrated component interprets untyped theme values;
- legacy field writes stop after lossless adapter migration;
- each component has independent rollback.

Fallback/rollback: switch only that component back; never reset Core state or
discard migrated data.

## 19. Phase 14 — Remove old hardcodings after successful fallback test

**Goal:** retire legacy presentation authority only after the complete safety
case passes.

Preconditions:

- every supported component has passed its Core Default, missing asset,
  incompatible version, renderer fault, reduced-motion and activation rollback
  tests;
- first-party records migrate losslessly;
- one published deprecation window has elapsed;
- repository search identifies no unsupported legacy writes.

Deliverables:

- remove redundant hardcoded visual branches and legacy resolver authority;
- remove/deprecate unused tokens according to Phase 4 decisions;
- retain versioned read/import migrators for supported historical data;
- finalize deprecation/removal of `skin`, `icon`, `overlay`, `atmosphere` and
  `themeOverride` only at the documented compatibility boundary;
- update architecture/experience contracts and audit closure report.

Gate:

- clean install and historical-data fixture suites;
- Core Default and last known good rollback from every failure injection;
- no old hardcoding is removed without its named fallback test;
- security/accessibility/performance release review.

Rollback: release rollback to the last adapter-bearing version. Typed data is
preserved; destructive backward migration is forbidden.

## 20. Migration procedure example

For legacy `themeOverride`:

1. read original value and source revision;
2. map it to a scoped composition/theme reference;
3. validate and lock dependencies;
4. compare shadow resolution against legacy output;
5. write a new Object revision plus migration record;
6. retain the original field through the deprecation window;
7. switch read authority behind the component gate;
8. remove the legacy hardcoding only in Phase 14 after fallback evidence.

The same copy/verify/switch/remove pattern applies to `skin`, `icon`, `overlay`
and `atmosphere`.

## 21. Error behavior

Stable migration codes include:

- `migration_source_changed`
- `migration_schema_invalid`
- `migration_reference_unresolved`
- `migration_parity_failed`
- `migration_fallback_failed`
- `migration_window_portal_unsafe`
- `migration_workspace_offset_duplicate`
- `migration_layer_band_exceeded`
- `migration_user_content_changed`
- `migration_rollback_unavailable`

An error blocks that record/component/phase. It never triggers automatic
deletion of the legacy source.

## 22. Versioning

The plan targets contract `1.0.0`; schemas and runtime implementations keep
their own versions. Migration records pin validator/resolver versions and exact
target refs. A changed mapping creates a new migration-record version rather
than rewriting evidence.

Phase order changes require a reviewed major plan revision. Patch revisions may
clarify gates without weakening them.

## 23. Test requirements

- positive/negative fixture for every phase gate;
- interrupted/failed migration leaves source authoritative;
- repeat migration is idempotent;
- stale source revision conflict;
- shadow versus authoritative parity;
- every required fallback class;
- activation transaction and serialized transition;
- cross-browser containing-block/Window clipping matrix;
- 10,000 focus changes and layer recovery;
- one-and-only-one Workspace offset;
- user-content byte/string preservation;
- full historical-field mapping and removal precondition audit.

## 24. Risk register

| Risk | Control |
|---|---|
| Window coordinate/clipping regression | Phase 6 portal contract and browser fixtures |
| Double Workspace offset | one geometry owner and origin assertion |
| Unbounded z/focus | semantic bands and renormalization |
| Pixel drift during token/asset extraction | frozen Core Default and screenshot diff |
| Resolver ambiguity | fixed order/ties, trace and randomized tests |
| Function leaks into theme data | action-role descriptors and closed schemas |
| Builder bypasses runtime validation | one shared validator/resolver path |
| User labels are themed | ownership classification and preservation tests |
| Legacy removed too early | Phase 14 preconditions and adapter release window |

## 25. Open risks

- Exact source files may evolve; phase gates and contract ownership remain
  normative.
- Pixel parity can conflict with accessibility; approved accessibility fixes may
  intentionally differ and must be recorded.
- Long-lived historical data can extend adapter maintenance.
- Canvas/WebGL replacement is not required and must not be folded into this
  migration without a separate contract.
