# Renderer Contract

Status: normative specification
Contract family: Cosmos Theme Engine `1.0.0`

## 1. Purpose

This contract defines the trusted rendering boundary between Core behavior,
templates and theme-controlled presentation. It specifies renderer selection,
layer composition, bounds, state input, Connection primitives, safety,
performance degradation and failure recovery. Themes never ship renderer code.

## 1.1 Terms

- **Renderer definition**: versioned Registry metadata for one trusted Core
  implementation.
- **Render request**: immutable, typed presentation input for one target/frame.
- **Render plan**: bounded semantic output validated before mount/draw.
- **Renderer role**: compatibility category such as Node or Connection.
- **Semantic layer**: template-owned ordering name mapped by Core to a bounded
  runtime layer.
- **Emergency renderer**: minimal trusted Core fallback for a required target.

## 1.2 Invariants

- Renderer code is installed with trusted Core, never with a theme.
- A render request cannot expose actions, permissions or mutable Core Objects.
- Interaction geometry is never inferred from pixels.
- Required render paths terminate at an emergency renderer.
- Theme data cannot create global stacking contexts or escape its layer band.

## 1.3 Room Composition refinement

Under `13_room_composition_system.md`, a Room render request may combine:

- Room Shell architecture;
- Catalog Object Instance visuals;
- Skin/material/animation presentation;
- a separate Function Container interaction contract.

The Renderer receives presentation state and geometry only. Function Container
action descriptors remain outside Renderer parameters and draw plans. A
Renderer fault may replace the visual with a Core fallback, but cannot detach,
retarget or execute the Function Container.

## 2. Ownership

Core owns:

- all renderer implementations and registration;
- mapping Core state to typed renderer input;
- Interaction Bounds and event dispatch;
- layout constraints and critical safe areas;
- resource decoding, draw scheduling and budgets;
- accessibility semantics and reduced-motion preference;
- fallback renderers and error isolation.

Templates own:

- renderer role and compatible renderer IDs;
- geometry/bounds contracts;
- layer and material channels;
- supported visual states;
- asset slots and renderer parameter schema.

Skins/compositions may select a compatible renderer and provide validated
assets/materials/parameters. They do not receive DOM, Canvas, WebGL or service
access.

## 3. Renderer data model and field requirements

Renderer Registry stores immutable versioned definitions:

| Field | Required | Meaning |
|---|---:|---|
| `rendererId` | yes | Stable namespaced identity |
| `version` | yes | Semantic version |
| `rendererRole` | yes | e.g. `connection`, `node`, `icon`, `surface` |
| `implementationId` | yes | Trusted Core implementation identifier |
| `compatibleTemplateRoles` | yes | Closed role set |
| `parameterSchema` | yes | Closed JSON Schema for declarative parameters |
| `materialChannels` | yes | Named typed paint inputs |
| `assetSlotTypes` | yes | Accepted media kinds |
| `stateInputs` | yes | Template-published state vocabulary |
| `layerOutputs` | yes | Semantic output layers |
| `boundsPolicy` | yes | Permitted Visual/Effect overflow |
| `capabilities` | yes | DOM/SVG/Canvas/video and feature requirements |
| `fallbackRendererRef` | yes | Acyclic trusted fallback |

Registry contains definitions, not current state. Theme Runtime selects a
definition in an immutable snapshot.

## 4. Render request

Conceptual input:

```ts
type RenderRequest = {
  snapshotId: string;
  objectRef: { objectId: string; objectKind: string };
  templateRef: VersionedRef;
  rendererRef: VersionedRef;
  state: readonly string[];
  geometry: {
    layoutBounds: Shape;
    visualBounds: Shape;
    effectBounds: Shape;
    labelBounds?: Shape;
    anchors: Readonly<Record<string, Point>>;
  };
  presentation: {
    assets: Readonly<Record<string, ResolvedAsset>>;
    tokens: Readonly<Record<string, TypedValue>>;
    materials: Readonly<Record<string, Material>>;
    parameters: Readonly<Record<string, JsonValue>>;
  };
  capabilities: RenderCapabilityProfile;
};
```

The request contains no action handler, service reference, permission token or
mutable Core Object. Interaction remains on the Core-controlled sibling/overlay
defined by the template.

## 5. Render output

A renderer produces a bounded render plan:

- semantic layer entries;
- resource/draw commands limited to its implementation;
- actual Visual and Effect extents;
- optional label placement suggestions;
- performance counters and degradation markers;
- diagnostics.

Output MUST NOT:

- create interaction targets;
- mutate Core state;
- navigate;
- escape the template layer band;
- render user content after system-term substitution;
- insert arbitrary HTML;
- observe unrelated objects.

Core clips only where the template declares clipping. Effects may exceed Visual
Bounds within Effect Bounds. Pointer capture remains restricted to Interaction
Bounds.

## 6. Renderer selection

The resolver may select a renderer only if:

1. its role matches the target;
2. the template lists it or a compatible renderer family;
3. parameter schema validates;
4. required media/capabilities are available or a fallback exists;
5. its layer outputs fit the template band;
6. its fallback chain is complete and acyclic.

Unknown renderer IDs never trigger dynamic code loading. They are rejected and
the next resolution candidate is evaluated.

## 7. Core renderer families

Initial trusted families:

| Family | Use |
|---|---|
| `core.renderer.dom-surface` | Rectangular environment/window surfaces |
| `core.renderer.svg-icon` | Sanitized SVG/image icon roles |
| `core.renderer.node` | Node body, status, badges and effects |
| `core.renderer.connection` | Declarative paths and moving decorations |
| `core.renderer.label` | System/user text with protected ownership |
| `core.renderer.video-surface` | Budgeted decorative video |
| `core.renderer.emergency` | Required functional fallback primitives |

Implementation technology is not a theme API. Core may replace DOM with Canvas
while preserving the renderer contract and output semantics.

### 7.1 Initial DOM surface material channel

The first closed renderer-owned material allowlist publishes
`core.material.dom-surface`. It accepts only these namespaced parameters:

- `core.material.fill`: hexadecimal color;
- `core.material.stroke`: hexadecimal color;
- `core.material.opacity`: finite number from `0` through `1`;
- `core.material.texture-ref`: namespaced Asset ID that resolves through the validated
  Asset Catalog/Resource boundary.

Unknown channels or parameters remain unavailable. Values are validated into an immutable render
input; Theme data is never forwarded as CSS source, custom properties, expressions, shaders, or
scripts. This registry is a validation boundary only and does not render materials by itself.

## 8. Node renderer

The Node renderer consumes:

- hierarchy scale class plus universal fallback scale;
- shape/size parameters allowed by the Node Template;
- separate Interaction, Layout, Visual, Effect and Label Bounds;
- Node states published by Core;
- assets/materials for body, outline, icon, status and effects;
- optional badges anchored by the template.

It supports asymmetric visuals and Visual Bounds larger than Interaction
Bounds. It MUST preserve the Core-owned hitbox, selection semantics,
dragging/navigation behavior and hierarchy identity. Missing hierarchy-specific
skin data uses the universal node presentation with the template's automatic
scale rule.

Initial semantic Node output layers:

1. shadow/effect behind;
2. body background;
3. body material/texture;
4. border/status ring;
5. primary icon;
6. badges/status;
7. label;
8. hover/selection/focus effect.

## 9. Connection renderer

Connection skins select only trusted declarative primitives:

- `stroke`;
- `texture-path`;
- `animated-flow`;
- `repeating-objects`;
- `particles`;
- `composite`.

Every Connection render plan exposes these ordered semantic layers:

1. Base Path;
2. Border;
3. Glow;
4. Repeating Texture;
5. Moving Objects;
6. Particles;
7. Start Cap;
8. End Cap;
9. Midpoint Decoration.

Layers may be omitted when optional. Base Path MUST resolve for a functional
Connection, at least through Core Default.

### 9.1 Path input

Core supplies immutable geometry for the render frame:

- start/end anchors;
- normalized sampled path or trusted path descriptor;
- length;
- tangent/normal query;
- viewport transform;
- state.

Themes cannot alter graph topology, endpoints or navigation semantics.
Template-approved visual offsets may decorate the path but do not move Core
anchors or hit testing.

### 9.2 Primitive parameters

`stroke`:

- width, color/material, opacity;
- dash pattern and dash offset;
- cap/join;
- optional gradient along path.

`texture-path`:

- image/vector slot;
- width, fit/repeat, phase and opacity;
- path-aligned or screen-aligned orientation.

`animated-flow`:

- stroke/texture source;
- speed, direction and phase;
- reduced-motion substitute.

`repeating-objects`:

- object asset/approved sub-renderer;
- spacing, start/end inset, size, rotation rule and maximum count;
- optional time-based phase.

`particles`:

- approved particle preset;
- density, lifetime, size, velocity range and seed policy;
- hard maximum live count.

`composite`:

- stable-ID child layers from these same primitives;
- explicit order mapped to semantic layers;
- bounded child count;
- no recursive composite child.

Caps and midpoint decorations are typed asset/sub-renderer bindings anchored to
Core path queries.

### 9.3 Determinism

Particles use a Core-provided stable seed derived from snapshot, connection and
presentation identity. They cannot use uncontrolled randomness. Given the same
request and frame time, renderer output is equivalent. Motion time comes from
the trusted render scheduler and cannot access wall-clock/user data.

### 9.4 Interaction

Connection interaction geometry is supplied separately by Core/Template.
Stroke width, glow, particles and repeating objects do not enlarge or shrink
the hitbox. Decorative moving objects are pointer-passive.

## 10. Icon and label rendering

Icons render through typed slots and may use sanitized SVG, PNG or WebP.
Fixed component-embedded SVG markup is migration input, not a supported skin
mechanism.

Labels identify ownership:

- `system-term`: Theme Runtime may localize/replace an allowlisted key;
- `user-content`: rendered verbatim through normal escaping and never replaced;
- `runtime-status`: Core-owned and replaceable only when its key is allowlisted.

Renderer inputs carry already-classified text. Renderers cannot infer ownership
from string content.

## 11. Environment surfaces and portals

Environment surface renderers may own Background, Rear, Left, Right, Floor,
Ceiling, Foreground and Ambient layers. They MUST remain inside their semantic
layer bands.

Window content is mounted through the geometry-neutral Window portal specified
by the Environment Composition Contract. A renderer MUST NOT place an ancestor
of that portal under `transform`, `filter`, `backdrop-filter`, `perspective`,
`contain` or clipping. Theme-controlled surface effects therefore cannot create
a fixed-position containing block, duplicate Workspace offsets or clip windows.

Critical Close, Resize, Drag and focus controls are Core-rendered interaction
elements. A skin may decorate their permitted visual slots but cannot replace
their geometry or event layer.

## 12. Layer safety

Templates assign semantic layer bands. Renderers output semantic names plus
local order, not arbitrary global z-index. Core maps these to bounded runtime
layers.

- local order is an integer `-100..100`;
- renderer output cannot cross its assigned band;
- children inherit the parent's band;
- Surface/Modal/Emergency bands always remain above themed windows;
- focus changes reorder only within the Window band and are periodically
  renormalized.

Raw theme-provided `z-index` or DOM stacking contexts are forbidden.

## 13. Effects and CSS

Trusted renderers may translate materials into CSS/SVG/Canvas operations.
Theme data cannot supply raw CSS, selectors or style attribute strings.
Properties with containing-block or global layout consequences require explicit
renderer support and cannot be attached to portal ancestors.

`backdrop-filter` is an optional bounded surface material. Its renderer:

- isolates the effect to a declared surface;
- cannot wrap Window portals;
- provides a non-filter fallback;
- reports performance degradation.

## 14. Motion and accessibility

Renderers receive reduced-motion, contrast and platform capability inputs.
Reduced-motion behavior is defined by the selected asset/animation. Motion must
not be necessary to discover a functional target or state.

Core retains focus rings, accessible names, roles and keyboard order. Themes may
style published visual channels within minimum contrast/visibility gates but
cannot remove them. Failed accessibility gates select a compatible fallback
material or Core Default.

## 15. Resource and performance policy

Each plan reports:

- draw/layer count;
- decoded texture estimate;
- effect/filter count;
- video decoder use;
- particle/repeating object count;
- invalidation frequency.

Core applies deterministic degradation classes:

1. full;
2. reduced effects;
3. reduced motion;
4. static assets/materials;
5. Core Default emergency.

The chosen class is part of the cache key and trace. Degradation changes
presentation only.

Default limits per Connection are 64 repeating objects and 256 live particles;
templates/renderers may publish lower values. Composite child count defaults to
16. Runtime clamps transient emitted counts to validated maxima, while signed
parameters outside schema limits reject the skin.

## 16. Error isolation and fallback

A render failure is contained to the target object/environment. Core:

1. records renderer ID/version and stable reason;
2. disposes the failed plan;
3. attempts its declared fallback renderer with the same Core input;
4. falls back through template skin and Core Default;
5. uses the emergency renderer for required functional visuals.

It MUST NOT reset Core state, navigate, close windows or retry indefinitely.
One renderer may be quarantined for the current snapshot after repeated faults.

## 17. Errors

- `renderer_unknown`
- `renderer_role_incompatible`
- `renderer_parameter_invalid`
- `renderer_capability_missing`
- `renderer_layer_escape`
- `renderer_bounds_escape`
- `renderer_resource_failed`
- `renderer_budget_exceeded`
- `renderer_output_invalid`
- `renderer_fallback_cycle`
- `renderer_user_text_classification_missing`
- `renderer_portal_containment_violation`

Diagnostics contain snapshot, object, template and renderer refs, layer/channel,
fallback chosen and whether function remained recoverable.

## 18. Versioning

Renderer implementations and definitions are separately versioned. A skin pins
a compatible renderer range; the activation lock selects an exact definition.

- Patch: rendering bug fix preserving output model/parameters.
- Minor: optional backward-compatible parameter/channel/capability.
- Major: changed parameter meaning, state/layer output or template compatibility.

Changing implementation technology alone need not change the contract version
if validation and observable semantics remain compatible.

## 19. Validation

Renderer registration validates:

- trusted implementation ID;
- closed parameter schema;
- compatible template roles;
- declared layer outputs/bounds;
- material/asset input types;
- capability and fallback completeness;
- acyclic fallback graph;
- Core Default coverage.

Skin validation applies the exact registered parameter schema. Runtime validates
the generated render plan before mounting/drawing it.

## 19.1 Example render selection

```json
{
  "rendererRef": {
    "id": "core.renderer.connection",
    "versionRange": "^1.0.0"
  },
  "role": "connection",
  "primitive": "repeating-objects",
  "parameters": {
    "spacing": 96,
    "maximumCount": 32,
    "rotationRule": "path-tangent",
    "reducedMotion": "static"
  }
}
```

This is renderer input, not an executable implementation. Registry validation
checks the fields against the selected renderer's closed parameter schema.

## 20. Required tests

- renderer/template role compatibility;
- unknown parameters and boundary values;
- layer order and attempted band escape;
- Effect Bounds overflow versus interaction isolation;
- all Node states and hierarchy fallback;
- all six Connection primitives;
- exact nine Connection semantic layers;
- deterministic particle/repeating-object output;
- reduced motion and static degradation;
- resource decode and renderer exception fallback;
- cyclic fallback rejection;
- user/system label classification;
- portal immunity to filter/transform/contain/overflow;
- 10,000 Window focus changes without band escape;
- emergency renderers preserve every critical functional target.

## 21. Open risks

- Equivalent DOM, SVG and Canvas output needs perceptual as well as structural
  regression tests.
- Large path effects can be expensive even within item count budgets.
- Browser-specific stacking/filter behavior requires an automated compatibility
  matrix.
- Accessibility contrast validation for textured assets is approximate and may
  need author warnings plus runtime fallback.
- Renderer parameter growth can become an accidental scripting language; new
  parameters require declarative-boundedness review.
