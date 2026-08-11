# Repository Runtime

## Purpose

The Repository Runtime manages the relationship between Cosmos Projects and external repositories.

It allows users to organize Projects semantically while preserving complete compatibility with existing development environments.

The Repository Runtime never owns repositories.

It coordinates references, lightweight signals, mappings and repository state without analyzing or modifying repository contents. Explicit project-file mutations initiated by the Files Tool are authorized by Resource Service and performed by the project-file adapter, not by Repository Runtime.

---

# Philosophy

Users think in Objects.

Repositories store implementation.

The Repository Runtime connects both worlds without forcing either side to change.

Cosmos organizes meaning.

Repositories organize implementation.

Journeyman translates between them.

---

# Responsibilities

The Repository Runtime is responsible for:

- connecting Projects to repositories
- coordinating current Object ↔ Resource mapping state
- tracking repository availability and health
- recording file-change and branch-change notifications
- coordinating triggered Repository Analyzer and Journeyman work
- exposing repository information through Runtime Services

The Repository Runtime never analyzes repositories, performs Runtime Translation, applies semantic changes or performs implementation work. Repository and mapping mutations occur only through authorized Runtime Services during approved Journeyman tasks or accepted analysis results.

User-requested Files operations are a separate project-scoped path: Resource Service authorizes create, edit, rename, move, delete and upload Commands inside the active Project's registered roots. These operations never grant Repository Runtime mutation authority and never reach arbitrary user files outside the Project.

---

# Repository Independence

Repositories remain first-class citizens.

Projects continue working normally without Cosmos.

Examples include:

- Git repositories
- Minecraft Mods
- Resource Packs
- Python Projects
- Web Applications

Cosmos never introduces proprietary repository structures.

---

# Runtime Structure

Every repository maintains its native structure.

Examples include:

Minecraft

- assets/
- data/
- recipes/

Python

- packages/
- modules/
- tests/

Frontend

- src/
- public/
- components/

The Runtime never replaces these structures.

---

# User Structure

Users work with semantic Objects.

Examples include:

Lore

↓

Dwarfs

↓

Dwarven Pickaxe

The semantic structure reflects understanding rather than file organization.

---

# Translation Layer

Runtime Translation is a capability of the Journeyman System Tool and occurs only during an approved affected task:

```text
User Structure

↓

Runtime Translation

↓

Repository Structure
```

The user defines meaning.

Journeyman resolves implementation.

Repository Runtime coordinates the required references and state. It never performs the translation itself.

---

# Object Mapping

Objects become the bridge between both worlds.

An Object may reference:

- one Resource
- multiple Resources
- generated Resources
- external Resources

Users continue working with one Object regardless of implementation complexity.

---

# Repository Discovery

Existing repositories may be imported.

Repository Analyzer performs the explicitly triggered, read-only analysis of:

- directory structure
- technologies
- naming conventions
- dependencies
- project patterns

Based on this analysis, Repository Analyzer produces candidate Objects, mappings and semantic structure for review. Accepted mutations are sent through Runtime Services; Journeyman orchestrates any approved implementation or Runtime Translation work through the selected development Provider.

The user decides what becomes part of the Project.

---

# Repository Monitoring

The Repository Runtime may continuously record only lightweight external signals when available.

Examples include:

- repository availability
- file-change notifications, including creation, modification, deletion and rename
- branch-change notifications
- repository health

Signals report that repository state may have changed. They do not analyze, interpret, translate or mutate it.

Repository analysis, architectural interpretation, Object discovery and mapping validation occur only during import, when explicitly requested, or when fresh results are required before an approved task in the affected area.

Signals are published as completed-fact Runtime Events through the existing Event Model. An Event never starts analysis or translation directly; a Runtime Service may create the required long-running Job after validation.

---

# Synchronization

Synchronization is coordinated and demand-driven whenever it analyzes repository content or mutates Resource mappings or Project metadata.

User implementation requests

↓

Runtime Service

↓

Journeyman Job

↓

Repository

External repository changes

↓

Repository Runtime signal

↓

Explicit request or approved affected-task trigger

↓

Repository Analyzer read-only analysis when required

↓

Accepted Resource mappings or Project metadata updated through Runtime Services

Synchronization preserves user intent while maintaining repository compatibility.

Project Service persists repository references and Project metadata. Resource Service persists Project-owned Resource mappings. Repository Runtime coordinates the resulting state but never writes Persistence itself.

---

# Runtime Services

The Repository Runtime collaborates with:

- Project Service
- Object Service
- Resource Service
- Job Service

Business logic remains inside Runtime Services.

---

# Events

Typical Events include:

- RepositoryConnected
- RepositoryScanned
- RepositoryUpdated
- RepositoryDisconnected
- ResourceMapped
- ResourceUnmapped

Other Runtime systems subscribe through the Event Model.

---

# Compatibility

The Repository Runtime must remain compatible with external tooling.

Examples include:

- Git
- IDEs
- Build Systems
- Compilers
- Minecraft Mod Loaders
- External Editors

Cosmos should integrate into existing workflows rather than replacing them.

---

# Failure Handling

Repository failures remain isolated.

If a repository becomes unavailable:

- semantic Project data remains available
- Object mappings remain preserved
- Runtime Services continue operating where possible
- lightweight availability and change signaling resumes when the repository becomes available

Pending analysis, translation or mapping synchronization remains demand-driven and requires its explicit or affected-task trigger.

---

# Extensibility

Future extensions may introduce support for additional repository types, development platforms and build systems.

Additional support should extend the existing Repository Analyzer or Journeyman System Tool contracts rather than introduce new Runtime systems or a separate Runtime Translation Tool.

---

# Design Goal

The Repository Runtime should make technical implementation feel invisible.

Users organize Projects according to meaning while Journeyman maintains compatibility during approved affected tasks.

Both perspectives may be synchronized through demand-driven tasks without ever becoming identical.

---

# Principles

- Repositories remain independent.
- Cosmos organizes meaning.
- Journeyman orchestrates Runtime Translation through the selected development Provider.
- Repository Analyzer performs read-only analysis on demand.
- Only lightweight repository signals may be continuous.
- Objects connect both worlds.
- Repository compatibility is always preserved.
- Synchronization is bidirectional.
- External tools remain first-class citizens.
- One repository failure never affects the Runtime.
