from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Protocol

from cosmos.domain.objects import JSONValue
from cosmos.runtime.registry import Registry, RegistryEntry, RegistryStatus


@dataclass(frozen=True, slots=True)
class ProviderDefinition:
    provider_id: str
    display_name: str
    version: str
    source_extension_id: str
    capabilities: frozenset[str]
    models: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class ProviderRequest:
    objective: str
    required_capabilities: frozenset[str]
    authorized_context_package: Mapping[str, JSONValue]
    preferences: Mapping[str, JSONValue]
    privacy_constraints: frozenset[str] = frozenset()
    execution_options: Mapping[str, JSONValue] | None = None
    timeout_seconds: float = 60.0


@dataclass(frozen=True, slots=True)
class ProviderInvocation:
    payload: Mapping[str, JSONValue]
    timeout_seconds: float


@dataclass(frozen=True, slots=True)
class RuntimeResult:
    provider_id: str
    output: JSONValue
    metadata: Mapping[str, JSONValue]


class ProviderAdapter(Protocol):
    definition: ProviderDefinition

    def availability_error(self) -> str | None: ...

    def execute(self, invocation: ProviderInvocation) -> RuntimeResult: ...


class ProviderRequestCompiler(Protocol):
    def compile(self, request: ProviderRequest, provider: ProviderDefinition) -> ProviderInvocation: ...


class ProviderRuntime:
    """Authoritative capability matching, selection, routing, and execution boundary."""

    def __init__(self, registry: Registry) -> None:
        self._registry = registry
        self._adapters: dict[str, ProviderAdapter] = {}

    def register_adapter(self, adapter: ProviderAdapter, *, activate: bool = False) -> None:
        definition = adapter.definition
        self._registry.register(
            RegistryEntry(
                component_id=definition.provider_id,
                display_name=definition.display_name,
                category="provider",
                version=definition.version,
                runtime_api_version="1",
                source_extension_id=definition.source_extension_id,
                capabilities=definition.capabilities,
                entry_point=type(adapter).__qualname__,
            )
        )
        self._adapters[definition.provider_id] = adapter
        if activate:
            self._registry.activate(definition.provider_id)

    def select(self, request: ProviderRequest) -> ProviderAdapter:
        candidates = self._registry.query(category="provider", status=RegistryStatus.ACTIVE)
        for entry in candidates:
            if not request.required_capabilities.issubset(entry.capabilities):
                continue
            adapter = self._adapters[entry.component_id]
            if adapter.availability_error() is None:
                return adapter
        raise LookupError("No active, available Provider satisfies the requested capabilities.")

    def execute(self, request: ProviderRequest, compiler: ProviderRequestCompiler) -> RuntimeResult:
        adapter = self.select(request)
        invocation = compiler.compile(request, adapter.definition)
        return adapter.execute(invocation)
