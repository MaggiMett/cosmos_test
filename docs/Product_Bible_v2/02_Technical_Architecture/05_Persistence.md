# Persistence

## Purpose

The Persistence Layer defines how Cosmos permanently stores information.

It separates long-term data from temporary Runtime state while ensuring consistency, recoverability and future migration.

Persistence is responsible for durability.

It is not responsible for business logic.

---

# Philosophy

Users should never worry about losing information.

Every meaningful change should become durable.

Persistence should remain invisible.

Runtime components interact with Runtime Services.

Runtime Services interact with Persistence.

No other component accesses persistent storage directly.

---

# Responsibilities

The Persistence Layer is responsible for:

- storing domain data
- restoring Runtime state
- preserving history
- supporting versioning
- enabling recovery
- maintaining consistency
- supporting future migrations

Persistence never performs business decisions.

---

# Separation of Data

Cosmos separates persistent information into logical categories.

## Domain Data

Represents the semantic world.

Examples include:

- Projects
- Objects
- Object System Tags, active schema references and complete Properties
- Knowledge
- Relationships (`Related` only in Version 1)
- Tags
- Structure Template Objects and parent-child template references
- Prepared Structure records and physical-path mappings

---

## Runtime Configuration

Represents system configuration.

Examples include:

- installed Extensions
- enabled Themes
- persistent Workspace definitions and Workspace Blueprints
- Entity identity and configuration
- user preferences

---

## Runtime State

Represents temporary user state.

Examples include:

- active Workspace session state
- Direct Tool Mode Tool Instance state
- window positions
- active selections
- camera positions
- temporary drafts
- Entity position and restorable Entity State

Runtime State may be restored after restart.

---

## Resources

Resources remain inside their native Runtime Structure.

Examples include:

- source code
- textures
- documents
- media

Persistence stores references to Resources.

It does not replace them.

Projects persist Resource mappings, references and metadata. Native repository files and external assets remain owned and stored by their source.

---

## Cache

Cache contains rebuildable information.

Examples include:

- search indexes
- previews
- thumbnails
- embeddings
- analysis caches

Cache is never considered permanent.

It may be safely regenerated.

Persistent Workspace definitions remain durable when no Workspace session is active. Active Workspace sessions are temporary Runtime instances; only their restorable state is persisted.

---

# Ownership

Every persistent object has exactly one owner.

Examples:

Project

owns

Objects

Project

owns

Relationship records and Resource mappings

Object

references

Knowledge, Relationship records and Resource mappings

Knowledge

references

Resource mappings

Entity

owns

its persistent identity and configuration

Workspace definition

owns

its persistent configuration

Active Entity Runtime State references the immutable Entity ID.

Workspace session state references the immutable Workspace definition ID. Direct Tool Mode state references its Tool Instance and Tool definition without creating a Workspace owner.

Ownership should remain explicit.

---

# Transactions

Persistence guarantees transactional consistency.

Either:

everything succeeds

or

nothing changes.

Partial writes should never exist.

---

# Identity

Every persistent entity possesses an immutable identifier.

Display names may change.

Persistent references always use immutable IDs.

---

# Versioning

Persistent entities evolve through versions.

Examples include:

- Knowledge revisions
- Object history
- Workspace revisions
- Blueprint revisions

Older versions remain accessible.

Nothing meaningful is overwritten.

---

# Migration

Persistence must support future schema evolution.

Every persistent structure possesses:

- schema version
- migration path

The Runtime automatically upgrades supported data.

Unsupported data is preserved.

---

# Repository Independence

Cosmos never owns external repositories.

Repositories remain valid without Cosmos.

Persistence stores only:

- references
- mappings
- metadata

Cosmos adds understanding.

It never replaces native project structures.

---

# Backup

Persistence should support complete backup.

A backup preserves:

- Projects
- Knowledge
- Objects
- Relationships
- Resource mappings
- Tags
- Workspace definitions
- Entity identity and configuration
- Runtime configuration

Cache is excluded.

It may always be regenerated.

---

# Recovery

After unexpected shutdown:

Persistence makes the following state available for Runtime restoration:

- Runtime State
- restorable Workspace session state keyed to persistent Workspace definitions
- eligible Direct Tool Mode Tool Instance state
- temporary drafts
- active sessions

Users should continue working with minimal interruption.

---

# Runtime

The Runtime never depends on a specific storage technology.

The Persistence Layer defines contracts.

Different implementations may satisfy those contracts.

Examples include:

- SQLite
- PostgreSQL
- future implementations

Business logic remains unchanged.

---

# Version 1 Storage Profile

Version 1 uses a conservative local-first storage profile:

- SQLite is the authoritative transactional store for Cosmos domain data and durable Runtime configuration, including Project mappings and Project-owned Extension definitions.
- JSON manifests inside each Project `.cosmos/` directory are portable projections of committed Project mappings and Project-owned Extension definitions. They are not an independent source of truth.
- Native repositories and external sources store Resources.
- Dedicated cache directories store rebuildable indexes, embeddings, previews and analysis results.

Prepared Structures are not cache or virtual UI state. For Project or structural Object creation, Persistence stages the corresponding Project-managed locations for Knowledge, Files, Themes, Workspaces, Templates and Extensions, commits the authoritative SQLite records, and finalizes the physical locations before reporting success. Empty locations are valid and persist.

If staging, commit or finalization fails, the creation operation fails and Recovery reconciles the staged locations and authoritative record before the Object can become visible. The UI must never expose a Ghost Structure.

Prepared paths mirror the validated Cosmos Object hierarchy but remain separate from native repository Resource ownership. Path mappings are durable Project metadata; native source trees are never reorganized implicitly.

SQLite is the authoritative transactional store for Version 1.

Runtime Services commit authoritative changes through Persistence to SQLite first. Persistence then refreshes the applicable `.cosmos/` projection from the committed record. A missing or stale projection is rebuilt from SQLite; transactional correctness and Registry reconstruction never depend on the projection being current.

The Persistence contracts remain implementation-independent so a future migration is possible without changing domain behavior.

# Extensibility

Future extensions may introduce additional persistent data.

Every extension should persist data through the Persistence Layer instead of implementing independent storage systems.

This guarantees consistent backup, migration and recovery.

---

# Design Goal

Persistence should become invisible.

Users should trust that every important piece of work remains safe while the Runtime stays independent from specific storage technologies.

---

# Principles

- Persistence owns durability.
- Runtime owns behavior.
- Services access Persistence.
- Active Runtime systems never access Persistence directly.
- Extensions never bypass Persistence.
- IDs remain immutable.
- Transactions remain atomic.
- Resources remain external.
- Cache is rebuildable.
- Every schema is versioned.
- Storage technology remains replaceable.
