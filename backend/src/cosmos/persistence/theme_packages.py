from __future__ import annotations

import json
import sqlite3
from datetime import datetime

from cosmos.domain.objects import JSONValue
from cosmos.persistence.sqlite import SQLitePersistence


class ThemePackageRepository:
    """SQLite-backed installed Theme Package metadata and manifests."""

    def __init__(self, persistence: SQLitePersistence) -> None:
        self._persistence = persistence

    def insert(
        self,
        record: dict[str, JSONValue],
        installed_at: datetime,
        connection: sqlite3.Connection,
    ) -> None:
        connection.execute(
            """
            INSERT INTO theme_packages (
                package_id, package_version, theme_id, manifest_version,
                manifest_digest, record_json, installed_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record["packageId"],
                record["packageVersion"],
                record["themeId"],
                record["manifestVersion"],
                record["manifestDigest"],
                json.dumps(record, sort_keys=True, separators=(",", ":"), ensure_ascii=False),
                installed_at.isoformat(),
                installed_at.isoformat(),
            ),
        )

    def list(self) -> tuple[dict[str, object], ...]:
        with self._persistence.connect() as connection:
            rows = connection.execute(
                """
                SELECT record_json, installed_at, updated_at
                FROM theme_packages
                ORDER BY theme_id, package_version, package_id
                """
            ).fetchall()
        return tuple(
            {
                **json.loads(row["record_json"]),
                "installedAt": row["installed_at"],
                "updatedAt": row["updated_at"],
            }
            for row in rows
        )

    def exists(self, package_id: str, package_version: str) -> bool:
        with self._persistence.connect() as connection:
            row = connection.execute(
                """
                SELECT 1
                FROM theme_packages
                WHERE package_id = ? AND package_version = ?
                """,
                (package_id, package_version),
            ).fetchone()
        return row is not None
