# Sprint 6 — Object Interaction

## Scope

Sprint 6 completes the Version 1 universal Object interaction layer: selection, Node drag and drop, Context Menus, Object Windows, inline editing, Dialogs, and Companion-owned Notifications. The implementation extends the existing Object, Window, Runtime Service, and frontend Runtime boundaries. It does not create a parallel feature model or add minimize, maximize, docking, snapping, multi-selection, arbitrary file drag and drop, or future Notification behavior.

Journeyman remains an independent Tool Window inside a Workspace. The Companion remains a separate Entity and owns the Notification presentation only.

## Authority reviewed

The implementation was checked against:

- Product Bible universal Object, Node, Tool, Runtime Service, Tag Service, Relationship, Context, and Runtime Object contracts
- Experience Nodes, Navigation, Context Menus, Object Model, Window Types, Window System, Focus, and Companion Notifications
- Visual Specifications for Window, Workspace Window, Node, Companion, Dialog, Notification, Context Menu, and Object Window
- Architecture Review V3 universal identity, Service ownership, Context injection, persistent Runtime state, and approved Version 1 Window boundaries
- `IMPLEMENTATION_ROADMAP.md`

The approved product decisions are preserved: Workspace Environment Windows remain fixed; Tool Windows move, resize, and close; no unsupported Version 1 Window controls exist; Archive editing remains inline; Files remains project-scoped; Companion and Journeyman remain independent.

## Mettipedia analysis

Mettipedia was inspected read-only. Its explicit frontend selection state, context-store separation, and interaction-test organization were useful reference patterns. No Mettipedia Window or menu implementation was copied because its page-local stores and feature-specific UI authority conflict with Cosmos Runtime Services, universal Objects, and the shared Window Runtime.

## Backend implementation

### Object interaction

Object Interaction Service composes one generic inspection payload from the existing Object identity, System Tags, User Tags, active Properties, accepted Relationships, and capabilities. Context Menu actions are derived from the Object's roles and match the documented Project/Node, Workspace, Base, and generic Object vocabularies. The presentation layer never invents additional actions.

Object updates accept only identity metadata, User Tags, and the explicit editable Property subset activated by the Object's roles. Object Service remains the authority for identity and Property validation. Relationship Service remains the authority for accepted Connections.

### User Tags

Tag Service is the sole User Tag mutation boundary. It normalizes and validates user-owned Tags, persists replacements without changing System Tags or Object identity, and publishes `ObjectUserTagsChanged` Runtime Events.

### Selection and Node positioning

Cosmos Map selection is persisted as Runtime State independently from Window focus. Only Node Objects may enter map selection. Node drag and drop updates only `position_x` and `position_y`; it does not mutate parentage or semantic Relationships.

CosmosMapService performs the authoritative overlap check before committing a position. The frontend applies the same distance rules for immediate feedback and restores authoritative state when a write fails.

### Notifications

Notifications use the universal `Notification` Runtime Object role and complete Property Schema. Notification Service validates the five Version 1 categories, source and destination references, read state, and Companion indicator state. Notifications are queried and marked read through Runtime Services; the Companion Object's `notification_available` Property is synchronized from unread Notifications.

## Frontend implementation

### Context Menus and selection

Right-clicking an Object first preserves its visible selection and then opens one viewport-bound Context Menu next to the interaction origin. Actions are supplied by Object Interaction Service and grouped without a second frontend action vocabulary. Menus close on action, outside attention, or Escape.

### Object Windows and editing

Object Windows use the existing Tool Window role and Window Runtime. Workspace-owned Object Windows are constrained to their fixed Workspace Environment Window; direct Object openings use the existing direct Tool Window mode. They remain movable, resizable on every edge and corner, and closable, with no minimize, maximize, docking, or snapping.

Identity, Properties, System roles, User Tags, and accepted Connections share one focused Object presentation. Editing remains inline in the same Window. Editable fields are schema-aware, save through the backend interaction contract, preserve entered values after failure, and update the visible Node representation after success.

### Dialogs

The reusable Dialog is a focused Surface Window presentation with restrained attention veil, clear action hierarchy, Escape handling only for a valid dismissal, and reduced-motion behavior. Version 1 uses it for the existing unsaved-change decision; it does not replace ordinary inline editing.

### Companion Notifications

The Companion Window contains Conversation and Notification Center sections. The Notification Center provides calm empty/loading/error states, category filters when multiple categories exist, unread emphasis, timestamps, and destination selection. The `!` indicator appears on the same Companion avatar in Cosmos and Base and disappears when no unread Notification remains. No toast stack or independent Notification Window was introduced.

## Architectural decisions that differ from Mettipedia

1. Selection is canonical Runtime State and remains independent from Window focus; Mettipedia's page-local selection authority was not retained.
2. Context Menu actions are resolved from System Tags and capabilities by a Runtime Service rather than hard-coded independently in each view.
3. Object Windows use the universal Window Runtime and immutable Object IDs rather than feature-specific panels or routes.
4. User Tag writes belong exclusively to Tag Service; UI stores never mutate Object records.
5. Node collision validation exists on both interaction and authoritative Service boundaries, while Relationships remain untouched by layout.
6. Notifications are universal Runtime Objects presented by the independent Companion Entity, not generic toast records or Journeyman output.
7. Dialog, Context Menu, and Notification presentations reuse the Cosmos Window and glass-surface language instead of importing Mettipedia styling.
8. Window resizing now uses the universal borders-and-corners pattern for every Tool Window rather than one feature-specific resize affordance.

## Verification

The Sprint 6 gate passed:

- Ruff formatting and linting
- 39 backend domain, persistence, runtime, service, API, and architecture tests
- Vue/TypeScript type checking
- 30 frontend runtime and routing tests
- production frontend application build
- reusable frontend-runtime build
- Python source and wheel builds with packaged migrations
- Service coverage for User Tags, Object action resolution, editable Property restrictions, selection persistence, Node collision rejection, Notification lifecycle, and Companion indicator synchronization
- API coverage for Object inspection/editing, map selection, and Notifications
- real-browser Context Menu, Object Window, inline edit/save, unsaved-change Dialog, Companion Notification Center, Node drag persistence, complete Tool Window resize controls, and zero console warnings or errors
- Markdown link and code-fence validation
- `git diff --check`

## Compliance result

- Product Bible: Object identity, System Tag composition, Property Schemas, Tag Service ownership, Relationship ownership, Runtime State, and Service-only mutations are preserved.
- Experience: selection stays distinct from focus; Nodes select, open, drag without overlap, and retain Relationships; actions stay object-centered; Notifications remain patient and Companion-owned.
- Visual Specifications: Dialog, Notification, Context Menu, and Object Window use the authorized Cosmos templates and visual states; Tool Windows expose only Close and the complete Version 1 movement/resizing interaction.
