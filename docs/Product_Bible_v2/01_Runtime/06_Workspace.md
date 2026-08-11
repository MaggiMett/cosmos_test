# Workspace

## Purpose

A Workspace definition is a persistent, configurable working environment inside Cosmos.

A persistent Workspace definition is an Object with the `Workspace` System Tag. Its active Workspace Environment Window, Tool Windows and Tool Instances remain Objects with their own identities and lifetimes.

Workspace Runtime opens temporary active Workspace sessions from those definitions. Workspace sessions provide the multi-window places where users perform work using Tools.

Unlike Projects, Workspaces do not define meaning.

Unlike Tools, Workspaces do not perform actions.

A Workspace definition combines Context configuration, Layout, assigned Tools and User Experience into one reusable environment.

An active Workspace session realizes that definition with current Context, Tool Instances and Runtime State.

In Version 1, the Workspace Environment Window is a fixed working environment with fixed placement and sizing. It is not freely dragged or resized. Tool Windows inside it are movable, resizable and closable.

---

# Philosophy

A Workspace represents a place to work.

Users should feel like they are sitting down at a workplace rather than opening another application.

Cosmos provides the framework.

Users decide how they want to work.

---

# Responsibilities

A Workspace definition is responsible for:

- defining Layout and Panels
- defining assigned Tools
- defining Context additions
- providing an Overlay
- preserving reusable configuration

An active Workspace session is responsible for:

- containing Tool Instances
- applying Layout and Panels
- maintaining Window State
- receiving Runtime Context
- preserving restorable session state

A Workspace never owns Knowledge or Objects.

---

# Workspace Identity

Every Workspace definition possesses:

- unique ID
- display name
- description
- icon
- overlay
- layout
- context
- assigned Tools
- Theme overrides

Display names may be changed at any time.

Internal IDs never change.

Workspace session identity references the immutable Workspace definition ID. Session state is temporary Runtime State and is not part of the definition identity.

---

# Workspace Context

Every active Workspace session automatically inherits Runtime Context.

Context flows through the Runtime.

```text
Project

↓

Room

↓

Workspace

↓

Tool

↓

Object
```

A Workspace extends inherited Context.

It never replaces it.

Typical additions include:

- zero, one or multiple assigned Project scopes
- an optional focused or primary Project
- User Tags
- preferred Objects
- active filters

Every Tool Instance in the active session automatically receives the current Workspace Context. A focused or primary Project provides defaults and emphasis without removing other assigned scopes.

---

# Workspace Layout

A Workspace definition stores its default Layout. Its active Workspace session maintains the current Layout state.

Examples include:

- Tool Window positions
- Tool Window sizes
- Tool Window open state
- Tool Window focus order
- fixed Tool Area configuration

Default Layout configuration belongs to the Workspace definition. Current Layout state belongs to the active session.

Changing a Layout never changes the underlying Project.

---

# Panels

Panels are containers inside the Workspace.

Examples include:

- floating windows
- side panels
- bottom panels
- inspector panels

Panels exist only to organize Tool instances.

Panels contain no business logic.

Version 1 Panels are definition-owned fixed regions. Tool Windows do not dock or snap into Panels. Dynamic docking, snapping and split-layout management are future capabilities.

---

# Tool Instances

Active Workspace sessions contain Tool Instances.

Tool Runtime owns each Tool Instance lifecycle. The Workspace session owns its containment and presentation placement.

Multiple instances of the same Tool may exist simultaneously.

Example:

Archive

Archive

Capture

Capture

Blueprint Builder

Each Tool Instance maintains its own state.

---

# Overlay

Every Workspace definition assigns an Overlay, which its active session loads.

The Overlay represents the physical workplace.

Examples include:

- desk
- workbench
- laboratory
- cockpit
- drafting table
- command console

The Overlay defines visual interaction only.

It never changes functionality.

---

# Workspace Builder

Users may create their own Workspaces.

Users choose:

- name
- icon
- overlay
- default layout
- Tools
- Theme overrides

Workspaces may be duplicated, exported and shared.

---

# Workspace Blueprints

A Workspace Blueprint defines a reusable starting configuration for a Workspace.

Cosmos provides predefined Workspace Blueprints.

Examples include:

- Knowledge
- Development
- Art

Workspace Blueprints exist only as starting points.

Users remain free to customize or completely replace them.

---

# Runtime State

Every active Workspace session maintains restorable state for:

- open Tool instances
- Tool Window positions and sizes
- Tool Window focus order
- selected Objects
- current filters
- camera state
- Theme overrides

Reopening the persistent Workspace definition creates a new active session and restores its previous session state automatically.

---

# Theme Representation

Themes determine appearance.

A Theme may replace:

- furniture
- materials
- lighting
- decorations
- animations
- sounds

The Workspace remains functionally identical.

Every visual element may also receive its own Skin.

---

# Physical Interaction

Whenever possible, users interact with physical objects.

Examples:

Notebook

↓

Capture

Workbench

↓

Development Tools

Archive Terminal

↓

Archive

Workbench Screen

↓

Blueprint Builder

Physical interaction strengthens immersion without reducing usability.

---

# Extensibility

Every Workspace definition and session follows the same extensible Workspace contract.

Future extensions may introduce:

- new Overlays
- additional Panels
- new interaction methods
- specialized Workspace Builders
- collaborative workspaces
- more flexibly sized Workspace Environment Windows
- Tool Window minimize, maximize, docking and snapping

Extensions should integrate into the existing Workspace model.

---

# Design Goal

A Workspace should never feel like software.

It should feel like entering a real place designed for a specific type of work.

Users should immediately understand where they are, what they can do and how their tools relate to one another.

---

# Principles

- Workspace definitions organize work.
- Tools perform actions.
- Projects provide meaning.
- Objects provide focus.
- Default Layout belongs to the Workspace definition; active Layout state belongs to the session.
- Context is inherited automatically.
- Multiple Tool Instances are allowed in Workspace Mode.
- Overlays define appearance.
- Themes define atmosphere.
- Users own their Workspace definitions.
- Everything is extensible.
