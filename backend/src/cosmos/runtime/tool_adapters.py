from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Protocol

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
