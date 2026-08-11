from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from cosmos.domain import CosmosObject, ObjectIdentity
from cosmos.runtime import RuntimeContext
from cosmos.services.errors import RuntimeServiceError
from cosmos.services.object_service import CreateObjectCommand, ObjectService

COMPANION_ID = "cosmos.entity.companion.default"


@dataclass(frozen=True, slots=True)
class CompanionReply:
    message: str
    mode: str


class CompanionService:
    """Durable Companion identity and deterministic non-AI conversation."""

    def __init__(self, objects: ObjectService) -> None:
        self._objects = objects

    def ensure_default(self, context: RuntimeContext) -> CosmosObject:
        existing = self._objects.repository.get(COMPANION_ID)
        if existing is not None:
            return existing
        return self._objects.create(
            CreateObjectCommand(
                identity=ObjectIdentity(
                    object_id=COMPANION_ID,
                    display_name="Companion",
                    description="The default global Support Entity of Cosmos.",
                    creator="cosmos.runtime",
                    lifecycle_state="active",
                    created_at=datetime.now(UTC),
                ),
                system_tags=frozenset({"Entity", "Companion", "System"}),
                properties={
                    "runtime_scope": "Global",
                    "avatar_id": "cosmos.avatar.companion.astronaut",
                    "behaviour_profile_id": "cosmos.behaviour.calm",
                    "runtime_state": "Idle",
                    "visible": True,
                    "personality_profile_id": "cosmos.personality.default",
                    "notification_available": False,
                },
            ),
            context,
        )

    def get_default(self, context: RuntimeContext) -> CosmosObject:
        return self._objects.get(COMPANION_ID, context)

    def reply(self, message: str, context: RuntimeContext) -> CompanionReply:
        if not message.strip():
            raise RuntimeServiceError("validation_failed", "A conversation message must not be empty.")
        normalized = " ".join(message.casefold().split())
        if normalized in {"hello", "hi", "hey"}:
            return CompanionReply("Hello. I'm here with you in Cosmos.", "deterministic")
        if normalized in {"where am i", "where am i?"}:
            if context.workspace_session_id:
                return CompanionReply(
                    "You are in the active Workspace with its current Object context.",
                    "deterministic",
                )
            if context.room_id:
                return CompanionReply(
                    "You are in the current Base Room.",
                    "deterministic",
                )
            if context.focused_project_id:
                return CompanionReply(
                    "You are focused on the current Project while the surrounding Cosmos remains available.",
                    "deterministic",
                )
            return CompanionReply("You are in the global Cosmos.", "deterministic")
        return CompanionReply(
            "I can stay present and report Runtime context, but advanced conversation needs "
            "an available AI Provider.",
            "deterministic",
        )
