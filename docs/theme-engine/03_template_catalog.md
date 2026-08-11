# Cosmos Template Catalog

**Contract version:** 1.0.0
**Status:** Technical specification
**Schemas:** `schemas/object-template.schema.json`, `schemas/environment-template.schema.json`

## 1. Purpose

This document defines the initial authoritative catalog of Object Templates and Environment Templates. Templates are technical design surfaces shared by all Themes. They expose stable roles, regions, bounds, anchors, states, layers and typed Asset Slots while Cosmos Core retains behavior.

The first fully specified vertical slice is `cosmos.environment-template.base.standard-v1`.

## 1.1 Room Composition catalog refinement

`13_room_composition_system.md` supersedes the granularity assumption of the
first Base Vertical Slice without invalidating its tests or fallback role.

New catalog work distinguishes:

- architecture-only Room Shell Templates;
- Catalog Object Templates;
- Room Presets containing references only;
- Function Container definitions;
- independent Room and Base Composition artifacts.

`cosmos.environment-template.base.standard-v1` / `base.main-room.v1` is now a
legacy compatibility aggregate. It MUST remain readable, but MUST NOT be copied
as the structure for new Room Shells.

## 2. Terms

| Term | Definition |
|---|---|
| Design Unit (DU) | Backend-neutral unit in a template reference coordinate system. |
| Region | Named technical area with one bounds role. |
| Slot | Typed insertion point for a Skin asset, renderer output or Core label. |
| Anchor | Named point and pivot used to place scene items. |
| Functional Slot | Region connected to a Core-provided functional Object/action descriptor. |
| Decorative Slot | Region with no action binding and no interaction authority. |
| State Slot | Optional visual replacement or overlay for one Core presentation state. |
| Critical Hitbox | Shell-owned Interaction Bounds that no Theme, Composition or Builder may modify. |
| Art Template Export | Creator-facing technical package generated from one template version. |

## 3. Universal template data model

Every Template MUST define:

- immutable `templateId`,
- `schemaVersion`,
- semantic `version`,
- `templateKind`,
- reference viewport,
- coordinate mapping,
- supported states,
- layer bands,
- anchors,
- bounds regions,
- Asset Slots,
- compatibility metadata,
- Core fallback reference.

Object Templates additionally define:

- one or more functional roles,
- critical versus scene-configurable Interaction Bounds,
- Renderer compatibility,
- scale rules.

Environment Templates additionally define:

- environment kind,
- surface zones,
- safe areas,
- scene roots,
- allowed functional object roles,
- responsive fit rules.

## 4. Bounds model

Each independently designed object can expose these bounds:

| Bounds | Owner | Purpose | Theme mutability |
|---|---|---|---|
| Interaction Bounds | Core or scene Template | pointer, focus and activation | scene Objects may be positioned/scaled within Template limits; critical Shell controls are immutable |
| Layout Bounds | Template | placement, collision and flow | immutable shape per Template version |
| Visual Bounds | Template default, Skin may declare actual extent | intended artwork extent | Skin may be smaller or larger if within Effect Bounds policy |
| Effect Bounds | Template | permitted non-interactive overflow | immutable maximum per Template version |
| Label Bounds | Template | Core/user text placement | Skin may style but not replace protected content |

A Visual or Effect Bounds region MAY extend beyond Interaction Bounds. Visible overflow MUST NOT become interactive unless included in Interaction Bounds by the Template.

Bounds shapes are:

- rectangle,
- ellipse,
- polygon.

Rotation applies around a declared pivot. Bounds are transformed from Template DU to Runtime pixels by the owning Environment mapping.

## 5. Universal layer bands

Templates use semantic layers. Numeric order is local to the active environment and constrained to `-1000..1000`.

| Band | Default range | Purpose |
|---|---:|---|
| `background` | -1000..-801 | far background |
| `architecture-rear` | -800..-601 | rear wall, distant surfaces |
| `ambient-rear` | -600..-501 | rear fog/light |
| `scene-rear` | -500..-201 | rear objects |
| `scene` | -200..199 | functional objects and furniture |
| `scene-front` | 200..499 | foreground scene objects |
| `ambient-front` | 500..699 | particles/light overlays |
| `foreground` | 700..799 | non-interactive frame/foreground |
| `labels` | 800..849 | scene labels |
| `navigation` | 850..899 | environment navigation |
| `window` | 900..939 | bounded Window stack |
| `surface` | 940..969 | menus, popovers and notifications |
| `modal` | 970..999 | modal attention |
| `emergency` | 1000 | Core-only emergency UI |

Themes may choose local order inside an allowed band. They cannot move a functional scene item into `window`, `surface`, `modal` or `emergency`.

## 6. Initial catalog

### 6.1 Environment Templates

| ID | Version | Kind | Required |
|---|---:|---|---:|
| `cosmos.environment-template.cosmos-map.standard-v1` | 1.0.0 | Cosmos Map | yes |
| `cosmos.environment-template.base.standard-v1` | 1.0.0 | Base Interior | yes |
| `cosmos.environment-template.room.standard-v1` | 1.0.0 | Room | yes |
| `cosmos.environment-template.workspace.standard-v1` | 1.0.0 | Workspace | yes |

### 6.2 Object Templates

| ID | Version | Role | Required |
|---|---:|---|---:|
| `cosmos.object-template.base-entry.standard-v1` | 1.0.0 | Base Entry in Cosmos | yes |
| `cosmos.object-template.node.universal-v1` | 1.0.0 | all Node hierarchy levels | yes |
| `cosmos.object-template.connection.universal-v1` | 1.0.0 | structural/semantic/discovery Connection | yes |
| `cosmos.object-template.project-galaxy.standard-v1` | 1.0.0 | Project environment cluster | yes |
| `cosmos.object-template.navigation.position-v1` | 1.0.0 | current position and travel | yes |
| `cosmos.object-template.workspace-entry.standard-v1` | 1.0.0 | Room Workspace furniture/object | yes |
| `cosmos.object-template.door.standard-v1` | 1.0.0 | Room transition | yes |
| `cosmos.object-template.companion.standard-v1` | 1.0.0 | Companion presentation | yes |
| `cosmos.object-template.pet.standard-v1` | 1.0.0 | Pet presentation | optional |
| `cosmos.object-template.window.environment-v1` | 1.0.0 | fixed Environment Window | yes |
| `cosmos.object-template.window.tool-v1` | 1.0.0 | movable/resizable Tool Window | yes |
| `cosmos.object-template.window.surface-v1` | 1.0.0 | Context Menu/Popover | yes |
| `cosmos.object-template.dialog.standard-v1` | 1.0.0 | modal confirmation | yes |
| `cosmos.object-template.notification.standard-v1` | 1.0.0 | notification item/indicator | yes |
| `cosmos.object-template.icon.standard-v1` | 1.0.0 | system icon | yes |
| `cosmos.object-template.status.standard-v1` | 1.0.0 | loading/error/empty state | yes |

### 6.3 Room catalog families

Contract 1.1 reserves these reusable Catalog Object families:

- Door;
- Workspace Furniture;
- Furniture;
- Decoration;
- Plant;
- Light;
- Surface Material;
- Window;
- Architecture Object.

Every family declares placement metadata and compatible Skins independently
from function. Door and Workspace Furniture MAY declare compatibility with a
Function Container role, but the Catalog Object itself contains no action.

## 7. Node Template

### 7.1 Purpose

`cosmos.object-template.node.universal-v1` defines one interaction model for Project, Domain, Cluster, Object and Detail Nodes while allowing radically different visual Skins.

### 7.2 Required roles

- `node.interaction`
- `node.visual`
- `node.effect`
- `node.label`
- `node.selection`
- `node.focus`

### 7.3 Reference geometry

The universal Node Template uses a 100 × 100 DU Layout Bounds and a centered origin.

| Region | Default bounds |
|---|---|
| Interaction | centered 80 × 80 DU circle |
| Layout | centered 100 × 100 DU rectangle |
| Visual | centered 64 × 64 DU rectangle |
| Effect | centered 160 × 160 DU rectangle |
| Label | x -95, y 45, width 190, height 40 DU |

The default Skin MAY be asymmetrical. Its `visualPivot` and `interactionPivot` remain independent.

### 7.4 Hierarchy scaling

One Universal Node Skin MUST work for every hierarchy level.

Default visual scale factors:

| Node type | Scale |
|---|---:|
| ProjectRoot | 1.00 |
| Domain | 0.66 |
| Cluster | 0.52 |
| Object | 0.42 |
| Detail | 0.30 |

Interaction Bounds remain Template-owned. A hierarchy-specific Skin MAY replace the Universal Skin when compatible. Resolution first requests the specific Node type and then falls back to Universal.

### 7.5 Required states

- `default`
- `hover`
- `focus-visible`
- `selected`
- `dragging`
- `disabled`
- `loading`
- `error`
- `search-result`
- `destination`

Skins may omit optional variants. Missing variants inherit `default` plus Core state overlays.

### 7.6 Invariants

- Node identity and label come from Core.
- Protected labels cannot be replaced.
- Interaction semantics are identical for every hierarchy level.
- A Visual or Effect layer may exceed Interaction Bounds.
- No visual overflow may intercept pointer input.
- Drag/collision geometry uses Layout/Interaction Bounds, not painted pixels.

## 8. Connection Template

### 8.1 Purpose

`cosmos.object-template.connection.universal-v1` exposes one passive Connection representation that is not restricted to CSS or a single SVG stroke.

### 8.2 Required roles

- `connection.base-path`
- `connection.border`
- `connection.glow`
- `connection.repeating-texture`
- `connection.moving-objects`
- `connection.particles`
- `connection.start-cap`
- `connection.end-cap`
- `connection.midpoint-decoration`

### 8.3 Geometry

Core supplies:

- start point,
- end point,
- resolved path geometry,
- path length,
- tangent sampling,
- provenance,
- endpoint visual radii,
- clipping zones at endpoints.

The Template defines Effect Bounds as the path envelope plus a maximum effect radius. The Connection is pointer-passive in Contract 1.0.

### 8.4 States

- `default`
- `emphasized`
- `muted`
- `related-node-hover`
- `selected-endpoint`
- `discovery`
- `structural`
- `semantic`
- `disabled`

## 9. Window Templates

### 9.1 Tool Window

Required regions:

- Header/Drag Handle,
- Title Label,
- Close Control,
- Content,
- eight Resize regions,
- Focus Ring,
- Shadow/Effect.

Critical hitboxes:

- Header Drag Handle,
- Close,
- N/NE/E/SE/S/SW/W/NW Resize,
- focus surface.

No Skin or Composition can change their geometry. Visual controls may be larger or smaller inside the declared Visual Bounds, but critical Interaction Bounds remain Core-owned.

### 9.2 Environment Window

The Environment Window is fixed in Contract 1.0. Its Close control is critical. The content Environment Template receives the Core-calculated content bounds.

### 9.3 Surface Window

Context Menus and Popovers inherit owner bounds and dismissal behavior. A Skin may change material and shape but not:

- focus order,
- item activation,
- outside-click dismissal,
- Escape handling,
- owner clamping.

## 10. Base Entry Template

The universal system role is `Base`. `Ship` is one Skin of `cosmos.object-template.base-entry.standard-v1`.

Required regions:

- Base Entry Visual,
- Base Entry Interaction,
- Base system label,
- hover/focus state,
- optional Effect Bounds,
- optional Companion adjacency anchor.

Core action binding is `base.open`. A Skin cannot replace the action or target route.

## 11. Base Vertical Slice

**Compatibility status:** retained prototype and migration source. The surfaces,
zones and cardinality below describe the implemented aggregate fixture. In the
target Room Composition System, Shell surfaces move to a Room Shell; Doors,
Workspaces and Companion become Catalog Object Instances; their actions move to
Function Containers; Base Exit remains outside the Room Shell.

### 11.1 Identity

```text
templateId: cosmos.environment-template.base.standard-v1
version: 1.0.0
referenceViewport: 1600 × 900 DU
fitMode: contain
```

### 11.2 Purpose

This is the first complete Environment Template contract and the reference for the Theme Builder, Art Template Exporter and migration of `BaseView.vue`.

It supports:

- two Door zones,
- two Workspace Entry zones,
- one Companion anchor,
- Background,
- Left Wall,
- Right Wall,
- Rear Wall,
- Foreground,
- Ambient layer.

It additionally reserves Floor and Ceiling surfaces to satisfy the universal Base/Room composition contract.

### 11.3 Environment surfaces

| Surface ID | Bounds in DU | Layer | Required |
|---|---|---:|---:|
| `surface.background` | 0,0,1600,900 | -950 | yes |
| `surface.rear-wall` | 250,80,1100,500 | -720 | yes |
| `surface.left-wall` | 0,0,360,900 | -700 | yes |
| `surface.right-wall` | 1240,0,360,900 | -700 | yes |
| `surface.floor` | 180,520,1240,380 | -650 | yes |
| `surface.ceiling` | 180,0,1240,220 | -680 | yes |
| `surface.foreground` | 0,650,1600,250 | 740 | yes |
| `surface.ambient` | 0,0,1600,900 | 560 | yes |

Surface Visual Bounds may overlap. Surface Interaction Bounds are empty.

### 11.4 Functional zones

| Zone ID | Functional role | Interaction Bounds DU | Layout Bounds DU | Anchor |
|---|---|---|---|---|
| `door.left` | `room.transition` | 100,240,180,380 | 70,210,240,440 | `anchor.door.left` |
| `door.right` | `room.transition` | 1320,240,180,380 | 1290,210,240,440 | `anchor.door.right` |
| `workspace.left` | `workspace.open` | 300,350,360,300 | 260,300,440,380 | `anchor.workspace.left` |
| `workspace.right` | `workspace.open` | 940,350,360,300 | 900,300,440,380 | `anchor.workspace.right` |
| `companion.primary` | `companion.open` | 690,420,220,330 | 650,380,300,420 | `anchor.companion.primary` |

Each zone permits Visual Bounds up to its Layout Bounds plus its declared Effect Bounds. Visuals may extend beyond Interaction Bounds.

### 11.5 Critical system zones

The Base Environment Close/Base Exit control remains Shell-owned:

| Zone ID | Role | Mutability |
|---|---|---|
| `system.base-exit` | `base.close` | position, size and focus bounds immutable |

The Art Template Exporter shows this zone, but the Theme Builder cannot move, resize, rotate, delete or rebind it.

### 11.6 Cardinality

| Role | Minimum | Maximum |
|---|---:|---:|
| Door | 0 | 2 |
| Workspace Entry | 0 | 2 |
| Companion | 1 | 1 |
| Base Exit | 1 | 1 |

The Template supports two Doors. Runtime instantiates only functional Objects for which Core supplies an action descriptor. Missing Door data does not authorize the Theme to invent a destination. An unavailable Door slot may be visually absent or render Core `unavailable`, according to Composition policy.

### 11.7 Safe areas

| Safe area | Bounds DU | Rule |
|---|---|---|
| `safe.system-top-right` | 1450,0,150,150 | no scene interaction or label may overlap |
| `safe.center-path` | 620,300,360,600 | keep primary navigation path readable |
| `safe.label-bottom` | 250,760,1100,120 | shared status/label reserve |

### 11.8 Depth order

Default order:

```text
Background
Rear Wall
Left/Right Wall
Ceiling
Floor
Rear ambient
Doors and Workspaces
Companion
Front ambient
Foreground
Labels
Shell controls
```

Themes may reorder scene items only inside their allowed layer bands. Foreground and Ambient Layers MUST remain pointer-passive.

### 11.9 States

Environment states:

- `loading`
- `ready`
- `error`
- `active`
- `background`
- `transition-in`
- `transition-out`
- `reduced-motion`

Functional object states:

- `default`
- `hover`
- `focus-visible`
- `selected`
- `opening`
- `unavailable`
- `notification`

### 11.10 Vertical Slice example (registry excerpt)

```json
{
  "schemaVersion": 1,
  "templateId": "cosmos.environment-template.base.standard-v1",
  "version": "1.0.0",
  "templateKind": "environment",
  "displayName": "Standard Base",
  "environmentKind": "base-interior",
  "compatibility": {
    "themeEngine": "^1.0.0"
  },
  "referenceViewport": {
    "width": 1600,
    "height": 900,
    "unit": "du",
    "origin": "top-left"
  },
  "coordinateMapping": {
    "decorativeFit": "cover",
    "functionalFit": "contain",
    "alignment": "center"
  }
}
```

This excerpt shows identity and coordinate policy. The full artifact additionally
contains surfaces, zones, safe areas, anchors, layers, scene roots, states and
fallbacks and MUST conform to `environment-template.schema.json`.

## 12. Art Template Export

Every Template Registry entry MUST be exportable into one deterministic Art Template package.

Required outputs:

| File | Purpose |
|---|---|
| `clean-design-template.png` | clean artwork guide without technical overlays |
| `zone-overlay.png` | named Visual/Layout zones |
| `hitbox-overlay.png` | Interaction Bounds and functional role IDs |
| `safe-area-overlay.png` | protected/reserved regions |
| `depth-layer-overlay.png` | layer bands and ordering |
| `template.svg` | vector template with named groups and IDs |
| `template.json` | exact machine-readable Template |
| `ART_BRIEF.md` | human-readable purpose, atmosphere freedoms, invariants and export metadata |

### 12.1 Export invariants

- all raster exports use the reference viewport resolution,
- SVG group IDs equal Template IDs or region IDs,
- colors in overlays come from the exporter standard, not the active Theme,
- no user content is included,
- the JSON hash is embedded in PNG metadata, SVG metadata and Art Brief,
- exports are reproducible from the same Template version,
- overlays do not become Runtime assets automatically.

### 12.2 Vehicle-livery principle

The export behaves like a vehicle livery kit:

- technical attachment points and hitboxes are fixed,
- artists may draw within and beyond Visual Bounds,
- Effect Bounds define maximum safe overflow,
- protected safe areas remain clear,
- artwork cannot redefine function or interaction.

## 13. Validation rules

A Template is invalid when:

- IDs or versions are missing,
- a required bounds role is absent,
- a critical hitbox is marked theme-mutable,
- a layer lies outside its allowed band,
- an Anchor references an unknown region,
- an Asset Slot has no type or Core fallback when required,
- bounds contain non-finite or negative sizes,
- polygons self-intersect,
- scale constraints can produce zero or negative size,
- a Label Slot permits replacement of user-owned content,
- a functional role is not in the Core action-role Registry,
- dependencies or inheritance contain a cycle.

## 14. Fallbacks

- Unknown Template ID → Core Default Template for the requested role.
- Incompatible major version → compatible Core Default; requested Skin is skipped.
- Missing optional region → region omitted.
- Missing required region in a non-Core Template → Template rejected.
- Missing state variant → `default` region/asset plus Core state overlay.
- Unsupported hierarchy-specific Node Skin → Universal Node Skin with automatic scale.

## 15. Error behavior

| Code | Behavior |
|---|---|
| `template_invalid` | reject before registration |
| `template_role_unknown` | reject functional role |
| `template_bounds_invalid` | reject affected Template |
| `template_critical_bounds_mutable` | reject security/interaction violation |
| `template_layer_invalid` | reject or normalize only in Builder draft; never normalize activated artifacts silently |
| `template_dependency_cycle` | reject graph |
| `template_export_failed` | preserve Template; return actionable export diagnostics |

## 16. Versioning

Patch:

- metadata correction,
- Art Brief correction,
- non-semantic exporter annotation.

Minor:

- optional Slot,
- optional state,
- additional compatible Anchor,
- expanded Effect Bounds that does not affect layout.

Major/new Template ID:

- changed required role,
- changed critical Interaction Bounds,
- changed coordinate mapping,
- changed Layout Bounds affecting placement,
- removed/renamed Slot,
- changed renderer compatibility.

## 17. Test requirements

Tests MUST cover:

- schema validation for every catalog entry,
- bounds transform at minimum, reference and ultrawide viewports,
- Visual overflow without pointer interception,
- critical hitbox immutability,
- Node hierarchy scaling,
- asymmetric Node pivot behavior,
- all required Base Vertical Slice regions,
- two Door/two Workspace capacity,
- missing action descriptor behavior,
- layer ordering and pointer-passive ambient/foreground,
- deterministic Art Template exports,
- PNG/SVG/JSON metadata hash equality,
- Core fallback for each catalog role.

## 18. Open risks

- A single 1600 × 900 Base reference may not fit every future room topology; new topology requires a new Environment Template, not a Skin hack.
- Polygon hitboxes improve scene fidelity but increase builder and accessibility complexity.
- Effect overflow can cause excessive overdraw if budgets are too permissive.
- Template proliferation can fragment Skin compatibility; the catalog should remain deliberately small.
- The second Door zone is not always backed by current Runtime data and must never invent navigation.
