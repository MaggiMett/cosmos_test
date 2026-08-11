# Files

## Purpose

Files is the project-scoped file management Tool of Cosmos.

It allows users to browse, preview, create, edit, rename, move and delete files that belong to the active Cosmos Project without exposing arbitrary user files.

Files manages implementation assets. It does not replace the semantic User Structure or make native files into Knowledge.

---

# Project Boundary

Every Files instance requires an active Project scope.

The accessible roots are limited to physical locations registered to that Project, including its Prepared Structures and connected repository roots. Paths are always displayed relative to the Project root that owns them.

Files must reject:

- absolute paths supplied as user navigation
- parent traversal outside an authorized Project root
- symbolic-link or junction resolution outside an authorized Project root
- access to repositories or folders that are not registered to the active Project
- operations after the Project Context has changed or expired

Files never browses, reorganizes or modifies arbitrary user files outside the active Project.

---

# Responsibilities

Version 1 Files is responsible for:

- browsing Project directories
- previewing supported Project files
- creating Project files
- editing Project files
- renaming Project files
- moving Project files within authorized roots of the same Project
- deleting Project files after explicit user intent
- uploading files into an authorized Project location
- searching within the authorized Project roots
- switching between grid and list presentation

Files never analyzes repository meaning, creates Knowledge, changes Object semantics or performs Runtime Translation.

---

# Runtime Dependencies

Files uses:

- Project Service
- Resource Service
- Runtime Context
- Permission System
- Repository Runtime availability signals
- Event Model

Files never accesses Persistence or the native filesystem directly.

Resource Service is the authoritative command boundary for project-file operations. It validates the active Project, permissions, registered root, canonical resolved path and operation-specific constraints before delegating the physical operation to the project-file adapter. Completed operations publish facts through the Event Model and update Project-owned Resource mappings when applicable.

Repository Runtime continues to coordinate availability, health and lightweight file-change signals. It does not perform Files operations itself.

---

# Ownership

Native repositories and external sources continue to own their files. Project ownership of Resource mappings remains distinct from file ownership.

Files provides an authorized user interface for explicit mutations inside the active Project. A successful Files command changes the native Project file; it does not transfer ownership to Cosmos or reorganize unrelated repository content.

---

# Context

Files inherits the normal additive Runtime Context but requires one active Project for file operations. If several Project scopes are present, the focused Project determines the Files root. Without a focused Project, Files requests an existing Cosmos Focus decision rather than inventing a separate Project selector.

Changing Context never silently retargets an in-progress mutation. The command uses the validated Context Snapshot captured at submission.

---

# Operations

## Create and Upload

New files and uploads require a project-relative destination. Existing targets are never overwritten implicitly.

## Edit

Editing writes only after the Resource Service validates the current file identity and authorized Project root. Conflicting external changes are reported instead of silently overwritten.

## Rename and Move

Rename and move remain inside authorized roots of the same Project. Cross-Project moves are not supported in Version 1.

## Delete

Delete requires explicit user intent. The affected project-relative file path must be visible before execution. Deleting a native file never deletes related Knowledge or Objects; affected Resource mappings are preserved or updated according to Resource Service rules.

---

# Failure Handling

If an operation fails:

- the existing file remains unchanged whenever atomic operation support is available
- partial temporary output is removed or isolated
- the failure and affected project-relative path are explained
- the Files Window remains usable
- retry remains possible when safe
- no operation expands beyond the validated Project boundary

---

# Principles

- Files is always scoped to the active Cosmos Project.
- Files may create, edit, rename, move and delete Project files.
- Files never manages arbitrary user files outside the active Project.
- Resource Service authorizes mutations; adapters perform physical I/O.
- Repository Runtime observes and coordinates but does not mutate files.
- Native ownership and compatibility remain intact.
- Semantic structure and physical file structure remain distinct.
