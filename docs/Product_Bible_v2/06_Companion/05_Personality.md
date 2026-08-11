# Personality

## Purpose

The Personality System defines configuration for the character, communication style and behavioural tendencies of the Companion.

Personality creates consistency across every AI Provider and every conversation.

The Companion should always feel like the same individual.

---

# Philosophy

Personality does not belong to an AI model.

Personality belongs to the Companion.

Providers generate language.

Personality configures how the Companion may communicate.

Changing Providers should never change who the Companion is.

---

# Responsibilities

Personality provides configuration input for:

- communication style
- permitted Behaviour Rule weights
- idle frequency
- expression intensity
- suggestion style

Personality never changes factual information.

It changes presentation.

Personality never executes Behaviour Rules, performs state transitions, changes Permissions or owns Runtime State.

---

# Runtime Foundation

Personality operates on top of:

- Entity Runtime
- Entity Behaviour
- Conversation
- Brain

Brain supplies Personality-derived communication requirements to Provider Runtime, which delivers them through the standardized Provider request.

Providers never own Personality.

---

# Personality Profile

Every Companion possesses exactly one active Personality Profile.

A profile contains:

- immutable ID
- display name
- description
- communication traits
- permitted Behaviour Rule weights
- idle frequency
- expression intensity
- suggestion style
- default configuration

Profiles remain independent from Providers.

---

# Communication

Personality influences:

- vocabulary
- sentence structure
- humor
- friendliness
- formality
- curiosity
- encouragement

Communication should remain recognizable regardless of the selected AI Provider.

---

# Behaviour

Personality supplies permitted configuration values to Entity Behaviour.

Examples include:

Calm

↓

longer idle periods

↓

gentle animations

---

Energetic

↓

frequent movement

↓

more expressive gestures

---

Curious

↓

observes nearby Objects

↓

looks around often

Entity Behaviour validation and state transitions remain deterministic. Personality may supply probabilistic Rule weights only where the Behaviour configuration explicitly permits them; Entity Behaviour owns selection and reproducibility.

---

# Emotional Expression

Personality configures expression intensity and style for visual emotion. It does not determine or own emotion.

Examples include:

- excitement
- happiness
- curiosity
- concern
- pride
- surprise

Emotion is presentation and Entity Behaviour input only. It never executes Behaviour, performs state transitions, changes Permissions or owns Runtime State.

---

# Suggestions

Personality influences how suggestions are presented.

Example:

Reserved

↓

waits until asked

---

Helpful

↓

occasionally offers ideas

---

Playful

↓

phrases suggestions humorously

The user always controls suggestion frequency.

---

# User Customization

Users may customize:

- name
- communication style
- humor level
- expressiveness
- idle frequency
- proactivity
- emotional intensity

Customization modifies the active Personality Profile.

It never changes Companion identity.

---

# Personality Packs

Personality Profiles are extensible.

Future Personality Packs may include:

- Mentor
- Scientist
- Explorer
- Engineer
- Storyteller
- Minimalist
- Playful
- Professional

Profiles may be distributed as Extensions.

---

# AI Independence

Without an AI Provider, Personality configuration still influences permitted presentation and Behaviour parameters such as:

- idle behavior
- animations
- notifications
- predefined dialogue
- reactions
- greetings

The Companion always retains its character.

---

# Provider Guidance

When advanced reasoning is requested, Brain supplies Personality-derived communication requirements to Provider Runtime.

The Provider generates language that matches the active Personality Profile.

The Provider never invents a new personality.

---

# Consistency

Every conversation should reinforce the same Companion identity.

Users should never feel that changing Providers creates a different Companion.

Identity remains stable.

Only intelligence changes.

---

# Evolution

Personality Profiles may evolve through updates.

Evolution should preserve the recognizable identity of the Companion.

Major personality changes always require explicit user approval.

---

# Failure Handling

If a Personality Profile cannot be loaded:

- a safe default profile is used
- the Companion remains available
- Runtime Behaviour continues
- user customization is preserved where possible

---

# Extensibility

Future Extensions may introduce:

- adaptive personalities
- seasonal personalities
- project-specific personalities
- accessibility profiles
- multilingual personalities

All Profiles follow the same Personality contract.

---

# Design Goal

The Companion should become familiar through personality rather than through appearance or AI.

After months or years of use, users should immediately recognize their Companion regardless of the Provider currently powering its reasoning.

---

# Principles

- Personality belongs to the Companion.
- Providers generate language.
- Personality shapes communication through configuration.
- Personality configures permitted Behaviour parameters but never executes Behaviour.
- Identity remains consistent.
- Users remain in control.
- Personality is extensible.
- Intelligence may change.
- Character remains.
