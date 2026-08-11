# Object Window

**Version:** 1.0  
**Status:** Authoritative  
**Category:** Tool Window Presentation

---

# Purpose

Object Windows present one selected Cosmos Object as a focused working surface.

They allow users to inspect and, where existing capabilities permit, edit the Object without losing its spatial origin or creating another identity.

---

# Overview

An Object Window is a Tool Window presentation of an existing Object.

It is not a new Window role, Object class, persistence authority or standalone application. The Window has its own temporary Runtime Object identity while every displayed representation resolves to the selected Object's immutable ID.

Object Windows are movable, resizable and closable inside their Workspace. Version 1 provides no minimize, maximize, restore, docking or snapping.

Archive continues to read and edit Knowledge inline in its own Object View and does not open separate Object Windows for that editing flow.

---

# Window Layout

Every Object Window consists of:

- universal Tool Window Header
- Object Identity Region
- Object Content Region
- Related Information Region
- optional Inline Action Region

---

## Tool Window Header

The Header contains:

- selected Object display name
- compact role icon or primary System Tag representation
- Close

Movement uses the ordinary Tool Window Header. Resize handles use the universal Tool Window pattern.

---

## Object Identity Region

The identity region provides immediate orientation through:

- display name
- short description
- composed Object roles
- primary Project when present

System Tags and Project context are visually secondary to the display name. The immutable ID may appear in a low-emphasis details area when useful but never becomes the primary label.

---

## Object Content Region

The main region presents Properties through sections derived from the Object's active schemas.

Human-readable labels and appropriate controls represent values. Raw storage records are not the default presentation.

Where the active capabilities permit editing, editable identity metadata, Properties or User Tags use direct inline controls in this same region. Saving sends the existing Runtime Service Command; the Window never mutates data itself.

Read-only or unsupported Properties remain clearly legible without appearing broken.

---

## Related Information Region

A visually secondary region may contain existing:

- User Tags
- accepted Related Relationships
- Knowledge references
- Resource references

Only supplied relationships and references appear. The Window never infers or persists new meaning from layout.

---

## Inline Action Region

Existing Object actions resolved from System Tags and capabilities may appear in a compact action row.

Object-specific actions remain available through the universal Context Menu as well. The Window does not create a second action vocabulary.

---

# Visual Identity

Object Windows are recognized by:

- one clearly identified Object
- schema-grouped content
- inline editing where permitted
- visible related information
- the universal movable, resizable and closable Tool Window frame

---

# Cosmos Theme

## Appearance

Object Windows use the same glass material, subtle border, rounded geometry, shadow and active focus emphasis as other Tool Windows.

The interior favors calm vertical sections with restrained separators rather than nested cards for every Property.

---

## Tags and Roles

Roles and User Tags use compact pill-like labels. System roles use neutral styling. User Tags may use the current Project accent while remaining secondary.

---

## Editing

Editable controls visually match the existing Archive and Files input language. Editing does not transform the Window into a different mode or open a separate edit Window.

Unsaved, validation and save-pending states appear beside the affected section and preserve entered values on failure.

---

# Visual States

Object Windows support:

- opening
- loading
- default
- active
- inactive
- inline editing
- unsaved changes
- validation feedback
- save pending
- save failed
- closing

The selected Object remains identifiable in every state. Errors do not replace the complete Window when unaffected content can remain visible.

---

# Minimum Size

The minimum size preserves:

- complete Header controls
- readable identity information
- one usable content column
- accessible inline actions

At narrow sizes, related information moves below the main content rather than becoming unreadable.

---

# Animations

Version 1 uses the universal Tool Window opening, closing, movement, resizing and focus transitions.

Content changes use restrained fades. Saving and validation feedback appear without moving the user's reading position.

---

# Future

Future versions may add comparison or richer schema-specific presentations. They must preserve universal Object identity, Runtime Service ownership and the existing Tool Window role.
