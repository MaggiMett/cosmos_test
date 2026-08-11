# Runtime Model

## Purpose

This document defines how Cosmos behaves while it is running.

Unlike the Domain and Architecture documents, the Runtime Model describes how information, Context and actions move through the system.

The Runtime Model defines interaction while avoiding storage or API implementation details.

---

# Runtime Philosophy

Cosmos behaves as one continuous system.

The user should not feel like they are switching between disconnected applications.

Projects, Workspaces, Tools, Entities, Knowledge and Resources participate in one coherent Runtime.

---

# Runtime Paths

Cosmos supports two primary working paths.

## Direct Tool Mode

```text
Cosmos Map
    ↓
Optional Project Scopes, Project Focus or Object Focus
    ↓
One User Tool beside the visible map
```

Direct Tool Mode is intended for focused work with one Tool while preserving the visible constellation.

Tool Runtime creates and owns the lifecycle of the single active Tool Instance. Direct Tool Mode has no Workspace session, Room, Panels or multi-window Layout.

## Workspace Mode

```text
Base or Project Shortcut
    ↓
Room
    ↓
Workspace
    ↓
Multiple Tool Instances
```

Workspace Mode is intended for complex work involving several windows or Tools.

Workspace Runtime opens a temporary active Workspace session from a persistent Workspace definition. The session contains its multiple Tool Instances and presentation state; Tool Runtime owns each Tool Instance lifecycle.

Both modes use the same Tool definitions, Runtime Services and Context model.

---

# Context Composition

Context is composed additively through the active Runtime path.

```text
Direct Tool Mode:
Cosmos → Optional Project Scopes and Focus → Tool → Optional Object → Optional Knowledge

Workspace Mode:
Cosmos → Optional Project Scopes and Focus → Room → Workspace Session → Tool → Optional Object → Optional Knowledge
```

Assigned Project scopes may contain zero, one or multiple Projects. An optional focused or primary Project provides defaults and emphasis without removing other assigned scopes.

No component needs to rediscover Context that has already been established.

---

# Runtime Context

Runtime Context may include:

- zero, one or multiple assigned Project scopes
- optional focused or primary Project
- active Room
- active Workspace session
- active Tool Instance
- active Object
- inherited System Tags
- inherited User Tags
- Theme and Skin resolution
- permissions
- Runtime state

Runtime injects the current Runtime Context into ordinary Tools and Services.

A Context Snapshot is an immutable capture of Runtime Context for a task or long-running operation, so later navigation does not alter that work.

A Context Package is the minimal authorized task-specific view of a Context Snapshot plus resolved referenced information. Context Builder is the canonical component that assembles every Context Package.

---

# User Interaction

Every state-changing interaction follows one consistent path.

```text
Client or Tool
    ↓
Command
    ↓
Runtime Service
    ↓
Authoritative Permission Validation
    ↓
Business Validation
    ↓
Transaction and Persistence
    ↓
Event Publication
    ↓
Optional Subscriber Reaction
    ↓
Optional Command or Request to a Runtime Service
    ↓
Optional Long-Running Job Creation by that Service
```

Queries read through Runtime Services without changing state.

UI, Entity Runtime and Bundle Runtime may perform non-authoritative preflight checks for feedback. Runtime Services always repeat the authoritative permission and business validation before execution.

---

# Knowledge Flow

Information develops through a traceable lifecycle.

```text
Idea or Source
    ↓
Capture or Import
    ↓
Knowledge
    ↓
Processing and Discovery
    ↓
Object Association
    ↓
Resource Implementation
    ↓
Real Product
```

Original sources remain preserved.

Processing enriches Knowledge without overwriting user intent.

---

# Runtime State

Active Workspace sessions and Tool Instances preserve restorable state such as:

- open Tools
- window positions
- selected Objects
- filters
- drafts
- camera positions
- Theme and Skin overrides

Domain data and Runtime state remain separate.

Persistent Workspace definitions remain separate from temporary active Workspace sessions and their restorable state.

---

# Runtime Services

Runtime Services own authoritative business behavior.

They:

- validate Commands
- enforce permissions
- coordinate transactions
- access Persistence
- publish Events
- create Jobs for long-running work

UI, MCP, Entities, Companion, Journeyman and Extensions all use the same Services.

---

# Events

Events announce completed changes.

They are immutable, contextual and published only after successful transactions.

Events allow independent components to react without direct coupling.

Events never request work or create Jobs. A subscriber may react by sending a Command or request to a Runtime Service.

---

# Jobs

Long-running work executes through the Job Runtime.

Examples include:

- Knowledge processing
- analysis
- repository validation
- AI execution
- resource generation
- indexing

Jobs receive Context Snapshots and never bypass Runtime Services.

Ordinary state changes remain synchronous Service transactions. Only long-running work becomes a Job, and only Runtime Services create Jobs.

---

# System Tools

System Tools support Cosmos in the background.

Examples include:

- Knowledge Processor
- Analysis Engine
- Context Builder
- Repository Analyzer
- Journeyman

They operate through Runtime contracts and should avoid unnecessary user interruption.

System Tools execute task-oriented capabilities.

Runtime Translation is a demand-driven capability of Journeyman during approved affected tasks, not a separate System Tool identity. Repository Analyzer performs triggered read-only repository analysis.

Runtime Services, Registries, Persistence, the Entity Runtime, Provider Runtime, Theme Runtime, Event Dispatcher and Job Scheduler are Core Runtime infrastructure rather than System Tools.

---

# Entity Runtime

The Entity Runtime manages active Entity lifecycle, Scope, State and interaction coordination.

Entity definitions are discovered through the shared Registry System.

Durable Entity identity and configuration are changed through Runtime Services and stored through Persistence.

The Entity Runtime never owns business logic and never accesses Persistence directly.

---

# Discovery

Cosmos prefers evidence over interruption.

The Runtime collects patterns over time and presents Review items only when a meaningful threshold has been reached.

The user decides whether suggestions become permanent Knowledge, Tags, Relationships or structure.

---

# Extensibility

Every Extension participates in shared Runtime systems:

- Registries
- Runtime Services
- Context
- Permissions
- Events
- Jobs
- Persistence
- Validation

Extensions add capabilities without creating parallel architectures.

---

# Runtime Goal

The Runtime should feel invisible.

The user should experience one living world in which every action naturally builds on existing Context and Knowledge.
