# Focus

**Version:** 1.0
**Status:** Foundation
**Category:** Experience

---

# Purpose

This document defines the Focus system of Cosmos.

Focus identifies the optional focused or primary Project within the current additive Runtime Context.

Rather than replacing assigned Project scopes, Focus provides emphasis and defaults within the Tag context shared across every system.

The user should rarely think about Focus.

It simply follows where the user is working.

---

# Design Philosophy

Focus is context.

It is not selection.

It is not navigation.

It is not window focus.

Focus contributes which Project is primary in the user's working environment. Assigned Project scopes, Room, Workspace, Tool, Object and Knowledge context remain additive and independent.

Every system inside Cosmos responds to the same active context.

---

# Focus States

Version 1 defines two Focus states.

## Global Focus

Global Focus is active whenever the user is freely navigating the Cosmos.

No Project is focused. A global Workspace may still have no Project scopes; another Runtime path may retain assigned scopes without a focused Project.

Workspaces, Capture and other tools operate globally.

---

## Project Focus

Project Focus becomes active whenever the user's position belongs to a Project.

This may happen through:

- navigating to a Project
- Quick Travel
- opening a project-specific Workspace

The active Project becomes the optional focused Project within the current working context. Other assigned Project scopes remain active.

---

# Focus Generation

Focus is determined automatically.

The user never manually switches Focus.

Cosmos derives Focus from the user's current position.

Position may determine Focus.

Focus contributes focused-Project Tags and defaults.

Active Tags determine context.

---

# Tag Context

Focus contributes to the relevant Tag context for the current environment.

Version 1 primarily contributes:

- Project User Tags

System Tags continue to describe structure but are not directly controlled by Focus.

Future versions may activate additional User Tags for more specific contexts.

---

# Context Inheritance

Every system receives the same active Tag context.

Examples include:

- Workspaces
- Knowledge
- Capture
- Companion
- Connections
- future Extensions

No individual system needs to determine assigned Project scopes or the focused Project independently.

They all inherit the same Focus.

---

# Automatic Tag Inheritance

Objects created inside an active context automatically receive the required structural System Tags. Relevant User Tags may be suggested or applied when the user explicitly chooses a tagged Template or creation action.

For example:

Project

↓

Items

↓

Weapons

↓

New Object

Receives structural context and may be offered these User Tags:

- Mettventures
- Items
- Weapons

This provides meaningful organization without silently changing user-owned Tags.

Future intelligent systems may suggest additional Tags but should not replace the inherited structure.

---

# Navigation

Changing Focus never feels like changing modes.

The user simply moves through the Cosmos.

As the user's position changes, Focus updates naturally.

This keeps the experience continuous and predictable.

---

# Future

Future versions may expand Focus by activating more specific Tag combinations.

Examples include:

- Project
- Project + Lore
- Project + Characters
- Project + Frontend

The underlying Focus mechanism remains unchanged.

Only the active Tag context becomes more detailed.

---

# Experience Goals

Focus should always feel:

- automatic
- invisible
- predictable
- contextual
- universal

Users should never manage Focus manually.

They simply work.

Cosmos understands the current context.

---

# Design Principles

Focus follows position or the active Workspace's explicit focused Project.

Focus contributes Tags and defaults without replacing assigned Project scopes.

Tags define context.

Every system inherits the same context.

Future functionality should build upon the existing Focus system rather than introducing alternative context mechanisms.

---

# Scope

This document defines the universal Focus system.

The Tag System, Navigation and Workspace behavior are documented separately.
