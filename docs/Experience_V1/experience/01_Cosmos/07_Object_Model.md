# Object Model

**Version:** 1.0
**Status:** Foundation
**Category:** Experience

---

# Purpose

This document defines the universal Object Model used throughout Cosmos.

Every independently addressable visible or interactive element inside Cosmos is represented by an Object.

Objects are the fundamental building blocks of the Cosmos.

Themes define how Objects appear.

The Object Model defines what they are.

---

# Design Philosophy

Cosmos is not built from pages, windows or applications.

Cosmos is built from Objects.

Every Object follows the same universal principles regardless of its purpose.

This consistency allows the entire environment to grow without introducing different architectural models.

---

# Universal Principle

Every independently addressable graphical or interactive element inside Cosmos is represented by an Object. Reusable definitions such as Themes, Skins and Templates are Objects as well, even when they are not currently visible.

Examples include:

- Projects
- Nodes
- Connections
- Workspaces
- Windows
- Panels
- Tools
- Themes
- Skins
- Templates
- Companion
- Pet
- Doors
- future Entities

The appearance of an Object may change completely.

Its identity does not.

---

# Theme Separation

Objects exist independently of their visual appearance.

Without a Theme, Objects would still exist as interactive entities.

Themes provide visual representation.

They never define the existence of an Object.

Example:

Node Object

↓

Cosmos Theme

↓

Star

↓

Fantasy Theme

↓

Crystal

↓

Minimal Theme

↓

Circle

The Object remains identical.

Only its representation changes.

---

# Universal Object Structure

Every Object follows the same fundamental structure.

Identity

↓

System Tags

↓

Property Schema

↓

Properties

↓

User Tags

This structure provides a universal language understood by Cosmos, AI systems and future extensions.

---

# Identity

Every Object possesses a permanent identity.

Its identity does not change when:

- its Name changes
- its Theme changes
- its Properties change
- its User Tags change
- its appearance changes

The Object remains the same Object throughout its lifetime.

---

# System Tags

System Tags define what an Object fundamentally is.

Examples include:

- Project
- Node
- Connection
- Workspace
- Tool
- Window
- Skin
- Theme
- Template

System Tags may be combined.

Example:

Project

System

Workspace

System Tags compose identity and activate behavior, capabilities and Property Schemas. They are not restricted to one exclusive type.

---

# Property Schemas

System Tag combinations determine which Property Schemas are composed for an Object.

Different Objects therefore possess different Property sets without requiring exclusive classes.

Example:

System Tags

Skin

Node

↓

Property Schema

Skin

Condition

Animation

Audio

Another Object may use an entirely different schema.

Property Schemas define which Properties must always exist.

---

# Properties

Properties describe the concrete state of an Object.

Examples include:

Skin = Cheeseball

Condition = Moldy

Animation = Rolling

Audio = Silent

Properties always follow the active Property Schema.

Every required Property should contain a valid value.

Objects should never exist with incomplete Property definitions.

---

# User Tags

User Tags describe meaning, organization and relationships created by the user.

User Tags are optional and user-owned. Cosmos may suggest them, but it never silently adds, removes or rewrites them.

An Object's visible Name belongs to Identity metadata and remains searchable without being duplicated as a mandatory User Tag. When the user has not provided a name, Cosmos may assign a generated visible name such as `Node_Unnamed_01`; this still does not create a User Tag automatically.

Users may add User Tags freely.

User Tags drive:

- search
- filtering
- grouping
- relationships
- discovery
- template collections

Collections emerge naturally through shared Tags.

---

# Relationships

Objects may exist independently.

Connections create relationships between Objects.

Removing Connections does not remove the participating Objects.

Relationships extend Objects.

They do not define their existence.

---

# Representation

The same Object may appear in multiple places.

Examples include:

- Cosmos Map
- Search
- Archive
- Graphics Workspace
- Theme Browser
- Companion
- future Views

Every representation refers to the same underlying Object.

Different experiences never duplicate Object identity.

---

# Runtime Objects

Some Objects exist only while Cosmos is running.

Examples include:

- Windows
- Notifications
- temporary Panels

They still use the universal Object Model.

Runtime lifetime does not change Object behavior or identity.

---

# AI Integration

The universal Object Model provides one consistent language for AI systems.

Rather than learning different architectures for different Cosmos features, AI interacts with one universal Object model.

This greatly simplifies reasoning, automation and future expansion.

---

# Extensibility

Every future capability should extend the existing Object Model and reuse existing System Tags before adding new vocabulary.

New features should introduce new combinations of:

- System Tags
- Property Schemas
- Properties
- User Tags

The Object architecture itself should remain stable.

---

# Experience Goals

The Object Model should always feel:

- universal
- predictable
- consistent
- extensible
- future-proof

Users should never need to learn different architectural models for different parts of Cosmos.

---

# Design Principles

Everything visible is represented by an Object.

Objects exist independently of Themes.

System Tags define purpose.

Property Schemas define structure.

Properties define state.

User Tags create meaning.

The Object remains constant while its representation may change.

---

# Scope

This document defines the universal Object Model used throughout Cosmos.

Individual Object roles and System Tag combinations are documented in their respective chapters.
