# Workspace Runtime

## Purpose

The Workspace Runtime manages every active Workspace session inside Cosmos.

It is responsible for creating, restoring, updating and destroying Workspace sessions while maintaining a consistent user experience.

The Workspace Runtime coordinates Tool Instances, Layouts and Runtime Context.

---

# Philosophy

A Workspace session is temporary.

Its Workspace definition is persistent.

The user's work is not.

The Workspace Runtime allows users to freely move between Workspaces while preserving their working environment.

Changing Workspaces should feel like walking to another desk rather than closing one application and opening another.

---

# Responsibilities

The Workspace Runtime is responsible for:

- opening Workspace sessions from persistent Workspace definitions
- closing Workspace sessions without removing their definitions
- restoring Workspace session state
- containing Tool Instances in Workspace Mode
- managing Panels
- managing Layouts
- synchronizing Runtime Context
- tracking active Workspace sessions

The Workspace Runtime never performs business logic.

---

# Workspace Session Lifecycle

Every active Workspace session follows the same lifecycle.

```text
Created

↓

Initialized

↓

Active

↓

Background

↓

Closed
```

Closing destroys the active session after restorable state is preserved. The persistent Workspace definition remains and may later be reopened as a new session.

---

# Active Workspace Session

Only one Workspace session is normally focused.

Multiple Workspace sessions may remain active simultaneously.

Background Workspace sessions continue preserving:

- Tool state
- Layout
- Tool Window positions and sizes
- Tool Window open state and focus order
- fixed Panel configuration

---

# Tool Instances

Every active Workspace session contains its Tool Instances.

Examples:

Workspace

↓

Capture

Archive

Blueprint Builder

↓

Individual Tool Instances

Tool Instances never belong to Projects.

The active Workspace session owns their containment and presentation placement. Tool Runtime owns each Tool Instance lifecycle.

Direct Tool Mode has no Workspace session and is outside Workspace Runtime ownership.

---

# Layout

The Workspace Runtime manages:

- the fixed Workspace Environment Window
- movable and resizable Tool Windows
- Tool Window open and close state
- Tool Window focus order
- fixed Tool Area and Panel configuration

Layout changes affect only the current Workspace session.

Version 1 does not provide free movement or resizing of the Workspace Environment Window, nor Tool Window minimize, maximize, docking or snapping.

---

# Panels

Panels are Runtime containers.

Examples include:

- left panel
- right panel
- inspector
- bottom panel
- Tool Area

Panels host Tool Instances.

They never contain business logic.

---

# Overlay

Every Workspace session loads exactly one Overlay from its persistent Workspace definition.

The Overlay defines:

- interaction points
- furniture
- physical appearance
- visual placement

Changing an Overlay never changes functionality.

---

# Context

The Workspace Runtime extends inherited Context.

Workspace Context includes:

- zero, one or multiple assigned Project scopes
- optional focused or primary Project
- active Room
- active Workspace session
- active Tools
- current Object
- current filters

Whenever Workspace Context changes, Tool Instances are notified automatically.

---

# State

Every active Workspace session maintains Runtime State.

Examples include:

- open Tool Instances
- selected Objects
- camera position
- active panels
- scroll positions
- temporary drafts

Workspace session state is restored whenever its persistent Workspace definition is reopened.

---

# Synchronization

Workspace changes are synchronized automatically.

Examples include:

- Tool opened
- Tool closed
- Layout changed
- Panel moved
- Object selected

Synchronization should feel immediate.

---

# Events

The Workspace Runtime reports completed lifecycle facts to Workspace Service. Workspace Service publishes Events including:

- WorkspaceOpened
- WorkspaceClosed
- WorkspaceFocused
- WorkspaceStateChanged
- LayoutChanged
- ToolOpened
- ToolClosed

Other Runtime systems subscribe through the Event Model.

---

# Failure Handling

Workspace failures remain isolated.

If one Workspace session becomes invalid:

- its Tool Instances are safely closed
- its Runtime State is preserved whenever possible
- other Workspaces continue operating normally

One broken Workspace must never stop the Runtime.

---

# Persistence

The Workspace Runtime coordinates preservation of restorable session state through Workspace Service for:

- current Layout state
- open Tool Instances
- Runtime State

Business data remains outside the Workspace Runtime.

Persistent Workspace definitions are stored through Workspace Service and Persistence. Workspace Runtime does not own their durability.

---

# Extensibility

Future extensions may introduce:

- collaborative Workspaces
- multi-monitor Workspaces
- VR Workspaces
- custom panel systems
- advanced layout managers
- more flexibly sized Workspace Environment Windows
- Tool Window minimize, maximize, docking and snapping

All extensions integrate through the same Workspace Runtime contract.

---

# Design Goal

The Workspace Runtime should make every Workspace feel persistent and alive.

Users should always return to the same workplace exactly as they left it, allowing them to focus entirely on their work instead of managing software.

---

# Principles

- Workspace definitions are persistent.
- Active Workspace sessions are temporary.
- User work is persistent.
- Workspace sessions contain Tool Instances in Workspace Mode.
- Tool Runtime owns Tool Instance lifecycle.
- Default Layout belongs to the Workspace definition; active Layout state belongs to the session.
- Context updates automatically.
- Workspace failures remain isolated.
- State is restorable.
- Business logic remains outside the Workspace Runtime.
