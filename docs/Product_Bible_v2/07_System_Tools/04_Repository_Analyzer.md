# Repository Analyzer

## Purpose

The Repository Analyzer performs demand-driven, read-only analysis of the technical structure of project repositories.

It transforms observations about source code, configuration and project structure into structured analysis records that can be stored as Knowledge and used by Journeyman, the Knowledge Runtime and other System Tools.

The Repository Analyzer understands projects.

It does not modify them.

Analysis runs only during import, on explicit request, or when an approved affected task requires fresh repository understanding.

---

# Architectural Position

Repository Analyzer is a registered System Tool Extension.

It performs task-oriented repository analysis through Core Runtime contracts and is not a Runtime Service or independent Runtime system.

---

# Philosophy

Repositories should be understood before they are modified.

Understanding should be incremental.

Analysis should be repeatable.

The Repository Analyzer observes.

Journeyman orchestrates approved work through the selected development Provider.

---

# Responsibilities

The Repository Analyzer is responsible for:

- analyzing repository structure
- identifying project components
- discovering technologies
- understanding architecture
- detecting dependencies
- identifying entry points
- identifying configuration
- generating repository analysis metadata
- interpreting structural changes reported by Repository Runtime signals when analysis is triggered

The Repository Analyzer never changes repository contents.

---

# Runtime Foundation

The Repository Analyzer operates on:

- Project Runtime
- Knowledge Runtime
- Object Service
- Context Builder
- Job Runtime
- Provider Runtime (optional)

Repository analysis always executes as Runtime Jobs.

Repository Runtime may provide lightweight availability, file-change, branch-change and health signals, but those signals never execute this Tool directly. A validated Runtime Service request creates the analysis Job.

---

# Analysis Scope

The Repository Analyzer may analyze:

- source code
- project structure
- configuration files
- build systems
- dependency manifests
- documentation
- assets
- generated files

Analysis scope remains configurable.

---

# Analysis Pipeline

Every repository analysis follows the same flow.

```text
Repository

↓

Project Discovery

↓

Technology Detection

↓

Structure Analysis

↓

Architecture Analysis

↓

Object Discovery

↓

Relationship Detection

↓

Repository Knowledge

↓

Review Candidates
```

The repository itself remains unchanged.

---

# Project Discovery

The Analyzer first determines:

- project root
- Project System Tag and Property Schema candidates
- workspace layout
- build system
- package managers
- repository boundaries

Discovery establishes the analysis context.

---

# Technology Detection

Examples include:

- Python
- Rust
- TypeScript
- Vue
- React
- FastAPI
- Docker
- Unreal Engine
- Unity

Projects may contain multiple technologies.

---

# Structure Analysis

The Analyzer identifies:

- modules
- packages
- directories
- namespaces
- components
- services
- extensions
- plugins

Durable information about structure may become Knowledge. The repository Resources themselves remain distinct.

---

# Architecture Analysis

The Analyzer attempts to understand:

- layering
- module boundaries
- dependencies
- architectural patterns
- extension points
- runtime contracts

Architecture understanding improves through successive triggered analyses.

---

# Object Discovery

Repository Objects may include:

- modules
- classes
- interfaces
- APIs
- commands
- services
- extensions
- configuration objects

The Analyzer produces candidate Objects only. After review or task approval, accepted Objects are created as domain entities through Object Service; the Analyzer never creates them directly. Durable descriptions and analysis of them may be stored separately as Knowledge.

---

# Relationship Discovery

The Analyzer may detect technical connections such as:

- imports
- references
- inheritance
- composition
- dependencies
- runtime usage

In Version 1 these technical connections may be stored as analysis Knowledge and may produce candidate `Related` Relationships between two Objects. Specialized Relationship types are future examples only.

---

# Change Signals and Re-analysis

Repository Runtime may continuously report lightweight signals for:

- file changes, including additions, removals and renames
- branch changes
- repository availability
- repository health

The Analyzer does not continuously inspect or interpret those changes. Re-analysis requires an explicit request or approved affected-task trigger and should limit scope to changed areas whenever possible.

---

# AI Independence

The Repository Analyzer functions without AI.

Rule-based parsing provides deterministic analysis.

AI Providers improve architectural understanding and semantic interpretation.

---

# Runtime Context

Every Repository Analysis Job receives the immutable Context Snapshot captured when its Runtime Service creates the Job.

When analysis requires task-specific information, Repository Analyzer requests a Context Package from Context Builder using that Snapshot. It never follows later live Runtime Context changes.

Examples include:

- zero, one or multiple assigned Project scopes
- optional focused or primary Project
- Workspace session at Job creation when applicable
- active explicitly categorized Object Blueprint, Capture Template or Workspace Blueprint
- current Review

Context helps prioritize analysis.

---

# Output

The Analyzer produces:

- repository analysis metadata
- candidate Objects
- candidate `Related` Relationships between Objects
- technology profile
- architecture summary
- Review candidates

The repository itself remains untouched.

---

# Integration

Repository knowledge may be used by:

- Journeyman
- Prompt Builder
- Context Builder
- Knowledge Runtime
- Review Service

The Repository Analyzer never performs implementation work.

Repository Analyzer submits Review candidates to Review Service and never creates or persists Review Items directly.

It never performs Runtime Translation, mutates Resource mappings or changes Project metadata. Accepted changes are requested through Runtime Services, and approved implementation belongs to Journeyman.

---

# Failure Handling

If analysis fails:

- repository contents remain unchanged
- partial analysis is discarded safely
- previous repository knowledge remains available
- future analysis may retry

Repository integrity is always preserved.

---

# Extensibility

Future Extensions may introduce:

- language-specific analyzers
- framework analyzers
- build system analyzers
- architecture analyzers
- dependency visualizers
- security analyzers

Every extension integrates into the Repository Analyzer.

---

# Design Goal

The Repository Analyzer should allow Cosmos to understand software projects as structured knowledge rather than collections of files.

Users and Runtime clients should work with meaningful project understanding instead of raw source code.

---

# Principles

- Repositories are analyzed before they are modified.
- Analysis is incremental.
- Repository contents remain unchanged.
- AI enhances understanding.
- Objects and Relationships remain domain records; durable analysis about them may become Knowledge.
- Journeyman consumes repository understanding.
- Lightweight structural-change notifications belong to Repository Runtime; analysis remains demand-driven.
- Understanding grows over time.
