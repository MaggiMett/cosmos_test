from dataclasses import dataclass

import pytest

from cosmos.runtime import (
    NativeToolAdapter,
    RegistryEntry,
    RuntimeContext,
    ServiceToolAdapter,
    ToolAdapterContext,
    ToolAdapterRegistry,
    ToolRuntime,
    ToolRuntimeKind,
    WebToolAdapter,
)
from cosmos.services import create_version_one_object_contract


@dataclass
class StubAdapter:
    runtime_kind: ToolRuntimeKind
    unavailable: str | None = None
    opened: ToolAdapterContext | None = None
    updated: ToolAdapterContext | None = None
    closed: ToolAdapterContext | None = None

    def availability_error(self, definition: RegistryEntry, context: RuntimeContext) -> str | None:
        return self.unavailable

    def open(self, context: ToolAdapterContext) -> None:
        self.opened = context

    def update(self, context: ToolAdapterContext) -> None:
        self.updated = context

    def close(self, context: ToolAdapterContext) -> None:
        self.closed = context


def definition(entry_point: str = "tests:test-tool") -> RegistryEntry:
    return RegistryEntry(
        component_id="cosmos.tool.test",
        display_name="Test Tool",
        category="tool",
        version="1.0.0",
        runtime_api_version="1",
        source_extension_id="cosmos.tests",
        entry_point=entry_point,
        object_id="cosmos.tool.test",
    )


def test_native_tool_adapter_is_available_and_keeps_lifecycle_external() -> None:
    adapter = NativeToolAdapter()

    assert adapter.runtime_kind is ToolRuntimeKind.NATIVE
    assert adapter.availability_error(definition(), RuntimeContext()) is None


def test_service_tool_adapter_requires_a_namespaced_entry_point() -> None:
    adapter = ServiceToolAdapter()

    assert adapter.availability_error(definition(entry_point="service:search"), RuntimeContext()) is None
    assert "namespace" in str(adapter.availability_error(definition(entry_point="search"), RuntimeContext()))
    assert "namespace" in str(
        adapter.availability_error(definition(entry_point="https://services.example.test/search"), RuntimeContext())
    )


def test_web_tool_adapter_requires_an_absolute_http_entry_point() -> None:
    adapter = WebToolAdapter()

    assert adapter.availability_error(definition(entry_point="https://tools.example.test/app"), RuntimeContext()) is None
    assert "HTTP(S)" in str(adapter.availability_error(definition(entry_point="./app"), RuntimeContext()))
    assert "required" in str(adapter.availability_error(definition(entry_point=""), RuntimeContext()))


def test_tool_adapter_registry_dispatches_by_runtime_kind() -> None:
    adapters = ToolAdapterRegistry()
    native = StubAdapter(ToolRuntimeKind.NATIVE)
    adapters.register(native)

    assert adapters.resolve("native") is native
    assert adapters.availability_error("native", definition(), RuntimeContext()) is None
    with pytest.raises(LookupError, match="web"):
        adapters.resolve(ToolRuntimeKind.WEB)


def test_tool_adapter_registry_rejects_duplicate_runtime_kind() -> None:
    adapters = ToolAdapterRegistry()
    adapters.register(StubAdapter(ToolRuntimeKind.NATIVE))

    with pytest.raises(ValueError, match="Duplicate Tool Adapter"):
        adapters.register(StubAdapter(ToolRuntimeKind.NATIVE))


def test_adapter_context_reuses_tool_runtime_owned_instance() -> None:
    runtime = ToolRuntime(create_version_one_object_contract(), lambda: "adapter")
    runtime_context = RuntimeContext(workspace_session_id="workspace-a")
    instance = runtime.create(
        "cosmos.tool.test", runtime_context, workspace_session_id="workspace-a"
    )
    adapter_context = ToolAdapterContext(definition(), instance, runtime_context)
    adapter = StubAdapter(ToolRuntimeKind.NATIVE)

    adapter.open(adapter_context)
    adapter.update(adapter_context)
    adapter.close(adapter_context)

    assert adapter.opened is adapter_context
    assert adapter.updated is adapter_context
    assert adapter.closed is adapter_context
    assert runtime.get(instance.object_id) is instance
