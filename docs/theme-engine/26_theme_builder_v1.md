# Cosmos Theme Builder V1

Status: usable V1 authoring flow

## Entry points

- `/themes` — installed Theme Library
- `/theme-builder` — Theme Builder Project board
- `/theme-builder/assets` — persistent Asset Catalog and import
- `/theme-builder/room-shells` — Room Shell draft authoring
- `/theme-builder/objects` — Catalog Object draft authoring
- `/theme-builder/looks` — Skin/Look and material authoring
- `/theme-builder/preview` — isolated draft preview
- `/theme-builder/release` — validation and Theme Pack export

The older `/dev/*` routes remain as QA compatibility routes and use the same presenters.

## V1 workflow

1. Open **Theme Library → Theme Builder**.
2. Create or open a persistent Builder Project.
3. Add/import visual assets through **Assets**. Builder Projects store only exact `{ id, version }` references; bytes and catalog metadata remain authoritative in the Asset Catalog.
4. Optionally author Room Shell and Catalog Object drafts. These are persisted in the Builder Project and revisioned with the rest of the document.
5. Create a Look in **Looks Studio**, bind referenced assets to real template slots/states, and edit only renderer-allowlisted material channels.
6. Use **Preview Theme** for an isolated draft preview. Preview never mutates ThemeRuntime or the installed active Theme.
7. Use **Theme Check / Release**. Export is enabled only after required V1 validation succeeds and the draft is saved.
8. Export the deterministic ZIP-v1 Theme Pack.
9. Import the ZIP through `/themes`. Installed packages become available after the existing runtime reload boundary, then can be activated through the Theme Library.

## Persistence and concurrency

The Builder Project is the sole persistent editing authority. It is stored through the existing universal Object persistence boundary under the ThemeBuilderProject system tag. No Builder-specific table or parallel Registry is used.

Saves use optimistic compare-and-swap with `expectedRevision`. A stale editor receives a conflict and never silently overwrites the authoritative draft. Undo/redo history is session-local and intentionally not persisted.

## V1 package scope

ZIP-v1 exports the Theme Manifest, validated SkinPacks/Looks, and referenced Asset Catalog resources. Room Shell and Catalog Object drafts are persisted and editable in Builder V1 but are not yet transported by Theme Package ZIP-v1; Release surfaces this as an explicit attention finding rather than silently claiming they are packaged.

## Safety boundaries

- Builder editing never mutates ThemeRuntime, ThemeRegistry, or ThemePackageRegistry.
- Assets are referenced, never copied into Builder Project JSON.
- Skin presentation cannot alter runtime bindings, interaction bounds, focus order, or function semantics.
- Material editing is limited to the existing renderer allowlist.
- Draft preview is isolated from the active installed Theme.
- Package installation continues to use the existing secure import/quarantine/validation path.

## Intentionally deferred after V1

- Room Shell / Catalog Object transport in Theme Packages
- Animation timeline authoring
- Live package registration after import
- Package update/uninstall UI
- Multi-user merge beyond optimistic revision conflicts
- Theme Marketplace/community distribution
