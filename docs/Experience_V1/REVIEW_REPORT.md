# Cosmos Experience — Object Model Consistency Review

> **Historical record:** Superseded by [`Architecture_Review_V3.md`](../Architecture_Review_V3.md). This report records an earlier Experience-only pass and is not the current cross-collection freeze decision.

## Scope

Reviewed every Markdown file in the supplied Experience archive for:

- unnecessary special logic
- contradictions with the universal Object Model
- type/class language that should be expressed through System Tags
- Theme versus Object identity confusion
- Window/Overlay duplication
- malformed Markdown caused by broken code fences
- stale references to removed document concepts

## Main Corrections

- Anchored Nodes, Connections, Base elements, Workspaces, Companion, Pets, Windows and Notifications to the universal Object Model.
- Clarified that System Tag combinations compose identity and activate Property Schemas; they do not select one exclusive class.
- Reworked Node hierarchy wording around `Node + ProjectRoot`, `Node + Domain`, `Node + Cluster`, `Node + Object` and `Node + Detail`.
- Corrected Detail Nodes so they remain independent Objects rather than non-Objects.
- Replaced remaining Base Overlay language with the universal Environment Window model.
- Separated Window interaction focus from the Tag-based Cosmos Focus system.
- Clarified that Environment Windows are fixed in Version 1 but remain built on a future movable/resizable Window Object foundation.
- Added Runtime Object treatment for Companion Notifications.
- Expanded the previously incomplete Cosmos Transitions document around the universal Shell transition mechanism.
- Repaired broken Markdown structure in `02_System_Projects.md` and `06_Journeyman_Extensibility.md`.
- Clarified that Journeyman is an independent Tool Window inside a Workspace while the Companion remains an independent Entity and visual character.
- Clarified that Files mutations are restricted to the active Project and Archive edits inline in the same Object View.
- Fully cleaned and normalized `03_Prepared_Structures.md`, whose earlier chat formatting had produced heavily indented malformed Markdown.
- Updated Structure Templates so each Node becomes an individual Template Object while grouped structures emerge through Tags and preserved parent-child template relationships.
- Removed stale references to deleted `Creator Projects` and `Project Templates` documents.
- Removed redundant `03_Shell/01_Windows.md`; its rules were already covered more precisely by Window Types, Window System and Multi Display.

## Deliberately Not Changed

- No new product concepts were invented.
- No Product Bible architecture was redesigned.
- No visual wireframes or theme artwork decisions were added.
- No unconfirmed V1 feature scope was promoted or removed.

## Recommended Next Review

The remaining work is primarily V1 scope precision rather than Object Model consistency:

- exact list of V1 System Projects and Tools
- exact physical prepared folder/template manifest
- canonical System Tag vocabulary
- Property Schemas for the first V1 Object combinations
- Future documents for Cosmos, Base and Shell, if the per-folder Future convention remains mandatory
