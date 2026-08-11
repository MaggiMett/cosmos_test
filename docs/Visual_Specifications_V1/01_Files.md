# Files

**Version:** 1.0  
**Status:** Authoritative  
**Category:** Tool

---

# Purpose

Files provides access to the project's raw files.

It allows users to browse, organize, preview and manage project resources within Cosmos.

Files should remain familiar, efficient and unobtrusive.

Files is always scoped to the active Cosmos Project. It never exposes or modifies arbitrary user files outside that Project's registered physical roots.

---

# Overview

Files is an independent Tool Window.

It provides a traditional file management experience while remaining visually integrated into the Cosmos design language.

Files focuses on productivity rather than visual complexity.

---

# Window Layout

Every Files Window consists of:

- Toolbar
- Navigation Area
- File Area

---

## Toolbar

The Toolbar provides quick access to common actions.

Version 1 includes:

- New
- Upload
- Edit
- Rename
- Move
- Delete
- Search
- View Mode

The Toolbar should remain compact.

---

## Navigation Area

The Navigation Area displays the project's directory structure.

It uses a traditional expandable tree.

Users should always understand where they are within the project.

Navigation uses project-relative locations rather than operating system paths.

The navigation root cannot escape the active Project. Connected repositories appear only when they are registered to that Project.

---

## File Area

The File Area displays the contents of the selected directory.

Users may switch between:

- Grid View
- List View

Both views provide the same functionality.

---

## Preview

Selecting a file immediately displays its preview.

No additional interaction is required.

Preview behavior depends on the selected file type.

---

# Visual Identity

Files is recognized by:

- familiar file management layout
- clean organization
- efficient navigation
- minimal visual distraction

The Tool should always prioritize clarity.

---

# Cosmos Theme

## Appearance

Files follows the active Cosmos Theme.

The Tool should remain visually calm to keep attention on the project files.

---

## Icons

Every file type uses an appropriate icon.

Folders remain visually distinct from files.

---

## File Cards

Grid View displays files as compact cards.

List View emphasizes readability and information density.

---

# Visual States

Files supports:

- default
- file selected
- multiple files selected
- drag operation
- search active
- create or upload in progress
- rename or move in progress
- delete confirmation
- external-change conflict

State changes should remain subtle.

---

# Animations

Version 1 animations remain restrained.

Examples include:

- folder expansion
- view switching
- file selection
- drag feedback

Animations should improve readability without slowing interaction.

---

# Future

Possible future additions include:

- split view
- favorites
- pinned folders
- version indicators
- integrated media previews
- advanced search filters
