# Settings

## Purpose

The Companion Settings System allows users to configure every aspect of the Companion while preserving its identity and Runtime architecture.

Settings customize the Companion.

They never redefine it.

---

# Philosophy

Every user should be able to shape the Companion into their preferred assistant.

Customization should never require changes to Runtime architecture or Capability Bundles.

Settings modify configuration.

They never modify implementation.

---

# Responsibilities

The Settings System is responsible for:

- Companion customization
- Personality configuration
- Avatar selection
- Provider preferences
- Bundle configuration
- interaction preferences
- privacy configuration
- accessibility options

Settings never execute Runtime logic.

They never select Providers, execute Behaviour Rules, perform state transitions or own Runtime State.

---

# Runtime Foundation

Settings operate on top of:

- Entity Runtime
- Bundle Runtime
- Personality System
- Provider Runtime
- Theme System

The Settings System stores configuration only.

---

# Identity Settings

Users may configure:

- display name
- preferred pronouns (optional)
- greeting style
- introduction behavior

The immutable Entity ID never changes.

---

# Personality Settings

Users may adjust:

- friendliness
- humor
- curiosity
- proactivity
- emotional expression
- formality
- communication style

These settings modify the active Personality Profile as configuration input. Personality does not execute Behaviour.

---

# Conversation Settings

Users may configure:

- proactive conversation
- idle dialogue
- notification frequency
- interruption behavior
- voice interaction
- preferred response length

Conversation always remains optional.

---

# Provider Settings

Users may configure:

- preferred Provider
- preferred model
- Provider priority
- local/cloud preference
- fallback behavior
- reasoning limits

Brain may include these preferences in an abstract Provider request. Provider Runtime remains the sole owner of capability matching, concrete Provider selection, routing, availability and failover.

---

# Capability Bundle Settings

Every installed Bundle may expose its own configuration.

Examples include:

- Review reminders
- suggestion frequency
- Job notifications
- Workspace assistance
- Repository assistance

Bundle settings remain isolated.

---

# Avatar Settings

Users may configure:

- Avatar
- colors
- accessories
- idle animations
- visual effects
- sound effects

Avatar settings affect presentation only.

---

# Behaviour Settings

Users may configure:

- idle frequency
- movement frequency
- follow behavior
- interaction frequency
- ambient animations

These values configure Entity Behaviour parameters only. Entity Behaviour remains the execution owner for Rules, state transitions, scheduling, priorities, cooldowns and interruptions.

---

# Privacy Settings

Users control:

- cloud Providers
- local Providers
- shared Runtime Context
- telemetry
- stored credentials

Privacy remains transparent.

---

# Accessibility

Users may enable:

- reduced motion
- simplified animations
- larger interaction targets
- subtitles
- high contrast visuals
- quiet mode

Accessibility should never reduce functionality.

---

# Scope

Settings may exist in multiple scopes.

## Global

Apply everywhere.

---

## Project

Apply only inside one Project.

---

## Workspace

Apply only while one Workspace is active.

Workspace settings override Project settings.

Project settings override Global settings.

---

# Synchronization

Settings may optionally synchronize between Cosmos installations.

Synchronization remains entirely user controlled.

Sensitive information is never synchronized without explicit approval.

---

# Import and Export

Users may:

- export Companion configuration
- import Companion configuration
- reset to defaults
- duplicate profiles

Configuration remains portable.

---

# Failure Handling

If a setting cannot be applied:

- previous configuration remains active
- Runtime continues safely
- the user receives a clear explanation
- unsupported settings are ignored gracefully

---

# Extensibility

Future Extensions may contribute additional Settings.

Examples include:

- VR settings
- voice settings
- accessibility packs
- custom interaction modules
- new Capability Bundle configuration

Extensions integrate into the same Settings System.

---

# Design Goal

The Settings System should allow users to shape the Companion into a personal long-term assistant without affecting the stability or architecture of Cosmos.

Users customize the experience.

The Runtime preserves consistency.

---

# Principles

- Settings customize.
- Runtime remains authoritative.
- Identity remains constant.
- Personality is configurable.
- Providers are replaceable.
- Capability Bundles remain independent.
- Accessibility is first-class.
- Users remain in control.
