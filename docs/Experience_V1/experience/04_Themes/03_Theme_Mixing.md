# Theme Mixing

**Version:** 1.0
**Status:** Foundation
**Category:** Experience

---

# Purpose

This document defines how Theme Components may be combined throughout the Cosmos.

Rather than forcing users to use complete Themes, Cosmos allows every visual Component to be mixed, overridden and customized independently.

This enables every Cosmos to become unique while remaining fully compatible with the universal Theme architecture.

---

# Design Philosophy

Themes provide recommendations.

Users create the final appearance.

Every visual decision is independent and may be customized without affecting the remaining Components.

Theme Mixing should encourage creativity rather than restriction.

---

# Recommended Themes

Every Theme contains a recommended set of Components.

When activating a Theme, Cosmos presents the complete Theme configuration.

Example:

☑ Cosmos Background

☑ Base Background

☑ Room Backgrounds

☑ Node Skins

☑ Connection Skins

☑ Window Skins

☑ Workspace Objects

☑ Companion

☑ Pet

☑ Animations

☐ Audio

Unchecked Components remain unchanged.

They are not disabled.

---

# Component Overrides

Every Theme Component may be overridden independently.

Examples include:

- replacing a single Node Skin
- changing only the Companion
- using another Background
- selecting different Window Skins
- replacing Workspace Objects

Only the selected Component changes.

Everything else continues using inherited Components.

---

# Override Levels

Visual overrides may be applied at different levels.

Version 1 supports:

- This Object
- Connected Objects
- Structural Branch
- Entire Project
- Global

Every override affects only the selected scope.

---

# Connected Objects

Connected Objects follow structural relationships.

Semantic Connections are intentionally excluded from Version 1.

Future versions may optionally include semantic relationships for advanced editing workflows.

---

# Disabled Components

Some Theme Components are optional.

Examples include:

- Pets
- decorative Entities
- decorative Objects
- optional Audio
- optional Particles

These Components may be explicitly disabled.

Core Components such as Nodes, Windows and required environments cannot be disabled.

---

# Preview

Preview is a universal Cosmos mechanic.

Users may preview visual changes before applying them.

Previews never permanently modify the current Cosmos.

Typical workflow:

Select Component

↓

Preview

↓

Choose Scope

↓

Preview affected Objects

↓

Apply or Cancel

The same Preview mechanism should later be reused by all Creator Tools.

---

# Creator Workflow

Theme creation follows a progressive workflow.

Creators typically begin with:

Skin

Later they may extend it with:

Condition

Animation

Audio

Preview should always display the current result directly inside the Cosmos without requiring the user to save, switch views or interrupt the creative process.

---

# Component Selection

Components are selected through the universal Theme Browser.

Discovery is based on System Tags.

Examples:

Skin + Node

↓

All compatible Node Skins

Animation + Companion

↓

All Companion Animations

Background + Room

↓

All compatible Room Backgrounds

User Tags provide additional filtering and organization.

---

# Inheritance

Components inherit from higher levels until explicitly overridden.

Inheritance keeps Theme configurations compact and predictable.

Overrides never duplicate the complete Theme.

They replace only the selected Components.

---

# Future

Future versions may introduce:

- live collaborative Theme editing
- procedural Theme combinations
- AI-assisted Theme suggestions
- advanced semantic editing
- reusable Theme presets

These additions should continue using the same Theme Mixing principles.

---

# Experience Goals

Theme Mixing should always feel:

- flexible
- predictable
- non-destructive
- creative
- reversible

Users should always understand which Components are changing and which remain inherited.

---

# Design Principles

Themes recommend.

Users compose.

Components inherit.

Overrides remain local.

Preview before Apply.

Every visual decision should build upon the existing Theme architecture rather than introducing new customization systems.

---

# Scope

This document defines how Theme Components are combined, inherited and overridden throughout the Cosmos.

Technical implementation details are documented separately.
