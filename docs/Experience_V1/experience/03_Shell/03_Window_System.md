# Window System

**Version:** 1.0
**Status:** Foundation
**Category:** Experience

---

# Purpose

This document defines how Windows behave throughout Cosmos.

All Windows share the same interaction model regardless of their appearance or purpose.

The Window System should feel simple, predictable and consistent while remaining flexible enough to support future extensions.

---

# Design Philosophy

Windows are temporary working surfaces.

They exist to support productive work without distracting from it.

Users should never think about managing windows.

They should simply arrange their workspace in the way that feels most natural.

---


# Object Model

Every Window is a Cosmos Object.

System Tags identify its role, while Properties define behavior such as movement, resizing, visibility, placement and persistence.

Themes provide the Window Skin but never redefine those capabilities.

---

# Opening Windows

Windows always originate from an interactive object.

Examples include:

- Workspace Object → Workspace Environment Window
- Companion → Chat Window
- Node → Tool Window

Opening a Window should always feel connected to its source.

---

# Version 1 Capability Boundary

Version 1 distinguishes fixed environments from working tools.

- Base and Room Environment Windows are borderless, fixed and not resizable.
- The Workspace Environment Window has fixed placement and sizing and cannot be freely dragged or resized.
- Tool Windows are movable, resizable and closable.
- Minimize, maximize / restore, docking and snapping are not supported.

---

# Closing Windows

Version 1 supports opening and closing Tool Windows and entering or leaving Environment Windows.

Closing a Tool Window removes it from the current Workspace session.

The Workspace remembers the previous state.

Reopening the Workspace restores previously opened Windows and their layout.

---

# Window Focus

Only one Window is active at a time.

Selecting a Window brings it to the foreground.

The active Window receives:

- keyboard input
- interaction focus
- visual emphasis

Focus changes should always feel immediate and predictable.

---

# Movement

Movable Tool Windows may be repositioned freely inside the current Workspace Environment Window.

Dragging a Window changes only its position.

Windows remain completely independent from one another.

---

# Resizing

Resizable Tool Windows support resizing from all edges and corners.

Each Window defines its own minimum size.

Users should never be able to resize a Window until it becomes unusable.

---

# Workspace Boundaries

Tool Windows always belong to their current Workspace.

They cannot be moved outside of the Workspace.

The Workspace acts as their working environment.

---

# Visibility

Windows should always remain recoverable.

They should never become permanently lost outside the visible working area.

The Shell should ensure that every Window remains accessible.

---

# Persistence

Window state is persistent.

Cosmos remembers:

- position
- size
- open state
- focus order

Returning to a Workspace restores the previous working environment.

---

# Future Extensibility

The Window System is intentionally designed to grow.

Future versions may introduce:

- minimize
- maximize
- docking
- snapping
- tab groups
- floating utility windows
- window shelves
- advanced multi-display behavior

These features should extend the existing Window System without changing its interaction philosophy.

---

# Theme Support

Themes may completely redefine the appearance of Windows.

They may replace:

- borders
- shadows
- materials
- decorations
- animations

They must never change:

- window behavior
- movement
- resizing
- persistence
- focus handling

---

# Experience Goals

The Window System should always feel:

- lightweight
- predictable
- flexible
- unobtrusive
- expandable

Users should focus on their work rather than window management.

---

# Scope

This document defines how Windows behave.

Window types, layouts and Workspace behavior are documented separately.
