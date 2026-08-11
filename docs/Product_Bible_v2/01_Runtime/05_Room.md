# Room

## Purpose

A Room represents a physical area inside the Base.

A Room is an Object with the `Room` System Tag. Doors and Workspace Objects are separate Objects; Themes only represent their appearance.

Rooms organize the user's home into meaningful spaces while providing places for one or more Workspaces.

Rooms exist for organization, immersion and future expansion.

They never contain business logic.

---

# Responsibilities

Rooms are responsible for:

- organizing the Base
- providing Workspace Slots
- defining atmosphere
- grouping related Workspaces
- supporting future expansion

Rooms never perform work.

All work happens inside Workspaces.

---

# Workspace Slots

Every Room contains one or more Workspace Slots.

A Slot may host any Workspace.

Examples include:

- Knowledge Workspace
- Development Workspace
- Art Workspace
- Personal Workspace

Workspace Slots do not define functionality.

They simply provide a location.

---

# Workspace Assignment

Users may freely assign Workspaces to Rooms.

The same Workspace may be moved to another Room without changing its functionality.

Changing a Room never changes the Workspace itself.

---

# Themes

Rooms are completely controlled by the active Theme.

Examples:

Galaxy Theme

- Spaceship Library
- Engineering Bay
- Science Lab

Fantasy Theme

- Castle Library
- Blacksmith
- Alchemy Room

Modern Theme

- Office
- Studio
- Workshop

Only the appearance changes.

The Runtime remains identical.

---

# Atmosphere

Every Room should communicate its purpose.

Lighting, decoration, sound and layout help create a recognizable environment.

Atmosphere supports immersion but never replaces usability.

---

# Expansion

Rooms are expected to grow over time.

Future Rooms may include:

- Observatory
- Garden
- Hangar
- Music Studio
- Electronics Lab
- Trophy Room

Users may add, remove and customize Rooms.

---

# Interaction

Rooms primarily serve as navigation spaces.

Users move naturally between Rooms to reach different Workspaces.

Rooms should feel connected rather than isolated.

---

# Context

Rooms contribute Context.

Examples include:

- default Workspace selection
- inherited Context Tags
- Theme overrides
- atmosphere

In Workspace Mode, Room Context extends the inherited Runtime Context that is present.

It never replaces it.

A Room does not require Project Context. Assigned Project scopes remain optional and may contain zero, one or multiple Projects.

---

# Design Goal

Rooms transform the Base from a simple interface into a believable home.

They provide identity, orientation and future expandability without introducing unnecessary complexity.

---

# Principles

- Rooms organize the Base.
- Rooms host Workspaces.
- Rooms never perform work.
- Themes define appearance.
- Users control organization.
- Rooms remain lightweight and extensible.
