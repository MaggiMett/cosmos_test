# Sprint 7 — Integration

## Scope

Sprint 7 connects the Version 1 Runtime systems across their existing architectural boundaries. It completes active Context propagation from Cosmos, Base, Workspace, Object selection, Tools and Jobs; connects background Job attention to Companion Notifications through Runtime Events; scopes generic Object interaction to the active Workspace; optimizes Relationship inspection; and resolves cross-surface lifecycle races. It introduces no new feature, Window type, product workflow or parallel domain model.

Journeyman remains an independent Tool Window inside a Workspace. The Companion remains an independent Entity and presents Notifications without becoming Journeyman.

## Authority reviewed

The integration was checked against:

- Product Bible Runtime Context, Object and Knowledge Context, Event Model, Job Runtime, Companion Context Awareness, Conversation, Notifications and Journeyman attention rules
- Experience Context Menus, Window System and Companion Notifications
- Visual Specifications for Companion, Notification, Object Window, Context Menu, Tool Window and Workspace Environment Window
- Architecture Review V3 additive Context, completed-fact Events, Runtime Service mutation ownership and persistent Runtime State
- `IMPLEMENTATION_ROADMAP.md`

No new documentation contradiction was found.

## Runtime integration

### Active Context propagation

Cosmos Context now contains all visible Version 1 Project scopes, an optional focused Project and the selected Object. Base conversation explicitly receives its current Room and optional selected Object rather than inheriting stale Cosmos focus. Workspace selection is validated against assigned Project scopes, persisted in restorable Runtime State and rebuilt as additive Object, System Tag and User Tag Context.

Tool actions, Object inspection and Object updates receive this Runtime-owned Context. Workspace-scoped Object interaction includes the active session identity in API requests and rejects Project-owned Objects outside the Workspace scope. Global Objects remain reusable across Contexts.

### Job attention and Companion Notifications

Knowledge and Journeyman Jobs capture their destination Object in the immutable Context Snapshot. Notification Service subscribes to completed `JobCompleted` and `JobFailed` facts through Event Dispatcher and creates universal passive Notification Objects. Completed work uses the Tasks category; failed work uses System. Existing destination Objects open through the established Notification flow, and the Companion indicator remains synchronized with unread state.

The subscriber is failure-isolated by Event Dispatcher and idempotent for each Runtime Event identity. Job Runtime does not depend on Notification Service, and Events remain completed facts rather than commands.

### Object interaction performance

Relationship Repository and Relationship Service now provide an indexed object-specific query path. Object Window inspection loads only Relationships connected to the requested Object and limits them to active Project scopes, replacing the previous global Relationship scan without changing the universal Relationship contract.

## Interaction polish

Browser integration testing exposed and resolved two cross-system races:

1. Capture now cancels its pending debounce and awaits any in-flight draft save before submission. Successful submission therefore remains `Preserved` and the deleted draft cannot be recreated after completion.
2. Workspace-owned Object Window records are removed with their Workspace scope even when Window Runtime has already recursively closed the underlying child Window. Returning to Base cannot re-render orphaned Workspace windows.

Direct Object Windows and Workspace-owned Object Windows remain isolated by Context identity. Closing one Workspace does not remove unrelated direct interaction state.

## Architectural decisions

1. Active selection remains durable Runtime State, while the composed Context remains temporary and is rebuilt from it. No selected Object identity was added to persistent Object meaning.
2. Workspace scope travels as a session identifier to the API; the backend resolves the authoritative Context. The frontend never sends arbitrary Project permissions or constructs its own Context.
3. Job attention uses Event subscription inside Notification Service rather than a direct Job-to-Companion dependency. This preserves completed-fact Events and Companion presentation ownership.
4. A Job's related Object is carried in its existing Context Snapshot rather than duplicated in Job Event metadata or Notification-specific Job fields.
5. Relationship performance is improved below the Service boundary. Object Window behavior and the `Related` Version 1 domain type remain unchanged.

## Verification

The Sprint 7 gate passed:

- Ruff formatting and linting
- 42 backend domain, persistence, runtime, service, API and integration tests
- Vue/TypeScript type checking
- 32 frontend runtime, lifecycle and routing tests
- production frontend application build
- reusable frontend-runtime build
- Python source and wheel builds with packaged migrations
- API integration coverage for Workspace selection restoration, Project-scope isolation, Base conversation Context and Job-to-Notification delivery
- frontend coverage for Workspace selection requests, scoped Object API calls and recursive Window cleanup
- real-browser Base Room conversation, Capture submission, background processing, Companion indicator, Notification Center, destination Object opening, acknowledgement, Workspace Context Menu, scoped Object Window and Workspace cleanup
- `git diff --check`

## Compliance result

- Product Bible: Context is additive and Runtime-injected; Jobs preserve snapshots; Events announce completed facts; Services retain mutation ownership; Notifications remain universal Runtime Objects presented by the Companion.
- Experience: the Companion reports the current Room, background work waits calmly for attention, selection remains distinct from Window focus, and Workspace interactions stay inside the originating fixed environment.
- Visual Specifications: no new presentation was introduced. Existing Companion, Notification, Context Menu, Object Window and Window patterns remain unchanged and expose only documented Version 1 capabilities.

