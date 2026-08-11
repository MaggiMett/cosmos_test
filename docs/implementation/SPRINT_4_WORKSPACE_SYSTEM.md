# Sprint 4 — Workspace System

## Scope

Sprint 4 implements fixed Workspace Environment Windows, persistent Workspace definitions, temporary active Workspace sessions, the Tool Runtime lifecycle, multi-window containment, and restorable Workspace state. It intentionally does not partially implement Files, Archive, Capture, Review, or Journeyman; those complete Tool capabilities belong to Sprint 5.

## Authority reviewed

The implementation was checked against:

- Product Bible Runtime Model, Workspace, Tool, Context, Runtime Services, Persistence, Workspace Runtime, and Tool Runtime
- Experience Workspaces, Shell Overview, Window Types, Window System, Focus, and Adaptive Experience
- Visual Specifications Workspace, Window, Workspace Environment Window, and Tools
- Architecture Review V3 universal Object identity, additive multi-Project Context, and authoritative preflight boundaries
- `IMPLEMENTATION_ROADMAP.md`

No unresolved conflict was found. A Workspace definition is durable configuration; its active session, Environment Window, Tool Instances, and Tool Windows have independent temporary identities and lifetimes. Active layout state references the immutable definition ID and is durable Runtime State rather than definition identity.

## Mettipedia analysis

Mettipedia's workbench store provides useful tests for context-isolated layout state and its floating-window primitive demonstrates clean content/header separation. Those small structural patterns were reused conceptually.

The workbench implementation itself was not migrated because it uses:

- a page-oriented workbench route
- one hard-coded Tool union and registry
- fixed modular panels instead of freely arranged Tool Windows
- local Pinia state without Runtime Service or SQLite authority
- direct layout mutation without temporary Workspace sessions or Tool Instance lifecycles

Mettipedia's Companion Window also includes minimize behavior, which is outside the approved Version 1 capability matrix.

## Backend implementation

### Universal runtime identities

The complete Object contract now includes additive schemas for Tool definitions, Workspace Sessions, Tool Instances, and Windows. Temporary Workspace Sessions, fixed Workspace Environment Windows, Tool Instances, and Tool Windows receive independent immutable Object IDs. Their runtime identities are not inserted into the durable Object-definition store; their restorable state references persistent Workspace and Tool definition IDs.

### Tool Runtime and Tool Service

Tool Runtime is the lifecycle owner for both execution paths:

- Direct Tool Mode creates one Tool Instance without a Workspace
- Workspace Mode creates isolated Tool Instances contained by one active Workspace session

Instances progress through Created, Initialized, Ready, Active, Background, Closed, and Destroyed states. Focus backgrounds sibling instances, local state remains instance-owned, Workspace shutdown destroys all contained instances, and failures remain isolated.

Tool Service is the authoritative activation boundary. It verifies permissions and the `Tool` definition role, injects the complete Runtime Context, delegates lifecycle to Tool Runtime, and publishes completed Tool facts. Tool Runtime performs no business operation and never accesses Persistence.

### Workspace Service

Workspace Service owns:

- definition queries
- temporary session opening, focusing, saving, and closing
- Room and additive Project Context composition
- Tool containment and Tool Window presentation records
- Workspace and Tool lifecycle fact publication
- restoration through Runtime State Persistence

The Service validates Workspace and Room identities before opening. A failure during restoration compensates the partially opened session and its Tool Instances. The REST API remains a client of these Services.

### Persistence

Restorable state uses the existing versioned SQLite Runtime State store, keyed by immutable Workspace definition ID. It preserves:

- open Tool Instance definition and instance IDs
- Tool Window position, size, open state, and focus order
- Tool-local Runtime State
- selected Object
- filters
- camera state
- fixed Panel configuration

Closing destroys the temporary session only after state is saved. Reopening creates a new session identity and restores the previous workplace. No migration was required because Sprint 2 established the generic versioned Runtime State table.

## Frontend implementation

### Workspace Environment Window

Selecting assigned Workspace furniture opens its definition through Workspace Service. The originating Room remains mounted and visible behind a fixed Workspace Environment Window. The Window uses fixed placement and sizing, a visible header, a calm Canvas, a compact Tool Area, and Close only. It has no drag, resize, minimize, maximize, restore, docking, or snapping affordance.

A new Workspace with no available Sprint 5 Tools correctly displays only the Canvas and Tool Area. This is the documented empty state rather than an unfinished Tool surface.

Close and Escape preserve state, destroy the active session, and return to the exact originating Room.

### Multi-window workflow

Frontend Tool Runtime maintains a definition registry separate from active instances. It can restore several instances of the same or different Tool definitions, creates each as a child of the Workspace Environment Window, and delegates all presentation constraints to the shared Window Runtime.

Tool Windows:

- move and resize only inside their Workspace
- enforce definition-owned minimum sizes
- maintain one interaction focus and visible focus order
- overlap independently
- close without closing their Workspace
- persist bounds, focus, and Tool-local state through Services

An unavailable restored Tool definition is isolated and reported without preventing the Workspace from opening.

## Architectural decisions that differ from Mettipedia

1. Workspace configuration is a persistent universal Object; an active session is a separate temporary Object identity.
2. Tool definitions and Tool Instances are separate; Mettipedia's panel ID is not treated as execution identity.
3. Tool Runtime owns lifecycle while Workspace Runtime owns containment and placement. Mettipedia combines both in one store.
4. Durable layout uses Runtime Services and SQLite rather than component or Pinia-local state.
5. Tool definitions are extensible registry entries instead of a closed TypeScript union.
6. Tool Windows are freely movable and resizable within a fixed Environment Window instead of fixed panel slots.
7. Workspace and Tool Context is injected additively and may contain zero, one, or multiple Project scopes with optional focus.
8. Window behavior follows the approved Version 1 matrix; no Mettipedia minimize behavior is retained.

## Verification

The Sprint 4 gate passed:

- Ruff formatting and linting
- 32 backend tests
- Python source and wheel builds
- Vue/TypeScript type checking
- 26 frontend tests
- production application build
- reusable frontend-runtime build
- real-browser Base furniture to fixed Workspace opening, empty Canvas/Tool Area, Close, and Room restoration
- service tests for session save/close/reopen and Tool Window layout restoration
- Runtime tests for multiple isolated Tool Instances, focus order, boundary constraints, and unavailable-definition isolation
- `git diff --check`

Docker is not installed in the execution environment. The existing container definitions remain unchanged, and their backend/frontend commands were exercised directly.

## Compliance result

- Product Bible: durable definitions, temporary sessions, independent Window and Tool identities, Tool Runtime lifecycle ownership, Workspace containment, additive Context, Runtime Service mutation boundaries, completed-fact Events, and SQLite Runtime State restoration are preserved.
- Experience: selecting furniture opens a fixed productive surface above the same Room, Close returns to that Room, Workspace state is remembered, and Tool Windows follow one movable/resizable/closable interaction model.
- Visual Specifications: the fixed header-bearing Environment Window contains only the large calm Canvas and compact Tool Area in its empty state, keeps the physical Room visible behind it, and uses restrained opening and focus presentation.
