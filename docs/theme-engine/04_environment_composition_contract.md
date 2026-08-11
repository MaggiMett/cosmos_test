# Environment Composition Contract

**Contract version:** 1.0.0
**Status:** Technical specification
**Schemas:** `schemas/environment-template.schema.json`, `schemas/composition.schema.json`

## 1. Purpose

This contract defines how Cosmos Map, Base Interior, individual Rooms and Workspaces are assembled from technical Templates, visual assets, functional Objects, renderers, labels and ambient layers.

It enables hybrid environments that combine:

- full background images,
- modular walls and surfaces,
- individual Doors,
- Workspace Entries,
- Companion,
- furniture and decoration,
- foreground art,
- ambient effects,
- Window and Surface layers.

Composition changes presentation and placement inside Template-authorized zones. It does not create domain behavior.

### 1.1 Contract 1.1 Room refinement

`13_room_composition_system.md` changes the unit of authoring, not the Core
functional invariants:

```text
Base Composition
└─ Room Composition
   ├─ Room Shell reference
   ├─ optional Room Preset origin
   ├─ Object Instances
   ├─ Function Containers
   └─ Decorations/material bindings
```

One Room Shell owns only architecture, camera, Placement Surfaces, Areas,
Anchors, light Anchors, safe areas and layers. Doors, Workspace furniture,
Companion visuals, furniture, lights, plants and decoration are no longer
required Shell zones.

The `EnvironmentTemplate + environmentScenes` model remains the compatibility
representation for the implemented Base Vertical Slice until new Room schemas
and a lossless adapter exist.

## 2. Terms

| Term | Definition |
|---|---|
| Scene | One resolved Environment instance. |
| Scene Tree | Ordered declarative hierarchy of scene nodes. |
| Scene Node | Group, surface, asset, functional object, renderer, label or ambient node. |
| Design Space | Template reference coordinate system in DU. |
| Runtime Space | Pixel coordinate system supplied by the active Environment Window. |
| Functional Object | A represented Core Object with an action descriptor and Template-owned Interaction Bounds. |
| Decorative Asset | Pointer-passive presentation with no action binding. |
| Action Descriptor | Read-only Core record identifying an available function and target. |
| Action Binding | Reference from a functional scene node to one compatible Action Descriptor. |
| Surface | Named Base/Room architectural area. |
| Placement Transform | position, scale, rotation, pivot and optional mirroring of a scene node. |
| Portal Layer | Geometry-neutral host for Windows and Shell surfaces. |
| Room Shell | Architecture-only environment chassis with Placement Surfaces and no function or furniture. |
| Catalog Object | Reusable visual and placement contract referenced by Object Instances. |
| Function Container | Functional role, Interaction Contract and Core descriptor binding independent from graphics. |
| Placement Binding | Semantic attachment of an Object Instance to one Surface, Area or Anchor. |

## 3. Environment kinds

Contract 1.0 defines:

- `cosmos-map`
- `base-interior`
- `room`
- `workspace`

Each active environment has exactly one Environment Template and one resolved scene Composition. Base and Room are separate environment identities even when rendered inside the same Base Environment Window.

For the Contract 1.1 target model, this sentence applies to the compatibility
representation. A Base is a Room collection/connection graph, and each active
Room resolves exactly one Room Shell plus one Room Composition. Base navigation
and Shell controls remain outside the Room Shell.

## 4. Ownership

### 4.1 Cosmos Core owns

- active environment identity,
- Environment Window bounds,
- Router navigation,
- available Rooms and Workspace assignments,
- functional Object identity,
- action descriptors and targets,
- action authorization,
- state and accessibility semantics,
- critical Shell controls,
- Window and Surface portal hosts.

### 4.2 Environment Template owns

- reference viewport,
- fit mapping,
- surfaces,
- safe areas,
- allowed functional roles,
- layout zones,
- anchors,
- layer bands,
- responsive constraints,
- required fallback regions.

### 4.3 Composition owns

- selected Skin/asset for each slot,
- declarative scene hierarchy,
- placement within allowed zones,
- local layer order within allowed bands,
- decoration,
- state-variant references,
- optional component enable/disable choices.

### 4.4 Skin owns

- visual assets,
- materials and tokens,
- declarative animation parameters,
- visual/effect extents within the Template contract.

## 5. Coordinate system

### 5.1 Design Space

Every Environment Template defines a positive reference width and height in DU. Origin is top-left. X increases right; Y increases down. Rotation is degrees clockwise.

### 5.2 Runtime mapping

For reference size `Rw × Rh` and Runtime content size `W × H`:

#### Contain

```text
s = min(W / Rw, H / Rh)
ox = alignmentX(W - Rw × s)
oy = alignmentY(H - Rh × s)
px = ox + duX × s
py = oy + duY × s
```

#### Cover

`cover` uses `max` and is allowed only for pointer-passive background/surface assets. Functional nodes continue using the Template's `contain` mapping.

#### Stretch

`stretch` is allowed only for explicitly stretchable decorative surfaces. It is forbidden for functional Objects, labels and critical bounds.

### 5.3 Responsive breakpoints

Environment Templates MAY declare alternate arrangements by Core capability profile:

- `compact`
- `standard`
- `wide`
- `ultrawide`

Breakpoints choose among prevalidated Template layouts. A Skin cannot add breakpoints.

### 5.4 Transform order

The canonical transform order is:

```text
Template mapping
→ Anchor translation
→ local position
→ pivot translation
→ rotation
→ scale/mirror
→ inverse pivot translation
```

This order is immutable within one Template major version.

## 6. Scene Tree data model

```ts
type SceneNodeKind =
  | "group"
  | "surface"
  | "asset"
  | "functional-object"
  | "renderer"
  | "label"
  | "ambient";

interface SceneNode {
  nodeId: string;
  kind: SceneNodeKind;
  parentNodeId?: string;
  anchorId: string;
  transform: PlacementTransform;
  layerBand: string;
  localOrder: number;
  visibleWhen?: string[];
  payload:
    | GroupPayload
    | SurfacePayload
    | AssetPayload
    | FunctionalObjectPayload
    | RendererPayload
    | LabelPayload
    | AmbientPayload;
}
```

The payload discriminator MUST equal `kind`. Skin selection is resolved through
Composition overrides rather than embedded in a scene node. The exact payload
fields and JSON representation are defined by `composition.schema.json`.

### 6.1 Required fields

Every scene node requires:

- unique `nodeId` within the Composition,
- `kind`,
- `anchorId`,
- transform,
- semantic layer band,
- bounded local order.

### 6.2 Optional fields

Depending on kind:

- parent node,
- state visibility,
- asset or Surface reference,
- Renderer reference and closed parameters,
- functional binding and typed bounds,
- label ownership,
- reduced-motion-capable Ambient Renderer.

Unknown kind-specific fields are rejected.

## 7. Scene node kinds

### 7.1 Group

A Group provides hierarchy and a shared transform. It has no Interaction Bounds and is pointer-passive.

Groups MUST form a tree. Cross-links and parent cycles are forbidden.

### 7.2 Surface

A Surface binds visual presentation to one Environment Template surface:

- Background
- Rear Wall
- Left Wall
- Right Wall
- Floor
- Ceiling
- Foreground
- Ambient

A Surface is pointer-passive. A Skin may provide one full-surface asset, tiles, modular segments or a trusted declarative renderer.

### 7.3 Asset

An Asset node is decorative by default. It cannot receive an Action Binding. It may be state-dependent and animated within the asset contract.

### 7.4 Functional Object

A Functional Object represents one existing Core Object or one required system control descriptor.

It contains:

- visual Skin/Renderer binding,
- Interaction Bounds reference,
- Layout Bounds reference,
- Visual and Effect Bounds,
- compatible Action Binding,
- state slots,
- accessibility label source.

It cannot exist without a Core Object/descriptor in Runtime mode. The Builder may hold an unbound draft, but validation blocks Apply/export as an activatable Composition when a required binding is absent.

### 7.5 Renderer

A Renderer node selects trusted Core rendering code and declarative inputs. It is pointer-passive unless nested inside a Functional Object whose Template owns the interaction.

### 7.6 Label

A Label references a Core label source:

- `system-term`,
- `object-display-name`,
- `object-status`,
- `user-content`.

Skins style Label Slots. User-content labels bypass Theme term replacement.

### 7.7 Ambient

Ambient nodes provide fog, particles, lighting overlays or video backgrounds. They are pointer-passive and respect reduced-motion and performance budgets.

## 8. Decorative versus functional insertion

### 8.1 Decorative asset insertion

Creating a decorative node produces:

- Asset binding,
- Visual Bounds,
- Effect Bounds,
- Transform,
- layer assignment,
- optional state visibility.

It produces no Interaction Bounds or Action Binding.

### 8.2 Functional object insertion

Creating a functional node produces atomically:

- Visual slot,
- Interaction Bounds instance from Template,
- Function Binding slot,
- State Slots,
- Anchor,
- Layout/Visual/Effect/Label Bounds,
- accessibility label source.

The Builder MUST NOT offer a functional node without these parts.

## 9. Action Binding

### 9.1 Core action roles

Initial allowlisted roles:

- `base.open`
- `base.close`
- `room.transition`
- `workspace.open`
- `workspace.close`
- `companion.open`
- `tool.open`
- `object.open`
- `object.context-menu`
- `navigation.travel`

### 9.2 Descriptor model

Core supplies:

```ts
interface ActionDescriptor {
  descriptorId: string;
  role: CoreActionRole;
  representedObjectId?: string;
  targetObjectId?: string;
  enabled: boolean;
  disabledReason?: string;
  accessibleName: string;
}
```

The Composition stores only `descriptorId` plus expected `role`. It does not store a route, callback, command string, service name or arbitrary arguments.

### 9.3 Validation

- bound role MUST match the Template functional role,
- descriptor MUST be available in the active environment,
- represented Object identity MUST remain Core-owned,
- disabled actions remain visible only if Template policy allows `unavailable`,
- missing optional descriptor hides or disables the node according to policy,
- missing required descriptor is a Core/environment error and uses Core fallback UI.

## 10. Base and Room hybrid composition

The following section documents the compatibility aggregate implemented by the
first Vertical Slice. For new authoring, the normative model is section 1.1 and
`13_room_composition_system.md`. “Supported functional role” no longer means
“embedded in the Room Shell.”

### 10.1 Required surfaces

Base/Room templates support:

- Background,
- Rear Wall,
- Left Wall,
- Right Wall,
- Floor,
- Ceiling,
- Foreground,
- Ambient.

Each may use:

- one image,
- multiple modular image segments,
- SVG vector art,
- declarative material,
- video with poster/fallback,
- a composite of those.

### 10.2 Functional scene roles

- Door,
- Workspace Entry,
- Companion,
- Base Exit,
- Room Transition,
- Tool Entry.

Door, Workspace Entry, Companion and Tool Entry are scene-configurable within Template zones. Base Exit and Window/Shell controls remain critical and immutable unless a future Core Template explicitly version-changes them.

### 10.3 Room mixing

Room Composition is resolved independently from Base Interior Composition. Therefore:

- a Fantasy Base may host a Minecraft Room,
- each Room may select a different Room Skin Pack,
- shared Window and Companion Skins may remain global,
- Room overrides do not change Base navigation or Room identity.

### 10.4 Function Container separation

A functional scene result is resolved from two independent records:

1. an Object Instance supplies Catalog Object reference, Visual/Effect Bounds,
   Placement Binding, Skin and animation presentation;
2. a Function Container supplies action role, Interaction Bounds,
   accessibility and Runtime descriptor compatibility.

Attaching them is atomic and validated. Reskinning, moving within valid
placement constraints or changing animation cannot change the action target.
Deleting a required visual invokes the Core fallback presentation without
deleting the represented Core Object.

## 11. Cosmos Map composition

Cosmos Map composition contains:

- global background,
- distant/near ambient layers,
- Project Galaxy renderer instances,
- Node renderer instances,
- Connection renderer instances,
- navigation and Base Entry anchors,
- Companion anchor,
- status surfaces.

Camera transform applies only to world-space nodes:

- Project Galaxies,
- Nodes,
- Connections.

Screen-space navigation, Base Entry, Companion and status layers remain outside the camera transform.

Skins cannot change this division.

## 12. Workspace composition

Workspace Environment composition contains:

- background/canvas visual,
- fixed Workspace Header visual slots,
- Tool Area visual slots,
- Window portal,
- Surface portal,
- modal portal.

Tool Window, Context Menu and Dialog hosts MUST be rendered through geometry-neutral portals that are not descendants of theme-controlled transforms, filters, perspective, backdrop filters or containment.

### 12.1 Coordinate invariant

Window Runtime owns one coordinate space. Theme-controlled environment nodes MUST NOT become containing blocks for Window portals.

This resolves the audited failure where:

- `backdrop-filter` creates a containing block,
- Workspace offsets are applied twice,
- Tool Windows and Context Menus move visually,
- `overflow:hidden` clips Tool Windows.

### 12.2 Portal hierarchy

```text
Application Shell
├─ Environment portal
│  ├─ Cosmos
│  ├─ Base/Room
│  └─ Workspace scene
├─ Window portal
├─ Surface portal
├─ Notification portal
└─ Modal portal
```

Theme effects may style portal contents through scoped tokens but cannot wrap or transform the portal roots.

## 13. Layer resolution

Final layer ordering is:

1. Environment priority from Core,
2. semantic layer band,
3. local order,
4. stable `nodeId` lexical tie-breaker.

Window focus order is resolved inside the bounded `window` band. It never changes global band order.

Focus ranks MUST be renormalized when:

- a Window opens/closes,
- rank exceeds the band capacity,
- a Workspace restores.

No active Tool Window may overtake Surface or Modal bands.

## 14. State composition

Core supplies a finite presentation state set per Template. Composition uses only:

- exact state name,
- boolean conjunctions over allowlisted state flags,
- reduced-motion capability,
- breakpoint profile.

Forbidden:

- arbitrary expressions,
- code,
- time-based conditions outside Renderer parameters,
- content-value comparisons,
- permission bypass conditions.

Tie resolution between state variants:

1. exact composite state,
2. exact primary state,
3. `default`,
4. Core overlay.

## 15. Invariants

- Scene Tree is acyclic.
- Node IDs are unique.
- Functional nodes bind only to Core descriptors.
- Decorative nodes are pointer-passive.
- Foreground and Ambient are pointer-passive.
- Visuals may exceed Interaction Bounds.
- Effects may not exceed Template Effect Bounds unless clipped.
- User-content labels are never Theme-replaced.
- Critical Shell hitboxes are immutable.
- Window portals are geometry-neutral.
- Environment Composition cannot mutate Runtime state.
- Every required slot has a Core fallback.

## 16. Validation rules

Validation rejects:

- unknown Template, Anchor, zone, band or functional role,
- transforms outside Template constraints,
- non-finite position, size, scale or rotation,
- zero/negative functional scale,
- scene cycles,
- duplicate node IDs,
- pointer-enabled decoration,
- action strings or arbitrary arguments,
- protected control modification,
- label source/term ownership mismatch,
- invalid state predicates,
- Surface nodes outside their named surface policy,
- Windows nested in theme-controlled scene nodes,
- unbounded layer values,
- missing required reduced-motion fallback.

## 17. Fallbacks

| Failure | Fallback |
|---|---|
| optional decorative node invalid | omit node and record warning |
| optional asset missing | slot fallback or omit |
| functional Skin missing | Core Default Skin in same Functional Object |
| functional descriptor unavailable | hide/disable based on Template policy |
| required descriptor missing | Core emergency control and environment diagnostic |
| Room Skin missing | active Theme Room recommendation, then Core Room |
| whole Composition invalid | last valid Composition; if none, Core Default |
| video unsupported | poster; then reduced-motion/static fallback |

## 18. Error behavior

| Code | Meaning |
|---|---|
| `composition_scene_cycle` | parent/child graph cycle |
| `composition_anchor_unknown` | missing Template anchor |
| `composition_action_invalid` | role/descriptor mismatch |
| `composition_bounds_violation` | transform exceeds allowed zone |
| `composition_layer_violation` | invalid semantic band/order |
| `composition_protected_control` | critical bounds modified |
| `composition_portal_violation` | Window/Surface host placed under scene effect |
| `composition_state_invalid` | unknown state/predicate |
| `composition_label_ownership` | Theme attempts protected text replacement |

Activated Compositions are never silently normalized. The Builder may offer an explicit repair command in draft state.

## 19. Versioning

Composition `schemaVersion` changes with JSON shape. Composition artifact `version` changes when saved/published.

Template major changes require explicit migration of placements. Composition loaders MUST NOT guess new anchors or bounds.

Builder drafts record:

- source Template exact version,
- source Registry revision,
- last validation revision,
- explicit migration status.

## 20. Example

```json
{
  "nodeId": "scene.base.workspace.left",
  "kind": "functional-object",
  "anchorId": "anchor.workspace.left",
  "transform": {
    "x": 0,
    "y": 0,
    "scaleX": 1,
    "scaleY": 1,
    "rotation": 0,
    "pivotX": 0.5,
    "pivotY": 0.5
  },
  "layerBand": "scene",
  "localOrder": 20,
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
      "x": 180,
      "y": 360,
      "width": 240,
      "height": 260
    },
    "interactionBounds": {
      "type": "rect",
      "x": 220,
      "y": 410,
      "width": 160,
      "height": 180
    },
    "anchorIds": [
      "anchor.workspace.left",
      "anchor.workspace.left.interaction"
    ]
  }
}
```

The runtime supplies the compatible descriptor. A separate resolver assignment
may select `max.skin.workspace.enchanted-desk`; the scene node does not embed
navigation, a Workspace instance ID or a handler.

## 21. Test requirements

Tests MUST cover:

- DU-to-pixel mapping for contain/cover/stretch,
- transform order and asymmetric pivots,
- breakpoint selection,
- Scene Tree cycle rejection,
- decorative pointer passivity,
- functional object atomic creation,
- action role compatibility,
- two Door/two Workspace Base composition,
- Room-specific override isolation,
- user label protection,
- state variant fallback,
- semantic layer ordering,
- bounded focus order under 10,000 focus changes,
- Window portal immunity to ancestor `filter`, `backdrop-filter`, `transform`, `perspective`, `contain` and `overflow`,
- no duplicate Workspace offset,
- Window recoverability and clipping prevention.

## 22. Open risks

- Complex scene trees can create excessive DOM or draw calls without aggressive batching.
- Fit-mode differences can cause artwork cropping on ultrawide displays.
- Free placement inside zones can still harm usability; Builder diagnostics must check occlusion and minimum target size.
- Runtime descriptor IDs are ephemeral and cannot be embedded in distributable generic packs.
- Portal separation may require a deliberate migration of scoped CSS selectors and event boundaries.
