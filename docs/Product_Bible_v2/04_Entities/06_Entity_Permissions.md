# Entity Permissions

## Purpose

Entity Permissions define which Runtime actions an Entity is allowed to request.

They protect the Runtime while allowing Entities to naturally assist the user.

Permissions describe capabilities.

Runtime Services decide authoritatively whether those capabilities may be executed.

---

# Architectural Position

Entity Permissions specialize the shared Permission System for Entity requests.

They do not create an independent permission system, Runtime Service or Runtime category.

Entity Runtime uses this contract while Runtime actions continue through the existing Runtime Service boundary.

---

# Philosophy

Entities should never possess unrestricted access.

Every Runtime action requires explicit permission.

The Runtime always remains in control.

Entities request.

Runtime Services decide.

---

# Responsibilities

Entity Permissions are responsible for:

- defining Entity capabilities
- providing non-authoritative preflight feedback
- validating Permission Profile declarations
- describing restrictions evaluated by Runtime Services
- supporting future Entity Roles
- ensuring predictable Runtime behavior

Permissions never contain business logic.

---

# Permission Model

Every Entity possesses a Permission Profile.

Permissions are capability-based.

Examples include:

- open User Tool
- highlight Object
- navigate Workspace
- display Review
- request Conversation
- interact with Entity
- observe Runtime Events

Permissions describe intent.

Runtime Services execute work.

---

# Permission Sources

Permissions originate from several layers.

## Entity Role

Provides the default Permission Profile.

Example:

Support Entity

↓

open User Tools

↓

request Review

↓

highlight Objects

---

## Runtime

The Runtime may further restrict permissions.

Examples include:

- current Scope
- current Workspace
- active Project
- Runtime state

---

## User Configuration

Users may customize allowed capabilities.

Examples include:

- disable automatic greetings
- prevent Workspace switching
- disable proactive suggestions
- allow opening specific Tools

Users remain in control.

---

## Extensions

Extensions may contribute additional Permissions.

Every new Permission integrates into the shared Permission System.

---

# Permission Categories

Initial categories include:

## Interaction

Examples:

- greet
- wave
- pet
- follow
- inspect

---

## Navigation

Examples:

- move
- change Room
- enter Workspace
- approach Object

---

## Observation

Examples:

- observe Runtime Events
- observe Jobs
- observe Reviews
- observe Workspace changes

Observation never modifies Runtime data.

---

## Presentation

Examples:

- display notification
- point at Object
- highlight Review
- show suggestion
- open dialogue

---

## Tool Requests

Examples:

- request Archive
- request Review
- request Capture
- request Blueprint Builder

Entities never open Tools directly.

They request Runtime Services.

---

## Runtime Requests

Examples:

- request Job
- request Repository scan
- request Journeyman
- request Analysis

These actions may require explicit user confirmation.

---

# Permission Validation

Every Runtime request follows the same process.

```text
Entity

↓

Permission Preflight in Entity Runtime

↓

Command

↓

Runtime Service

↓

Authoritative Permission Validation

↓

Business Validation and Execution

↓

Result
```

Preflight may reject an unavailable capability early for feedback. It never authorizes execution.

Every submitted Command reaches the Runtime Service boundary, which repeats the permission decision authoritatively before any business action.

User Confirmation

Certain Permissions always require confirmation.

Examples include:

modifying Objects
starting Journeyman work
repository changes
file generation
deleting Resources

Support Entities may prepare these actions.

The user supplies required confirmation. The receiving Runtime Service authoritatively validates that confirmation and all other Permissions before execution.

Automatic Actions

Some Permissions may execute automatically.

Examples include:

greeting
movement
idle behavior
pointing toward Review
displaying notifications

Automatic actions must never modify Project data.

Permission Profiles

Every Entity Role defines a default profile.

Example:

Support Entity

observe
interact
suggest
open User Tools
explain
request Runtime actions

Ambient Entity

move
idle
interact
emotional reactions

Guide Entity

explain
navigate
highlight

Worker Entity

monitor Jobs
coordinate workflows
present progress

Profiles remain customizable.

Temporary Permissions

The Runtime may temporarily grant additional Permissions.

Example:

Tutorial Mode

↓

Guide Entity

↓

highlight interface

↓

temporary permission removed

Temporary Permissions always expire.

Scope Restrictions

Permissions are limited by Scope.

Example:

Project Entity

↓

may only interact inside its Project

Workspace Entity

↓

may only affect its Workspace

Global Entities remain subject to Runtime validation.

AI Permissions

AI Providers never grant Permissions.

An AI Provider may suggest actions.

Entity Runtime may preflight whether the Entity appears allowed to request them.

The receiving Runtime Service always makes the authoritative permission decision.

Intelligence never bypasses Runtime security.

Failure Handling

Denied requests:

do not execute
preserve Entity State
preserve Runtime consistency
may notify the user when appropriate

Permission failures should always be understandable.

Extensibility

Future extensions may introduce:

custom capability groups
collaborative permissions
multiplayer permissions
enterprise policies
certification requirements

Every addition integrates into the shared Permission System.

Design Goal

Entity Permissions should make Entities feel helpful while ensuring that the user always remains in control.

Entities assist.

The Runtime protects.

The user decides.

Principles
Every action requires permission.
Entities request.
Runtime Services execute.
Runtime Services enforce Permissions authoritatively.
AI never grants permissions.
Users remain in control.
Automatic actions are non-destructive.
Scope limits capabilities.
Permission failures are safe and transparent.
