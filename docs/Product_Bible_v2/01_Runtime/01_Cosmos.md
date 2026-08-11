# Cosmos

## Purpose

Cosmos is the central environment of the operating system.

It provides the spatial overview of the user's personal universe and serves as the primary entry point into every Project.

Unlike traditional applications, Cosmos is not a collection of pages.

It is one continuous world.

---

# Responsibilities

Cosmos is responsible for:

- global navigation
- Project visualization
- spatial organization
- orientation
- Context transitions
- relationship visualization
- Theme rendering
- access to the Base

Cosmos supports two working modes.

Direct Tool Mode allows one User Tool to open beside the visible map for focused work without leaving Cosmos.

Workspace Mode provides a multi-window environment for complex work involving several Tools.

Cosmos itself does not own editing logic. Every action is still performed by a Tool.

---

# Spatial Environment

Cosmos represents Projects as visible structures inside one shared universe.

Projects are not isolated windows.

They coexist within the same environment.

Users freely navigate through this space using:

- Pan
- Zoom
- Focus
- Quick Travel

The environment continuously maintains spatial orientation.

---

# Projects

Every Project exists as its own constellation.

A Project contains its own internal Node structure.

Projects may be freely positioned.

Their position becomes part of the user's long-term mental map.

Cosmos never reorganizes Projects automatically.

---

# Constellations

Each Project is visualized as a constellation.

Constellations represent structure rather than storage.

Nodes are Objects with the `Node` System Tag and represent Object roles without duplicating identity.

Connection Objects represent structural placement, accepted Relationships or non-persistent discovery candidates.

The visual structure should help users understand complexity without exposing technical implementation.

---

# Nodes

Node Objects provide direct access to the identity and capabilities composed by their System Tags.

They may represent:

- categories
- branches
- objects
- systems
- folders
- important entry points

Nodes visualize meaning.

They never replace the underlying Object.

---

# Navigation

Navigation always preserves orientation.

Supported navigation methods include:

- free exploration
- search
- Companion guidance
- Quick Travel
- object references
- workspace shortcuts

Users should always understand where they are.

---

# Focus

Focusing a Project identifies the optional primary Project within the active Context.

The surrounding universe remains visible.

Other assigned Project scopes remain part of the current working Context.

Focus never disconnects the user from Cosmos.

---

# Context

Cosmos initiates Context inheritance.

Context follows the active working mode:

```text
Direct Tool Mode:
Cosmos → Optional Project Scopes and Focus → Tool → Optional Object

Workspace Mode:
Cosmos → Optional Project Scopes and Focus → Room → Workspace Session → Tool → Optional Object
```

Assigned Project scopes are optional and may contain zero, one or multiple Projects.

When a Project is focused, it becomes the optional primary Context for defaults and emphasis without replacing other assigned scopes.

Without assigned Project scopes, Cosmos provides global Context. Project focus remains optional when scopes are assigned.

---

# Direct Tool Mode

From global, Project-focused or Object-focused Context, the user may open one User Tool directly beside the map.

This mode preserves the constellation and surrounding Project structure while the user performs one focused task.

Tool Runtime creates, restores and closes the single Direct Tool Mode Tool Instance. The Instance has no Workspace session and receives Runtime Context directly from the Runtime.

Opening additional Tools or arranging multiple windows opens a Workspace session and transitions the user into Workspace Mode.

Direct Tool Mode and Workspace Mode use the same Tool definitions, Runtime Services and Context model.

# Base

The Base permanently accompanies the user.

It represents the user's home.

The Base provides access to:

- Rooms
- Workspaces
- Companion
- personal configuration

The visual appearance of the Base depends entirely on the active Theme.

---

# Themes

Themes define the visual interpretation of Cosmos.

A Theme may replace:

- background
- Base
- Rooms
- Nodes
- connectors
- animations
- effects
- companion appearance
- project appearance

Every component may also be individually overridden.

Themes never change functionality.

---

# Level of Detail

Cosmos continuously adjusts visual complexity.

Zooming out emphasizes Projects.

Zooming in gradually reveals:

- branches
- Objects
- Relationships
- details

The user should never lose orientation regardless of zoom level.

---

# Relationships

Relationships appear as constellation lines.

Version 1 supports only Project-owned `Related` Relationships between exactly two Object endpoints.

The map may distinguish presentation provenance between:

- intentionally created `Related` records
- discovered candidate `Related` connections

These are not additional Relationship types. A discovered candidate becomes a Relationship only after user acceptance through Relationship Service.

Discovery never modifies the user's structure automatically.

---

# Companion

The Companion accompanies the user everywhere.

Inside Cosmos, the Companion serves as navigator, guide and discussion partner.

The Companion helps discover Projects, Objects and relationships without interrupting the user's workflow.

---

# Search

Global search belongs to the Archive.

Cosmos simply provides entry points into that information.

Search results may reference:

- Projects
- Objects
- Knowledge
- Resources
- Workspaces

Opening a result always preserves Context.

---

# Extensibility

Cosmos is designed to grow.

Future extensions may introduce:

- additional Themes
- new visualization styles
- alternative Node skins
- new navigation methods
- collaborative experiences
- future spatial concepts

Extensions should integrate into Cosmos without changing its fundamental principles.

---

# Design Goal

Cosmos should feel like a living universe that evolves together with its user.

Instead of navigating through applications, users navigate through their own knowledge, projects and creations.

The environment should encourage exploration, understanding and long-term thinking.

---

# Principles

- Cosmos is the root environment.
- Projects exist as constellations.
- Nodes visualize Objects.
- Orientation is always preserved.
- Themes only change appearance.
- Context begins inside Cosmos.
- Focused work may happen through one Tool beside the map or through a multi-window Workspace.
- Cosmos grows together with its user.
