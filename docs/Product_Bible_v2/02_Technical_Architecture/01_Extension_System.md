# Extension System

## Purpose

The Extension System defines how Cosmos grows.

Instead of continuously expanding the Core, new functionality is introduced through Extensions.

This allows Cosmos to remain small, stable and extensible for many years.

---

# Philosophy

The Core defines contracts.

Extensions provide capabilities.

New capability should first reuse the universal Object Model through System Tags, composed Property Schemas, complete Properties, Prepared Structures and Extension Points. An Extension category is required only when executable or distributable capability remains after those universal mechanisms are applied.

The Core should never contain project-specific features.

Instead, every new capability should become an Extension whenever possible.

This separation allows Cosmos to evolve without increasing architectural complexity.

---

# Extension Categories

Cosmos currently defines the following Extension categories.

## User Tools

Interactive capabilities used directly by the user.

Examples include:

- Capture
- Archive
- Review
- Blueprint Builder
- Texture Editor

---

## System Tools

Background capabilities used by Cosmos.

Examples include:

- Knowledge Processor
- Analysis Engine
- Repository Analyzer
- Context Builder
- Journeyman

Runtime Translation is a declared Journeyman capability used for approved affected tasks. It is not a separate System Tool Extension.

---

## Entities

Registered Runtime presences with identity, Scope, Role, Avatar and Behaviour configuration.

Entity definitions participate in the shared Extension lifecycle and Registry System.

The Entity Runtime manages active Entity instances after registration.

---

## Capability Bundles

Reusable capabilities assigned only to Runtime Entities and validated against Entity Roles.

Capability Bundle definitions follow the shared Extension lifecycle. Bundle Runtime manages active Entity-owned Bundle Instances only after their definitions have been validated and registered.

---

## Themes

Appearance definitions and reusable visual components represented as Objects.

Examples include:

- Galaxy
- Fantasy
- Modern
- Cyber

---

## Workspace Blueprints

Preconfigured Workspace definitions.

Examples include:

- Knowledge
- Development
- Art

Users may freely customize the resulting Workspaces.

---

## Object Blueprints

Reusable definitions for Object System Tag combinations, composed Property Schemas and complete default Properties.

Examples include:

- Minecraft Item
- Character
- API Endpoint

---

## Capture Templates

Reusable definitions for structured Capture input.

Examples include:

- Meeting Notes

---

## Structure Templates Are Objects

Structure Templates are independent `Template + Structure` Objects managed through Object Service and normal Object persistence. They capture Node names, relevant System Tags, complete default Properties and parent-child template references only.

They contain no Project content, Theme customization, assets or external connections. Tag-based queries produce Template collections.

Structure Template is not an Extension category, Blueprint category or Registry category.

---

## System Projects Are Projects

System Projects are normal `Project + System` Objects. They are not Extension packages or a separate Project category. Their Tools and other executable components still follow the applicable Extension contracts.

---

## Providers

External intelligent services.

Examples include:

- Companion Models
- Journeyman Models
- Embedding Providers
- Speech Providers
- Image Providers

---

## Integrations

Connections to external software.

Examples include:

- Git
- GitHub
- Blender
- Blockbench
- VS Code

---

# Core Runtime Infrastructure

Core Runtime infrastructure is not an Extension category and is never registered as a Tool.

This includes:

- Runtime Services
- Registry System
- Persistence
- Permission System
- Entity Runtime
- Provider Runtime
- Theme Runtime
- Event Dispatcher
- Job Scheduler

Extensions consume these contracts.

They never provide a parallel implementation of them.

---

# Language Contract

Version 1 uses one supported implementation stack for all native Cosmos Extensions.

- Backend and System Tool logic use Python.
- User Tool interfaces use Vue with TypeScript.
- Shared contracts are defined by the Cosmos Runtime API and schemas.

An Extension may integrate external programs through an Integration, but native Extension code must follow the supported Cosmos stack.

This keeps validation, tooling, documentation and maintenance consistent.

# Extension Structure

Every Extension follows the same structure.

Example:

```text
extension/

manifest.json

README.md

src/

assets/

tests/

schemas/

localization/
```

The exact internal implementation depends on the Extension category.

The Runtime only depends on the manifest contract.

---

# Installable Package

An installable Extension is a self-contained directory package comparable to a mod.

It contains its Manifest, source, assets, schemas, migrations, tests and localization in a predictable structure.

Extensions are installed into category-specific Extension directories and are never copied into the Core.

# Manifest

Every Extension provides a Manifest.

The Manifest describes:

- unique ID
- display name
- version
- category
- API version
- dependencies
- permissions
- capabilities

The Runtime never loads an Extension without a valid Manifest.

---

# Registration

Extensions never modify the Runtime directly.

Instead they register themselves through the appropriate Registry.

Examples include:

- Tool Registry
- Theme Registry
- Provider Registry
- Bundle Registry
- Object Blueprint Registry
- Capture Template Registry
- Workspace Blueprint Registry

The Core discovers Extensions automatically during startup.

---

# Lifecycle

Every Extension follows the same lifecycle.

```text
Discovery

↓

Validation

↓

Registration

↓

Initialization

↓

Runtime

↓

Shutdown
```

Each phase is controlled by the Runtime.

Category-specific Runtime behavior begins only after this lifecycle has validated and registered the Extension definition. Bundle Runtime does not replace discovery, Extension Validation or registration; it manages the lifecycle of active Entity-owned Bundle Instances.

---

# Dependencies

Extensions may depend on other Extensions.

The Runtime validates all dependencies before activation.

Circular dependencies are not permitted.

Missing dependencies prevent activation.

---

# Versioning

Every Extension declares:

- Extension Version
- Runtime API Version
- Compatibility Range

The Runtime refuses incompatible Extensions.

Existing Projects remain protected.

---

# Isolation

Extensions remain isolated from one another.

Communication occurs through Runtime services.

Extensions never directly access internal Runtime objects belonging to another Extension.

This prevents hidden dependencies.

---

# Security

Every Extension declares its required permissions.

Examples include:

- read Knowledge
- modify Resources
- access AI Providers
- network access
- Workspace modification

The Runtime grants only explicitly declared permissions.

---

# Validation

Before activation every Extension is validated.

Validation includes:

- Manifest validation
- API compatibility
- dependency validation
- schema validation
- security validation
- automated tests

Category-specific checks, including Capability Bundle contract checks, execute inside this shared validation pipeline. Every code-bearing Capability Bundle must provide and pass isolated automated tests.

Only validated Extensions become active.

---

# Runtime

The Runtime owns every Extension.

Extensions never control the Runtime.

The Runtime controls:

- loading
- unloading
- updates
- lifecycle
- permissions
- communication

---

# Future Growth

Future versions may introduce new Extension categories.

The Extension System should support unlimited growth without requiring architectural changes to the Core.

---

# Design Goal

Every new capability should become an Extension instead of increasing Core complexity.

The Extension System should allow Cosmos to grow for many years while keeping the Core stable, predictable and understandable.

---

# Principles

- The Core defines contracts.
- Extensions provide capabilities.
- Every Extension follows one lifecycle.
- Every Extension provides a Manifest.
- Registration is mandatory.
- Validation happens before activation.
- Communication happens through the Runtime.
- The Core remains small.
