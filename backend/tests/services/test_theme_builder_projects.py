import base64
import hashlib
import sqlite3
from pathlib import Path

from starlette.testclient import TestClient

from cosmos.api import create_app
from cosmos.config import RuntimeSettings


def test_theme_builder_project_persists_real_empty_draft_across_restart(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    with TestClient(create_app(settings)) as client:
        created = client.post(
            "/theme-builder/projects",
            json={"name": "Quiet Orbit", "description": "A real draft.", "author": "Max"},
        )
        project = created.json()
        listed = client.get("/theme-builder/projects").json()["items"]

    with TestClient(create_app(settings)) as restarted:
        restored = restarted.get(f"/theme-builder/projects/{project['builderProjectId']}")

    assert created.status_code == 201
    assert project["builderProjectId"].startswith("user.theme-builder-project.")
    assert project["themeId"].startswith("user.theme.")
    assert project["packageId"].startswith("user.theme-package.")
    assert project["revision"] == 1
    assert project["artifacts"] == {"skinPacks": [], "roomShells": [], "catalogObjects": []}
    assert project["assetRefs"] == []
    assert listed == [project]
    assert restored.status_code == 200
    assert restored.json() == project


def test_metadata_save_is_revisioned_atomic_and_does_not_install_a_theme(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    with TestClient(create_app(settings)) as client:
        project = _create(client)
        saved = client.put(
            f"/theme-builder/projects/{project['builderProjectId']}",
            json={
                "expectedRevision": 1,
                "metadata": {
                    "name": "Revised Orbit",
                    "description": "Still a draft.",
                    "author": "Cosmos Team",
                },
            },
        )
        packages = client.get("/theme-packages")

    assert saved.status_code == 200
    document = saved.json()
    assert document["revision"] == 2
    assert document["name"] == "Revised Orbit"
    assert document["manifestDraft"]["displayName"] == "Revised Orbit"
    assert document["manifestDraft"]["author"] == {"name": "Cosmos Team"}
    assert packages.json() == {"items": []}


def test_stale_revision_conflict_never_overwrites_authoritative_document(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    with TestClient(create_app(settings)) as client:
        project = _create(client)
        path = f"/theme-builder/projects/{project['builderProjectId']}"
        first = client.put(
            path,
            json={"expectedRevision": 1, "metadata": {"name": "First", "description": "", "author": ""}},
        )
        stale = client.put(
            path,
            json={"expectedRevision": 1, "metadata": {"name": "Stale", "description": "", "author": ""}},
        )
        authoritative = client.get(path)

    assert first.status_code == 200
    assert stale.status_code == 409
    assert stale.json()["code"] == "theme_builder_project_revision_conflict"
    assert authoritative.json()["revision"] == 2
    assert authoritative.json()["name"] == "First"


def test_builder_foundation_reuses_normalized_object_tables(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    with TestClient(create_app(settings)) as client:
        _create(client)
    with sqlite3.connect(settings.database_path) as connection:
        tables = {row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type = 'table'")}
        record = connection.execute(
            "SELECT object_id FROM objects WHERE object_id LIKE 'user.theme-builder-project.%'"
        ).fetchone()

    assert record is not None
    assert "theme_builder_projects" not in tables
    assert "theme_builder_drafts" not in tables


def test_real_catalog_asset_reference_persists_without_asset_metadata_or_bytes(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    promotion = _asset_promotion()
    reference = promotion["catalogEntry"]["visualAssetRef"]
    with TestClient(create_app(settings)) as client:
        assert client.post("/asset-catalog", json=promotion).status_code == 201
        project = _create(client)
        path = f"/theme-builder/projects/{project['builderProjectId']}"
        saved = client.put(path, json=_save_payload(project, [reference]))
        stale = client.put(path, json=_save_payload(project, []))
        resource_path = settings.runtime_path / "Resources" / promotion["visualAsset"]["path"]
        resource_path.unlink()
        missing_preserved = client.put(path, json=_save_payload(saved.json(), [reference]))
        catalog_after_add = client.get("/asset-catalog").json()

    with TestClient(create_app(settings)) as restarted:
        restored = restarted.get(path)
        removed = restarted.put(path, json=_save_payload(restored.json(), []))
        catalog_after_remove = restarted.get("/asset-catalog").json()

    assert saved.status_code == 200
    assert stale.status_code == 409
    assert missing_preserved.status_code == 200
    assert missing_preserved.json()["revision"] == 3
    assert missing_preserved.json()["assetRefs"] == [reference]
    assert saved.json()["revision"] == 2
    assert saved.json()["assetRefs"] == [reference]
    assert restored.json()["assetRefs"] == [reference]
    assert removed.status_code == 200
    assert removed.json()["revision"] == 4
    assert removed.json()["assetRefs"] == []
    assert catalog_after_remove == catalog_after_add
    serialized = str(saved.json())
    for forbidden in ("originalBytesBase64", "mimeType", "sha256", "byteSize", "resourcePath"):
        assert forbidden not in serialized


def test_unknown_unavailable_and_duplicate_asset_references_are_rejected(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    promotion = _asset_promotion()
    reference = promotion["catalogEntry"]["visualAssetRef"]
    with TestClient(create_app(settings)) as client:
        assert client.post("/asset-catalog", json=promotion).status_code == 201
        project = _create(client)
        path = f"/theme-builder/projects/{project['builderProjectId']}"
        duplicate = client.put(path, json=_save_payload(project, [reference, reference]))
        unknown = client.put(
            path,
            json=_save_payload(project, [{"id": "personal.visual-asset.unknown", "version": "1.0.0"}]),
        )
        resource_path = settings.runtime_path / "Resources" / promotion["visualAsset"]["path"]
        resource_path.unlink()
        unavailable = client.put(path, json=_save_payload(project, [reference]))
        unchanged = client.get(path)

    assert duplicate.status_code == 422
    assert duplicate.json()["code"] == "theme_builder_asset_reference_duplicate"
    assert unknown.status_code == 422
    assert unknown.json()["code"] == "theme_builder_asset_reference_invalid"
    assert unavailable.status_code == 422
    assert unavailable.json()["code"] == "theme_builder_asset_reference_unavailable"
    assert unchanged.json()["revision"] == 1
    assert unchanged.json()["assetRefs"] == []


def test_skin_draft_artifact_persists_in_the_same_revisioned_builder_document(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    promotion = _asset_promotion()
    reference = promotion["catalogEntry"]["visualAssetRef"]
    with TestClient(create_app(settings)) as client:
        assert client.post("/asset-catalog", json=promotion).status_code == 201
        project = _create(client)
        path = f"/theme-builder/projects/{project['builderProjectId']}"
        artifacts = _skin_artifacts(project, reference)
        payload = _save_payload(project, [reference])
        payload["artifacts"] = artifacts
        saved = client.put(path, json=payload)
        stale = client.put(path, json=payload)

    with TestClient(create_app(settings)) as restarted:
        restored = restarted.get(path)

    assert saved.status_code == 200
    assert saved.json()["revision"] == 2
    assert saved.json()["artifacts"] == artifacts
    assert restored.json()["artifacts"] == artifacts
    assert stale.status_code == 409
    assert stale.json()["code"] == "theme_builder_project_revision_conflict"


def test_skin_draft_rejects_unreferenced_assets(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    promotion = _asset_promotion()
    reference = promotion["catalogEntry"]["visualAssetRef"]
    with TestClient(create_app(settings)) as client:
        assert client.post("/asset-catalog", json=promotion).status_code == 201
        project = _create(client)
        path = f"/theme-builder/projects/{project['builderProjectId']}"
        unreferenced = _save_payload(project, [])
        unreferenced["artifacts"] = _skin_artifacts(project, reference)
        rejected_reference = client.put(path, json=unreferenced)

        unchanged = client.get(path)

    assert rejected_reference.status_code == 422
    assert unchanged.json()["revision"] == 1
    assert unchanged.json()["artifacts"]["skinPacks"] == []


def test_skin_draft_rejects_unsafe_materials_and_binding_values(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    promotion = _asset_promotion()
    reference = promotion["catalogEntry"]["visualAssetRef"]
    with TestClient(create_app(settings)) as client:
        assert client.post("/asset-catalog", json=promotion).status_code == 201
        project = _create(client)
        path = f"/theme-builder/projects/{project['builderProjectId']}"

        unsafe_material = _save_payload(project, [reference])
        unsafe_material["artifacts"] = _skin_artifacts(project, reference)
        unsafe_material["artifacts"]["skinPacks"][0]["skins"][0]["materials"] = [
            {
                "channelId": "user.material.script",
                "parameters": {"user.script.source": "body{}"},
            }
        ]
        material_response = client.put(path, json=unsafe_material)

        invalid_color = _save_payload(project, [reference])
        invalid_color["artifacts"] = _skin_artifacts(project, reference)
        invalid_color["artifacts"]["skinPacks"][0]["skins"][0]["materials"] = [
            {
                "channelId": "core.material.dom-surface",
                "parameters": {"core.material.fill": "url(javascript:alert(1))"},
            }
        ]
        color_response = client.put(path, json=invalid_color)

        invalid_binding = _save_payload(project, [reference])
        invalid_binding["artifacts"] = _skin_artifacts(project, reference)
        invalid_binding["artifacts"]["skinPacks"][0]["skins"][0]["assetBindings"][0][
            "opacity"
        ] = 2
        binding_response = client.put(path, json=invalid_binding)
        unchanged = client.get(path)

    assert material_response.status_code == 422
    assert material_response.json()["code"] == "theme_builder_project_invalid"
    assert color_response.status_code == 422
    assert color_response.json()["code"] == "theme_builder_project_invalid"
    assert binding_response.status_code == 422
    assert binding_response.json()["code"] == "theme_builder_project_invalid"
    assert unchanged.json()["revision"] == 1
    assert unchanged.json()["artifacts"]["skinPacks"] == []


def test_skin_material_texture_reference_must_resolve_to_one_exact_builder_asset(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    promotion = _asset_promotion()
    reference = promotion["catalogEntry"]["visualAssetRef"]
    with TestClient(create_app(settings)) as client:
        assert client.post("/asset-catalog", json=promotion).status_code == 201
        project = _create(client)
        path = f"/theme-builder/projects/{project['builderProjectId']}"
        payload = _save_payload(project, [reference])
        payload["artifacts"] = _skin_artifacts(project, reference)
        payload["artifacts"]["skinPacks"][0]["skins"][0]["materials"][0]["parameters"][
            "core.material.texture-ref"
        ] = "personal.visual-asset.unknown"
        rejected = client.put(path, json=payload)

    assert rejected.status_code == 422
    assert rejected.json()["code"] == "theme_builder_project_invalid"


def _create(client: TestClient) -> dict:
    response = client.post(
        "/theme-builder/projects",
        json={"name": "Orbit", "description": "", "author": ""},
    )
    assert response.status_code == 201
    return response.json()


def _save_payload(project: dict, asset_refs: list[object]) -> dict[str, object]:
    return {
        "expectedRevision": project["revision"],
        "metadata": {
            "name": project["name"],
            "description": project["description"],
            "author": project["author"],
        },
        "assetRefs": asset_refs,
    }


def _asset_promotion() -> dict:
    content = b'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>'
    digest = hashlib.sha256(content).hexdigest()
    asset_id = f"personal.visual-asset.{digest}"
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
        },
        "catalogEntry": {
            "schemaVersion": 1,
            "id": f"personal.asset-catalog.{digest}",
            "version": version,
            "visualAssetRef": {"id": asset_id, "version": version},
            "displayName": "Real Builder Asset",
            "description": "A real persistent Catalog record.",
            "category": "personal.category.decoration",
            "scope": "personal",
            "origin": "imported",
            "systemTags": ["cosmos.asset.visual"],
            "userTags": [],
            "perspective": "unspecified",
            "orientation": "square",
            "scaleClass": "small",
            "creator": {"name": "Test"},
            "provenance": {"kind": "imported"},
            "license": {"expression": "CC0-1.0"},
            "compatibleTemplates": [],
            "compatibleSurfaceTypes": [],
            "compatibleVisualObjectTypes": [],
            "deprecated": False,
        },
        "originalBytesBase64": base64.b64encode(content).decode("ascii"),
    }


def _skin_artifacts(project: dict, reference: dict) -> dict:
    suffix = project["builderProjectId"].rsplit(".", 1)[-1]
    return {
        "skinPacks": [
            {
                "schemaVersion": 1,
                "packId": f"user.skin-pack.{suffix}.1",
                "version": "0.1.0",
                "packageKind": "single-skin",
                "displayName": "Base Main Room Look",
                "compatibility": {"themeEngine": "^1.0.0"},
                "assets": [],
                "skins": [
                    {
                        "skinId": f"user.skin.{suffix}.1",
                        "version": "0.1.0",
                        "displayName": "Base Main Room Look",
                        "target": {
                            "presentationGroup": "base-interior",
                            "templateRef": {"id": "base.main-room.v1", "versionRange": "1.0.0"},
                        },
                        "assetBindings": [
                            {
                                "bindingId": f"user.binding.{suffix}-1.base-slot-background.default",
                                "slotId": "base.slot.background",
                                "assetId": reference["id"],
                                "fit": "cover",
                            }
                        ],
                        "tokens": {},
                        "materials": [
                            {
                                "channelId": "core.material.dom-surface",
                                "parameters": {
                                    "core.material.fill": "#123456",
                                    "core.material.opacity": 0.75,
                                    "core.material.texture-ref": reference["id"],
                                },
                            }
                        ],
                        "stateVariants": [],
                    }
                ],
            }
        ],
        "roomShells": [],
        "catalogObjects": [],
    }


def test_builder_v1_export_roundtrips_through_secure_theme_package_import(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    promotion = _asset_promotion()
    reference = promotion["catalogEntry"]["visualAssetRef"]
    with TestClient(create_app(settings)) as client:
        assert client.post("/asset-catalog", json=promotion).status_code == 201
        project = _create(client)
        path = f"/theme-builder/projects/{project['builderProjectId']}"
        payload = _save_payload(project, [reference])
        payload["artifacts"] = _skin_artifacts(project, reference)
        saved = client.put(path, json=payload)
        assert saved.status_code == 200

        exported = client.get(f"{path}/export")
        assert exported.status_code == 200
        assert exported.headers["content-type"] == "application/zip"
        assert exported.content.startswith(b"PK")

        imported = client.post(
            "/theme-packages/import",
            content=exported.content,
            headers={"content-type": "application/zip"},
        )
        assert imported.status_code == 201
        result = imported.json()
        assert result["success"] is True
        assert result["themeId"] == project["themeId"]
        assert result["packageId"] == project["packageId"]
        assert result["assets"]["total"] == 1
        assert result["runtimeRegistration"] == "next-startup"
