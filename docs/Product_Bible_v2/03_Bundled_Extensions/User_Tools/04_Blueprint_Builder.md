# Blueprint Builder

## Purpose

Blueprint Builder allows users to define reusable Object Blueprint structures.

Instead of repeatedly describing similar Objects, users create an Object Blueprint once and instantiate it whenever needed.

Object Blueprints define structure.

Objects define content.

---

# Philosophy

Projects naturally contain recurring concepts.

Minecraft contains Items.

Stories contain Characters.

Applications contain Pages.

Object Blueprints describe these recurring structures without restricting creativity.

---

# Responsibilities

Blueprint Builder is responsible for:

- creating Object Blueprints through Object Service
- editing Object Blueprints through Object Service
- versioning Object Blueprints
- instantiating Objects
- defining default fields
- defining Object Blueprint Tags
- defining expected `Related` Relationship suggestions

Blueprint Builder never stores Object content.

---

# Runtime Dependencies

Blueprint Builder uses:

- Object Service
- Knowledge Service
- Tag Service
- Relationship Service
- Runtime Context
- Event Model

Blueprint Builder never modifies Persistence directly.

Object Blueprint creation and updates follow one path:

```text
Blueprint Builder
    ↓
Command
    ↓
Object Service
    ↓
Authoritative Permission and Category-Schema Validation
    ↓
Persistence
    ↓
Object Blueprint Registry Update
    ↓
Completed-Fact Event
```

Blueprint Builder keeps drafts and presents validation feedback. It never persists or registers Object Blueprint definitions directly.

---

# Object Blueprint

An Object Blueprint defines a reusable System Tag combination, composed Property Schema and complete default Properties for one Object.

Examples include:

- Minecraft Item
- Character
- Quest
- Building
- API Endpoint
- UI Screen
- Database Table

Object Blueprints define expectations.

An Object Blueprint is itself an independent Object with `Blueprint + Object` System Tags. Its identity is distinct from every Object instantiated from it. Registry indexing does not create a separate Blueprint identity system.

Object Blueprints do not capture parent-child Node hierarchies. Reusable hierarchy belongs to independent `Template + Structure` Objects.

Global Object Blueprints never contain project-specific information. Project-scoped Object Blueprints may define Project-specific structure, but Object content remains outside the definition.

---

# Object Blueprint Components

An Object Blueprint always defines:

- title
- description
- required System Tags
- Property Schema fields and constraints
- complete default Properties
- validation rules

It may additionally define:

- suggested User Tags
- sections
- expected `Related` Relationship suggestions
- Resource references

Parent-child Node hierarchies never belong to an Object Blueprint. Structure Template Objects own reusable hierarchy.

Projects may extend these definitions.

---

# Object Blueprint Fields

Fields define Properties required by the composed Object schema.

Examples include:

- Name
- Description
- Texture
- Model
- Stats
- Recipe
- Dependencies

Fields may be:

- text
- number
- boolean
- list
- object reference
- resource reference

Future field types may be introduced through Extensions.

Every active field must contain a valid value when the Object is created. A capability that is not used is represented by an explicit schema default rather than an omitted or optional Property.

---

# Object Blueprint Tags

Object Blueprints automatically assign default System Tags.

They may also suggest User Tags.

User Tags are applied only through an explicit user choice or an explicitly tagged creation action. Users remain free to modify them after Object creation.

---

# Object Blueprint Relationships

Object Blueprints may define expected Relationship suggestions. In Version 1, every accepted Relationship connects two Objects and uses the `Related` type.

Example:

Minecraft Item

↓

Related

↓

Item Category

Character

↓

Related

↓

Faction

Specialized meanings such as `belongs to` are future Relationship type examples only. In Version 1 they may inform the suggestion but do not replace the `Related` type.

---

# Object Blueprint Instantiation

Creating an Object from an Object Blueprint performs:

- create Object
- record the Object Blueprint ID and version
- create default fields
- assign default Tags
- request default `Related` Relationships through Relationship Service

The Object immediately becomes part of the Project.

---

# Versioning

Object Blueprints have immutable IDs and evolve through explicit versions.

Existing Objects retain their historical structure.

Users may later migrate Objects to newer Object Blueprint versions when appropriate.

Migration is always explicit.

---

# Project Scope

Object Blueprints may exist in two scopes.

## Global Object Blueprints

Reusable across Projects.

Examples:

- Character
- Meeting
- API Endpoint

---

## Project Object Blueprints

Specific to one Project.

Examples:

- Minecraft Item
- Dwarven Building
- Skill Tree Node

Project-scoped Object Blueprints declare their Project scope and inherit Runtime Context automatically.

---

# Object Creation

Objects created from Object Blueprints remain fully editable.

Object Blueprints provide a starting structure.

They never lock Object behavior.

---

# Companion

Companion may assist while creating Object Blueprints.

Examples include:

- suggesting fields
- identifying repeated patterns
- proposing `Related` Relationship suggestions
- explaining existing Object Blueprints

The user always defines the final structure.

---

# Runtime Context

Blueprint Builder automatically inherits:

- Project
- Workspace
- current Object
- current Tags
- active Theme

Context reduces manual configuration.

---

# Failure Handling

If Object Blueprint creation fails:

- the Object Blueprint draft remains available
- validation errors are explained
- retry remains possible
- no existing Objects are modified

---

# Extensibility

Future Extensions may introduce:

- custom field types
- validation rules
- Object Blueprint inheritance
- domain-specific Object Blueprints
- automatic Object migration

Every extension follows the shared Extension, Validation, Service, Registry, Permission, Persistence and Event contracts.

---

# Design Goal

Blueprint Builder should allow users to gradually formalize recurring ideas without reducing flexibility.

As Projects mature, Object Blueprints transform repeated manual work into reusable Object structures.

---

# Principles

- Object Blueprints define structure.
- Objects contain content.
- Object Blueprints are reusable.
- Objects remain editable.
- Object Blueprint versions are preserved.
- Migration is explicit.
- Runtime Context is inherited.
- Companion assists but never decides.
