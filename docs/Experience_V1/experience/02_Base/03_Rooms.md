# Rooms

**Version:** 1.0
**Status:** Foundation
**Category:** Experience

---

# Purpose

This document describes Rooms inside the Base.

Rooms expand the user's personal environment by providing additional space for Workspaces.

Rooms are places.

They are not categories, tools or interfaces.

---

# Overview

Rooms are extensions of the Base.

Each Room represents its own environment while remaining part of the same home.

Users move between Rooms naturally instead of navigating through application pages.

Version 1 provides one additional Room:

- Workshop

Future versions may introduce additional Rooms without changing the overall Base structure.

---

# Role

Rooms provide space.

Workspaces provide functionality.

A Room itself performs no work.

Instead, it contains Workspace Objects which users configure for their own workflows.

---

# Object Model

Rooms, Doors and Workspace Objects use the universal Object Model. Their System Tags determine capabilities, their Properties store configuration, and Themes provide visual representation.

---

# Workspace Objects

Version 1 provides four Workspace Objects inside the Workshop.

The default layout places:

- two Workspace Objects on the left
- two Workspace Objects on the right

Every Workspace Object can be configured independently.

Initially these Workspace Objects are empty.

Users assign tools and functionality through the object's Context Menu.

---

# Workspace Configuration

Each Workspace Object represents one Workspace.

Users may configure:

- workspace name
- available tools
- project assignment
- tags
- appearance

The object itself remains part of the room.

Its functionality is defined entirely through its configuration.

---

# Themes

Rooms define atmosphere.

Workspace Objects define functionality.

The same Workspace Object may appear differently depending on the active Theme.

Examples include:

Cosmos Theme

- workbench

Fantasy Theme

- anvil

Minimal Theme

- desk

Nature Theme

- tree stump

Only the appearance changes.

Interaction and functionality remain identical.

---

# Navigation

Users enter Rooms through doors inside the Base.

Version 1 performs a simple environment transition.

The current room background changes while the user remains inside the Base.

Future versions may expand Room navigation with corridors, quick travel or custom layouts.

---

# Visual Direction

Rooms should feel:

- organized
- spacious
- calm
- personal

Workspace Objects should immediately appear interactive without overwhelming the room.

Hovering a Workspace Object displays:

- subtle outline
- soft glow

---

# Extensibility

Rooms follow one universal structure.

Themes may completely replace:

- architecture
- materials
- decorations
- lighting
- atmosphere
- Workspace Object appearance

Themes must never replace:

- workspace interaction
- room navigation
- workspace configuration
- overall room behavior

This allows every Theme to reinterpret the same room without changing how users work.

---

# Future

Future versions may introduce:

- Room Builder
- movable Workspace Objects
- custom room layouts
- additional Workspace Objects
- decorative furniture
- ambient room behavior

These additions should extend the existing room concept rather than replacing it.

---

# Experience Goals

Rooms should always feel:

- expandable
- organized
- comfortable
- familiar
- creative

Users should feel like they are entering another part of their personal environment rather than opening another tool.

---

# Scope

This document describes the universal Room experience.

Workspace behavior is documented separately.
