# Project Runtime

## Purpose

The Project Runtime manages the lifecycle of Projects while Cosmos is running.

It is responsible for loading, activating, reflecting committed Project changes and unloading Projects while preserving Context and Runtime consistency.

The Project Runtime is the bridge between persistent Project data and the active Runtime.

Every loaded Project is an Object with the `Project` System Tag. The additional `System` tag changes purpose and activated schemas, not Project lifecycle or identity.

---

# Philosophy

Projects are permanent.

Runtime is temporary.

The Project Runtime brings Projects into the active Runtime whenever they are needed and safely releases them when they are no longer active.

Projects never disappear.

Only their Runtime representation changes.

---

# Responsibilities

The Project Runtime is responsible for:

- loading Projects
- activating Projects
- unloading Projects
- reflecting committed Project state in the active Runtime
- contributing assigned Project scopes and optional Project focus to Runtime Context
- coordinating Runtime Services
- managing Project lifetime
- exposing active Projects

The Project Runtime never performs business logic.

---

# Project Lifecycle

Every Project follows the same Runtime lifecycle.

```text
Discovered

↓

Loaded

↓

Initialized

↓

Active

↓

Suspended

↓

Unloaded
```

Only Active Projects participate in the Runtime.

---

# Loading

Loading a Project includes:

- reading Project metadata
- restoring Runtime state
- loading Objects
- restoring Relationships
- restoring Workspace references
- restoring Context
- verifying that committed Prepared Structure records resolve to physically existing Project-managed locations

Loading never modifies Project content.

Missing physical Prepared Structures are a recovery condition, not permission to expose virtual folders. Recovery must restore or explicitly fail the Project before activation.

---

# Initialization

During initialization the Runtime:

- validates the Project
- resolves Extensions
- restores Context
- prepares Runtime Services
- registers active Objects
- validates complete Properties for every active Project System Tag schema

The Project becomes available only after successful initialization.

---

# Active Projects

Active Projects participate in the Runtime.

Active Projects may:

- receive Context
- participate in opening Workspace sessions through Runtime Services
- execute Tools
- request long-running Jobs through Runtime Services
- receive Events

Multiple Projects may remain loaded simultaneously.

One Project may optionally be focused or primary while multiple Projects remain active or assigned.

---

# Focus

Project Focus identifies the optional primary Project for defaults and emphasis.

Changing focus does not unload other Projects.

Focus influences defaults for newly opened Tools and Workspace sessions without removing other assigned Project scopes.

---

# Runtime Context

The Project Runtime contributes the optional Project layer of Runtime Context.

Examples include:

- zero, one or multiple assigned Project IDs and Tags
- optional focused or primary Project ID
- active Theme
- available Objects
- Runtime configuration

Direct Tool Instances and active Workspace sessions inherit the applicable assigned scopes and optional focus from Runtime Context.

---

# Synchronization

The Project Runtime keeps the active in-memory representation aligned with completed Runtime Service transactions for:

- Runtime State
- Object changes
- Knowledge updates
- Resource references
- Relationships

This is Runtime state coordination, not repository analysis or repository synchronization. Repository-derived Resource mapping or Project metadata changes require an explicit or affected-task trigger and the canonical Runtime Service transaction.

---

# Repository Integration

Projects may reference one or more external repositories.

The Project Runtime never owns repository contents.

Repository Runtime coordinates:

- repository references
- lightweight availability, file-change, branch-change and health signals
- current mapping and repository state views

Repository Analyzer performs triggered read-only analysis. Journeyman orchestrates Runtime Translation and approved implementation through the selected development Provider during affected tasks. Project Service persists repository references and Project metadata, while Resource Service persists Project-owned Resource mapping changes through the canonical Service pipeline.

---

# Runtime State

Each Project maintains its own Runtime State.

Examples include:

- opened Workspace sessions
- focused Objects
- camera position
- selected Nodes
- temporary selections

Runtime State may be restored after restart.

---

# Events

The Project Runtime reports completed lifecycle facts to Project Service. Project Service publishes Events including:

- ProjectLoaded
- ProjectActivated
- ProjectFocused
- ProjectSuspended
- ProjectUnloaded

Other Runtime systems react through the Event Model.

---

# Failure Handling

If a Project fails to load:

- the failure is isolated
- other Projects remain available
- partial initialization is rolled back
- the user receives a clear explanation

One invalid Project must never destabilize Cosmos.

---

# Extensibility

Future extensions may contribute additional Project Runtime behavior.

Examples include:

- collaborative sessions
- cloud synchronization
- remote repositories
- distributed Projects

All extensions integrate through Runtime Services.

---

# Design Goal

The Project Runtime should make Projects feel alive while keeping their underlying data stable and independent.

Users should experience Projects as continuously available worlds rather than files that are repeatedly opened and closed.

---

# Principles

- Projects are permanent.
- Runtime is temporary.
- Loading never changes Projects.
- Focus changes Context.
- Runtime State is separate from Project data.
- Repositories remain external.
- Synchronization is transparent.
- One failed Project never affects others.
