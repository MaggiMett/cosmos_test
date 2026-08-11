# Entity Roles

## Purpose

Entity Roles define the purpose, capabilities and expected behavior of an Entity.

Every Entity possesses exactly one primary Role.

The Role determines what an Entity is intended to do.

It does not determine how the Entity looks or which AI Provider it may use.

---

# Architectural Position

Entity Roles are part of registered Entity definitions used by Entity Runtime.

They are not Tools, Runtime Services or independent Runtime systems.

They are not registered as an independent component category.

Role definitions use the shared Registry System through their Entity definition and remain part of the Entity configuration contract.

---

# Philosophy

The Entity Runtime provides life.

Entity Roles provide purpose.

An Entity may change its Avatar, Theme or AI Provider without changing its Role.

Likewise, different Roles may share the same Avatar while behaving completely differently.

Roles describe responsibility rather than appearance.

---

# Responsibilities

Entity Roles define:

- intended purpose
- available capabilities
- default permissions
- expected interactions
- supported Runtime actions
- default Behaviour Profile

Roles never implement business logic.

Business logic remains inside Runtime Services.

---

# Role Identity

Every Role possesses:

- immutable ID
- display name
- description
- default permissions
- supported interactions
- default Behaviour Profile
- compatible Runtime capabilities

Roles are reusable.

Multiple Entities may share the same Role.

---

# Primary Roles

The initial Runtime defines four standard Roles.

---

## Support Entity

Support Entities actively assist the user.

Examples include:

- Companion
- future assistants

Typical capabilities:

- observe Runtime Context
- open User Tools
- highlight Objects
- present Reviews
- answer questions
- request Runtime actions
- interact with other Entities

Support Entities never perform destructive actions without explicit user confirmation.

---

## Ambient Entity

Ambient Entities exist primarily to make Cosmos feel alive.

Examples include:

- Pets
- decorative creatures
- ambient robots

Typical capabilities:

- movement
- idle behavior
- emotional reactions
- interaction with nearby Entities
- interaction with the user

Ambient Entities never manipulate Runtime data.

---

## Guide Entity

Guide Entities introduce and explain parts of Cosmos.

Examples include:

- Room Guide
- Tutorial Guide
- Project Guide

Typical capabilities:

- explain concepts
- guide navigation
- highlight interface elements
- recommend next steps

Guide Entities educate.

They do not perform work.

---

## Worker Entity

Worker Entities perform specialized Runtime assistance.

Examples include:

- Forge Master
- Repository Assistant
- Librarian

Typical capabilities:

- coordinate Runtime Jobs
- prepare work
- present progress
- manage specialized workflows

Worker Entities remain restricted by Runtime Permissions.

---

# Role Capabilities

Each Role exposes a Capability Set.

Examples include:

Support Entity

- conversation
- tool usage
- Runtime guidance

Ambient Entity

- movement
- interaction
- idle behavior

Guide Entity

- education
- navigation
- explanation

Worker Entity

- specialized Runtime support
- workflow coordination

Capabilities describe what the Role may request.

Permissions determine what the Runtime actually allows.

---

# Role Permissions

Every Role provides a default Permission Profile.

Permissions remain configurable.

Examples:

Support Entity

- read Knowledge
- open User Tools
- request Reviews

Ambient Entity

- movement
- Entity interaction

Guide Entity

- navigation
- explanation

Worker Entity

- workflow support
- Job coordination

Permission checks always occur inside Runtime Services.

---

# Role Behaviour

Roles define default behavior expectations.

Examples:

Support Entity

- proactive
- observant
- responsive

Ambient Entity

- playful
- calm
- decorative

Guide Entity

- patient
- educational
- structured

Worker Entity

- efficient
- focused
- task-oriented

Behaviour may later be customized through Personality Profiles.

---

# Role Interaction

Roles influence how Entities interact.

Examples:

Support Entity

↓

may pet

↓

Ambient Entity

---

Guide Entity

↓

may explain

↓

Support Entity

---

Worker Entity

↓

may notify

↓

Support Entity

Interactions remain governed by the Entity Runtime.

---

# Role Independence

Roles never depend on:

- Avatar
- Theme
- AI Provider
- Personality

These systems remain independent.

Changing one never changes the others.

---

# Custom Roles

Extensions may introduce additional Roles.

Examples include:

- Merchant
- Scientist
- Quest Giver
- Musician
- Archivist
- Builder

Every custom Role follows the same Runtime contract.

---

# Design Goal

Entity Roles should make every Entity immediately understandable.

Users should recognize an Entity's purpose through its behavior rather than through implementation details.

---

# Principles

- Every Entity has one primary Role.
- Roles define purpose.
- Capabilities describe intent.
- Permissions control execution.
- Roles remain independent from appearance.
- AI Providers never define Roles.
- Runtime Services perform all work.
- New Roles are extensible.
