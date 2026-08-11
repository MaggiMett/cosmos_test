# Entity Runtime

## Purpose

The Entity Runtime manages every active Entity inside Cosmos.

It controls Entity lifecycle, scope, movement and interaction, hosts active Entity State, and coordinates Entity Behaviour while keeping Entities independent from AI Providers and visual Themes.

The Entity Runtime makes Cosmos feel inhabited.

---

# Architectural Position

Entity Runtime is Core Runtime infrastructure.

It is not a System Tool, Extension or Runtime Service.

It resolves Entity definitions through the shared Registry System, coordinates active Entity lifecycle and calls Runtime Services for business actions and durable changes.

---

# Philosophy

Entities should feel alive without requiring artificial intelligence.

The Runtime provides predictable behavior through States, Events, Rules and Permissions.

AI may extend an Entity.

It is never required for the Entity to exist or function.

---

# Responsibilities

The Entity Runtime is responsible for:

- loading Entities
- activating Entities by Scope
- hosting active Entity State and recovery
- managing movement and position
- routing Runtime Events
- delivering Behaviour inputs and results
- coordinating animations
- managing Entity interactions
- preserving Entity Runtime State
- suspending and unloading Entities safely

The Entity Runtime never owns business logic.

Entity Behaviour owns Behaviour Rule execution, state transitions, scheduling, priorities, cooldowns and interruption handling within Entity Runtime.

---

# Entity Lifecycle

Every Entity follows the same Runtime lifecycle.

```text
Registered

↓

Loaded

↓

Initialized

↓

Active

↓

Idle / Acting

↓

Suspended

↓

Unloaded
```
The Runtime controls every transition.

Entities never activate themselves.

Registration

Before an Entity may enter the Runtime, it must be registered.

Registration resolves:

immutable Object ID used as the Entity ID
Entity Role
Runtime Scope
Behaviour Profile
Avatar definition
Permissions
dependencies
required Runtime API version

Invalid Entities never become active.

Initialization

During initialization the Runtime:

validates Entity configuration
resolves Avatar and Skin
restores Runtime State
resolves Scope
subscribes to permitted Events
loads Behaviour Rules
preflights declared Permissions for activation feedback

Only successfully initialized Entities become active.

Scope Activation

Entities activate according to their Scope.

Global Scope

Active throughout Cosmos.

Example:

Companion

Room Scope

Active only while the assigned Room is loaded.

Example:

Room Guide

Workspace Scope

Active only while the assigned Workspace is active.

Example:

Workspace Assistant

Project Scope

Active only while the assigned Project is loaded or focused.

Example:

Project Worker

Scope changes never destroy the Entity.

They only activate, suspend or relocate it.

Runtime State

Every active Entity has one primary Runtime State.

Initial States include:

Idle
Moving
Observing
Interacting
Working
Talking
Sleeping
Suspended

Extensions may introduce additional States.

States describe current behavior.

They do not define identity or permissions.

State Transitions

State changes occur through explicit Runtime transitions.

Entity Behaviour validates and performs every state transition deterministically. Entity Runtime stores and exposes the resulting active State.

Example:

Idle

↓

UserEnteredBase

↓

Observing

↓

GreetingAnimation

↓

Idle

Invalid transitions are rejected.

One Entity should never exist in conflicting primary States simultaneously.

Behaviour Rules

Behaviour Rules define how an Entity reacts without AI.

A Rule contains:

triggering Event
required conditions
resulting State
optional animation
optional Runtime Command
cooldown
priority

Example:

Event:
UserEnteredBase

Conditions:
Entity is awake
Entity is visible

Result:
Face user
Play wave animation
Return to Idle

Behaviour Rule validation, condition evaluation, state transitions and action execution are deterministic. Rule selection is deterministic by default and may be probabilistic only when explicitly configured; a seed or recorded selection makes that choice reproducible when required.

Event Processing

Entities react to Runtime Events.

Examples include:

UserEnteredBase
ProjectFocused
WorkspaceOpened
ToolOpened
ReviewCreated
JobCompleted
ThemeChanged
EntityInteractionRequested

Entities never poll the Runtime continuously.

Event-driven behavior reduces unnecessary work and creates predictable reactions.

Event Priority

Entity Behaviour applies Event and Rule priorities.

Initial priorities include:

Ambient
Normal
Important
Critical

Ambient Behaviour may be interrupted.

Critical Runtime actions may not be interrupted without explicit cancellation.

Cooldowns

Entity Behaviour schedules and enforces configured cooldowns for repeated Behaviours.

Examples include:

greeting
idle speech
pointing toward Review
reacting to completed Jobs

Cooldowns prevent repetitive or annoying behavior.

Movement

The Entity Runtime manages movement.

Movement may include:

walking
following
approaching
returning
sitting
relocating between Runtime spaces

Movement remains independent from Avatar animation.

The Runtime defines destination and movement intent.

The Avatar defines visual execution.

Position

Every Entity maintains a Runtime position.

Position may include:

Runtime space
Room
Workspace
Project
local coordinates
orientation
current anchor

Positions are persistent when appropriate.

Anchors

Entities may attach to Anchors.

Examples include:

chair
desk
Companion marker
Workspace interaction point
Pet resting area

Anchors belong to the current visual environment.

Entity identity remains independent from them.

Animation Coordination

The Entity Runtime requests animation states.

Examples include:

idle
walk
wave
sit
sleep
point
interact
work

Themes and Avatar Skins provide the actual animation assets.

Missing optional animations must degrade gracefully.

Entity Interaction

Entities may interact with:

users
other Entities
Rooms
Workspaces
Tools
Objects

Every interaction passes through the Entity Interaction contract.

Entities never manipulate another Entity directly.

Entity-to-Entity Interaction

Entity interactions are coordinated by the Runtime.

Example:

Companion

↓

Pet interaction requested

↓

Permission preflight and proximity validation

↓

Petting animation

↓

Pet reaction

↓

Both return to Idle

Both Entities maintain independent State.

The Runtime coordinates the shared action.

Tool Use

Permitted Entities may request Tool actions.

Example:

User Request

↓

Support Entity

↓

Open Archive

↓

Non-Authoritative Permission Preflight

↓

Workspace Service

↓

Archive Tool Instance

The Entity never controls the Tool directly.

Workspace Service performs the authoritative permission and business validation before executing the action. Entity Runtime preflight is feedback only.

Work Execution

Entities with suitable Roles may request work.

Examples include:

open a Tool
navigate to an Object
display a Review Item
start a user-confirmed Job
request Journeyman assistance

All actions require authoritative permission validation by the Runtime Service receiving the Command.

Autonomous destructive work is never permitted by default.

AI Integration

The Entity Runtime does not depend on AI.

When an Entity requires intelligent conversation or reasoning, it may request an AI capability through the Provider Runtime.

The Entity Runtime remains responsible for:

current State
Context
permission preflight feedback
presentation
resulting Runtime actions

The Provider only returns generated intelligence.

Personality

Personality supplies configuration input to Entity Behaviour.

Examples include:

idle frequency
communication tone
permitted Rule weights
expression intensity
suggestion style

Personality never executes Behaviour Rules, performs state transitions, owns Runtime State or changes Permissions.

Runtime Context

Entities receive Runtime Context.

Context may include:

active Project
active Room
active Workspace
selected Object
inherited Tags
available Tools
running Jobs

Entities never determine Context independently.

Persistence

Persistent Entity data may include:

position
Runtime Scope
selected Avatar
Personality Profile
Behaviour configuration
authorized interaction familiarity data
last active State

Persistent Entity data is written through Runtime Services and the Persistence Layer.

Entity Runtime never accesses Persistence directly.

Temporary animation progress is not persisted.

Recovery

After unexpected shutdown the Entity Runtime restores:

active Entities
last valid position
last stable State
current Scope
interrupted non-destructive interactions where possible

Entities should resume from a safe State.

Failure Handling

If one Entity fails:

the Entity is isolated
its State is preserved when possible
the Runtime continues operating
other Entities remain unaffected
the user receives a clear explanation when relevant

One Entity must never destabilize Cosmos.

Performance

Ambient Entities should remain lightweight.

The Runtime should limit:

unnecessary updates
background animation work
repeated Event reactions
simultaneous complex interactions

Inactive or invisible Entities may be suspended.

Extensibility

Future extensions may introduce:

new Entity Roles
new States
new Behaviour Rules
new movement systems
collaborative Entities
advanced Entity interactions

Every extension follows the same Entity Runtime contract.

Design Goal

The Entity Runtime should make Cosmos feel alive without making it unpredictable.

Entities should react naturally, remain understandable and respect the user's attention at all times.

Principles
Entities live without AI.
Runtime controls lifecycle.
Scope controls availability.
Behaviour Rules may react to completed Event facts.
Behaviour validation and state transitions are deterministic; explicitly configured probabilistic Rule selection is reproducible from a seed or recorded selection when required.
Runtime Services authoritatively enforce Permissions for Runtime actions.
Runtime Services execute work.
Avatars define presentation.
Failures remain isolated.
Entities respect user attention.
