# Sprint 1 — Application Framework

## Scope

Sprint 1 establishes the runnable Cosmos application framework. It contains no Cosmos Map, Base, Room content, Workspace Tools, Capture, Knowledge, Companion, or other later-Sprint feature implementation.

## Authority reviewed

The implementation was checked against the following active contracts:

- Product Bible Foundation Architecture and Runtime Model
- Product Bible Cosmos, Base, Room, Workspace, Tool, Context, Workspace Runtime, Tool Runtime, Registry System, Runtime Services, Recovery, Extension Validation, and Theme Runtime
- Experience Cosmos Navigation and Transitions
- Experience Base and Workspace behavior
- Experience Shell Overview, Window Types, Window System, Focus, Multi Display, and Adaptive Experience
- Experience Theme Overview, Architecture, Components, Transitions, and Cosmos Theme
- Visual Specifications Overview, Window, Workspace, Workspace Environment Window, and Tools
- Architecture Review V3
- `IMPLEMENTATION_ROADMAP.md`

The approved Version 1 Window reconciliation committed immediately before this Sprint is the capability contract used by the implementation.

## Mettipedia analysis

Reusable reference patterns:

- Vue 3 application bootstrap
- Vue Router construction with memory-history route tests
- runtime initialization separated from feature stores
- DOM-safe Theme application
- Vite development and production build organization

Deliberately not reused:

- page-oriented navigation and sidebar application shell
- feature-specific Pinia stores
- hardcoded theme-preset selection
- floating Companion state with minimize and restore behavior
- docking primitives, split layouts, and page-specific components

Those implementations conflict with the Cosmos spatial environment, universal Window, Theme Registry, and Version 1 capability contracts.

## Implementation

### Application shell and routing

The Vue application now has a production entry point, a minimal Shell, startup recovery presentation, and spatial routes for Cosmos, Base, Room, and Workspace environments. These routes establish navigation identity only; later Sprints supply their visible feature content.

Unknown routes return to Cosmos. Navigation requests pass through the shared Shell transition queue so features do not create parallel transition systems.

### Window Runtime

The TypeScript Window Runtime owns presentation-window state and enforces role capabilities:

| Window role | Movable | Resizable | Closable | Header | Borderless |
| --- | --- | --- | --- | --- | --- |
| Base Environment | No | No | Yes | No | Yes |
| Room Environment | No | No | Yes | No | Yes |
| Workspace Environment | No | No | Yes | Yes | No |
| Tool | Yes | Yes | Yes | Yes | No |
| Surface | No | No | Yes | No | Yes |

There are no minimize, maximize, restore, dock, or snap capabilities. Tool Windows are constrained to their parent Workspace Environment Window and retain a minimum usable size. Closing a parent closes subordinate Windows, preventing orphaned surfaces.

### Workspace Runtime

The frontend Workspace Runtime implements the documented temporary session lifecycle and keeps persistent Workspace definition identity separate from session and Environment Window identity. It supports multiple active sessions, one focused session, backgrounding, closing, additive multi-Project Context validation, and failure isolation.

Workspace persistence, Tool Runtime integration, and user-facing multi-window workflows remain Sprint 4 work.

### Theme Runtime

Theme definitions are registered by immutable Object identity in a definition-only Theme Registry. Theme Runtime resolves and activates definitions, applies only `--cosmos-*` presentation tokens, serializes activation through the Shell transition queue, removes stale tokens, and falls back to the Cosmos Theme on resolution or presentation failure.

No Theme may contribute navigation or Window behavior.

### Startup and shutdown

Backend startup now records explicit creation, Persistence initialization, validation, ready, failed, and stopped phases. Initialization is idempotent, readiness is unavailable after failure or shutdown, and the ASGI lifespan always performs shutdown.

Frontend startup activates the fallback Theme, checks backend readiness, and exposes the environment only after both succeed. Concurrent start requests coalesce, failures remain visible and retryable, and no prototype-data fallback hides backend failure.

### Development runtime

The Vite application uses a same-origin `/api` boundary in development and production. Docker Compose now builds and serves the frontend through Nginx, proxies `/api` to the backend, and preserves SPA route fallback. The reusable frontend runtime continues to build separately from the application artifact.

## Architectural decisions that differ from Mettipedia

1. Cosmos routes environments rather than product pages. This preserves continuous spatial navigation and prevents later Tools from becoming top-level applications.
2. Runtime objects are provided through one explicit Vue plugin rather than feature stores importing one another.
3. Theme definitions use immutable Object identity and a definition-only Registry. Mettipedia's local preset store is not an architectural Theme system.
4. Window capabilities are role-derived and enforced centrally. Mettipedia's minimize, floating Companion, dock, and split primitives are outside the approved Version 1 contract.
5. Startup requires the backend Runtime. Mettipedia's prototype-data fallback would hide availability failures and create a second behavior path.
6. Application and reusable-runtime builds are separate outputs so the Shell can run independently while future Extensions consume the same contracts.

## Verification

The Sprint 1 gate passed:

- Ruff formatting and linting
- 23 backend tests
- Python source and wheel builds
- Vue/TypeScript type checking
- 21 frontend tests
- production application build
- reusable frontend-runtime build
- real-browser backend/frontend startup
- default Theme activation
- Cosmos, Base, Room, Workspace, and unknown-route behavior
- browser console error and warning check
- `git diff --check`

Docker is not installed in the local execution environment, so the container definitions were reviewed and the same frontend and backend commands were exercised directly. CI retains the reproducible non-container verification gate.

## Compliance result

- Product Bible: Runtime boundaries, additive Context, separate Workspace definition/session/Window identity, definition-only Registry behavior, Theme presentation isolation, and failure isolation are preserved.
- Experience: spatial navigation, invisible Shell behavior, fixed Environment Windows, movable/resizable/closable Tool Windows, automatic Context rules, and one transition mechanism are preserved.
- Visual Specifications: the Shell uses the Cosmos Theme token boundary, fixed desktop environment canvas, restrained transitions, and the corrected Window capability matrix. No later-Sprint visual feature has been invented.
