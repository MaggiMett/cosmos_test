from __future__ import annotations

from collections.abc import Iterable

from cosmos.domain import CosmosObject, ObjectContractError
from cosmos.domain.objects import JSONValue
from cosmos.runtime import RuntimeContext
from cosmos.services.errors import RuntimeServiceError
from cosmos.services.object_service import ObjectService
from cosmos.services.relationship_service import RelationshipService
from cosmos.services.serialization import object_payload
from cosmos.services.tag_service import TagService

EDITABLE_PROPERTIES_BY_TAG: dict[str, frozenset[str]] = {
    "Project": frozenset({"vision", "project_color"}),
    "Node": frozenset({"skin"}),
    "Workspace": frozenset({"icon", "overlay", "theme_override", "source_project_id"}),
}


class ObjectInteractionService:
    """Read and edit universal Objects for generic interaction surfaces."""

    def __init__(
        self,
        objects: ObjectService,
        tags: TagService,
        relationships: RelationshipService,
    ) -> None:
        self._objects = objects
        self._tags = tags
        self._relationships = relationships

    def inspect(self, object_id: str, context: RuntimeContext) -> dict[str, JSONValue]:
        value = self._objects.get(object_id, context)
        _require_visible(value, context)
        editable = _editable_properties(value.system_tags)
        relationships: list[dict[str, JSONValue]] = []
        for relationship in self._relationships.list_for_object(object_id, context):
            related_id = (
                relationship.endpoint_b_id
                if relationship.endpoint_a_id == object_id
                else relationship.endpoint_a_id
            )
            related = self._objects.get(related_id, context)
            if not _visible(related, context):
                continue
            relationships.append(
                {
                    "relationshipId": relationship.relationship_id,
                    "type": relationship.relationship_type.value,
                    "projectId": relationship.project_id,
                    "relatedObjectId": related_id,
                    "relatedDisplayName": related.identity.display_name,
                }
            )
        return {
            **object_payload(value),
            "primaryProjectId": value.primary_project_id,
            "properties": dict(value.properties),
            "editableProperties": sorted(editable),
            "relationships": relationships,
            "actions": self.actions(object_id, context),
        }

    def actions(self, object_id: str, context: RuntimeContext) -> list[dict[str, JSONValue]]:
        value = self._objects.get(object_id, context)
        _require_visible(value, context)
        tags = value.system_tags
        if "Workspace" in tags:
            return _actions(
                ("open_workspace", "Open Workspace", "primary"),
                ("rename", "Rename", "edit"),
                ("assign_project", "Assign Project", "edit"),
                ("tags", "Tags", "edit"),
                ("appearance", "Appearance", "appearance"),
            )
        if "Node" in tags:
            return _actions(
                ("open", "Open", "primary"),
                ("appearance", "Appearance", "appearance"),
                ("connections", "Connections", "relationships"),
                ("configuration", "Configuration", "edit"),
            )
        if "Base" in tags:
            return _actions(
                ("open", "Open", "primary"),
                ("appearance", "Appearance", "appearance"),
                ("configuration", "Configuration", "edit"),
            )
        return _actions(
            ("open", "Open", "primary"),
            ("configuration", "Configuration", "edit"),
        )

    def update(
        self,
        object_id: str,
        payload: dict[str, object],
        context: RuntimeContext,
    ) -> dict[str, JSONValue]:
        existing = self._objects.get(object_id, context)
        _require_visible(existing, context)
        display_name = payload.get("displayName", existing.identity.display_name)
        description = payload.get("description", existing.identity.description)
        if not isinstance(display_name, str) or not isinstance(description, str):
            raise RuntimeServiceError("validation_failed", "displayName and description must be strings.")
        if not display_name.strip():
            raise RuntimeServiceError("validation_failed", "Object display name must not be empty.")

        user_tags = payload.get("userTags")
        if user_tags is not None:
            if not isinstance(user_tags, list):
                raise RuntimeServiceError("validation_failed", "userTags must be an array.")
            self._tags.validate_user_tags(user_tags)

        properties = payload.get("properties")
        if properties is not None:
            if not isinstance(properties, dict):
                raise RuntimeServiceError("validation_failed", "properties must be an object.")
            allowed = _editable_properties(existing.system_tags)
            unsupported = properties.keys() - allowed
            if unsupported:
                raise RuntimeServiceError(
                    "validation_failed",
                    "Properties are not editable through Object Windows: " + ", ".join(sorted(unsupported)),
                )
            complete_properties = dict(existing.properties)
            complete_properties.update(properties)
            try:
                self._objects.contract.build(
                    existing.identity,
                    existing.system_tags,
                    complete_properties,
                    user_tags=existing.user_tags,
                    primary_project_id=existing.primary_project_id,
                )
            except ObjectContractError as error:
                raise RuntimeServiceError("validation_failed", str(error)) from error

        if display_name != existing.identity.display_name or description != existing.identity.description:
            self._objects.update_details(
                object_id,
                display_name=display_name,
                description=description,
                context=context,
            )
        if user_tags is not None:
            self._tags.set_user_tags(object_id, user_tags, context)
        if properties is not None:
            self._objects.update_properties(object_id, dict(properties), context)
        return self.inspect(object_id, context)


def _editable_properties(system_tags: Iterable[str]) -> frozenset[str]:
    editable: set[str] = set()
    for tag in system_tags:
        editable.update(EDITABLE_PROPERTIES_BY_TAG.get(tag, ()))
    return frozenset(editable)


def _require_visible(value: CosmosObject, context: RuntimeContext) -> None:
    if not _visible(value, context):
        raise RuntimeServiceError("object_not_found", "Object is outside the active Project scope.")


def _visible(value: CosmosObject, context: RuntimeContext) -> bool:
    return not (
        value.primary_project_id
        and context.project_scope_ids
        and value.primary_project_id not in context.project_scope_ids
    )


def _actions(*values: tuple[str, str, str]) -> list[dict[str, JSONValue]]:
    return [
        {"id": action_id, "label": label, "group": group, "enabled": True}
        for action_id, label, group in values
    ]
