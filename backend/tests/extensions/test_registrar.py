from pathlib import Path

import pytest

from cosmos.bootstrap import CosmosRuntime, RuntimeSettings
from cosmos.extensions import ExtensionManifest, ExtensionRegistrar
from cosmos.runtime import RegistryStatus, RuntimeContext
from cosmos.services import RuntimeServiceError


def owner_context() -> RuntimeContext:
    return RuntimeContext(
        permissions=frozenset(
            {
                "objects.read",
                "objects.write",
                "tools.read",
                "tools.write",
                "resources.read",
                "resources.write",
            }
        )
    )


def tool_manifest() -> ExtensionManifest:
    return ExtensionManifest.from_mapping(
        {
            "id": "example.extension.search",
            "display_name": "Example Search",
            "version": "1.2.0",
            "category": "user-tool",
            "runtime_api_version": "1",
            "runtime_kind": "service",
            "entry_points": {"tool": "service:search"},
            "capabilities": ["search", "preview"],
            "permissions": ["resources.read"],
        }
    )


def test_registrar_materializes_tool_manifest_into_object_and_active_registry(tmp_path: Path) -> None:
    runtime = CosmosRuntime.build(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))
    runtime.initialize()
    registrar = ExtensionRegistrar(runtime.objects, runtime.registry)

    entry = registrar.register_tool(tool_manifest(), owner_context())
    tool = runtime.objects.get("example.extension.search", owner_context())

    assert entry.status is RegistryStatus.ACTIVE
    assert entry.object_id == tool.identity.object_id
    assert entry.source_extension_id == "example.extension.search"
    assert entry.capabilities == frozenset({"search", "preview"})
    assert entry.permissions == frozenset({"resources.read"})
    assert tool.properties["runtime_kind"] == "service"
    assert tool.properties["entry_point"] == "service:search"
    assert {item["objectId"] for item in runtime.tools.definitions(
        owner_context(), required_capabilities=frozenset({"search", "preview"})
    )} == {"example.extension.search", "cosmos.tool.files"}


def test_registrar_rejects_duplicate_extension_registration(tmp_path: Path) -> None:
    runtime = CosmosRuntime.build(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))
    runtime.initialize()
    registrar = ExtensionRegistrar(runtime.objects, runtime.registry)
    registrar.register_tool(tool_manifest(), owner_context())

    with pytest.raises(RuntimeServiceError, match="Duplicate Registry component ID"):
        registrar.register_tool(tool_manifest(), owner_context())
