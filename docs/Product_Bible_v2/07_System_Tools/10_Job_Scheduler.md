# Job Scheduler

## Purpose

The Job Scheduler coordinates the execution of all Runtime Jobs inside Cosmos.

It determines when work should begin, how work is prioritized and how compatible Job handlers and System Tools are utilized.

The Job Scheduler orchestrates work.

It never performs work itself.

---

# Architectural Position

Job Scheduler is the Core Runtime scheduling component inside the existing Job Runtime.

It is not a System Tool, Extension or Runtime Service.

System Tools and Job handlers execute scheduled work through the Job Runtime contract.

---

# Philosophy

Long-running Runtime work should be organized rather than immediate.

Ordinary state changes remain synchronous Runtime Service transactions. Only long-running work becomes a Job.

Every Job follows the same lifecycle.

The Scheduler ensures predictable, efficient and scalable execution.

---

# Responsibilities

The Job Scheduler is responsible for:

- scheduling Runtime Jobs
- prioritizing work
- assigning compatible Job handlers
- coordinating execution
- respecting dependencies
- applying Job Runtime retry policies
- balancing workload
- monitoring Job progress

The Job Scheduler never executes Job logic.

---

# Runtime Foundation

The Job Scheduler operates on:

- Job Runtime
- Event Dispatcher
- Job handlers and System Tools
- Provider Runtime
- Review Service

The Scheduler coordinates every compatible Job handler.

For Provider-backed Jobs, the dependency direction is Job Scheduler and Job handler to Provider Runtime. Provider Runtime never depends on Job Scheduler or Job Runtime to provide its core contract.

---

# Job Lifecycle

Every Runtime Job follows the same lifecycle.

```text
Created

↓

Queued

↓

Scheduled

↓

Running

↓

Completed

or

Failed

or

Cancelled
```

Job Runtime owns this lifecycle. The Scheduler coordinates the `Queued`, `Scheduled` and `Running` transitions.

Dependency waiting, handler assignment, validation and retry delay are scheduling details or stages within `Running`, not additional lifecycle states.

---

# Job Queue

Every Job enters a Queue before execution.

The Queue maintains:

- execution order
- priority
- dependencies
- scheduling information

Queued Jobs remain immutable until assignment.

---

# Job Priorities

Canonical priorities are:

- User initiated
- Interactive
- Background
- Maintenance

Higher priority Jobs may execute before lower priority Jobs.

Priority never bypasses dependency requirements.

---

# Job Handler Assignment

The Scheduler assigns Jobs to compatible Job handlers and System Tools.

Handler assignment is scheduling metadata and does not introduce an `Assigned` lifecycle state.

Examples:

Knowledge Processing

↓

Knowledge Processor

---

Repository Analysis

↓

Repository Analyzer

---

Implementation

↓

Journeyman

Workers declare supported Job types.

---

# Dependency Management

Jobs may depend on other Jobs.

Example:

```text
Repository Analysis

↓

Context Assembly

↓

Prompt Generation

↓

Implementation

↓

Validation
```

Dependent Jobs never begin before prerequisites complete successfully.

---

# Parallel Execution

Independent Jobs may execute simultaneously.

Example:

Journeyman

↓

Implementation

---

Repository Analyzer

↓

Analysis

---

Knowledge Processor

↓

Processing

Parallel execution improves Runtime efficiency.

---

# Scheduling Timing

The Scheduler supports multiple queue timing strategies.

Examples include:

- immediate queueing
- delayed queueing
- periodic queueing

Timing remains configurable and never changes the canonical Job priority vocabulary.

---

# Event Integration

Subscribers may react to Runtime Events by requesting the appropriate Runtime Service. The Service performs authoritative validation and may create a long-running Job for the Scheduler.

Examples:

KnowledgeProcessed

↓

Subscriber

↓

Analysis Command to Runtime Service

↓

Optional Analysis Job

---

JobCompleted

↓

Subscriber

↓

Validation Command to Runtime Service

↓

Optional Validation Job

---

ReviewApproved

↓

Subscriber

↓

Implementation Command to Runtime Service

↓

Optional Implementation Job

Events only describe completed facts. They never create work, request work or create Jobs directly.

---

# Retry Policy

Recoverable failures may be retried.

Retry policies may define:

- retry count
- delay
- exponential backoff
- fallback Worker
- Provider retry

Retries remain transparent.

---

# Resource Awareness

Scheduling considers available resources.

Examples include:

- Job handlers and System Tools
- Providers
- CPU
- memory
- network
- project locks

Resource awareness prevents unnecessary contention.

---

# Progress Tracking

Every Job reports structured progress.

Examples include:

- created
- queued
- scheduled
- running
- completed
- failed
- cancelled

Validation and waiting may appear as a current-stage description while the Job remains `Running` or `Scheduled`; they are not lifecycle states.

Progress remains observable throughout execution.

---

# Cancellation

Jobs may be cancelled.

Cancellation should:

- preserve Runtime integrity
- stop future execution
- clean temporary state
- notify dependent Jobs

Partial work remains reviewable whenever possible.

---

# Validation Integration

Execution is not completion.

Validation occurs as a stage while the Job remains `Running`, or as a separate long-running Validation Job created by a Runtime Service.

Validation may include:

- tests
- repository analysis
- Bundle validation
- architecture validation
- Review generation

Required validation must succeed before the Job transitions to `Completed`.

---

# AI Independence

Scheduling never depends on AI.

Providers execute reasoning.

The Scheduler coordinates execution.

Scheduling remains deterministic.

---

# Failure Handling

Failed Jobs:

- preserve Runtime stability
- generate structured failure information
- may produce Reviews
- may trigger retries
- never corrupt unrelated Jobs

Failure remains isolated.

---

# Extensibility

Future Extensions may introduce:

- distributed scheduling
- cloud Workers
- priority policies
- enterprise scheduling
- project-specific schedulers
- collaborative execution

Every Scheduler Extension follows the same Runtime contract.

---

# Design Goal

The Job Scheduler should coordinate long-running Runtime work in a predictable, transparent and scalable manner.

Users should never need to think about scheduling while always understanding what Cosmos is currently doing.

---

# Principles

- Only long-running work becomes a Job.
- Runtime Services create Jobs.
- Events never create work or Jobs directly.
- The Scheduler coordinates work.
- Job handlers and System Tools execute work.
- Dependencies are respected.
- Validation precedes completion.
- Scheduling is deterministic.
- AI is optional.
- Runtime remains observable.
- Failures remain isolated.
