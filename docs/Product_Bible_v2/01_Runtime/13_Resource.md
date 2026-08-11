# Resource

## Purpose

Resources represent the physical implementation assets of a Project.

Unlike Knowledge, Resources contain the actual files, media and technical artifacts required to build a real product.

Resources implement.

They do not explain.

---

# Philosophy

Resources belong to the implementation layer.

Users think in Objects.

Objects reference Resources.

Resources remain compatible with the technologies they belong to.

Cosmos never replaces existing project structures.

---

# Responsibilities

Resources are responsible for:

- storing implementation assets
- preserving compatibility
- supporting external tools
- providing technical content
- linking implementation to Objects

Resources never define meaning.

Meaning belongs to Objects and Knowledge.

---

# Resource Types

Resources may include:

- source code
- configuration
- images
- textures
- 3D models
- audio
- video
- documents
- localization
- scripts
- generated assets
- external files

Future Extensions may introduce additional Resource types.

---

# Ownership

Resources remain owned by their native repository or external source.

Projects own stable Resource mappings, references and metadata. Objects use those mappings to reference Resources.

One Object may reference:

- one Resource
- many Resources

One Resource may be referenced by multiple Objects when appropriate.

---

# Runtime Location

Resources remain inside the Runtime Structure.

Examples include:

Minecraft

- assets/
- data/
- resource packs

Applications

- frontend/
- backend/
- database/

Cosmos references Resources.

It does not replace existing repository layouts.

---

# Knowledge

Knowledge explains Resources.

Examples include:

- implementation notes
- design decisions
- documentation
- research
- discussions

Resources contain implementation.

Knowledge provides understanding.

Resources never become Knowledge. Durable informational records that describe, summarize or analyze a Resource may become Knowledge while the Resource remains distinct.

---

# Relationships

Resources may participate in Relationships through the Objects that reference them.

Relationships are never attached directly to files.

Meaning always belongs to the Object layer.

---

# Versioning

Resources evolve naturally.

Version history should remain available whenever possible.

Cosmos should preserve the relationship between historical Resources and historical Knowledge.

---

# External Editing

Resources are expected to be edited by external software.

They may also be managed through the project-scoped Files Tool when the user explicitly creates, edits, renames, moves or deletes a file inside the active Project's authorized roots.

Examples include:

- Visual Studio Code
- Blender
- Blockbench
- Photoshop
- IntelliJ
- Unreal Engine

Repository Runtime may record lightweight file-change notifications without requiring users to work exclusively inside Cosmos. Interpreting those changes remains demand-driven.

Files operations pass through Resource Service authorization and a project-file adapter. Neither the Files Tool nor Repository Runtime accesses Persistence or performs unvalidated filesystem mutations directly.

---

# Import

Existing Resources may be mapped into Projects.

Repository Analyzer performs the triggered, read-only analysis of:

- directory structure
- technologies
- naming conventions
- dependencies

Accepted Project-owned mappings then connect Resources to existing or newly created Objects through Resource Service and Persistence. Journeyman orchestrates only approved affected implementation or Runtime Translation work; the selected development Provider performs provider-specific execution. The native assets remain owned by their repository or external source.

---

# Generation

System Tools may generate new Resources.

Examples include:

- source code
- configuration
- localization
- templates
- documentation

Generated Resources become normal Runtime Resources.

---

# Runtime

Resources remain independent from:

- Themes
- Workspaces
- Tools
- Views

Different Tools may edit the same Resource.

The Resource itself remains unchanged except through explicit user actions.

---

# Extensibility

Future extensions may introduce:

- new Resource types
- custom editors
- validation systems
- preview providers
- importers
- exporters

Every extension should continue treating Resources as implementation assets.

---

# Design Goal

Resources should integrate naturally with existing development workflows.

Users should never feel locked into Cosmos.

Instead, Cosmos should provide understanding while allowing every Resource to remain fully compatible with external software.

---

# Principles

- Resources implement or support Objects.
- Knowledge explains Resources.
- Objects reference Resources.
- Projects own Resource mappings, not native Resource files.
- Resources remain technology compatible.
- Cosmos never replaces repository structures.
- External tools remain first-class citizens.
- Resources evolve continuously.
- Everything remains extensible.
