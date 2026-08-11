import json
from pathlib import Path

from cosmos.bootstrap import CosmosRuntime, RuntimeSettings, StartupPhase
from cosmos.runtime import RuntimeContext


def write_tool(root: Path, package: str, manifest: dict | str) -> None:
    path = root / "user-tools" / package
    path.mkdir(parents=True)
    content = manifest if isinstance(manifest, str) else json.dumps(manifest)
    (path / "manifest.json").write_text(content, encoding="utf-8")


def tool_manifest(extension_id: str) -> dict:
    return {
        "id": extension_id,
        "display_name": extension_id,
        "version": "1.0.0",
        "category": "user-tool",
        "runtime_api_version": "1",
        "runtime_kind": "service",
        "entry_points": {"tool": "service:test"},
        "capabilities": ["external-test"],
        "permissions": [],
    }


def test_runtime_startup_discovers_validates_and_registers_external_tools(tmp_path: Path) -> None:
    extensions = tmp_path / "InstalledExtensions"
    write_tool(extensions, "example.good", tool_manifest("example.good"))
    runtime = CosmosRuntime.build(
        RuntimeSettings(runtime_path=tmp_path / "Runtime", extensions_path=extensions, port=0)
    )

    runtime.initialize()

    assert runtime.startup.phase is StartupPhase.READY
    definitions = runtime.tools.definitions(
        RuntimeContext(permissions=frozenset({"objects.read", "tools.read"})),
        required_capabilities=frozenset({"external-test"}),
    )
    assert [definition["objectId"] for definition in definitions] == ["example.good"]


def test_broken_extension_does_not_abort_runtime_startup_or_other_packages(tmp_path: Path) -> None:
    extensions = tmp_path / "InstalledExtensions"
    write_tool(extensions, "00-broken", "not-json")
    write_tool(extensions, "01-good", tool_manifest("example.good"))
    runtime = CosmosRuntime.build(
        RuntimeSettings(runtime_path=tmp_path / "Runtime", extensions_path=extensions, port=0)
    )

    runtime.initialize()

    assert runtime.startup.phase is StartupPhase.READY
    assert runtime.registry.resolve("example.good").component_id == "example.good"
