from pathlib import Path

from starlette.testclient import TestClient

from cosmos.api import create_app
from cosmos.config import RuntimeSettings
from cosmos.services.theme_package_service import canonical_manifest_digest


def test_theme_package_registry_persists_metadata_and_manifest_across_restart(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    manifest = _manifest()
    payload = {
        "schemaVersion": 1,
        "packageId": "max.theme-package.aurora",
        "packageVersion": manifest["version"],
        "manifestDigest": canonical_manifest_digest(manifest),
        "manifest": manifest,
        "source": {"kind": "prevalidated", "provenance": "automated backend test"},
    }

    with TestClient(create_app(settings)) as client:
        installed = client.post("/theme-packages", json=payload)
        listed = client.get("/theme-packages")

    with TestClient(create_app(settings)) as restarted_client:
        restored = restarted_client.get("/theme-packages")

    assert installed.status_code == 201
    assert listed.status_code == 200
    assert listed.json() == restored.json()
    record = restored.json()["items"][0]
    assert record["packageId"] == payload["packageId"]
    assert record["themeId"] == manifest["themeId"]
    assert record["manifestVersion"] == 1
    assert record["installStatus"] == "installed"
    assert record["manifest"] == manifest
    assert record["manifestDigest"] == payload["manifestDigest"]
    assert "assetBytes" not in record


def test_theme_package_registry_rejects_integrity_failure_and_duplicate_identity(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    manifest = _manifest()
    payload = {
        "schemaVersion": 1,
        "packageId": "max.theme-package.aurora",
        "packageVersion": manifest["version"],
        "manifestDigest": canonical_manifest_digest(manifest),
        "manifest": manifest,
        "source": {"kind": "prevalidated", "provenance": "automated backend test"},
    }

    with TestClient(create_app(settings)) as client:
        failed = client.post("/theme-packages", json={**payload, "manifestDigest": "0" * 64})
        installed = client.post("/theme-packages", json=payload)
        duplicate = client.post("/theme-packages", json=payload)
        listed = client.get("/theme-packages")

    assert failed.status_code == 422
    assert failed.json()["code"] == "theme_package_integrity_failed"
    assert installed.status_code == 201
    assert duplicate.status_code == 409
    assert duplicate.json()["code"] == "theme_package_conflict"
    assert len(listed.json()["items"]) == 1


def _manifest() -> dict:
    return {
        "schemaVersion": 1,
        "themeId": "max.theme.aurora",
        "version": "1.0.0",
        "displayName": "Aurora",
        "description": "A persisted backend test Theme.",
        "packageKind": "full-theme",
        "compatibility": {"themeEngine": "^1.0.0"},
        "groups": [
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
        ],
        "packRefs": [],
        "defaultCompositionRef": {
            "id": "max.composition.aurora",
            "versionRange": "^1.0.0",
        },
        "tokens": {
            "cosmos.color.background": {"type": "color", "value": "#07111f"},
        },
        "systemTerms": {"system.base": {"en": "Base"}},
        "author": {"name": "Max"},
    }
