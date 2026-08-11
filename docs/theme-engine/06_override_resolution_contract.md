# Override Resolution Contract

Status: normative specification
Contract family: Cosmos Theme Engine `1.0.0`
Schema: `schemas/composition.schema.json`

## 1. Purpose

This contract defines deterministic selection of themes, skins, tokens, assets,
templates and renderer parameters across Cosmos scopes. It makes modular mixing
possible while guaranteeing a Core Default, stable diagnostics, bounded
evaluation and no dependency cycles.

## 2. Scope order

The precedence order is fixed, highest first:

1. exact instance;
2. selection rule, including tag selectors;
3. cluster;
4. project;
5. room;
6. environment;
7. global User Composition;
8. active Theme;
9. Core Default.

No registry insertion order, DOM order, CSS cascade, object creation time or
filesystem order may change this precedence.

## 3. Terms

- **User Composition**: a versioned persistent Cosmos Object holding the user's
  active package set and overrides.
- **Override assignment**: a declarative value associated with one scope and
  target.
- **Candidate**: an assignment compatible enough to be evaluated.
- **Selector**: typed predicates over Core-owned object metadata.
- **Resolution target**: a presentation group, template role, asset slot, token,
  material channel or renderer parameter.
- **Trace**: an ordered explanation of candidates, rejections and winner.
- **Dependency graph**: references among composition, packages, templates,
  skins and renderers.

## 4. User Composition data model

A composition contains:

- `compositionId`, semantic `version` and `schemaVersion`;
- `resolverVersion`;
- `activeThemeRef`;
- ordered `packRefs`;
- optional parent composition references;
- `scopes`: addressable environment/project/room/cluster aliases;
- `overrides`: immutable-ID assignments;
- optional authored environment scene compositions;
- metadata and revision information.

The Object Service persists the composition. Theme Registry, Skin Registry,
Template Registry and Asset Registry persist definitions. Theme Runtime creates
an immutable resolved snapshot for activation.

Contract 1.1 introduces `BaseComposition` and `RoomComposition` as spatial
domain documents. They are not aliases for User Composition:

- Base/Room Composition owns Room identities, Object Instances, Placement
  Bindings and Function Container attachments;
- User Composition owns active Theme/package selection and presentation
  overrides;
- Theme Runtime resolves the two immutable inputs without allowing User
  Composition to rewrite spatial or domain identity.

## 5. Assignment model

Each override assignment has:

| Field | Required | Meaning |
|---|---:|---|
| `assignmentId` | yes | Stable namespaced ID used for deterministic ties |
| `enabled` | yes | Explicit activation flag |
| `scope` | yes | One scope level and typed scope address |
| `target` | yes | Presentation group plus optional role/slot/channel |
| `value` | yes | Skin/template/asset/token/material/renderer selection |
| `priority` | yes | Bounded integer `-1000..1000` within its tie class |
| `selector` | rule only | Typed predicates |
| `note` | no | Author-facing annotation; non-semantic |

An assignment MUST specify only presentation. It cannot carry function actions,
permissions, runtime object mutations or user-content replacements.

### 5.1 Invariants

- One immutable `assignmentId` identifies one semantic assignment.
- Scope precedence cannot be changed by priority or load order.
- Required targets cannot resolve to `disabled`.
- A resolution evaluates immutable snapshot data only.
- Every lookup terminates at Core Default.

## 6. Scope addresses

- `instance`: immutable Core Object ID and optional object kind.
- `rule`: selector evaluated over one object/context.
- `cluster`: immutable cluster ID.
- `project`: immutable Project ID.
- `room`: immutable Room ID.
- `environment`: environment instance ID or environment kind.
- `composition-global`: the current composition.
- `active-theme`: implicit values from the active Theme.
- `core-default`: implicit immutable fallback.

Exported generic packs MUST NOT depend on local instance/project/room IDs.
Those scopes belong in User Composition. A composition export may include them
only when explicitly marked as installation-local and not distributable.

## 7. Selection rules

Allowed selector predicates are:

- object kind equals/in set;
- template role equals/in set;
- Core-owned hierarchy level equals/range;
- exact tag ID or tag namespace membership;
- state equals/in set;
- environment/room/project/cluster identity;
- boolean Core-owned presentation traits published to Theme Runtime.

Selectors MUST NOT inspect:

- arbitrary user label text or file content;
- DOM structure/classes;
- secrets, permissions or capability payloads;
- time, randomness, network or mutable global variables;
- regular expressions over unbounded user content.

Predicates form an `all` list plus optional `any` and `not` lists. Evaluation is
side-effect free. A selector has a computed specificity:

| Predicate | Weight |
|---|---:|
| exact immutable ID | 100 |
| exact tag ID | 40 |
| object kind/template role | 20 |
| hierarchy/state/trait | 10 |
| namespace/range/set predicate | 5 |

Specificity is the sum of matched predicate weights, capped at `1000`. This
algorithm is part of `resolverVersion` and cannot change silently.

## 8. Deterministic winner algorithm

For one target, Theme Runtime:

1. builds the context using immutable Core metadata;
2. expands active composition/package dependencies in locked version order;
3. gathers assignments addressing the target;
4. rejects disabled, incompatible, unresolved or selector-failing candidates;
5. groups remaining candidates by fixed scope precedence;
6. selects the first non-empty scope group;
7. sorts within that group by:
   1. higher selector specificity;
   2. higher explicit `priority`;
   3. later `packRefs` order for intentionally layered user packs;
   4. lexical ascending `assignmentId`;
8. validates the winner's referenced value;
9. on value failure, records the failure and evaluates the next candidate;
10. terminates at a valid value or Core Default.

For non-rule scopes specificity is `0`. Exact instance always outranks a rule,
even if the rule has maximum priority. `packRefs` ordering is stored in the
composition and never inferred from load timing.

Duplicate `assignmentId` values in the dependency closure are invalid.

## 9. Merge and replace semantics

Selection references (`skinRef`, `templateRef`, `assetRef`, `rendererRef`) are
replace-only.

Typed maps (`tokenValues`, compatible material parameters) merge per key. Each
key is resolved independently through the same precedence algorithm.

Lists are replace-only unless their owning contract explicitly provides stable
element IDs and an element-wise merge. Scene tree children, renderer layers and
animation keyframes are never index-merged. This prevents order-dependent
results.

An explicit `disabled` value is allowed only for optional decorative targets.
Required functional visuals, functional scene nodes, critical hitboxes and
Core Default cannot be disabled.

## 10. Modular mix targets

Assignments may independently target:

- global world;
- map;
- Base Entry Icon;
- Base Interior;
- each Room;
- Workspace environment;
- Window class or instance;
- Companion;
- icon role;
- Node kind/hierarchy or exact instance;
- Connection kind or exact instance;
- labels/status visuals;
- environment ambient layers.

Package forms map to the same resolver:

- Full Theme supplies a complete active-theme baseline;
- Group Pack supplies one or more presentation groups;
- Skin Pack supplies reusable target skins;
- Single Skin supplies one target skin;
- User Composition selects and overrides all of them.

There is no separate precedence algorithm for any package form.

### 10.1 Room Object Instance property provenance

`13_room_composition_system.md` extends exact-instance resolution with
per-property inheritance modes. The scope order in section 2 does not change.

At minimum, Room Object Instances persist independent channels for:

- position;
- rotation;
- scale;
- Skin selection;
- animation selection.

Each channel is `inherit`, `pinned` or `reset-to-parent`.

- `inherit` accepts the winning Room/environment/global/Theme/Core value;
- `pinned` is an exact-instance user value and survives active Theme, Room
  preset and lower-scope changes;
- `reset-to-parent` is an explicit command that removes the local pin and
  resolves the parent chain again.

Theme activation MUST NOT rewrite or delete pinned values. Room-level
assignments affect only inherited channels. Function Container attachment,
action role, descriptor target and permissions are not presentation override
channels.

Preset updates use a stable-identity three-way merge between old preset
baseline, current instance and new preset baseline. A placement made invalid by
an incompatible Shell major version is preserved and marked for explicit
repair; the resolver MUST NOT guess a replacement Surface or coordinate.

## 11. Dependency graph and cycle prevention

Nodes include composition versions, theme/pack versions, skin versions,
template versions and renderer versions. Directed edges are declared
references. Registration:

1. resolves every range to an exact compatible version;
2. builds a closed graph;
3. runs deterministic cycle detection;
4. rejects any strongly connected component with more than one node or a
   self-loop;
5. stores the acyclic lock graph.

Runtime MUST NOT break a cycle by arbitrary ordering. Maximum dependency depth
is 32 and maximum nodes in one activation closure is 4096 by default.

## 12. State resolution

Core state is an input dimension, not an override scope. After a skin/material
winner is found, Theme Runtime resolves the most specific declared visual state
variant. State matching order is:

1. exact combined state key published by template;
2. ordered individual states defined by template priority;
3. template `default`;
4. skin base presentation;
5. fallback skin.

Themes cannot manufacture a state or transition. Unknown states are recorded
and displayed with the nearest default.

## 13. Token and asset resolution

For every requested token or asset slot, the resolver records:

- target identity;
- context identities;
- ordered candidates;
- selector match result and specificity;
- compatibility result;
- winning assignment and package version;
- fallback steps;
- final typed value or digest;
- resolver and snapshot versions.

Asset slots also apply state binding and media capability fallback from the
Asset and Skin Contract. Token aliases are allowed only as explicit acyclic
references inside a package; alias depth is capped at 16.

## 14. Resolution trace API

Theme Runtime exposes a read-only diagnostic operation conceptually equivalent
to:

```ts
resolveWithTrace(request: {
  snapshotId: string;
  objectId?: string;
  environmentId?: string;
  target: PresentationTarget;
  state: readonly string[];
}): {
  value: ResolvedPresentationValue;
  trace: ResolutionTrace;
}
```

The trace is serializable and contains stable reason codes, not DOM details.
Builder Test Mode and developer diagnostics consume the same trace engine as
production. Trace generation MUST NOT mutate caches or runtime state.

## 15. Snapshot and cache behavior

An activated snapshot contains exact versions, assignment order, compiled
selectors, resolved dependency graph and a composition revision. It is
immutable.

Cache keys include:

- snapshot ID;
- resolution target;
- relevant context IDs and presentation traits;
- Core state vector;
- media/reduced-motion capability profile.

Changes build a new snapshot. The old snapshot remains usable until serialized
transition commit. No partial cache invalidation may expose a mixture of old and
new composition data.

## 16. Activation transaction

Activation is:

1. load and lock dependency graph;
2. schema/security/compatibility validation;
3. compile selectors and verify targets;
4. dry-resolve all required Core paths;
5. allocate an immutable candidate snapshot;
6. preview without changing active behavior;
7. request the single Theme Transition Runtime;
8. atomically commit the candidate snapshot;
9. retain the last known good snapshot for rollback.

Failure before commit leaves the active snapshot unchanged. A rendering failure
after commit rolls back presentation only; Core Object and navigation state are
not reset.

## 17. Validation

Validation MUST detect:

- unknown/duplicate assignment IDs;
- invalid or installation-leaking scope addresses;
- forbidden selector predicates;
- out-of-range priority/specificity complexity;
- missing targets or incompatible values;
- attempts to disable required objects;
- dependency and token alias cycles;
- ambiguous package order;
- forbidden user-content term replacement;
- absent Core Default chain;
- unresolved required presentation groups.

Full Theme validation requires baseline coverage for world, map, Base Entry,
Base Interior, Room, Workspace, Window, Companion, icons, Nodes, Connections,
labels and status visuals.

## 18. Fallback behavior

Every lookup terminates at Core Default. Failure at one candidate does not
promote a lower scope above a still-valid higher-scope candidate. When all
candidates at the winning scope fail, evaluation continues at the next scope.

Required template or renderer incompatibility causes candidate rejection.
Optional decorative data may resolve to `none` only when the target explicitly
allows it.

Emergency primitives are trusted Core renderers for required doors, exits,
window controls, node hit targets and navigation indicators.

## 19. Errors and reason codes

- `resolve_target_unknown`
- `resolve_scope_invalid`
- `resolve_selector_forbidden`
- `resolve_selector_too_complex`
- `resolve_assignment_duplicate`
- `resolve_value_incompatible`
- `resolve_required_disabled`
- `resolve_dependency_cycle`
- `resolve_dependency_depth`
- `resolve_version_unsatisfied`
- `resolve_alias_cycle`
- `resolve_core_default_missing`
- `resolve_user_content_forbidden`

Candidate trace reasons include `matched`, `scope-lower`, `selector-failed`,
`incompatible`, `missing`, `disabled`, `budget-degraded` and `winner`.

## 20. Versioning

`resolverVersion` is semantic and pinned by the composition. A patch may fix
diagnostic text or an implementation bug without changing winners. Any change
to precedence, selector weights, tie-breaking, merge semantics or state
selection is a major resolver version.

A migration tool may produce a new composition version after comparing old and
new traces. Silent reinterpretation is forbidden.

## 21. Example

```json
{
  "assignmentId": "user.cosmos.node.urgent",
  "enabled": true,
  "scope": { "level": "rule" },
  "selector": {
    "all": [
      { "field": "objectKind", "operator": "equals", "value": "node" },
      { "field": "tagId", "operator": "equals", "value": "user.tag.urgent" }
    ]
  },
  "target": { "presentationGroup": "node", "role": "node.standard" },
  "value": {
    "kind": "skin-ref",
    "ref": { "id": "example.alert.node", "versionRange": "^2.0.0" }
  },
  "priority": 100
}
```

An exact instance override for the same Node wins regardless of the rule's
specificity and priority.

## 22. Required tests

- one fixture for every adjacent precedence pair;
- exact instance versus maximum-priority rule;
- specificity, priority, pack order and lexical tie-breaks;
- identical result across randomized registry/load order;
- per-key token merge and list replacement;
- optional disable versus required-disable rejection;
- dependency, token alias and self cycles;
- depth/node-count bounds;
- version range lock and missing dependency;
- state variant fallback;
- media and reduced-motion cache separation;
- exhaustive trace reasons;
- activation atomicity and rollback;
- Core Default termination for every required target;
- no substitution of user-owned labels.

## 23. Open risks

- Tag-based rules can be numerous; compiled indices are needed without changing
  semantics.
- Installation-local exact IDs make compositions less portable and need export
  warnings.
- Per-key token resolution can generate large traces; diagnostics should be
  lazy while winner selection stays identical.
- New selector fields require privacy and determinism review.
- A future collaborative composition editor will need revision conflict rules
  above, not inside, this resolver.
- Per-property pins increase trace size and require an explicit reset/inherit
  experience; hiding provenance would make Theme changes appear inconsistent.
