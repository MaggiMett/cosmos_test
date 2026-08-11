# Theme Builder V1 — Windows smoke test

Run from the repository root.

## Backend

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests -q
.\.venv\Scripts\python.exe -m uvicorn cosmos.api.application:app --app-dir backend/src --host 127.0.0.1 --port 8000
```

If the environment has not been bootstrapped yet, use the repository bootstrap flow first.

## Frontend

```powershell
pnpm.cmd --dir frontend typecheck
pnpm.cmd --dir frontend test
pnpm.cmd --dir frontend build
pnpm.cmd --dir frontend dev
```

Open `http://127.0.0.1:5173/themes` and choose **Theme Builder**, or open `http://127.0.0.1:5173/theme-builder` directly.

## V1 user flow

1. Create a Theme Builder Project.
2. Open **Assets** from the Studio Rail. Import/promote a visual asset if the catalog is empty, then return to the Builder.
3. On Theme Board, **Add Asset** to reference a catalog asset in the draft and save.
4. Open **Room Shell** and optionally create/edit a shell draft.
5. Open **Object Studio** and optionally create/edit a Catalog Object draft.
6. Open **Looks**, create a Look, assign a referenced asset to a real slot/state and edit the supported material values.
7. Verify Undo/Redo, Save, revision increment and browser reload persistence.
8. Open **Preview Theme** and verify the isolated draft presentation.
9. Open **Theme Check / Release**. Resolve Must Fix findings and save the draft.
10. Export the Theme Pack ZIP.
11. Return to **Theme Library**, import the ZIP, reload Cosmos at the existing registration boundary, then activate the installed Theme.

## V1 limitation

Room Shell and Catalog Object drafts are persisted and editable, but ZIP-v1 currently exports the Manifest, Looks/SkinPacks and referenced assets only. Release shows this as an explicit attention finding.
