from __future__ import annotations

import json
import sqlite3
from collections.abc import Iterable
from datetime import datetime
from pathlib import Path
from types import MappingProxyType

from cosmos.domain import CosmosObject, ObjectIdentity, Relationship, RelationshipType
from cosmos.domain.objects import JSONValue
from cosmos.persistence.sqlite import SQLitePersistence


class ObjectRepository:
    def __init__(self, persistence: SQLitePersistence) -> None:
        self._persistence = persistence

    def insert(self, value: CosmosObject, connection: sqlite3.Connection | None = None) -> None:
        if connection is None:
            with self._persistence.connect() as active:
                self.insert(value, active)
            return

        identity = value.identity
        connection.execute(
            """
            INSERT INTO objects (
                object_id, display_name, description, creator, lifecycle_state,
                created_at, primary_project_id, schema_version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            """,
            (
                identity.object_id,
                identity.display_name,
                identity.description,
                identity.creator,
                identity.lifecycle_state,
                identity.created_at.isoformat(),
                value.primary_project_id,
            ),
        )
        connection.executemany(
            "INSERT INTO object_system_tags (object_id, system_tag) VALUES (?, ?)",
            ((identity.object_id, tag) for tag in sorted(value.system_tags)),
        )
        connection.executemany(
            """
            INSERT INTO object_schema_versions (object_id, schema_id, schema_version)
            VALUES (?, ?, 1)
            """,
            ((identity.object_id, schema_id) for schema_id in value.schema_ids),
        )
        connection.executemany(
            "INSERT INTO object_properties (object_id, property_name, value_json) VALUES (?, ?, ?)",
            (
                (identity.object_id, name, json.dumps(property, sort_keys=True))
                for name, property in value.properties.items()
            ),
        )
        connection.executemany(
            "INSERT INTO object_user_tags (object_id, user_tag) VALUES (?, ?)",
            ((identity.object_id, tag) for tag in sorted(value.user_tags)),
        )

    def get(self, object_id: str) -> CosmosObject | None:
        with self._persistence.connect() as connection:
            row = connection.execute("SELECT * FROM objects WHERE object_id = ?", (object_id,)).fetchone()
            return self._hydrate(connection, row) if row is not None else None

    def list(self, *, system_tag: str | None = None) -> tuple[CosmosObject, ...]:
        with self._persistence.connect() as connection:
            if system_tag is None:
                rows = connection.execute("SELECT * FROM objects ORDER BY created_at, object_id").fetchall()
            else:
                rows = connection.execute(
                    """
                    SELECT objects.*
                    FROM objects
                    JOIN object_system_tags USING (object_id)
                    WHERE object_system_tags.system_tag = ?
                    ORDER BY objects.created_at, objects.object_id
                    """,
                    (system_tag,),
                ).fetchall()
            return tuple(self._hydrate(connection, row) for row in rows)

    def replace_properties(self, value: CosmosObject, connection: sqlite3.Connection | None = None) -> None:
        if connection is None:
            with self._persistence.connect() as active:
                self.replace_properties(value, active)
            return
        connection.execute("DELETE FROM object_properties WHERE object_id = ?", (value.identity.object_id,))
        connection.executemany(
            "INSERT INTO object_properties (object_id, property_name, value_json) VALUES (?, ?, ?)",
            (
                (value.identity.object_id, name, json.dumps(property, sort_keys=True))
                for name, property in value.properties.items()
            ),
        )

    def replace_identity(self, value: CosmosObject) -> None:
        identity = value.identity
        with self._persistence.connect() as connection:
            connection.execute(
                """
                UPDATE objects SET
                    display_name = ?, description = ?, lifecycle_state = ?
                WHERE object_id = ?
                """,
                (
                    identity.display_name,
                    identity.description,
                    identity.lifecycle_state,
                    identity.object_id,
                ),
            )

    def compare_and_swap_property(
        self,
        value: CosmosObject,
        property_name: str,
        expected_value: JSONValue,
    ) -> bool:
        """Atomically replaces one property and its Object identity when the stored value still matches."""

        replacement = value.properties[property_name]
        with self._persistence.connect() as connection:
            cursor = connection.execute(
                """
                UPDATE object_properties
                SET value_json = ?
                WHERE object_id = ? AND property_name = ? AND value_json = ?
                """,
                (
                    json.dumps(replacement, sort_keys=True),
                    value.identity.object_id,
                    property_name,
                    json.dumps(expected_value, sort_keys=True),
                ),
            )
            if cursor.rowcount != 1:
                return False
            connection.execute(
                """
                UPDATE objects SET
                    display_name = ?, description = ?, lifecycle_state = ?
                WHERE object_id = ?
                """,
                (
                    value.identity.display_name,
                    value.identity.description,
                    value.identity.lifecycle_state,
                    value.identity.object_id,
                ),
            )
        return True

    def replace_user_tags(self, value: CosmosObject) -> None:
        with self._persistence.connect() as connection:
            connection.execute(
                "DELETE FROM object_user_tags WHERE object_id = ?",
                (value.identity.object_id,),
            )
            connection.executemany(
                "INSERT INTO object_user_tags (object_id, user_tag) VALUES (?, ?)",
                ((value.identity.object_id, tag) for tag in sorted(value.user_tags)),
            )

    def delete(self, object_id: str) -> None:
        with self._persistence.connect() as connection:
            connection.execute("DELETE FROM objects WHERE object_id = ?", (object_id,))

    @staticmethod
    def _hydrate(connection: sqlite3.Connection, row: sqlite3.Row) -> CosmosObject:
        object_id = row["object_id"]
        system_tags = frozenset(
            item["system_tag"]
            for item in connection.execute(
                "SELECT system_tag FROM object_system_tags WHERE object_id = ? ORDER BY system_tag",
                (object_id,),
            )
        )
        schema_ids = tuple(
            item["schema_id"]
            for item in connection.execute(
                "SELECT schema_id FROM object_schema_versions WHERE object_id = ? ORDER BY schema_id",
                (object_id,),
            )
        )
        properties = {
            item["property_name"]: json.loads(item["value_json"])
            for item in connection.execute(
                "SELECT property_name, value_json FROM object_properties WHERE object_id = ?",
                (object_id,),
            )
        }
        user_tags = frozenset(
            item["user_tag"]
            for item in connection.execute(
                "SELECT user_tag FROM object_user_tags WHERE object_id = ? ORDER BY user_tag",
                (object_id,),
            )
        )
        return CosmosObject(
            identity=ObjectIdentity(
                object_id=object_id,
                display_name=row["display_name"],
                description=row["description"],
                creator=row["creator"],
                lifecycle_state=row["lifecycle_state"],
                created_at=datetime.fromisoformat(row["created_at"]),
            ),
            system_tags=system_tags,
            schema_ids=schema_ids,
            properties=MappingProxyType(properties),
            user_tags=user_tags,
            primary_project_id=row["primary_project_id"],
        )


class RelationshipRepository:
    def __init__(self, persistence: SQLitePersistence) -> None:
        self._persistence = persistence

    def insert(self, relationship: Relationship) -> None:
        with self._persistence.connect() as connection:
            connection.execute(
                """
                INSERT INTO relationships (
                    relationship_id, project_id, relationship_type,
                    endpoint_a_id, endpoint_b_id, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    relationship.relationship_id,
                    relationship.project_id,
                    relationship.relationship_type.value,
                    relationship.endpoint_a_id,
                    relationship.endpoint_b_id,
                    relationship.created_at.isoformat(),
                ),
            )

    def list(self, project_ids: Iterable[str] | None = None) -> tuple[Relationship, ...]:
        with self._persistence.connect() as connection:
            ids = tuple(project_ids or ())
            if ids:
                placeholders = ", ".join("?" for _ in ids)
                rows = connection.execute(
                    f"SELECT * FROM relationships WHERE project_id IN ({placeholders}) ORDER BY created_at",
                    ids,
                ).fetchall()
            else:
                rows = connection.execute("SELECT * FROM relationships ORDER BY created_at").fetchall()
        return tuple(
            Relationship(
                relationship_id=row["relationship_id"],
                project_id=row["project_id"],
                relationship_type=RelationshipType(row["relationship_type"]),
                endpoint_a_id=row["endpoint_a_id"],
                endpoint_b_id=row["endpoint_b_id"],
                created_at=datetime.fromisoformat(row["created_at"]),
            )
            for row in rows
        )

    def list_for_object(
        self,
        object_id: str,
        project_ids: Iterable[str] | None = None,
    ) -> tuple[Relationship, ...]:
        with self._persistence.connect() as connection:
            ids = tuple(project_ids or ())
            parameters: tuple[str, ...] = (object_id, object_id, *ids)
            project_filter = ""
            if ids:
                placeholders = ", ".join("?" for _ in ids)
                project_filter = f" AND project_id IN ({placeholders})"
            rows = connection.execute(
                """
                SELECT * FROM relationships
                WHERE (endpoint_a_id = ? OR endpoint_b_id = ?)
                """
                + project_filter
                + " ORDER BY created_at",
                parameters,
            ).fetchall()
        return tuple(
            Relationship(
                relationship_id=row["relationship_id"],
                project_id=row["project_id"],
                relationship_type=RelationshipType(row["relationship_type"]),
                endpoint_a_id=row["endpoint_a_id"],
                endpoint_b_id=row["endpoint_b_id"],
                created_at=datetime.fromisoformat(row["created_at"]),
            )
            for row in rows
        )


class RuntimeStateRepository:
    def __init__(self, persistence: SQLitePersistence) -> None:
        self._persistence = persistence

    def get(self, scope: str, key: str, default: JSONValue) -> JSONValue:
        with self._persistence.connect() as connection:
            row = connection.execute(
                "SELECT value_json FROM runtime_state WHERE scope = ? AND state_key = ?",
                (scope, key),
            ).fetchone()
        return default if row is None else json.loads(row["value_json"])

    def set(self, scope: str, key: str, value: JSONValue, updated_at: datetime) -> None:
        with self._persistence.connect() as connection:
            connection.execute(
                """
                INSERT INTO runtime_state (scope, state_key, value_json, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (scope, state_key) DO UPDATE SET
                    value_json = excluded.value_json,
                    updated_at = excluded.updated_at
                """,
                (scope, key, json.dumps(value, sort_keys=True), updated_at.isoformat()),
            )


def prepared_structure_rows(connection: sqlite3.Connection, project_id: str) -> dict[str, Path]:
    return {
        row["area_name"]: Path(row["physical_path"])
        for row in connection.execute(
            "SELECT area_name, physical_path FROM prepared_structures WHERE project_id = ?",
            (project_id,),
        )
    }
