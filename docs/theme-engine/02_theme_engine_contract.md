# Cosmos Theme Engine Contract

**Contract family:** Cosmos Theme Engine
**Contract version:** 1.0.0
**Status:** Technical specification
**Authority:** subordinate to Product Bible, Experience contracts and `Architecture_Review_V3.md`
**Audit input:** `01_current_webui_audit.md`

## 1. Purpose

This document defines the authoritative technical boundary of the Cosmos Theme Engine. It specifies identity, ownership, activation, registries, immutable functional boundaries, package forms, compatibility, lifecycle, failure isolation and the migration relationship to the current `ThemeRegistry`, `ThemeRuntime`, DOM presenter and CSS-token implementation.

The Theme Engine must allow a complete visual world or any individual visual component to be replaced without changing Cosmos data, behavior, navigation, interaction, state, permissions or user content.

This contract does not define concrete scene geometry, asset formats, override algorithms, renderer primitives or builder UI in detail. Those are defined by:

- `03_template_catalog.md`
- `04_environment_composition_contract.md`
- `05_asset_and_skin_contract.md`
- `06_override_resolution_contract.md`
- `07_renderer_contract.md`
- `08_theme_builder_contract.md`
- `09_migration_plan.md`
- `13_room_composition_system.md`

### 1.1 Room Composition refinement

Contract 1.1 refines, but does not remove, this contract through
`13_room_composition_system.md`.

The authoritative environment model is now:

- a Base owns Room identities and their connection graph;
- a Room references one architecture-only Room Shell;
- a Room Preset contains only Catalog Object references and default placement;
- Object Instances own placement and inheritable presentation choices;
- Function Containers own functional roles and Core descriptor bindings;
- graphics, Skins and assets never own function.

The existing monolithic Base Vertical Slice remains a compatible implementation
fixture and Core fallback. New Templates MUST NOT combine Room Shell geometry,
default furniture and Function Bindings into one canonical artifact.

## 2. Normative language

The words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT** and **MAY** are normative.

All identifiers, enum values, property names and error codes are case-sensitive.

## 3. Core decision

Cosmos Core defines:

- Object identity and data,
- behavior and capabilities,
- navigation and action targets,
- interactions and input semantics,
- Runtime states,
- permissions and authorization,
- persistent user content,
- Window capability and containment rules.

Templates define:

- functional roles,
- Asset Slots,
- layers,
- anchors,
- states exposed for presentation,
- Interaction Bounds,
- Layout Bounds,
- Visual Bounds,
- Effect Bounds,
- Label Bounds,
- safe areas and responsive mapping.

Skins define only:

- visual assets,
- materials,
- presentation tokens,
- declarative animation selections,
- state-specific visual variants,
- replacements for allowlisted, system-owned visible terms.

Themes and Skins MUST NOT define:

- executable behavior,
- application routes,
- Runtime service calls,
- permissions,
- new action types,
- Object identity,
- Object capabilities,
- user-content substitution,
- Window movement, resize, focus or persistence rules,
- hitboxes for system-critical Shell controls.

## 4. Terms

| Term | Definition |
|---|---|
| Theme | A Theme Object whose manifest recommends a coherent set of presentation components. |
| Full Theme | A Theme covering every required presentation group and declaring complete Core fallbacks. |
| Group Pack | A package covering one or more groups such as Windows, Base, Nodes or Icons. |
| Skin Pack | A validated collection of one or more Skins and their assets. |
| Single Skin | A Skin Pack with exactly one Skin. It does not use a different runtime mechanism. |
| User Composition | A persistent Object that records the user's active Theme, installed pack selections and scoped overrides. |
| Template | A Core-validated technical layout and interaction contract. |
| Object Template | A template for one visible or interactive Object role. |
| Environment Template | A template for an environment and its composition zones. |
| Composition | A declarative scene and selection graph that combines templates, Skins, assets and overrides. |
| Skin | A presentation definition targeting compatible template slots and renderer contracts. |
| Asset | A validated static or animated media Resource owned by a package or Project mapping. |
| Asset Slot | A typed presentation input declared by a Template or Renderer. |
| Renderer | Trusted Core rendering code selected by immutable renderer ID and driven by validated declarative parameters. |
| Render Context | Read-only Core data and presentation state supplied to a Renderer. |
| Functional Role | A Template-owned semantic role that may bind only to a Core-provided action descriptor. |
| Interaction Bounds | The Core-visible pointer/focus target of an object. |
| Layout Bounds | The region used for placement, collision and scene layout. |
| Visual Bounds | The intended visual artwork region; it may exceed Interaction Bounds. |
| Effect Bounds | The allowed visual overflow for glow, particles, trails and other non-interactive effects. |
| Label Bounds | The region reserved for Core- or user-owned text. |
| System Term | An allowlisted string key owned by Cosmos and replaceable by a Theme localization map. |
| User Content | Any user-provided name, tag, filename, text, description or other user-specific label. |
| Core Default | Bundled, immutable, always-available fallback definitions and assets. |
| Room Shell | Function-free architectural Template that publishes geometry, Placement Surfaces, Anchors, camera and layers. |
| Room Preset | Reference-only default arrangement of Catalog Objects for compatible Room Shells. |
| Catalog Object | Reusable visual/placement Object definition independent from Runtime function. |
| Function Container | Core-owned interaction and action-role contract attachable to compatible Object Instances. |
| Base Builder | User tool for Room management, placement, decoration, connections and presets. |

## 5. Contract artifacts

Contract 1.0 defines five implemented persisted or distributable artifact
kinds.

| Artifact | JSON Schema | Registry/owner |
|---|---|---|
| Theme Manifest | `schemas/theme-manifest.schema.json` | Theme Registry |
| Skin Pack / Single Skin | `schemas/skin-pack.schema.json` | Skin Registry and Asset Registry |
| Object Template | `schemas/object-template.schema.json` | Template Registry |
| Environment Template | `schemas/environment-template.schema.json` | Template Registry |
| Composition / User Composition | `schemas/composition.schema.json` | Object Service plus Theme Runtime active-state reference |

Contract 1.1 reserves additional artifacts whose schemas are the next
implementation gate:

| Planned artifact | Planned owner |
|---|---|
| Room Shell | Template Registry / future Shell Registry |
| Catalog Object | Template/Catalog Registry |
| Function Container Definition | Core Function Container Registry |
| Room Preset | Preset Registry or Object Service for user presets |
| Room Composition | Object Service |
| Base Composition | Object Service |

These planned artifacts MUST reuse the identity, versioning, validation,
security and dependency rules below. They are not implemented by the
documentation-only Contract 1.1 decision.

All artifacts MUST:

- declare `schemaVersion`,
- have one immutable namespaced ID,
- have one semantic artifact version,
- be validated before Registry registration or persistence,
- reject unknown top-level properties,
- reference other artifacts by immutable ID and explicit version range,
- remain declarative.

### 5.1 Identity format

IDs MUST:

- be lower-case ASCII,
- contain at least one namespace separator `.`,
- contain only `a-z`, `0-9`, `.`, `_` and `-`,
- begin and end with an alphanumeric character,
- be globally unique within their Registry category.

Recommended forms:

```text
cosmos.theme.cosmos
max.theme.fantasy
max.skin.node.cheeseball
cosmos.object-template.node.universal
cosmos.environment-template.base.standard-v1
max.composition.personal-cosmos
```

Display names are mutable metadata. IDs are immutable.

### 5.2 Versioning

Each artifact has:

- `schemaVersion`: integer version of the JSON shape,
- `version`: semantic version of the artifact,
- compatibility ranges for referenced APIs and dependencies.

Breaking changes to required fields, semantics, coordinate behavior, slot types or renderer input require a new major artifact version. A Template major version MUST use a new immutable template ID when old Skin compatibility cannot be maintained.

## 6. Package forms

### 6.1 Full Theme

A Full Theme MUST:

- use a Theme Manifest with `packageKind: "full-theme"`,
- declare an active recommendation for every required presentation group,
- reference compatible Skin Packs or Core defaults,
- define a complete token set through inheritance and fallbacks,
- remain usable when any optional component is unavailable.

Required presentation groups are:

- global world,
- Cosmos Map,
- Base Entry,
- Base Interior,
- Room,
- Workspace,
- Window,
- Companion,
- Icon,
- Node,
- Connection,
- system status and labels.

### 6.2 Group Pack

A Group Pack:

- uses `packageKind: "group-pack"`,
- targets one or more presentation groups,
- MAY include multiple Skin Packs,
- MUST NOT claim completeness outside its declared groups.

Examples:

- a complete Window and Icon pack,
- a Base and Room pack,
- a Node and Connection pack.

### 6.3 Skin Pack

A Skin Pack:

- contains one or more compatible Skin definitions,
- contains or references validated assets,
- may target one group or multiple closely related templates,
- has no active-theme authority by itself.

### 6.4 Single Skin

A Single Skin is represented by the same `skin-pack` schema with:

```json
{
  "packageKind": "single-skin",
  "skins": [
    {}
  ]
}
```

Exactly one Skin MUST be present.

### 6.5 User Composition

A User Composition:

- is a normal persistent Object,
- records the active Theme and ordered pack inputs,
- records scoped selection and override rules,
- can mix components from unrelated Themes and packs,
- never duplicates the represented Cosmos Objects,
- never becomes executable Extension code.

Example combinations that MUST be supported:

- Cosmos Ship/Base icon with a Fantasy Base interior,
- a Minecraft Room in a Fantasy Base,
- Project-specific Node Skins,
- different Skins on individual Nodes in one Project,
- an instance-specific Connection Skin.

## 7. Registry model

### 7.1 Theme Registry

The Theme Registry indexes validated Theme Manifests. It owns:

- identity uniqueness,
- metadata,
- artifact version availability,
- compatibility status,
- dependencies,
- activation eligibility.

It does not:

- activate Themes,
- resolve scoped overrides,
- load active assets,
- persist User Compositions.

### 7.2 Skin Registry

The Skin Registry indexes validated Skin definitions from Skin Packs and Single Skins. It supports queries by:

- target template ID,
- renderer ID,
- presentation group,
- supported state set,
- System Tags,
- user-owned organizational tags.

Tags support discovery. Tags do not replace compatibility declarations.

### 7.3 Template Registry

The Template Registry is a Core definition Registry. It indexes validated Object and Environment Templates by immutable ID and version.

Template definitions are data, not executable extensions. Core renderer implementations referenced by templates remain trusted Core code.

The Registry MUST provide:

- exact version resolution,
- version-range resolution,
- compatibility queries,
- dependency graph validation,
- immutable snapshots for one activation transaction.

### 7.4 Asset Registry

The Asset Registry indexes assets from validated Skin Packs and Theme packages. It owns:

- content-hash identity,
- package-relative path resolution,
- format and metadata validation,
- decoded-size metadata,
- poster and reduced-motion links,
- availability and cache state.

It does not own source files. Native files remain Resources.

### 7.5 Composition persistence

User Compositions are owned by Object Service and persisted as versioned Objects. Theme Runtime reads a validated immutable Composition snapshot for activation. Theme Runtime does not become the authoritative persistent store.

## 8. Theme Runtime responsibilities

Theme Runtime MUST own:

- loading validated definitions from Registries,
- choosing one active User Composition,
- deterministic override resolution,
- Resource and Asset resolution,
- declarative Renderer selection,
- presentation token scope construction,
- preview snapshots,
- activation and rollback,
- asset cache coordination,
- failure fallback,
- resolution tracing.

Theme Runtime MUST NOT:

- register artifacts,
- persist artifact definitions,
- mutate Cosmos Objects being represented,
- invoke domain actions because a Skin requests them,
- authorize access,
- execute package code.

## 9. Activation lifecycle

Every activation uses the existing serialized Shell transition concept.

```text
Request
  ↓
Freeze immutable Registry snapshot
  ↓
Validate active Composition
  ↓
Resolve dependency DAG
  ↓
Resolve required Templates and Core fallbacks
  ↓
Preflight assets and budgets
  ↓
Build scoped presentation snapshot
  ↓
Begin Shell transition
  ↓
Atomically swap presentation snapshot
  ↓
Verify required render roots
  ↓
Commit or roll back
  ↓
End Shell transition
```

Only one presentation activation or preview transition may commit at a time. Requests queue through `TransitionRuntime`.

### 9.1 Atomicity

The active presentation is one immutable snapshot. Partial activation is forbidden. Required definitions or fallbacks MUST resolve before swap.

### 9.2 Runtime-state preservation

Activation MUST preserve:

- current route and environment,
- camera and zoom,
- Object selection,
- Node positions,
- open Windows,
- Window bounds and focus,
- Workspace sessions,
- Tool state,
- notifications,
- unsaved user input.

### 9.3 Hot switching

Asset loading MAY be asynchronous before commit. The current presentation remains active until the replacement snapshot passes preflight.

## 10. Presentation scopes

Theme Runtime produces scoped presentation data for:

1. application root,
2. active environment,
3. Room or Workspace,
4. Project or Cluster,
5. Object instance,
6. state variant.

Scopes may expose CSS Custom Properties as a presentation backend, but CSS is not the contract. Canvas, SVG or other trusted render backends consume the same resolved snapshot.

## 11. User-content protection

### 11.1 Protected values

Themes MUST NOT replace, transform, hide or interpolate:

- Project names,
- Node names,
- user-created Workspace names,
- User Tags,
- filenames and paths,
- file contents,
- Knowledge content,
- user descriptions,
- conversation content,
- user-entered labels,
- any string marked `contentOwnership: "user"`.

Protected values bypass Theme term replacement and are passed directly to Label Slots.

### 11.2 Replaceable system terms

Themes MAY provide localized replacements only for allowlisted keys such as:

```text
system.base.name
system.room.name
system.workspace.kind
system.window.close
system.status.loading
system.status.error
system.navigation.quick-travel
system.companion.role
```

The key Registry belongs to Cosmos Core. A Theme cannot introduce replacement rules, regular expressions or selectors over rendered text.

If a term is missing, Core Default localization is used.

## 12. Functional invariants

The following are outside Theme control:

- navigation and Router records,
- action descriptors and targets,
- pointer, keyboard and accessibility semantics,
- Window capability matrix,
- Window containment and recovery,
- system-critical Close, Resize, Drag and focus hitboxes,
- Object selection and Context Menus,
- camera transform and zoom constraints,
- Node drag and collision rules,
- Connection meaning and endpoints,
- Workspace assignment and persistence,
- permissions and service ownership.

Templates MAY describe these bounds so creators can design around them. Skins MAY NOT change them.

## 13. Required Core Defaults

Core MUST ship:

- one default Theme Manifest,
- one default User Composition,
- required Object Templates,
- required Environment Templates,
- one default Skin for every required template/renderer combination,
- one default asset or code-native fallback for every required Asset Slot,
- one static reduced-motion fallback for every required animated visual,
- Core system terms.

Core Defaults:

- cannot be uninstalled,
- cannot be shadowed by duplicate IDs,
- are always part of the resolver tail,
- must render without external assets or network access.

## 14. Security model

Theme packages are data-only.

Forbidden content:

- JavaScript,
- TypeScript,
- HTML fragments,
- Python,
- executable binaries,
- external scripts,
- free-form shaders,
- code-bearing SVG,
- network-loaded active content,
- event-handler attributes,
- runtime expressions.

Allowed content:

- validated JSON,
- validated package metadata,
- allowlisted media formats,
- allowlisted declarative renderer parameters,
- strings for allowlisted system-term keys,
- typed presentation tokens.

The Extension Validation pipeline MUST reject a package containing undeclared or forbidden executable content even when that content is not referenced.

## 15. Compatibility

A Theme Manifest MUST declare compatibility with:

- Cosmos Runtime API,
- Theme Engine Contract,
- Template API,
- Renderer API,
- Asset API,
- optional Avatar API,
- supported platform capability profile.

Compatibility is evaluated from declared ranges and actual dependencies. Version numbers alone do not imply compatibility.

An incompatible package remains installed but inactive.

## 16. Data model

The canonical runtime model is:

```ts
interface ActivePresentationSnapshot {
  snapshotId: string;
  contractVersion: "1.0.0";
  compositionId: string;
  compositionVersion: string;
  registryRevision: string;
  resolvedAt: string;
  tokenScopes: ReadonlyMap<string, Readonly<Record<string, TypedTokenValue>>>;
  templateBindings: ReadonlyMap<string, ResolvedTemplateBinding>;
  skinBindings: ReadonlyMap<string, ResolvedSkinBinding>;
  assets: ReadonlyMap<string, ResolvedAsset>;
  resolutionTraceId: string;
}
```

This interface is conceptual and language-neutral. The JSON artifacts are defined by the schemas in `schemas/`.

### 16.1 Required snapshot properties

- immutable snapshot ID,
- exact active Composition identity/version,
- exact Registry revision,
- exact resolved artifact versions,
- read-only scoped values,
- trace correlation ID.

### 16.2 Optional snapshot properties

- preloaded optional assets,
- performance warnings,
- non-fatal fallback records,
- preview draft identity.

## 17. Validation rules

Activation validation MUST confirm:

1. all artifact schemas are valid,
2. all IDs and versions are valid,
3. required dependencies resolve,
4. dependency graphs are acyclic,
5. required Templates exist,
6. Skins target compatible Templates and Renderers,
7. every required Asset Slot resolves or has Core fallback,
8. system-term keys are allowlisted,
9. user-content rules are not present,
10. all renderer parameters satisfy the renderer schema,
11. asset budgets pass or have a documented degradation plan,
12. no executable content exists,
13. no presentation property violates protected geometry or layer rules.

## 18. Fallbacks

Fallback occurs per presentation request, not by replacing the whole Runtime state.

Resolution order ends with:

1. selected compatible Skin,
2. inherited compatible Skin,
3. active Theme recommendation,
4. Core Default Skin,
5. code-native emergency primitive.

A code-native emergency primitive MUST exist for:

- required Nodes,
- required Connections,
- Base Entry,
- Base/Room/Workspace environment visibility,
- Window chrome,
- Close and focus indication,
- loading and error state.

## 19. Error behavior

| Code | Meaning | Required behavior |
|---|---|---|
| `theme_schema_invalid` | JSON does not match schema | reject artifact before registration |
| `theme_incompatible` | API range mismatch | keep installed, inactive |
| `theme_dependency_missing` | required reference unavailable | reject activation; mark dependent unavailable |
| `theme_dependency_cycle` | cyclic manifest/pack/composition graph | reject deterministically |
| `theme_asset_invalid` | format, hash or sanitization failure | isolate asset; use fallback |
| `theme_budget_exceeded` | package or active-scene budget exceeded | degrade optional assets or reject required activation |
| `theme_renderer_incompatible` | renderer/template mismatch | use Core Default Skin |
| `theme_required_slot_missing` | no valid required slot binding | use Core fallback; activation fails only if Core is damaged |
| `theme_term_forbidden` | replacement key not allowlisted | reject term map |
| `theme_protected_content_violation` | attempts user-content replacement | reject package |
| `theme_activation_failed` | preflight or swap failure | roll back atomically |
| `theme_registry_corrupt` | Core definitions unavailable/inconsistent | activate code-native emergency presentation and report fatal diagnostics |

One invalid package MUST NOT prevent Cosmos startup.

## 20. Existing implementation disposition

### 20.1 Continue

| Existing element | Decision |
|---|---|
| `ThemeRegistry` concept | Continue as authoritative Theme-definition Registry, with versioned manifests and Registry status. |
| `ThemeRuntime` ownership | Continue for loading, activation, resource resolution and fallback. |
| `TransitionRuntime` | Continue as serialization boundary for activation and preview. |
| DOM CSS Custom Properties | Continue as one presentation backend for tokenized DOM components. |
| `data-theme-object` | Continue temporarily as diagnostics; later supplement with snapshot/composition IDs. |

### 20.2 Replace

| Existing element | Replacement |
|---|---|
| flat `ThemeDefinition.tokens: Record<string,string>` as complete Theme model | versioned Theme Manifest, Skin Packs, Templates and Composition |
| one global root token scope | hierarchical, typed presentation scopes |
| implicit component CSS as renderer | explicit Template/Renderer/Skin contracts |
| unbounded visual Z literals | semantic bounded layer contract |

### 20.3 Migrate

| Existing element | Migration target |
|---|---|
| 23 `--cosmos-*` tokens | typed semantic token catalog with temporary aliases |
| component-local hardcoded colors | Core Default Skin tokens/materials |
| CSS-drawn Companion, Ship, Pet, Furniture | Core Default declarative Skins or trusted renderers |
| current dynamic Connection SVG | Core declarative Connection Renderer |
| `skin` | exact Object-instance Skin override reference |
| `icon` | typed Icon Asset Slot binding |
| `overlay` | Workspace Environment Skin/Composition reference |
| `atmosphere` | Room ambient Skin/token preset |
| `themeOverride` | scoped Composition or Theme reference |

### 20.4 Deprecate

The untyped string properties `skin`, `icon`, `overlay`, `atmosphere` and `themeOverride` become deprecated after their typed replacements are persisted and round-trip tested. They MUST remain readable during the migration compatibility window.

Unused current tokens MUST NOT be preserved solely because they exist. Each is either mapped to a semantic token with an actual consumer or removed after the fallback parity gate.

## 21. Examples

### 21.1 Independent component mixing

```json
{
  "activeThemeRef": {
    "id": "max.theme.fantasy",
    "versionRange": "^2.0.0"
  },
  "packRefs": [
    {
      "id": "cosmos.skin-pack.base-entry.ship",
      "versionRange": "^1.0.0"
    },
    {
      "id": "alex.skin-pack.room.minecraft",
      "versionRange": "^1.4.0"
    }
  ]
}
```

### 21.2 Instance-specific Connection Skin

The Composition contains an override whose scope is `instance`, target object ID is the Connection Object ID and value is a compatible `connection` Skin reference. The represented endpoint IDs and provenance remain unchanged.

## 22. Test requirements

The Theme Engine MUST have automated tests for:

- schema acceptance and rejection,
- immutable ID and version rules,
- Registry duplicate handling,
- dependency and cycle detection,
- activation atomicity and rollback,
- Runtime-state preservation across hot switch,
- user-content protection,
- system-term allowlist enforcement,
- required fallback completeness,
- package security scanning,
- deterministic snapshot construction,
- compatibility rejection,
- one invalid package not blocking startup,
- all existing Window/Node/Base/Workspace functional contracts under at least two visually different Themes.

Golden fixtures MUST include:

- one Full Theme,
- one Group Pack,
- one Skin Pack,
- one Single Skin,
- one mixed User Composition,
- one incomplete package that falls back,
- one malicious package rejected for executable content.

## 23. Open risks

- Template and Renderer API evolution can fragment Skin compatibility if major-version discipline is weak.
- Large animated packs can cause memory pressure despite valid individual assets.
- A broad system-term allowlist could accidentally expose user-owned labels; ownership metadata must remain explicit.
- DOM, SVG and Canvas backends may produce small visual differences from one resolved snapshot.
- Legacy CSS can continue to create containing blocks or stacking contexts until migrated.
- Community SVG sanitization requires a conservative, maintained allowlist.

## 24. Acceptance criteria

This contract is satisfied when:

- every active visual request can be traced to Composition, Theme, Pack, Skin, Template, Renderer, Asset and fallback source,
- no Theme artifact can alter functional Runtime state,
- arbitrary combinations resolve deterministically,
- user content bypasses Theme text replacement,
- Core Default always produces a usable UI,
- package activation is data-only, validated and atomic,
- the current Cosmos Theme can be represented without losing existing behavior.
