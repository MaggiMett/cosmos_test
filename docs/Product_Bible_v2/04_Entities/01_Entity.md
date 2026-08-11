# Entity

## Purpose

An Entity is a living Runtime presence inside Cosmos.

Every Entity is an Object with the `Entity` System Tag. Companion, Pet and other Entity roles are composed through additional System Tags and Property Schemas rather than separate identity classes.

Entities provide interaction, personality and visual presence throughout the system.

They transform Cosmos from a collection of software tools into an interactive world.

Entities exist independently from AI Providers.

---

# Architectural Position

Entity is a registered Runtime component category and a role in the universal Object Model.

Entity definitions are discovered through the shared Registry System.

Runtime Services own business behavior for durable Entity identity and configuration.

Entity Runtime owns active lifecycle, Scope, position and State.

Persistence is accessed only through Runtime Services.

---

# Philosophy

An Entity is not a chat window.

An Entity is not an AI.

An Entity is a Runtime being that exists inside Cosmos.

Entities may observe, react, move and interact with the user and with other Entities.

Artificial Intelligence extends an Entity.

It does not define one.

---

# Responsibilities

Entities are responsible for:

- existing inside the Runtime
- presenting visual presence
- reacting to Runtime Events
- interacting with users
- interacting with other Entities
- executing permitted Runtime actions
- maintaining their own Runtime State

Entities never own business logic.

They interact with the Runtime through Runtime Services.

---

# Entity Identity

Every Entity possesses:

- immutable Object ID, also used as the Entity ID
- display name
- Entity Role
- Runtime Scope
- Avatar
- Behaviour Profile
- Runtime State

The display name may be customized.

The immutable Object ID never changes. Avatar, Theme, Behaviour, Properties and Runtime State never replace Entity identity.

---

# Entity Scope

Entities may exist in different Runtime scopes.

## Global

Available everywhere inside Cosmos.

Example:

Companion

---

## Room

Exists only inside one Room.

Example:

Reception Guide

---

## Workspace

Exists only while a specific Workspace is active.

Example:

Workspace Assistant

---

## Project

Exists only inside one Project.

Example:

Forge Master

---

The Runtime automatically activates and deactivates Entities based on their Scope.

---

# Runtime Presence

Entities always exist as Runtime objects.

They possess:

- position
- orientation
- visibility
- animation state
- interaction state

The visual representation may change.

The Runtime Entity remains the same.

---

# Avatar

Every Entity uses one Avatar.

The Avatar defines:

- appearance
- animations
- visual effects
- interaction points

Avatar appearance belongs to Themes.

Changing Themes never changes the Entity itself.

---

# Runtime State

Every Entity maintains Runtime State.

Examples include:

- Idle
- Walking
- Working
- Observing
- Talking
- Sleeping

State changes occur through the Entity Runtime.

---

# Interaction Associations

Entities may establish interaction associations with:

- Users
- Projects
- Rooms
- Workspaces
- other Entities

Interaction associations define social and contextual familiarity.

They do not define ownership.

They are not automatically Version 1 Relationship records. Because Entities are Objects, a user may explicitly accept a `Related` Relationship involving an Entity Object. Interaction history and familiarity never create that record silently.

---

# Knowledge

Entities never own Knowledge.

Instead they reference existing Knowledge through Runtime Services.

This ensures a single source of truth throughout Cosmos.

---

# Runtime Services

Entities interact exclusively through Runtime Services.

Typical Services include:

- Workspace Service
- Knowledge Service
- Object Service
- Job Service

Entities never access Persistence directly.

---

# Runtime Events

Entities react to Runtime Events.

Examples include:

- WorkspaceOpened
- ProjectFocused
- ReviewCreated
- JobCompleted
- ThemeChanged
- UserReturned

Behaviour is event-driven.

Entities do not constantly poll the Runtime.

---

# Commands

Entities may request Runtime actions.

Examples include:

- open Tool
- display Review
- navigate Workspace
- highlight Object

All Commands pass through Runtime Services.

Permission checks always occur before execution.

---

# Personality

An Entity may possess a Personality Profile.

Personality defines:

- communication style
- preferred behavior
- idle reactions
- emotional expression

Personality is independent from AI Providers.

---

# Artificial Intelligence

Entities may optionally use one or more AI Providers.

AI extends capabilities such as:

- conversation
- reasoning
- explanation
- planning

Without an AI Provider, the Entity remains fully functional as a Runtime presence.

---

# Themes

Themes may customize:

- Avatar
- animations
- visual effects
- sounds
- interaction effects

Themes never modify Entity behavior.

---

# Lifecycle

Every Entity follows the same lifecycle.

```text
Registered

↓

Loaded

↓

Initialized

↓

Active

↓

Idle

↓

Suspended

↓

Unloaded
```

The Runtime manages transitions automatically.

---

# Extensibility

Future Entity types may include:

- Companion
- Pet
- Guide
- Worker
- Vendor
- NPC

All Entity types share the same Runtime architecture.

---

# Design Goal

Entities should make Cosmos feel inhabited.

Users should experience Cosmos as a living environment where helpful beings naturally participate in their workflow rather than appearing as isolated software features.

---

# Principles

- Entities are Runtime beings.
- Entities are not AI.
- AI extends Entities.
- Entities never own Knowledge.
- Runtime Services mediate all actions.
- Themes define appearance.
- Behaviour reacts to Events.
- Every Entity follows the same Runtime contract.
