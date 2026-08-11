# Cosmos

Cosmos is the Version 1 implementation of the personal operating system defined by `Product_Bible_V2`, `Experience_V1`, and `Architecture_Review_V3`.

## Repository map

```text
backend/       Python Core, Runtime contracts, Persistence, and API bootstrap
frontend/      Vue application shell and reusable TypeScript client runtime
contracts/     Cross-runtime schemas and compatibility contracts
extensions/    Installable Extension category roots (empty in Sprint 0)
docker/        Local backend container definition
scripts/       Cross-platform bootstrap and verification entry points
docs/          Product authority and implementation decision records
.github/       Continuous verification using the same local scripts
```

Runtime data is external to source by default (`~/.cosmos`) and may be redirected with `COSMOS_RUNTIME_PATH`.

## Bootstrap

Python 3.11+ and Node.js with pnpm are required.

```text
python scripts/bootstrap.py
python scripts/check.py
```

Run the backend after bootstrap:

```text
.venv/Scripts/python -m cosmos
```

On Unix-like systems the interpreter is `.venv/bin/python`.

Run the frontend application in another terminal:

```text
pnpm --dir frontend dev
```

The development server is available at `http://127.0.0.1:5173` and proxies `/api` to the backend at `http://127.0.0.1:8000`. The Docker Compose configuration provides the same application and backend pairing.

The backend exposes `/health`, `/ready`, and the Runtime Service-backed API. The frontend waits for readiness before activating the spatial application routes.

## Version 1 runtime

The runnable implementation provides:

- a spatial route hierarchy for Cosmos, Base, Room, and Workspace environments
- the approved Version 1 Window capability matrix
- temporary Workspace session lifecycle management
- registry-backed Theme loading with the Cosmos fallback Theme
- one serialized Shell transition queue
- explicit startup, failure, retry, and shutdown states
- a persistent pan/zoom camera with cursor-centered zoom and Project focus
- Project galaxies, universal Node Objects, structural and `Related` Connection representations
- the three documented Version 1 System Projects with physical Prepared Structures
- the global Companion Entity and permanent Ship access to Base
- top-center orientation, geographical neighbors, and Quick Travel
- the fixed, borderless Base environment above the still-active Cosmos setting
- the Main Room cockpit, Knowledge and Creation furniture, seated Companion, Pet, and Workshop door
- one additional Workshop Room with four empty physical Workspace Slots
- serialized environment transitions between Cosmos, Base, and Rooms
- persistent Workspace definitions opening as temporary active sessions
- one fixed, header-bearing Workspace Environment Window above the originating Room
- a calm empty Canvas and compact Tool Area for newly opened Workspaces
- isolated Direct and Workspace Tool Instance lifecycles
- multiple contained Tool Windows with movement, resizing, focus, Close, and boundary recovery
- SQLite-backed restoration of open Tool instances, bounds, focus order, Tool state, selection, filters, camera, and fixed Panel configuration
- Files create, preview, edit, rename/move, search, and delete operations constrained to the active Project's prepared `Files` root
- Archive search and direct inline Knowledge editing in one versioned Object View
- Capture modes, attachments, recoverable Workspace drafts, immutable original source, and asynchronous Knowledge processing
- Review queues with evidence, confidence, explicit available actions, and durable decision history
- Journeyman as an independent planning and development-assistance Tool Window, routed through Provider Runtime when an eligible Provider is active
- universal Object selection, Context Menus, Object Windows, inline Object editing and schema-owned User Tags
- Companion-owned Notifications for completed and failed background Jobs, including destination Object opening and read state
- Runtime-injected Cosmos, Room, Workspace, Tool and selected Object Context with Project-scope enforcement
- reusable Dialog, Context Menu, Notification and Object Window presentations following the Cosmos visual language

Journeyman and Companion remain separate Objects and experience concepts. Companion is the global Entity; Journeyman is an independent Tool inside the Creation Workspace.

## Local container runtime

Build and run the release containers from the repository root:

```text
docker compose -f docker/compose.yaml up --build
```

The frontend is available at `http://127.0.0.1:5173`. Compose waits for backend readiness before starting the frontend, and durable Runtime data is stored in the `cosmos-runtime` volume.

## Architectural authority

Implementation decisions must follow, in order:

1. `docs/Product_Bible_V2`
2. `docs/Experience_V1` for user-facing behavior
3. `docs/Architecture_Review_V3.md` as the synchronized Version 1 contract

Mettipedia is a read-only implementation reference, never an architectural authority.


## Theme Builder V1

The usable Theme authoring flow starts at `/themes` → **Theme Builder** or directly at `/theme-builder`. It uses persistent revisioned Builder Projects, the real Asset Catalog, Room/Object drafts, Looks/Skin authoring, isolated preview, V1 validation and deterministic Theme Pack export. See `docs/theme-engine/26_theme_builder_v1.md` for the workflow and V1 package limits.
