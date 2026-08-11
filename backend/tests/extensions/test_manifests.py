import json
from pathlib import Path

import pytest

from cosmos.extensions import (
    ExtensionCategory,
    ExtensionManifest,
    ExtensionRuntimeKind,
    ManifestValidationError,
)


def test_manifest_parses_supported_extension_category() -> None:
    manifest = ExtensionManifest.from_mapping(
        {
            "id": "cosmos.provider.example",
            "display_name": "Example",
            "version": "1.0.0",
            "category": "provider",
            "runtime_api_version": "1",
            "runtime_kind": "service",
            "permissions": ["providers.execute"],
        }
    )

    assert manifest.category is ExtensionCategory.PROVIDER
    assert manifest.runtime_kind is ExtensionRuntimeKind.SERVICE
    assert manifest.permissions == frozenset({"providers.execute"})


@pytest.mark.parametrize(
    ("runtime_kind", "entry_point"),
    [
        ("native", "@example/runtime:tool"),
        ("web", "https://tools.example.test/app"),
        ("service", "service:search"),
        ("desktop", "desktop:photos"),
        ("command", "command:reindex"),
    ],
)
def test_tool_manifest_accepts_v1_runtime_entry_point_pairs(runtime_kind: str, entry_point: str) -> None:
    manifest = ExtensionManifest.from_mapping(
        {
            "id": "cosmos.tool.example",
            "display_name": "Example",
            "version": "1.0.0",
            "category": "user-tool",
            "runtime_api_version": "1",
            "runtime_kind": runtime_kind,
            "entry_points": {"tool": entry_point},
        }
    )

    assert manifest.runtime_kind is ExtensionRuntimeKind(runtime_kind)
    assert manifest.entry_points["tool"] == entry_point


def test_tool_manifest_rejects_runtime_entry_point_mismatch() -> None:
    with pytest.raises(ManifestValidationError, match="command:<name>"):
        ExtensionManifest.from_mapping(
            {
                "id": "cosmos.tool.example",
                "display_name": "Example",
                "version": "1.0.0",
                "category": "user-tool",
                "runtime_api_version": "1",
                "runtime_kind": "command",
                "entry_points": {"tool": "service:reindex"},
            }
        )


def test_manifest_rejects_unsupported_runtime_kind() -> None:
    with pytest.raises(ManifestValidationError, match="runtime kind"):
        ExtensionManifest.from_mapping(
            {
                "id": "cosmos.tool.example",
                "display_name": "Example",
                "version": "1.0.0",
                "category": "user-tool",
                "runtime_api_version": "1",
                "runtime_kind": "container",
            }
        )


def test_manifest_rejects_non_extension_architectural_category() -> None:
    with pytest.raises(ManifestValidationError, match="Unsupported"):
        ExtensionManifest.from_mapping(
            {
                "id": "cosmos.structure-template.example",
                "display_name": "Invalid",
                "version": "1.0.0",
                "category": "structure-template",
                "runtime_api_version": "1",
            }
        )


def test_python_categories_match_shared_manifest_schema() -> None:
    schema_path = Path(__file__).parents[3] / "contracts" / "schemas" / "extension-manifest.v1.schema.json"
    schema = json.loads(schema_path.read_text(encoding="utf-8"))

    assert set(schema["properties"]["category"]["enum"]) == {category.value for category in ExtensionCategory}
    assert set(schema["properties"]["runtime_kind"]["enum"]) == {
        runtime_kind.value for runtime_kind in ExtensionRuntimeKind
    }
