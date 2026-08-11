from __future__ import annotations

from dataclasses import dataclass, replace
from types import MappingProxyType

from cosmos.domain import CosmosObject, ObjectContract, ObjectContractError, ObjectIdentity
from cosmos.domain.objects import JSONValue
from cosmos.persistence import ObjectRepository
from cosmos.runtime import ContextSnapshot, EventDispatcher, RuntimeContext, RuntimeEvent
from cosmos.services.errors import RuntimeServiceError, require_permission


@dataclass(frozen=True, slots=True)
class CreateObjectCommand:
    identity: ObjectIdentity
    system_tags: frozenset[str]
    properties: dict[str, JSONValue]
    user_tags: frozenset[str] = frozenset()
    primary_project_id: str | None = None


class ObjectService:
    """Authoritative business boundary for universal Object mutations."""

    def __init__(
        self,
        contract: ObjectContract,
        repository: ObjectRepository,
        events: EventDispatcher,
    ) -> None:
        self.contract = contract
        self.repository = repository
        self._events = events

    def build(self, command: CreateObjectCommand, context: RuntimeContext) -> CosmosObject:
        require_permission(context.permissions, "objects.write")
        return self.contract.build(
            command.identity,
            command.system_tags,
            command.properties,
            user_tags=command.user_tags,
            primary_project_id=command.primary_project_id,
        )

    def create(self, command: CreateObjectCommand, context: RuntimeContext) -> CosmosObject:
        value = self.build(command, context)
        if self.repository.get(value.identity.object_id) is not None:
            raise RuntimeServiceError("object_exists", f"Object already exists: {value.identity.object_id}")
        self.repository.insert(value)
        self.publish_created(value, context)
        return value

    def get(self, object_id: str, context: RuntimeContext) -> CosmosObject:
        require_permission(context.permissions, "objects.read")
        value = self.repository.get(object_id)
        if value is None:
            raise RuntimeServiceError("object_not_found", f"Object not found: {object_id}")
        return value

    def list(self, context: RuntimeContext, *, system_tag: str | None = None) -> tuple[CosmosObject, ...]:
        require_permission(context.permissions, "objects.read")
        return self.repository.list(system_tag=system_tag)

    def update_properties(
        self,
        object_id: str,
        changes: dict[str, JSONValue],
        context: RuntimeContext,
    ) -> CosmosObject:
        require_permission(context.permissions, "objects.write")
        existing = self.repository.get(object_id)
        if existing is None:
            raise RuntimeServiceError("object_not_found", f"Object not found: {object_id}")

        unknown = changes.keys() - existing.properties.keys()
        if unknown:
            raise RuntimeServiceError(
                "validation_failed", f"Properties have no active schema: {', '.join(sorted(unknown))}"
            )
        properties = dict(existing.properties)
        properties.update(changes)
        try:
            updated = self.contract.build(
                existing.identity,
                existing.system_tags,
                properties,
                user_tags=existing.user_tags,
                primary_project_id=existing.primary_project_id,
            )
        except ObjectContractError as error:
            raise RuntimeServiceError("validation_failed", str(error)) from error
        self.repository.replace_properties(updated)
        self._publish("ObjectPropertiesChanged", updated, context)
        return updated

    def update_details(
        self,
        object_id: str,
        *,
        display_name: str,
        description: str,
        context: RuntimeContext,
    ) -> CosmosObject:
        require_permission(context.permissions, "objects.write")
        if not display_name.strip():
            raise RuntimeServiceError("validation_failed", "Object display name must not be empty.")
        existing = self.repository.get(object_id)
        if existing is None:
            raise RuntimeServiceError("object_not_found", f"Object not found: {object_id}")
        updated = replace(
            existing,
            identity=replace(
                existing.identity,
                display_name=display_name.strip(),
                description=description.strip(),
            ),
        )
        self.repository.replace_identity(updated)
        self._publish("ObjectDetailsChanged", updated, context)
        return updated

    def compare_and_swap_property(
        self,
        object_id: str,
        *,
        property_name: str,
        expected_value: JSONValue,
        replacement_value: JSONValue,
        display_name: str,
        description: str,
        conflict_code: str,
        context: RuntimeContext,
    ) -> CosmosObject:
        """Validates and atomically swaps one Object-owned document property."""

        require_permission(context.permissions, "objects.write")
        existing = self.repository.get(object_id)
        if existing is None:
            raise RuntimeServiceError("object_not_found", f"Object not found: {object_id}")
        if property_name not in existing.properties:
            raise RuntimeServiceError(
                "validation_failed",
                f"Property has no active schema: {property_name}",
            )
        if existing.properties[property_name] != expected_value:
            raise RuntimeServiceError(conflict_code, "The stored Object changed after it was loaded.")
        if not display_name.strip():
            raise RuntimeServiceError("validation_failed", "Object display name must not be empty.")

        properties = dict(existing.properties)
        properties[property_name] = replacement_value
        try:
            updated = self.contract.build(
                replace(
                    existing.identity,
                    display_name=display_name.strip(),
                    description=description.strip(),
                ),
                existing.system_tags,
                properties,
                user_tags=existing.user_tags,
                primary_project_id=existing.primary_project_id,
            )
        except ObjectContractError as error:
            raise RuntimeServiceError("validation_failed", str(error)) from error

        if not self.repository.compare_and_swap_property(updated, property_name, expected_value):
            raise RuntimeServiceError(conflict_code, "The stored Object changed after it was loaded.")
        self._publish("ObjectPropertiesChanged", updated, context)
        return updated

    def publish_created(self, value: CosmosObject, context: RuntimeContext) -> None:
        self._publish("ObjectCreated", value, context)

    def _publish(self, event_type: str, value: CosmosObject, context: RuntimeContext) -> None:
        self._events.publish(
            RuntimeEvent.create(
                event_type,
                context=ContextSnapshot.capture(context, "cosmos.local-owner"),
                origin_service="ObjectService",
                affected_object_ids=(value.identity.object_id,),
                metadata=MappingProxyType({}),
            )
        )
