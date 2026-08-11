from __future__ import annotations

import sqlite3
from pathlib import Path


class SQLitePersistence:
    """Versioned SQLite infrastructure. Runtime Services remain its only future clients."""

    def __init__(self, database_path: Path, migrations_path: Path | None = None) -> None:
        self.database_path = Path(database_path)
        self.migrations_path = migrations_path or Path(__file__).with_name("migrations")

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def initialize(self) -> None:
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            applied = {
                row["version"]
                for row in connection.execute("SELECT version FROM schema_migrations ORDER BY version")
            }
            for migration in sorted(self.migrations_path.glob("*.sql")):
                version = _migration_version(migration)
                if version in applied:
                    continue
                self._apply(connection, version, migration)

    def is_ready(self) -> bool:
        if not self.database_path.exists():
            return False
        try:
            with self.connect() as connection:
                connection.execute("SELECT 1 FROM schema_migrations LIMIT 1").fetchone()
        except sqlite3.Error:
            return False
        return True

    @staticmethod
    def _apply(connection: sqlite3.Connection, version: int, migration: Path) -> None:
        statements = [statement.strip() for statement in migration.read_text(encoding="utf-8").split(";")]
        try:
            connection.execute("BEGIN")
            for statement in statements:
                if statement:
                    connection.execute(statement)
            connection.execute(
                "INSERT INTO schema_migrations (version, name) VALUES (?, ?)",
                (version, migration.name),
            )
            connection.commit()
        except Exception:
            connection.rollback()
            raise


def _migration_version(path: Path) -> int:
    prefix = path.stem.split("_", 1)[0]
    try:
        return int(prefix)
    except ValueError as error:
        raise ValueError(f"Migration filename must start with a number: {path.name}") from error
