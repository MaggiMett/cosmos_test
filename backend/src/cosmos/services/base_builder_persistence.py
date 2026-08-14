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


@dataclass(frozen=True, slots=True)
class BaseBuilderActivateCommand:
    base_object_id: str
    revision_id: str


class BaseBuilderPersistenceService:
    """Validated persistence boundary for Builder documents; activation is explicit and separate."""

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

    def activation_candidate(self, base_object_id: str, context: RuntimeContext) -> dict[str, JSONValue]:
        stored = self.load(base_object_id, context)
        revision_id = stored.get("revisionId")
        document = stored.get("document")
        if not isinstance(revision_id, str) or not isinstance(document, dict):
            raise RuntimeServiceError("validation_failed", "Base Builder has no saved document to activate.")
        self._validate_document(document)
        return {"baseObjectId": base_object_id, "revisionId": revision_id, "document": document}

    def activate(self, command: BaseBuilderActivateCommand, context: RuntimeContext) -> dict[str, JSONValue]:
        target = self._objects.get(command.base_object_id, context)
        candidate = self.activation_candidate(command.base_object_id, context)
        if candidate["revisionId"] != command.revision_id:
            raise RuntimeServiceError("conflict", "The saved Base Builder revision changed before activation.")
        current_active = target.properties.get("active_builder_document", {})
        replacement = {"revisionId": command.revision_id, "document": candidate["document"]}
        updated = self._objects.compare_and_swap_property(
            command.base_object_id,
            property_name="active_builder_document",
            expected_value=current_active,
            replacement_value=replacement,
            display_name=target.identity.display_name,
            description=target.identity.description,
            conflict_code="conflict",
            context=context,
        )
        active = updated.properties["active_builder_document"]
        return {"baseObjectId": command.base_object_id, "revisionId": command.revision_id, "document": active["document"]}

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
