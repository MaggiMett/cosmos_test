# Journeyman

## Purpose

Journeyman is the independent provider-neutral Cosmos Tool for planning, orchestrating, reviewing and completing development work from inside Cosmos.

The registered Journeyman System Tool supplies the orchestration contract behind that experience. Journeyman is not identical to an AI model, coding agent or concrete Provider.

Version 1 uses Codex as the first development Provider. Replacing Codex must not change the Journeyman Tool Window, task lifecycle, Context model, event presentation, review flow or result storage.

---

# Architectural Position

Journeyman is a registered System Tool Extension hosted by the Version 1 Creation Workspace System Project. Each active Journeyman instance is presented through its own movable, resizable and closable Tool Window inside a Workspace.

Journeyman is not a Workspace, Companion, Entity or visual avatar. The Companion remains an independent Cosmos Entity. Companion Notifications may point to Journeyman task state, but the Companion never represents or contains Journeyman.

It uses the same Project, Workspace, Tool, Window, Context, Job, Review, Permission, Provider and Runtime Service contracts as every other capability. It introduces no special Project class, provider path, persistence system or task state outside those contracts.

The Journeyman Tool owns task interaction, planning and orchestration. Provider Runtime independently owns concrete Provider discovery, matching, selection, invocation, monitoring and failover. The selected Provider performs provider-specific execution through its adapter.

---

# Responsibilities

Journeyman is responsible for:

- receiving the desired outcome and user constraints
- inheriting the active additive Runtime Context
- presenting and allowing adjustment of task Context before execution
- creating a transparent execution plan
- requesting an authorized development Provider through Provider Runtime
- exposing progress, questions, errors and results
- coordinating validation and Review
- integrating approved physical results through existing Runtime contracts
- preserving task state independently of the Journeyman Tool Window

Journeyman never owns Project Knowledge, concrete Provider policy or Runtime business logic.

Repository Analyzer owns triggered read-only repository analysis. Runtime Services own durable Cosmos mutations. Provider Runtime owns Provider execution. Journeyman coordinates these owners into one user experience.

---

# Context

Journeyman receives the Job's immutable Context Snapshot and requests a task-specific Context Package from Context Builder.

The Package may include:

- zero, one or multiple assigned Project scopes
- optional focused or primary Project
- active Workspace session when applicable
- relevant Objects and System Tags
- Knowledge and documentation
- explicitly categorized Blueprints and Templates
- Resource and repository references
- previous Reviews
- authorized Runtime configuration

Journeyman does not introduce a separate Project selector. Project scope and focus use the normal Cosmos Context mechanics.

Context Builder remains the sole assembler of the authorized Context Package. Later navigation does not mutate the Snapshot of a running task.

---

# Task Lifecycle

Every long-running Journeyman task is a Runtime Job created by the Runtime Service that accepts the user's task Command.

```text
Requested
↓
Context Snapshot
↓
Planning
↓
Provider Selection
↓
Execution
↓
Validation
↓
Review
↓
Completed or Failed
```

Journeyman never creates or schedules Jobs directly. It requests work through the appropriate Runtime Service and presents Job state from Job Runtime.

Closing the Journeyman Tool Window or its containing Workspace never deletes the Job, event history, pending questions, Context reference or Review state.

---

# Planning

Journeyman presents a plan before provider execution.

The plan defines:

- objective
- authorized Context
- expected physical outputs
- required capabilities
- validation strategy
- approval boundaries

The Provider may refine its own execution plan within these constraints. It may not silently redesign Product Bible or Experience contracts.

---

# Provider Sequence

Journeyman supplies abstract development requirements, preferences and constraints to Provider Runtime.

Provider Runtime then:

1. selects a compatible concrete Provider;
2. supplies its selected Provider Profile and authorized Context Package to Prompt Builder;
3. receives the compiled Provider Request;
4. invokes and monitors the Provider through its adapter;
5. performs failover when allowed;
6. returns a standardized Runtime Result.

Journeyman never selects or invokes Codex directly. Codex is one Version 1 Provider implementation behind the stable Provider Runtime interface.

The Provider architecture remains usable by other consumers and does not depend on Journeyman experience state.

---

# Physical Execution and Results

Development results must exist physically. Conversation text alone is not completion.

Authorized results may include:

- source files
- documentation
- tests
- configuration
- Theme Components
- Templates
- Tools
- Resource mapping candidates

The Provider adapter performs authorized provider-specific repository operations. Durable Cosmos data, Project metadata, Resource mappings, Object changes and Review Items still pass through their owning Runtime Services.

Journeyman uses existing Prepared Structures and Extension Points. It does not invent parallel folders when an applicable physical prepared location already exists.

No Ghost Results are valid. A task reaches `Completed` only after required physical outputs exist and validation succeeds.

---

# Runtime Translation

Runtime Translation is the Journeyman orchestration capability that connects accepted user structure to implementation work during an approved affected task.

It is not a separate System Tool or Provider category. Repository Analyzer supplies read-only analysis, the selected development Provider performs authorized implementation, and Runtime Services commit Cosmos-owned mutations.

Runtime Translation never runs continuously.

---

# Visibility and Questions

The Journeyman Tool Window presents:

- current state
- completed and active plan steps
- provider activity at an appropriate abstraction level
- pending questions
- errors
- validation and test results
- changed files and Objects
- final outcome

When work can continue safely, it continues. A material user decision becomes a focused question or Review Item through Review Service. Non-critical attention uses Companion Notifications.

---

# Validation and Review

Validation may include:

- tests
- static analysis
- repository consistency
- Extension Validation
- architecture checks
- confirmation that physical outputs exist

Journeyman submits a structured Review candidate to Review Service. Review Service alone creates and owns the Review Item, decision history and state transitions.

Invalid or incomplete work never becomes completed automatically.

---

# User Control

Users may start, pause, continue, cancel, review, reject or revise a Journeyman task through existing Job and Review contracts.

Destructive operations, permission expansion, architecture changes and other material scope changes require explicit approval.

Autonomy reduces repetitive work without removing user ownership.

---

# AI and Provider Independence

Without an available development Provider, Journeyman may still restore tasks, present Context, run deterministic orchestration already supported by Runtime Services and prepare Reviews. Provider-dependent execution remains unavailable and is reported clearly.

Future Providers may be local or remote. All use the same Provider Runtime contract and do not change the Journeyman Tool architecture.

---

# Failure Handling

If execution fails:

- the Job reports failure
- partial work remains isolated or recoverable
- existing Cosmos state remains valid
- the error and affected outputs are visible
- retry or revision remains possible
- Review records any user decision required

Failure never silently publishes partial work as a completed result.

---

# Principles

- Journeyman is an independent Tool and the development-task interaction and orchestration layer.
- Journeyman runs in its own Tool Window inside a Workspace and is never the Companion.
- Codex is one Version 1 development Provider.
- Provider Runtime remains independent and authoritative for Provider execution.
- Context uses the normal additive Snapshot and Package contracts.
- Runtime Services create Jobs and own durable mutations.
- Results must exist physically.
- Prepared Structures and Extension Points are reused.
- Validation precedes completion.
- Review Service owns Review Items.
- Users remain in control.
