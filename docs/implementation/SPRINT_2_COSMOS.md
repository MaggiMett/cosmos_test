# Sprint 2 — Cosmos

## Scope

Sprint 2 implements the Cosmos Map, camera, navigation instrument, Projects, Nodes, Connections, global Companion, and Ship. It does not implement Base Rooms, productive Workspaces, Capture, Knowledge, the core Tool suite, object menus, or editing surfaces assigned to later Sprints.

## Authority reviewed

The implementation was checked against:

- Product Bible Cosmos, Project, Project Structure, Object, Node, Relationship, Runtime Services, Persistence, Project Runtime, Entity, Entity Runtime, and all Companion contracts
- Experience Cosmos Overview, Navigation, Nodes, Connections, Context Menus, Transitions, and Object Model
- Experience Companion, Automatic Project Structure, and System Projects
- Visual Specifications Cosmos Map, Node, Connection, Project, Navigation Bar, Companion, and Ship
- Architecture Review V3 findings for universal Object identity, Node and Connection representation, physical Prepared Structures, normal tagged System Projects, and Entity identity
- `IMPLEMENTATION_ROADMAP.md`

No unresolved conflict was found. Context Menu actions and object content Windows remain assigned to Sprint 6; Sprint 2 preserves their interaction origins without partially implementing them.

## Mettipedia analysis

Mettipedia contains no reusable spatial Cosmos Map, camera, galaxy, Node, Connection, navigation-instrument, or Ship implementation.

Reusable reference patterns were limited to:

- typed frontend API requests and error normalization
- Vue component isolation
- Companion conversation state and interaction tests
- pointer-driven floating-window handling

The Mettipedia Companion Window itself was not copied because it implements minimize/restore and owns shell-specific state that conflicts with the approved Cosmos Window Runtime. Its page-oriented navigation and mock Project data were also excluded.

## Backend implementation

### Universal Objects and schemas

Version 1 System Tags now activate complete additive schemas for Project, Node, Entity, and Companion roles. Project roots use one identity composed from `Project + Node + ProjectRoot`; System Projects add only the `System` tag. The default Companion uses one identity composed from `Entity + Companion + System`.

No Project, Node, System Project, or Companion identity table was introduced.

### Runtime Services

- Object Service owns validated Object creation, complete Property mutation, queries, permissions, Persistence, and completed-fact Events.
- Project Service creates generic user or System Projects through the same Object contract and coordinates their physical Prepared Structures.
- Relationship Service owns the sole persistent Version 1 Relationship type, `Related`, with exactly two Object endpoints and one Project owner.
- Cosmos Map Service assembles runtime-only Connection Object representations, derives Project focus from camera position, and owns durable camera and Node placement requests.
- Companion Service owns durable default Companion identity and the deterministic non-AI conversation fallback.

The API remains a client of these Services. It does not implement business rules or write SQLite directly.

### Persistence

Migration 2 adds:

- Prepared Structure records and physical path mappings
- Project-owned `Related` Relationships
- versioned Runtime State storage for the camera

Project creation stages all six documented areas—`Knowledge`, `Files`, `Themes`, `Workspaces`, `Templates`, and `Extensions`—under the Project `.cosmos/` directory. The Object and path mappings are committed before finalization, failure is compensated, and an existing Project is exposed only after all recorded paths resolve physically. Empty prepared areas remain valid.

Startup idempotently creates only the documented Version 1 System Projects:

- Knowledge Workspace
- Creation Workspace
- Graphics Workspace

Their positions and colors are complete Project/Node Properties, not a special System Project model.

## Frontend implementation

### Cosmos Map and camera

The map fills the environment and uses one continuous world transform. It supports:

- Space plus drag camera movement
- smooth cursor-centered wheel zoom within Version 1 bounds
- automatic Project focus and complete-galaxy fitting
- Quick Travel through the same camera state
- durable camera restoration
- freely movable Node positions with overlap prevention and durable placement

Camera position alone derives the current Project context. No manual Project switch state exists.

### Projects, Nodes, and Connections

Projects render as organic themed nebulae with central ProjectRoot Nodes. Node hierarchy changes size while retaining one circular hitbox and one interaction contract. Non-focused Projects limit preview Nodes to nine.

Structural placement and accepted `Related` records produce passive runtime Connection Object representations. Structural and semantic provenance changes presentation only; no additional Relationship types exist.

### Permanent navigation Objects

The top-center Navigation Bar displays one current location and geographical left/right neighbors. Selecting the current location opens Quick Travel, and selecting a neighbor focuses that Project.

The global Companion is a circular interactive astronaut representation. Selecting it opens a normal Tool Window with Close only; the Window is movable and resizable through the shared Window Runtime. With no Provider configured, Conversation retains a greeting, reports Runtime context, and explains the unavailable advanced capability instead of pretending to provide AI reasoning.

The Ship is an independent persistent Object beside the Companion and routes through the shared transition mechanism to Base.

## Architectural decisions that differ from Mettipedia

1. Cosmos uses one continuous spatial camera rather than page routing for Project navigation.
2. Projects, Nodes, and Companion are universal Objects composed by System Tags rather than feature-specific store records.
3. System Projects use the normal Project Service, Object schema, lifecycle, and Persistence path; there is no System Project class or registry.
4. Connections are runtime Object representations over structural placement or `Related`; Mettipedia has no equivalent graph contract.
5. Camera and Node placement are durable Runtime state and Object Properties, not component-local mock state.
6. Companion identity exists independently of chat and Providers. Its conversation is a Tool Window with Close only, replacing Mettipedia's minimized/restored persistent shell window.
7. Project content comes from authoritative Services and seeded documented System Projects rather than Mettipedia-style mock gateway data.

## Verification

The Sprint 2 gate passed:

- Ruff formatting and linting
- 26 backend tests
- Python source and wheel builds
- Vue/TypeScript type checking
- 23 frontend tests
- production application build
- reusable frontend-runtime build
- real-browser backend/frontend startup
- default global Cosmos framing
- Quick Travel open and Project focus
- camera-derived current location and neighbor updates
- Companion Tool Window open, contextual deterministic reply, and Close
- Ship navigation to Base
- `git diff --check`

Docker is not installed in the execution environment. The existing container definitions remain unchanged, and their backend/frontend commands were exercised directly.

## Compliance result

- Product Bible: universal identity, additive schemas, Runtime Service mutation ownership, physical Prepared Structures, SQLite authority, `Related` exclusivity, global Entity scope, Provider independence, and Project focus semantics are preserved.
- Experience: continuous spatial navigation, Space-drag movement, cursor-centered zoom, automatic camera context, freely placed non-overlapping Nodes, passive Connections, Quick Travel, calm Companion presence, and permanent Home access are implemented.
- Visual Specifications: full-viewport deep space, generous galaxy spacing, organic nebulae, hierarchy-scaled glowing Nodes, secondary energy Connections, compact top-center orientation, circular astronaut Companion, and welcoming exploration Ship are implemented with restrained and reduced-motion-aware animation.
