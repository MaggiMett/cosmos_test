# Runtime Services

## Purpose

Runtime Services provide the business capabilities of Cosmos.

They are the only supported way for Runtime components to create, modify, query or remove domain data.

The Runtime owns all business logic.

Extensions never manipulate the Core directly.

---

# Philosophy

Every Runtime action should happen through a Service.

Tools request work.

Services perform work.

This guarantees that all Runtime behavior follows one consistent implementation.

---

# Responsibilities

Runtime Services are responsible for:

- executing business logic
- validating requests
- enforcing permissions
- maintaining consistency
- updating Runtime state
- publishing Events
- coordinating Registries
- accessing Persistence

Runtime Services never contain user interface code.

---

# Service Architecture

Every Runtime capability is exposed through a Service.

Examples include:

- Project Service
- Workspace Service
- Tool Service
- Object Service
- Knowledge Service
- Resource Service
- Relationship Service
- Tag Service
- Theme Service
- Job Service
- Review Service

Services define Runtime behavior.

Extensions consume Services.

Runtime Services own business behavior for durable Entity identity and configuration.

Review Service owns business behavior for Review Items and decisions.

Entity Runtime owns active Entity lifecycle and State, while Review remains a User Tool presentation.

Neither Runtime component replaces the Runtime Service boundary.

---

# Universal Object Mutations

Object Service is the authoritative business boundary for durable Object identity, System Tag, Property Schema and Property changes.

For every Object mutation it validates:

- immutable Object identity
- permitted System Tag composition
- all Property Schemas activated by that composition
- presence and validity of every required Property
- ownership and lifetime rules
- Prepared Structure changes when applicable

Tag Service owns User Tag mutations and preserves user ownership. Collections and grouping views query Objects through User Tags; they do not create a separate collection record type.

Project Service creates `Project` and `Project + System` Objects through the same Object contract and coordinates durable Prepared Structure records with physical creation. A Project is not reported as created until both the authoritative commit and required physical structures exist.

Resource Service is the authoritative boundary for project-file Commands used by Files. Before delegating physical I/O it validates the active Project Context, permission, registered physical root, canonical resolved path and operation constraints. Create, edit, rename, move, delete and upload Commands can target only authorized roots of the active Project. Repository Runtime supplies availability and change signals but never performs these mutations.

---

# Single Source of Truth

Business logic exists only once.

Examples:

Creating Knowledge

↓

Knowledge Service

Opening Workspace

↓

Workspace Service

Importing Resources

↓

Resource Service

Managing active Project files

â†“

Resource Service

No Extension should implement duplicate business logic.

---

# Commands

Services receive Commands.

Commands request that something should happen.

Examples include:

- Create Knowledge
- Open Workspace
- Rename Object
- Import Resource
- Create Relationship

Commands modify the Runtime.

Every state-changing action follows one pipeline:

```text
Client or Tool
    ↓
Command
    ↓
Runtime Service
    ↓
Authoritative Permission Validation
    ↓
Business Validation
    ↓
Transaction and Persistence
    ↓
Event Publication
    ↓
Optional Subscriber Reaction
    ↓
Optional Command or Request to a Runtime Service
    ↓
Optional Long-Running Job Creation by that Service
```

---

# Blueprint Definition Mutations

Cosmos uses three canonical Blueprint definition categories with existing Service owners:

- Object Blueprint — Object Service
- Capture Template — Knowledge Service
- Workspace Blueprint — Workspace Service

Creation and updates follow the canonical action pipeline:

```text
User Tool
    ↓
Command
    ↓
Owning Runtime Service
    ↓
Authoritative Permission Validation
    ↓
Business and Category-Schema Validation
    ↓
Transaction and Persistence
    ↓
Category Registry Update
    ↓
Completed-Fact Event Publication
```

The owning Service assigns or verifies the immutable definition ID, explicit version and declared scope. Updates create a new definition version; existing consumers retain their referenced version until an explicit migration or selection. Installed Extension-provided definitions must already have passed shared Extension Validation. User-created definitions are validated against the same category schema by the owning Service before persistence and Registry update.

User Tools never persist or register Blueprint definitions directly. Registries expose validated definitions but never become mutation or business-logic owners.

Structure Template creation uses the normal Object Service pipeline. Each included Node becomes an independent `Template + Structure` Object with complete Properties and explicit parent-child template references. No Blueprint Registry mutation or grouped-template record is created.

---

# Queries

Services expose Queries.

Queries request information without modifying the Runtime.

Examples include:

- Find Objects
- Search Knowledge
- List Workspaces
- Resolve Theme
- Get Object History

Queries never change Runtime state.

---

# Events

After successful execution Services publish Events.

Examples include:

Knowledge Created

↓

KnowledgeCreated Event

Workspace Opened

↓

WorkspaceOpened Event

Services produce Events.

They do not consume them directly.

Events describe completed facts and never request work or create Jobs. Subscribers may react by sending a new Command or request to the appropriate Runtime Service.

---

# Validation

Every request is validated before execution. The Runtime Service first performs the authoritative permission decision and then performs business validation.

Validation may include:

- permissions
- object existence
- dependency checks
- schema validation
- context validation
- business rules

Invalid requests never modify the Runtime.

UI, Entity Runtime and Bundle Runtime may perform non-authoritative preflight checks for early feedback. A successful preflight never authorizes execution and never replaces Service validation.

---

# Context

Every Service receives a Runtime Context.

Context is never discovered inside the Service.

The Runtime resolves Context before execution.

This ordinary Runtime Context injection remains the default for synchronous Tool and Service actions.

Long-running operations receive an immutable Context Snapshot. When a consumer requires a task-specific Context Package, it requests one from Context Builder rather than assembling Context inside the Service or consumer.

This keeps Services deterministic.

---

# Transactions

A Service operation should succeed completely or fail completely.

Partial updates should never leave Cosmos in an inconsistent state.

Whenever multiple Runtime components change together, they belong to one transaction.

---

# Permissions

Services enforce permissions.

Runtime Services are the only authoritative permission enforcement boundary.

Extensions never bypass the permission system.

Examples include:

- read Knowledge
- modify Resources
- create Objects
- execute AI Providers

Permission checks occur inside the Service layer.

---

# Jobs

Runtime Services create Jobs only for delegated long-running work. Ordinary state changes complete synchronously inside the Service transaction.

Neither Events nor subscribers create Jobs directly. A subscriber may request a Runtime Service, and that Service performs authoritative validation before optionally creating a Job.

After Event publication, the originating Service may also create a required long-running Job directly from the validated Command, as Knowledge Service does for Capture processing. The Event is never the cause or request.

---

# Runtime Independence

Services are independent from:

- UI
- Themes
- Workspaces
- Companion
- MCP
- Extensions

Every client uses exactly the same Services.

---

# Service Consumers

Runtime Services may be used by:

- User Tools
- System Tools
- Entities
- Capability Bundles
- Companion
- Journeyman
- MCP
- REST API
- Future Extensions

All consumers receive identical Runtime behavior.

---

# Error Handling

Services return structured Runtime errors.

Examples include:

- Object Not Found
- Permission Denied
- Invalid Context
- Dependency Missing
- Validation Failed

Errors should always explain what happened and how the user can resolve the problem.

---

# Extensibility

New Runtime capabilities should be introduced by adding new Services rather than modifying existing ones whenever possible.

Services should remain small, focused and reusable.

---

# Design Goal

Every important action inside Cosmos should pass through exactly one Runtime Service.

This creates one consistent implementation for every capability regardless of whether it is triggered by the UI, Companion, Journeyman or an external Extension.

---

# Principles

- Services own business logic.
- Commands modify.
- Queries read.
- Events notify.
- Services validate.
- Services enforce permissions.
- Services use Context.
- Business logic exists only once.
- Every Runtime client uses the same Services.
- Extensions never bypass the Runtime.
