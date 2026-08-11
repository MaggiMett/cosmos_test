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
        return tool_entry_point_error(self.runtime_kind, definition.entry_point)

    def open(self, context: ToolAdapterContext) -> None:
        pass

    def update(self, context: ToolAdapterContext) -> None:
        pass

    def close(self, context: ToolAdapterContext) -> None:
        pass


class DesktopToolAdapter:
    runtime_kind = ToolRuntimeKind.DESKTOP

    def availability_error(self, definition: RegistryEntry, context: RuntimeContext) -> str | None:
        return tool_entry_point_error(self.runtime_kind, definition.entry_point)

    def open(self, context: ToolAdapterContext) -> None:
        pass

    def update(self, context: ToolAdapterContext) -> None:
        pass

    def close(self, context: ToolAdapterContext) -> None:
        pass


class CommandToolAdapter:
    runtime_kind = ToolRuntimeKind.COMMAND

    def availability_error(self, definition: RegistryEntry, context: RuntimeContext) -> str | None:
        return tool_entry_point_error(self.runtime_kind, definition.entry_point)

    def open(self, context: ToolAdapterContext) -> None:
        pass

    def update(self, context: ToolAdapterContext) -> None:
        pass

    def close(self, context: ToolAdapterContext) -> None:
        pass


class ServiceToolAdapter:
    runtime_kind = ToolRuntimeKind.SERVICE

    def availability_error(self, definition: RegistryEntry, context: RuntimeContext) -> str | None:
        return tool_entry_point_error(self.runtime_kind, definition.entry_point)

    def open(self, context: ToolAdapterContext) -> None:
        pass

    def update(self, context: ToolAdapterContext) -> None:
        pass

    def close(self, context: ToolAdapterContext) -> None:
        pass


class WebToolAdapter:
    runtime_kind = ToolRuntimeKind.WEB

    def availability_error(self, definition: RegistryEntry, context: RuntimeContext) -> str | None:
        return tool_entry_point_error(self.runtime_kind, definition.entry_point)

    def open(self, context: ToolAdapterContext) -> None:
        pass

    def update(self, context: ToolAdapterContext) -> None:
        pass

    def close(self, context: ToolAdapterContext) -> None:
        pass


def tool_entry_point_error(runtime_kind: ToolRuntimeKind | str, entry_point: str) -> str | None:
    kind = ToolRuntimeKind(runtime_kind)
    value = entry_point.strip()
    if kind is ToolRuntimeKind.NATIVE:
        return None if value else "Native Tool entry point is required."
    if kind is ToolRuntimeKind.WEB:
        if not value:
            return "Web Tool entry point is required."
        parsed = urlparse(value)
        return None if parsed.scheme in {"http", "https"} and parsed.netloc else "Web Tool entry point must be an absolute HTTP(S) URL."
    namespace = {
        ToolRuntimeKind.SERVICE: ("service:", "Service Tool entry point must use the service:<action> namespace."),
        ToolRuntimeKind.COMMAND: ("command:", "Command Tool entry point must use the command:<name> namespace."),
        ToolRuntimeKind.DESKTOP: ("desktop:", "Desktop Tool entry point must use the desktop:<application> namespace."),
    }
    prefix, error = namespace[kind]
    return None if value.startswith(prefix) and value.removeprefix(prefix).strip() else error


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
