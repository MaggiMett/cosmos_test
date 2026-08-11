# Shell

**Version:** 1.0
**Status:** Foundation
**Category:** Experience

---

# Purpose

This document describes the Shell experience of Cosmos.

The Shell is the invisible layer that connects every part of the Cosmos.

It manages interaction, presentation and transitions while allowing the user to focus entirely on their work.

The Shell should almost disappear.

Users should experience the Cosmos itself rather than the interface operating it.

---

# What is the Shell?

The Shell is neither the Cosmos nor the Base.

It is the universal interaction layer that connects both.

It manages how the user moves between environments, opens workspaces, interacts with windows and receives feedback.

The Shell is responsible for making the entire experience feel like one continuous world.

---

# Responsibilities

The Shell is responsible for:

- Window creation and hierarchy
- window management
- focus handling
- notifications
- interaction routing
- display management
- transitions
- global shortcuts

The Shell never contains user content.

It only presents it.

---

# Design Philosophy

The Shell should remain almost invisible.

Users should never feel like they are managing software.

Instead, they should feel like they are naturally interacting with their own environment.

The Shell exists to reduce friction rather than introduce functionality.

---

# Consistency

Every interaction follows the same principles regardless of the active Theme.

Themes may completely change the visual appearance.

They must never change:

- interaction behavior
- navigation logic
- focus handling
- window management
- input philosophy

This ensures that every Theme remains immediately familiar.

---

# Layers

The Shell manages the visual hierarchy of the entire experience.

The general layer order is:

- Tool Windows
- Workspace
- Base
- Cosmos
- Background

Only the currently relevant layer should demand the user's attention.

---

# Interaction Focus

The Shell always knows which Window or interactive Object currently receives input.

Only one primary interaction target receives keyboard input at a time.

This interaction focus is separate from the Tag-based Cosmos Focus defined in `05_Focus.md`.

Changing interaction focus should feel immediate and predictable.

---

# Global Interaction

The Shell defines universal interaction rules.

Examples include:

- Left Click for interaction
- Right Click for object actions
- Space for camera movement
- Escape for closing or leaving the current layer

These rules remain identical throughout the entire Cosmos.

---

# Extensibility

The Shell is designed as a universal foundation.

Future systems may extend:

- animations
- transitions
- multi-display support
- accessibility
- input devices
- plugins
- custom interaction layers

without replacing the underlying interaction philosophy.

---

# Experience Goals

The Shell should always feel:

- invisible
- predictable
- lightweight
- responsive
- calm

Users should think about their work, not about the interface.

---

# Scope

This document defines the universal Shell philosophy.

Individual systems such as Windows, Companion Notifications, Focus and Multi-Display are documented separately.
