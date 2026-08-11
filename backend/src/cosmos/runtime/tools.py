from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass, replace
from datetime import UTC, datetime
from enum import StrEnum
from types import MappingProxyType
from uuid import uuid4

from cosmos.domain import CosmosObject, ObjectContract, ObjectIdentity
from cosmos.domain.objects import JSONValue
from cosmos.runtime.context import RuntimeContext


class ToolLifecycleState(StrEnum):
    CREATED = "created"
    INITIALIZED = "initialized"
    READY = "ready"
    ACTIVE = "active"
    BACKGROUND = "background"
    SUSPENDED = "suspended"
    CLOSED = "closed"
    DESTROYED = "destroyed"


@dataclass(frozen=True, slots=True)
class ToolInstance:
    object_value: CosmosObject
    definition_object_id: str
    workspace_session_id: str | None
    execution_mode: str
    context: RuntimeContext
    state: ToolLifecycleState
    runtime_state: Mapping[str, JSONValue]

    @property
    def object_id(self) -> str:
        return self.object_value.identity.object_id


class ToolRuntime:
    """Lifecycle owner for isolated temporary Tool Instances."""

    def __init__(
        self,
        contract: ObjectContract,
        create_id: Callable[[], str] = lambda: str(uuid4()),
    ) -> None:
        self._contract = contract
        self._create_id = create_id
        self._instances: dict[str, ToolInstance] = {}

    def create(
        self,
        definition_object_id: str,
        context: RuntimeContext,
        *,
        workspace_session_id: str | None = None,
        instance_id: str | None = None,
        runtime_state: Mapping[str, JSONValue] | None = None,
        display_name: str = "Tool Instance",
    ) -> ToolInstance:
        object_id = instance_id or f"cosmos.tool-instance.{self._create_id()}"
        if object_id in self._instances:
            raise ValueError(f"Tool Instance is already active: {object_id}")
        mode = "workspace" if workspace_session_id else "direct"
        instance = ToolInstance(
            object_value=self._contract.build(
                ObjectIdentity(
                    object_id=object_id,
                    display_name=display_name,
                    description="Temporary active Tool Instance.",
                    creator="cosmos.tool-runtime",
                    lifecycle_state="active",
                    created_at=datetime.now(UTC),
                ),
                frozenset({"System", "ToolInstance"}),
                {
                    "tool_definition_id": definition_object_id,
                    "workspace_session_id": workspace_session_id or "",
                    "execution_mode": mode,
                    "runtime_state": dict(runtime_state or {}),
                    "lifecycle_state": ToolLifecycleState.CREATED.value,
                },
            ),
            definition_object_id=definition_object_id,
            workspace_session_id=workspace_session_id,
            execution_mode=mode,
            context=context,
            state=ToolLifecycleState.CREATED,
            runtime_state=MappingProxyType(dict(runtime_state or {})),
        )
        instance = self._transition(instance, ToolLifecycleState.INITIALIZED)
        instance = self._transition(instance, ToolLifecycleState.READY)
        self._instances[object_id] = instance
        return self.focus(object_id)

    def focus(self, object_id: str) -> ToolInstance:
        selected = self.get(object_id)
        for instance_id, instance in tuple(self._instances.items()):
            if (
                instance.workspace_session_id == selected.workspace_session_id
                and instance.state is ToolLifecycleState.ACTIVE
            ):
                self._instances[instance_id] = self._transition(instance, ToolLifecycleState.BACKGROUND)
        active = self._transition(selected, ToolLifecycleState.ACTIVE)
        self._instances[object_id] = active
        return active

    def update_state(self, object_id: str, state: Mapping[str, JSONValue]) -> ToolInstance:
        existing = self.get(object_id)
        properties = dict(existing.object_value.properties)
        properties["runtime_state"] = dict(state)
        updated = replace(
            existing,
            object_value=self._contract.build(
                existing.object_value.identity,
                existing.object_value.system_tags,
                properties,
            ),
            runtime_state=MappingProxyType(dict(state)),
        )
        self._instances[object_id] = updated
        return updated

    def close(self, object_id: str) -> ToolInstance:
        closed = self._transition(self.get(object_id), ToolLifecycleState.CLOSED)
        destroyed = self._transition(closed, ToolLifecycleState.DESTROYED)
        del self._instances[object_id]
        return destroyed

    def close_workspace(self, workspace_session_id: str) -> tuple[ToolInstance, ...]:
        return tuple(
            self.close(instance.object_id)
            for instance in tuple(self._instances.values())
            if instance.workspace_session_id == workspace_session_id
        )

    def get(self, object_id: str) -> ToolInstance:
        try:
            return self._instances[object_id]
        except KeyError as error:
            raise KeyError(f"Unknown active Tool Instance: {object_id}") from error

    def list(self, workspace_session_id: str | None = None) -> tuple[ToolInstance, ...]:
        return tuple(
            instance
            for instance in self._instances.values()
            if workspace_session_id is None or instance.workspace_session_id == workspace_session_id
        )

    def _transition(self, instance: ToolInstance, state: ToolLifecycleState) -> ToolInstance:
        properties = dict(instance.object_value.properties)
        properties["lifecycle_state"] = state.value
        return replace(
            instance,
            object_value=self._contract.build(
                instance.object_value.identity,
                instance.object_value.system_tags,
                properties,
            ),
            state=state,
        )
