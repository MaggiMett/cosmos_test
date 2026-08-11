# Brain

## Purpose

The Brain coordinates thinking, reasoning and decision making for the Companion.

It receives user intentions from Conversation and Runtime Context through Entity Runtime, coordinates Capability Bundles and may request advanced reasoning through Provider Runtime.

The Brain thinks.

It does not speak.

It does not perform Runtime work.

---

# Architectural Position

The Brain is an internal Companion coordination component.

It is not a Tool, Runtime Service or independent Runtime system.

It is not Journeyman. Journeyman is an independent Tool whose planning and development orchestration may be requested through the normal Journeyman Coordination Capability and Runtime Services.

It coordinates existing Entity Runtime, Bundle Runtime, Knowledge Runtime and Provider Runtime contracts without replacing their ownership.

---

# Philosophy

The Brain is not an AI model.

The Brain is the decision-making system of the Companion.

Artificial Intelligence may extend the Brain's reasoning capabilities.

The Brain always remains responsible for coordinating Companion intelligence.

---

# Responsibilities

The Brain is responsible for:

- interpreting user intentions
- coordinating reasoning
- receiving Runtime Context and requesting task-specific Context Packages
- selecting Capability Bundles
- supplying capability requirements, user and Project preferences, privacy constraints and reasoning requirements to Provider Runtime
- coordinating multi-step workflows
- preparing Runtime requests
- producing structured decisions

The Brain never executes Runtime actions.

---

# Runtime Foundation

The Brain operates on top of:

- Entity Runtime
- Bundle Runtime
- Runtime Context
- Context Builder
- Knowledge Runtime
- Provider Runtime

The Brain owns no Runtime data.

It coordinates existing Runtime systems.

---

# Brain Pipeline

Every request follows the same pipeline.

```text
Conversation

↓

Intent

↓

Brain

↓

Context Package Request

↓

Capability Selection

↓

Provider Runtime Request (optional)

↓

Reasoning

↓

Structured Result

↓

Conversation
```

The Brain remains independent from language generation.

---

# Intent Processing

The Brain receives structured user intent.

Examples include:

- question
- explanation
- brainstorming
- navigation
- planning
- review
- development
- workspace request

Intent determines which Capabilities participate.

---

# Context Package Request

The Brain receives ordinary active Runtime Context through Entity Runtime.

When a request requires task-specific information, the Brain asks Context Builder to assemble a Context Package from a Context Snapshot.

Examples include:

- zero, one or multiple assigned Project scopes
- optional focused or primary Project
- active Workspace session
- selected Objects
- active Review
- running Jobs
- nearby Entities
- installed Bundles

Context Builder resolves the required authorized information through existing Runtime Services and Runtime contracts.

The Brain never scans the system or assembles a Context Package independently.

---

# Capability Coordination

The Brain selects appropriate Capability Bundles.

Example:

User:

"Open my last Review."

↓

Brain

↓

Review Bundle

↓

Workspace Bundle

↓

Conversation

The Brain coordinates.

Bundles perform specialized work.

---

# AI Independence

The Brain always exists.

Without an AI Provider the Brain may still:

- coordinate Bundles
- route Runtime requests
- interpret predefined commands
- use deterministic logic
- support tutorials
- coordinate Entity behavior

Reasoning becomes simpler.

The Companion remains functional.

---

# Provider Request

When advanced reasoning is required, the Brain sends an abstract request to Provider Runtime.

The request may contain:

- required capabilities
- user preferences
- Project preferences
- privacy constraints
- reasoning requirements
- authorized Context Package

Provider Runtime alone discovers availability, matches capabilities, selects and invokes the concrete Provider, routes the request, monitors execution and performs failover. The Brain never selects, invokes or fails over a concrete Provider directly.

---

# Structured Reasoning

Provider Runtime returns standardized structured reasoning results from the selected Provider.

Examples include:

- explanation
- summary
- decision proposal
- suggested action
- generated dialogue
- development plan

The Brain validates every result before using it.

---

# Runtime Requests

If a Runtime action is required:

```text
Brain

↓

Capability Bundle

↓

Entity Runtime

↓

Runtime Service

↓

Result
```

The Brain never bypasses Runtime Services.

---

# Knowledge

The Brain references Knowledge through Runtime Services.

Knowledge remains the authoritative memory.

The Brain never stores independent facts.

---

# Personality

Personality supplies configuration for:

- permitted Behaviour Rule weights
- idle frequency
- communication style
- expression intensity
- suggestion style

Personality never changes factual Runtime information.

It never selects Providers or executes Companion Behaviour.

---

# Multi-Step Coordination

The Brain may coordinate multiple Bundles.

Example:

User:

"Help me implement this feature."

↓

Workspace Bundle

↓

Knowledge Bundle

↓

Review Bundle

↓

Journeyman Bundle

↓

Conversation

This flow requests or focuses independent Journeyman work. The Brain does not become Journeyman and does not host Journeyman execution.

The Brain coordinates the workflow.

Bundles remain specialized.

---

# Error Handling

If reasoning fails:

- Runtime State remains unchanged
- partial reasoning is discarded
- the Companion remains available
- deterministic fallback may be used

Reasoning failures never destabilize the Runtime.

---

# Privacy

The Brain only reasons over:

- authorized Runtime Context
- permitted Runtime Services
- available Capability Bundles

The Brain never bypasses Runtime security.

---

# Extensibility

Future extensions may introduce:

- multiple simultaneous Providers
- specialized reasoning engines
- planning strategies
- domain-specific reasoning
- collaborative reasoning

The Brain remains Provider-independent.

---

# Design Goal

The Brain should coordinate intelligent assistance while remaining completely independent from any specific AI technology.

Changing the Provider should improve reasoning quality without changing how the Companion fundamentally behaves.

---

# Principles

- The Brain is not an AI.
- The Brain coordinates reasoning.
- Provider Runtime selects and invokes Providers; Providers perform reasoning.
- Runtime Context is inherited; task-specific Context Packages come from Context Builder.
- Capability Bundles perform specialized work.
- Runtime Services execute actions.
- Knowledge remains authoritative.
- Personality influences style.
- The Brain remains Provider-independent.
