# Journeyman Extensibility

**Version:** 1.0
**Status:** Foundation
**Category:** Experience

---

# Purpose

This document defines how the Journeyman helps the user extend Cosmos from inside Cosmos.

The Journeyman is an independent Cosmos Tool and the primary development interface for Version 1.

Its purpose is to let the user plan, build and modify Cosmos without leaving the environment or relying on a separate external chat application.

---

# Design Philosophy

Cosmos should be extendable from within itself.

The user describes what should be created or changed.

The Journeyman receives the relevant Project context, documentation and files, then coordinates the work through an available development provider.

Version 1 uses Codex as the first provider.

The Journeyman Tool must remain provider-neutral so additional providers may be introduced later without changing the interaction model.

---

# Version 1 Goal

Version 1 should allow the user to continue developing Cosmos directly through the Journeyman.

The intended workflow is:

User request

↓

Project and Tag context

↓

Relevant documentation and files

↓

Selected Provider execution planning (Codex in Version 1)

↓

Implementation

↓

Progress and questions

↓

Result inside Cosmos

The user should not need to move the task into ChatGPT Desktop or another external interface.

---

# Journeyman in a System Project

The Journeyman belongs to the Version 1 Creation Workspace System Project. This does not create an additional System Project category or a separate Journeyman Project model.

Example System Tags:

```text
Project
System
Workspace
Developer
```

The Project contains the Workspaces, Tools, Knowledge, Templates and Files required for development work.

The Journeyman does not introduce a separate project model.

It uses the same Project architecture as every other Cosmos capability.

# Journeyman Tool Window

Journeyman runs in its own movable, resizable and closable Tool Window inside a Workspace. The Workspace supplies the working environment; Journeyman supplies planning, orchestration and development assistance.

The Journeyman Tool Window may present:

- conversation
- task overview
- plan steps
- execution events
- questions and errors
- changed-file and diff summaries
- validation results
- implementation status

Full file browsing, Archive navigation and other independent capabilities remain separate Tool Windows that may be arranged beside Journeyman in the same Workspace.

The containing Workspace remembers the Journeyman Tool Window's placement and state and restores it when reopened. Closing the Window does not delete a persistent task.

# Context Inheritance

The Journeyman inherits the current Cosmos context.

When the user works inside a Project, the active Project Tags, Files, Knowledge and documentation become available to the Journeyman.

The user should not need to repeatedly explain which Project is being modified.

Context follows the existing Cosmos mechanics:

Position

↓

Focus

↓

Active Tags

↓

Project Context

↓

Journeyman

The Journeyman must not introduce a separate project-selection mechanism when the existing Focus system already provides the required context.

# Quick Travel and Project Work

Opening a project-bound development Workspace moves the Cosmos camera to the corresponding Project.

The Project position activates the correct Tags automatically.

The Journeyman then works inside the same context as every other Tool.

Switching to another Project uses the same Quick Travel and Focus mechanics.

No special Journeyman project-switch state exists.

# Documentation Access

The Journeyman should receive the relevant documentation required for the current task.

Examples include:

- Product Bible
- Experience documents
- Project specifications
- Templates
- architecture reviews
- implementation notes
- existing source files

Documentation should be selected from the current Project and active Tags wherever possible.

The user should not need to manually paste the same foundational information into every task.

# Codex Provider

Codex is the first development provider used by the Journeyman in Version 1.

Codex may:

- inspect the repository
- plan its execution
- create and modify files
- run tests
- report progress
- ask focused questions
- continue paused tasks
- return implementation results

Codex plans its own execution.

The user and Cosmos define the intended result, constraints and accepted architecture.

Codex must not redesign established Product Bible or Experience concepts unless the user explicitly requests an architectural revision.

# Provider Neutrality

The Journeyman is not identical to Codex.

The Journeyman is the independent Cosmos Tool and development-task orchestration layer.

Codex is one provider behind it.

Future providers may include:

- local models
- Ollama-based systems
- Claude
- specialized coding agents
- additional remote providers

Changing the provider must not change:

the Journeyman Tool Window
task interaction
Project context
event presentation
review flow
result storage
# Task Creation

The user creates a development task by describing the desired outcome.

The task should automatically include:

current Project
active Tags
relevant Files
relevant documentation
current Workspace context
user constraints

The user may add or remove context before execution when necessary.

# Execution Visibility

Development work should remain observable.

The Journeyman should communicate:

current status
completed steps
active operation
questions requiring input
errors
test results
final outcome

The user should never need to guess whether the provider is working, waiting or blocked.

# Questions and Interruptions

The Journeyman should avoid unnecessary interruption.

When work can continue safely, it should continue.

When a decision is required, the Journeyman surfaces a clear question or requests a Review Item through the Product Bible's Review Service contract.

Non-critical requests for attention use Companion Notifications.

Critical failures may surface immediately through the Shell.

# Reviews

Changes that require user approval should become reviewable inside Cosmos.

Possible review material includes:

implementation summary
changed files
diffs
test results
unresolved decisions
follow-up recommendations

The user should be able to understand what changed without leaving the Journeyman Tool Window.

# Physical Results

Journeyman output must create real Project changes.

Results may include:

source files
documentation
Tests
Templates
Theme Components
new Tools
configuration changes

The final result must not exist only as conversation text.

Cosmos should reflect the completed work through its physical Project structure.

No Ghost Results are permitted.

# Prepared Structures

The Journeyman uses existing Prepared Structures and Extension Points.

It should place new work into the physical locations already created by Cosmos.

The provider must not invent unrelated folder structures when a prepared location already exists.

If a required Extension Point does not yet exist, the task should extend the existing architecture deliberately and visibly.

# User Control

The Journeyman assists and executes.

The user defines direction.

The user may:

start a task
pause it
continue it
cancel it
answer questions
review results
reject changes
request revisions

Autonomy should reduce repetitive work without removing user ownership.

# Persistence

Journeyman tasks persist independently of the conversation window.

Closing the Workspace or Base must not erase task state.

Returning later should restore:

active tasks
event history
pending questions
review state
relevant Project context

The user should be able to continue exactly where the work stopped.

# Companion Boundary

The Companion and Journeyman are independent concepts. Journeyman is a Tool; the Companion is a Cosmos Entity with its own visual representation, identity and future progression. The Companion is not Journeyman and never acts as its avatar.

Through normal Companion Notifications, the Companion may indicate:

pending questions
completed tasks
failed tasks
available reviews

Version 1 uses the existing subtle notification indicator.

Selecting such a notification opens or focuses the independent Journeyman Tool Window. Journeyman remains fully usable without presenting itself through the Companion.

# Extending Cosmos

The Journeyman may be used to extend Cosmos itself.

Examples include:

creating a new Tool
adding a Workspace capability
implementing a new Theme component
creating a Creator workflow
extending the Shell
adding a new Entity type
improving an existing system

Work that extends Cosmos should occur inside the appropriate System Project and use the same universal structures as every other development task.

# Experience Goals

Journeyman Extensibility should feel:

integrated
capable
transparent
contextual
persistent
user-controlled

The user should feel that Cosmos can help build its own future from within the environment.

# Design Principles

Cosmos should be extendable from within Cosmos.

The Journeyman is an independent Tool.

The Companion is an independent Entity.

Codex is a provider.

Context is inherited.

Execution remains visible.

Results exist physically.

Autonomy supports the user.

The established architecture remains the contract.

# Scope

This document defines the Version 1 Journeyman experience for extending Cosmos.

Provider implementation, Runtime architecture and detailed developer APIs are defined in the Product Bible and technical documentation.
