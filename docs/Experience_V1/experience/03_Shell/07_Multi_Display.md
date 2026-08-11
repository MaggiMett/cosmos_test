# Multi Display

**Version:** 1.0
**Status:** Foundation
**Category:** Experience

---

# Purpose

This document defines the future Multi Display experience of Cosmos.

Although Version 1 operates on a single display, the Shell and Window System are designed from the beginning to support seamless expansion across multiple displays.

Multi Display extends the user's environment.

It never creates separate Cosmos instances.

---

# Design Philosophy

Cosmos always represents one continuous world.

Additional displays simply expand the visible working area.

Users should never feel like they are managing multiple applications or independent windows.

Instead, they continue working inside one larger Cosmos.

---

# Virtual Workspace

The Shell treats all connected displays as one continuous workspace.

Future Tool Windows may:

- remain on a single display
- move freely between displays
- span multiple displays
- occupy any position within the virtual workspace

Displays are boundaries of hardware.

Not boundaries of the Cosmos.

---

# Display Layouts

Cosmos automatically maintains separate layouts for different display configurations.

Examples include:

- Single Display
- Dual Display
- Triple Display

Each configuration remembers its own arrangement independently.

Users never need to recreate layouts after reconnecting displays.

---

# Automatic Restoration

When Cosmos starts, the Shell automatically detects the available displays.

If a matching layout exists, it is restored automatically.

If previously used displays are unavailable:

- a compatible layout is restored
- no Window becomes inaccessible
- previously saved layouts remain preserved

When the original display configuration returns, Cosmos may automatically restore the previous arrangement.

---

# Window Placement

Future Tool Windows may move freely throughout the virtual workspace. Environment Window placement remains controlled by the Shell; Version 1 Environment Windows stay fixed on its single display.

Version 1 does not implement snapping, docking or alignment tools.

Future versions may introduce optional snapping, docking or alignment tools.

The default behavior should always feel natural and unrestricted.

---

# Supported Experiences

Future versions may support experiences such as:

- Cosmos on one display and the Base on another
- Main Room on one display and another Room on a second display
- a Workspace spanning multiple displays
- Tool Windows distributed across several displays
- custom display arrangements defined by the user

All experiences operate within the same Cosmos.

---

# Persistence

Display layouts are persistent.

Cosmos remembers:

- Tool Window positions
- Tool Window sizes
- display assignment
- spanning behavior

Each display configuration maintains its own saved layout.

Switching between configurations should never overwrite another layout.

---

# Theme Support

Themes may visually adapt to larger environments.

They may change:

- background composition
- environmental decoration
- lighting
- atmosphere

They must never change:

- display behavior
- Window placement rules
- persistence
- interaction principles

---

# Future

Future versions may introduce:

- display-specific Workspace templates
- custom display profiles
- monitor-aware Companion behavior
- immersive panoramic environments
- virtual desktop support

These additions should build upon the existing Multi Display foundation without changing its philosophy.

---

# Experience Goals

Multi Display should always feel:

- continuous
- natural
- spacious
- flexible
- uninterrupted

Users should experience additional displays as a larger workspace rather than multiple separate screens.

---

# Design Principles

Displays expand the Cosmos.

Displays never divide the Cosmos.

One Cosmos.

One Runtime.

One continuous working environment.

---

# Scope

This document defines the future Multi Display experience.

Technical implementation details are documented separately.
