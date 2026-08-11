# Visual Interaction Function Model

Version: 1.0

Status: Approved

Category: Theme Engine Foundation

---

# Purpose

This document defines the canonical separation between visual presentation, interaction and functionality.

It is the authoritative product model for the Theme Engine, Theme Builder and Base Builder.

Visual appearance, interaction geometry and runtime behaviour are independent systems.

---

# Core Principle

A visual object is always decorative by default.

Nothing becomes interactive unless an Interaction Zone is explicitly created.

Nothing gains functionality unless a Function Binding is explicitly assigned.

Visuals never imply behaviour.

---

# Canonical Model

```text
Visual Asset
        │
                ▼
                Asset Catalog Entry
                        │
                                ▼
                                Visual Object Definition
                                        │
                                                ▼
                                                Visual Object Instance
                                                        │
                                                                │ optional
                                                                        ▼
                                                                        Interaction Zone
                                                                                │
                                                                                        ▼
                                                                                        Interaction Zone Profile
                                                                                                │
                                                                                                        ▼
                                                                                                        Function Binding
                                                                                                                │
                                                                                                                        ▼
                                                                                                                        Function Definition Pack
                                                                                                                                │
                                                                                                                                        ▼
                                                                                                                                        Core Runtime Target
                                                                                                                                        ```

                                                                                                                                        ---

                                                                                                                                        # Responsibilities

                                                                                                                                        ## Visual Asset

                                                                                                                                        A media resource.

                                                                                                                                        Examples:

                                                                                                                                        - PNG
                                                                                                                                        - WebP
                                                                                                                                        - SVG
                                                                                                                                        - WebM
                                                                                                                                        - MP4

                                                                                                                                        A Visual Asset never owns interaction or functionality.

                                                                                                                                        ---

                                                                                                                                        ## Asset Catalog Entry

                                                                                                                                        Makes assets discoverable.

                                                                                                                                        Responsible for:

                                                                                                                                        - name
                                                                                                                                        - description
                                                                                                                                        - previews
                                                                                                                                        - tags
                                                                                                                                        - compatibility
                                                                                                                                        - provenance
                                                                                                                                        - versions

                                                                                                                                        Never responsible for behaviour.

                                                                                                                                        ---

                                                                                                                                        ## Visual Object Definition

                                                                                                                                        Defines a placeable visual object.

                                                                                                                                        Responsible for:

                                                                                                                                        - visual bounds
                                                                                                                                        - render layers
                                                                                                                                        - placement rules
                                                                                                                                        - anchors
                                                                                                                                        - skin compatibility

                                                                                                                                        Never responsible for interaction or runtime behaviour.

                                                                                                                                        ---

                                                                                                                                        ## Visual Object Instance

                                                                                                                                        A placed object inside a Room.

                                                                                                                                        Owns:

                                                                                                                                        - position
                                                                                                                                        - rotation
                                                                                                                                        - scale
                                                                                                                                        - skin overrides
                                                                                                                                        - layer overrides

                                                                                                                                        A Visual Object Instance is pointer-passive by default.

                                                                                                                                        ---

                                                                                                                                        ## Interaction Zone

                                                                                                                                        An optional invisible interaction area.

                                                                                                                                        Owns:

                                                                                                                                        - position
                                                                                                                                        - size
                                                                                                                                        - shape
                                                                                                                                        - focus order
                                                                                                                                        - enabled state

                                                                                                                                        It may be associated with a Visual Object but remains independent.

                                                                                                                                        Without a Function Binding an Interaction Zone has no behaviour.

                                                                                                                                        ---

                                                                                                                                        ## Interaction Zone Profile

                                                                                                                                        Reusable interaction rules.

                                                                                                                                        Examples:

                                                                                                                                        - minimum size
                                                                                                                                        - accessibility
                                                                                                                                        - keyboard navigation
                                                                                                                                        - pointer behaviour
                                                                                                                                        - focus ring

                                                                                                                                        Profiles standardize interaction but never create functionality.

                                                                                                                                        ---

                                                                                                                                        ## Function Definition Pack

                                                                                                                                        Core-owned definitions.

                                                                                                                                        Examples:

                                                                                                                                        - Knowledge Workspace
                                                                                                                                        - Creation Workspace
                                                                                                                                        - Room Transition
                                                                                                                                        - Companion Interaction
                                                                                                                                        - Generic Workspace

                                                                                                                                        Contains only approved behaviour contracts.

                                                                                                                                        Never contains artwork.

                                                                                                                                        ---

                                                                                                                                        ## Function Binding

                                                                                                                                        Connects

                                                                                                                                        - one Interaction Zone
                                                                                                                                        - one Function Definition
                                                                                                                                        - one Core Runtime Target

                                                                                                                                        A Function Binding is the only source of runtime meaning.

                                                                                                                                        ---

                                                                                                                                        # Builder Responsibilities

                                                                                                                                        ## Theme Builder

                                                                                                                                        Responsible for:

                                                                                                                                        - Visual Assets
                                                                                                                                        - Asset Catalog Entries
                                                                                                                                        - Visual Object Definitions
                                                                                                                                        - Skins
                                                                                                                                        - Room Shells
                                                                                                                                        - Surface Materials
                                                                                                                                        - Interaction Zone Profiles

                                                                                                                                        Never responsible for runtime targets.

                                                                                                                                        ---

                                                                                                                                        ## Base Builder

                                                                                                                                        Responsible for:

                                                                                                                                        - selecting Room Shells
                                                                                                                                        - placing Visual Objects
                                                                                                                                        - moving and scaling Visual Objects
                                                                                                                                        - creating optional Interaction Zones
                                                                                                                                        - assigning Interaction Zone Profiles
                                                                                                                                        - creating explicit Function Bindings

                                                                                                                                        The Base Builder never edits Room Shell geometry.

                                                                                                                                        ---

                                                                                                                                        # Workspace Model

                                                                                                                                        Two workspace types exist.

                                                                                                                                        ## Official Workspaces

                                                                                                                                        Provided by Core.

                                                                                                                                        Examples:

                                                                                                                                        - Knowledge Workspace
                                                                                                                                        - Creation Workspace

                                                                                                                                        Always target official runtime descriptors.

                                                                                                                                        ---

                                                                                                                                        ## User Workspaces

                                                                                                                                        Created by users.

                                                                                                                                        Always use the Generic Workspace Definition.

                                                                                                                                        Never replace official workspace definitions.

                                                                                                                                        ---

                                                                                                                                        # Non-Negotiable Rules

                                                                                                                                        - Visuals never create interaction.
                                                                                                                                        - Interaction never creates functionality.
                                                                                                                                        - Functionality is never inferred from artwork.
                                                                                                                                        - Skins never contain runtime logic.
                                                                                                                                        - Theme changes never modify Function Bindings.
                                                                                                                                        - Theme changes never modify Interaction Zones.
                                                                                                                                        - Visual Objects remain decorative unless explicitly connected.

                                                                                                                                        ---

                                                                                                                                        # Migration Notes

                                                                                                                                        The current FunctionContainer model is a compatibility layer.

                                                                                                                                        Future implementations should gradually separate it into:

                                                                                                                                        - Visual Object
                                                                                                                                        - Interaction Zone
                                                                                                                                        - Function Definition Pack
                                                                                                                                        - Function Binding

                                                                                                                                        Legacy adapters may remain until runtime migration is complete.
