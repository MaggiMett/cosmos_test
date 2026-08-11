import json
from pathlib import Path

from cosmos.extensions import ExtensionDiscovery, ExtensionValidator
from cosmos.runtime import Registry, RegistryEntry


def candidate(tmp_path: Path, overrides: dict | None = None):
    package = tmp_path / "extensions" / "user-tools" / "example.search"
    package.mkdir(parents=True)
    manifest = {
        "id": "example.search",
        "display_name": "Example Search",
        "version": "1.0.0",
        "category": "user-tool",
        "runtime_api_version": "1",
        "runtime_kind": "service",
        "entry_points": {"tool": "service:search"},
        "capabilities": ["search"],
        "permissions": ["resources.read"],
        "dependencies": ["example.engine"],
    }
    manifest.update(overrides or {})
    (package / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    return ExtensionDiscovery(tmp_path / "extensions").discover()[0]


def test_validator_accepts_static_v1_package(tmp_path: Path) -> None:
    result = ExtensionValidator(Registry()).validate(candidate(tmp_path))

    assert result.valid
    assert result.manifest is not None
    assert result.manifest.extension_id == "example.search"
    assert result.errors == ()


def test_validator_rejects_invalid_json_without_executing_package(tmp_path: Path) -> None:
    found = candidate(tmp_path)
    found.manifest_path.write_text("not-json", encoding="utf-8")

    result = ExtensionValidator(Registry()).validate(found)

    assert not result.valid
    assert result.manifest is None
    assert "JSON" in result.errors[0]


def test_validator_checks_runtime_api_permissions_and_self_dependency(tmp_path: Path) -> None:
    result = ExtensionValidator(Registry()).validate(
        candidate(
            tmp_path,
            {
                "runtime_api_version": "99",
                "permissions": ["resources.read", "host.unrestricted"],
                "dependencies": ["example.search"],
            },
        )
    )

    assert not result.valid
    assert any("runtime API version" in error for error in result.errors)
    assert any("host.unrestricted" in error for error in result.errors)
    assert any("depend on itself" in error for error in result.errors)


def test_validator_detects_registry_component_conflict(tmp_path: Path) -> None:
    registry = Registry()
    registry.register(
        RegistryEntry(
            component_id="example.search",
            display_name="Existing",
            category="tool",
            version="1.0.0",
            runtime_api_version="1",
            source_extension_id="example.search",
            capabilities=frozenset(),
            permissions=frozenset(),
            entry_point="service:existing",
            object_id="example.search",
        )
    )

    result = ExtensionValidator(registry).validate(candidate(tmp_path))

    assert not result.valid
    assert any("already exists" in error for error in result.errors)
