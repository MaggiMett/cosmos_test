# Archive

## Purpose

Archive is the permanent knowledge browser of Cosmos.

It provides access to every stored Knowledge Item, Object, Relationship and historical version while preserving complete traceability.

Archive is the user's long-term memory.

It does not create Knowledge.

It reveals it.

---

# Philosophy

Every meaningful informational record intended for durable retention becomes Knowledge.

Objects, Relationships, Blueprints and Resources remain distinct domain concepts. Archive presents them alongside Knowledge without converting them into Knowledge.

Nothing meaningful is forgotten.

Archive allows users to revisit ideas years later while preserving their complete history and context.

Knowledge should remain understandable long after it was originally created.

---

# Responsibilities

Archive is responsible for:

- browsing Knowledge
- displaying Knowledge history
- displaying Object relationships
- navigating Tags
- exploring Project knowledge
- opening related Resources
- visualizing connected information

Archive never analyzes Knowledge.

It presents what already exists.

---

# Runtime Dependencies

Archive uses:

- Knowledge Service
- Object Service
- Relationship Service
- Tag Service
- Resource Service
- Runtime Context
- Event Model

Archive never accesses Persistence directly.

---

# Archive Structure

Archive organizes Knowledge through semantic associations rather than physical folders.

Knowledge may be explored through:

- Projects
- Objects
- Tags
- Relationships
- Sources
- Versions

Every view represents the same underlying Knowledge.

---

# Knowledge Items

Every Knowledge Item displays:

- title
- summary
- current version
- original source
- creation date
- author
- Tags
- related Objects
- related Knowledge
- connected Resource mappings
- Review history

Knowledge remains the central element.

---

# Original Sources

Every Knowledge Item preserves its origin.

Examples include:

- Capture
- promoted Chat record
- PDF
- Image
- Repository
- Blueprint
- Manual entry

Users may always open the original source.

The original is immutable.

---

# Version History

Archive displays every version of a Knowledge Item.

Users may inspect:

- original Capture
- refined versions
- Review decisions
- historical revisions

Nothing meaningful is overwritten.

Knowledge evolves transparently.

---

# Objects

Archive displays Objects together with their related Knowledge.

Opening an Object reveals:

- description
- related Knowledge
- Resources
- Relationships
- Tags
- Blueprint
- version history

Objects serve as knowledge hubs while remaining distinct domain entities.

---

# Relationships

Archive visualizes Project-owned Relationships between Object endpoints.

Version 1 supports only:

- Related

Future specialized type examples include:

- depends on
- expands
- references
- duplicates
- belongs to

The specialized examples are not current Version 1 Relationship types. Knowledge-to-Knowledge navigation uses references, Tags and Object associations rather than Relationship endpoints.

---

# Tags

Tags provide flexible navigation.

Two Tag types exist.

## System Tags

Assigned automatically.

Examples include:

- Project
- Object
- Blueprint
- Capture
- Resource

---

## User Tags

Created and maintained by users.

Examples include:

- Dwarfs
- Lore
- Economy
- Mining

Multiple Tags may point to the same Knowledge.

Users remain responsible for maintaining meaningful Tag names.

---

# Search

Archive provides unified search.

Search may combine:

- text
- Tags
- Objects
- Projects
- sources
- versions
- Relationships

Search operates across the complete Archive.

---

# Filters

Users may filter Archive by:

- Project
- Object
- Tag
- source
- date
- Blueprint
- Resource type
- Review status

Filters never modify Knowledge.

---

# Context

Archive inherits Runtime Context.

Inside a Project Workspace, Archive primarily presents Knowledge related to that Project.

Global Archive displays all Knowledge.

Context affects presentation only.

---

# Workspace Integration

Archive is a Tool.

Multiple Archive windows may exist simultaneously.

Archive may be opened alongside:

- Review
- Capture
- Companion
- Blueprint Builder

Each Tool retains its own Runtime State.

---

# References

Archive never duplicates data.

Every view references the original Runtime entities.

One Knowledge Item always has one identity regardless of how many different views display it.

---

# Companion

Companion may assist while browsing.

Examples include:

- explaining Relationships
- summarizing long histories
- finding related Objects
- answering Archive questions

Companion never changes Archive content directly.

---

# Editing

Archive supports reading and direct inline editing in the same Object View.

Inline edits send Commands through the appropriate Runtime Services. Archive never writes Persistence or mutates domain data directly.

Separate edit windows are not part of Version 1.

The selected Object remains readable while its editable fields are changed in place. Saving, validation, permissions, versioning and completed-fact Events remain owned by the corresponding Runtime Service.

---

# Failure Handling

Archive remains available whenever stored Knowledge is available.

If individual Resources become unavailable:

- Knowledge remains visible
- references remain preserved
- missing Resources are indicated
- browsing continues

Archive should degrade gracefully.

---

# Extensibility

Future extensions may provide:

- graph visualizations
- timeline views
- geographic views
- semantic clustering
- collaborative annotations

All extensions operate on the same underlying Knowledge.

---

# Design Goal

Archive should feel like a living encyclopedia built from the user's own work.

Every idea, decision and discovery should remain accessible, connected and understandable regardless of when it was originally created.

---

# Principles

- Durable informational records become Knowledge; domain entities and Resources remain distinct.
- Original sources remain immutable.
- Archive presents rather than analyzes.
- Objects organize understanding.
- Tags organize navigation.
- Relationships create context.
- Search spans the complete Archive.
- Archive references, never duplicates.
- Knowledge is never forgotten.
