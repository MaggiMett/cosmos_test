# Extension Validation

## Purpose

The Extension Validation System verifies every Extension before it becomes part of the Runtime.

Validation ensures that Extensions are compatible, secure, complete and consistent with Runtime contracts.

Only validated Extensions may become active.

---

# Philosophy

The Runtime should trust activated Extensions because validation has already established their structural safety.

Rejecting an Extension is preferable to allowing undefined behavior or risking user data.

---

# Responsibilities

The Extension Validation System is responsible for:

- validating Extension Manifests
- verifying Runtime API compatibility
- resolving dependencies
- validating permissions
- validating component registration
- validating schemas and migrations
- scanning code and package structure
- executing isolated automated tests
- reporting actionable failures

Validation never grants business authority and never executes normal Extension workflows.

---

# Validation Pipeline

```text
Extension Discovery
    ↓
Package Structure Validation
    ↓
Manifest Validation
    ↓
Schema and Migration Validation
    ↓
Runtime API Compatibility
    ↓
Dependency Resolution
    ↓
Permission and Security Scan
    ↓
Static Code Checks
    ↓
Category-Specific Contract Validation
    ↓
Registry Simulation
    ↓
Isolated Validation Tests
    ↓
Approved / Approved with Warnings / Rejected
```

Only approved Extensions proceed to registration and activation review.

---

# Package Structure Validation

Every Extension must follow the supported package structure for its category.

The validator checks required directories, declared entry points, assets, schemas, migrations and tests.

Unexpected executable content is reported.

---

# Manifest Validation

Every Extension must provide a valid Manifest containing:

- immutable ID
- display name
- version
- category
- Runtime API version
- supported language stack
- declared permissions
- declared components
- entry points
- dependencies

Missing mandatory information rejects the Extension.

---

# Language Validation

Version 1 native Extensions use the supported Cosmos stack:

- Python for backend and System Tool logic
- Vue with TypeScript for User Tool interfaces

External software may be reached through declared Integrations, but unsupported native Extension languages are rejected in Version 1.

---

# Schema and Migration Validation

Configuration and persistent schemas are validated for:

- required fields
- supported types
- defaults
- schema versions
- forward migration paths
- rollback or safe failure behavior

Invalid schemas or migrations prevent activation.

---

# Runtime Compatibility

Every Extension declares a supported Runtime API range.

Incompatible Extensions remain installed but inactive.

No compatibility assumption is made from version numbers alone.

---

# Dependency Validation

Validation confirms:

- required Extensions exist
- compatible versions are available
- dependency categories are valid
- no circular dependencies exist

Unresolved dependencies prevent activation.

---

# Permission and Security Validation

The validator checks:

- permission names and categories
- least-privilege plausibility
- filesystem and repository access
- network access
- process execution
- provider access
- undeclared sensitive behavior detectable by static scanning

Unknown or undeclared sensitive capabilities reject the Extension.

---

# Static Code Checks

Code-bearing Extensions are checked for:

- syntax and type errors
- forbidden Core imports
- direct Persistence access
- direct cross-Extension imports
- bypasses of Runtime Services
- unsupported entry points
- known unsafe patterns

Static checks supplement Runtime isolation and do not replace it.

---

# Category-Specific Contract Validation

Every Extension category contributes contract checks inside this shared pipeline; it does not create a separate validation pipeline.

Capability Bundle checks include compatible Entity Roles, capability declarations, Bundle dependencies, Permission declarations and configuration schemas. These checks precede Registry Simulation and isolated validation tests.

Object Blueprint, Capture Template and Workspace Blueprint Extensions validate their category schema, version and declared scope through the same pipeline.

---

# Registry Simulation

Declared components are registered inside an isolated temporary Registry.

The simulation checks:

- duplicate IDs
- invalid namespaces
- missing capabilities
- incompatible component declarations
- dependency resolution

Simulation never modifies the active Runtime.

---

# Validation Tests

Every code-bearing Extension must provide tests appropriate to its category.

Examples include:

- startup validation
- Tool contract tests
- System Tool health tests
- configuration validation
- migration validation
- permission boundary tests
- compatibility checks

Tests execute in isolation.

A failing test prevents activation.

Every code-bearing Capability Bundle is a code-bearing Extension and must provide and pass these isolated automated tests. Bundle-specific contract checks never replace test execution.

---

# Validation Result

Validation produces a structured result containing:

- outcome
- checks performed
- warnings
- failures
- affected components
- suggested resolution

Possible outcomes are:

- Approved
- Approved with Warnings
- Rejected

Warnings may never conceal a safety or compatibility failure.

---

# Failure Isolation

An invalid Extension must never prevent Cosmos from starting.

Rejected Extensions remain installed but inactive and may be repaired or removed.

Dependent Extensions are marked unavailable without affecting unrelated components.

---

# Future Validation

Future versions may add:

- digital signatures
- publisher identity
- extension certification
- performance budgets
- stronger sandbox analysis
- supply-chain checks

These additions extend the same pipeline.

---

# Design Goal

Extension Validation should keep Cosmos open and modifiable while preserving Core stability and user trust.

Developers receive precise feedback, and users can understand why an Extension was accepted or rejected.

---

# Principles

- Every Extension is validated.
- Validation precedes registration.
- Code-bearing Extensions include tests.
- Permissions and sensitive capabilities are scanned.
- Registry behavior is simulated in isolation.
- Invalid Extensions never activate.
- One invalid Extension never blocks Cosmos startup.
- Validation results are actionable and deterministic.
