# Connections

**Version:** 1.0
**Status:** Foundation
**Category:** Experience

---

# Purpose

This document describes how relationships between Nodes are experienced inside the Cosmos.

Connections are one of the fundamental visual languages of the Cosmos.

They help users understand both the structural organization of their universe and the relationships that naturally emerge over time.

---

# Universal Representation

Connections never represent files or folders.

Every visible Connection is an Object representation. Its identity and presentation Properties follow the universal Object Model, while the underlying structural reference, accepted Relationship or discovery candidate remains authoritative for meaning.

Instead, they visualize meaningful relationships between Nodes.

Every connection should help users understand how concepts belong together.

Connections should improve orientation rather than increase visual complexity.

---

# Types of Connections

The Cosmos defines two presentation and provenance modes for Connections. They are not additional Version 1 Relationship types.

---

## Structural Connections

Structural Connections represent the permanent structure of the Cosmos.

They are created automatically whenever the user creates or reorganizes Nodes.

Examples include:

- Project → Domain
- Domain → Cluster
- Cluster → Object
- Object → Detail

Structural Connections form the stable skeleton of every project.

They only change when the underlying structure changes.

They visualize validated Node placement and do not create a `Structural` Relationship record.

---

## Semantic Connections

Semantic Connections represent discovered relationships.

They are generated automatically by the Cosmos based on existing information.

Examples include:

- shared User Tags
- similar topics
- frequently used together
- semantic similarity
- discovered relationships

Semantic Connections never replace structural organization.

Instead, they reveal additional knowledge that may help the user discover new connections inside their own Cosmos.

An accepted semantic connection may visualize the Product Bible's universal `Related` Relationship. An unaccepted discovery remains a non-persistent candidate and never changes user data silently.

---

# Visual Hierarchy

Structural Connections should always remain the dominant visual structure.

They are:

- permanently visible
- clean
- stable
- easy to follow

Semantic Connections should appear much more subtly.

They should support exploration without competing with the structural graph.

Possible visual differences include:

- thinner appearance
- reduced opacity
- alternative line style

Future Themes may visualize these differences differently while preserving their meaning.

---

# Cross-Project Discovery

Structural Connections always remain inside their own project.

Semantic Connections may extend across project boundaries.

This allows the Cosmos to reveal relationships between projects without changing their structure.

Version 1 intentionally allows this behavior in order to evaluate how it affects exploration and knowledge discovery.

Cross-Project discovery does not create a persistent cross-Project Relationship until the user accepts a valid Relationship through the Product Bible contract.

---

# Interaction

Connections are passive navigation elements.

Users primarily interact with Nodes.

Connections exist to explain relationships.

Hovering or selecting a Node may emphasize its connected Nodes and their relationships.

Connections themselves should not become primary interaction targets.

---

# Growth

As the user's Cosmos grows, Connections grow with it.

Structural Connections expand the user's organization.

Semantic Connections continuously reveal new patterns and relationships.

Together they transform the Cosmos into an increasingly interconnected personal knowledge universe.

---

# Theme Support

Connections define relationships.

Themes define appearance.

A Theme may replace:

- materials
- colors
- animations
- line styles
- visual effects

without changing the meaning of the connection.

The Cosmos Theme included in Version 1 serves as the reference implementation.

---

# Experience Goals

Connections should always feel:

- natural
- informative
- lightweight
- calm
- discoverable

Users should immediately understand both:

- how their Cosmos is organized
- how their ideas relate to one another

without feeling overwhelmed.

---

# Scope

This document describes only the experience of Connections.

Their underlying data model and relationship system are defined within the Product Bible.
