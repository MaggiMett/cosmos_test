# Cosmos Dev Handoff — Theme Foundation

**Date:** 2026-08
**Status:** Theme Builder foundation chapter closed; next chat should continue from the roadmap below.
**Audience:** next Cosmos-Dev GPT / developer continuing the repository.

---

## 1. Read this first

This file is a handoff, not a replacement for the authoritative specifications.

Authority remains:

1. `docs/Product_Bible_v2/`
2. `docs/Experience_V1/`
3. `docs/Visual_Specifications_V1/`
4. `docs/IMPLEMENTATION_ROADMAP.md`

For the theme architecture specifically also read `docs/theme-engine/02_theme_engine_contract.md`, `03_template_catalog.md`, `04_environment_composition_contract.md`, `05_asset_and_skin_contract.md`, `06_override_resolution_contract.md`, `07_renderer_contract.md`, `08_theme_builder_contract.md`, `17_visual_interaction_function_model.md`, `24_theme_builder_visual_specifications.md`, and `26_theme_builder_v1.md`.

Do not assume a feature exists because it appears in a vision/spec. Inspect the implementation first.

---

## 2. Product direction agreed in this development thread

The near-term goal is not to bolt many external applications into Cosmos. Open-source applications may be studied as examples/implementation references, but the desired end state is native Cosmos tools and builders: Theme Builder, Texture/Material Builder, Object Builder and other game/project creation tools.

The priority is to make Cosmos itself fundamentally understandable and usable before expanding the tool catalog.

Working order agreed with the user:

1. Finish the Theme foundation so a non-technical user can visually understand/customize Cosmos.
2. Clean and stabilize the fundamental navigation/model: Cosmos Map, Base, Rooms, Workspaces and their relationships.
3. Make the frontend fundamentally operable according to Product Bible / Experience / Visual Specifications.
4. Then improve individual areas and add native creator tools incrementally, driven partly by live testing pain points.

The user deliberately relies on Cosmos-Dev to choose sensible implementation order. Prefer coherent foundations over many shallow features.

---

## 3. Core mental model: Cosmos projects

A **Project is the main/root node** in Cosmos. Lower categories and content are represented as progressively smaller nodes connected by connection lines.

Example discussed:

- Project root: `Mettventures`
- children: `Fraktionen`, `Items`, `Lore`, ...
- under `Items`: `Weapons`, `Tools`, `Food`, `Blocks`, ...
- under `Fraktionen`: `Dwarfs`, `Humans`, `Elves`, ...

Long-term these nodes should also provide a user-friendly representation of the project's real directory/content hierarchy. The intent is **not** to expose every filesystem/internal file. A later filter/projection layer should show only user-relevant folders/files needed to extend or edit the project, hiding temp/internal/noise paths. The actual Project can remain a normal real path while Cosmos presents a simplified parallel projection.

**Important Product Bible constraint:** this projection is a convenience/resource view, not Cosmos semantics. `00_Foundation/01_Vision.md` and `02_Principles.md` explicitly require Cosmos to organize meaning rather than derive meaning from folder/source layout. Project/Knowledge/Object relationships remain authoritative; physical files stay project-scoped resources. Do not turn the discussed folder mirroring into the semantic object model.

Do not implement this filesystem projection as part of Theme Builder. Preserve the concept for the later Project/Cosmos navigation phase.

---

## 4. Theme vision: the decal-kit model

The clearest metaphor established in this thread is a motorcycle decal/sticker kit.

Every important Cosmos visual family gets a **stable Clear Template** defining shape/parts/states/function boundaries. Themes are visual kits fitted to those contracts.

The separation must remain strict:

- **Clear Template / Core contract:** functional geometry, required zones, anchors, states, safe areas and capabilities.
- **Cosmos Core:** official Cosmos example/presentation on top of the same contract.
- **Custom Theme:** user-authored appearance on the same contract.
- **Runtime:** actual semantics/function, navigation, hitboxes where Core-owned, focus, project data, window behavior, etc.

A theme must never gain authority over functionality merely because it draws something that looks interactive.

Theme-owned layout is valid where the contract explicitly permits it. A complete theme may therefore bring its own Base/Room composition: e.g. two workspaces at declared positions, decoration, doors, wallpaper/floor presentation. Later the user should be able to personalize that composition in a Sims-like Base/Room Builder by adding/removing/moving permitted objects and changing materials. **That personalization layer is secondary to the current Theme foundation.**

---

## 5. Theme Builder authoring model established

The important authoring hierarchy is now:

`Template -> Part -> Interaction State -> Artwork + Material -> Default or Override`

Examples:

- Node Body / Default can have its own material/artwork.
- Node Body / Hover can inherit Default or override it.
- Glow / Hover is independent from Node Body / Hover.
- `Reset to Default` removes the state-specific override and restores inheritance.

Technical IDs/bindings should remain available under **Advanced**, not dominate the normal user experience. The normal language should be Parts, Artwork, Interaction, Color & Surface, etc.

The Theme Builder already has a persistent V1 workflow documented in `docs/theme-engine/26_theme_builder_v1.md` with Theme Library, Builder Project, Assets, Room Shells, Objects, Looks, Preview and Release.

---

## 6. Important implementation work completed in this thread

### Theme Builder UX / material-state foundation

Relevant area: `frontend/src/dev/theme-builder/`.

Completed:

- Simplified Looks Studio terminology for non-technical users.
- Technical Template/Part/Binding identifiers moved behind Advanced UI.
- Material editing is scoped per selected template part instead of all parts sharing one global material channel.
- Material overrides are scoped by interaction state.
- State materials inherit Default values when no override exists.
- Inspector explicitly shows `Using Default look` vs `Custom look for this interaction` and supports `Reset to Default`.
- Artwork follows the same inheritance concept: Default artwork vs custom interaction artwork, with reset.
- Cosmos Core preview is driven from official Core Skin definitions instead of a separate hard-coded cyan fake.

Renderer material support accepts controlled part-surface channels. Inspect `frontend/src/theme-engine/rendererMaterialChannels.ts` and `frontend/src/dev/theme-builder/themeBuilderSkinDraft.ts` before changing this logic.

### Clear templates / Core visual families

The Core template catalog now has implemented fundamental contracts for:

- Cosmos Map
- Project Root Node
- Cluster Node
- Domain Node
- Object Node
- Detail Node
- Connection
- Base Main Room
- Workspace Environment
- UI Window

Workspace clear contract: `frontend/src/theme-engine/workspaceTemplate.ts`.

Window clear contract: `frontend/src/theme-engine/windowTemplate.ts`.

Workspace/Window official Core presentation: `frontend/src/theme-engine/coreWorkspaceUiSkin.ts`.

Base clear contract: `frontend/src/theme-engine/baseTemplate.ts`.

The previous neutral grey Base fallback was replaced with a first recognizable Cosmos Core Base presentation in `frontend/src/theme-engine/coreDefaultBaseSkin.ts`, following the Base visual spec: cockpit/Cosmos view, integrated workspace areas, side room entries, central Companion focus, dark spacecraft language.

The Looks Studio has template-specific preview geometry for Map, Node, Connection and Base, and Core preview resolution includes Map, graph/node, Base and Workspace/Window Core skin packs.

### Scope decision: Base scene objects

`base.door`, `base.workspace-entry`, `base.companion` and `base.decoration` are deliberately marked `object-builder-planned` in `frontend/src/theme-engine/coreTemplateCatalog.ts`.

This is intentional, not unfinished Theme-Builder work.

Reason: Base/Room templates define functional zones/capacities; Runtime owns semantics; Door/Workspace furniture/Companion/Decoration are placeable scene/catalog objects and belong with the later Object Builder + Base/Room Builder work. Do not rush them into ordinary skin slots.

---

## 7. Architecture boundaries that must not regress

1. Builder editing must not mutate the active ThemeRuntime directly.
2. Assets remain authoritative in the Asset Catalog; Builder Projects reference them.
3. Theme presentation cannot alter runtime bindings/function semantics/focus behavior simply through visual editing.
4. Window geometry, focus, close, drag and resize behavior remain Runtime-owned. The Window template skins frame/header/content/control appearance only.
5. Workspace owns a calm environment/canvas and Tool Area presentation. Tool identity and Tool Window state remain Runtime-owned.
6. Rooms are environments/compositions, not merely another flat node-like skin object.
7. Project filesystem projection/filtering is a later Project/navigation concern, not Theme Builder.
8. Avoid parallel sources of truth. Cosmos Core preview should resolve official Core skins, not duplicate their colors in Builder-only constants.
9. Keep Clear Template, Cosmos Core presentation, custom Theme and later user personalization conceptually separate.

---

## 8. Current Theme Foundation status

This is a sensible chapter boundary.

The foundational contract/authoring model is now coherent enough to stop expanding template scope blindly. The next chat should **not** immediately add every planned visual type from older specifications.

There are many longer-term catalog concepts (additional Room variants, Base Entry, Pet, window families, dialogs, notifications, icons, etc.). Their presence in specs does not mean they are Phase-1 blockers.

At the close of this handoff, the normal verification baseline is:

- frontend tests: 89/89 test files, 651/651 tests
- frontend production build: passing
- repository expected clean/synchronized after this handoff commit

The next developer must rerun current checks before relying on these numbers.

---

## 9. Recommended roadmap from here

### Phase A — Live Theme Builder usability pass

Before deep new architecture, open/use the actual Theme Builder and fix concrete UX breaks in the completed foundation. Verify that Workspace and Window are genuinely selectable/authorable through the user-facing flow, not only registered internally. Verify Clear / Cosmos Core / Your Theme comparisons for every implemented family. Keep normal UI beginner-friendly.

### Phase B — Fundamental Cosmos navigation cleanup

Return to the original product priority: make Cosmos itself easy to navigate.

Audit the live frontend against Product Bible + Experience + Visual Specs at a user-flow level, especially:

- Cosmos Map -> Project root -> hierarchical child nodes
- connection-line clarity
- entering/leaving Base
- Base -> Rooms
- Base/Room -> Workspace
- Workspace -> Tool Windows
- consistent Back/Home/navigation behavior

Do not redesign architecture without first inspecting the existing runtime because the implementation roadmap marks these systems as already implemented.

### Phase C — Project hierarchy / user-friendly project projection

Once navigation is stable, align Project nodes with the intended user-facing project hierarchy. Design the filtered projection from real project paths/content so internal/temp/noise files are hidden while user-editable structure is visible. This needs a proper contract rather than ad-hoc filesystem exposure.

### Phase D — Base/Room Builder + Object Builder

Build on the existing Room composition and catalog foundations in `docs/theme-engine/13_*` through `18_*` and existing code. This is where Door, Workspace Entry/furniture, Companion placement and Decoration should become first-class placeable objects.

Desired user experience is deliberately simple/Sims-like: add, delete, move allowed objects; change wallpaper/background/floor/material choices; respect functional zones and safe areas.

Theme-provided default layout and user personalization must remain distinct layers so a theme can define its intended Base while a user can personalize their instance.

### Phase E — Material / Texture / Object creator tooling

After Cosmos is fundamentally navigable and the Base/Object composition model is stable, expand native creation tools. Open-source tools can be studied for workflows/ideas, but Cosmos should own the resulting native UX and data contracts rather than merely opening external applications inside Cosmos windows.

### Phase F — Broader visual system completion

Then tackle remaining visual families (context menu/dialog/notification/object window/etc.) according to actual product need and live testing, not merely catalog completeness.

---

## 10. Suggested first actions for the next Cosmos-Dev chat

1. Read this handoff.
2. Read Product Bible overview/foundation plus the relevant Experience and Visual Specs.
3. Read `docs/theme-engine/26_theme_builder_v1.md` and the key theme contracts listed above.
4. Inspect `git status` and current tests/build.
5. Inspect the Theme Builder user-facing routes/components rather than assuming registration equals usability.
6. Perform a short live-flow/theme-foundation audit.
7. If that is healthy, move to Phase B: fundamental Cosmos navigation cleanup.

Do not spend the next session recreating the Theme architecture from scratch; preserve and test the existing contracts first.

---

## 11. Recent milestone commits from this thread

Useful landmarks (not a substitute for Git history):

- `20c4a1d` — simplify Theme Builder editing language
- `45b782b` — scope Theme Builder materials per part
- `9dc18f5` — scope Theme Builder materials by state
- `82494ec` — show inherited interaction looks
- `637bc8b` — show inherited artwork states
- `1ce94cf` — drive Cosmos Core preview from official skins
- `4798417` — replace Base fallback with Cosmos Core presentation
- `c76fe9e` — add canonical Workspace clear template
- `4a38d78` — add canonical Window clear template
- `2553345` — defer Base scene objects to Object Builder

There were also repository cleanup/navigation/theme-foundation commits earlier in the long development thread. Use Git history plus the implementation/docs rather than relying only on this abbreviated list.

---

## 12. One-sentence continuation principle

**Finish making Cosmos itself coherent and pleasant to navigate before multiplying tools; treat Themes as safe visual/layout kits over stable contracts, and treat later Base/Object/Material builders as native Cosmos creation systems built on those contracts.**
