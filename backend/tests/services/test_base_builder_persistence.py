from pathlib import Path

import pytest

from cosmos.bootstrap import CosmosRuntime
from cosmos.config import RuntimeSettings
from cosmos.runtime import RuntimeContext
from cosmos.services.base_builder_persistence import BaseBuilderPersistCommand, BaseBuilderPersistenceService
from cosmos.services.errors import RuntimeServiceError


def _document(room_id: str = "room.main") -> dict:
    return {
        "activeRoomId": room_id,
        "base": {"rooms": [{"roomId": room_id}], "entryRoomId": room_id},
    }


def test_validates_existing_base_target_and_document_references(tmp_path: Path) -> None:
    runtime = CosmosRuntime.build(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))
    runtime.initialize()
    service = BaseBuilderPersistenceService(runtime.objects)
    base = runtime.objects.repository.list(system_tag="Base")[0]
    owner = RuntimeContext(permissions=frozenset({"objects.read", "objects.write"}))

    service.validate_target(BaseBuilderPersistCommand(base.identity.object_id, _document()), owner)


def test_rejects_unknown_room_reference_before_persistence(tmp_path: Path) -> None:
    runtime = CosmosRuntime.build(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))
    runtime.initialize()
    service = BaseBuilderPersistenceService(runtime.objects)
    base = runtime.objects.repository.list(system_tag="Base")[0]
    document = _document()
    document["activeRoomId"] = "room.missing"

    with pytest.raises(RuntimeServiceError, match="unknown Room"):
        service.validate_target(
            BaseBuilderPersistCommand(base.identity.object_id, document),
            RuntimeContext(permissions=frozenset({"objects.read", "objects.write"})),
        )
