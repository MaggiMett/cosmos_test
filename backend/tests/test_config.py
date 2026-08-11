from pathlib import Path

import pytest

from cosmos.config import RuntimeSettings


def test_runtime_settings_keep_data_outside_source_by_default() -> None:
    settings = RuntimeSettings()

    assert settings.runtime_path == Path.home() / ".cosmos"
    assert settings.database_path == settings.runtime_path / "Database" / "cosmos.db"


def test_runtime_settings_load_environment_overrides() -> None:
    settings = RuntimeSettings.from_environment(
        {
            "COSMOS_HOST": "0.0.0.0",
            "COSMOS_PORT": "9000",
            "COSMOS_RUNTIME_PATH": "RuntimeData",
            "COSMOS_DATABASE_PATH": "Data/custom.db",
            "COSMOS_CORS_ORIGINS": "http://127.0.0.1:5173/,http://localhost:5173",
        }
    )

    assert settings.host == "0.0.0.0"
    assert settings.port == 9000
    assert settings.runtime_path == Path("RuntimeData")
    assert settings.database_path == Path("Data/custom.db")
    assert settings.cors_origins == ("http://127.0.0.1:5173", "http://localhost:5173")


def test_runtime_settings_reject_invalid_port() -> None:
    with pytest.raises(ValueError, match="integer"):
        RuntimeSettings.from_environment({"COSMOS_PORT": "invalid"})
