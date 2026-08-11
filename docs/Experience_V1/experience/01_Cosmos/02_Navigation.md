# Cosmos Navigation

**Version:** 1.0
**Status:** Foundation
**Category:** Experience

---

# Purpose

This document describes how users move through the Cosmos.

Navigation is designed to feel natural and spatial rather than menu-driven.

Users should always feel like they are travelling through a living environment instead of switching between isolated applications.

---

# Navigation Philosophy

The Cosmos is navigated through movement.

Users do not switch between pages.

They move through a continuous universe.

The current context is determined by the current camera position.

The camera never changes the structure of the Cosmos.

It only changes the user's point of view.

---

# Camera

The camera is the primary navigation tool.

Users are free to explore the Cosmos without restrictions.

Navigation should always feel smooth, predictable and comfortable.

The camera supports:

- free movement
- smooth zooming
- automatic positioning
- quick travel

---

# Movement

Users move through the Cosmos by dragging the view.

Movement follows the Blender navigation philosophy.

Default controls:

- Hold **Space** and drag to move the camera.
- Mouse Wheel zooms towards the cursor position.

Dragging without holding **Space** has no effect.

---

# Zoom

Zooming always focuses on the current mouse position.

Zooming should feel smooth and continuous.

The Cosmos defines minimum and maximum zoom levels.

These limits should feel soft rather than abrupt.

---

# Camera Position

The camera position defines the current working context.

When the camera is positioned above empty space, the user is working globally.

When the camera is positioned above a project galaxy, Cosmos automatically treats that project as the active context.

No manual project switching exists.

---

# Project Navigation

Projects exist as galaxies inside the Cosmos.

Moving the camera over a project automatically activates its context.

Selecting the Main Node automatically moves the camera until the complete project fits comfortably inside the viewport.

This is a navigation shortcut.

It does not change the underlying navigation model.

---

# Quick Travel

Quick Travel is an alternative way of moving the camera.

Instead of manually navigating through the Cosmos, users may directly select a destination.

The camera then travels automatically to that location.

After arriving, the experience is identical to manual navigation.

Quick Travel never creates a separate navigation state.

---

# Node Positioning

Nodes may be repositioned freely.

Users can move Nodes by clicking and dragging them.

The Main Node acts as the visual center of a project.

Related Nodes naturally surround it while maintaining comfortable spacing.

Nodes should never overlap.

---

# Experience Goals

Navigation should always feel:

- natural
- calm
- spatial
- predictable
- responsive
- effortless

Users should never feel like they are changing applications.

Instead, they simply travel to another place within their own Cosmos.

---

# Future

Future versions may extend navigation with additional features such as:

- cinematic camera movement
- controller support
- gesture navigation
- minimap
- bookmarks
- advanced multi-selection
- additional navigation shortcuts

These additions must build upon the same navigation philosophy without replacing it.
