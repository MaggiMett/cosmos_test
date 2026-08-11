# Nodes

**Version:** 1.0
**Status:** Foundation
**Category:** Experience

---

# Purpose

This document describes how Nodes are experienced throughout the Cosmos.

Nodes are Objects that provide the universal visual language of the Cosmos Map.

The graphical Node seen by the user is the themed representation inside the Object's interactive hitbox.

Regardless of their System Tags, all Nodes follow one consistent interaction model.

This document defines their map representation and interaction. The universal Object structure is defined in `07_Object_Model.md`.

---

# Universal Representation

Nodes never represent files or technical structures.

Instead, they represent meaningful concepts inside the user's Cosmos.

Every Project Root, Domain, Cluster, Object and Detail that appears on the Cosmos Map is a Node Object.

Its structural level is expressed through combined System Tags rather than a separate Node class hierarchy.

Examples include:

```text
Node + ProjectRoot
Node + Domain
Node + Cluster
Node + Object
Node + Detail
```

This creates one consistent interaction model throughout the entire system.

---

# Hierarchy

Nodes communicate hierarchy through size and placement.

Every hierarchy level becomes progressively smaller.

The hierarchy is visualized from the active System Tag combination:

## Project Node

The largest Node.

Represents an entire project.

Acts as the visual center of a project galaxy.

---

## Domain Node

Represents a major area within a project.

Examples include:

- Lore
- Gameplay
- Frontend
- Backend

Domains organize large areas of work.

---

## Cluster Node

Represents a thematic group inside a Domain.

Examples include:

- Characters
- Items
- Locations
- Authentication
- Navigation

Clusters provide structure and improve navigation.

---

## Object Node

Represents a concrete piece of work.

Examples include:

- King Borin
- Dwarven Pickaxe
- Login Screen
- Health API

An Object Node represents one concrete concept or piece of work.

It remains a complete Node Object and may reference additional Knowledge, Files or implementation resources.

Most user interaction happens on this level.

---

## Detail Node

The smallest structural Node level.

Represents additional information belonging to a parent Object Node.

Examples include:

- Portrait
- Equipment
- Dialogue
- Documentation
- Examples

Detail Nodes are still independent Objects with their own identity. Their structural meaning is that they enrich or describe a parent Object rather than representing a separate top-level concept.

---

# Interaction

All Nodes share the same interaction model.

Users should never need to learn different behaviors for different Node System Tag combinations.

Nodes support:

- Hover
- Selection
- Context Menu
- Drag & Drop
- Opening their contents

Consistency is more important than visual differences.

---

# Positioning

Nodes may be freely repositioned by the user.

Dragging a Node changes only its visual position.

The underlying relationships remain unchanged.

Connections automatically adapt to the new position.

Nodes should never overlap.

Automatic placement should provide a clean starting layout while remaining fully editable.

---

# Visual Hierarchy

Hierarchy should be understandable before labels are read.

Users should immediately recognize:

- importance
- grouping
- structure

through size, spacing and placement alone.

The visual language should remain calm and uncluttered.

---

# Theme Support

Nodes define interaction.

Themes define appearance.

A Theme may replace:

- shape
- materials
- colors
- animations
- icons
- visual effects

without changing how Nodes behave.

The Cosmos Theme included in Version 1 is the first reference implementation of this system.

---

# Experience Goals

Nodes should always feel:

- consistent
- intuitive
- lightweight
- readable
- expandable

Users should quickly understand that every Node follows the same interaction rules regardless of what it represents.

---

# Scope

This document describes the universal Node experience.

Connections, Navigation, Context Menus and Theme implementations are documented separately.
