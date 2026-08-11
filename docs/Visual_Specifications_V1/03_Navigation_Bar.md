# Navigation Bar

**Version:** 1.0  
**Status:** Authoritative  
**Category:** Cosmos

---

# Purpose

The Navigation Bar provides permanent orientation inside Cosmos.

It always displays the user's current location while offering quick access to nearby Projects and Quick Travel.

The Navigation Bar should feel like a navigation instrument rather than a traditional user interface element.

---

# Overview

The Navigation Bar remains permanently visible.

It is positioned at the top center of the screen.

It occupies very little space while remaining immediately readable.

The Navigation Bar is considered part of the Cosmos itself rather than a Window.

---

# Object Template

## Layout

The Navigation Bar is a horizontal HUD element.

It consists of:

- Current Location
- Optional Left Neighbor
- Optional Right Neighbor

---

## Current Location

The center always displays the user's current location.

Only one location is displayed at a time.

The current location remains the primary visual focus.

---

## Neighbor Projects

The Navigation Bar may display one neighboring Project on the left and one on the right.

Neighbors are determined by their geographical position inside the Cosmos.

Neighbor entries are optional.

---

## Interaction

Selecting the current location opens Quick Travel.

Selecting a neighboring Project immediately begins navigation to that Project.

---

# Visual Identity

The Navigation Bar is recognized by:

- permanent top-center placement
- compact horizontal layout
- minimal visual weight
- emphasis on the current location

It should resemble an elegant navigation instrument.

---

# Cosmos Theme

## Appearance

The Navigation Bar uses the Cosmos visual language.

It should not resemble a traditional application toolbar.

Instead it should feel integrated into the Cosmos interface.

---

## Materials

The active Theme defines:

- opacity
- blur
- borders
- lighting
- decorative elements

---

## Current Location

The active location is visually emphasized.

It should always attract the user's attention first.

---

## Neighbor Projects

Neighbor Projects remain visually secondary.

They provide orientation without competing with the active location.

---

# Visual States

The Navigation Bar supports:

- default
- current location selected
- neighboring Project available
- Quick Travel opened

State changes should remain subtle.

---

# Animations

Version 1 animations remain restrained.

Examples include:

- smooth location updates
- subtle highlight transitions
- gentle Quick Travel opening
- Project selection feedback

Animations should reinforce orientation rather than attract attention.

---

# Future

Possible future additions include:

- neighboring Project icons
- Main Node previews
- navigation history
- favorite destinations
- additional navigation indicators
