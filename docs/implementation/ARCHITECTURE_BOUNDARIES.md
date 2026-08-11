# Cosmos implementation boundaries

## Dependency direction

```text
API / Extensions / Runtime clients
                |
                v
        Runtime Services
        |       |       |
        v       v       v
 Persistence  Registries  Core Runtime infrastructure
```

- Domain contracts do not import API, Persistence, Extensions, or presentation code.
- Runtime Services are the sole authoritative business and permission boundary.
- Persistence owns durability only and is called by Runtime Services.
- Registries own validated definitions only; active state and execution remain with their Runtime owner.
- Events announce completed facts after transactions and never request work.
- Only Runtime Services create long-running Jobs.
- Provider Runtime owns Provider selection and execution. Consumers state capabilities and constraints, never a concrete Provider.
- Theme Extensions contain appearance definitions only.

## Universal Object model

Every independently addressable visible or interactive element uses one immutable Object identity. System Tags compose roles and activate additive Property Schemas. Every activated Property has an explicit valid value. User Tags remain user-owned.

The foundation migration stores this envelope generically. It does not add Project, Workspace, Tool, Theme, or Entity identity tables.

## Persistence

SQLite is the Version 1 authority. Project `.cosmos/` manifests will be projections written only after an authoritative Service transaction; they are not implemented in Sprint 0 because no Project Service exists yet. Native Resource files remain externally owned.

## Extension escalation order

Before adding a Core abstraction or new executable category, reuse:

1. Objects
2. System Tags
3. Property Schemas and complete Properties
4. Prepared Structures
5. Extension Points
6. an existing executable Extension category
