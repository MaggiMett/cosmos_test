# Project Resource Projection Contract

**Status:** Phase C foundation
**Date:** 2026-08-13

## Purpose

Project Resource Projection is a user-facing convenience view over physical resources that belong to one Cosmos Project. It may help a user discover and open editable project content from Project Cosmos, but it is never the semantic model of the Project.

Cosmos Objects, Knowledge, relationships, hierarchy levels and runtime bindings remain authoritative. A folder or file does not become a Cosmos Node merely because it appears in this projection.

## Authoritative resource boundary

V1 projection reads only the Project's prepared `Files` resource root through `ResourceService`. It must not crawl the repository, runtime root, `.cosmos` prepared areas, arbitrary host paths, or infer content from source-code layout.

The existing ResourceService remains the physical-file authority for path containment, permissions, metadata and file operations. Projection code consumes its safe project-scoped tree rather than introducing a second filesystem access path.

## Projection model

A projected entry has presentation identity only:

- `projectId`: owning Cosmos Project
- `resourcePath`: normalized path relative to the Project `Files` root
- `displayName`: user-facing file/folder name
- `kind`: `group` or `resource`
- `depth`: projected nesting depth
- `editable`: whether the authoritative ResourceService reports the resource as editable
- `children`: projected descendants for groups

Projection IDs, if needed by a presenter, must be derived/namespaced as presentation identifiers and must never be persisted as Cosmos Object IDs.

## Visibility policy

The projection is intentionally curated. V1 hides resource entries that are implementation/noise rather than useful Project content:

- dot-prefixed names at any depth (`.git`, `.cache`, `.DS_Store`, etc.)
- common generated/dependency directories: `node_modules`, `__pycache__`, `dist`, `build`, `coverage`, `.pytest_cache`, `.mypy_cache`, `.ruff_cache`
- temporary/editor artifacts ending in `~`, `.tmp`, `.temp`, `.swp`, `.swo`, `.bak`

A hidden directory hides its entire subtree. Filtering is presentation-only: it never deletes, moves or mutates the physical resource.

The policy should remain small and explicit. Do not grow it into language/framework detection heuristics without a separate contract decision.

## Hierarchy rules

Physical nesting may be represented as a navigation convenience, but it does not assign Cosmos semantic hierarchy such as Domain, Cluster, Object or Detail. Project Cosmos may visually distinguish projected resources from semantic Nodes; it must not mix both into one authoritative graph model.

Empty groups may be omitted from the Project projection when they contain no visible descendants. The underlying physical directory remains valid.

## Interaction rules

Selecting a projected resource may open/hand off to the existing project Files capability. Projection itself does not own file editing, move, delete, permissions or preview behavior.

Navigation from a projection entry must carry explicit Project context. A resource path is meaningless outside its owning Project.

## Failure and fallback

If the Files root is unavailable, unreadable, or empty, Project Cosmos remains fully usable as a semantic Cosmos view. Resource projection is additive and must never block Project navigation.

Invalid or escaped paths are rejected by ResourceService; projection code must not weaken that containment boundary.

## First implementation slice

1. Add a pure projection/filter function over the existing ResourceService tree payload.
2. Cover visibility, nesting and presentation-only identity with unit tests.
3. Do not change Cosmos Map payloads or semantic Node persistence.
4. Only after the contract/filter is stable, expose a dedicated read endpoint/runtime adapter and then a visually distinct Project-Cosmos resource layer.
