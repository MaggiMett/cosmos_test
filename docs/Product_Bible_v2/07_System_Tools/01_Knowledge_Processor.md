# Knowledge Processor

## Purpose

The Knowledge Processor transforms newly submitted Knowledge into structured Runtime information.

It analyzes incoming content, extracts semantic information and prepares Knowledge for long-term organization.

The Knowledge Processor is the first processing stage after Knowledge has entered the Knowledge Runtime and been stored.

---

# Architectural Position

Knowledge Processor is a registered System Tool Extension.

It performs task-oriented processing through Core Runtime contracts and is not a Runtime Service or independent Runtime system.

---

# Philosophy

Users should capture ideas.

The Runtime should organize them.

Knowledge Processing happens automatically after submission.

It never interrupts the user's workflow.

---

# Responsibilities

The Knowledge Processor is responsible for:

- processing submitted Captures
- extracting metadata
- identifying Objects
- suggesting candidate `Related` Relationships between Objects
- suggesting Tags
- generating semantic summaries
- requesting further analysis through the appropriate Runtime Service
- preparing Review candidates

The Knowledge Processor never modifies user intent.

---

# Runtime Foundation

The Knowledge Processor operates on:

- Knowledge Runtime
- Object Service
- Tag Service
- Review Service
- Context Builder
- Job Runtime
- Provider Runtime (optional)

Processing always occurs as a Runtime Job.

---

# Processing Pipeline

Every submitted Capture follows the same pipeline.

```text
Capture Submitted

↓

Knowledge Stored

↓

Knowledge Processing Job

↓

Metadata Extraction

↓

Tag Suggestions

↓

Object Detection

↓

Relationship Detection

↓

Semantic Summary

↓

Analysis Queue

↓

Review Candidates
```

The original Capture remains immutable.

---

# Processing Strategy

Processing occurs asynchronously.

Users continue working immediately after submission.

The Runtime schedules processing according to Job availability.

---

# Input Sources

The Knowledge Processor may process stored Knowledge originating from:

- Captures
- informational records ingested from files
- explicitly promoted conversation records
- durable informational descriptions of Object Blueprints, Capture Templates or Workspace Blueprints
- generated informational records
- repository analysis records

Every input is already Knowledge before processing. Source domain entities and Resources remain distinct and do not become Knowledge themselves.

---

# Metadata Extraction

Metadata may include:

- title
- summary
- language
- keywords
- creation source
- project
- context

Metadata improves discoverability.

---

# Tag Suggestions

The Processor proposes:

- System Tags
- User Tag suggestions

Suggested Tags never become mandatory.

Users remain free to modify them.

---

# Object Detection

The Processor may identify potential Objects.

Examples:

- Character
- Item
- Building
- API Endpoint
- Feature

Detected Objects become Review candidates until confirmed.

---

# Relationship Detection

In Version 1, the Processor may suggest only the `Related` Relationship between two candidate Object endpoints.

Future semantic type examples include:

- depends on
- expands
- duplicates
- references

The specialized examples are analysis signals only in Version 1, not supported Relationship types. All Relationship candidates remain suggestions until user acceptance through Relationship Service.

---

# AI Independence

The Processor functions without AI.

Rule-based processing provides deterministic extraction.

AI Providers improve semantic understanding when available.

---

# Runtime Context

Every Knowledge Processing Job receives the immutable Context Snapshot captured when Knowledge Service creates the Job.

When processing requires task-specific information, Knowledge Processor requests a Context Package from Context Builder using that Snapshot. It never follows later live Runtime Context changes.

Examples:

- zero, one or multiple assigned Project scopes
- optional focused or primary Project
- Workspace session at Job creation when applicable
- inherited Tags
- current Object Blueprint when applicable

Context improves extraction quality.

---

# Output

The Processor produces:

- enriched Knowledge
- suggested Tags
- candidate Objects
- candidate `Related` Relationships between Objects
- semantic summary
- Review candidates

The original Capture never changes.

Knowledge Processor submits Review candidates to Review Service and never creates or persists Review Items directly.

---

# Failure Handling

If processing fails:

- original Knowledge remains safe
- processing may retry
- partial results are discarded safely
- user workflow remains unaffected

---

# Extensibility

Future Extensions may introduce:

- OCR
- speech transcription
- code understanding
- image analysis
- multimodal extraction

Every extension follows the same processing contract.

---

# Design Goal

The Knowledge Processor should quietly transform raw information into structured Knowledge without interrupting the user's creative flow.

---

# Principles

- Processing is asynchronous.
- Processing begins only after Knowledge ingestion and storage.
- Original Captures remain immutable.
- AI enhances processing.
- The Job's Context Snapshot and Context Package improve understanding.
- Suggestions remain non-destructive.
- Users stay in control.
