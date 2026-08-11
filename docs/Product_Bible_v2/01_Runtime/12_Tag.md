# Tag

## Purpose

Tags provide semantic organization throughout Cosmos.

They describe context, meaning and structure without defining hierarchy.

Tags allow Cosmos to organize information naturally while remaining completely flexible.

They are one of the primary mechanisms used to build understanding across the entire system.

---

# Philosophy

Tags describe role, context or user-defined meaning.

They do not describe storage.

A single Object may belong to many different contexts simultaneously.

Tags allow users to organize Projects in the way that best matches their own understanding.

---

# Responsibilities

Tags are responsible for:

- organizing Knowledge
- organizing Objects
- providing Context
- supporting discovery
- enabling search
- assisting intelligent systems
- connecting related information

Tags never replace Objects or Relationships.

They complement them.

System Tags additionally activate Object capabilities and Property Schemas. User Tags additionally allow grouping and collection views to emerge without a dedicated grouping system.

---

# Tag Categories

Cosmos distinguishes between two categories of Tags.

## System Tags

System Tags compose Object roles and structural information managed by Cosmos.

Examples include:

- Project
- Branch
- Object
- Blueprint
- Capture
- Workspace
- Tool
- Theme
- State

System Tags support the Runtime and Context inheritance.

They also determine which Property Schemas apply. Every required Property from every active schema must exist with a valid value.

System Tags may be combined. A combination such as `Project + System + Workspace` expresses several compatible roles without creating a separate class.

Users normally do not manage them manually.

---

## User Tags

User Tags describe meaning from the user's perspective.

Examples include:

- Lore
- Dwarfs
- Mining
- Magic
- UI
- Backend
- Performance

Users are completely free to organize their Projects however they prefer.

Cosmos never forces a tagging strategy.

Shared User Tags support search, filtering, grouping, discovery and reusable collection views. A collection is a query over Objects and Tags, not a separate identity or ownership system.

---

# Ownership

Users own their User Tags.

Cosmos owns System Tags.

The system may suggest improvements but never silently modifies User Tags.

Display names remain Object Identity metadata. Cosmos does not create a duplicate mandatory User Tag merely to mirror an Object name.

---

# Context Inheritance

Tags flow through the Runtime automatically.

```text
Direct Tool Mode:
Cosmos → Optional Project Scopes and Focus → Tool → Optional Object → Optional Knowledge

Workspace Mode:
Cosmos → Optional Project Scopes and Focus → Room → Workspace Session → Tool → Optional Object → Optional Knowledge
```

Every present level contributes additional Context. Project scopes are optional and may contain zero, one or multiple assigned Projects plus an optional focused or primary Project.

Lower levels extend inherited Tags.

They never replace them.

---

# Multiple Tags

Objects and Knowledge may possess many Tags simultaneously. System Tags belong to the validated Object contract; User Tags remain user-defined metadata.

Example:

Project

- Mettventures

Object

- Item

User Tags

- Dwarfs
- Mining
- Weapon

Together these Tags describe one semantic context.

---

# Semantic Organization

Tags allow users to organize Projects naturally.

The same Object may appear in many searches because it belongs to many contexts.

Cosmos encourages interconnected knowledge rather than isolated categories.

---

# Discovery

As Projects grow, Cosmos continuously analyzes Tag usage.

The system may discover:

- duplicated concepts
- inconsistent naming
- related groups
- missing Tags
- frequently combined Tags

Suggestions are always presented to the user.

The user decides whether to accept them.

---

# Tag Evolution

Tags naturally evolve over time.

Large Projects often become more detailed.

Example:

Initially:

Item

Later:

Weapon

Later:

Dwarven Weapon

Later:

Legendary Dwarven Weapon

Cosmos should support this gradual refinement without disrupting existing organization.

---

# Synonyms

Different Tags may intentionally describe the same concept.

Examples include:

Dwarfs

Zwerge

Dwarf

Users may choose to associate multiple Tags with the same Objects.

Cosmos never forces one naming convention.

Consistency remains the user's responsibility.

---

# Search

Tags provide one of the primary search mechanisms inside Cosmos.

Users may search by:

- single Tags
- combinations of Tags
- inherited Context
- related Tags

Tags improve discovery rather than replacing full-text search.

---

# Runtime

Tags are lightweight.

They may be attached to:

- Projects
- Workspaces
- Objects
- Knowledge
- Resources

The Runtime continuously combines inherited and local Tags into one active Context.

---

# Extensibility

Future extensions may introduce:

- namespaces
- custom Tag types
- weighted Tags
- AI-generated suggestions
- semantic clusters
- visual Tag systems

The fundamental Tag model should remain unchanged.

---

# Design Goal

Tags should feel effortless.

Instead of forcing rigid folder structures, Tags allow users to describe meaning from many different perspectives while Cosmos continuously builds a richer understanding of their work.

---

# Principles

- Tags describe meaning.
- Tags provide Context.
- System Tags and User Tags remain separate.
- Context is inherited automatically.
- Users own their organization.
- Cosmos assists but never takes control.
- Tags continuously evolve.
- Relationships remain independent from Tags.
