# Context

## Purpose

Context represents the current working situation inside Cosmos.

It provides every Runtime component with the information required to understand where the user is working, what they are working on and how that work relates to the rest of the system.

Context reduces repeated configuration without changing persistent meaning.

---

# Philosophy

Users should not repeatedly explain their current Project, Workspace, Tool or Object.

Cosmos composes Context from the active Runtime path and assigned Context Tags.

Every Tool receives Context from the Runtime instead of discovering it independently.

---

# Responsibilities

Context is responsible for:

- providing working scope
- combining inherited semantic information
- filtering relevant content
- reducing manual configuration
- supporting intelligent systems
- preserving consistency across Runtime actions

Context never performs work.

It only describes the current situation.

---

# Context Model

Context is composed through the active Runtime path.

```text
Direct Tool Mode:
Cosmos → Optional Project Scopes and Focus → Tool → Optional Object → Optional Knowledge

Workspace Mode:
Cosmos → Optional Project Scopes and Focus → Room → Workspace Session → Tool → Optional Object → Optional Knowledge
```

Each level contributes additional Context.

Lower levels extend inherited Context and never silently replace it.

---

# Optional Project Scopes

Project Context is optional and consists of assigned Project scopes plus optional focus.

A user may work with:

- zero assigned Project scopes
- one assigned Project scope
- multiple assigned Project scopes
- an optional focused or primary Project within the available scope when a default or emphasis is needed

Focus never removes or silently replaces other assigned Project scopes.

This allows project-specific Workspaces and cross-project Workspaces without introducing separate Workspace types.

---

# Runtime Context

Runtime Context is the live additive view of the current Runtime path. The Runtime rebuilds it as navigation, focus or active state changes and injects it into ordinary Tools and Services.

A Runtime Context may contain:

- zero, one or multiple assigned Project IDs
- optional focused or primary Project ID
- active Room
- active Workspace session
- active Tool Instance
- active Object
- inherited System Tags
- inherited User Tags
- Theme and Skin information
- permissions
- Runtime state

Different Tools may use different parts of the available Context.

---

# Context Tags

Context is primarily expressed through additive Tags.

Examples include:

System Tags:

- Project
- Room
- Workspace
- Tool
- Object
- Blueprint

User Tags:

- Lore
- Dwarfs
- Mining
- Magic

A Tool receives the merged Context Tags of the current path plus its local additions.

---

# Workspace Context

Every persistent Workspace definition defines its own Context additions.

Examples include:

- assigned Project scopes
- optional default focused or primary Project
- preferred Objects
- default Archive filters
- active Branches
- User Tags

When the user changes Project focus, the Layout and Panels may remain while content and filters update to the new Context.

---

# Tool Context

Tools never discover Context themselves.

The Runtime provides Context before any Tool action.

This keeps Tool definitions reusable and prevents duplicated Context logic.

---

# Object and Knowledge Context

Selecting an Object adds Object-specific Context.

Knowledge created or opened through that Object may inherit the Object and Workspace Tags.

Inherited Tags remain removable where the product explicitly allows user control, but the original source Context remains traceable.

---

# Context Snapshots

A Context Snapshot is an immutable capture of Runtime Context at task, command or Job initiation.

A Snapshot may contain:

- Project scopes
- optional focused or primary Project ID
- Room and Workspace session IDs
- Tool and Object IDs
- inherited Tags
- permissions
- initiating user
- timestamp

Later navigation does not alter a running operation.

---

# Context Packages

A Context Package is a temporary, minimal and authorized task-specific view of a Context Snapshot plus resolved referenced Objects, Knowledge, Resources, Blueprints, Reviews and Runtime configuration required by the task.

Context Builder is the canonical component for assembling every Context Package. Consumers request and receive Packages; they never assemble independent task Context.

Context Packages do not replace ordinary Runtime Context injection into Tools and Services.

---

# Discovery

Context allows Analysis and Companion features to remain relevant.

It supports discovery of:

- related Objects
- duplicate Knowledge
- missing information
- inconsistent Tags
- potential Relationships

Discovery remains scoped to relevant Context unless a global analysis is explicitly requested.

---

# Persistence

Context itself is Runtime data.

Persistent Workspace definitions, assigned Tags and restorable state are stored separately.

Context is rebuilt from those durable sources whenever the Runtime starts or navigation changes.

---

# Extensibility

Extensions may contribute additional Context fields and Tags through defined contracts.

They may not create independent Context systems.

---

# Design Goal

Context should become invisible.

Users should experience Cosmos as understanding where they are and what they are trying to accomplish without repeated configuration.

---

# Principles

- Context is composed additively.
- Project scopes are optional and may be zero, one or multiple.
- Focus or primary Project selection is optional.
- Workspace definitions may carry assigned Project scopes.
- Tools receive Context from the Runtime.
- Context never owns persistent meaning.
- Snapshots preserve long-running work.
- Context Builder assembles task-specific Context Packages.
- Extensions share one Context model.
