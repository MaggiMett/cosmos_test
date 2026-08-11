# Node

## Purpose

A Node is an Object with the `Node` System Tag that provides the universal map representation inside Cosmos.

Node is a role in the universal Object Model, not a separate wrapper class or identity system.

---

# Philosophy

Objects retain one identity while representation changes.

The same Object may combine `Node` with other System Tags such as:

```text
Node + ProjectRoot
Node + Domain
Node + Cluster
Node + Object
Node + Detail
```

These combinations activate the required Node and role-specific Property Schemas. They do not select mutually exclusive Node classes.

---

# Responsibilities

The Node role is responsible for:

- spatial position and hierarchy presentation
- map interaction
- navigation
- connection presentation
- level-of-detail state
- Theme representation references

Knowledge, Resources and accepted Relationships remain separate domain records referenced by the Object. Node Properties never become a second source of semantic truth.

---

# Identity and Representation

The Node seen on the Cosmos Map resolves to the immutable ID of the Object carrying the Node role.

Changing Theme, Skin, zoom level, Context or View never creates a new semantic identity.

A Detail Node is still an independent Object. Its structural placement describes how it enriches a parent; it does not make the Detail a property blob or non-Object.

---

# Interaction

All Node System Tag combinations share one interaction contract:

- hover
- selection
- focus
- context menu
- drag and drop
- opening the represented content

Role-specific actions are resolved from active System Tags and capabilities. Themes do not add or remove actions.

Tools and Runtime Services execute actions. The Node is the interaction origin, not a business-logic owner.

---

# Hierarchy

Node hierarchy is expressed through structural Properties and validated parent-child references.

Examples include:

```text
ProjectRoot
↓
Domain
↓
Cluster
↓
Object
↓
Detail
```

Structural placement supports orientation. It is not a new Version 1 Relationship type.

---

# Connections

A visible Connection is an Object representation.

Structural Connections visualize validated Node placement. Semantic Connections visualize an accepted `Related` Relationship or a non-persistent discovery candidate.

Version 1 still defines only one persistent Relationship type: `Related`. `Structural` and `Semantic` describe Connection provenance and presentation, not additional Relationship types.

Deleting a Connection representation never deletes either endpoint Object. Persisting or deleting an accepted Relationship continues through Relationship Service.

---

# Themes and Skins

Themes provide Node and Connection appearance only.

They may change shape, materials, colors, animations, icons and effects. They never change Node identity, hierarchy, interaction, capabilities, Property Schemas or Relationships.

Skin and Theme selections are explicit Properties or references defined by the active schemas. Missing animation or audio uses complete default values.

---

# Level of Detail

Level of Detail changes which representations are visible at each zoom level.

It never changes Object identity or System Tags.

Zooming out emphasizes Projects and Domains. Zooming in may reveal Clusters, Objects, Details, accepted Relationships and discovery candidates.

---

# Runtime and Persistence

Persistent Node Properties include validated spatial and hierarchy state when required by the active schema.

Transient render data remains Runtime state. The Runtime may reconstruct it from Object identity, Properties, Context and Theme configuration.

Object Service owns durable Node Object mutations. Relationship Service owns durable accepted Relationships. Themes remain presentation-only.

---

# Extensibility

Future Node capabilities should use additional System Tag combinations, composed Property Schemas, complete Properties, Extension Points and Theme Components for appearance.

They must not create another Node class hierarchy or duplicate Object identity.

---

# Principles

- Every Node is an Object.
- Node roles are composed through System Tags.
- Identity remains stable across representations.
- Structural placement is not a Relationship type.
- Version 1 persistent Relationships use only `Related`.
- Themes define appearance only.
- Node Properties are complete and schema-valid.
- Business changes pass through Runtime Services.
