# Entity Interaction

## Purpose

The Entity Interaction System defines how Entities interact with users, other Entities and the Cosmos Runtime.

It provides a consistent interaction model that allows every Entity to communicate, react and cooperate while remaining independent and loosely coupled.

Interaction creates the social layer of Cosmos.

---

# Architectural Position

Entity Interaction is an internal contract coordinated by Entity Runtime.

It is not a System Tool, Runtime Service or independent Runtime system.

Runtime actions requested during an interaction continue through the existing Runtime Services.

---

# Philosophy

Entities never communicate directly.

Every interaction passes through the Entity Runtime.

Entity Runtime preflights and coordinates interactions. Runtime Services authoritatively validate any requested Runtime action.

This keeps Entities independent while allowing complex behavior to emerge.

---

# Responsibilities

Entity Interaction is responsible for:

- coordinating interactions
- performing non-authoritative permission preflight for feedback
- validating conditions
- synchronizing participants
- coordinating animations
- coordinating dialogue
- coordinating Runtime actions
- reporting completed interaction facts to the responsible Runtime Service for Event publication

Interaction never performs business logic.

---

# Interaction Model

Every interaction follows the same flow.

```text
Initiator

↓

Interaction Request

↓

Entity Runtime

↓

Preflight and Interaction Validation

↓

Execution

↓

Interaction Result

↓

Return to Behaviour
```

Entities never bypass the Runtime.

---

# Participants

Every interaction consists of:

- Initiator
- Target
- Interaction Type
- Runtime Context

Additional participants may join if supported.

---

# Interaction Types

Initial interaction types include:

## User Interaction

Between a User and an Entity.

Examples:

- click
- greet
- pet
- talk
- inspect
- follow

---

## Entity Interaction

Between two or more Entities.

Examples:

- greeting
- petting
- following
- pointing
- celebrating
- waiting together

---

## Runtime Interaction

Between an Entity and the Runtime.

Examples:

- open Tool
- display Review
- highlight Object
- navigate Workspace
- notify user

---

## Environment Interaction

Between an Entity and the environment.

Examples:

- sit on chair
- open door
- approach desk
- rest on bed
- inspect bookshelf

---

# Interaction Request

Every interaction begins with a request.

A request contains:

- initiator
- target
- interaction type
- requested action
- Runtime Context

Entity Runtime may preflight every request for feedback and validate non-business interaction conditions.

---

# Validation

Before an interaction proceeds, Entity Runtime may preflight:

- permissions
- visibility
- distance (if applicable)
- current State
- Scope compatibility
- interaction availability

Failed preflight requests may be rejected early for feedback. Any Command that reaches a Runtime Service is always subject to authoritative permission and business validation there.

---

# Interaction State

While interacting, participating Entities temporarily enter Interaction State.

Entity Behaviour owns each deterministic transition into and out of that State. Entity Interaction coordinates the participants but never performs the transition itself.

Examples:

Idle

↓

Interaction

↓

Return to Idle

Both Entities maintain independent Runtime identities throughout the interaction.

---

# Coordinated Actions

The Runtime synchronizes shared actions.

Example:

```text
Companion

↓

Pet Interaction Request

↓

Validation

↓

Walk to Pet

↓

Pet notices Companion

↓

Petting Animation

↓

Pet Happy Animation

↓

Return to Idle
```

Entity Behaviour executes each participant's Behaviour independently.

The Runtime keeps them synchronized.

---

# Conversations

Conversation is a specialized interaction.

Conversation may occur:

- User ↔ Entity
- Entity ↔ Entity

Conversation does not require an AI Provider.

Without AI, predefined dialogue may be used.

With AI, generated responses may extend the interaction.

Conversation always remains subject to Runtime Permissions.

---

# Runtime Actions

Certain interactions may request Runtime actions.

Examples:

- open Archive
- open Review
- highlight Object
- focus Workspace
- request Journeyman

The Entity never executes these actions directly.

Runtime Services remain responsible.

For every Runtime action, the Entity sends a Command through the existing Service pipeline. Entity Interaction never authorizes or persists the action and never publishes the resulting Event itself.

---

# Emotional Interaction

Entities may express emotional reactions.

Examples:

- happiness
- curiosity
- excitement
- surprise
- disappointment

Emotion is presentation and Behaviour input only.

Emotion may be supplied as explicit input to configured Entity Behaviour Rule eligibility or weights. It never executes Behaviour, performs state transitions, changes Permissions or owns Runtime State.

---

# Interaction Familiarity

Entities may react differently based on authorized interaction history or familiarity data.

Examples:

Companion

↓

knows Pet

↓

special greeting

Guide

↓

first meeting

↓

introduction

This familiarity is not automatically a Version 1 Relationship record. Entities are Objects and may therefore participate in an explicitly accepted `Related` Relationship, but interaction history never creates one silently. Interaction history remains separate from Behaviour Rules.

---

# Interruptions

Interactions may be interrupted.

Examples:

- user request
- higher priority Runtime Event
- Workspace change
- shutdown

Entity Interaction reports the interruption. Entity Behaviour owns priority resolution, interruption handling and deterministic transition to a safe State.

---

# Context Awareness

Interactions inherit Runtime Context.

Context may include:

- active Project
- current Workspace
- current Room
- active Theme
- selected Object
- nearby Entities

Context influences interaction.

It never changes Entity identity.

---

# Interaction History

Completed interactions may optionally be recorded.

Examples include:

- first meeting
- companion greeting
- tutorial completed

Interaction history is temporary by default and may support richer future interactions.

Recorded interaction history remains interaction data, not Knowledge. Only an explicit promotion through Knowledge Service creates a durable Knowledge record about the interaction; the original interaction record remains distinct and traceable.

---

# Failure Handling

If an interaction fails:

- Entity Behaviour returns all participants to a safe State
- partial animations are cancelled gracefully
- Runtime consistency is preserved
- other Entities remain unaffected

One failed interaction must never destabilize Cosmos.

---

# Extensibility

Future extensions may introduce:

- multiplayer interactions
- group conversations
- cooperative behaviors
- scripted sequences
- synchronized performances

All interactions follow the same Runtime contract.

---

# Design Goal

Entity Interaction should make Cosmos feel socially alive.

Users should experience natural cooperation between Entities without losing the predictability and stability of the Runtime.

---

# Principles

- Entities never communicate directly.
- The Runtime coordinates every interaction.
- Entity permission preflight is non-authoritative; Runtime Services always validate authoritatively.
- Context is inherited automatically.
- Runtime Services perform Runtime work.
- Conversations are interactions.
- Interaction history remains temporary unless explicitly promoted to Knowledge through Knowledge Service.
- AI enhances interaction but never defines it.
- Every interaction leaves the Runtime in a consistent State.
