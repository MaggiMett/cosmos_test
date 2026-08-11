from __future__ import annotations

import argparse
import hashlib
import io
import json
import zipfile
from pathlib import Path
from typing import Any

QA_THEME_ID = "qa.theme.room-visuals"
QA_PACKAGE_ID = "qa.theme-package.room-visuals"
QA_SKIN_PACK_ID = "qa.skin-pack.room-visuals"
QA_SKIN_ID = "qa.skin.room-visuals.base"
QA_ASSET_ID = "qa.visual.room-grid"
QA_ASSET_VERSION = "1.0.0"
QA_ASSET_PATH = f"visual-assets/{QA_ASSET_ID}/{QA_ASSET_VERSION}/original.svg"
QA_ASSET = (
    b'<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90" viewBox="0 0 160 90">'
    b'<rect width="160" height="90" fill="#17384a"/>'
    b'<path d="M0 22.5H160M0 45H160M0 67.5H160M40 0V90M80 0V90M120 0V90" '
    b'stroke="#d69b62" stroke-opacity=".42" stroke-width="1"/>'
    b"</svg>"
)

REQUIRED_GROUPS = [
    "world",
    "map",
    "base-entry",
    "base-interior",
    "room",
    "workspace",
    "window",
    "companion",
    "icon",
    "node",
    "connection",
    "label",
    "status",
]


def create_theme_visuals_qa_package() -> bytes:
    """Build a ZIP-v1 package used only by automated tests and local QA."""
    asset_digest = hashlib.sha256(QA_ASSET).hexdigest()
    visual_asset: dict[str, Any] = {
        "schemaVersion": 1,
        "id": QA_ASSET_ID,
        "version": QA_ASSET_VERSION,
        "kind": "vector",
        "format": "svg",
        "mimeType": "image/svg+xml",
        "path": QA_ASSET_PATH,
        "sha256": asset_digest,
        "byteSize": len(QA_ASSET),
        "width": 160,
        "height": 90,
        "alpha": True,
    }
    catalog_entry: dict[str, Any] = {
        "schemaVersion": 1,
        "id": "qa.catalog.room-grid",
        "version": QA_ASSET_VERSION,
        "visualAssetRef": {"id": QA_ASSET_ID, "version": QA_ASSET_VERSION},
        "displayName": "Room Visuals QA Grid",
        "description": "Static test-only asset for Theme presentation acceptance.",
        "category": "cosmos.category.environment",
        "scope": "theme",
        "theme": QA_THEME_ID,
        "origin": "imported",
        "systemTags": ["cosmos.asset.visual", "cosmos.qa.fixture"],
        "userTags": [],
        "perspective": "front",
        "orientation": "landscape",
        "scaleClass": "room",
        "creator": {"name": "Cosmos QA"},
        "provenance": {"kind": "imported", "source": "test-fixture"},
        "license": {"expression": "CC0-1.0"},
        "compatibleTemplates": [{"id": "base.main-room.v1", "versionRange": "^1.0.0"}],
        "compatibleSurfaceTypes": [],
        "compatibleVisualObjectTypes": [],
        "deprecated": False,
    }
    skin_pack: dict[str, Any] = {
        "schemaVersion": 1,
        "packId": QA_SKIN_PACK_ID,
        "version": "1.0.0",
        "packageKind": "skin-pack",
        "displayName": "Room Visuals QA Skin",
        "compatibility": {"themeEngine": "^1.0.0"},
        "assets": [
            {
                "assetId": QA_ASSET_ID,
                "kind": "vector",
                "format": "svg",
                "mimeType": "image/svg+xml",
                "path": QA_ASSET_PATH,
                "sha256": asset_digest,
                "byteSize": len(QA_ASSET),
                "width": 160,
                "height": 90,
                "alpha": True,
            }
        ],
        "skins": [
            {
                "skinId": QA_SKIN_ID,
                "version": "1.0.0",
                "displayName": "Base Rooms QA",
                "target": {
                    "presentationGroup": "base-interior",
                    "templateRef": {"id": "base.main-room.v1", "versionRange": "^1.0.0"},
                },
                "assetBindings": [
                    {
                        "bindingId": "qa.binding.room-visuals.background",
                        "slotId": "base.slot.background",
                        "assetId": QA_ASSET_ID,
                        "fit": "cover",
                        "alignment": "center",
                        "opacity": 0.9,
                    }
                ],
                "tokens": {},
                "materials": [
                    {
                        "channelId": "core.material.dom-surface",
                        "parameters": {
                            "core.material.fill": "#17384a",
                            "core.material.stroke": "#d69b62",
                            "core.material.opacity": 0.82,
                            "core.material.texture-ref": QA_ASSET_ID,
                        },
                    }
                ],
                "stateVariants": [
                    {
                        "stateId": "default",
                        "assetBindingIds": ["qa.binding.room-visuals.background"],
                    }
                ],
            }
        ],
    }
    manifest: dict[str, Any] = {
        "schemaVersion": 1,
        "themeId": QA_THEME_ID,
        "version": "1.0.0",
        "displayName": "Room Visuals QA",
        "description": "Test-only Theme for Main Room and Workshop presentation acceptance.",
        "packageKind": "full-theme",
        "compatibility": {"themeEngine": "^1.0.0", "cosmos": "^1.0.0"},
        "groups": REQUIRED_GROUPS,
        "packRefs": [{"id": QA_SKIN_PACK_ID, "versionRange": "^1.0.0"}],
        "defaultCompositionRef": {"id": "qa.composition.room-visuals", "versionRange": "^1.0.0"},
        "tokens": {
            "cosmos.color.background": {"type": "color", "value": "#07131c"},
            "cosmos.color.accent": {"type": "color", "value": "#d69b62"},
        },
        "systemTerms": {"system.base": {"en": "Base"}},
        "author": {"name": "Cosmos QA"},
    }
    skin_path = f"skin-packs/{QA_SKIN_PACK_ID}/1.0.0/skin-pack.json"
    descriptor: dict[str, Any] = {
        "schemaVersion": 1,
        "packageId": QA_PACKAGE_ID,
        "packageVersion": "1.0.0",
        "manifest": {"path": "theme-manifest.json", "sha256": _canonical_digest(manifest)},
        "assets": [{"visualAsset": visual_asset, "catalogEntry": catalog_entry}],
        "skinPacks": [{"path": skin_path, "sha256": _canonical_digest(skin_pack)}],
    }

    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("cosmos-theme-package.json", _json_bytes(descriptor))
        archive.writestr("theme-manifest.json", _json_bytes(manifest))
        archive.writestr(skin_path, _json_bytes(skin_pack))
        archive.writestr(QA_ASSET_PATH, QA_ASSET)
    return stream.getvalue()


def _canonical_digest(value: dict[str, Any]) -> str:
    return hashlib.sha256(_json_bytes(value, sort_keys=True)).hexdigest()


def _json_bytes(value: object, *, sort_keys: bool = False) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=sort_keys,
    ).encode("utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Create the test-only Room Visuals QA Theme Package.")
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    args.output.write_bytes(create_theme_visuals_qa_package())


if __name__ == "__main__":
    main()
