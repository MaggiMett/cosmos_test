from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Protocol
from urllib.parse import urlparse

from cosmos.runtime.context import RuntimeContext
from cosmos.runtime.registry import RegistryEntry
from cosmos.runtime.tools import ToolInstance


class ToolRuntimeKind(StrEnum):
    NATIVE = "native"
    WEB = "web"
    SERVICE = "service"
    DESKTOP = "desktop"
    COMMAND = "command"


@dataclass(frozen=True, slots=True)
class ToolAdapterContext:
    definition: RegistryEntry
    instance: ToolInstance
    runtime_context: RuntimeContext


class ToolAdapter(Protocol):
    runtime_kind: ToolRuntimeKind

    def availability_error(self, definition: RegistryEntry, context: RuntimeContext) -> str | None: ...

    def open(self, context: ToolAdapterContext) -> None: ...

    def update(self, context: ToolAdapterContext) -> None: ...

    def close(self, context: ToolAdapterContext) -> None: ...


class NativeToolAdapter:
    runtime_kind = ToolRuntimeKind.NATIVE

    def availability_error(self, definition: RegistryEntry, context: RuntimeContext) -> str | None:
        return None

    def open(self, context: ToolAdapterContext) -> None:
        pass

    def update(self, context: ToolAdapterContext) -> None:
        pass

    def close(self, context: ToolAdapterContext) -> None:
        pass


class ServiceToolAdapter:
    runtime_kind = ToolRuntimeKind.SERVICE

    def availability_error(self, definition: RegistryEntry, context: RuntimeContext) -> str | None:
        entry_point = definition.entry_point.strip()
        if not entry_point:
            return "Service Tool entry point is required."
        if ":" not in entry_point or entry_point.startswith(("http:", "https:")):
            return "Service Tool entry point must use a registered service namespace (for example service:action)."
        return None

    def open(self, context: ToolAdapterContext) -> None:
        pass

    def update(self, context: ToolAdapterContext) -> None:
        pass

    def close(self, context: ToolAdapterContext) -> None:
        pass


class WebToolAdapter:
    runtime_kind = ToolRuntimeKind.WEB

    def availability_error(self, definition: RegistryEntry, context: RuntimeContext) -> str | None:
        entry_point = definition.entry_point.strip()
        if not entry_point:
            return "Web Tool entry point is required."
        parsed = urlparse(entry_point)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            return "Web Tool entry point must be an absolute HTTP(S) URL."
        return None

    def open(self, context: ToolAdapterContext) -> None:
        pass

    def update(self, context: ToolAdapterContext) -> None:
        pass

    def close(self, context: ToolAdapterContext) -> None:
        pass


class ToolAdapterRegistry:
    """Runtime-kind dispatch only; ToolRuntime remains the Tool Instance lifecycle owner."""

    def __init__(self) -> None:
        self._adapters: dict[ToolRuntimeKind, ToolAdapter] = {}

    def register(self, adapter: ToolAdapter) -> None:
        if adapter.runtime_kind in self._adapters:
            raise ValueError(f"Duplicate Tool Adapter for runtime kind: {adapter.runtime_kind.value}")
        self._adapters[adapter.runtime_kind] = adapter

    def resolve(self, runtime_kind: ToolRuntimeKind | str) -> ToolAdapter:
        kind = ToolRuntimeKind(runtime_kind)
        try:
            return self._adapters[kind]
        except KeyError as error:
            raise LookupError(f"No Tool Adapter registered for runtime kind: {kind.value}") from error

    def availability_error(
        self,
        runtime_kind: ToolRuntimeKind | str,
        definition: RegistryEntry,
        context: RuntimeContext,
    ) -> str | None:
        return self.resolve(runtime_kind).availability_error(definition, context)
