# Workspace Builder

## Purpose

Workspace Builder allows users to create, customize and organize persistent personal Workspace definitions.

A Workspace definition describes how the user prefers to work.

It combines Tools, Layouts, Overlays and Context into one reusable working environment.

Workspace Builder creates workplaces.

It does not create Knowledge.

---

# Philosophy

Every person works differently.

Some users prefer one large Tool.

Others prefer many windows.

Cosmos should adapt to the user rather than forcing one workflow.

Every Workspace should become a personalized desk.

---

# Responsibilities

Workspace Builder is responsible for:

- creating Workspace definitions
- editing Workspace definitions
- organizing Tools
- configuring Panels
- configuring Layouts
- assigning Overlays
- defining Workspace Context
- creating and updating Workspace Blueprints through Workspace Service

Workspace Builder never performs work belonging to the contained Tools.

---

# Runtime Dependencies

Workspace Builder uses:

- Workspace Service
- Tool Service
- Theme Service
- Runtime Context
- Event Model

Workspace Builder never modifies Persistence directly.

Workspace Blueprint creation and updates follow one path:

```text
Workspace Builder
    ↓
Command
    ↓
Workspace Service
    ↓
Authoritative Permission and Category-Schema Validation
    ↓
Persistence
    ↓
Workspace Blueprint Registry Update
    ↓
Completed-Fact Event
```

Workspace Builder keeps drafts and presents validation feedback. It never persists or registers Workspace Blueprint definitions directly.

---

# Workspace Definition

A Workspace definition represents one reusable working environment. Workspace Runtime opens a temporary active Workspace session from it.

A Workspace definition may be:

- global
- assigned to one Project
- assigned to multiple Projects

Every Workspace definition is independent.

---

# Workspace Components

A Workspace definition may contain:

- Overlay
- Panels
- Tool assignments and default placement
- Layout
- Theme overrides
- Context filters
- Project associations

These components define how an active Workspace session behaves when opened.

---

# Tool Management

Users may freely add or remove User Tools.

Examples include:

- Capture
- Archive
- Review
- Blueprint Builder

Removing a Tool removes it only from the Workspace.

The Tool remains installed.

---

# Panels

Panel configuration defines containers for Tool Instances in an active Workspace session.

Users may:

- add and remove Tools
- set default Tool Window positions
- set default Tool Window sizes
- configure fixed Panel visibility

Panels define presentation only.

Version 1 does not support Tool Window docking, snapping, minimizing or maximizing. Workspace Environment Window placement and sizing are fixed. Future versions may extend Workspace Builder with those capabilities.

---

# Overlay

Every Workspace definition assigns exactly one Overlay.

The Overlay defines:

- desk
- furniture
- interaction areas
- decorative elements

Changing an Overlay never changes functionality.

---

# Project Workspaces

Users may assign zero, one or multiple Project scopes to a Workspace definition.

Example:

Workspace

↓

Mettventures

↓

Automatically inherits:

- Project Context
- Project Tags
- Project Objects

Project-scoped Workspaces reduce manual configuration. An optional focused or primary Project may provide defaults without removing other assigned scopes.

---

# Global Workspaces

Global Workspaces remain available across every Project.

Examples include:

- Knowledge
- Planning
- Writing

Global Workspaces have no assigned Project scopes and receive Runtime Context dynamically.

---

# Workspace Blueprints

Every Workspace definition may be saved as a Workspace Blueprint.

Workspace Blueprints preserve:

- Tool arrangement
- Overlay
- Panels
- Layout
- Context configuration

New Workspace definitions may be created from existing Workspace Blueprints.

Every Workspace Blueprint has an immutable ID, explicit version and declared scope. Its scope preserves the source Workspace definition's zero, one or multiple assigned Project scopes and optional focused or primary Project. Updates create a new version; existing Workspace definitions retain their referenced version until explicitly changed.

---

# Context

Workspace Builder configures Context behavior.

Examples include:

- assigned Project scopes
- optional default focused or primary Project
- preferred Tags
- active Object System Tag combinations
- default filters

Context remains inherited from the Runtime.

Workspace Builder only extends it.

---

# Themes

Users may override Theme components per Workspace.

Examples include:

- Overlay
- Background
- Node Skin
- Companion Skin

Workspace customization never affects the global Theme unless explicitly requested.

---

# Runtime State

Workspace Builder never stores Runtime State.

It defines persistent Workspace configuration through Workspace Service.

Active Workspace session state belongs to Workspace Runtime.

---

# Companion

Companion may assist while building Workspaces.

Examples include:

- recommending Tool combinations
- suggesting Layout improvements
- explaining Tool interactions

The user remains responsible for Workspace design.

---

# Failure Handling

If Workspace or Workspace Blueprint creation fails:

- the current Workspace Blueprint draft remains available
- existing Workspaces remain unchanged
- validation errors are explained
- retry remains possible

---

# Extensibility

Future Extensions may introduce:

- custom Panels
- custom Overlays
- custom Layout systems
- collaborative Workspaces
- VR Workspaces
- animated furniture

Workspace Builder should remain independent from specific Workspace content.

---

# Design Goal

Workspace Builder should allow every user to build a personal operating environment.

Instead of adapting to software, users continuously shape Cosmos into the workspace that best matches the way they think and create.

---

# Principles

- Workspace definitions define environments.
- Tools perform work.
- Default Layout belongs to the Workspace definition; active Layout state belongs to the session.
- Active Workspace session State belongs to Workspace Runtime.
- Users build their own workplaces.
- Project Workspaces inherit Context.
- Workspace Blueprints preserve Workspace configuration.
- Every Workspace definition remains fully customizable.
