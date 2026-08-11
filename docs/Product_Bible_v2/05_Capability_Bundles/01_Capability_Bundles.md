# Capability Bundles

## Purpose

Capability Bundles provide reusable functional abilities for Runtime Entities.

Runtime Entities are their only consumers. Every active Bundle Instance belongs to exactly one Entity and is validated against that Entity's Role.

They allow Entities to gain new capabilities without changing their Role, Runtime implementation or identity.

Capability Bundles are Extensions.

They may be installed, assigned, removed and updated independently.

---

# Philosophy

Entities define presence.

Roles define purpose.

Capability Bundles define abilities.

A Companion should not require new Core code whenever it gains a new capability.

Instead, new functionality is introduced through reusable Bundles.

---

# Responsibilities

Capability Bundles are responsible for:

- providing reusable Entity capabilities
- declaring compatible Entity Roles
- declaring required Permissions
- declaring Runtime Service dependencies
- exposing supported interactions
- exposing optional User Interface components
- participating in the Extension lifecycle

Capability Bundles never own Entity identity.

---

# Extension Category

Capability Bundle is a first-class Extension category.

Every Bundle follows the shared Extension System.

This includes:

- Manifest
- immutable ID
- version
- API compatibility
- dependencies
- Permissions
- Validation
- Registration
- Lifecycle

Bundle definitions use the shared Bundle Registry category and the mandatory shared Extension Validation pipeline. Every code-bearing Bundle must provide and pass isolated automated tests.

Bundles never bypass or duplicate the Extension System, Registry System or Extension Validation pipeline.

---

# Composition

An Entity may use multiple Capability Bundles simultaneously.

Example:

```text
Companion

Role:
Support Entity

Capability Bundles:
- Conversation
- Workspace Assistance
- Review Assistance
- Suggestions
- Journeyman Coordination
```
The Entity remains one Runtime Entity.

Bundles only extend what it may do.

System Tools do not receive Bundle Instances. Their capabilities use the existing System Tool Extension contract.

Role Compatibility

Every Capability Bundle declares compatible Entity Roles.

Example:

Conversation Bundle

Compatible Roles:
- Support Entity
- Guide Entity
- Worker Entity

An incompatible Bundle cannot be assigned.

Role compatibility is validated before activation.

Permissions

Every Bundle declares the Permissions required by its capabilities.

Example:

Workspace Assistance Bundle

Permissions:
- observe Workspace Context
- request User Tool opening
- highlight Object
- navigate Workspace

Permissions remain enforced by Runtime Services.

A Bundle never grants itself access.

Runtime Dependencies

Bundles may depend on:

Runtime Services
Providers
other Capability Bundles
Entity Runtime features
Extension APIs

All dependencies are declared explicitly.

Circular dependencies are forbidden.

Bundle Identity

Every Capability Bundle possesses:

immutable ID
display name
description
version
compatible Roles
required Permissions
dependencies
exposed capabilities
optional configuration schema

Display names may change.

Bundle IDs never change.

Capability Exposure

Bundles expose named capabilities.

Examples include:

conversation
explain Review
open Workspace Tool
monitor Jobs
navigate Cosmos
request Journeyman
interact with Pet
provide Tutorial

Entities request these capabilities through the Entity Runtime.

User Configuration

Users may configure assigned Bundles.

Examples include:

enable or disable proactive suggestions
select preferred Provider
restrict Tool access
configure notification frequency
disable individual capabilities

User configuration never changes the Bundle implementation.

Provider Independence

Capability Bundles may optionally use Providers.

Example:

Conversation Bundle

↓

may use AI Provider

Workspace Assistance Bundle

↓

does not require AI Provider

A missing Provider disables only Provider-dependent features.

The Entity and Bundle remain available where possible.

Bundle Examples

Initial Bundles may include:

Conversation

Provides structured and AI-assisted conversation.

Workspace Assistance

Allows an Entity to navigate Workspaces and request User Tools.

Review Assistance

Allows an Entity to explain and present Review Items.

Suggestions

Allows contextual suggestions based on Runtime information.

Journeyman Coordination

Allows an Entity to prepare and request user-confirmed Journeyman tasks. It extends the Entity, not Journeyman.

Ambient Interaction

Provides decorative interactions between Entities.

Job Monitoring

Allows an Entity to observe and communicate Job progress.

Bundle Assignment

Bundle assignment follows this flow:

Bundle Selected

↓

Role Compatibility Check

↓

Dependency Resolution

↓

Permission Review

↓

Validation

↓

Assignment

↓

Initialization

Invalid Bundles never become active.

Assignment and configuration changes are requested through a Command to the appropriate Runtime Service. The Service performs authoritative permission and business validation, persists the change, updates Runtime state and publishes the completed-fact Event. Bundle Runtime does not persist assignments or publish mutations directly.

Runtime Isolation

Bundles remain isolated.

One failing Bundle:

does not disable the Entity
does not affect other Bundles
does not corrupt Runtime State
may be disabled independently

The Entity continues operating with its remaining capabilities.

State

A Bundle may maintain limited Runtime State.

Examples include:

conversation session
active suggestion
selected Review Item
Job monitoring subscription

Entity identity and primary State remain owned by the Entity Runtime.

Communication

Bundles never communicate directly with one another.

Communication occurs through:

Entity Runtime
Runtime Services
Events
Context

This prevents hidden dependencies.

Extensibility

Users and Extensions may introduce new Capability Bundles.

Examples include:

Repository Assistance
Cooking
Music
Research
Electronics
Modding
Collaborative Planning

New Bundles extend Entities without changing the Core.

Design Goal

Capability Bundles should allow Entities to grow together with the user.

Installing a new Bundle should feel like teaching an Entity a new skill while preserving its identity, personality and existing behavior.

Principles
Capability Bundles are Extensions.
Bundle Instances belong only to Entities.
Roles define purpose.
Bundles define abilities.
Permissions control execution.
Role compatibility is mandatory.
Providers remain optional.
Bundles remain independently replaceable.
One failing Bundle never disables the Entity.
New abilities never require Core changes.
