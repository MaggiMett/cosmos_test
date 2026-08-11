# Cosmos Transitions

**Version:** 1.0
**Status:** Foundation
**Category:** Experience

---

# Purpose

This document defines how movement and environment changes are experienced inside the Cosmos.

Transitions preserve continuity. They never introduce a separate navigation mode or change the underlying behavior.

---

# Universal Principle

Transitions belong to the Shell.

Cosmos, Base, Rooms, Workspaces, Themes and future Extensions request transitions through the same universal mechanism.

Features may provide an origin, destination and optional themed presentation. They do not create independent transition systems.

---

# Version 1

Version 1 uses only a small set of calm default transitions:

- smooth camera movement for Project focus and Quick Travel
- soft appearance and disappearance of Windows
- simple environment replacement between Base and Room
- subtle dimming during Theme changes

Transitions should remain short enough to preserve fast work.

---

# Theme Support

Themes may replace visual assets, easing presentation, particles or optional audio.

They must never change:

- navigation outcome
- interaction rules
- focus behavior
- Runtime state

---

# Runtime Safety

Only one conflicting transition should control the same target at a time.

Queued transitions complete in a predictable order so the visible world never enters an incomplete state.

---

# Design Principles

Transitions provide continuity.

Transitions never define behavior.

One Shell mechanism serves the entire Cosmos.

---

# Scope

This document defines the Cosmos movement and environment transition experience. Theme-specific transition presentation is documented under Themes.
