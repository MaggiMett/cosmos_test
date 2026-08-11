from __future__ import annotations

from dataclasses import replace

from cosmos.domain import CosmosObject
from cosmos.runtime import ContextSnapshot, EventDispatcher, RuntimeContext, RuntimeEvent
from cosmos.services.errors import RuntimeServiceError, require_permission
from cosmos.services.object_service import ObjectService

MAX_USER_TAGS = 32
MAX_USER_TAG_LENGTH = 64


class TagService:
    """Authoritative owner of user-created Object Tag mutations."""

    def __init__(self, objects: ObjectService, events: EventDispatcher) -> None:
        self._objects = objects
        self._events = events

    def set_user_tags(
        self,
        object_id: str,
        tags: list[object],
        context: RuntimeContext,
    ) -> CosmosObject:
        require_permission(context.permissions, "tags.write")
        normalized = self.validate_user_tags(tags)

        existing = self._objects.get(object_id, context)
        updated = replace(existing, user_tags=normalized)
        self._objects.repository.replace_user_tags(updated)
        self._events.publish(
            RuntimeEvent.create(
                "ObjectUserTagsChanged",
                context=ContextSnapshot.capture(context, "cosmos.local-owner"),
                origin_service="TagService",
                affected_object_ids=(object_id,),
                metadata={"user_tags": sorted(normalized)},
            )
        )
        return updated

    @staticmethod
    def validate_user_tags(tags: list[object]) -> frozenset[str]:
        normalized = frozenset(_normalize_tag(tag) for tag in tags)
        if len(normalized) > MAX_USER_TAGS:
            raise RuntimeServiceError(
                "validation_failed", f"Objects may have at most {MAX_USER_TAGS} User Tags."
            )

        return normalized


def _normalize_tag(value: object) -> str:
    if not isinstance(value, str):
        raise RuntimeServiceError("validation_failed", "Every User Tag must be a string.")
    normalized = " ".join(value.split())
    if not normalized:
        raise RuntimeServiceError("validation_failed", "User Tags must not be empty.")
    if len(normalized) > MAX_USER_TAG_LENGTH:
        raise RuntimeServiceError(
            "validation_failed", f"User Tags may contain at most {MAX_USER_TAG_LENGTH} characters."
        )
    return normalized
