from collections.abc import Mapping
from dataclasses import dataclass

from cosmos.domain.objects import JSONValue
from cosmos.runtime import ProviderRequest, ProviderRuntime, Registry, RuntimeResult
from cosmos.runtime.providers import ProviderDefinition, ProviderInvocation


@dataclass
class Adapter:
    definition: ProviderDefinition
    available: bool = True

    def availability_error(self) -> str | None:
        return None if self.available else "offline"

    def execute(self, invocation: ProviderInvocation) -> RuntimeResult:
        return RuntimeResult(self.definition.provider_id, invocation.payload["objective"], {})


class Compiler:
    def compile(self, request: ProviderRequest, provider: ProviderDefinition) -> ProviderInvocation:
        payload: Mapping[str, JSONValue] = {
            "objective": request.objective,
            "selected_profile": provider.provider_id,
        }
        return ProviderInvocation(payload=payload, timeout_seconds=request.timeout_seconds)


def definition(provider_id: str, capabilities: frozenset[str]) -> ProviderDefinition:
    return ProviderDefinition(
        provider_id=provider_id,
        display_name=provider_id,
        version="1.0.0",
        source_extension_id=f"{provider_id}.extension",
        capabilities=capabilities,
    )


def test_provider_runtime_selects_by_capability_and_availability() -> None:
    runtime = ProviderRuntime(Registry())
    runtime.register_adapter(
        Adapter(definition("cosmos.provider.a", frozenset({"conversation"}))), activate=True
    )
    runtime.register_adapter(
        Adapter(definition("cosmos.provider.b", frozenset({"conversation", "coding"}))),
        activate=True,
    )
    request = ProviderRequest(
        objective="Create a result",
        required_capabilities=frozenset({"coding"}),
        authorized_context_package={},
        preferences={},
    )

    result = runtime.execute(request, Compiler())

    assert result.provider_id == "cosmos.provider.b"
    assert result.output == "Create a result"
