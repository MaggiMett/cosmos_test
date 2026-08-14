from __future__ import annotations

from dataclasses import dataclass

from cosmos.domain.objects import JSONValue
from cosmos.runtime import RuntimeContext
from cosmos.services.errors import RuntimeServiceError
from cosmos.services.object_service import ObjectService

BASE_BUILDER_DOCUMENT_KIND = "cosmos.base-composition.v1"


@dataclass(frozen=True, slots=True)
class BaseBuilderPersistCommand:
    base_object_id: str
    document: dict[str, JSONValue]
    expected_revision_id: str | None = None


class BaseBuilderPersistenceService:
    """Validated persistence boundary for Builder documents; activation remains separate."""

    def __init__(self, objects: ObjectService) -> None:
        self._objects = objects

    def validate_target(self, command: BaseBuilderPersistCommand, context: RuntimeContext) -> None:
        target = self._objects.get(command.base_object_id, context)
        if "Base" not in target.system_tags:
            raise RuntimeServiceError("validation_failed", "Base Builder persistence target is not a Base Object.")
        self._validate_document(command.document)

    @staticmethod
    def _validate_document(document: dict[str, JSONValue]) -> None:
        base = document.get("base")
        active_room_id = document.get("activeRoomId")
        if not isinstance(base, dict) or not isinstance(active_room_id, str) or not active_room_id:
            raise RuntimeServiceError("validation_failed", "Base Builder document is malformed.")
        rooms = base.get("rooms")
        entry_room_id = base.get("entryRoomId")
        if not isinstance(rooms, list) or not rooms or not isinstance(entry_room_id, str):
            raise RuntimeServiceError("validation_failed", "Base Builder document requires rooms and an entry room.")
        room_ids = {
            room.get("roomId") for room in rooms if isinstance(room, dict) and isinstance(room.get("roomId"), str)
        }
        if active_room_id not in room_ids or entry_room_id not in room_ids:
            raise RuntimeServiceError("validation_failed", "Base Builder document references an unknown Room.")
