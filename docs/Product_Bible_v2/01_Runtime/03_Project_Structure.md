# Project Structure

## Purpose

This document defines how Projects are structured inside Cosmos.

It explains how user-defined project organization relates to technical implementation while keeping both worlds independent.

The goal is to allow users to organize projects in the way that best supports understanding without sacrificing compatibility with the target technology.

---

# Philosophy

Cosmos never reorganizes arbitrary user files or substitutes file layout for semantic structure. The project-scoped Files Tool may explicitly create, edit, rename, move and delete files only inside the active Project's authorized physical roots.

Cosmos organizes meaning.

The user works with concepts.

Journeyman provides the implementation experience and orchestration. The selected development Provider performs provider-specific implementation.

Both structures coexist without replacing each other.

---

# Two Structures

Every Project consists of two connected structures.

```text
User Structure

↓

Runtime Translation

↓

Runtime Structure
```

The user normally works with the User Structure. When direct physical file management is required, the Files Tool exposes only the active Project's authorized roots without turning them into semantic Branches or Objects.

Journeyman orchestrates Runtime Translation between both worlds only during an approved affected implementation, synchronization or validation task.

---

# User Structure

The User Structure represents how humans naturally understand a Project.

It is optimized for:

- understanding
- planning
- brainstorming
- navigation
- architecture
- creativity

The User Structure contains:

- Branches
- Objects
- Relationships
- Context
- Knowledge

It also contains the Project's Prepared Structures. These are physical, Project-managed locations that mirror the real Cosmos organization; they do not create a third semantic hierarchy.

The user owns this structure completely.

---

# Runtime Structure

The Runtime Structure represents how the target technology expects the Project to exist.

Examples include:

Minecraft

- assets/
- data/
- resource packs

Application

- frontend/
- backend/
- tests/
- database/

Python

- packages
- modules
- configuration

The Runtime Structure always remains compatible with the target platform.

---

# Prepared Structures

Every new Project physically receives these prepared Project-managed areas:

```text
Knowledge
Files
Themes
Workspaces
Templates
Extensions
```

Empty areas are valid. Prepared means available, not required.

Prepared paths mirror the validated Object and Node structure. Creating, moving or removing a structural Object updates the applicable mirrored prepared paths through Runtime Services. Prepared Structures never reorganize the native Runtime Structure or transfer ownership of external Resources.

No Ghost Structures are valid: the UI, Tools, AI providers and Extensions may only advertise a prepared path after its physical creation succeeds.

Active System Tags determine which additional prepared paths and complete defaults apply. The same preparation contract serves user Projects and System Projects.

---

# Runtime Translation

Runtime Translation is a capability of the Journeyman System Tool, not a separate System Tool identity.

Journeyman connects both structures during approved affected tasks.

The user decides:

- what exists
- what it means
- how it is organized

Within approved implementation work, Journeyman presents the task constraints while the selected development Provider determines:

- file locations
- naming conventions
- implementation details
- validation
- compatibility
- generated resources

Meaning belongs to the user.

Implementation execution belongs to the selected development Provider behind the Journeyman experience.

---

# Objects

Objects are the bridge between both structures.

Every Project-owned semantic Object exists inside the User Structure. Global definitions and Runtime-only Objects use the same Object Model without pretending to belong to a Project.

Objects may reference one or many Runtime Resources.

One Object may correspond to:

- one file
- many files
- generated assets
- external resources

Users continue working with one Object regardless of implementation complexity.

---

# Runtime Resources

Runtime Resources always remain inside the original repository.

Cosmos never requires moving project files to adopt a proprietary layout. User-requested moves inside the active Project remain available through the project-scoped Files Tool.

Resources may include:

- source code
- textures
- models
- recipes
- localization
- configuration
- documentation

Objects simply reference these Resources.

Project `.cosmos/` manifests are portable projections of committed Project mappings and Project-owned Extension definitions. SQLite remains the authoritative Version 1 transactional store; manifests do not create a third Project structure or a second source of truth and may be rebuilt from committed Persistence records.

---

# Importing Existing Projects

Existing repositories can be imported into Cosmos.

Repository Analyzer performs the triggered, read-only analysis of:

- directory structure
- naming conventions
- object patterns
- dependencies
- technologies

Based on this analysis, Repository Analyzer produces candidate Objects and structure. Journeyman may use accepted results during approved implementation or Runtime Translation work.

The user decides which suggestions should become part of the Project.

Importing is always incremental.

---

# Creating New Projects

New Projects usually begin without Runtime Resources.

Initially they consist only of:

- Vision
- Knowledge
- Objects
- Relationships
- their empty physical Prepared Structures

Implementation starts only when the user decides to build something.

Journeyman requests the selected development Provider to create the required Runtime Resources within the approved task, permissions and Prepared Structures.

---

# Branches

Projects are organized through Branches.

Branches provide semantic organization.

Examples:

- Lore
- Characters
- Systems
- UI
- Backend
- World Building

Branches are organizational Objects.

They never represent technical folders.

Reusable structural branches may be captured as independent Structure Template Objects. Each included Node becomes one `Template + Structure` Object; parent-child template references preserve the reusable pattern. Shared User Tags produce collections without a separate template-group record.

---

# Relationships

Objects may freely reference each other across Branches.

Relationships describe meaning rather than hierarchy.

Cosmos encourages interconnected knowledge instead of isolated folder trees.

---

# Compatibility

The Runtime Structure always remains compatible with external tooling.

Projects continue working with:

- Git
- IDEs
- Build Systems
- External Editors
- Existing Pipelines

A Project can always be used without Cosmos.

Cosmos adds understanding.

It never introduces dependency.

---

# Future Growth

Projects naturally evolve.

```text
Vision

↓

Knowledge

↓

Objects

↓

Resources

↓

Product
```

The logical structure grows together with the user's understanding.

The Runtime grows together with approved implementation.

Both remain connected without continuous analysis or mutation. Synchronization that changes Resource mappings or Project metadata occurs only through Runtime Services after an explicit or affected-task trigger.

---

# Design Goal

Project Structure should allow users to think like creators rather than programmers.

Users organize meaning.

Journeyman orchestrates and presents implementation performed by the selected development Provider.

Both perspectives remain permanently connected.

---

# Principles

- The user owns the User Structure.
- Journeyman owns the Runtime Translation experience and orchestration; the selected Provider performs implementation execution.
- Repository Analyzer owns read-only repository analysis.
- Runtime compatibility is always preserved.
- Objects connect both worlds.
- Meaning is independent from implementation.
- Existing repositories remain usable.
- Projects grow continuously.
- Prepared Structures physically mirror Cosmos and never become Ghost Structures.
- Structure Templates are independent Objects and contain structure only.
