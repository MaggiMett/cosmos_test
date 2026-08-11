from __future__ import annotations

from cosmos.domain import Relationship
from cosmos.persistence import RelationshipRepository
from cosmos.runtime import ContextSnapshot, EventDispatcher, RuntimeContext, RuntimeEvent
from cosmos.services.errors import RuntimeServiceError, require_permission
from cosmos.services.object_service import ObjectService


class RelationshipService:
    def __init__(
        self,
        repository: RelationshipRepository,
        objects: ObjectService,
        events: EventDispatcher,
    ) -> None:
        self._repository = repository
        self._objects = objects
        self._events = events

    def create_related(
        self,
        project_id: str,
        endpoint_a_id: str,
        endpoint_b_id: str,
        context: RuntimeContext,
    ) -> Relationship:
        require_permission(context.permissions, "relationships.write")
        project = self._objects.get(project_id, context)
        if "Project" not in project.system_tags:
            raise RuntimeServiceError("validation_failed", "Relationship owner must be a Project Object.")
        self._objects.get(endpoint_a_id, context)
        self._objects.get(endpoint_b_id, context)
        relationship = Relationship.create(project_id, endpoint_a_id, endpoint_b_id)
        self._repository.insert(relationship)
        self._events.publish(
            RuntimeEvent.create(
                "RelationshipCreated",
                context=ContextSnapshot.capture(context, "cosmos.local-owner"),
                origin_service="RelationshipService",
                affected_object_ids=(endpoint_a_id, endpoint_b_id),
                metadata={"relationship_id": relationship.relationship_id, "type": "Related"},
            )
        )
        return relationship

    def list(self, context: RuntimeContext, project_ids: tuple[str, ...] = ()) -> tuple[Relationship, ...]:
        require_permission(context.permissions, "relationships.read")
        return self._repository.list(project_ids or None)

    def list_for_object(self, object_id: str, context: RuntimeContext) -> tuple[Relationship, ...]:
        require_permission(context.permissions, "relationships.read")
        return self._repository.list_for_object(object_id, context.project_scope_ids or None)
