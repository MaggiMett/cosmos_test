# Domain

## Purpose

This document defines the conceptual domain of Cosmos.

It describes the fundamental concepts that exist inside the system and the relationships between them.

The Domain defines meaning.

It intentionally contains no implementation details, user interface descriptions or technical architecture.

---

# Cosmos

Cosmos is the complete environment in which users create, organize and evolve their personal universe.

It connects projects, knowledge, tools, Entities and intelligent systems into one coherent ecosystem.

Cosmos is the highest-level domain object.

Every independently addressable visible or interactive element within it uses the universal Object identity and state model.

---

# Project

A Project represents a vision that is transformed into reality.

A Project logically organizes everything that contributes to achieving that vision. Logical inclusion does not transfer ownership of native Resource files.

This includes:

- Knowledge
- Objects
- Resource mappings
- Relationships
- Workspaces
- Decisions
- Runtime references

A Project is a logical domain.

It is not limited to a single repository, application or technology.

A Project is an Object whose Project role is expressed by the `Project` System Tag. A System Project is the same Object contract with the additional `System` System Tag; it is not a separate Project class.

---

# Base

The Base represents the user's home inside Cosmos.

It provides access to Rooms, Workspaces and the Companion.

The Base is independent from the currently active Project.

Its visual appearance is defined by the active Theme.

The Base and its independently interactive elements are Objects with role-specific System Tags and Properties.

---

# Room

Rooms organize different areas inside the Base.

Each Room provides one or more Workspace Slots.

Rooms primarily organize the user's working environment.

They do not contain project logic.

A Room is an Object with the `Room` System Tag.

---

# Workspace

A Workspace represents a configurable place for working.

Workspaces define:

- Layout
- Overlay
- Context
- Tool collection
- Window arrangement

Workspaces are independent from their visual appearance.

Users may freely create, modify and organize Workspaces.

A Workspace definition is an Object with the `Workspace` System Tag. Its active Window and Tool representations remain separate Objects.

---

# Tool

A Tool is a reusable capability that performs one specific task.

Cosmos distinguishes between two Tool categories.

## User Tools

User Tools provide direct interaction.

Examples:

- Capture
- Archive
- Review
- Texture Editor
- Blueprint Builder

User Tools may open windows or panels.

---

## System Tools

System Tools operate in the background.

Examples:

- Knowledge Processor
- Analysis Engine
- Repository Analyzer
- Journeyman

System Tools support the system itself and usually have no direct user interface.

Runtime Translation is a Journeyman capability used during approved affected tasks, not a separate System Tool identity.

System Tools remain task-oriented capabilities.

Core Runtime infrastructure is not a Tool.

A Tool definition is an Object with the `Tool` System Tag. User Tool and System Tool responsibilities are composed through System Tags and capabilities rather than separate identity classes.

---

# Object

Object is the universal identity and state model of Cosmos.

Every independently addressable visible or interactive element is represented by an Object. Reusable definitions such as Themes, Skins and Templates are Objects even when not currently visible.

Objects may reference:

- Knowledge
- Resources
- Relationships
- Tags
- Versions

Objects remain independent from their visual representation.

Every Object follows `Identity → System Tags → Property Schemas → Properties → User Tags`. Domain concepts such as Project, Node, Workspace, Window, Tool, Theme, Template and Entity are Object roles, not parallel identity systems.

---

# Node

A Node is an Object with the `Node` System Tag and provides the map representation of an Object role.

Nodes organize Projects spatially.

The same Object may combine `Node` with tags such as `ProjectRoot`, `Domain`, `Cluster`, `Object` or `Detail`. No separate Node class hierarchy or duplicate semantic identity is created.

---

# Knowledge

Knowledge represents structured information stored inside Cosmos.

Every meaningful informational record preserved by Cosmos becomes Knowledge. Resources remain separate implementation assets.

Projects, Objects, Relationships, Blueprints and Resources remain distinct domain concepts. They do not become Knowledge; durable descriptions, summaries, analyses, decisions or transcripts about them may become Knowledge.

Knowledge may originate from:

- Captures
- submitted informational records from files and documents
- explicitly promoted conversation records
- durable descriptions of Blueprints
- Decisions
- External sources

Knowledge grows through refinement instead of replacement.

---

# Resource

Resources represent concrete implementation assets.

Examples include:

- Source files
- Images
- Models
- Audio
- Videos
- Configuration
- Documentation

Resources are referenced by Objects and remain owned by their native repository or source.

Knowledge describes Resources.

Resources never replace Knowledge.

---

# Tag

Tags classify Knowledge and Objects.

Cosmos distinguishes between two categories.

## System Tags

System Tags describe structural information.

Examples:

- Project
- Workspace
- Tool
- Object
- Blueprint
- Capture
- State

System Tags are generated and managed by Cosmos.

System Tags compose Object roles, activate capabilities and select the Property Schemas that must be complete for the Object.

---

## User Tags

User Tags describe meaning from the user's perspective.

Examples:

- Lore
- Dwarfs
- Magic
- Weapons
- Mining

Users are fully responsible for maintaining their own tagging strategy.

Cosmos may suggest improvements but never changes User Tags automatically.

Grouping, collections and discovery emerge from shared User Tags and queries rather than a dedicated collection model.

---

# Relationship

Relationships are persistent Project-owned domain records that connect exactly two Objects.

Relationships represent meaningful connections.

Version 1 defines one universal relationship:

- Related

Objects reference Relationships, but neither endpoint exclusively owns the record. Nodes and Connectors only visualize it.

Additional relationship types may be introduced later without changing the underlying architecture.

---

# Context

Context describes the current working situation.

Context is composed additively through the applicable active Runtime path.

```text
Direct Tool Mode:
Cosmos → Optional Project Scopes and Focus → Tool → Optional Object → Optional Knowledge

Workspace Mode:
Cosmos → Optional Project Scopes and Focus → Room → Workspace Session → Tool → Optional Object → Optional Knowledge
```

Project, Room, Workspace, Object and Knowledge segments contribute only when present. Project scope may contain zero, one or multiple assigned Projects plus an optional focused or primary Project.

Context reduces manual configuration and helps every Tool understand where it is currently operating.

---

# Entity

An Entity is a persistent identity with an active presence inside the Cosmos Runtime.

Entities may interact with users, other Entities and the environment.

Entity identity and configuration remain independent from visual appearance and optional AI Providers.

Entities never own business logic.

They request actions through Runtime Services.

---

# Theme

A Theme defines the visual representation of Cosmos.

Themes may customize:

- Backgrounds
- Base
- Rooms
- Workspaces
- Nodes
- Companion
- Objects
- Visual effects

Themes never change the underlying domain model.

Themes are Objects, but their Theme role is limited to appearance. A Theme represents another Object and never defines its identity, behavior or capabilities.

---

# Companion

The Companion is the user's constant Entity and assistant inside Cosmos.

The Companion exists independently from Projects and accompanies the user throughout the entire system.

It assists, explains, discovers and supports.

The Companion never replaces user decisions.

---

# Principles

- The Domain defines meaning.
- User interfaces are not part of the Domain.
- Technical implementation is not part of the Domain.
- Every Project follows the same Domain Model.
- Meaning belongs to Objects.
- System Tags compose Object roles and activate complete Property Schemas.
- Nodes are tag-composed Object representations.
- Knowledge grows continuously.
- Resources implement Objects.
- Context is inherited.
- Entities provide Runtime presence without owning business logic.
- Themes define appearance only.
- User Tag collections emerge without a separate grouping system.
- Everything is designed to be extensible.
