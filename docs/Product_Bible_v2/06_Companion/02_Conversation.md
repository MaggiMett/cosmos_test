# Conversation

## Purpose

Conversation allows the Companion to communicate naturally with the user.

It transforms Runtime Context, Knowledge and optional AI capabilities into meaningful dialogue.

Conversation is a Capability.

It is not the Companion itself.

---

# Philosophy

Conversation should feel like speaking with the Companion rather than interacting with a language model.

The user communicates with the Companion.

The Companion may choose to use an AI Provider to formulate responses.

Conversation belongs to the Companion.

Reasoning belongs to the Brain.

Language generation belongs to Providers.

---

# Responsibilities

Conversation is responsible for:

- communicating with the user
- presenting explanations
- answering questions
- collecting user intentions
- forwarding requests to Capability Bundles
- coordinating conversational context

Conversation never executes Runtime actions directly.

---

# Runtime Foundation

Conversation is implemented through the Conversation Capability Bundle.

It depends on:

- Entity Runtime
- Bundle Runtime
- Runtime Context
- Brain
- Provider Runtime (optional)

Conversation introduces no special Runtime architecture.

---

# Conversation Flow

Every conversation follows the same flow.

```text
User

↓

Conversation

↓

Brain

↓

Provider Runtime (selects and invokes the Provider when required)

↓

Brain

↓

Conversation

↓

User
```

Conversation coordinates communication.

It never performs reasoning itself.

---

# Context Awareness

Conversation automatically receives Runtime Context.

Examples include:

- zero, one or multiple assigned Project scopes
- optional focused or primary Project
- active Workspace session
- current Room
- selected Object
- active Review
- running Jobs
- nearby Entities

Conversation never discovers Runtime Context independently.

The Brain receives ordinary Runtime Context through the Entity Runtime. When reasoning requires task-specific information, the Brain requests a Context Package assembled by Context Builder.

---

# Knowledge Awareness

Conversation may reference:

- Knowledge
- Objects
- Relationships
- Reviews
- Blueprints
- Resources

Knowledge is authoritative for durable informational records. Objects, Relationships, Blueprints and Resources remain authoritative domain concepts in their own right.

Conversation never stores independent knowledge.

---

# Without AI

Conversation remains available without an AI Provider.

Examples include:

- predefined greetings
- idle dialogue
- Runtime notifications
- simple confirmations
- tutorial dialogue

The Companion continues to communicate.

Only advanced reasoning becomes unavailable.

---

# With AI

When an AI Provider is available Conversation may:

- answer open questions
- explain architecture
- summarize Knowledge
- brainstorm ideas
- generate suggestions
- assist planning

AI enhances Conversation.

It never replaces it.

---

# Personality

Conversation reflects the active Personality Profile.

Examples include:

- formal
- friendly
- playful
- calm
- energetic

Changing Providers never changes conversational personality.

---

# User Intent

Conversation extracts user intent.

Examples include:

- question
- request
- brainstorming
- navigation
- explanation
- development task

Intent is forwarded to the appropriate Capability Bundle.

Conversation itself performs no work.

---

# Runtime Requests

When a user requests an action:

```text
Conversation

↓

Capability Bundle

↓

Entity Runtime

↓

Runtime Service

↓

Result

↓

Conversation
```

Conversation reports results.

Runtime Services perform actions.

---

# Multi-Turn Sessions

Conversation supports continuous dialogue.

The current session may reference:

- previous messages
- current Runtime Context
- active Workspace session
- recent Runtime Events

Long-term knowledge remains inside the Knowledge Runtime.

Conversation history is temporary.

Selected messages or transcripts become Knowledge only after explicit promotion through Knowledge Service. Promotion creates a durable Knowledge record with source traceability; it does not make the Conversation session itself Knowledge.

---

# Entity Awareness

Conversation may naturally reference nearby Entities.

Examples:

- Pet
- Guide
- Worker
- Companion

Entity interaction remains coordinated by the Entity Runtime.

---

# Suggestions

Conversation may proactively suggest ideas only when enabled by the user.

Examples include:

- Review reminders
- Workspace improvements
- Blueprint opportunities
- Journeyman assistance

Journeyman assistance means proposing or focusing a separate Journeyman Tool task. Conversation never embeds Journeyman inside the Companion and never makes the Companion its avatar.

Suggestions always remain optional.

---

# User Control

The user may configure:

- proactive conversation
- idle dialogue
- notification frequency
- voice interaction
- interruption behavior

Conversation adapts to user preferences.

---

# Privacy

Conversation only accesses information already available through Runtime Context and authorized Runtime Services.

It never bypasses Runtime Permissions.

---

# Failure Handling

If Conversation cannot generate a response:

- Runtime Context remains intact
- the Companion remains available
- the user receives a clear explanation
- alternative non-AI responses may be used

Conversation failures never affect Entity stability.

---

# Extensibility

Future Capability Bundles may extend Conversation with:

- voice
- multilingual dialogue
- collaborative sessions
- code discussions
- educational tutoring
- domain-specific conversations

Every extension follows the same Conversation contract.

---

# Design Goal

Conversation should feel like talking to a familiar Companion rather than operating software.

The user should naturally discuss ideas, projects and questions while the Companion quietly coordinates the underlying Runtime.

---

# Principles

- Conversation is a Capability.
- Conversation is not the Brain.
- Conversation is not the Provider.
- Runtime Context is inherited.
- Knowledge is authoritative for durable informational records.
- AI enhances conversation.
- Personality shapes communication.
- Runtime Services perform actions.
- The Companion remains the conversational identity.
