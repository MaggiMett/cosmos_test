from __future__ import annotations

from pathlib import Path

from backend.tests.theme_visuals_qa_fixture import (
    QA_ASSET,
    QA_ASSET_ID,
    QA_ASSET_VERSION,
    QA_PACKAGE_ID,
    QA_SKIN_ID,
    QA_THEME_ID,
    create_theme_visuals_qa_package,
)
from starlette.testclient import TestClient

from cosmos.api import create_app
from cosmos.config import RuntimeSettings


def test_real_qa_package_import_survives_startup_and_exposes_room_skin(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    archive = create_theme_visuals_qa_package()

    with TestClient(create_app(settings)) as client:
        imported = client.post(
            "/theme-packages/import",
            content=archive,
            headers={"content-type": "application/zip"},
        )
        assert client.get("/runtime-state/theme").json()["activeThemeId"] is None

    with TestClient(create_app(settings)) as restarted:
        packages = restarted.get("/theme-packages").json()["items"]
        catalog = restarted.get("/asset-catalog").json()["items"]
        content = restarted.get(
            f"/asset-catalog/visual-assets/{QA_ASSET_ID}/versions/{QA_ASSET_VERSION}/content"
        )

    assert imported.status_code == 201
    assert imported.json()["runtimeRegistration"] == "next-startup"
    assert imported.json()["packageId"] == QA_PACKAGE_ID
    assert len(packages) == 1
    package = packages[0]
    assert package["themeId"] == QA_THEME_ID
    skin = package["skinPacks"][0]["skinPack"]["skins"][0]
    assert skin["skinId"] == QA_SKIN_ID
    assert skin["target"]["templateRef"]["id"] == "base.main-room.v1"
    assert skin["assetBindings"] == [
        {
            "bindingId": "qa.binding.room-visuals.background",
            "slotId": "base.slot.background",
            "assetId": QA_ASSET_ID,
            "fit": "cover",
            "alignment": "center",
            "opacity": 0.9,
        }
    ]
    assert skin["materials"] == [
        {
            "channelId": "core.material.dom-surface",
            "parameters": {
                "core.material.fill": "#17384a",
                "core.material.stroke": "#d69b62",
                "core.material.opacity": 0.82,
                "core.material.texture-ref": QA_ASSET_ID,
            },
        }
    ]
    assert catalog[0]["visualAsset"]["id"] == QA_ASSET_ID
    assert content.status_code == 200
    assert content.content == QA_ASSET
