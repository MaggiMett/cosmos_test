# Registry System

## Purpose

The Registry System defines how Cosmos discovers, identifies and exposes available Runtime components.

Registries provide one authoritative source for everything that can be loaded or used by the Runtime.

They answer one question:

What is available?

---

# Philosophy

Cosmos should never depend on hardcoded lists of Tools, Themes, Providers or Blueprint definitions.

Every extensible component registers itself through a Registry.

The Core knows contracts.

Registries know implementations.

This allows new capabilities to be added without changing Core logic.

---

# Responsibilities

The Registry System is responsible for:

- registering Runtime components
- validating component identity
- resolving components by ID
- exposing component metadata
- preventing duplicate registrations
- tracking availability
- supporting activation and deactivation
- preserving stable references

Registries do not execute component behavior.

They only manage component definitions.

---

# Registry Categories

Cosmos uses specialized Registries built on one shared Registry contract.

Initial Registries include:

- Extension Registry
- User Tool Registry
- System Tool Registry
- Theme Registry
- Skin Registry
- Workspace Blueprint Registry
- Object Blueprint Registry
- Capture Template Registry
- Bundle Registry
- Provider Registry
- Integration Registry

Future Registry categories may be added without changing the general Registry model.

---

# Taxonomy Boundaries

The System Tool Registry contains task-oriented System Tool definitions such as Knowledge Processor, Analysis Engine, Repository Analyzer, Context Builder, Prompt Builder and Journeyman.

Provider Runtime, Theme Runtime, Event Dispatcher and Job Scheduler are Core Runtime infrastructure and are never registered as System Tools.

Provider definitions register through the Provider Registry.

Entity definitions register through the shared Registry System as components declared by their source Extension and are instantiated by the Entity Runtime.

Bundle Registry is the Capability Bundle category view of this shared Registry System. It adds Bundle-specific metadata such as compatible Entity Roles but does not define separate identity, status, discovery, validation or persistence behavior.

Registries manage definitions only.

Active Entity State remains owned by the Entity Runtime.

Normal Objects are discovered through Object Service, System Tags and User Tag queries rather than registered as component definitions. This includes Structure Template Objects and System Project Objects. No Structure Template Registry, collection Registry or System Project Registry exists in Version 1.

---

# Blueprint Taxonomy and Ownership

The canonical Blueprint definition categories are:

- Object Blueprint
- Capture Template
- Workspace Blueprint

These definitions are user-addressable Objects with stable Object identity and category System Tags. The category Registry indexes their validated definition payload and version; it does not create a second identity.

Structure Templates remain outside this taxonomy. They capture reusable parent-child Node structure, while Object Blueprints define one Object's System Tags, Property Schema and complete defaults.

Each category uses its category-specific Registry built on the shared Registry contract. The Registry manages definition identity, metadata, version, availability and resolution; it never owns Tool drafts, instantiated Objects, Capture content, Workspace definitions or active Workspace sessions.

Object Blueprint mutations are owned by Object Service, Capture Template mutations by Knowledge Service and Workspace Blueprint mutations by Workspace Service. After validation and persistence, the owning Service updates the applicable category Registry before publishing the completed-fact Event.

---

# Registry Entry

Every registered component is represented by a Registry Entry.

A Registry Entry contains:

- immutable component ID
- display name
- component category
- version
- Runtime API version
- source Extension
- current status
- capabilities
- dependencies
- permissions
- configuration schema
- entry point
- metadata

Registry Entries describe components.

They do not contain active component state.

---

# Identity

Every registered component requires one globally unique and immutable ID.

Example:

```text
cosmos.user-tool.capture
cosmos.system-tool.knowledge-processor
cosmos.theme.galaxy
cosmos.provider.codex
```
Display names may change.

Component IDs never change.

References always use component IDs rather than display names.

Namespaces

Component IDs use namespaces.

Namespaces prevent collisions between bundled, user-created and third-party Extensions.

Recommended format:

<owner>.<category>.<component>

Examples:

cosmos.user-tool.archive
cosmos.theme.galaxy
max.workspace-blueprint.mettventures
community.user-tool.voxel-editor

Cosmos reserves the cosmos namespace for bundled components.

Registration

Registration occurs only after successful Extension validation.

The general lifecycle is:

Extension Discovery

↓

Manifest Validation

↓

Dependency Resolution

↓

Component Registration

↓

Runtime Availability

A component that fails validation is never added to an active Registry.

Duplicate Registration

Duplicate component IDs are not permitted.

If two components attempt to register the same ID:

the bundled Core is never silently replaced
the later component is rejected
the conflict is logged
the user receives a clear explanation

Overrides must use an explicit override mechanism.

They must never happen accidentally.

Overrides

Cosmos supports controlled visual and configuration overrides.

Examples include:

replacing a Skin
overriding a Theme component
changing a Workspace Blueprint default
replacing a Provider configuration

Overrides do not change the identity of the original component.

They create a new configuration layer that references the original Registry Entry.

Functional components are not replaced silently.

Registry Status

A Registry Entry may have one of the following states:

Discovered
Validated
Registered
Active
Disabled
Incompatible
Missing Dependency
Failed

Only Active entries may be instantiated or executed.

Activation

Registration and activation are separate.

A component may be registered but disabled.

This allows users to:

install Extensions
inspect metadata
review permissions
activate later
disable without uninstalling

Activation is controlled by the Runtime.

Resolution

Runtime components are resolved by immutable ID.

Example:

Workspace requests:

cosmos.user-tool.capture

The Tool Registry resolves the current compatible definition.

Consumers never import Extension internals directly.

They request components through Runtime Services.

Dependencies

Registry Entries may declare dependencies.

Dependencies reference immutable component IDs and compatible version ranges.

Example:

cosmos.user-tool.blueprint-builder

requires:

cosmos.system-tool.journeyman >= 1.0

required capability:

runtime_translation

Runtime Translation resolves through the existing Journeyman System Tool identity. No separate Runtime Translation Registry Entry exists.

The Registry System validates dependencies before activation.

Circular dependencies are rejected.

Capabilities

Registry Entries declare capabilities.

Examples include:

creates Knowledge
edits image Resources
supports Object Blueprints
provides AI completion
renders Node Skins
analyzes repositories

Capabilities allow the Runtime to discover suitable components without knowing their implementation.

Queries

Registries support read-only discovery queries.

Examples include:

list all User Tools
find Tools supporting image Resources
find Themes containing Companion Skins
find Providers supporting code generation
find Object Blueprints, Capture Templates or Workspace Blueprints compatible with the active Project scopes

Registry queries never execute components.

Runtime State

Registries store component definitions.

They do not store active Tool Instance state, Workspace layouts or running Jobs.

Runtime state belongs to the corresponding Runtime systems.

This separation keeps Registries predictable and lightweight.

Persistence

Registry metadata may be cached for startup performance.

For installed Extensions, the authoritative definition remains the Extension Manifest and validated component declaration.

For user-created Object Blueprints, Capture Templates and Workspace Blueprints, the authoritative definition is the versioned SQLite persistent record owned by the appropriate Runtime Service. The category Registry exposes a rebuildable index of that validated record. A Project `.cosmos/` manifest may contain a portable projection of a Project-owned definition, but it is never a competing authoritative Registry source.

Cached Registry state may always be rebuilt.

User activation choices and configuration overrides are persistent data.

Failure Handling

One invalid component must never prevent Cosmos from starting.

If registration fails:

the affected component is isolated
the failure is recorded
dependent components are marked unavailable
unrelated components continue loading
the user receives actionable information
Extensibility

Every future extensible component category should use the shared Registry contract.

New Registries may introduce category-specific metadata while preserving:

stable identity
validation
status
activation
dependency resolution
capability discovery
Design Goal

The Registry System should make Cosmos feel infinitely expandable without making the Core aware of every possible capability.

The Runtime should always know what exists, what is compatible and what may safely be used.

Principles
Every extensible component is registered.
Registries manage definitions, not execution.
IDs are immutable.
Display names are editable.
Registration follows validation.
Activation is explicit.
Duplicate IDs are rejected.
Components are resolved through the Runtime.
One failed component never breaks Cosmos.
Every Registry follows one shared contract.
