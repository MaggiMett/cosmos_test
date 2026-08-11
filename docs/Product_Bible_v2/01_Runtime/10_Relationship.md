# Relationship

## Purpose

Relationships are persistent Project-owned domain records that connect Objects inside Cosmos.

They describe meaningful connections between concepts, allowing Cosmos to understand how Projects evolve over time.

Relationships are independent from visual representation.

Nodes and Connectors display Relationships. Objects reference them as endpoints.

---

# Philosophy

Knowledge becomes valuable through connections.

Objects rarely exist in isolation.

Relationships transform individual Objects into an interconnected knowledge network.

Meaning emerges from both Objects and the Relationships between them.

---

# Responsibilities

Relationships are responsible for:

- connecting exactly two Object endpoints
- expressing semantic meaning
- supporting discovery
- enabling navigation
- providing context
- assisting intelligent systems

Relationships never perform actions.

They only describe connections.

---

# Ownership

Every Relationship has an immutable ID, is owned by exactly one Project and contains exactly two Object endpoint IDs.

Objects reference the Relationship record. Neither endpoint Object exclusively owns it.

Relationship Service validates and performs durable changes. Persistence stores the Relationship with the owning Project's semantic domain data.

Nodes only visualize them.

Removing or changing a visual representation never changes the underlying Relationship.

---

# Related

Version 1 defines one universal Relationship type.

## Related

A `Related` Relationship simply states:

"These Objects are meaningfully connected."

The exact interpretation depends on context.

Examples include:

- similar ideas
- implementation references
- lore connections
- dependencies
- inspirations
- shared concepts

Related intentionally remains generic.

No other Relationship type is supported in Version 1.

---

# Future Relationship Types

Future versions may introduce types such as:

- Parent
- Child
- Dependency
- Uses
- Implements
- References
- Derived From

These are extensions of the Relationship system.

They are examples only and are not valid Version 1 Relationship types.

The underlying architecture remains unchanged.

---

# Discovery

Relationships may originate from:

- user creation
- imported projects
- Analysis Engine
- Knowledge Processor
- Companion suggestions

Automatically discovered Relationships are never accepted silently.

The user always decides whether they become permanent.

---

# Visualization

Relationships are visualized through Connectors.

The active Theme determines:

- appearance
- animation
- color
- effects

Visualization never changes meaning.

---

# Navigation

Relationships provide navigation paths.

Users may move naturally between connected Objects.

Relationships encourage exploration instead of hierarchical browsing.

---

# Runtime

Relationships remain independent from:

- Themes
- Workspaces
- Tools
- Node layouts

They exist as part of the Project's semantic structure.

---

# Extensibility

Future extensions may introduce:

- weighted Relationships
- confidence values
- custom Relationship types
- visual filters
- graph analysis

All extensions should build upon the same Relationship model.

---

# Design Goal

Relationships should reveal structure that would otherwise remain hidden.

The goal is not simply to connect Objects.

The goal is to help users discover patterns, understand complexity and continuously improve their Projects.

---

# Principles

- Relationships connect Objects.
- Every Relationship has exactly two Object endpoints.
- Projects own Relationship records.
- Version 1 supports only `Related`.
- Nodes visualize Relationships.
- Relationships represent meaning.
- Discovery never changes user data automatically.
- Relationships support navigation.
- Visualization is independent from semantics.
- The system remains extensible.
