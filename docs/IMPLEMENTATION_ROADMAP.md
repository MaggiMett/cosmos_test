# Cosmos V1 Implementation Roadmap

**Version:** 1.0
**Status:** Authoritative
**Purpose:** Autonomous implementation roadmap for Codex

---

# Purpose

This document defines the implementation order for Cosmos Version 1.

Codex is expected to execute every Sprint autonomously.

After successfully completing one Sprint, Codex should immediately continue with the next Sprint.

User interaction is only required when a genuine blocking issue occurs.

---

# Authority

Implementation must follow the following priority:

1. Product Bible
2. Experience
3. Visual Specifications
4. This Roadmap

If documentation conflicts, Codex must stop and request clarification.

---

# General Rules

For every Sprint Codex must:

- implement the required functionality
- keep the architecture clean
- reuse existing systems whenever possible
- avoid temporary solutions
- avoid duplicated implementations
- write production-ready code
- keep the project buildable at all times

---

# Sprint Workflow

Every Sprint follows exactly the same process.

## 1.

Read all required documentation.

---

## 2.

Create an implementation plan.

---

## 3.

Implement the Sprint.

---

## 4.

Run all available checks.

Examples:

- formatting
- linting
- type checking
- unit tests
- integration tests
- frontend build
- backend build

---

## 5.

Fix every issue discovered during testing.

Repeat until every check succeeds.

---

## 6.

Verify that the Sprint satisfies the Product Bible, Experience and Visual Specifications.

---

## 7.

Commit the completed Sprint.

---

## 8.

Push the completed Sprint.

---

## 9.

Immediately continue with the next Sprint.

No user confirmation is required.

---

# Sprint Plan

## Sprint 0

Foundation

Status:

Completed

---

## Sprint 1

Application Framework

Status:

Completed

Goals:

- application shell
- routing
- window runtime
- workspace runtime
- basic navigation
- theme loading
- startup flow

---

## Sprint 2

Cosmos

Status:

Completed

Goals:

- Cosmos Map
- camera
- navigation bar
- projects
- nodes
- connections
- companion
- ship

---

## Sprint 3

Base

Status:

Completed

Goals:

- Base
- Main Room
- Rooms
- Workspace furniture
- cockpit
- room transitions

---

## Sprint 4

Workspace System

Status:

Completed

Goals:

- fixed Workspace Environment Window
- Tool runtime
- multi-window workflow
- workspace persistence

---

## Sprint 5

Core Tools

Status:

Completed

Goals:

- Files with create, edit, rename, move and delete operations scoped to the active Cosmos Project
- Archive with direct inline editing in the same Object View
- Capture
- Review
- Journeyman as an independent Tool Window inside a Workspace

Version 1 boundaries:

- Journeyman and the Companion remain separate Runtime Objects and presentation concepts.
- Files never accesses arbitrary user files outside the active Project.
- Workspace Environment Windows remain fixed; every core Tool uses a movable, resizable and closable Tool Window with no minimize, maximize, docking or snapping.

---

## Sprint 6

Object Interaction

Status:

Completed

Goals:

- object windows
- context menus
- dialogs
- notifications
- drag & drop
- selection
- editing

---

## Sprint 7

Integration

Status:

Completed

Goals:

- connect all systems
- polish interactions
- fix inconsistencies
- improve performance
- remove temporary code

---

## Sprint 8

Release Candidate

Status:

Completed

Goals:

- full verification
- bug fixing
- UI consistency
- final testing
- production readiness

---

# Commit Policy

Every completed Sprint must produce:

- one clean commit
- one successful push

The repository must remain usable after every Sprint.

---

# Stop Conditions

Codex must only stop when:

- documentation contains contradictions
- required documentation is missing
- user approval is required
- credentials are required
- external dependencies cannot be resolved
- continuation would risk damaging user work

Implementation difficulty is **not** a valid stop condition.

---

# Completion

Cosmos Version 1 is complete when:

- every Sprint has been completed
- every verification passes
- the application builds successfully
- the frontend is usable
- the backend is operational
- the implementation matches the Product Bible, Experience and Visual Specifications

Only then should the implementation be considered complete.
