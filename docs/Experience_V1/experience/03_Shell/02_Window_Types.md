# Window Types

**Version:** 1.0
**Status:** Foundation
**Category:** Experience

---

# Purpose

This document defines the universal Window system used throughout Cosmos.

Everything that appears above the Cosmos is represented as a Window.

Different experiences are created through different Window types rather than different interface systems.

This creates one consistent interaction model for the entire application.

---

# Design Philosophy

The Cosmos contains worlds.

The Shell contains Windows.

The Cosmos itself never uses traditional interface elements.

Instead, every interactive layer above the Cosmos is represented as a Window.

Users should learn one universal interaction model that remains consistent throughout the entire experience.

---

# Universal Window

Every Window is an Object built upon the same universal foundation.

A Window may support:

- movement
- resizing
- transparency
- pinning
- animations
- theme customization
- persistence

Individual Window types simply enable or disable these capabilities.

---

# Environment Windows

Environment Windows represent complete environments.

Examples include:

- Base
- Rooms
- Workspaces

In Version 1, Environment Windows use fixed placement and sizing.

They replace or cover the current environment while preserving the user's overall position inside the Cosmos.

Base and Room Environment Windows are borderless and fixed. The Workspace Environment Window is also fixed: it cannot be freely dragged or resized.

The universal Window foundation must still allow future Workspace Environment Window sizing flexibility without changing the Environment identity.

---

# Tool Windows

Tool Windows represent productive tools.

Examples include:

- Knowledge
- Capture
- Blueprint
- Archive
- Chat
- future tools

Tool Windows may be:

- moved
- resized
- overlapped
- closed

Their complete layout is remembered by the current Workspace.

Version 1 does not support minimizing, maximizing, restoring, docking or snapping Tool Windows.

---

# Surface Windows

Surface Windows provide lightweight interaction.

Examples include:

- Context Menus
- Tooltips
- Pickers
- Dropdowns

Surface Windows always belong to another Window.

They never become independent working environments.

---

# Version 1 Capability Matrix

| Window role | Placement and sizing | Movable | Resizable | Close behavior |
| --- | --- | --- | --- | --- |
| Base Environment Window | Fixed | No | No | Leave the environment |
| Room Environment Window | Fixed | No | No | Leave the environment |
| Workspace Environment Window | Fixed | No | No | Close the active environment |
| Tool Window | User-arranged inside its Workspace | Yes | Yes | Close the Tool Window |

Minimize, maximize / restore, docking and snapping are unavailable for every Window role in Version 1.

---

# Window Hierarchy

The Shell manages a simple Window hierarchy.

Environment Windows

↓

Tool Windows

↓

Surface Windows

Each layer exists only to support the layer below it.

The hierarchy should always remain predictable.

---

# Origins

Every Window has an origin.

Examples include:

Base Button

↓

Base Window

Workspace Object

↓

Workspace Environment Window

Node

↓

Tool Window

Companion

↓

Chat Window

Windows should appear to originate from the object that created them.

This helps users understand how the interface is connected.

---

# Persistence

Windows remember their previous state whenever appropriate.

This may include:

- position
- size
- open state
- focus order

Tool Windows persist those values. Environment Windows instead remember the environment they represent and retain their fixed Version 1 placement and sizing.

---

# Multi-Display

The Window system is designed to expand naturally across multiple displays.

Future movable Windows may:

- remain on a single display
- span multiple displays
- move freely between displays

The user decides how their environment is arranged.

The Shell remembers those decisions.

Display-specific Workspace layouts may be stored separately.

When displays change, Cosmos automatically restores the most appropriate layout without losing previous configurations.

---

# Theme Support

Themes may completely redefine the visual appearance of every Window.

They may replace:

- borders
- materials
- shadows
- decorations
- animations

They must never change:

- Window behavior
- interaction model
- hierarchy
- persistence

The interaction experience always remains consistent.

---

# Future

Future versions may enable additional capabilities on existing Window Objects, including:

- more flexible Workspace Environment Window sizing
- multiple parallel Environment Windows
- minimize and maximize / restore
- docking
- snap layouts
- detachable windows
- floating utility windows
- virtual desktops
- new System Tag and Property combinations built upon the same Window Object foundation

All future additions should extend the universal Window system rather than introducing new interaction models.

---

# Experience Goals

The Window system should always feel:

- consistent
- flexible
- predictable
- unobtrusive
- expandable

Users should think about their work, not about window management.

---

# Scope

This document defines the universal Window system used by the Shell.

Individual Workspace layouts and tool behavior are documented separately.
