# Entity Behaviour

## Purpose

Entity Behaviour defines how an Entity naturally behaves inside Cosmos.

Behaviour allows Entities to react, move, interact and express personality without requiring an AI Provider.

Behaviour transforms Runtime Events into believable actions.

---

# Architectural Position

Entity Behaviour is an Entity Runtime contract.

It is not a System Tool, Runtime Service or independent Runtime system.

Behaviour configuration belongs to the Entity definition. Entity Behaviour owns active Rule execution, state transitions, scheduling, priorities, cooldowns and interruption handling within Entity Runtime.

---

# Philosophy

An Entity should feel alive even when no AI Provider is available.

Behaviour validation, state transitions and action execution are deterministic.

Personality influences Behaviour.

AI may enhance Behaviour.

It never replaces it.

---

# Responsibilities

Entity Behaviour is responsible for:

- selecting reactions
- validating and executing Behaviour Rules
- performing deterministic state transitions
- scheduling eligible Rules
- resolving priorities
- executing idle behaviour
- responding to Runtime Events
- controlling interaction flow
- coordinating animations
- expressing personality
- respecting cooldowns
- handling interruptions
- maintaining natural pacing

Behaviour never performs business logic.

---

# Behaviour Model

Behaviour consists of independent Behaviour Rules.

Each Rule contains:

- trigger
- conditions
- priority
- cooldown
- optional probability or selection weight
- resulting actions

Rules remain independent.

Multiple Rules may coexist.

---

# Behaviour Categories

Initial categories include:

## Idle

Natural behaviour while nothing important happens.

Examples:

- looking around
- stretching
- sitting
- walking
- observing
- sleeping

---

## Reactive

Behaviour triggered by Runtime Events.

Examples:

- user enters Room
- Job completed
- Review created
- Project focused
- Tool opened

---

## Interactive

Behaviour involving another Entity or the User.

Examples:

- greeting
- petting
- waving
- following
- pointing

---

## Working

Behaviour while assisting.

Examples:

- reading Review
- highlighting Objects
- waiting
- presenting progress

---

## Emotional

Behaviour expressing current mood.

Examples:

- excited
- curious
- relaxed
- surprised
- focused

Emotion changes presentation.

Emotion may also be an explicit input to configured Rule eligibility or weights. It never executes a Rule, performs a state transition, changes Runtime permissions or owns Runtime State.

---

# Behaviour Rule

A Behaviour Rule contains:

```text
Trigger

↓

Conditions

↓

Priority

↓

Optional Probability / Selection Weight

↓

Cooldown

↓

Actions
```

Rules should remain simple and understandable.

---

# Triggers

Examples include:

- Runtime Event
- Timer
- User interaction
- Entity interaction
- State transition
- Workspace change
- Project change

Triggers initiate Behaviour.

---

# Conditions

Rules execute only when conditions are satisfied.

Examples:

- Entity is visible
- Entity is awake
- Companion not talking
- User present
- same Workspace
- Review exists

Conditions prevent unrealistic behaviour.

---

# Priority

Multiple Rules may become valid simultaneously.

Priority determines which Rule executes first.

Suggested priorities:

- Critical
- Important
- Normal
- Ambient

Higher priority Rules may interrupt lower priority Rules.

---

# Probability

Behaviour should not become repetitive.

Rule selection is deterministic by default. A Rule may participate in probabilistic selection only when probability or selection weight is explicitly configured.

Probability never overrides priority, conditions or cooldowns. Entity Behaviour first determines the eligible highest-priority Rules, then applies explicitly configured probabilistic selection within that permitted set.

Example:

```text
Idle Look Around

Probability

35%
```

Configured randomness creates natural variation.

The same eligible Rules, configuration and recorded seed produce the same selection. When recovery, testing or replay requires reproducibility, Entity Behaviour records the seed or the selected Rule with the existing execution record.

---

# Cooldown

Every Rule may define a cooldown.

Examples:

- greeting
- idle speech
- waving
- reminders

Cooldown prevents spam.

---

# Behaviour Queue

Entity Behaviour maintains the Behaviour Queue within Entity Runtime.

Rules enter the queue after validation.

Only executable Rules become active.

The queue keeps behaviour orderly.

---

# Personality Influence

Personality supplies configuration input to Behaviour.

Examples:

Curious

↓

looks around frequently

---

Calm

↓

longer idle periods

---

Energetic

↓

moves more often

Personality may adjust only permitted Rule weights, idle frequency, communication style, expression intensity and suggestion style.

It never executes or replaces Behaviour Rules, performs state transitions, changes Permissions or owns Runtime State.

---

# AI Influence

AI may extend Behaviour.

Examples:

- generate natural dialogue
- explain Reviews
- suggest actions

AI may never bypass:

- Behaviour Rules
- Permissions
- Runtime Services

---

# Entity Interaction

Behaviour may involve another Entity.

Example:

```text
Companion

↓

sees Pet nearby

↓

Pet Interaction Rule

↓

walk

↓

pet

↓

Pet happy animation

↓

return to Idle
```

Both Entities execute their own Behaviour independently.

---

# User Interaction

Behaviour may react to Users.

Examples:

- user approaches
- user waves
- user clicks
- user starts Project

The Runtime validates every interaction.

---

# Interruptions

Entity Behaviour owns interruption handling.

Examples:

- higher priority Rule
- user request
- Runtime shutdown
- Workspace change

Interrupted Behaviour should return to a safe State whenever possible.

The interruption decision and resulting state transition are deterministic for the same inputs and selected Rule.

---

# Idle Behaviour

Idle Behaviour should make Cosmos feel alive.

Examples:

- reading
- stretching
- observing Workspace
- sitting on furniture
- interacting with Pets
- following the user with the eyes

Idle Behaviour should remain subtle.

It must never distract from productive work.

---

# Behaviour Packs

Non-Theme Extensions may provide Behaviour Packs through the existing Extension contract.

Themes may provide animation and presentation mappings for Behaviour results, but they never provide, add, remove or modify Behaviour Rules.

Examples:

Fantasy

↓

dragon behaviour

---

Sci-Fi

↓

robot behaviour

---

Minecraft

↓

Allay behaviour

Behaviour Packs extend Behaviour Rules.

They never replace the Runtime.

Changing a Theme never changes Behaviour Pack assignment or execution.

---

# Persistence

Behaviour configuration is persistent.

Persistent Behaviour configuration is written through Runtime Services and the Persistence Layer.

Entity Behaviour never accesses Persistence directly.

Temporary Behaviour execution is not.

After restart the Runtime restores:

- Personality
- Behaviour configuration
- current State

Behaviour resumes naturally.

---

# Failure Handling

Invalid Behaviour Rules are ignored.

The Runtime reports validation failures.

One invalid Rule must never stop an Entity.

---

# Extensibility

Future extensions may introduce:

- advanced emotions
- schedules
- group behaviour
- weather reactions
- collaborative behaviours
- seasonal behaviour

Every extension follows the same Behaviour contract.

---

# Design Goal

Behaviour should make Entities feel believable without becoming unpredictable.

Users should quickly recognize patterns while still enjoying small moments of surprise and personality.

---

# Principles

- Behaviour is data-driven.
- Behaviour validation, state transitions and action execution are deterministic.
- Rule selection is probabilistic only when explicitly configured and is reproducible from a seed or recorded selection when required.
- Personality configures permitted Behaviour parameters but never executes Behaviour.
- AI extends Behaviour.
- Rules remain independent.
- Runtime validates execution.
- Cooldowns prevent repetition.
- Behaviour should enrich—not interrupt—the user's work.
