# Dialog

**Version:** 1.0  
**Status:** Authoritative  
**Category:** Surface Window

---

# Purpose

Dialogs present a short, focused decision or a small amount of required input without creating another working environment.

They should feel attached to the Window and action that opened them, remain easy to understand, and disappear as soon as the decision is complete.

---

# Overview

A Dialog is a Surface Window owned by an Environment Window or Tool Window.

It uses the universal Window visual language but is not movable, resizable, minimizable, maximizable, dockable or snappable. It never becomes a separate application surface or persists as Workspace layout.

Version 1 uses Dialogs only where existing product behavior requires a focused confirmation, decision or compact input. Ordinary editing remains inline in the owning surface.

---

# Object Template

Every Dialog consists of:

- Attention Layer
- Dialog Panel
- Optional Header
- Message or Input Region
- Action Region

---

## Attention Layer

The Attention Layer visually separates the Dialog from its owner while keeping the originating Window visible.

It covers only the owning Window hierarchy and uses a restrained translucent veil. The Cosmos or originating environment should remain recognizable behind it.

---

## Dialog Panel

The panel is centered within its owner and remains comfortably inside the visible bounds.

It uses a compact width and grows vertically only as required by its content. Long-form work belongs in a Tool or Object Window rather than a Dialog.

---

## Header

The optional Header contains:

- concise title
- optional small intent icon
- Close only when dismissing is a valid existing action

No other Window controls appear.

---

## Message or Input Region

The main region contains one clear message or one compact group of related inputs.

Explanatory text appears before inputs. Destructive consequences are stated plainly and use emphasis without alarmist presentation.

---

## Action Region

Actions appear along the lower edge of the panel.

The primary action is visually strongest. Cancel or dismissal remains secondary. Destructive actions use the existing restrained danger accent and never rely on color alone.

Version 1 avoids more than three visible actions in one Dialog.

---

# Visual Identity

Dialogs are recognized by:

- a compact centered panel
- a quiet attention veil
- one focused message or input group
- a clear action hierarchy
- visible connection to the owning Window

---

# Cosmos Theme

## Appearance

Dialogs use the same dark glass material, subtle border, soft shadow and rounded geometry as Tool Windows at a smaller scale.

The attention veil uses low-opacity darkness and restrained blur. The Dialog remains the clearest element without making the rest of Cosmos disappear.

---

## Typography

Titles are short and moderately emphasized. Body text prioritizes readability. Supporting explanations use the muted text color.

---

# Visual States

Dialogs support:

- opening
- default
- input active
- validation feedback
- action pending
- closing

Validation feedback appears next to the affected input. A pending action preserves the Dialog and visibly disables duplicate submission.

---

# Animations

Version 1 uses restrained scale and opacity transitions.

The Attention Layer fades in before or with the panel. Closing reverses the transition. Motion should communicate focus without feeling like a separate environment transition.

---

# Accessibility

- keyboard focus remains visually clear
- action order follows reading order
- the primary action is not selected through color alone
- Escape may dismiss only when dismissal is an existing valid action
- reduced-motion settings remove scale movement while preserving immediate opacity feedback

---

# Future

Possible future additions include richer pickers or multi-step flows. They must extend the same Surface Window hierarchy rather than introduce another Dialog system.
