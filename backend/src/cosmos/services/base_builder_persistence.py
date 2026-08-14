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

    def load(self, base_object_id: str, context: RuntimeContext) -> dict[str, JSONValue]:
        target = self._objects.get(base_object_id, context)
        if "Base" not in target.system_tags:
            raise RuntimeServiceError("validation_failed", "Base Builder persistence target is not a Base Object.")
        current = target.properties.get("builder_document", {})
        if not isinstance(current, dict):
            raise RuntimeServiceError("validation_failed", "Stored Base Builder document is malformed.")
        revision_id = current.get("revisionId")
        document = current.get("document")
        return {
            "revisionId": revision_id if isinstance(revision_id, str) else None,
            "document": document if isinstance(document, dict) else None,
        }

    def persist(self, command: BaseBuilderPersistCommand, context: RuntimeContext) -> dict[str, JSONValue]:
        self.validate_target(command, context)
        target = self._objects.get(command.base_object_id, context)
        current = target.properties.get("builder_document", {})
        if not isinstance(current, dict):
            raise RuntimeServiceError("validation_failed", "Stored Base Builder document is malformed.")
        current_revision = current.get("revisionId")
        if current_revision is not None and not isinstance(current_revision, str):
            raise RuntimeServiceError("validation_failed", "Stored Base Builder revision is malformed.")
        if command.expected_revision_id != current_revision:
            raise RuntimeServiceError("conflict", "Base Builder document changed since it was loaded.")

        base = command.document.get("base")
        revision = base.get("revision") if isinstance(base, dict) else None
        revision_id = revision.get("revisionId") if isinstance(revision, dict) else None
        if not isinstance(revision_id, str) or not revision_id:
            raise RuntimeServiceError("validation_failed", "Base Builder document requires a revision id.")
        envelope: dict[str, JSONValue] = {"revisionId": revision_id, "document": command.document}
        properties = dict(target.properties)
        properties["builder_document"] = envelope
        updated = self._objects.contract.build(
            target.identity,
            target.system_tags,
            properties,
            user_tags=target.user_tags,
            primary_project_id=target.primary_project_id,
        )
        if not self._objects.repository.compare_and_swap_property(updated, "builder_document", current):
            raise RuntimeServiceError("conflict", "Base Builder document changed while it was being saved.")
        return envelope

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
