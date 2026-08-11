# Notification

**Version:** 1.0  
**Status:** Authoritative  
**Category:** Runtime Object

---

# Purpose

Notifications communicate that something in Cosmos may deserve the user's attention without interrupting current work.

They belong to the Companion experience and should feel patient, personal and calm.

---

# Overview

Every Notification is a Runtime Object represented in two places:

- a subtle availability indicator on the Companion
- a Notification entry inside the Companion Window

Version 1 does not display ordinary toast stacks, floating banners or an independent Notification Window. Review remains a decision Tool and is not reused as a Notification Center.

---

# Object Template

## Companion Indicator

The Version 1 indicator is a small exclamation mark attached to the upper edge of the Companion's circular interaction area.

It remains clearly separate from the Companion's face and does not cover expressions. The same indicator placement is used on the Companion in Cosmos and Base.

The indicator communicates availability only. It does not show a numeric count.

---

## Notification Center Region

The Companion Window contains a dedicated Notification Center region alongside its normal conversation content.

The region consists of:

- compact heading
- category filters when more than one category is present
- ordered Notification List
- calm empty state

The region uses the existing Companion Window rather than opening another Window.

---

## Notification Entry

Every entry may display only information already supplied by its Runtime Object:

- title
- short message
- category
- relative or absolute time
- source Project or Object label when available
- unread state

Entries remain compact and use one clear text column. The category appears as a small muted label or icon. A source label remains secondary.

Selecting an actionable entry opens or focuses its existing destination. The entry itself does not invent actions.

---

# Categories

Version 1 categories use one consistent compact label treatment:

- Tasks
- Discoveries
- Suggestions
- Projects
- System

Category color is a subtle accent only and never the sole identifier.

---

# Visual Identity

Notifications are recognized by:

- the small Companion exclamation indicator
- compact entries inside the Companion Window
- restrained category accents
- an ordered, non-urgent list
- absence of floating interruption surfaces

---

# Cosmos Theme

## Indicator

The indicator uses the active accent color on a small dark circular backing with a soft glow. It remains readable at the Companion's smallest supported size.

---

## Entries

Entries use the existing glass-surface and border language at very low contrast. Unread entries receive a narrow accent marker and slightly stronger title weight. Read entries remain available with reduced emphasis.

---

## Empty State

The empty state uses a short reassuring message and no decorative warning imagery.

---

# Visual States

Notifications support:

- no notifications
- notification available
- unread entry
- read entry
- selected entry
- destination unavailable

The Companion indicator appears while attention remains available and disappears when no Notification requires it.

---

# Animations

Version 1 uses:

- a soft indicator appearance
- subtle entry insertion and removal
- restrained selection feedback

The indicator does not pulse continuously. Reduced-motion settings replace movement with immediate state changes.

---

# Future

Future Themes may change indicator shape, sound or animation. Future versions may add richer grouping while preserving Companion ownership and the non-interruptive experience.
