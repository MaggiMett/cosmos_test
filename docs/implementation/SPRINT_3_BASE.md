# Sprint 3 — Base

## Scope

Sprint 3 implements the fixed Base environment, Main Room, Workshop, physical Workspace furniture, cockpit, Room transitions, seated Companion, and Base Pet. It does not open productive Workspace environments or implement the Tool Runtime assigned to Sprint 4.

## Authority reviewed

The implementation was checked against:

- Product Bible Base, Room, Workspace, and Workspace Runtime contracts
- Experience Base Overview, Main Room, Rooms, Workspaces, Companion, Pets, and Cosmos Theme
- Visual Specifications Base, Room, Workspace, Window, and Workspace Window
- Architecture Review V3 universal Object, persistence, and Runtime Service findings
- `IMPLEMENTATION_ROADMAP.md`

No unresolved conflict was found. The Product Bible defines three predefined Workspace definitions, while Experience places Knowledge and Creation furniture in the Main Room and four empty configurable slots in the Workshop. Cosmos therefore keeps Workspace definitions separate from their physical Workspace Slot Objects: Knowledge and Creation are assigned to Main Room slots, Graphics remains an unassigned definition, and the Workshop starts with four empty slots.

## Mettipedia analysis

Mettipedia contains no reusable Base, Room, cockpit, door, Pet, or spatial Workspace-furniture implementation. Its page workbench, persistent dock, and page-navigation patterns conflict with the documented physical-environment model and were not migrated.

Reusable reference patterns were limited to:

- isolated Vue visual components
- typed API boundary state
- explicit pointer and focus state
- reusable Companion presentation and conversation boundaries

The Cosmos implementation extracts a shared Companion avatar and shared Companion Tool Window host, allowing the same Entity to appear globally in Cosmos and seated inside Base without duplicating identity or conversation behavior.

## Backend implementation

### Universal Base Objects

Base, Room, Door, Cockpit, Workspace, Workspace Slot, and Pet are normal universal Objects composed through complete additive System Tag schemas. No feature-specific identity table was introduced.

Startup idempotently prepares:

- one Base
- one permanent Main Room
- one Workshop Room
- one bidirectional Door between those Rooms
- one Main Room cockpit
- Knowledge, Creation, and Graphics Workspace definitions
- two assigned Main Room Workspace Slots
- four empty Workshop Workspace Slots
- one Base-scoped Pet Entity

Workspace definitions reference the existing System Projects through normal Object project identity. A Workspace Slot is a physical Room fixture and may reference a Workspace definition; it is not a second Workspace identity.

### Base Service

The Base Service owns preparation and assembly of the Base snapshot. The API remains a client of the Service and does not write Persistence directly. The snapshot exposes Rooms in documented order, their physical slots, assigned definitions, the Door, cockpit, global Companion, Pet, and unassigned Graphics Workspace definition.

## Frontend implementation

### Fixed environment

Base renders as a fixed, borderless environment at approximately 80 percent of the viewport. It has no drag or resize affordance. Its only Version 1 window control is the in-world Close action, which returns to the preserved Cosmos Map state.

The Main Room provides:

- an open cockpit passage with panoramic Cosmos view, console, and two seats
- Knowledge furniture at the rear left
- Creation furniture at the rear right
- the seated global Companion near the center
- a calm interactive Pet nearby
- a visible Workshop doorway

The Workshop is a brighter, practical Room with four empty physical benches split across its left and right sides and a visible return entrance.

### Interaction boundaries

Workspace furniture supports selection and clear selected state but intentionally does not open a Workspace. Opening the fixed Workspace Environment Window belongs wholly to Sprint 4. The Companion opens the same movable, resizable, closable Tool Window used in Cosmos. The Pet provides a small local greeting response without introducing a Tool or Provider contract.

Cosmos-to-Base, Base-to-Room, and Room-to-Base navigation all pass through the shared serialized environment transition mechanism. Invalid Room locations safely return to the Main Room.

## Architectural decisions that differ from Mettipedia

1. Base and Rooms are fixed physical environments rather than page or workbench routes.
2. Workspace definitions and physical Workspace Slots are separate universal Objects, rather than a page definition doubling as navigation and layout state.
3. The Workshop starts with four empty slots; no undocumented preset tools or pages are created.
4. Door travel uses the shared environment transition queue rather than page navigation or a dock.
5. Companion identity and conversation are reused across environments; Mettipedia's shell-owned chat state is not copied.
6. The Base Pet is a Base-scoped Entity Object with a restrained atmospheric interaction, not a decorative component with separate identity.
7. Base has only Close and cannot be moved or resized. Mettipedia workbench/window chrome is excluded.

## Verification

The Sprint 3 gate passed:

- Ruff formatting and linting
- 28 backend service and API tests
- Python source and wheel builds
- Vue/TypeScript type checking
- 25 frontend Runtime and routing tests
- production application build
- reusable frontend-runtime build
- real-browser Cosmos-to-Base entry, Main Room furniture selection, Companion Tool Window, Pet response, four-empty-slot Workshop, bidirectional Door travel, and Close-to-Cosmos smoke testing
- `git diff --check`

Docker is not installed in the execution environment. The existing container definitions remain unchanged, and their backend/frontend commands were exercised directly.

## Compliance result

- Product Bible: fixed Base/Room identity, normal universal Objects, complete System Tag schemas, Service-owned preparation, shared Companion identity, Base-scoped Pet, and the Workspace-definition boundary are preserved.
- Experience: a welcoming central Main Room, visible cockpit, two default furniture placements, seated Companion, nearby Pet, discoverable Workshop, four empty configurable slots, and continuous Room travel are implemented.
- Visual Specifications: the fixed borderless environment, deep-space surround, warm spacecraft Main Room, panoramic cockpit, integrated physical furniture, brighter practical Workshop, and restrained interaction states are represented with reduced-motion support.
