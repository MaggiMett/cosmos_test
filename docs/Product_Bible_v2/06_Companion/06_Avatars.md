# Avatars

## Purpose

The Avatar System defines the visual representation of the Companion.

An Avatar provides appearance, animations, visual effects and interaction points while remaining completely independent from the Companion's identity, Personality and intelligence.

Avatars are visual representations.

They are not the Companion itself.

---

# Philosophy

The Companion should always remain recognizable through its Personality rather than its appearance.

Changing the Avatar should feel like changing clothes rather than replacing the Companion.

Identity remains constant.

Appearance is customizable.

---

# Responsibilities

The Avatar System is responsible for:

- visual appearance
- animations
- expressions
- visual effects
- interaction points
- sounds
- rendering configuration

Avatars never define Runtime behavior.

They never own Entity State or emotion and never execute Behaviour Rules or state transitions.

---

# Runtime Foundation

Avatars operate on top of:

- Entity Runtime
- Entity Behaviour
- Entity Interaction
- Theme System

The Avatar receives Entity State and presentation emotion.

It never creates Runtime State.

---

# Avatar Identity

Every Avatar possesses:

- immutable Avatar ID
- display name
- description
- compatible Entity types
- animation set
- visual assets
- interaction configuration

Avatar IDs remain immutable.

Display names may change.

---

# Avatar Components

An Avatar may contain:

- model
- sprite
- textures
- materials
- animations
- particle effects
- sounds
- interaction markers
- facial expressions

The implementation depends on the active Theme.

---

# Animation

Avatars provide animations for Runtime States.

Examples include:

- idle
- walk
- run
- sit
- sleep
- wave
- point
- celebrate
- pet
- think
- talk

Entity Behaviour determines the Behaviour result and state transition; Entity Runtime conveys the resulting animation state.

The Avatar performs them.

---

# Expressions

Avatars may visually express emotions.

Examples include:

- happiness
- curiosity
- excitement
- surprise
- concern
- pride
- relaxation

Expressions visualize the current presentation emotion and configured expression intensity.

They never create or change emotion, Behaviour, Permissions or Runtime State.

---

# Themes

Avatars belong to Themes.

Every Theme may completely replace:

- appearance
- animations
- sounds
- particle effects
- expressions

Changing Themes automatically replaces compatible Avatars.

---

# Avatar Packs

Themes may provide multiple Avatars.

Examples:

Fantasy Theme

- Dragon
- Wizard
- Fairy

Sci-Fi Theme

- Alien
- Robot
- Drone

Minecraft Theme

- Allay
- Villager
- Fox

Users choose freely.

---

# User Customization

Users may customize:

- Avatar
- colors
- accessories
- idle animations
- visual effects
- sound effects

Customization affects presentation only.

---

# Runtime State

The Avatar reflects Entity Runtime State.

Examples:

Idle

↓

Idle Animation

---

Walking

↓

Walk Animation

---

Sleeping

↓

Sleep Animation

The Avatar never owns Runtime State.

It likewise visualizes emotion without owning it.

---

# Interaction

Avatars provide visual interaction.

Examples include:

- waving
- pointing
- petting
- hugging
- sitting
- looking at the user
- looking at another Entity

The Runtime coordinates interactions.

The Avatar visualizes them.

---

# AI Independence

Avatars function without AI Providers.

Movement, animation and interaction remain fully available even when advanced reasoning is unavailable.

Appearance never depends on AI.

---

# Accessibility

Future Avatar implementations may support:

- reduced animation mode
- simplified visual effects
- high contrast themes
- accessibility-focused expressions

Accessibility remains independent from Personality.

---

# Extensibility

Future Extensions may introduce:

- animated companions
- 2D avatars
- VR avatars
- holograms
- voxel avatars
- procedural avatars

Every Avatar follows the same Avatar contract.

---

# Design Goal

The Avatar should make the Companion feel visually alive while remaining completely interchangeable.

Users should recognize their Companion because of its Personality—not because of its model.

---

# Principles

- Avatars define appearance.
- Personality defines character.
- Entity Behaviour owns Behaviour execution and state transitions.
- Themes define visuals.
- AI never defines appearance.
- Avatars are replaceable.
- Runtime State is visualized.
- Identity remains constant.
