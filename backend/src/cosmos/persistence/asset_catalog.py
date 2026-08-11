from __future__ import annotations

import json
import sqlite3
from datetime import datetime

from cosmos.domain.objects import JSONValue
from cosmos.persistence.sqlite import SQLitePersistence


class AssetCatalogRepository:
    """SQLite-backed Visual Asset and Catalog metadata owned by Runtime Services."""

    def __init__(self, persistence: SQLitePersistence) -> None:
        self._persistence = persistence

    def insert_promotion(
        self,
        visual_asset: dict[str, JSONValue],
        catalog_entry: dict[str, JSONValue],
        resource_path: str,
        created_at: datetime,
        connection: sqlite3.Connection,
    ) -> None:
        connection.execute(
            """
            INSERT INTO visual_assets (
                asset_id, asset_version, asset_json, resource_path, created_at
            ) VALUES (?, ?, ?, ?, ?)
            """,
            (
                visual_asset["id"],
                visual_asset["version"],
                json.dumps(visual_asset, sort_keys=True, separators=(",", ":")),
                resource_path,
                created_at.isoformat(),
            ),
        )
        visual_asset_ref = catalog_entry["visualAssetRef"]
        if not isinstance(visual_asset_ref, dict):
            raise TypeError("Catalog entry visualAssetRef must be an object.")
        connection.execute(
            """
            INSERT INTO asset_catalog_entries (
                entry_id, entry_version, visual_asset_id, visual_asset_version,
                entry_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                catalog_entry["id"],
                catalog_entry["version"],
                visual_asset_ref["id"],
                visual_asset_ref["version"],
                json.dumps(catalog_entry, sort_keys=True, separators=(",", ":")),
                created_at.isoformat(),
            ),
        )

    def list_catalog(self) -> tuple[dict[str, object], ...]:
        with self._persistence.connect() as connection:
            rows = connection.execute(
                """
                SELECT
                    visual_assets.asset_json,
                    visual_assets.resource_path,
                    asset_catalog_entries.entry_json
                FROM asset_catalog_entries
                JOIN visual_assets
                  ON visual_assets.asset_id = asset_catalog_entries.visual_asset_id
                 AND visual_assets.asset_version = asset_catalog_entries.visual_asset_version
                ORDER BY asset_catalog_entries.entry_id, asset_catalog_entries.entry_version
                """
            ).fetchall()
        return tuple(
            {
                "visualAsset": json.loads(row["asset_json"]),
                "catalogEntry": json.loads(row["entry_json"]),
                "resourcePath": row["resource_path"],
            }
            for row in rows
        )

    def get_visual_asset(self, asset_id: str, version: str) -> dict[str, object] | None:
        with self._persistence.connect() as connection:
            row = connection.execute(
                """
                SELECT asset_json, resource_path
                FROM visual_assets
                WHERE asset_id = ? AND asset_version = ?
                """,
                (asset_id, version),
            ).fetchone()
        if row is None:
            return None
        return {
            "visualAsset": json.loads(row["asset_json"]),
            "resourcePath": row["resource_path"],
        }

    def get_catalog_entry(self, entry_id: str, version: str) -> dict[str, object] | None:
        with self._persistence.connect() as connection:
            row = connection.execute(
                """
                SELECT
                    visual_assets.asset_json,
                    visual_assets.resource_path,
                    asset_catalog_entries.entry_json
                FROM asset_catalog_entries
                JOIN visual_assets
                  ON visual_assets.asset_id = asset_catalog_entries.visual_asset_id
                 AND visual_assets.asset_version = asset_catalog_entries.visual_asset_version
                WHERE asset_catalog_entries.entry_id = ?
                  AND asset_catalog_entries.entry_version = ?
                """,
                (entry_id, version),
            ).fetchone()
        if row is None:
            return None
        return {
            "visualAsset": json.loads(row["asset_json"]),
            "catalogEntry": json.loads(row["entry_json"]),
            "resourcePath": row["resource_path"],
        }
