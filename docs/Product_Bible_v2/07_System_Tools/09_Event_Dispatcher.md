# Event Dispatcher

## Purpose

The Event Dispatcher is the central communication system of the Cosmos Runtime.

It delivers Runtime Events between independent Runtime components without creating direct dependencies.

The Event Dispatcher enables loose coupling throughout Cosmos.

---

# Architectural Position

Event Dispatcher is the Core Runtime component that implements the Event Model's delivery responsibilities.

It is not a System Tool, Extension or Runtime Service.

---

# Philosophy

Runtime components should never communicate directly.

Runtime Services publish completed Event facts. Runtime components subscribe and may react through new Commands or requests to Runtime Services.

This keeps the Runtime modular, extensible and predictable.

The Event Dispatcher coordinates communication.

It never performs business logic.

---

# Responsibilities

The Event Dispatcher is responsible for:

- accepting Runtime Events published by Runtime Services
- delivering Runtime Events
- managing subscriptions
- filtering subscribers
- preserving event order
- isolating failures
- supporting asynchronous communication

The Event Dispatcher never modifies Runtime State.

---

# Runtime Foundation

The Event Dispatcher serves the entire Cosmos Runtime.

Examples include:

- Entity Runtime
- Job Runtime
- Knowledge Runtime
- Review Service
- Bundle Runtime
- Provider Runtime
- Theme Runtime

Runtime Services publish Events for completed actions. Core Runtime components report lifecycle facts through the appropriate existing Service boundary for publication.

Every Runtime component may subscribe.

---

# Event Flow

Every Runtime Event follows the same lifecycle.

```text
Runtime Service

↓

Publish Event

↓

Event Dispatcher

↓

Subscriber Resolution

↓

Delivery

↓

Subscriber Processing
```

Publishers never know who receives an Event.

Subscribers receive the Event's explicit Origin Service field. They do not depend on any Dispatcher implementation detail or know which subscribers received the same Event.

---

# Event Structure

Every Runtime Event contains:

- Event ID
- Event Type
- Timestamp
- Runtime Context at creation
- Origin Service
- zero or more affected Object IDs
- Metadata

Events remain immutable after publication.

---

# Event Categories

Examples include:

## Entity Events

- EntityLoaded
- EntityMoved
- EntityInteractionStarted
- EntityInteractionCompleted

---

## Workspace Events

- WorkspaceOpened
- WorkspaceClosed
- WorkspaceFocused

---

## Project Events

- ProjectOpened
- ProjectClosed
- ProjectFocused

---

## Knowledge Events

- CaptureCreated
- KnowledgeUpdated
- ReviewCreated
- ObjectDiscovered

---

## Job Events

- JobCreated
- JobStarted
- JobCompleted
- JobFailed

---

## Runtime Events

- ThemeChanged
- ProviderChanged
- ExtensionInstalled
- BundleLoaded

Categories remain extensible.

---

# Publishing

Runtime Services publish completed facts after successful transactions.

Examples:

Knowledge Service

↓

KnowledgeProcessed

---

Job Service

↓

JobCompleted

---

Workspace Service

↓

WorkspaceOpened

Publishing never waits for subscribers.

Tools, Entities, Bundles and other clients send Commands to Services; they do not publish authoritative action Events themselves.

---

# Subscription

Runtime components subscribe to relevant Events.

Examples:

Companion

↓

JobCompleted

↓

notify user

---

Analysis Engine

↓

KnowledgeProcessed

↓

send Command or request to the appropriate Runtime Service

Subscriptions remain explicit.

---

# Event Filtering

Subscribers receive only Events matching their subscriptions.

Filtering may consider:

- Event Type
- Runtime Context
- affected Object IDs
- Metadata

Filtering minimizes unnecessary processing.

---

# Event Ordering

Events produced by one transaction are delivered in their transaction order.

No deterministic ordering is guaranteed across independent transactions.

---

# Event Scope

Event propagation scope is derived from Runtime Context and Metadata rather than a competing Event schema field.

Examples include:

- Global
- Project
- Workspace
- Entity

Scope limits unnecessary propagation.

---

# Asynchronous Delivery

Event delivery should remain asynchronous whenever appropriate.

Publishing should never block unrelated Runtime work.

Subscriber processing never changes the already completed transaction.

---

# Reliability

The Dispatcher guarantees:

- at-least-once delivery to matching active subscriptions
- possible duplicate delivery
- transaction-local ordering
- isolated subscriber failures
- safe event propagation

Subscribers remain independent and must be idempotent.

---

# Failure Handling

If one subscriber fails:

- remaining subscribers continue
- Event delivery continues
- failure is logged
- Runtime remains stable

One subscriber never blocks the Event system.

---

# Performance

The Dispatcher should optimize:

- subscriber lookup
- event filtering
- batching
- asynchronous delivery
- memory usage

Performance should scale with Runtime complexity.

---

# Extensibility

Future Extensions may introduce:

- remote Events
- distributed Runtime
- multiplayer Events
- event persistence
- event replay
- monitoring tools

Every extension follows the same Event contract.

---

# Design Goal

The Event Dispatcher should become the nervous system of Cosmos.

Every Runtime component should receive completed facts through Events and request actions through Runtime Services while remaining independent from other component implementations.

---

# Principles

- Components never communicate directly.
- Events are immutable.
- Publication is independent from subscribers.
- Subscription is explicit.
- Delivery is at least once and may contain duplicates.
- Ordering is deterministic only within one transaction.
- Failures remain isolated.
- Scope limits propagation.
- The Event Dispatcher performs coordination only.
