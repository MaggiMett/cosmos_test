# Workspaces

**Version:** 1.0
**Status:** Foundation
**Category:** Experience

---

# Purpose

This document describes Workspaces inside the Base.

Workspaces are persistent working environments.

They allow users to organize tools, windows and layouts around the way they prefer to work.

---

# Overview

A Workspace represents one complete working context.

It combines:

- window layout
- open tools
- zero, one or multiple assigned Project scopes
- optional focused or primary Project
- user tags
- workspace settings

Instead of opening individual tools every time, users return to a Workspace exactly as they left it.

---

# Object Model

A Workspace is an Object. Its configuration, assigned Project scopes, optional focused Project, Tags and persistent Window layout belong to that Object. Tools and Tool Windows opened inside it remain separate Objects.

---

# Working Environment

A Workspace is not a tool.

It is the user's workplace.

When opened, the Workspace provides one large working surface.

Individual movable, resizable and closable Tool Windows exist inside this fixed Workspace Environment Window.

The Workspace itself acts as the foundation for productive work.

---

# Window System

Opening a Workspace creates one primary working window.

This working surface occupies the available workspace area.

Individual Tools open as movable and resizable Tool Windows on top of this fixed working surface. They may be closed, but Version 1 does not minimize, maximize, dock or snap them.

Examples include:

- Knowledge
- Capture
- Archive
- Blueprint
- future tools

Users may freely arrange these windows according to their own workflow.

---

# Persistence

Every Workspace remembers its previous state.

This includes:

- window positions
- window sizes
- open tools
- assigned Project scopes
- optional focused or primary Project
- tags

Returning to a Workspace restores the previous working environment.

Switching between Workspaces should feel like switching between different desks inside the same Base.

---

# Project Context

A Workspace may operate globally or with zero, one or multiple assigned Project scopes.

An optional focused or primary Project provides emphasis and defaults without replacing the other assigned scopes. Project assignment automatically contributes the appropriate additive context while working.

Global Workspaces remain independent of any project.

---

# Workspace Configuration

Each Workspace may define:

- name
- available tools
- assigned Project scopes
- optional focused or primary Project
- user tags
- optional Theme Override

Users configure these settings through the Workspace's Context Menu.

---

# Workspace Objects

Inside a Room, every Workspace Object represents one Workspace.

The appearance of the object depends entirely on the active Theme.

Examples include:

- workbench
- desk
- anvil
- bookshelf

The object is only a visual representation.

Its functionality remains identical across all Themes.

---

# Opening a Workspace

Selecting a Workspace Object opens the Workspace.

The Workspace expands into a full-size working environment.

The underlying Room is temporarily covered while the user is working.

Closing the Workspace returns the user to the same Room.

---

# Standard Layout

When a new Workspace is created, Cosmos provides a sensible default layout.

Users may completely customize this layout afterwards.

The customized layout becomes the new persistent state of the Workspace.

---

# Theme Support

Themes define only the appearance of Workspace Objects and windows.

They must never change:

- workspace behavior
- persistence
- tool interaction
- window management

The Cosmos Theme included in Version 1 serves as the reference implementation.

---

# Future

Future versions may introduce:

- Workspace templates
- shared Workspace presets
- multiple monitor layouts
- advanced window grouping
- custom Workspace objects
- Workspace Builder

These additions extend the Workspace concept without changing its purpose.

---

# Experience Goals

Workspaces should always feel:

- productive
- familiar
- flexible
- organized
- persistent

Users should feel like they are returning to their own desk rather than reopening software.

---

# Scope

This document describes the Workspace experience.

The window system and individual tools are documented separately.
