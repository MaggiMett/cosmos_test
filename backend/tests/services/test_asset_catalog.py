import base64
import hashlib
from pathlib import Path

from starlette.testclient import TestClient

from cosmos.api import create_app
from cosmos.config import RuntimeSettings


def test_static_asset_promotion_persists_original_catalog_and_reload(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    payload = _promotion_payload(_safe_svg())

    with TestClient(create_app(settings)) as client:
        promoted = client.post("/asset-catalog", json=payload)
        listed = client.get("/asset-catalog")
        preview = client.get(
            f"/asset-catalog/visual-assets/{payload['visualAsset']['id']}"
            f"/versions/{payload['visualAsset']['version']}/content"
        )

    assert promoted.status_code == 201
    assert listed.status_code == 200
    assert len(listed.json()["items"]) == 1
    assert listed.json()["items"][0]["resource"]["available"] is True
    assert preview.status_code == 200
    assert preview.content == _safe_svg()
    assert preview.headers["content-type"] == "image/svg+xml"

    with TestClient(create_app(settings)) as restarted_client:
        reloaded = restarted_client.get("/asset-catalog")
        reloaded_preview = restarted_client.get(
            f"/asset-catalog/visual-assets/{payload['visualAsset']['id']}"
            f"/versions/{payload['visualAsset']['version']}/content"
        )

    item = reloaded.json()["items"][0]
    assert item["catalogEntry"]["displayName"] == "Persistent Swatch"
    assert item["catalogEntry"]["scope"] == "personal"
    assert item["catalogEntry"]["category"] == "personal.category.decoration"
    assert item["catalogEntry"]["version"] == "1.0.0"
    assert reloaded_preview.content == _safe_svg()
    serialized = str(item).casefold()
    assert "placement" not in serialized
    assert "interaction" not in serialized
    assert "functionbinding" not in serialized


def test_unsafe_svg_is_rejected_without_catalog_or_resource(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    unsafe = b'<svg width="10" height="10"><script>alert(1)</script></svg>'

    with TestClient(create_app(settings)) as client:
        response = client.post("/asset-catalog", json=_promotion_payload(unsafe))
        listed = client.get("/asset-catalog")

    assert response.status_code == 422
    assert response.json()["code"] == "unsafe_svg"
    assert listed.json() == {"items": []}
    resource_root = settings.runtime_path / "Resources"
    assert not resource_root.exists() or not any(resource_root.rglob("original.svg"))


def test_storage_failure_rolls_back_metadata_and_retry_succeeds(
    tmp_path: Path,
) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    app = create_app(settings)
    payload = _promotion_payload(_safe_svg())

    with TestClient(app) as client:
        service = app.state.runtime.resources
        finalize = service._finalize_staged_asset

        def fail_storage(_staged: Path, _final: Path) -> None:
            raise OSError("simulated disk failure")

        service._finalize_staged_asset = fail_storage
        failed = client.post("/asset-catalog", json=payload)
        after_failure = client.get("/asset-catalog")
        service._finalize_staged_asset = finalize
        retried = client.post("/asset-catalog", json=payload)

    assert failed.status_code == 503
    assert failed.json()["code"] == "asset_storage_failed"
    assert after_failure.json() == {"items": []}
    assert retried.status_code == 201


def test_missing_original_resource_remains_visible_and_recoverable(
    tmp_path: Path,
) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    payload = _promotion_payload(_safe_svg())
    resource_path = settings.runtime_path / "Resources" / payload["visualAsset"]["path"]

    with TestClient(create_app(settings)) as client:
        assert client.post("/asset-catalog", json=payload).status_code == 201
        resource_path.unlink()
        listed = client.get("/asset-catalog")
        missing = client.get(
            f"/asset-catalog/visual-assets/{payload['visualAsset']['id']}"
            f"/versions/{payload['visualAsset']['version']}/content"
        )
        resource_path.parent.mkdir(parents=True, exist_ok=True)
        resource_path.write_bytes(_safe_svg())
        recovered = client.get(
            f"/asset-catalog/visual-assets/{payload['visualAsset']['id']}"
            f"/versions/{payload['visualAsset']['version']}/content"
        )

    assert listed.json()["items"][0]["resource"]["available"] is False
    assert missing.status_code == 404
    assert missing.json()["code"] == "resource_not_found"
    assert recovered.status_code == 200
    assert recovered.content == _safe_svg()


def _safe_svg() -> bytes:
    return (
        b'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">'
        b'<rect width="10" height="10" fill="#4caf78"/></svg>'
    )


def _promotion_payload(content: bytes) -> dict[str, object]:
    digest = hashlib.sha256(content).hexdigest()
    asset_id = f"personal.visual-asset.{digest}"
    entry_id = f"personal.asset-catalog.{digest}"
    version = "1.0.0"
    return {
        "visualAsset": {
            "schemaVersion": 1,
            "id": asset_id,
            "version": version,
            "kind": "vector",
            "format": "svg",
            "mimeType": "image/svg+xml",
            "path": f"visual-assets/{asset_id}/{version}/original.svg",
            "sha256": digest,
            "byteSize": len(content),
            "width": 10,
            "height": 10,
            "alpha": True,
        },
        "catalogEntry": {
            "schemaVersion": 1,
            "id": entry_id,
            "version": version,
            "visualAssetRef": {"id": asset_id, "version": version},
            "displayName": "Persistent Swatch",
            "description": "A safe static SVG stored through ResourceService.",
            "category": "personal.category.decoration",
            "scope": "personal",
            "origin": "imported",
            "systemTags": ["cosmos.asset.visual"],
            "userTags": ["green"],
            "perspective": "unspecified",
            "orientation": "square",
            "scaleClass": "small",
            "creator": {"name": "Cosmos Tester"},
            "provenance": {"kind": "imported", "source": "persistent-swatch.svg"},
            "license": {"expression": "CC0-1.0"},
            "compatibleTemplates": [],
            "compatibleSurfaceTypes": [],
            "compatibleVisualObjectTypes": [],
            "deprecated": False,
        },
        "originalBytesBase64": base64.b64encode(content).decode("ascii"),
    }
