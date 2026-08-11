# Context Menus

**Version:** 1.0
**Status:** Foundation
**Category:** Experience

---

# Purpose

This document describes how users access actions throughout the Cosmos.

Instead of relying on permanent toolbars or large menus, Cosmos places actions directly on the objects they belong to.

Every object owns its functionality.

---

# Design Philosophy

Context Menus are the primary entry point for object-specific actions.

Users should never need to search through unrelated interface elements to perform an action.

Instead, they simply interact with the object itself.

Functions live where their objects live.

---

# Interaction Model

The Cosmos follows a simple interaction model.

## Left Click

Left Click is used for interaction.

Depending on the object, this includes:

- selecting Nodes
- moving Nodes
- selecting windows
- dragging windows
- interacting with Workspace objects

Selecting a Project Main Node automatically centers the camera on the project.

---

## Right Click

Right Click always opens the Context Menu of the selected object.

The same interaction applies throughout the entire Cosmos.

Users should never have to remember different menu systems.

---

# Object Menus

Every object provides its own Context Menu.

Examples include:

## Empty Cosmos

- Create Galaxy
- Quick Travel
- Themes
- Settings

---

## Project Node

- Open
- Appearance
- Connections
- Configuration

---

## Domain / Cluster / Object / Detail Nodes

- Open
- Appearance
- Connections
- Configuration

The available actions may differ according to the Object's System Tags and active capabilities while preserving a consistent menu structure.

---

## Base

- Open
- Appearance
- Configuration

---

## Workspace Objects

- Open Workspace
- Rename
- Assign Project
- Tags
- Appearance

---

# Appearance

Appearance options belong to the object itself.

Examples include:

- Color
- Skin
- Theme
- Animation (future)

Changes may be applied to:

- this object
- connected objects
- the complete project

This allows users to style entire structures without manually editing every individual Node.

---

# Menu Placement

Context Menus appear next to the selected object.

Their position automatically adjusts to remain fully visible within the viewport.

Menus should always feel attached to the object they belong to.

---

# Menu Structure

Menus should remain compact.

Nested menus are supported when necessary.

Version 1 should avoid unnecessarily deep menu hierarchies.

Actions should remain easy to discover.

---

# Consistency

Every interactive object follows the same Context Menu philosophy.

Users should always know where functionality is located.

The interaction model never changes depending on the current Theme.

---

# Future

Future versions may extend Context Menus with features such as:

- multi-selection actions
- extension actions
- Companion actions
- custom menu entries
- plugin integration

These additions must preserve the same object-centered interaction philosophy.

---

# Experience Goals

Context Menus should always feel:

- predictable
- lightweight
- discoverable
- consistent
- object-oriented

Users should never search for actions.

They should simply interact with the object they wish to manage.

---

# Scope

This document describes the universal Context Menu experience.

The appearance of Context Menus is defined by Themes and the Design System.
