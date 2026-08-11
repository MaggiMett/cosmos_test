import json
from pathlib import Path

import pytest

from cosmos.extensions import ExtensionCategory, ExtensionManifest, ManifestValidationError


def test_manifest_parses_supported_extension_category() -> None:
    manifest = ExtensionManifest.from_mapping(
        {
            "id": "cosmos.provider.example",
            "display_name": "Example",
            "version": "1.0.0",
            "category": "provider",
            "runtime_api_version": "1",
            "permissions": ["providers.execute"],
        }
    )

    assert manifest.category is ExtensionCategory.PROVIDER
    assert manifest.permissions == frozenset({"providers.execute"})


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
