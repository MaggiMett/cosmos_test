# Shared contracts

This directory contains implementation-neutral schemas shared by the Python Runtime and native Vue/TypeScript Extensions.

Schemas are versioned contracts. Runtime code may provide typed language bindings, but those bindings must not create a competing contract. API schemas will be added beside the capability that owns them; Sprint 0 defines only the Extension Manifest envelope.
