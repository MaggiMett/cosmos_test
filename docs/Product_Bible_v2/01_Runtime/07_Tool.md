# Tool

## Purpose

A Tool represents a reusable capability inside Cosmos.

A Tool definition and every independently addressable Tool Instance use the universal Object Model. User Tool and System Tool are System-Tag and capability combinations, not separate identity classes.

Tools allow users or the system to perform specific tasks while remaining independent from Projects, Workspaces and Themes.

Every task-oriented capability that follows the Tool contract is implemented as a Tool.

Core Runtime coordination is not a Tool capability.

---

# Philosophy

Tools perform work.

They should do one thing well.

A Tool is not tied to a specific Project, Workspace or Theme.

Instead, it adapts to the Context provided by the Runtime.

---

# Responsibilities

A Tool is responsible for:

- performing a specific capability
- interacting with Objects
- reading and writing Knowledge
- operating on Resources
- reacting to Context
- preserving its own state

Tools never own Projects or Objects.

---

# Tool Categories

Cosmos defines two Tool categories.

## User Tools

User Tools provide direct interaction.

Examples include:

- Capture
- Archive
- Review
- Blueprint Builder
- Texture Editor
- Code Editor

User Tools may open windows or panels.

---

## System Tools

System Tools support Cosmos itself.

Examples include:

- Knowledge Processor
- Analysis Engine
- Repository Analyzer
- Context Builder
- Journeyman

System Tools usually have no direct user interface.

They may operate in the background when a Runtime task triggers them. Repository analysis and Journeyman Runtime Translation remain demand-driven.

System Tools remain Extensions that execute task-oriented work through Runtime contracts.

Runtime Translation is a capability of the Journeyman System Tool, not a separate Tool definition or Tool Instance.

Runtime Services, Registries, Persistence, Entity Runtime, Provider Runtime, Theme Runtime, Event Dispatcher and Job Scheduler are Core Runtime infrastructure and are not Tool definitions or Tool Instances.

---

# Tool Instances

A Tool definition is not a running Tool.

Every opened Tool creates a Tool Instance.

Example:

Archive

↓

Archive Instance A

Archive Instance B

Capture

↓

Capture Instance

Each Tool Instance maintains its own independent state.

Tool Runtime owns the lifecycle of every Tool Instance.

In Direct Tool Mode, Tool Runtime owns one active Tool Instance directly. It has no Workspace session, Room, Panels or multi-window Layout.

In Workspace Mode, an active Workspace session contains one or more Tool Instances and owns their presentation placement, while Tool Runtime continues to own each Instance lifecycle.

---

# Context

Tools never determine Context themselves.

Context is inherited automatically.

```text
Direct Tool Mode:
Cosmos → Optional Project Scopes and Focus → Tool

Workspace Mode:
Cosmos → Optional Project Scopes and Focus → Room → Workspace Session → Tool
```

The Runtime provides the complete Context before the Tool performs any action.

Assigned Project scopes may contain zero, one or multiple Projects, with an optional focused or primary Project for defaults and emphasis.

---

# Objects

Tools operate on Objects.

Objects represent meaning.

Tools provide capabilities.

Examples include:

Capture

↓

Create Knowledge

Archive

↓

Browse Knowledge

Blueprint Builder

↓

Modify Object Structure

Texture Editor

↓

Edit Resource

---

# Windows

User Tools may appear as:

- movable Tool Windows
- resizable Tool Windows
- closable Tool Windows

Presentation is determined by the Workspace.

Not by the Tool.

Version 1 does not support Tool Window minimize, maximize, docking or snapping. Those presentation capabilities may extend the same Tool Window contract in future versions.

---

# Theme Representation

Themes never change Tool functionality.

Themes only customize presentation.

Examples include:

- icons
- colors
- materials
- animations
- sounds

A Tool behaves identically across every Theme.

---

# Permissions

Every Tool declares the capabilities it requires.

Examples include:

- read Knowledge
- write Knowledge
- modify Resources
- create Objects
- access AI Providers

The Runtime grants only the required permissions.

---

# State

Each Tool Instance stores its own state.

Examples include:

- current selection
- filters
- scroll position
- open documents
- temporary drafts

Closing a Tool should not unnecessarily discard user work.

---

# Communication

Tools never communicate directly with one another.

They communicate through the Runtime.

Typical interactions include:

- Events
- Context
- Object updates
- Runtime services

This keeps Tools independent and reusable.

---

# Extensibility

Tools are fully extensible.

Users and future extensions may introduce new User Tools or System Tools.

Every Tool follows the same Runtime contract.

This allows Cosmos to grow without increasing Core complexity.

---

# Design Goal

A Tool should feel like a natural extension of the user's workplace.

Users should be able to combine Tools freely without learning different interaction models.

Every Tool follows the same principles regardless of its purpose.

---

# Principles

- Tools perform work.
- Tools are independent.
- Tools inherit Context.
- Tools operate on Objects.
- Tools never own Knowledge.
- Multiple Tool Instances are allowed.
- Themes change appearance only.
- Every Tool follows the same contract.
- Core Runtime infrastructure is not a Tool.
- Everything is extensible.
