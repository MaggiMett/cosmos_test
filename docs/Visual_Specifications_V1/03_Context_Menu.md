# Context Menu

**Version:** 1.0  
**Status:** Authoritative  
**Category:** Surface Window

---

# Purpose

Context Menus place existing object-specific actions next to the Object that owns them.

They should make functionality immediately discoverable without adding permanent toolbars or unrelated navigation.

---

# Overview

A Context Menu is a compact Surface Window owned by the Window containing the selected Object.

It appears beside the interaction origin, adjusts to remain fully visible, and closes when its action is chosen or attention moves elsewhere.

The menu resolves actions from the Object's existing System Tags and capabilities. Its visual representation never adds behavior.

---

# Object Template

Every Context Menu consists of:

- optional Object Identity Header
- Action Groups
- Action Rows
- optional Nested Surface

---

## Object Identity Header

When the selected Object is not already unmistakable, the menu begins with a compact header containing:

- Object display name
- optional small role or icon

The header is informational and does not duplicate a menu action.

---

## Action Groups

Related actions are separated into shallow groups using spacing or a subtle divider.

The most common action appears first. Destructive actions, when supplied by the active capabilities, appear in the final group.

Version 1 avoids deep or decorative group hierarchies.

---

## Action Row

Every row contains:

- optional icon
- action label
- optional keyboard hint
- optional submenu indicator

Rows use a consistent minimum hit area. Disabled actions remain visible only when the existing interaction contract requires an explanation; their label uses reduced emphasis.

---

## Nested Surface

One level of nested menu is supported where an existing action group requires it, such as Appearance scope.

The nested Surface opens beside the parent row and reverses direction near viewport edges. Version 1 avoids deeper nesting.

---

# Placement

The menu's first edge aligns near the selected Object or pointer origin without covering the Object's center when space allows.

Placement automatically flips horizontally or vertically to keep the complete menu inside its owning Window and visible viewport.

Menus inside a Workspace remain inside the Workspace Environment Window.

---

# Visual Identity

Context Menus are recognized by:

- compact vertical action rows
- clear attachment to one selected Object
- shallow grouping
- restrained surface depth
- immediate hover and keyboard focus feedback

---

# Cosmos Theme

## Appearance

The menu uses dark translucent glass, a subtle border, compact rounded corners and a soft short shadow. It is denser than a Tool Window and lighter than a Dialog.

---

## Actions

Default actions use neutral text and icons. Hover, keyboard focus and the active nested row use the Cosmos accent as a low-opacity background and narrow border emphasis.

Destructive actions use the existing restrained danger accent and never depend on color alone.

---

# Visual States

Context Menus support:

- opening
- default
- row hover
- row keyboard focus
- disabled row
- nested menu open
- action pending
- closing

The selected source Object remains visibly selected while its menu is open.

---

# Animations

Version 1 uses a short opacity and small position transition from the origin. Nested surfaces use the same restrained transition.

Animations never delay action availability.

---

# Accessibility

- keyboard focus follows visible row order
- labels remain readable without icons
- submenu direction is communicated visually and semantically
- the menu remains fully inside the visible owner bounds
- reduced-motion settings use immediate appearance with opacity only

---

# Future

Future versions may add extension-supplied actions or multi-selection actions. They must retain the same object-centered menu and action-resolution contract.
