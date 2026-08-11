# Theme Builder Contract

Status: normative product and technical specification
Contract family: Cosmos Theme Engine `1.0.0`

## 1. Purpose

Theme Builder is a Cosmos User Tool for authoring, previewing, validating,
applying and exporting declarative theme artifacts. It is not Theme Runtime and
does not receive privileged renderer or behavior APIs.

The implemented first vertical slice historically authors
`cosmos.environment-template.base.standard-v1` with two Door zones, two
Workspace zones, a Companion anchor and hybrid environment surfaces. Contract
1.1 retains this only as a compatibility fixture.

## 1.1 Terms

- **Builder project**: versioned editable draft, distinct from a registered
  package.
- **Command**: atomic reversible document mutation.
- **Functional insertion**: one transaction creating Visual, Interaction,
  Function, State and Anchor bindings.
- **Test fixture**: typed simulated runtime context that cannot be exported as
  behavior.
- **Apply**: validate, register, preview, transition and atomically activate.

## 1.2 Invariants

- Draft editing never changes production Core Objects.
- Save may preserve an invalid draft; Apply and export may not.
- Properties enforce the same schemas as import/runtime validation.
- Critical hitboxes and safe areas remain read-only.
- Test Mode dispatches only to the sandbox tracer.
- Undo/redo operations are atomic and deterministic.

## 1.3 Builder responsibility correction

`13_room_composition_system.md` establishes two tools with non-overlapping
authority.

Theme Builder authors the catalog:

- Room Shell Templates;
- Catalog Object Templates;
- Skins, materials, tokens and declarative animations;
- asset import, validation and management;
- Art Packs and catalog package import/export.

Base Builder uses the catalog:

- Room management and connections;
- furnishing, placement and decoration;
- Function Container attachment to Core descriptors;
- Room Preset creation/application;
- instance customization and placement repair.

There is no Room Builder. Theme Builder MUST NOT edit persistent user Room
instances. Base Builder MUST NOT edit Templates, Skins, materials, animations
or source assets.

Sections 5, 6, 9, 10, 12, 18 and 19 describe capabilities proven by the
monolithic Base fixture. For new Room authoring, scene placement operations in
those sections belong to Base Builder; Theme Builder uses equivalent Canvas
operations only inside a Shell or Catalog Object draft.

## 2. Product placement

- Runs inside Cosmos in a Graphics Workspace.
- Persists editable drafts separately from registered packages.
- Uses Resource Service for imported assets.
- Uses the same schemas, Template Registry, Renderer Registry, resolver and
  validators as runtime.
- Registration and activation are explicit, transactional operations.
- Does not modify Core Objects while editing or testing.

Theme Builder is a System/User Tool boundary consumer. Theme Runtime remains
Core infrastructure.

### 2.1 Base Builder product boundary

Base Builder persists Base Composition, Room Composition, Object Instances,
Function Container attachments and Room Presets through Object Service. It
consumes the same Template, Skin, Asset and future Catalog Registries as Theme
Runtime.

Base Builder may preview catalog assets but has no import/sanitization pipeline
for creating them. “Use catalog object” and “edit catalog object” are separate
commands belonging to separate tools.

## 3. Required regions

The tool has six persistent conceptual regions:

1. **Scene Tree** — hierarchy, visibility, lock, type, state and layer.
2. **Canvas** — scene editing, overlays, zoom/pan and direct manipulation.
3. **Properties** — typed fields for the current selection.
4. **Asset Library** — import, metadata, compatibility and usage.
5. **State Preview** — Core-published visual states and reduced-motion profile.
6. **Test Mode** — hitbox/action trace without production side effects.

Responsive layouts may dock/collapse regions, but every capability remains
reachable by keyboard.

## 4. Document data model

A Builder project contains:

- project identity and revision;
- target schema/contract versions;
- package kind and package metadata;
- editable theme/skin/template/composition documents;
- scene tree(s);
- Resource Service draft asset references;
- validation findings;
- command history metadata;
- preview profile;
- export settings.

Draft documents may be temporarily invalid during a command, but every
committed command must leave them structurally serializable. Save supports
invalid drafts and records findings. Apply/export do not.

## 5. Scene Tree

Scene node kinds match the Environment Composition Contract:

- group;
- surface;
- asset;
- functional object;
- renderer;
- label;
- ambient.

Each node has stable `nodeId`, parent, semantic layer, local transform,
state visibility and typed payload. Builder-only editor metadata stores lock and
temporary visibility controls separately; those controls are not exported into
the runtime Composition. Node IDs never depend on array index.

The tree forbids cycles, multiple parents and duplicate IDs. Reordering writes
explicit stable order. Global z-index is never exposed.

## 6. Canvas coordinate model

Canvas edits template Design Units. For the first Base slice:

- reference viewport: `1600 × 900 DU`;
- functional mapping: `contain`;
- origin: top-left;
- transforms: translate, rotate, scale around explicit pivot;
- zoom/pan affect the editor view only.

The Canvas can display independently:

- artwork;
- functional zone overlay;
- Interaction/Visual/Layout/Effect/Label Bounds overlay;
- safe-area overlay;
- depth/layer overlay;
- anchors and constraint diagnostics.

Preview profiles include at least reference, narrow, wide and ultrawide
viewports.

## 7. Selection and properties

Properties are schema-generated and grouped as:

- Identity;
- Visual;
- Interaction;
- Function;
- State;
- Anchors;
- Bounds;
- Transform;
- Layer;
- Assets/materials;
- Accessibility;
- Performance.

Fields identify their owner (`Core`, `Template`, `Skin`, `Composition`) and
whether they are read-only in the current artifact. Raw JSON may be inspected
but editing it cannot bypass the same validator.

## 8. Asset workflow

Import:

1. choose/drop PNG, WebP, SVG, WebM or MP4;
2. copy to draft Resource Service quarantine;
3. detect signature and decode metadata;
4. sanitize SVG or validate video fallbacks;
5. hash bytes;
6. show budget/security findings;
7. assign an asset ID and draft package path;
8. expose only compatible slots.

The library shows format, dimensions, bytes, digest, uses, required poster and
reduced-motion bindings, and license/provenance metadata. Replacing an asset is
a command that updates digest/provenance and marks dependent previews dirty.

## 9. Insertion operations

### 9.1 Decorative insertion

Creates atomically:

- a scene asset/ambient node;
- Visual and Effect Bounds;
- transform, layer and state visibility;
- asset slot/binding or material reference.

It creates no Interaction Bounds or action.

### 9.2 Functional insertion

Creates atomically:

- **Visual** binding/presentation node;
- **Interaction** Bounds linked to a template functional zone;
- **Function** action-role binding to a runtime-supplied descriptor;
- **State** mapping from Core-published states;
- **Anchors** for visual, interaction, label and transition placement.

If any constituent is invalid, none is committed. The builder cannot invent an
action descriptor or permission. Missing runtime descriptors appear as
unbound/disabled preview states, not simulated working navigation.

### 9.3 First-slice functional palette

- Door 1 (`base.open` / Room transition supplied by context);
- Door 2 (optional, same compatible descriptor family);
- Workspace Entry 1;
- Workspace Entry 2;
- Companion anchor;
- Base Exit, Core-required and not removable.

The exact action roles are validated against the Base Template. A second Door or
Workspace visual does not create a new Room/Workspace.

## 10. Direct manipulation

For Contract 1.1, Room-instance manipulation below is a Base Builder
responsibility. Theme Builder manipulation is limited to Template-local bounds,
Anchors, slots and artwork contracts.

The user can:

- drag/place;
- resize;
- rotate where allowed;
- change layer within the permitted semantic band;
- bind anchors;
- edit permitted bounds independently;
- bind asset/material/state;
- duplicate optional decorative objects;
- disable optional objects.

Critical functional zones, safe areas and Window Close/Resize/Drag/focus
hitboxes are immutable. Attempted edits produce a finding and no command.

Snapping is semantic-first. Catalog Object placement metadata selects compatible
floor, wall, ceiling, architecture or Object Anchors before edge/center
alignment and optional grid refinement. The resulting numeric transform and
semantic Placement Binding are serialized; transient snap candidates are not.
Hard surface/contact/clearance rules cannot be bypassed by disabling soft snap.

## 11. State Preview

State Preview enumerates states declared by the selected template/renderer.
Core state is read-only. The editor can choose a preview state vector and
capability profile:

- default/hover/pressed/selected/focused/disabled/active/error where applicable;
- reduced motion;
- reduced effects;
- high contrast;
- media unavailable;
- fallback-only.

Previewing does not write state variants unless the user explicitly edits a
variant. Missing variants show their fallback source and resolution trace.

## 12. Test Mode

Test Mode uses a sandbox action tracer. Pointer/keyboard interaction:

- draws the chosen hitbox;
- reports scene node, functional role and descriptor compatibility;
- shows would-dispatch action and required context;
- shows resolver trace and selected visual;
- never calls navigation, Object mutation, filesystem/network, Tool launch or
  production permissions.

The mode can simulate descriptor availability using typed fixtures marked
“simulation”. Fixtures cannot be exported as runtime action descriptors.

Required tests include tab order, minimum target size, overlap/occlusion,
off-canvas recovery, state feedback and reduced-motion presentation.

## 13. Undo and redo

All document mutations are commands with:

- stable command ID;
- document revision before/after;
- typed payload;
- inverse or reversible snapshot;
- affected artifact IDs;
- validation delta.

Compound operations such as functional insertion and asset replacement are one
transaction. Undo/redo never crosses apply/export registration boundaries.
Saving does not clear history. A divergent command after undo truncates the redo
branch; future collaborative history is out of scope.

Default bounds:

- 500 commands or 128 MiB of command payload;
- older commands compact into a clean checkpoint;
- imported asset bytes are referenced by digest, not copied per command.

## 14. Save

Save persists an editable draft through Object/Resource Services:

- optimistic revision check;
- canonical schema-shaped JSON;
- draft asset refs;
- validation findings and preview settings;
- no registration or activation.

Revision conflict blocks overwrite and offers reload or explicit save-as-copy.
Autosave may create revisions but cannot apply a theme.

## 15. Validate

Validation combines:

1. JSON Schema;
2. template/renderer/slot compatibility;
3. asset security/budgets;
4. scene graph and bounds;
5. functional zone/cardinality/action roles;
6. resolver determinism/cycles;
7. fallback completeness;
8. accessibility;
9. portability and protected user content;
10. vertical-slice export completeness.

Findings have severity:

- `error`: blocks registration/apply/export;
- `warning`: permitted but requires visibility;
- `info`: author guidance.

Each includes stable code, artifact ID, JSON pointer/scene node, message,
suggested remediation and optional Canvas focus target.

## 16. Apply

Apply is transactional:

1. save or snapshot the draft;
2. validate with zero errors;
3. seal assets and create package versions;
4. register definitions atomically;
5. build a candidate User Composition revision;
6. dry-resolve required presentation;
7. preview candidate snapshot;
8. request Theme Transition Runtime;
9. commit composition and activation;
10. retain last known good snapshot.

Cancel/failure before commit changes no active presentation. Failure after
commit triggers presentation rollback. Applying never resets navigation,
window, selection, Object or permission state.

## 17. Export

Runtime package export produces:

- canonical JSON manifest/artifacts;
- sanitized content-addressed assets;
- dependency/version declarations;
- validation report;
- optional human-readable summary;
- no draft history, absolute paths or test fixtures.

The first Base Art Template export additionally produces:

1. clean PNG;
2. functional zone overlay PNG;
3. hitbox/bounds overlay PNG;
4. safe-area overlay PNG;
5. depth/layer overlay PNG;
6. SVG reference;
7. JSON specification;
8. Markdown Art Brief.

All raster overlays use the same `1600 × 900` reference and include a legend
outside or within the declared documentation margin. SVG and JSON coordinates
must agree within `0.5 DU`.

## 18. Vehicle-livery principle

The Base is a stable functional chassis; a theme is a livery/interior treatment.
The Art Brief must separate:

- immutable chassis: reference viewport, functional zones, critical safe areas,
  action roles and required anchors;
- configurable bodywork: surfaces, decorative layers, permitted bounds and
  assets;
- livery: materials, colors, textures, icons and animation.

Artwork may radically change the apparent shape, including a Ship skin, but
cannot move behavior outside the authored functional geometry or redefine
“Base” as a different domain object.

## 19. First vertical slice acceptance

The Base template project is complete when:

- all eight hybrid surfaces exist: Background, Rear, Left, Right, Floor,
  Ceiling, Foreground, Ambient;
- two Door zones and two Workspace Entry zones are independently placeable;
- a Companion anchor exists;
- Base Exit is present and immutable;
- decorative and functional insertion are atomic;
- all five overlays can be toggled and exported;
- narrow/wide/ultrawide previews preserve usable functional zones;
- state and reduced-motion fallbacks pass;
- generated JSON validates against the schemas;
- Test Mode produces action/resolution traces without side effects;
- clean/art overlays, SVG, JSON and Art Brief export together.

## 20. Errors

- `builder_document_revision_conflict`
- `builder_scene_cycle`
- `builder_layer_forbidden`
- `builder_critical_edit_forbidden`
- `builder_function_role_invalid`
- `builder_descriptor_unavailable`
- `builder_asset_invalid`
- `builder_bounds_invalid`
- `builder_safe_area_violation`
- `builder_required_zone_missing`
- `builder_validation_blocked`
- `builder_registration_failed`
- `builder_activation_failed`
- `builder_export_incomplete`

## 21. Fallbacks

- Failed preview renderer uses its trusted fallback and marks the preview.
- Missing optional descriptor shows disabled/hidden according to template.
- Missing required descriptor is an environment/context error and blocks
  apply for that bound composition.
- Lost draft assets show a placeholder and validation error.
- Apply failure leaves the active snapshot unchanged or restores the last known
  good one.
- Builder itself can open with Core Default even if the authored theme fails.

## 22. Versioning

Builder project format, schema artifacts and target package versions are
separate. Opening an older draft performs an explicit reversible draft
migration and records the source version. It never mutates a registered package
in place.

Exports pin exact schema generation and semantic versions. A newer Builder may
export an older supported contract only through that contract's validators.

## 22.1 Example functional insertion result

```json
{
  "nodeId": "user.scene.workspace-entry-1",
  "kind": "functional-object",
  "anchorId": "base.anchor.workspace-1.visual",
  "layerBand": "scene",
  "localOrder": 10,
  "transform": {
    "x": 0,
    "y": 0,
    "rotation": 0,
    "scaleX": 1,
    "scaleY": 1,
    "pivotX": 0,
    "pivotY": 0
  },
  "payload": {
    "kind": "functional-object",
    "functionalZoneId": "base.zone.workspace-1",
    "actionRole": "workspace.open",
    "descriptorBinding": {
      "source": "runtime-context",
      "descriptorRole": "workspace.open"
    },
    "visualBounds": {
      "type": "rect",
      "x": 1040,
      "y": 350,
      "width": 240,
      "height": 260
    },
    "interactionBounds": {
      "type": "rect",
      "x": 1080,
      "y": 400,
      "width": 160,
      "height": 180
    },
    "anchorIds": [
      "base.anchor.workspace-1.visual",
      "base.anchor.workspace-1.interaction"
    ]
  }
}
```

The draft references a descriptor role; it does not embed a Workspace ID,
navigation handler or capability.

## 23. Required tests

- region keyboard reachability and selection synchronization;
- scene cycles, duplicate IDs and stable reorder;
- coordinate transforms across all preview profiles;
- decorative versus functional atomic insertion;
- forbidden critical hitbox edit;
- asset quarantine/sanitize/hash/budget path;
- state/fallback/reduced-motion preview;
- sandbox Test Mode proves zero production dispatch;
- command inversion, compound undo and history compaction;
- draft revision conflict;
- apply atomicity, rollback and state preservation;
- export contains no local paths/test fixtures;
- eight required Base outputs plus Art Brief;
- SVG/JSON/raster coordinate agreement;
- two Doors/two Workspaces/Companion/Base Exit cardinality;
- usability overlay checks at narrow/wide/ultrawide.

## 24. Open risks

- Schema-generated property panels may need custom editors without creating a
  second validation model.
- Visual authoring of complex Connection renderers is beyond the first slice
  but must reuse the same command/document model.
- Exact raster parity varies by browser/device; reference exports need a pinned
  rendering profile.
- Large draft assets and history require Resource Service garbage collection.
- Collaborative editing is intentionally deferred and must not be improvised
  through last-write-wins.
- Without a visible tool boundary, users may expect Base Builder to create
  assets or Theme Builder to edit live Rooms; navigation and terminology must
  preserve the catalog-versus-instance distinction.
