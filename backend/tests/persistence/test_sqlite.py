from pathlib import Path

from cosmos.persistence import SQLitePersistence


def test_sqlite_initialization_applies_foundation_once(tmp_path: Path) -> None:
    persistence = SQLitePersistence(tmp_path / "Runtime" / "Database" / "cosmos.db")

    persistence.initialize()
    persistence.initialize()

    assert persistence.is_ready()
    with persistence.connect() as connection:
        migrations = connection.execute("SELECT version, name FROM schema_migrations").fetchall()
        tables = {
            row["name"] for row in connection.execute("SELECT name FROM sqlite_master WHERE type = 'table'")
        }

    assert [(row["version"], row["name"]) for row in migrations] == [
        (1, "0001_foundation.sql"),
        (2, "0002_cosmos_map.sql"),
        (3, "0003_core_tools.sql"),
        (4, "0004_asset_catalog.sql"),
        (5, "0005_theme_packages.sql"),
    ]
    assert {
        "objects",
        "object_system_tags",
        "object_schema_versions",
        "object_properties",
        "object_user_tags",
        "prepared_structures",
        "relationships",
        "runtime_state",
        "visual_assets",
        "asset_catalog_entries",
        "theme_packages",
    }.issubset(tables)
