from __future__ import annotations

import hashlib
import io
import json
import os
import stat
import zipfile
from pathlib import Path
from typing import Any

import pytest
from starlette.testclient import TestClient

from cosmos.api import create_app
from cosmos.config import RuntimeSettings
from cosmos.persistence import AssetCatalogRepository, ThemePackageRepository
from cosmos.services import ThemePackageImportLimits, ThemePackageImportService
from cosmos.services.theme_package_service import canonical_manifest_digest

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
SAFE_SVG = (
    b'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">'
    b'<rect width="10" height="10" fill="#4caf78"/></svg>'
)


def test_valid_package_installs_assets_persists_and_does_not_activate(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    archive = _package_archive(assets=[_asset("max.visual.aurora", SAFE_SVG)])

    with TestClient(create_app(settings)) as client:
        imported = _import(client, archive)
        packages = client.get("/theme-packages")
        catalog = client.get("/asset-catalog")
        activation = client.get("/runtime-state/theme")
        content = client.get("/asset-catalog/visual-assets/max.visual.aurora/versions/1.0.0/content")

    assert imported.status_code == 201
    assert imported.json() == {
        "success": True,
        "packageId": "max.theme-package.aurora",
        "packageVersion": "1.0.0",
        "themeId": "max.theme.aurora",
        "themeName": "Aurora",
        "installStatus": "installed",
        "diagnostics": [],
        "assets": {"total": 1, "installed": 1, "reused": 0},
        "integrity": {
            "status": "verified",
            "archiveSha256": hashlib.sha256(archive).hexdigest(),
            "manifestSha256": packages.json()["items"][0]["manifestDigest"],
        },
        "runtimeRegistration": "next-startup",
    }
    assert len(catalog.json()["items"]) == 1
    assert content.content == SAFE_SVG
    assert activation.json()["activeThemeId"] is None

    with TestClient(create_app(settings)) as restarted:
        restored_package = restarted.get("/theme-packages").json()["items"][0]
        restored_asset = restarted.get("/asset-catalog").json()["items"][0]

    assert restored_package["themeId"] == "max.theme.aurora"
    assert restored_package["source"]["provenance"].startswith("theme-package-import:sha256:")
    assert restored_asset["resource"]["available"] is True
    assert "assetBytes" not in restored_package


def test_valid_skin_pack_is_validated_persisted_and_available_after_restart(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    asset = _asset("max.visual.aurora", SAFE_SVG)
    skin_pack = _skin_pack(asset)
    archive = _package_archive_with_skin_pack(asset, skin_pack)

    with TestClient(create_app(settings)) as client:
        imported = _import(client, archive)
        installed = client.get("/theme-packages").json()["items"][0]

    with TestClient(create_app(settings)) as restarted:
        restored = restarted.get("/theme-packages").json()["items"][0]

    assert imported.status_code == 201
    assert installed["skinPacks"][0]["packId"] == "max.skin-pack.aurora"
    assert installed["skinPacks"][0]["skinPack"] == skin_pack
    assert restored["skinPacks"] == installed["skinPacks"]


def test_skin_pack_digest_mismatch_rejects_the_entire_package(tmp_path: Path) -> None:
    asset = _asset("max.visual.aurora", SAFE_SVG)
    skin_pack = _skin_pack(asset)
    archive = _package_archive_with_skin_pack(asset, skin_pack, skin_digest="0" * 64)

    with TestClient(create_app(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))) as client:
        response = _import(client, archive)
        packages = client.get("/theme-packages")
        catalog = client.get("/asset-catalog")

    assert response.status_code == 422
    assert response.json()["diagnostics"][0]["code"] == "theme_package_skin_pack_integrity_failed"
    assert packages.json() == {"items": []}
    assert catalog.json() == {"items": []}


def test_invalid_skin_pack_schema_rejects_the_entire_package(tmp_path: Path) -> None:
    asset = _asset("max.visual.aurora", SAFE_SVG)
    skin_pack = _skin_pack(asset)
    skin_pack.pop("skins")
    archive = _package_archive_with_skin_pack(asset, skin_pack)

    with TestClient(create_app(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))) as client:
        response = _import(client, archive)

    assert response.status_code == 422
    assert response.json()["diagnostics"][0]["code"] == "theme_package_skin_pack_schema_invalid"


def test_skin_pack_missing_asset_reference_rejects_the_entire_package(tmp_path: Path) -> None:
    asset = _asset("max.visual.aurora", SAFE_SVG)
    skin_pack = _skin_pack(asset)
    skin_pack["assets"][0]["assetId"] = "max.visual.missing"
    skin_pack["skins"][0]["assetBindings"][0]["assetId"] = "max.visual.missing"
    archive = _package_archive_with_skin_pack(asset, skin_pack)

    with TestClient(create_app(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))) as client:
        response = _import(client, archive)

    assert response.status_code == 422
    assert response.json()["diagnostics"][0]["code"] == "theme_package_skin_pack_asset_missing"


def test_skin_pack_path_traversal_and_executable_fields_are_rejected(tmp_path: Path) -> None:
    asset = _asset("max.visual.aurora", SAFE_SVG)
    skin_pack = _skin_pack(asset)
    manifest = _manifest(changes={"packRefs": [{"id": "max.skin-pack.aurora", "versionRange": "^1.0.0"}]})
    descriptor = _descriptor(manifest, [asset])
    descriptor["skinPacks"] = [{"path": "../skin-pack.json", "sha256": "0" * 64}]
    unsafe_path = _raw_archive(descriptor, manifest, [asset])

    executable_pack = {**skin_pack, "script": "javascript:alert(1)"}
    executable = _package_archive_with_skin_pack(asset, executable_pack)
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    with TestClient(create_app(settings)) as client:
        path_response = _import(client, unsafe_path)
        executable_response = _import(client, executable)

    assert path_response.json()["diagnostics"][0]["code"] == "theme_package_path_invalid"
    assert executable_response.json()["diagnostics"][0]["code"] == "theme_package_executable_content"


@pytest.mark.parametrize(
    ("manifest_changes", "omit_manifest", "code"),
    [
        (None, True, "theme_package_manifest_missing"),
        ({"displayName": ""}, False, "theme_package_manifest_invalid"),
        ({"schemaVersion": 2}, False, "theme_package_contract_unsupported"),
        (
            {"compatibility": {"themeEngine": "^2.0.0"}},
            False,
            "theme_package_incompatible",
        ),
        ({"themeId": "cosmos.theme.cosmos"}, False, "theme_package_core_conflict"),
    ],
)
def test_manifest_contract_rejections_are_structured(
    tmp_path: Path,
    manifest_changes: dict[str, Any] | None,
    omit_manifest: bool,
    code: str,
) -> None:
    archive = _package_archive(
        manifest_changes=manifest_changes,
        omit_manifest=omit_manifest,
    )
    with TestClient(create_app(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))) as client:
        response = _import(client, archive)
        packages = client.get("/theme-packages")

    assert response.status_code == 422
    assert response.json()["success"] is False
    assert response.json()["diagnostics"][0]["code"] == code
    assert "traceback" not in json.dumps(response.json()).casefold()
    assert packages.json() == {"items": []}


@pytest.mark.parametrize("unsafe_path", ["../escape.svg", "/absolute.svg", "C:/drive.svg"])
def test_unsafe_archive_paths_are_rejected(tmp_path: Path, unsafe_path: str) -> None:
    archive = _package_archive(extra_entries=[(unsafe_path, b"unsafe")])

    with TestClient(create_app(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))) as client:
        response = _import(client, archive)

    assert response.status_code == 422
    assert response.json()["diagnostics"][0]["code"] == "theme_package_path_invalid"
    assert not (tmp_path / "escape.svg").exists()


def test_case_colliding_and_duplicate_paths_are_rejected(tmp_path: Path) -> None:
    archive = _package_archive(extra_entries=[("THEME-MANIFEST.JSON", b"{}")])

    with TestClient(create_app(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))) as client:
        response = _import(client, archive)

    assert response.json()["diagnostics"][0]["code"] == "theme_package_path_collision"


def test_symlink_entries_are_rejected(tmp_path: Path) -> None:
    manifest = _manifest()
    descriptor = _descriptor(manifest, [])
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w") as archive:
        archive.writestr("cosmos-theme-package.json", _json_bytes(descriptor))
        archive.writestr("theme-manifest.json", _json_bytes(manifest))
        link = zipfile.ZipInfo("visual-assets/link.svg")
        link.create_system = 3
        link.external_attr = (stat.S_IFLNK | 0o777) << 16
        archive.writestr(link, "../../outside")

    with TestClient(create_app(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))) as client:
        response = _import(client, stream.getvalue())

    assert response.json()["diagnostics"][0]["code"] == "theme_package_link_forbidden"


def test_archive_and_file_count_limits_reject_before_install(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    app = create_app(settings)
    with TestClient(app) as client:
        runtime = app.state.runtime
        runtime.theme_package_import = ThemePackageImportService(
            runtime.persistence,
            ThemePackageRepository(runtime.persistence),
            AssetCatalogRepository(runtime.persistence),
            settings.runtime_path,
            ThemePackageImportLimits(maximum_archive_bytes=128),
        )
        too_large = _import(client, b"x" * 129)

        runtime.theme_package_import = ThemePackageImportService(
            runtime.persistence,
            ThemePackageRepository(runtime.persistence),
            AssetCatalogRepository(runtime.persistence),
            settings.runtime_path,
            ThemePackageImportLimits(maximum_files=2),
        )
        too_many = _import(client, _package_archive(extra_entries=[("extra.svg", SAFE_SVG)]))
        packages = client.get("/theme-packages")

    assert too_large.status_code == 413
    assert too_large.json()["diagnostics"][0]["code"] == "theme_package_too_large"
    assert too_many.status_code == 413
    assert too_many.json()["diagnostics"][0]["code"] == "theme_package_too_many_files"
    assert packages.json() == {"items": []}


def test_invalid_asset_format_and_digest_are_rejected(tmp_path: Path) -> None:
    invalid_format = _asset("max.visual.gif", b"GIF89a")
    invalid_format["visualAsset"].update({"kind": "image", "format": "gif", "mimeType": "image/gif"})
    invalid_format["visualAsset"]["path"] = "visual-assets/max.visual.gif/1.0.0/original.gif"
    bad_digest = _asset("max.visual.bad-digest", SAFE_SVG)
    bad_digest["visualAsset"]["sha256"] = "0" * 64
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)

    with TestClient(create_app(settings)) as client:
        format_response = _import(
            client,
            _package_archive(package_id="max.package.gif", assets=[invalid_format]),
        )
        digest_response = _import(
            client,
            _package_archive(package_id="max.package.bad-digest", assets=[bad_digest]),
        )
        assert client.get("/asset-catalog").json() == {"items": []}

    assert format_response.json()["diagnostics"][0]["code"] == "validation_failed"
    assert digest_response.json()["diagnostics"][0]["code"] == "validation_failed"


def test_manifest_digest_mismatch_is_rejected(tmp_path: Path) -> None:
    manifest = _manifest()
    descriptor = _descriptor(manifest, [])
    descriptor["manifest"]["sha256"] = "0" * 64

    with TestClient(create_app(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))) as client:
        response = _import(client, _raw_archive(descriptor, manifest))

    assert response.json()["diagnostics"][0]["code"] == "theme_package_integrity_failed"


def test_same_version_conflicts_while_higher_version_is_persisted(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    first = _package_archive()
    second = _package_archive(version="2.0.0")

    with TestClient(create_app(settings)) as client:
        assert _import(client, first).status_code == 201
        duplicate = _import(client, first)
        upgraded = _import(client, second)
        records = client.get("/theme-packages").json()["items"]

    assert duplicate.status_code == 409
    assert duplicate.json()["diagnostics"][0]["code"] == "theme_package_conflict"
    assert upgraded.status_code == 201
    assert [record["packageVersion"] for record in records] == ["1.0.0", "2.0.0"]


def test_matching_cataloged_asset_is_reused_without_duplicate_bytes(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    asset = _asset("max.visual.shared", SAFE_SVG)

    with TestClient(create_app(settings)) as client:
        first = _import(client, _package_archive(assets=[asset]))
        second = _import(
            client,
            _package_archive(
                package_id="max.theme-package.aurora-secondary",
                version="2.0.0",
                assets=[asset],
            ),
        )
        catalog = client.get("/asset-catalog").json()["items"]

    assert first.json()["assets"] == {"total": 1, "installed": 1, "reused": 0}
    assert second.json()["assets"] == {"total": 1, "installed": 0, "reused": 1}
    assert len(catalog) == 1


def test_install_failure_rolls_back_package_catalog_and_finalized_files(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    archive = _package_archive(
        assets=[
            _asset("max.visual.first", SAFE_SVG),
            _asset("max.visual.second", SAFE_SVG.replace(b"#4caf78", b"#88ddff")),
        ]
    )
    real_replace = os.replace
    calls = 0

    def fail_second_replace(source: str | Path, destination: str | Path) -> None:
        nonlocal calls
        calls += 1
        if calls == 2:
            raise OSError("simulated asset promotion failure")
        real_replace(source, destination)

    with TestClient(create_app(settings)) as client:
        monkeypatch.setattr(
            "cosmos.services.theme_package_import_service.os.replace",
            fail_second_replace,
        )
        response = _import(client, archive)
        packages = client.get("/theme-packages")
        catalog = client.get("/asset-catalog")

    assert response.status_code == 422
    assert response.json()["diagnostics"][0]["code"] == "theme_package_storage_failed"
    assert packages.json() == {"items": []}
    assert catalog.json() == {"items": []}
    resource_root = settings.runtime_path / "Resources"
    assert not resource_root.exists() or not any(resource_root.rglob("original.svg"))


def test_unexpected_files_multiple_manifests_and_invalid_json_are_rejected(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    multiple = _package_archive(extra_entries=[("nested/theme-manifest.json", b"{}")])
    executable = _package_archive(extra_entries=[("payload.js", b"alert(1)")])
    invalid_json = _raw_archive(b"{not-json", _manifest())

    with TestClient(create_app(settings)) as client:
        multiple_response = _import(client, multiple)
        executable_response = _import(client, executable)
        json_response = _import(client, invalid_json)

    assert multiple_response.json()["diagnostics"][0]["code"] == "theme_package_manifest_conflict"
    assert executable_response.json()["diagnostics"][0]["code"] == "theme_package_unexpected_file"
    assert json_response.json()["diagnostics"][0]["code"] == "theme_package_json_invalid"


def test_upload_boundary_rejects_empty_and_wrong_media_type(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    with TestClient(create_app(settings)) as client:
        wrong_type = client.post("/theme-packages/import", content=b"not-a-package")
        empty = _import(client, b"")

    assert wrong_type.status_code == 422
    assert wrong_type.json()["diagnostics"][0]["code"] == "theme_package_media_type_invalid"
    assert empty.status_code == 422
    assert empty.json()["diagnostics"][0]["code"] == "theme_package_request_invalid"


def _import(client: TestClient, archive: bytes):
    return client.post(
        "/theme-packages/import",
        content=archive,
        headers={"content-type": "application/zip"},
    )


def _manifest(
    version: str = "1.0.0",
    changes: dict[str, Any] | None = None,
) -> dict[str, Any]:
    value: dict[str, Any] = {
        "schemaVersion": 1,
        "themeId": "max.theme.aurora",
        "version": version,
        "displayName": "Aurora",
        "description": "A safely imported Theme.",
        "packageKind": "full-theme",
        "compatibility": {"themeEngine": "^1.0.0", "cosmos": "^1.0.0"},
        "groups": REQUIRED_GROUPS,
        "packRefs": [],
        "defaultCompositionRef": {
            "id": "max.composition.aurora",
            "versionRange": f"^{version}",
        },
        "tokens": {"cosmos.color.background": {"type": "color", "value": "#07111f"}},
        "systemTerms": {"system.base": {"en": "Base"}},
        "author": {"name": "Max"},
    }
    if changes:
        value.update(changes)
    return value


def _asset(asset_id: str, content: bytes) -> dict[str, Any]:
    version = "1.0.0"
    digest = hashlib.sha256(content).hexdigest()
    path = f"visual-assets/{asset_id}/{version}/original.svg"
    return {
        "visualAsset": {
            "schemaVersion": 1,
            "id": asset_id,
            "version": version,
            "kind": "vector",
            "format": "svg",
            "mimeType": "image/svg+xml",
            "path": path,
            "sha256": digest,
            "byteSize": len(content),
            "width": 10,
            "height": 10,
            "alpha": True,
        },
        "catalogEntry": {
            "schemaVersion": 1,
            "id": asset_id.replace("visual", "catalog"),
            "version": version,
            "visualAssetRef": {"id": asset_id, "version": version},
            "displayName": asset_id,
            "description": "A safe static Theme asset.",
            "category": "cosmos.category.decoration",
            "scope": "theme",
            "theme": "max.theme.aurora",
            "origin": "imported",
            "systemTags": ["cosmos.asset.visual"],
            "userTags": [],
            "perspective": "unspecified",
            "orientation": "square",
            "scaleClass": "small",
            "creator": {"name": "Cosmos Tester"},
            "provenance": {"kind": "imported", "source": "theme-package"},
            "license": {"expression": "CC0-1.0"},
            "compatibleTemplates": [],
            "compatibleSurfaceTypes": [],
            "compatibleVisualObjectTypes": [],
            "deprecated": False,
        },
        "content": content,
    }


def _descriptor(
    manifest: dict[str, Any],
    assets: list[dict[str, Any]],
    package_id: str = "max.theme-package.aurora",
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "packageId": package_id,
        "packageVersion": manifest["version"],
        "manifest": {
            "path": "theme-manifest.json",
            "sha256": canonical_manifest_digest(manifest),
        },
        "assets": [
            {"visualAsset": asset["visualAsset"], "catalogEntry": asset["catalogEntry"]} for asset in assets
        ],
    }


def _skin_pack(asset: dict[str, Any]) -> dict[str, Any]:
    visual = asset["visualAsset"]
    return {
        "schemaVersion": 1,
        "packId": "max.skin-pack.aurora",
        "version": "1.0.0",
        "packageKind": "skin-pack",
        "displayName": "Aurora Base Skin",
        "compatibility": {"themeEngine": "^1.0.0"},
        "assets": [
            {
                "assetId": visual["id"],
                "kind": visual["kind"],
                "format": visual["format"],
                "mimeType": visual["mimeType"],
                "path": visual["path"],
                "sha256": visual["sha256"],
                "byteSize": visual["byteSize"],
                "width": visual["width"],
                "height": visual["height"],
                "alpha": visual["alpha"],
            }
        ],
        "skins": [
            {
                "skinId": "max.skin.aurora.base",
                "version": "1.0.0",
                "displayName": "Aurora Base",
                "target": {
                    "presentationGroup": "base-interior",
                    "templateRef": {"id": "base.main-room.v1", "versionRange": "^1.0.0"},
                },
                "assetBindings": [
                    {
                        "bindingId": "max.binding.aurora.background",
                        "slotId": "base.slot.background",
                        "assetId": visual["id"],
                    }
                ],
                "tokens": {},
                "materials": [
                    {
                        "channelId": "core.material.dom-surface",
                        "parameters": {
                            "core.material.fill": "#102030",
                            "core.material.opacity": 0.9,
                        },
                    }
                ],
                "stateVariants": [
                    {
                        "stateId": "default",
                        "assetBindingIds": ["max.binding.aurora.background"],
                    }
                ],
            }
        ],
    }


def _package_archive_with_skin_pack(
    asset: dict[str, Any],
    skin_pack: dict[str, Any],
    *,
    skin_digest: str | None = None,
) -> bytes:
    manifest = _manifest(changes={"packRefs": [{"id": "max.skin-pack.aurora", "versionRange": "^1.0.0"}]})
    descriptor = _descriptor(manifest, [asset])
    skin_path = "skin-packs/max.skin-pack.aurora/1.0.0/skin-pack.json"
    descriptor["skinPacks"] = [
        {
            "path": skin_path,
            "sha256": skin_digest or canonical_manifest_digest(skin_pack),
        }
    ]
    return _raw_archive(
        descriptor,
        manifest,
        [asset],
        skin_packs=[(skin_path, skin_pack)],
    )


def _package_archive(
    *,
    package_id: str = "max.theme-package.aurora",
    version: str = "1.0.0",
    assets: list[dict[str, Any]] | None = None,
    manifest_changes: dict[str, Any] | None = None,
    omit_manifest: bool = False,
    extra_entries: list[tuple[str, bytes]] | None = None,
) -> bytes:
    declared_assets = assets or []
    manifest = _manifest(version, manifest_changes)
    descriptor = _descriptor(manifest, declared_assets, package_id)
    return _raw_archive(
        descriptor,
        None if omit_manifest else manifest,
        declared_assets,
        extra_entries,
    )


def _raw_archive(
    descriptor: dict[str, Any] | bytes,
    manifest: dict[str, Any] | None,
    assets: list[dict[str, Any]] | None = None,
    extra_entries: list[tuple[str, bytes]] | None = None,
    skin_packs: list[tuple[str, dict[str, Any]]] | None = None,
) -> bytes:
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(
            "cosmos-theme-package.json",
            descriptor if isinstance(descriptor, bytes) else _json_bytes(descriptor),
        )
        if manifest is not None:
            archive.writestr("theme-manifest.json", _json_bytes(manifest))
        for asset in assets or []:
            archive.writestr(asset["visualAsset"]["path"], asset["content"])
        for path, skin_pack in skin_packs or []:
            archive.writestr(path, _json_bytes(skin_pack))
        for path, content in extra_entries or []:
            archive.writestr(path, content)
    return stream.getvalue()


def _json_bytes(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
