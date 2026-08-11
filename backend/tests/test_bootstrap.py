from pathlib import Path

import pytest

from cosmos.bootstrap import CosmosRuntime, StartupPhase
from cosmos.config import RuntimeSettings


def test_runtime_startup_is_ordered_idempotent_and_stoppable(tmp_path: Path) -> None:
    runtime = CosmosRuntime.build(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))

    assert runtime.startup.phase is StartupPhase.CREATED
    assert not runtime.ready()

    runtime.initialize()
    completed_at = runtime.startup.completed_at
    runtime.initialize()

    assert runtime.ready()
    assert runtime.startup.phase is StartupPhase.READY
    assert runtime.startup.started_at is not None
    assert runtime.startup.completed_at == completed_at

    runtime.shutdown()

    assert runtime.startup.phase is StartupPhase.STOPPED
    assert not runtime.ready()


def test_runtime_records_startup_failure(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    runtime = CosmosRuntime.build(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))

    def fail() -> None:
        raise RuntimeError("database unavailable")

    monkeypatch.setattr(runtime.persistence, "initialize", fail)

    with pytest.raises(RuntimeError, match="database unavailable"):
        runtime.initialize()

    assert runtime.startup.phase is StartupPhase.FAILED
    assert runtime.startup.failure == "database unavailable"
    assert not runtime.ready()
