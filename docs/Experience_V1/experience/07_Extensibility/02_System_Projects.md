# System Projects

**Version:** 1.0
**Status:** Foundation
**Category:** Experience

---

# Purpose

This document defines System Projects inside Cosmos.

System Projects use the same universal Project architecture as every other Project.

They are distinguished only by their purpose and their System Tags.

A System Project extends Cosmos itself.

A User Project extends the user's world.

---

# Design Philosophy

Cosmos should use its own universal systems wherever possible.

System capabilities should not be implemented as separate applications or isolated modules when they can exist as Projects, Workspaces, Tools and Objects inside the Cosmos.

System Projects therefore use the same structures and interaction principles as User Projects.

They are part of the Cosmos rather than interfaces placed outside it.

---

# Universal Project Model

A System Project is not a separate Project class.

It is a normal Project identified through System Tags.

Example:

```text
Project
System
Workspace
```

The `System` Tag indicates that the Project extends the capabilities of Cosmos itself.

No additional System Project architecture exists.

# System Project Purpose

A Project is considered a System Project when its primary purpose is to extend Cosmos.

Examples include:

- Knowledge Workspace
- Creation Workspace
- Graphics Workspace
- Theme Workspace
- future Workspace environments
- future Tool development environments
- future Entity editors

A Project is not a System Project merely because it is important or installed by default.

Its role is determined by what it extends.

# User Project Comparison

User Projects expand the user's own worlds, ideas or products.

Examples include:

Mettventures
Fitness Tracker
Game Projects
Applications
Stories
Research Projects

Example:

Project
Game

A Vehicle Creator that introduces a new universal Cosmos Entity may be a System Project.

A Vehicle system created only for one Game Project remains part of that User Project.

# Version 1 System Projects

Version 1 provides the following System Projects:

Knowledge Workspace
Creation Workspace
Graphics Workspace

Each System Project possesses the same prepared structure as every other Project, including:

Knowledge
Files
Themes
Workspaces
Templates
Extensions

The initial Workspace of each Project provides access to its intended system capabilities.

# Workspace Integration

Opening the Workspace of a System Project uses the same navigation mechanics as every other Project.

The Cosmos camera moves to the corresponding Project Galaxy.

The Project position activates the relevant Tags.

The Workspace, Tools, Companion and other systems inherit the resulting context automatically.

System Projects do not introduce a separate context mechanism.

# Extending System Projects

System Projects may grow over time.

Users may:

add Tools
add Workspaces
add Templates
change Themes
create new Nodes
reorganize their structure
extend their Knowledge

New system capabilities should preferably become Objects and Tools inside existing or new System Projects.

# Deletion

Version 1 allows System Projects to be deleted.

Version 1 is primarily intended for a single owner who retains full control over the Cosmos.

Future versions may introduce protection, restoration or Core markers if required for broader distribution.

These future protections must extend the existing Tag-based model rather than introducing a separate Project type.

# Updates

Cosmos updates may add new Tools, Templates or Objects to existing System Projects.

User-created content and system-provided content remain separate Objects.

If a user-created Tool and a later system-provided Tool perform the same function, both remain available.

Cosmos does not automatically merge or replace them.

The user decides which Object to use or remove.

# Object Identity

System origin does not make two Objects identical.

Every Tool, Template, Workspace and other Project Object retains its own identity.

Cosmos should avoid hidden deduplication or automatic replacement based only on similar purpose.

This preserves user control and prevents unexpected changes.

# Theme Support

System Projects may use the global Theme or define their own Project Theme Overrides.

Their appearance may change completely without changing:

Project behavior
Workspace behavior
Tool behavior
Tag context
prepared structure

System Projects remain fully compatible with every Theme.

# Future

Future versions may introduce additional System Projects for capabilities such as:

Game creation
Entity creation
Audio creation
Automation
Extension development
Companion creation
Tool development

A future Project should receive the System Tag only when it extends Cosmos itself.

# Experience Goals

System Projects should always feel:

integrated
familiar
editable
expandable
consistent

Users should experience system capabilities as natural parts of their Cosmos rather than separate applications.

# Design Principles

System Projects are normal Projects.

The System Tag describes purpose, not class.

System Projects extend Cosmos itself.

User Projects extend the user's world.

System updates add Objects rather than silently replacing user work.

The user remains in control.

# Scope

This document defines the Experience role of System Projects.

Automatic Project preparation, Prepared Structures and Structure Templates are documented separately.
