# Sprint 0 foundation record

## Authority analysed

The implementation foundation was derived from the synchronized Version 1 contract, with particular attention to:

- `Architecture_Review_V3.md`
- Product Bible foundation: Vision, Principles, Domain, Architecture, Runtime Model
- Product Bible Runtime: Project, Project Structure, Object, Context
- Product Bible technical architecture: Extension System, Registry System, Runtime Services, Event Model, Persistence, Project Runtime, Tool Runtime, Repository Runtime, Job Runtime, Permission System, Recovery, Extension Validation, and Codex Execution Rules
- Product Bible Core infrastructure: Provider Runtime and Event Dispatcher
- Experience foundation: Design Philosophy and Object Model
- Experience Theme Architecture for the presentation boundary only
- Experience extensibility: Overview, Automatic Project Structure, Prepared Structures, and Extension Points

Historical V1/V2 reviews and audits are retained as non-normative evidence; V3 is the current synchronization result.

## Read-only Mettipedia analysis

Reusable patterns:

- environment-derived immutable runtime configuration
- an explicit application composition root
- adapters that isolate external Provider process execution
- provider availability that does not prevent the application from starting
- a typed frontend API result/error envelope
- Vue/Vite/Vitest and Python temporary-directory testing patterns
- health endpoints and lifecycle integration tests
- streaming SHA-256 utility style for future Resource work

Not migrated:

- feature-shaped Core packages and the large application facade
- direct construction and coupling of feature services in one aggregate
- file/directory repositories as competing durable authorities
- a registry where later registration silently overwrites an existing Provider
- caller-selected concrete development Providers
- a second legacy static frontend beside the Vue frontend
- page, store, Capture, Knowledge, Workbench, Companion, and other product UI code

## Sprint 0 decisions

- Python 3.11+ is the native backend/System Tool language; Vue with strict TypeScript is the native User Tool interface foundation.
- Starlette and Uvicorn retain the small working HTTP/runtime pattern from Mettipedia without importing its feature API facade.
- SQLite starts with one versioned generic Object envelope and no feature-specific identity tables.
- The frontend builds as a headless library. It provides API transport and Vue dependency injection, but no page, component, route, store, Theme, or visible shell.
- Extension category roots are present but empty. Their manifest schema is shared and versioned.
- Provider Runtime accepts abstract capability requirements and owns deterministic selection. Concrete adapters remain Extensions.
- Jobs are limited to immutable Service-created requests with Context Snapshots and the canonical lifecycle/priority vocabulary; no scheduler or feature Job exists yet.
- Permissions default to denied until an explicit grant policy is supplied to the authoritative Runtime Service boundary.
- Runtime data defaults outside the repository and `.runtime/` is available as an ignored local override.
- Docker currently packages only the backend foundation; there is no frontend application to serve in Sprint 0.
- GitHub CI invokes the same bootstrap and verification scripts used locally; it does not define a second build path.

## Deliberate differences from Mettipedia

| Area | Mettipedia reference | Cosmos foundation | Reason |
| --- | --- | --- | --- |
| Backend organization | Feature packages wired into one application facade | Domain, Runtime, Services, Persistence, API, and Extension boundaries | Runtime Services must own behavior; Core stays feature-neutral. |
| Composition | One aggregate constructs concrete feature repositories and services | A small Core composition root initializes infrastructure only | Feature Services and Runtime lifecycles must arrive with their owning sprint, not as speculative dependencies. |
| Identity | Feature-specific models | One generic Object envelope with additive tags/schemas/properties | Architecture Review V3 requires universal Object identity. |
| Persistence | SQLite plus several file repositories/directories | SQLite migration authority; future manifests are projections | Version 1 defines SQLite as the sole transactional authority. |
| Storage paths | Legacy code includes repository-relative and hard-coded host paths | Environment-derived runtime root outside source | Resources remain externally owned and runtime durability must be portable. |
| Registry | Provider map overwrites duplicate keys | Validated registration rejects duplicates and separates activation | Registry contract forbids accidental replacement. |
| Providers | Developer service chooses a named Provider | Consumers declare capabilities; Provider Runtime selects and routes | Concrete selection is owned only by Provider Runtime. |
| Frontend | Product pages, Pinia stores, mock data, and a legacy static UI | Headless Vue/TypeScript runtime package | Sprint 0 forbids UI and user-facing features. |
| Runtime startup | Feature services start background processing | Migrations and health/readiness only | Jobs and features belong to later Service-owned implementations. |
| Repository work | Feature packages can directly inspect repository paths | No Repository Analyzer, monitoring, or translation implementation | Those actions are demand-driven Runtime contracts and require their owning Services and approved tasks. |
| MCP/API surface | Broad feature API and MCP tool surface | Health/readiness HTTP only; MCP deferred | A transport cannot precede the Runtime Services whose behavior it must expose consistently. |
| Project directories | Reference runtime creates feature directories | No Project prepared structures yet | Physical prepared areas must be created atomically by the future Project Service, not guessed by bootstrap. |

## Compliance verification

- Universal identity: generic Object tables and `ObjectContract`; no Project/Theme/Entity class identity tables.
- Complete Properties: schema composition validates types and supplies every explicit default before an Object is valid.
- User-owned Tags: Object construction never derives User Tags from names or System Tags.
- Runtime authority: `cosmos.services` is reserved as the authoritative mutation boundary; API currently exposes no mutations.
- Persistence authority: one versioned SQLite store; no JSON or file repository is authoritative.
- Registry separation: definition metadata is separate from Provider adapters and active execution.
- Provider neutrality: Provider requests contain objectives, capabilities, preferences, privacy constraints, and authorized Context only.
- Experience separation: no UI is present; the frontend is a runtime/transport library and Themes remain an empty Extension category.
- Extensibility: category roots and the V1 manifest schema exist without loading any feature Extension.
- Failure isolation: duplicate definitions are rejected, subscriber failures are isolated, and absent Providers leave Core operational.

## Verification performed

- Ruff format check: passed
- Ruff lint: passed
- Backend tests: 21 passed
- Python source distribution and wheel build: passed
- Vue/TypeScript type check: passed
- Frontend tests: 3 passed
- Vite production library build: passed
- Bootstrap rerun: passed and idempotent

Docker configuration is included, but a Docker engine was not installed in the verification environment. The backend image definition therefore remains syntactically reviewed rather than engine-built in Sprint 0.
