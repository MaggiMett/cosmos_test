# Companion Notifications

**Version:** 1.0
**Status:** Foundation
**Category:** Experience

---

# Purpose

This document defines how Cosmos communicates with the user.

Unlike traditional operating systems, Cosmos does not rely on intrusive notifications.

Instead, the Companion naturally becomes the user's communication partner.

The Companion informs the user whenever attention may be useful while preserving the calm atmosphere of the Cosmos.

---

# Design Philosophy

Cosmos should interrupt the user only when absolutely necessary.

Everything else should patiently wait until the user decides to review it.

Notifications are therefore not independent interface elements.

They belong to the Companion.

---


# Object Model

Each notification is a Runtime Object with identity, System Tags, Properties and a canonical name Tag.

Its lifetime may be temporary, but it still participates in the universal Object Model and may reference the Project or Object that created it.

---

# Companion Indicator

Whenever something requires the user's attention, the Companion displays a subtle notification indicator.

Version 1 uses a simple exclamation mark.

The indicator appears:

- on the Companion inside the Base
- on the Companion icon inside the Cosmos

The indicator communicates that something is waiting.

It never interrupts the user's current work.

---

# Notification Center

Selecting the Companion opens the Companion Window.

One section of this Window contains the Notification Center.

This Notification Center collects information from the entire Cosmos.

Examples include:

- Capture suggestions
- QM decisions
- discovered Connections
- project updates
- system events

The user decides when to review them.

---

# Notification Categories

Notifications are grouped by their purpose rather than by the module that created them.

Version 1 defines a small set of universal categories.

Examples include:

- Tasks
- Discoveries
- Suggestions
- Projects
- System

This keeps the notification experience consistent even as Cosmos continues to grow.

---

# Priority

Most notifications are passive.

They simply wait inside the Companion until the user opens them.

Only critical system events may temporarily bypass the Companion.

Examples include:

- save failures
- connection loss
- unrecoverable errors

These situations should remain extremely rare.

---

# Companion Behavior

Version 1 intentionally keeps notification behavior minimal.

The Companion simply displays its notification indicator.

Future versions may introduce:

- subtle idle reactions
- small animations
- voice lines
- audio cues

These additions should enrich communication without becoming distracting.

---

# Theme Support

Themes may redefine:

- notification indicator
- animations
- sounds
- visual style

They must never change:

- notification behavior
- priority rules
- interaction flow

Communication should remain familiar across every Theme.

---

# Experience Goals

Companion Notifications should always feel:

- calm
- personal
- unobtrusive
- trustworthy
- intentional

Users should feel informed rather than interrupted.

---

# Design Principles

The Companion communicates.

The Cosmos does not interrupt.

Attention should be requested rather than demanded.

Notification categories describe intent, not origin.

The user always decides when to respond.

---

# Scope

This document defines the notification experience.

The Companion itself, Runtime behavior and Queue systems are documented separately.
