# Architecture Audit

> **Historical record:** Superseded by [`Architecture_Review_V3.md`](../Architecture_Review_V3.md). This file preserves the earlier audit only and is not part of the current architecture contract or freeze decision.

## Historical Status

This document is a historical record of an earlier correction pass. Its readiness statement and "Remaining Non-Blocking Design Work" section are not current Architecture Freeze evidence.

Where this audit discusses repository behavior, the current canonical contract is narrower: only repository availability, file-change notifications, branch-change notifications and repository health may be continuous. Repository analysis, architectural interpretation, Object discovery, Resource mapping or Project metadata mutation, Runtime Translation and implementation are demand-driven. Repository Analyzer owns triggered read-only analysis; Journeyman owns approved implementation and Runtime Translation during affected tasks.

## Result

The reviewed Product Bible is structurally coherent and ready for the Bundled Extensions and Blueprint phase.

This audit focused on terminology, responsibility boundaries, runtime consistency, extensibility and likely Codex interpretation errors.

## Applied Corrections

### Critical

- Restored **Direct Tool Mode** in Cosmos: one Tool may run beside the visible map, while Workspaces remain the multi-window mode.
- Replaced continuous repository rescanning with demand-driven validation before affected Journeyman work.
- Clarified that Resources remain owned by native repositories or sources and are referenced by Objects.
- Made Project Context optional and allowed Workspaces to carry assigned Project Tags.

### Major

- Standardized **Workspace Blueprint** as the canonical term.
- Documented the Version 1 native Extension language stack: Python plus Vue/TypeScript.
- Added the concrete Version 1 persistence profile: SQLite, Project JSON manifests, native repositories and rebuildable caches.
- Clarified the boundary between Runtime Services and asynchronous Job handlers.
- Strengthened Extension Validation with static checks, security scanning, isolated registration simulation and mandatory tests for code-bearing Extensions.
- Added support for Projects spanning multiple repositories.
- Clarified that Journeyman translation and repository synchronization are explicit and demand-driven, not continuous autonomous mutation.

### Minor

- Moved `01_Vision.md` into `00_Foundation`.
- Corrected Event consumers so Runtime Services do not contradict their own event contract.
- Corrected the `KnowledgeCreated` Event example.
- Clarified Node view-state persistence without giving Nodes domain ownership.
- Clarified that Workspaces organize work while Tools perform actions.
- Clarified that the three bundled Base Workspaces are defaults, not fixed types.

## Canonical Terminology

- Workspace Blueprint
- Object Blueprint
- Capture Template
- User Tool
- System Tool
- Runtime Service
- Job Handler
- Resource Mapping
- Direct Tool Mode
- Workspace Mode

## Remaining Non-Blocking Design Work

The next documents should define bundled User Tools, bundled System Tools, Workspace Blueprints, Object Blueprints, Capture Templates and the Galaxy visual package. No remaining issue blocks that phase.
