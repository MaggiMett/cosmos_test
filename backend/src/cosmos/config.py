from __future__ import annotations

import os
from collections.abc import Mapping
from dataclasses import dataclass, field
from pathlib import Path


def default_runtime_path() -> Path:
    return Path.home() / ".cosmos"


@dataclass(frozen=True, slots=True)
class RuntimeSettings:
    """Process configuration; durable user configuration belongs to Runtime Services."""

    host: str = "127.0.0.1"
    port: int = 8000
    runtime_path: Path = field(default_factory=default_runtime_path)
    database_path: Path | None = None
    extensions_path: Path | None = None
    cors_origins: tuple[str, ...] = ()
    log_level: str = "info"

    def __post_init__(self) -> None:
        runtime_path = Path(self.runtime_path).expanduser()
        database_path = (
            Path(self.database_path).expanduser()
            if self.database_path is not None
            else runtime_path / "Database" / "cosmos.db"
        )

        if not 0 <= self.port <= 65535:
            raise ValueError("COSMOS_PORT must be between 0 and 65535.")

        if not self.host.strip():
            raise ValueError("COSMOS_HOST must not be empty.")

        extensions_path = (
            Path(self.extensions_path).expanduser()
            if self.extensions_path is not None
            else runtime_path / "Extensions"
        )

        object.__setattr__(self, "runtime_path", runtime_path)
        object.__setattr__(self, "database_path", database_path)
        object.__setattr__(self, "extensions_path", extensions_path)
        object.__setattr__(self, "cors_origins", tuple(origin.rstrip("/") for origin in self.cors_origins))

    @classmethod
    def from_environment(cls, environment: Mapping[str, str] | None = None) -> RuntimeSettings:
        values = environment if environment is not None else os.environ
        runtime_path = Path(values.get("COSMOS_RUNTIME_PATH", str(default_runtime_path())))
        raw_port = values.get("COSMOS_PORT", "8000")

        try:
            port = int(raw_port)
        except ValueError as error:
            raise ValueError("COSMOS_PORT must be an integer.") from error

        return cls(
            host=values.get("COSMOS_HOST", "127.0.0.1"),
            port=port,
            runtime_path=runtime_path,
            database_path=_optional_path(values.get("COSMOS_DATABASE_PATH")),
            extensions_path=_optional_path(values.get("COSMOS_EXTENSIONS_PATH")),
            cors_origins=_csv(values.get("COSMOS_CORS_ORIGINS")),
            log_level=values.get("COSMOS_LOG_LEVEL", "info"),
        )


def _optional_path(value: str | None) -> Path | None:
    return Path(value) if value else None


def _csv(value: str | None) -> tuple[str, ...]:
    if not value:
        return ()
    return tuple(part.strip() for part in value.split(",") if part.strip())
