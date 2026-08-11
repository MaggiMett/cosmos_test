# Extensions

Installable capabilities live outside Core and follow the shared lifecycle:

```text
Discovery -> Validation -> Registration -> Initialization -> Runtime -> Shutdown
```

Each package must contain `manifest.json`, `README.md`, and only the category-appropriate source, assets, schemas, migrations, tests, and localization it needs.

The category roots below are intentionally empty in Sprint 0:

- `user-tools`
- `system-tools`
- `entities`
- `capability-bundles`
- `themes`
- `workspace-blueprints`
- `object-blueprints`
- `capture-templates`
- `providers`
- `integrations`

Structure Templates and System Projects do not belong here: they are normal tagged Objects. Core Runtime infrastructure also never belongs here.
