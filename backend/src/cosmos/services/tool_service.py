from __future__ import annotations

from collections.abc import Mapping
from dataclasses import replace
from types import MappingProxyType
from uuid import uuid4

from cosmos.domain import CosmosObject
from cosmos.domain.objects import JSONValue
from cosmos.runtime import (
    ContextSnapshot,
    EventDispatcher,
    RuntimeContext,
    RuntimeEvent,
    ToolInstance,
    ToolRuntime,
)
from cosmos.services.errors import RuntimeServiceError, require_permission
from cosmos.services.object_service import ObjectService
from cosmos.services.serialization import object_payload


class ToolService:
    """Authoritative activation boundary around the Tool Runtime lifecycle."""

    def __init__(self, objects: ObjectService, runtime: ToolRuntime, events: EventDispatcher) -> None:
        self._objects = objects
        self._runtime = runtime
        self._events = events

    def open_workspace_tool(
        self,
        definition_object_id: str,
        workspace_session_id: str,
        context: RuntimeContext,
        *,
        instance_id: str | None = None,
        runtime_state: Mapping[str, JSONValue] | None = None,
    ) -> ToolInstance:
        require_permission(context.permissions, "tools.write")
        definition = self._objects.get(definition_object_id, context)
        if "Tool" not in definition.system_tags:
            raise RuntimeServiceError("validation_failed", "The requested Object is not a Tool definition.")
        object_id = instance_id or f"cosmos.tool-instance.{uuid4()}"
        tool_context = replace(
            context,
            workspace_session_id=workspace_session_id,
            tool_instance_id=object_id,
        )
        instance = self._runtime.create(
            definition_object_id,
            tool_context,
            workspace_session_id=workspace_session_id,
            instance_id=object_id,
            runtime_state=runtime_state,
            display_name=f"{definition.identity.display_name} Instance",
        )
        self._publish("ToolOpened", instance, tool_context)
        return instance

    def definitions(self, context: RuntimeContext) -> list[dict[str, JSONValue]]:
        require_permission(context.permissions, "tools.read")
        return [self._definition_payload(value) for value in self._objects.list(context, system_tag="Tool")]

    def focus(self, object_id: str, context: RuntimeContext) -> ToolInstance:
        require_permission(context.permissions, "tools.write")
        try:
            return self._runtime.focus(object_id)
        except KeyError as error:
            raise RuntimeServiceError("tool_instance_not_found", str(error)) from error

    def update_state(
        self, object_id: str, state: Mapping[str, JSONValue], context: RuntimeContext
    ) -> ToolInstance:
        require_permission(context.permissions, "tools.write")
        try:
            return self._runtime.update_state(object_id, state)
        except KeyError as error:
            raise RuntimeServiceError("tool_instance_not_found", str(error)) from error

    def close(self, object_id: str, context: RuntimeContext) -> ToolInstance:
        require_permission(context.permissions, "tools.write")
        try:
            instance = self._runtime.close(object_id)
        except KeyError as error:
            raise RuntimeServiceError("tool_instance_not_found", str(error)) from error
        self._publish("ToolClosed", instance, context)
        return instance

    def close_workspace(self, workspace_session_id: str, context: RuntimeContext) -> tuple[ToolInstance, ...]:
        require_permission(context.permissions, "tools.write")
        closed = self._runtime.close_workspace(workspace_session_id)
        for instance in closed:
            self._publish("ToolClosed", instance, context)
        return closed

    def list(self, workspace_session_id: str, context: RuntimeContext) -> tuple[ToolInstance, ...]:
        require_permission(context.permissions, "tools.read")
        return self._runtime.list(workspace_session_id)

    def _publish(self, event_type: str, instance: ToolInstance, context: RuntimeContext) -> None:
        self._events.publish(
            RuntimeEvent.create(
                event_type,
                context=ContextSnapshot.capture(context, "cosmos.local-owner"),
                origin_service="ToolService",
                affected_object_ids=(instance.object_id, instance.definition_object_id),
                metadata=MappingProxyType(
                    {
                        "workspaceSessionId": instance.workspace_session_id or "",
                        "executionMode": instance.execution_mode,
                    }
                ),
            )
        )

    @staticmethod
    def _definition_payload(definition: CosmosObject) -> dict[str, JSONValue]:
        payload = object_payload(definition)
        properties = definition.properties
        minimum = properties["minimum_window_size"]
        return {
            **payload,
            "category": properties["category"],
            "componentKey": properties["component_id"],
            "icon": properties["icon"],
            "capabilities": properties["capabilities"],
            "permissions": properties["permissions"],
            "minimumSize": minimum,
        }
