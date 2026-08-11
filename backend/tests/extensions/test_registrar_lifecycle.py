from pathlib import Path

import pytest

from cosmos.bootstrap import CosmosRuntime, RuntimeSettings
from cosmos.extensions import ExtensionManifest
from cosmos.runtime import RegistryStatus, RuntimeContext
from cosmos.services import RuntimeServiceError


def context(*permissions: str) -> RuntimeContext:
    return RuntimeContext(permissions=frozenset(permissions))


def owner_context() -> RuntimeContext:
    return context(
        "objects.read",
        "objects.write",
        "tools.read",
        "tools.write",
        "resources.read",
        "runtime_state.read",
        "workspaces.write",
    )


def manifest() -> ExtensionManifest:
    return ExtensionManifest.from_mapping(
        {
            "id": "example.extension.lifecycle",
            "display_name": "Lifecycle Tool",
            "version": "1.0.0",
            "category": "user-tool",
            "runtime_api_version": "1",
            "runtime_kind": "service",
            "entry_points": {"tool": "service:lifecycle"},
            "capabilities": ["lifecycle-test"],
            "permissions": ["resources.read"],
        }
    )


def test_disable_hides_extension_and_blocks_new_tool_instances_without_closing_existing_ones(tmp_path: Path) -> None:
    runtime = CosmosRuntime.build(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))
    runtime.initialize()
    owner = owner_context()
    runtime.extensions.register_tool(manifest(), owner)
    session = runtime.workspaces.open("cosmos.workspace.creation", "cosmos.room.main", owner)
    existing = runtime.tools.open_workspace_tool(
        "example.extension.lifecycle", str(session["objectId"]), owner
    )

    disabled = runtime.extensions.disable_tool("example.extension.lifecycle", owner)

    assert disabled.status is RegistryStatus.DISABLED
    assert runtime.tools.definitions(owner, required_capabilities=frozenset({"lifecycle-test"})) == []
    assert runtime.tools._runtime.get(existing.object_id).object_id == existing.object_id
    with pytest.raises(RuntimeServiceError, match="not active"):
        runtime.tools.open_workspace_tool(
            "example.extension.lifecycle", str(session["objectId"]), owner
        )


def test_enable_restores_extension_discovery(tmp_path: Path) -> None:
    runtime = CosmosRuntime.build(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))
    runtime.initialize()
    owner = owner_context()
    runtime.extensions.register_tool(manifest(), owner)
    runtime.extensions.disable_tool("example.extension.lifecycle", owner)

    enabled = runtime.extensions.enable_tool("example.extension.lifecycle", owner)

    assert enabled.status is RegistryStatus.ACTIVE
    assert [item["objectId"] for item in runtime.tools.definitions(
        owner, required_capabilities=frozenset({"lifecycle-test"})
    )] == ["example.extension.lifecycle"]


def test_extension_lifecycle_requires_tool_write_permission(tmp_path: Path) -> None:
    runtime = CosmosRuntime.build(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))
    runtime.initialize()
    runtime.extensions.register_tool(manifest(), owner_context())

    with pytest.raises(RuntimeServiceError, match="tools.write"):
        runtime.extensions.disable_tool(
            "example.extension.lifecycle", context("objects.read", "tools.read")
        )
