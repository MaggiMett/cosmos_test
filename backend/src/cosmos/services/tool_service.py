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
    Registry,
    RegistryStatus,
    RuntimeContext,
    RuntimeEvent,
    ToolAdapterContext,
    ToolAdapterRegistry,
    ToolInstance,
    ToolRuntime,
)
from cosmos.services.errors import RuntimeServiceError, require_permission
from cosmos.services.object_service import ObjectService
from cosmos.services.serialization import object_payload


class ToolService:
    """Authoritative activation boundary around the Tool Runtime lifecycle."""

    def __init__(
        self,
        objects: ObjectService,
        runtime: ToolRuntime,
        events: EventDispatcher,
        registry: Registry,
        adapters: ToolAdapterRegistry,
    ) -> None:
        self._objects = objects
        self._runtime = runtime
        self._events = events
        self._registry = registry
        self._adapters = adapters

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
        try:
            registry_entry = self._registry.resolve(definition_object_id)
        except KeyError as error:
            raise RuntimeServiceError(
                "tool_not_registered", "The requested Tool definition is not registered."
            ) from error
        if registry_entry.status is not RegistryStatus.ACTIVE:
            raise RuntimeServiceError("tool_not_active", "The requested Tool definition is not active.")
        if registry_entry.object_id != definition_object_id:
            raise RuntimeServiceError(
                "tool_registry_mismatch", "The Tool Registry entry does not match its definition Object."
            )
        runtime_kind = str(definition.properties["runtime_kind"])
        try:
            adapter = self._adapters.resolve(runtime_kind)
        except (LookupError, ValueError) as error:
            raise RuntimeServiceError("tool_adapter_unavailable", str(error)) from error
        availability_error = adapter.availability_error(registry_entry, context)
        if availability_error is not None:
            raise RuntimeServiceError("tool_unavailable", availability_error)
        missing_permissions = registry_entry.permissions - context.permissions
        if missing_permissions:
            raise RuntimeServiceError(
                "tool_permission_denied",
                "Tool requires permissions that are not granted: " + ", ".join(sorted(missing_permissions)),
            )
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
        adapter.open(ToolAdapterContext(registry_entry, instance, tool_context))
        self._publish("ToolOpened", instance, tool_context)
        return instance

    def definitions(
        self,
        context: RuntimeContext,
        *,
        required_capabilities: frozenset[str] = frozenset(),
    ) -> list[dict[str, JSONValue]]:
        require_permission(context.permissions, "tools.read")
        entries = self._registry.query(
            category="tool",
            capabilities=required_capabilities or None,
            status=RegistryStatus.ACTIVE,
        )
        entries = tuple(entry for entry in entries if entry.permissions.issubset(context.permissions))
        definitions: list[dict[str, JSONValue]] = []
        for entry in entries:
            if entry.object_id is None:
                continue
            try:
                definition = self._objects.get(entry.object_id, context)
            except RuntimeServiceError:
                continue
            if "Tool" in definition.system_tags:
                definitions.append(self._definition_payload(definition))
        return definitions

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
            "runtimeKind": properties["runtime_kind"],
            "runtimeConfiguration": properties.get("runtime_configuration", {}),
            "entryPoint": properties["entry_point"],
            "icon": properties["icon"],
            "capabilities": properties["capabilities"],
            "permissions": properties["permissions"],
            "minimumSize": minimum,
        }
