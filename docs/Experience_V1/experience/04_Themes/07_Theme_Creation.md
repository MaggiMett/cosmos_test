# Theme Creation

**Version:** 1.0
**Status:** Foundation
**Category:** Experience

---

# Purpose

This document defines how Themes and Theme Components are created inside Cosmos.

Theme creation should feel like extending an existing world rather than building a graphics engine.

The same creation principles should later be reusable for every other Creator Workspace inside Cosmos.

---

# Design Philosophy

Cosmos should never ask creators to begin with an empty workspace.

Instead, Cosmos prepares the complete foundation automatically.

Creators focus entirely on creativity.

The system prepares everything else.

---

# Graphics Workspace

Theme creation takes place inside the Graphics Workspace.

The Graphics Workspace is the standard Workspace of the Graphics Project.

It combines every Tool required for visual creation into one configurable environment.

Examples include:

- Theme Tool
- Drawing Tool
- Animation Tool
- Audio Tool
- Preview
- Graphic Template Browser
- Asset Browser

Future Creator Workspaces should follow the same philosophy.

---

# Progressive Creation

Theme creation follows a progressive workflow.

Recommended order:

Skin

↓

Condition

↓

Animation

↓

Audio

A creator can stop after any step.

Every completed stage already produces a valid Theme Component.

---

# Graphic Template Browser

The Graphic Template Browser provides prepared templates instead of empty canvases.

Examples include:

- Node Template
- Room Template
- Base Template
- Door Template
- Window Template
- Workspace Object Template
- Connection Template

Templates reduce the skill gap by allowing creators to immediately begin designing instead of constructing the underlying structure.

Templates are reusable Cosmos Objects.

---

# Automatic Preparation

Whenever a new Project or Workspace Project is created, Cosmos automatically prepares the corresponding Theme structure.

This includes locations for future Theme Components, Templates and Assets.

Initially these locations may remain empty.

The creator decides whether and when they should be used.

Cosmos prepares the foundation.

The creator builds upon it.

---

# Preview

Preview is a core part of the creation workflow.

Every modification should be visible directly inside the Cosmos before being saved.

Creators should never be required to repeatedly:

Save

↓

Switch Workspace

↓

Inspect

↓

Return

↓

Continue editing

The Cosmos itself becomes the live preview.

---

# Theme Components

New Theme Components are created from Templates.

Cosmos automatically prepares:

- System Tags
- Properties
- default values
- Preview integration

The creator focuses only on the visual result.

---

# Universal Object Structure

Every created Theme Component follows the universal Cosmos Object model.

System Tags

↓

Properties

↓

User Tags

The creation workflow therefore remains identical to every other Cosmos Object.

---

# Project Integration

Graphics Projects, Theme Projects and future System Projects with creative Tools all use the same underlying architecture.

Each Project automatically receives its own Theme structure.

As the Project grows, Cosmos continues preparing additional extension points.

The creator remains in complete control over every visual decision.

---

# Future Creator Philosophy

Theme Creation serves as the reference implementation for future Creator Workspaces.

Examples include:

- Game Workspace
- Item Creator
- Mob Creator
- Companion Creator
- Room Builder
- Audio Workspace
- Animation Workspace

Future systems should reuse the same Tools, Templates, Preview and Object architecture whenever possible.

---

# Experience Goals

Theme creation should always feel:

- approachable
- creative
- progressive
- non-destructive
- consistent

The user should spend time creating rather than configuring.

---

# Design Principles

Cosmos prepares.

Creators create.

Templates reduce complexity.

Preview supports creativity.

Everything created becomes a Cosmos Object.

Future Creator Workspaces should extend this philosophy rather than replacing it.

---

# Scope

This document defines the creation philosophy used by the Cosmos Theme system.

The same principles should later be adopted by every Creator Workspace inside Cosmos.
