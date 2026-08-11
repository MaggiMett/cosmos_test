# Project

## Purpose

A Project represents the complete journey from an initial idea to a finished product.

Projects are the highest organizational unit inside Cosmos.

Everything that contributes to realizing a vision is organized by or referenced from a Project. This logical scope does not transfer ownership of native Resource files.

A Project defines meaning.

It does not define implementation.

A Project is a normal Object with the `Project` System Tag. Project responsibilities are activated through the universal Object Model; Project is not a separate identity system.

---

# Vision

Every Project begins with a vision.

The vision describes what the user ultimately wants to create.

Examples include:

- a Minecraft modpack
- a software application
- a knowledge base
- a research project
- a personal goal
- a business

The vision provides long-term direction for the entire Project.

---

# Responsibilities

A Project organizes:

- Objects
- Knowledge
- Resource mappings
- Relationships
- Workspaces
- Runtime references
- Decisions
- History

A Project never performs work itself.

Work is performed through Workspaces and Tools.

---

# Project Structure

Every Project owns one logical structure.

This structure represents how the user understands the Project.

It is independent from technical implementation.

Objects are organized into meaningful branches.

Examples include:

- Lore
- Items
- Characters
- Systems
- UI
- Backend

The structure should reflect understanding rather than file organization.

---

# Objects

Projects organize Project-owned Objects.

Objects are the primary entities that users create, explore and evolve.

Every Project-owned semantic Object has exactly one primary Project. Cosmos-global, System-owned, reusable definition and Runtime-only Objects do not require a primary Project. Any Object may still be referenced from another Project without duplicating identity.

Objects may reference:

- Knowledge
- Resource mappings
- Relationships
- Tags
- Versions

Objects continue to exist regardless of their visual representation.

---

# Knowledge

Projects continuously accumulate Knowledge.

Knowledge includes:

- ideas
- captures
- documentation
- promoted discussion records
- discoveries
- decisions

Knowledge evolves throughout the lifetime of the Project.

---

# Resources

Projects reference Resources through stable Resource mappings.

Resources represent technical implementation assets such as:

- source code
- textures
- models
- documents
- media
- configuration

Resources remain compatible with their native technologies.

Native repositories or external sources own the Resource files. A Project owns only its mappings, references and metadata.

The Files Tool may perform explicit user-requested file operations only inside the active Project's registered physical roots. This authorized access does not transfer file ownership to Cosmos and never extends to arbitrary user files outside the Project.

Cosmos never replaces existing project structures.

---

# Repositories

A Project may connect to zero, one or multiple repositories.

Repositories implement parts of the Project Vision.

The Project remains the semantic boundary even when implementation spans several repositories or external systems.

---

# System Projects

A System Project is a normal Project Object with the additional `System` System Tag.

System Projects extend Cosmos itself. They use the same Project lifecycle, Context, Prepared Structures, Workspaces, Tools, permissions and persistence contracts as user Projects.

Version 1 experience provides the Knowledge Workspace, Creation Workspace and Graphics Workspace System Projects. Their purpose differs; their Project architecture does not.

---

# Prepared Structure

Project creation physically creates the complete prepared foundation used by the Experience:

- Knowledge
- Files
- Themes
- Workspaces
- Templates
- Extensions

These Project-managed areas may remain empty. They mirror the real Cosmos structure and do not reorganize or claim ownership of native repository Resources.

Prepared Structures expand with validated structural Objects and active System Tag schemas. They are never virtual placeholders or lazily invented Ghost Structures.

# Runtime

Projects exist independently from the currently active Workspace.

Multiple Workspaces may operate on the same Project simultaneously.

Changing Workspaces never changes the Project itself.

---

# Context

When a Project is assigned to Runtime Context, it contributes to the existing additive Context.

The Project automatically contributes:

- Project Tags
- active Theme
- inherited Context
- available Objects

A Workspace session inherits the contributions of its zero, one or multiple assigned Project scopes. An optional focused or primary Project may provide defaults without replacing the other assigned scopes.

---

# Themes

Projects inherit the global Theme by default.

Users may override the Theme for individual Projects.

Project Themes may customize appearance without affecting functionality.

---

# Growth

Projects are expected to evolve.

Ideas may be preserved as Knowledge.

Knowledge may inform the creation and evolution of Objects without becoming those Objects.

Objects accumulate Resource mappings.

Native Resources implement real products while remaining externally owned.

Projects therefore grow naturally over time.

---

# Independence

Projects remain independent from:

- programming languages
- repositories
- file structures
- technologies
- visual themes

A Project describes meaning.

Implementation belongs to the Runtime.

---

# Extensibility

Projects are designed to grow.

Future extensions may introduce:

- additional System Tag and Property Schema combinations
- new Runtime integrations
- specialized Workspaces
- custom Blueprints
- collaborative capabilities

Extensions should enrich Projects without changing their fundamental purpose.

---

# Design Goal

A Project should feel like a living world rather than a folder.

It continuously collects ideas, knowledge, implementation and history until the original vision becomes reality.

---

# Principles

- Every Project begins with a vision.
- Projects organize meaning.
- Projects contain Objects.
- Projects own Relationship records and Resource mappings.
- Objects reference Knowledge, Relationships and Resource mappings.
- Workspaces work on Projects.
- Themes never change Project logic.
- Projects evolve continuously.
- Projects remain independent from technical implementation.
- System Projects are normal Projects with the `System` System Tag.
- Prepared Structures exist physically and may remain unused.
