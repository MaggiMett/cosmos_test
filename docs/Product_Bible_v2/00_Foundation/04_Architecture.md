# Architecture

## Purpose

This document describes the conceptual architecture of Cosmos.

It explains how the major building blocks of the system relate to each other.

The Architecture defines structure.

It does not describe implementation details, programming languages or runtime behavior.

---

# Overview

Cosmos is designed as a layered system.

Every layer has a single responsibility.

Higher layers organize lower layers.

Lower layers never define higher layers.

This creates a stable architecture that remains extensible over time.

Every independently addressable visible or interactive component in these layers uses one universal Object contract. The named components below are System-Tag-activated roles and responsibility boundaries, not competing identity classes.

---

# Architecture Hierarchy

```text
Cosmos
│
├── Projects
│
├── Base
│   └── Rooms
│       └── Workspaces
│           └── Tools
│
├── Objects
│   ├── Knowledge
│   ├── Resource Mappings
│   ├── Tags
│   └── Relationships
│
├── Entities
│
└── Runtime Services
```

---

# Cosmos

Cosmos is the root environment.

It connects every Project, every Workspace and every system component into one coherent operating system.

Cosmos owns global navigation, spatial experience and shared Runtime coordination.

---

# Projects

Projects represent visions.

Every Project provides a structured environment for transforming an idea into reality.

Projects organize Objects, Project-owned Relationships and Resource mappings, and may connect to one or more repositories.

They never duplicate Knowledge.

Projects are Objects with the `Project` System Tag. Projects that extend Cosmos also carry `System`; System Projects remain normal Projects.

---

# Base

The Base is the user's home.

It provides permanent access to Rooms, Workspaces and the Companion.

The Base exists independently from Projects.

A Workspace definition may be opened globally or with zero, one or multiple assigned Project scopes.

---

# Rooms

Rooms organize the Base.

A Room provides one or more Workspace Slots.

Rooms exist for organization and immersion.

They do not contain business logic.

---

# Workspaces

Workspace definitions are persistent, configurable working environments.

A Workspace definition combines:

- Layout
- Overlay
- Context
- Tool assignments
- default window configuration

A Workspace definition defines how the user works.

It never defines what the user works on.

Workspace Runtime opens a temporary active Workspace session from a definition. The session provides the multi-window environment and contains its active Tool Instances.

The persistent Workspace definition, its fixed Workspace Environment Window and its Tool Windows are Objects with distinct identities and appropriate System Tags. In Version 1, the Environment Window has fixed placement and sizing; contained Tool Windows are movable, resizable and closable.

---

# Tools

Tools perform actions.

User Tools provide direct interaction.

System Tools support Cosmos in the background.

Tools remain independent from Projects and Themes and operate through Runtime Services.

Core Runtime infrastructure coordinates Tools but is not itself a Tool.

Tool definitions and addressable Tool Instances use the universal Object model. Tool capabilities are activated by System Tags and schemas, not by a separate Tool identity system.

---

# Objects

Objects provide the universal identity and state model.

Every independently addressable visible or interactive element is represented by an Object. Reusable Themes, Skins and Templates are Objects even when not currently visible.

Objects connect:

- Knowledge
- Resource mappings
- Tags
- Relationships
- Versions

Objects are the central semantic entity of Cosmos.

Every Object follows `Identity → System Tags → Property Schemas → Properties → User Tags`. System Tags compose roles; required Properties are always complete; User Tags provide user-defined meaning and emergent collections.

---

# Knowledge

Knowledge stores understanding.

It preserves ideas, documentation, discoveries and decisions.

Domain entities and Resources remain distinct. Durable informational records about them may be stored as Knowledge; the entities and Resources themselves never become Knowledge.

Knowledge grows continuously through refinement and may support multiple Projects without duplication.

---

# Resources

Resources contain implementation.

Resources include files, source code, textures, models, documents and other physical assets.

They remain in their native repositories or sources and are connected to Objects through stable mappings.

Knowledge explains Resources.

---

# Tags

Tags organize meaning and Context.

System Tags describe structure.

User Tags describe the user's language and organization.

Together they build contextual understanding without imposing a rigid hierarchy.

System Tags also activate Object capabilities and Property Schemas. User Tags support grouping and discovery without a separate collection architecture.

---

# Relationships

Relationships are persistent Project-owned records that connect exactly two Object endpoints.

Version 1 supports only the universal `Related` type. Specialized types are future extensions.

Objects reference Relationships. Nodes and Connectors visualize them without owning them.

---

# Entities

Entities provide persistent identity and active presence inside the Runtime.

The Entity Runtime manages Entity lifecycle and active state.

Entity definitions are resolved through the shared Registry System.

Entity actions and durable changes pass through Runtime Services and Persistence like every other Runtime client.

Entities never own business logic.

---

# Context Flow

Context is composed additively through the active Runtime path.

```text
Direct Tool Mode:
Cosmos → Optional Project Scopes and Focus → Tool → Optional Object

Workspace Mode:
Cosmos → Optional Project Scopes and Focus → Room → Workspace Session → Tool → Optional Object
```

Each layer contributes additional Context.

Lower layers extend higher Context and never silently replace it.

Assigned Project scopes may contain zero, one or multiple Projects. An optional focused or primary Project provides defaults and emphasis without replacing the assigned scopes.

---

# Extensibility

Every major component of Cosmos is designed for extension.

Examples include:

- Themes and Skins
- User Tools
- System Tools
- Workspace Blueprints
- Object Blueprints
- Capture Templates
- Providers
- Integrations
- Entities
- Structure Templates
- Prepared Structures and Extension Points

The Core defines contracts.

Extensions provide capabilities.

Future growth should extend Objects, System Tags, Property Schemas, Prepared Structures and Extension Points before creating a parallel system.

---

# Separation of Responsibilities

Projects organize visions.

Objects provide universal identity and state.

Knowledge organizes understanding.

Resources provide implementation.

Tools provide capabilities.

Entities provide Runtime presence and interaction.

Runtime Services own business behavior.

Workspaces organize work.

Rooms organize the Base.

The Base provides a home.

Cosmos connects everything together.

Themes represent these Objects and define appearance only.

---

# Architectural Goal

The architecture of Cosmos should remain stable for many years.

New functionality should emerge by extending existing concepts instead of introducing special cases.

The simpler the Core remains, the more powerful Cosmos becomes.
