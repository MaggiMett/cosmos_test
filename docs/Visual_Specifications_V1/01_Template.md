# Visual Specification Template

**Version:** 1.0  
**Status:** Authoritative  
**Category:** Visual Guidelines

---

# Purpose

Every Visual Specification follows the same structure.

This ensures consistency across the entire Cosmos documentation.

Readers should immediately know where specific visual information is located.

---

# Philosophy

Visual Specifications describe visible implementation.

Every specification should focus on what the user can perceive.

Internal runtime behavior belongs to the Product Bible.

Interaction philosophy belongs to Experience.

---

# Standard Structure

Visual Specifications should use the following sections whenever applicable.

---

## Purpose

Why the Object exists.

---

## Overview

A short description of the Object.

---

## Object Template

Describe the universal structure.

Examples include:

- layout
- proportions
- alignment
- regions
- hitboxes
- hierarchy

The Object Template is independent from Themes.

---

## Cosmos Theme

Describe the Version 1 appearance.

Examples include:

- colors
- materials
- lighting
- borders
- shadows
- glow
- icons
- typography

Only visual appearance belongs here.

---

## Visual States

Describe visible state changes.

Examples include:

- default
- hover
- active
- selected
- disabled
- loading
- error

Only visible differences should be described.

---

## Animations

Describe visible movement.

Examples include:

- transitions
- fades
- scaling
- movement
- highlighting

Implementation details are intentionally omitted.

---

## Future

Describe future visual improvements.

Version 1 should always remain clearly separated.

---

# Rules

Visual Specifications should:

- describe visible behavior
- avoid runtime implementation
- avoid architecture
- remain implementation independent
- remain theme extensible

---

# Theme Principle

Every Object consists of:

Object Template

+

Theme

The Object Template defines structure.

The Theme defines appearance.

Future Themes should reuse existing Object Templates whenever possible.

---

# Future

The template should remain stable across future Cosmos versions.

Additional sections may be introduced if they improve clarity while preserving compatibility.
