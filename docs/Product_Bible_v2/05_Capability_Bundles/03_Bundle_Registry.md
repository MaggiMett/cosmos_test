# Bundle Registry

## Purpose

The Bundle Registry is the Capability Bundle category-specific Registry built on the shared Registry System contract.

It exposes Bundle-specific discovery, validation metadata, dependency information and Entity Role compatibility without loading Bundle implementations.

The Registry knows what Bundles exist.

Bundle Runtime decides which validated, active Bundle Definitions are instantiated for assigned Entities.

---

# Philosophy

Capability Bundles should be discoverable without being executed.

The Registry provides metadata.

It never performs Runtime work.

A Bundle may exist inside the Registry while remaining unassigned or inactive.

---

# Responsibilities

Within the shared Registry contract, the Bundle Registry is responsible for:

- registering Bundle Definitions
- maintaining immutable Bundle identities
- exposing Bundle metadata
- exposing compatibility information
- exposing dependency declarations
- exposing version information
- supporting Bundle discovery

The Registry never executes Bundle code.

Shared Registry behavior remains authoritative for identity, status, activation, dependency references, duplicate handling, resolution and caching. Bundle Registry is not a separate discovery, validation or persistence architecture.

---

# Registry Entry

Every Bundle Definition has exactly one shared Registry Entry in the Capability Bundle category.

Each entry contains:

- immutable Bundle ID
- display name
- description
- version
- author
- extension source
- compatible Runtime API
- compatible Entity Roles
- dependency declarations
- Permission declarations
- capability declarations
- configuration schema
- lifecycle version

Registry Entries remain lightweight.

Registration occurs only after the Capability Bundle Extension has completed the mandatory shared Extension Validation pipeline, including isolated automated tests for every code-bearing Bundle.

---

# Bundle Discovery

The Registry supports Bundle discovery.

Bundles may be searched by:

- name
- ID
- capability
- Entity Role
- dependency
- author
- version
- Extension package

Discovery never activates a Bundle.

---

# Bundle Identity

Every Bundle possesses:

- immutable ID
- semantic version
- display name

Display names may change.

Bundle IDs never change.

The Registry always identifies Bundles through their immutable ID.

---

# Versioning

Every Registry Entry stores Bundle version information.

Version compatibility includes:

- Bundle version
- Runtime API version
- Extension API version

The Registry exposes declared compatibility through the shared Registry entry.

Shared Extension Validation validates definition compatibility, and Bundle Runtime performs current Entity assignment compatibility preflight before activation.

---

# Dependency Metadata

Dependency declarations include:

- required Bundles
- optional Bundles
- Runtime Services
- Providers
- minimum versions

Dependencies remain descriptive.

Shared Extension Validation and the Registry System resolve definition dependencies. Bundle Runtime checks the current availability of resolved dependencies for Entity assignment and activation.

---

# Capability Metadata

Every Registry Entry exposes provided capabilities.

Examples include:

- conversation
- workspace_navigation
- review_assistance
- suggestion_generation
- job_monitoring

Capabilities are metadata.

Execution belongs to Bundle Instances.

---

# Permission Metadata

Registry Entries expose requested Permissions.

Examples include:

- request_tool_open
- observe_jobs
- display_review
- navigate_workspace

Permissions remain declarative.

The Runtime decides whether they are granted.

---

# Role Compatibility

Registry Entries declare compatible Entity Roles.

Example:

Conversation Bundle

Compatible Roles:

- Support Entity
- Guide Entity
- Worker Entity

Ambient Entities remain incompatible.

Compatibility is validated before assignment.

---

# Configuration Schema

Bundles may expose configurable settings.

Examples include:

- notification frequency
- preferred Provider
- proactive suggestions
- idle dialogue

The Registry stores the configuration schema.

Runtime stores configuration values.

---

# Bundle Categories

Bundles may belong to one or more categories.

Examples include:

- Conversation
- Workspace
- Knowledge
- Review
- Navigation
- Ambient
- Tutorial
- Repository
- Development

Categories simplify discovery.

They do not affect Runtime behavior.

---

# Assignment Availability

The Registry may expose read-only assignment availability derived from the shared Registry status and current compatibility metadata.

Examples:

- installed
- assignable
- deprecated
- disabled
- incompatible

Assignment and active Instance state belong to the Entity and Bundle Runtime path and are never stored in the Registry.

---

# Deprecation

Bundles may become deprecated.

Deprecated Bundles:

- remain identifiable
- remain discoverable
- remain loadable when compatible

The Registry provides migration recommendations where available.

---

# Security

The Registry never trusts Bundle metadata blindly.

Every Bundle is validated before registration.

Invalid metadata is rejected.

Registry integrity is maintained independently from Bundle execution.

---

# Runtime Independence

The Registry never stores:

- Bundle Runtime State
- active Bundle Instances
- Entity assignments
- conversations
- temporary context

These belong to Runtime systems.

Registry metadata may be cached, but the authoritative Bundle Definition remains the validated Extension Manifest and component declaration. The shared Registry index is rebuildable and does not own Bundle Persistence.

---

# Extensibility

Future extensions may introduce:

- Bundle ratings
- certification levels
- marketplace metadata
- licensing
- compatibility badges
- community verification

The shared Registry remains the single catalog of Bundle metadata.

---

# Design Goal

The Bundle Registry should allow Cosmos to discover, validate and organize Capability Bundles without coupling discovery to execution.

Users and developers should always understand what a Bundle provides before assigning it to an Entity.

---

# Principles

- The Registry stores metadata.
- Bundle Registry follows the shared Registry contract.
- Bundle execution belongs to the Runtime.
- Bundle identity is immutable.
- Compatibility is declarative.
- Discovery never activates Bundles.
- Configuration schemas are descriptive.
- Runtime State never belongs in the Registry.
- Every Bundle has exactly one Registry Entry.
