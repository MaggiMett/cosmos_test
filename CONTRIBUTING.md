# Contributing

## Boundaries

- Keep business behavior behind Runtime Services.
- Keep Persistence behind Runtime Services; Runtime clients never access SQLite directly.
- Model independently addressable elements through the universal Object contract and additive System Tags.
- Keep Themes presentation-only.
- Put executable growth in installable Extensions before expanding Core.
- Keep Providers behind Provider Runtime adapters.
- Do not introduce feature packages into Core for project-specific behavior.

## Checks

Run the complete local gate before submitting changes:

```text
python scripts/check.py
```

This verifies Python formatting/linting, tests and packaging plus TypeScript type checking, tests, and the frontend library build.
