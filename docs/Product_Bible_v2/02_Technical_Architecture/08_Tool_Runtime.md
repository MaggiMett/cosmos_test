# Tool Runtime

## Purpose

The Tool Runtime manages every active Tool Instance inside Cosmos.

It is responsible for creating, executing, suspending and destroying Tool Instances while providing them with Context, Runtime Services and communication through the Event Model.

The Tool Runtime transforms Tool definitions into executable Runtime instances.

It is the lifecycle owner for Tool Instances in both Direct Tool Mode and Workspace Mode.

---

# Philosophy

A Tool Definition describes what a Tool can do.

A Tool Instance performs the work.

Tool Instances are lightweight, isolated and replaceable.

Users may freely create, close and reopen Tool Instances without affecting the underlying Project or Object.

---

# Responsibilities

The Tool Runtime is responsible for:

- creating Tool Instances
- initializing Tool Instances
- providing Runtime Context
- providing Runtime Services
- managing Tool lifecycle
- routing Events
- preserving Tool State
- safely shutting down Tool Instances

The Tool Runtime never performs business logic itself.

---

# Execution Modes

In Direct Tool Mode, Tool Runtime creates and owns one active Tool Instance without a Workspace session, Room, Panels or multi-window Layout. When Direct Tool Mode closes, Tool Runtime requests eligible Tool State persistence through Tool Service and then destroys the Instance.

In Workspace Mode, an active Workspace session contains one or more Tool Instances and owns their presentation placement. Tool Runtime still creates, initializes, suspends, closes and destroys each Instance.

Opening a second Tool or arranging multiple windows requires an active Workspace session and therefore uses Workspace Mode.

---

# Tool Lifecycle

Every Tool Instance follows the same lifecycle.

```text
Created

↓

Initialized

↓

Ready

↓

Active

↓

Background

↓

Suspended

↓

Closed

↓

Destroyed
```

Destroyed Tool Instances leave no Runtime state except persistent Tool State.

---

# Initialization

During initialization the Runtime:

- resolves the Tool definition
- performs non-authoritative permission grant and availability preflight for activation feedback
- injects Runtime Services
- injects Runtime Context
- restores Tool State
- subscribes to Events

Only after successful initialization does the Tool become active.

Runtime Services remain the only authoritative permission enforcement boundary for every Command. Tool Runtime preflight never authorizes a business operation.

---

# Runtime Context

Every Tool Instance receives the current Runtime Context for ordinary active execution.

Typical Context includes:

- zero, one or multiple assigned Project scopes
- optional focused or primary Project
- active Workspace session when in Workspace Mode
- active Object
- inherited Tags
- current Theme
- current Runtime State

Tool Instances never discover Context themselves.

Long-running work receives a Context Snapshot through the applicable Runtime contract. Task-specific Context Packages are assembled by Context Builder, not by Tool Runtime or Tool Instances.

---

# Runtime Services

Tool Instances never access the Core directly.

Instead they use Runtime Services.

Examples include:

Knowledge Service

Object Service

Workspace Service

Resource Service

Relationship Service

Job Service

All Runtime modifications occur through Services.

---

# Commands

Tool Instances initiate work by sending Commands.

Examples include:

Create Knowledge

Rename Object

Import Resource

Create Relationship

Commands never modify the Runtime directly.

They are handled by Runtime Services.

---

# Queries

Tool Instances retrieve information through Queries.

Examples include:

Find Objects

Search Knowledge

Resolve Tags

Load Resources

Queries never modify Runtime state.

---

# Events

Tool Instances subscribe to Runtime Events.

Examples include:

KnowledgeUpdated

ObjectRenamed

WorkspaceChanged

ThemeChanged

ProjectFocused

Events allow Tool Instances to react without creating direct dependencies.

---

# Tool State

Every Tool Instance maintains local Runtime State.

Examples include:

- current selection
- active tab
- editor cursor
- scroll position
- temporary input
- draft content

Local State belongs only to the Tool Instance.

---

# Persistence

Whenever appropriate, Tool State is persisted.

Examples include:

- editor drafts
- open documents
- layout preferences
- selected filters

Temporary calculations are not persisted.

---

# Isolation

Tool Instances remain isolated.

A failing Tool Instance:

- cannot crash another Tool
- cannot corrupt Runtime state
- cannot bypass Runtime Services

Failures remain local.

---

# Communication

Tool Instances never communicate directly.

Communication always occurs through:

- Runtime Services
- Events
- Runtime Context

This prevents hidden dependencies.

---

# Permissions

Every Tool Instance executes with explicitly granted permissions.

Examples include:

- read Knowledge
- modify Resources
- create Objects
- access Providers

Permission checks occur inside Runtime Services.

---

# Background Execution

Tool Instances may continue background work.

Examples include:

- indexing
- imports
- previews
- synchronization

Long-running work should be delegated to the Job Runtime whenever possible.

---

# Shutdown

Before closing, a Tool Instance:

- saves persistent state
- releases Runtime resources
- unsubscribes from Events
- disposes temporary resources

Shutdown should leave no orphaned Runtime objects.

---

# Failure Handling

If a Tool Instance fails:

- the failure is isolated
- unsaved work is recovered whenever possible
- the Runtime remains operational
- Workspace session state remains valid when applicable

Tool failures must never destabilize Cosmos.

---

# Extensibility

Every future Tool follows the same Runtime contract.

Additional capabilities may be introduced without changing the Tool Runtime architecture.

---

# Design Goal

Tool Instances should feel lightweight, reliable and completely interchangeable.

Users should think about their work—not about the software executing it.

---

# Principles

- Tool Definitions describe capabilities.
- Tool Instances perform work.
- Tool Runtime owns every Tool Instance lifecycle.
- Direct Tool Mode has one Tool Instance and no Workspace session.
- Workspace Mode contains Tool Instances in an active Workspace session.
- Runtime Services own business logic.
- Tool Instances receive Context.
- Communication happens through Events.
- State belongs to Tool Instances.
- Failures remain isolated.
- Every Tool follows one Runtime contract.
