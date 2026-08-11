from __future__ import annotations

from dataclasses import dataclass, replace
from enum import StrEnum


class RegistryStatus(StrEnum):
    DISCOVERED = "discovered"
    VALIDATED = "validated"
    REGISTERED = "registered"
    ACTIVE = "active"
    DISABLED = "disabled"
    INCOMPATIBLE = "incompatible"
    MISSING_DEPENDENCY = "missing_dependency"
    FAILED = "failed"


@dataclass(frozen=True, slots=True)
class RegistryEntry:
    component_id: str
    display_name: str
    category: str
    version: str
    runtime_api_version: str
    source_extension_id: str
    capabilities: frozenset[str] = frozenset()
    dependencies: tuple[str, ...] = ()
    permissions: frozenset[str] = frozenset()
    entry_point: str = ""
    status: RegistryStatus = RegistryStatus.VALIDATED
    object_id: str | None = None


class Registry:
    """Shared definition registry; execution and active instance state live elsewhere."""

    def __init__(self) -> None:
        self._entries: dict[str, RegistryEntry] = {}

    def register(self, entry: RegistryEntry) -> RegistryEntry:
        if entry.component_id in self._entries:
            raise ValueError(f"Duplicate Registry component ID: {entry.component_id}")
        if entry.status is not RegistryStatus.VALIDATED:
            raise ValueError("Only validated definitions may be registered.")
        registered = replace(entry, status=RegistryStatus.REGISTERED)
        self._entries[entry.component_id] = registered
        return registered

    def activate(self, component_id: str) -> RegistryEntry:
        entry = self.resolve(component_id)
        if entry.status not in {RegistryStatus.REGISTERED, RegistryStatus.DISABLED}:
            raise ValueError(f"Registry component cannot be activated from {entry.status.value}.")
        active = replace(entry, status=RegistryStatus.ACTIVE)
        self._entries[component_id] = active
        return active

    def disable(self, component_id: str) -> RegistryEntry:
        entry = self.resolve(component_id)
        disabled = replace(entry, status=RegistryStatus.DISABLED)
        self._entries[component_id] = disabled
        return disabled

    def resolve(self, component_id: str) -> RegistryEntry:
        try:
            return self._entries[component_id]
        except KeyError as error:
            raise KeyError(f"Unknown Registry component: {component_id}") from error

    def query(
        self,
        *,
        category: str | None = None,
        capability: str | None = None,
        status: RegistryStatus | None = None,
    ) -> tuple[RegistryEntry, ...]:
        entries = self._entries.values()
        result = (
            entry
            for entry in entries
            if (category is None or entry.category == category)
            and (capability is None or capability in entry.capabilities)
            and (status is None or entry.status is status)
        )
        return tuple(sorted(result, key=lambda entry: entry.component_id))
