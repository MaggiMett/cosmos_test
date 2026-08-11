# Sprint 5 — Core Tools

## Scope

Sprint 5 implements Files, Archive, Capture, Review, and Journeyman as complete Version 1 Tools inside the existing Workspace and Tool Runtime. It adds the Runtime Service, persistent Job, Provider-routing, Knowledge-version, capture-draft, and project-resource foundations those Tools require. It does not add Sprint 6 Object Windows, context menus, general dialogs, notifications, or drag and drop.

Journeyman is an independent Tool with its own movable, resizable, closable Tool Window inside the Creation Workspace. It is not the Companion Entity and does not use the Companion as its visual representation.

## Authority reviewed

The implementation was checked against:

- Product Bible bundled user Tools, Knowledge model, Knowledge Runtime, Runtime Services, Resource Service, Job Runtime, Provider Runtime, Repository Runtime, and Analysis Engine
- Experience Workspace, Shell, Knowledge, prepared structures, and Journeyman extensibility foundations
- Visual Specifications for Tools, Files, Archive, Capture, Review, Journeyman, Workspace Environment Windows, and Tool Windows
- Architecture Review V3 universal Object identity, additive Context, Service-owned mutation, persistent Runtime state, Provider selection, and project file boundaries
- `IMPLEMENTATION_ROADMAP.md`

The approved product decisions are preserved: Archive edits inline; Files is project-scoped; Workspace Environment Windows are fixed; Tool Windows move, resize, and close; Journeyman and Companion are independent.

## Mettipedia analysis

Mettipedia was inspected read-only. Reused implementation patterns include:

- validated capture models and failure-safe draft retention
- canonical path containment and content hashing in its project file browser
- explicit Review lifecycle states and decision records
- a Developer Panel activity timeline
- backend repository/service separation and test fixture organization

The following Mettipedia structures were deliberately not migrated:

- JSON-file persistence in place of Cosmos SQLite repositories
- page-oriented feature routes in place of Workspace Tool Windows
- arbitrary repository-path browsing in place of active Cosmos Project scoping
- a combined assistant/developer presentation in place of separate Companion and Journeyman Objects
- local frontend feature authority in place of Runtime Services and universal Objects

## Backend implementation

### Universal Tool catalog

Files, Archive, Capture, Review, and Journeyman are durable universal `Tool` Objects. Definitions contain component keys, capabilities, permissions, icons, categories, versions, and minimum Tool Window sizes. Workspace assignments reference immutable Tool definition IDs. Journeyman is categorized as a system Tool but executes through the same universal Tool Runtime as the other core Tools.

### Project-scoped Resources

Resource Service derives the only accessible physical root from the focused Project in the active Workspace Context and Project Service's prepared `Files` structure. It canonicalizes every relative path, rejects absolute paths, traversal, root escape, and links resolving outside the root, and never accepts a caller-supplied repository root.

Files operations provide recursive tree search, text and image previews, metadata and SHA-256 hashes, atomic UTF-8 writes, optimistic edit conflicts, file rename/move, and explicit deletion. Version 1 does not delete directories or access arbitrary user files.

### Capture and Knowledge

Capture drafts are stored by Workspace session and focused Project. A submission atomically creates a universal `Knowledge + Capture` Object and its first immutable Knowledge version before a resumable `Knowledge Processing` Job is queued. Submission failure retains input and drafts; successful submission removes the submitted draft.

The preserved `original_source` never changes. Deterministic Version 1 processing derives a title, summary, word count, and keywords, appends a new Knowledge version, and updates current Knowledge properties. Archive inline edits append another version and change the current representation in the same Object View.

### Review

Review Service owns persistent `ReviewItem` Objects. Candidates include reason, evidence, confidence, affected Project/Object/Knowledge IDs, urgency, and an explicit action set. Accept, reject, postpone, dismiss, and request-more-evidence decisions update only the Review lifecycle and append an actor/timestamp/note history. Review does not invent or directly apply unrelated domain mutations.

### Journeyman

Journeyman Service owns persistent `JourneymanTask` Objects with objective, authorized Workspace Context snapshot, observable plan, activity events, state, Provider identity, Job identity, and result. Provider Runtime performs capability-based selection for `development`. With no eligible active Provider, the task remains durably `awaiting_provider` with a clear activity fact; credentials are not fabricated. When available, persistent Job Service executes through Provider Runtime and records completion or failure.

### Jobs and persistence

Migration `0003_core_tools.sql` adds immutable Knowledge versions, recoverable capture drafts, and persistent runtime Jobs. Job Service owns queue, running, progress, completion, failure, cancellation, shutdown, and resumable recovery transitions and publishes completed lifecycle facts. Tool code remains a client of Runtime Services and never accesses persistence directly.

## Frontend implementation

Frontend Tool Runtime loads durable definitions from `/tools` before opening a Workspace and restores definition-backed instances. The shared Workspace Tool Window supplies movement, resizing, focus, containment, Close, and minimum-size enforcement. It exposes no minimize, maximize, docking, or snapping controls.

- Files presents project search, file selection, immediate preview, text editing, create, rename/move, and confirmed delete.
- Archive presents searchable Knowledge navigation and one direct read/edit Object View with version history.
- Capture presents quick, rant, form, and file modes, attachment input, debounced durable drafts, recovery, and preserve/failure states.
- Review presents a queue, mature decision detail, evidence, notes, only the supplied actions, and a calm empty state.
- Journeyman presents its own context bar, objective input, plan, activity timeline, Provider status, and task cancellation inside its own Tool Window.

## Architectural decisions that differ from Mettipedia

1. Every core Tool is a universal Tool definition and every opening creates an isolated Tool Instance; Mettipedia feature pages and panel IDs are not runtime identity.
2. All mutations cross Runtime Services. Mettipedia code that writes JSON or project files from feature modules was not retained.
3. Files derives its root from active Workspace Context and prepared Project structures. Mettipedia's caller-selected repository paths are intentionally unsupported.
4. Knowledge uses universal Objects plus append-only SQLite versions. Mettipedia's standalone capture JSON record is not the durable Knowledge authority.
5. Capture processing is a persistent resumable Job and never blocks source preservation. Mettipedia's feature-owned processing flow is not reused.
6. Archive reading and editing share one inline Object View. Separate Mettipedia edit surfaces are outside Version 1.
7. Review decisions are durable lifecycle facts and do not silently perform proposed mutations.
8. Journeyman is an independent Tool/Object routed through Provider Runtime. Mettipedia's developer panel and assistant presentation are not merged with the Companion.
9. Tool definitions are delivered from the backend catalog rather than hard-coded as a closed frontend union.

## Verification

The Sprint 5 gate passed:

- Ruff formatting and linting
- 37 backend domain, persistence, runtime, service, API, and architecture tests
- Vue/TypeScript type checking
- 28 frontend runtime and routing tests
- production frontend application build
- reusable frontend-runtime build
- Python source and wheel builds with packaged migrations
- service coverage for project path escape, edit conflicts, source immutability, Knowledge versioning, draft recovery, Review history, and Journeyman/Companion separation
- API coverage for session-scoped Files, Capture, Tool definitions, and Journeyman tasks
- real-browser Cosmos → Base → Creation Workspace navigation, all five Tool openings, Journeyman planning/provider-unavailable state, visual layout inspection, and zero console errors
- `git diff --check`

The isolated Python builder could not download a fresh `setuptools` copy because network access is unavailable. The same standards-based source and wheel build passed with the locked development environment via `python -m build --no-isolation`. Docker is not installed; the existing Docker definitions remain unchanged.

## Compliance result

- Product Bible: universal Tool and domain Objects, Service-owned commands, active Context scoping, immutable source, versioned Knowledge, persistent Jobs, Provider selection, and Repository/Resource boundaries are preserved.
- Experience: each Tool opens inside the originating fixed Workspace; Files stays within the Project; Archive reads and edits in place; Capture preserves flow and failure state; Review remains intentional; Journeyman is an observable independent work Tool.
- Visual Specifications: the five purpose-built Tool surfaces use the shared movable/resizable/closable Tool Window and implement the documented toolbars, navigation/detail divisions, empty/error states, and Journeyman plan/activity structure without adding unsupported Window controls.
