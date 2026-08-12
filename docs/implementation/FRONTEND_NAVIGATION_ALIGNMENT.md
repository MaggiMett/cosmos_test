# Frontend Navigation Alignment

**Status:** Active cleanup guide
**Scope:** User-facing runtime navigation only

## Product invariant

The canonical mental path is:

```text
Cosmos → Base → Room → Workspace → Tool
```

Projects remain spatial meaning/context inside Cosmos. They are not a separate application layer.

The user should always be able to answer four questions without knowing implementation details:

1. Where am I?
2. What can I do here?
3. What will opening this object do?
4. How do I return to the place I came from?

## Current alignment

| Experience | Product intent | Production presenter | Current status |
| --- | --- | --- | --- |
| Cosmos | Continuous spatial root environment | `CosmosPresenterView` → new Global/Project presenters | Promoted; legacy remains rollback-only |
| Project focus | Focus inside the same Cosmos, orientation preserved | `CosmosProjectView` through `/?projectId=…` | Promoted; query-based focus preserves one Cosmos route |
| Base | Home environment above Cosmos | `BasePresenterView` → `BaseRuntimeView` | Promoted; legacy remains rollback-only |
| Room | Place inside Base, not a tool/page | `BaseRuntimeView` through `/base/rooms/:roomId` | Promoted and shares Base presenter |
| Workspace | Fixed working environment opened from a Room | `WorkspaceView` | Active; now visually preserves the originating Base/Room beneath the workspace environment |
| Tool | Capability inside Workspace | `ToolWindow` + Tool Runtime | Active |
| Themes | Appearance system, not navigation semantics | Theme Library / Theme Builder | Functional development surface; integration polish follows runtime navigation cleanup |

## Main sources of user-facing confusion

- The repository still contains legacy presenters and `/dev/*` previews beside promoted implementations. These are useful rollback/development surfaces but must not become alternate user journeys.
- Workspace previously replaced the visual world with a generic dark stage, weakening the documented feeling that a Workspace expands over the Room. Production Workspace now renders the Base/Room presenter as inert background.
- Workspace return navigation contained a hard-coded Workshop fallback. It now resolves the actual Room from the Base snapshot before returning.
- Theme creation has several standalone studio routes. These should remain implementation surfaces until the runtime navigation is stable, then be presented as one coherent Theme creation experience rather than unrelated destinations.
- Some visible controls are placeholders (for example search/settings). They should either receive real behavior or stop presenting themselves as completed navigation affordances during later cleanup.

## Cleanup order

### 1. Canonical runtime journey

Keep exactly one production journey:

```text
Global Cosmos
  ↕ project focus
Project Cosmos
  → Base
Base
  ↔ Room
Room
  → Workspace
Workspace
  → Tool Windows
  → close → originating Room
Base
  → close → Cosmos
```

No `/dev/*` route is part of this journey.

### 2. Orientation and return semantics

- Cosmos project focus stays within Cosmos.
- Base close returns to Cosmos.
- Room navigation stays within Base.
- Workspace close returns to its actual containing Room.
- Tool close returns to the Workspace surface, not another route.
- Opening an Object opens Object interaction; it does not silently become navigation unless that Object's role explicitly represents a destination.

### 3. Consolidate visible chrome

After navigation behavior is stable, unify location/breadcrumb language and destination controls so Cosmos, Base, Room and Workspace communicate hierarchy consistently without turning Cosmos into a conventional dashboard.

### 4. Remove false affordances

Wire or demote controls that currently look functional but are placeholders. Prioritize controls visible on the canonical journey.

### 5. Theme creation integration

Once the base journey is comfortable in live testing:

- Theme Library becomes the normal entry point for appearance management.
- Theme Builder becomes one coherent creation flow.
- Asset, Room Shell, Object, Looks, Preview and Release studios remain internal stages of that flow rather than six unrelated mental destinations.
- Theme tooling must not redefine Cosmos/Base/Room/Workspace navigation semantics.

## Live-test acceptance criteria

A runtime cleanup slice is successful when a non-developer can navigate Cosmos → Base → Room → Workspace, open and close Tools, and return to the original Room/Cosmos position without needing route knowledge or explanation.

Visual polish is secondary until this journey is predictable.
