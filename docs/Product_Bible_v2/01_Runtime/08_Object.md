# Object

## Purpose

Object is the universal identity and state model of Cosmos.

Every independently addressable visible or interactive element inside Cosmos is represented by an Object. Reusable definitions that users can address, including Themes, Skins and Templates, are Objects as well even when they are not currently visible.

Projects, Nodes, Workspaces, Windows, Tools, Themes, Templates, Entities and similar concepts are not parallel identity systems. They are Object roles expressed through System Tags, activated Property Schemas and complete Properties.

Domain records such as Knowledge, Resources and Relationships remain distinct contracts. An Object may reference them, and any visible or interactive representation of them is still an Object.

---

# Universal Structure

Every Object follows one conceptual sequence:

```text
Identity
↓
System Tags
↓
Property Schemas
↓
Properties
↓
User Tags
```

The sequence is universal. Role-specific documents define the responsibilities activated by particular System Tag combinations; they do not define separate Object classes.

---

# Identity

Every Object has one immutable ID.

Identity remains stable when:

- its display name changes
- its Theme or Skin changes
- its visual representation changes
- its Properties change
- its User Tags change
- it appears in another View

An Object may be represented in multiple places without duplicating identity.

Identity metadata includes:

- immutable ID
- display name
- description
- creation date
- creator
- lifecycle state

Display names and metadata may evolve. The immutable ID does not.

---

# System Tags

System Tags compose an Object's functional identity.

Examples include:

- `Project`
- `Node`
- `Workspace`
- `Window`
- `Tool`
- `Theme`
- `Template`
- `Entity`
- `System`

System Tags may be combined. A Project that extends Cosmos is a normal Object with `Project + System`; it is not an instance of a separate System Project class.

System Tags activate capabilities and Property Schemas. Cosmos owns their vocabulary and applies them through validated Runtime Service operations. Users do not silently mutate System Tags as if they were User Tags.

Adding a role should prefer a new combination of existing System Tags. A new dedicated class or parallel identity model is justified only when the universal Object contract cannot express the requirement.

---

# Property Schemas

The active System Tag combination determines the Property Schemas composed for an Object.

Each active schema defines:

- required Properties
- value types and constraints
- explicit default values
- validation rules
- compatibility requirements

Schema composition is additive. When several System Tags are active, their schemas are composed and validated as one complete Object contract.

An Object is valid only when every required Property of every active schema exists and contains a valid value. Missing capability is represented by an explicit default such as `Static`, `Silent`, `None` or another schema-defined value, not by an incomplete schema.

Object Service validates System Tag, schema and Property changes before Persistence commits them.

---

# Properties

Properties describe the Object's current state.

Examples include:

- name and configuration
- placement and dimensions
- current Skin or Theme reference
- active condition
- lifecycle state
- role-specific settings

Properties never replace identity. Changing a Property changes the state of the existing Object.

Transient Objects use the same Property rules as persistent Objects. Lifetime changes persistence behavior, not the Object Model.

---

# User Tags

User Tags describe user-defined meaning, organization and discovery.

They support:

- search
- filtering
- grouping
- discovery
- reusable collection views

Collections emerge from shared Tags and queries. Cosmos does not introduce a dedicated collection or grouping identity when User Tags already express the requirement.

Users own User Tags. Cosmos may suggest tags, but it never silently adds, removes or rewrites them. An Object's display name remains Identity metadata and does not require a duplicate automatic User Tag.

---

# Scope and Lifetime

Objects may be:

- Project-owned
- Cosmos-global
- System-owned
- Runtime-only

Project-owned semantic Objects have one primary Project. Universal Objects that describe Cosmos itself, reusable global definitions or temporary Runtime state do not require a primary Project.

Scope never creates a different Object class. It is expressed through System Tags, Properties and ownership references.

Runtime Objects include Windows, Notifications and temporary Panels. They retain stable identity for their Runtime lifetime and follow the same schema validation rules.

---

# Knowledge

Objects may reference Knowledge records.

Knowledge may include:

- Captures
- Documentation
- Decisions
- promoted discussion records
- References
- Research
- durable descriptions or analyses of Blueprints and Templates

Knowledge explains an Object. It never replaces the Object or a reusable definition.

---

# Resources

Objects reference Runtime Resources through stable Resource mappings.

Examples include:

- source files
- textures
- models
- audio
- videos
- configuration
- localization
- documentation

Resources remain owned by their native repository or external source. Object identity remains stable when mapped Resources change.

---

# Relationships and Connections

Objects are the two endpoints of Version 1 Relationship records.

The sole Version 1 Relationship type is `Related`. Specialized semantic types remain future extensions.

A visible Connection is an Object representation of either structural placement, an accepted `Related` Relationship or a non-persistent discovery candidate. The Connection does not redefine the underlying record. Removing a representation does not remove the Objects it connects.

---

# Representation and Themes

Themes represent Objects.

They never define Object identity, capabilities, interaction rules, schemas or business behavior.

The same Object may appear through different Nodes, Windows, search results, Archive entries or Theme Components. Every representation resolves to the same immutable Object ID.

---

# Prepared Structures

Expandable Objects use Prepared Structures and Extension Points rather than parallel growth systems.

Prepared Structures:

- exist physically when the owning Object is created
- mirror the real Cosmos structure
- may remain empty indefinitely
- use complete default Properties
- expand through the same System Tag and schema rules

Prepared does not mean required. Ghost, virtual or lazily invented structures are not valid Prepared Structures.

---

# Extensibility

Future capability should extend Objects through:

- existing or new System Tag combinations
- composed Property Schemas
- complete Properties
- User Tags
- Prepared Structures
- Extension Points

Extensions may add validated definitions and capabilities. They do not introduce a second Object Model.

---

# Design Goal

Cosmos should expose one coherent identity and state model regardless of what an Object represents or how it is rendered.

Implementation should be able to reason about every Object through the same contracts without type-specific identity systems or incomplete state.

---

# Principles

- Every independently addressable visible or interactive element is represented by an Object.
- Reusable Themes, Skins and Templates are Objects.
- Identity is permanent and representation-independent.
- System Tags compose roles and activate Property Schemas.
- Active schemas always produce complete Properties.
- User Tags express user-defined meaning and emergent collections.
- Themes define appearance only.
- Runtime lifetime does not create a separate Object Model.
- Prepared Structures exist physically and mirror Cosmos.
- Future growth extends the universal Object contract.
