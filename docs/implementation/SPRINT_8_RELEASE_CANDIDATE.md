# Sprint 8 — Release Candidate

## Scope

Sprint 8 promotes the completed Cosmos Version 1 implementation to release-candidate quality. It synchronizes release metadata, hardens container operation, audits dependencies, runs the complete verification matrix, and exercises the application from a fresh Runtime directory. It introduces no new product behavior, visual design, domain type, or architectural boundary.

Journeyman remains an independent Tool Window inside a Workspace. The Companion remains an independent Entity. Workspace Environment Windows remain fixed, Tool Windows remain movable, resizable, and closable, and no unsupported Version 1 Window controls are exposed.

## Authority reviewed

The release candidate was checked against:

- Product Bible Version 1 domain, Runtime, Service, Context, Job, Event, Provider, Files, Archive, Capture, Review, Journeyman, and Companion contracts
- Experience navigation, spatial Shell, Base, Room, Workspace, Window System, Context Menu, Focus, Notification, Theme, and extensibility foundations
- all Version 1 Visual Specifications, including the delegated Dialog, Notification, Context Menu, and Object Window specifications
- Architecture Review V3 universal identity, Service mutation ownership, persistent Runtime State, additive Context, completed-fact Events, durable Jobs, and Provider isolation
- `IMPLEMENTATION_ROADMAP.md`

No new documentation contradiction or product decision was required.

## Release preparation

### Version identity

Backend package metadata, frontend workspace metadata, Runtime version exports, health responses, and tests now share the release version `1.0.0`. Python source and wheel artifacts are produced with the same version.

### Container operation

The backend container has an explicit readiness health check. Compose waits for backend readiness before starting the frontend and applies restart policies to both services. The frontend image has its own HTTP health check, and the persistent Runtime volume remains isolated from the source tree.

Docker was not installed in the verification environment, so container images could not be executed there. Their Dockerfiles, Compose wiring, health commands, ports, volume, and production build inputs were statically verified. The same backend and frontend production inputs were built directly, and the complete application was exercised through the documented local runtime commands.

### Dependency security

The Python environment passes `pip check`. The JavaScript production and development dependency graph passes `pnpm audit` with no known vulnerabilities. The audit identified vulnerable transitive dependencies in the previous Vitest 2 line; Vitest was upgraded to the compatible 3.2 release line and the lockfile was regenerated before the final verification run.

## Verification

The Version 1 release gate passed:

- Ruff formatting and linting
- 42 backend domain, persistence, Runtime, Service, API, and integration tests
- Python source and wheel builds, including packaged migrations
- Vue and TypeScript type checking
- 32 frontend Runtime, lifecycle, routing, and interaction tests under Vitest 3.2
- production frontend application build
- reusable frontend Runtime build
- `pip check`
- `pnpm audit` with no known vulnerabilities
- backend `/health` response reporting Cosmos `1.0.0`
- backend `/ready` response reporting ready state
- fresh-Runtime real-browser traversal through Cosmos Map, Base, Knowledge Workspace, and the Archive Tool Window
- Markdown fence and relative-link integrity checks
- `git diff --check`

## Product and architecture compliance

- Product Bible: the implementation preserves universal Objects, explicit Relationships and Context, Service-owned mutation, durable Job and Runtime State, completed-fact Events, Provider boundaries, and Project-scoped Files behavior.
- Experience: the spatial route hierarchy, fixed environments, temporary Workspaces, Tool lifecycle, selection, focus, Companion Notifications, and calm transition behavior follow the documented Version 1 experience.
- Visual Specifications: implemented environments, Windows, Tools, Object interaction, Dialogs, Notifications, Context Menus, and Object Windows use the approved Cosmos visual language and capability matrix.
- Architecture Review V3: no feature-local persistence model, implicit mutation path, parallel Context model, or unsupported Window capability was introduced.

## Release result

All roadmap Sprints are complete. The backend is operational, the frontend is usable, all available automated checks pass, release metadata is synchronized, dependency audits are clean, and the repository is ready as the Cosmos Version 1 release candidate.
