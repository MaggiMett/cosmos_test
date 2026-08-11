# Review

## Purpose

Review presents mature discoveries that require a user decision.

It collects meaningful findings produced by the Knowledge Runtime, Analysis Engine and other System Tools.

Review is not a notification center.

It is not a task manager.

It is the place where Cosmos asks for human judgment only when that judgment creates real value.

---

# Philosophy

Cosmos should think quietly before it speaks.

A single Capture does not require Review.

A minor similarity does not require Review.

An uncertain observation does not require Review.

Review begins only when enough related evidence has accumulated to justify the user's attention.

---

# Responsibilities

Review is responsible for:

- presenting mature discoveries
- grouping related findings
- explaining why a decision is needed
- linking findings to their original Knowledge
- collecting user decisions
- returning decisions to the Runtime
- preserving decision history

Review never analyzes Knowledge itself.

Analysis belongs to System Tools.

---

# Runtime Dependencies

Review uses:

- Review Service
- Knowledge Service
- Object Service
- Relationship Service
- Tag Service
- Job Service
- Runtime Context
- Event Model

Review never accesses Persistence directly.

---

# Review Sources

Review candidates may be proposed by:

- Analysis Engine
- Knowledge Processor
- Repository Analyzer
- Journeyman
- Companion
- future System Tools

Every producer submits its candidate or creation Command to Review Service. Review Service creates and owns the Review Item, persists its state and records its source.

---

# Review Threshold

Findings enter Review only after a meaningful confidence threshold has been reached.

Typical conditions include:

- a cluster of approximately five to ten related Captures
- repeated duplicate information
- several conflicting statements
- a recurring missing field
- a stable Object Blueprint pattern
- a structural decision that cannot be made safely by the Runtime
- a repeated Tag combination that may deserve consolidation

The threshold applies to semantic groups.

It does not count unrelated entries.

---

# Review Items

Every Review Item contains:

- immutable ID
- title
- summary
- reason for Review
- source Tool
- affected Projects (zero, one or multiple)
- affected Objects
- related Knowledge
- supporting evidence
- confidence
- available actions
- current state
- creation date

The user should always understand why the Item exists.

---

# Review Categories

Initial Review categories include:

## Similarity

Several Knowledge Items may express the same idea.

Example:

"These six Captures appear to describe the same vision."

---

## Duplicate

Two or more entries may be functionally identical.

Example:

"These two Captures may be duplicates."

---

## Conflict

Related Knowledge may contain incompatible statements.

Example:

"These two versions describe different rulers for the same period."

---

## Missing Information

A repeated Template or Blueprint may be incomplete.

Example:

"Three Item descriptions are missing texture requirements."

---

## Structure

A group of Knowledge may justify a new Object, Branch or Blueprint.

Example:

"These eight Captures may form one Object Blueprint."

---

## Tag Consolidation

Repeated Tag combinations may justify a more precise Tag.

Example:

`Mettventures + Dwarfs + Items + Mining`

may become:

`Dwarven Mining Items`

---

## Runtime Decision

Journeyman or another System Tool may require a decision before continuing safely.

Example:

"Two technically valid implementation paths exist."

---

# Queue

Review displays Items as a structured queue.

The queue should resemble an ordered navigation list rather than a stream of notifications.

Items may be grouped by:

- Project
- category
- urgency
- source
- creation date
- affected Object

The user may work through the queue gradually.

---

# Context

Review automatically inherits Runtime Context.

Inside a Workspace session with assigned Project scopes, Review primarily displays Items relevant to those scopes. An optional focused or primary Project may receive presentation emphasis.

With no assigned Project scopes, global Review may display Items from every Project.

Context filters presentation.

It never changes the underlying Review Items.

---

# Evidence

Every Review Item must provide access to its evidence.

Evidence may include:

- original Captures
- Knowledge versions
- Tags
- Relationships
- Resources
- repository findings
- Job results

Review does not duplicate evidence.

It references the original data.

---

# Archive Integration

Review Items may contain direct references to Archive.

Opening a reference may display:

- the original Capture
- its version history
- related Knowledge
- connected Objects
- earlier decisions

Archive opens as another Tool inside the same Workspace.

Review never becomes a Knowledge browser itself.

---

# User Decisions

Review may offer actions such as:

- accept
- reject
- merge
- keep separate
- create Object
- create Relationship
- add Tag
- create an explicitly categorized Object Blueprint, Capture Template or Workspace Blueprint
- request more evidence
- postpone
- dismiss

Available actions depend on the Review category.

---

# Decision Effects

Review never modifies domain data directly.

A user decision sends a Command to Review Service. Review Service authoritatively validates and records the decision, owns the Review Item state transition and coordinates the appropriate existing domain Service when the accepted decision requires a domain mutation.

Examples:

Accept Relationship

↓

Relationship Service

Create Object

↓

Object Service

Merge Tags

↓

Tag Service

Review only collects intent and presents the resulting state.

Runtime Services perform the change.

---

# Postpone

Users may postpone Review Items.

Postponed Items remain available without creating repeated interruptions.

The Runtime may add new evidence to an existing Item.

It should not create unnecessary duplicate Review Items.

---

# Dismissal

A Review Item may be dismissed.

Dismissal does not delete the underlying Knowledge or evidence.

The decision remains recorded so the same weak finding is not repeatedly presented.

Significant new evidence may justify reopening the subject later.

---

# Decision History

Every completed Review Item preserves:

- the original finding
- supporting evidence
- the user's decision
- resulting Commands
- resulting domain changes
- completion date

Review therefore becomes a traceable history of human judgment.

---

# Companion

Companion may help explain Review Items.

It may:

- summarize evidence
- compare alternatives
- answer questions
- clarify consequences

Companion never makes the final decision.

---

# Interruptions

Review does not interrupt the user automatically for ordinary findings.

New Items accumulate silently.

Only urgent Runtime blockers may request immediate attention.

Urgency must be rare and justified.

---

# Failure Handling

If a user decision cannot be applied:

- the Review Item remains open
- the original decision is preserved
- the failure is explained
- retry remains possible
- no evidence is lost

---

# Extensibility

Future extensions may introduce:

- additional Review categories
- custom actions
- domain-specific evidence
- specialized queue views
- collaborative Review

Every extension follows the same Review contract.

---

# Design Goal

Review should feel like Cosmos has thought ahead and found something worth discussing.

The user should not feel burdened by constant questions.

Every Review Item should justify the attention it requests.

---

# Principles

- Review presents mature findings.
- Review never performs analysis.
- Evidence always remains traceable.
- Review does not modify data directly.
- Runtime Services execute decisions.
- Minor findings remain silent.
- Users may postpone or dismiss Items.
- Decisions preserve history.
- Human judgment remains final.
