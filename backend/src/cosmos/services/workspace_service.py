from __future__ import annotations

import math
from collections.abc import Mapping
from dataclasses import dataclass, replace
from datetime import UTC, datetime
from types import MappingProxyType
from uuid import uuid4

from cosmos.domain import CosmosObject, ObjectIdentity
from cosmos.domain.objects import JSONValue
from cosmos.persistence import RuntimeStateRepository
from cosmos.runtime import ContextSnapshot, EventDispatcher, RuntimeContext, RuntimeEvent
from cosmos.services.errors import RuntimeServiceError, require_permission
from cosmos.services.object_service import ObjectService
from cosmos.services.serialization import object_payload
from cosmos.services.tool_service import ToolService


@dataclass(slots=True)
class ActiveWorkspaceSession:
    object_value: CosmosObject
    definition: CosmosObject
    environment_window: CosmosObject
    context: RuntimeContext
    state: str
    restorable_state: dict[str, JSONValue]
    tool_windows: dict[str, CosmosObject]

    @property
    def object_id(self) -> str:
        return self.object_value.identity.object_id


class WorkspaceService:
    """Owns Workspace definitions, temporary sessions, containment, layout and restoration."""

    def __init__(
        self,
        objects: ObjectService,
        state: RuntimeStateRepository,
        tools: ToolService,
        events: EventDispatcher,
    ) -> None:
        self._objects = objects
        self._state = state
        self._tools = tools
        self._events = events
        self._sessions: dict[str, ActiveWorkspaceSession] = {}

    def definition(self, object_id: str, context: RuntimeContext) -> dict[str, JSONValue]:
        require_permission(context.permissions, "workspaces.read")
        definition = self._workspace_definition(object_id, context)
        return self._definition_payload(definition)

    def open(self, object_id: str, room_id: str, context: RuntimeContext) -> dict[str, JSONValue]:
        require_permission(context.permissions, "workspaces.write")
        definition = self._workspace_definition(object_id, context)
        self._validate_room(room_id, context)
        for session in self._sessions.values():
            if session.state == "active":
                self._set_session_state(session, "background")

        session_id = f"cosmos.workspace-session.{uuid4()}"
        workspace_context = _workspace_context(definition, context, room_id, session_id)
        state = self._load_state(definition.identity.object_id, context)
        session_object = self._objects.contract.build(
            ObjectIdentity(
                object_id=session_id,
                display_name=f"{definition.identity.display_name} Session",
                description="Temporary active Workspace session.",
                creator="cosmos.workspace-runtime",
                lifecycle_state="active",
                created_at=datetime.now(UTC),
            ),
            frozenset({"System", "WorkspaceSession"}),
            {
                "workspace_definition_id": definition.identity.object_id,
                "room_id": room_id,
                "runtime_state": state,
                "session_state": "active",
            },
        )
        environment_window = self._objects.contract.build(
            ObjectIdentity(
                object_id=f"cosmos.window.workspace.{session_id.rsplit('.', 1)[-1]}",
                display_name=definition.identity.display_name,
                description="Fixed Workspace Environment Window.",
                creator="cosmos.workspace-runtime",
                lifecycle_state="active",
                created_at=datetime.now(UTC),
            ),
            frozenset({"EnvironmentWindow", "System", "Window"}),
            {
                "window_role": "workspace_environment",
                "parent_window_id": "",
                "bounds": {},
                "window_state": "active",
                "focus_order": 0,
            },
        )
        session = ActiveWorkspaceSession(
            object_value=session_object,
            definition=definition,
            environment_window=environment_window,
            context=workspace_context,
            state="active",
            restorable_state=state,
            tool_windows={},
        )
        self._sessions[session_id] = session
        try:
            self._restore_tools(session)
        except Exception:
            self._tools.close_workspace(session_id, self._active_context(session))
            del self._sessions[session_id]
            raise
        self._publish("WorkspaceOpened", session, context)
        return self._session_payload(session)

    def get(self, session_id: str, context: RuntimeContext) -> dict[str, JSONValue]:
        require_permission(context.permissions, "workspaces.read")
        return self._session_payload(self._session(session_id))

    def context(self, session_id: str, context: RuntimeContext) -> RuntimeContext:
        require_permission(context.permissions, "workspaces.read")
        return self._active_context(self._session(session_id))

    def focus(self, session_id: str, context: RuntimeContext) -> dict[str, JSONValue]:
        require_permission(context.permissions, "workspaces.write")
        selected = self._session(session_id)
        for session in self._sessions.values():
            if session.state == "active":
                self._set_session_state(session, "background")
        self._set_session_state(selected, "active")
        self._publish("WorkspaceFocused", selected, context)
        return self._session_payload(selected)

    def save_state(
        self, session_id: str, state: Mapping[str, JSONValue], context: RuntimeContext
    ) -> dict[str, JSONValue]:
        require_permission(context.permissions, "workspaces.write")
        session = self._session(session_id)
        validated = _validate_restorable_state(state)
        selected_object_id = validated["selectedObjectId"]
        if isinstance(selected_object_id, str):
            self._validate_selected_object(selected_object_id, session.context)
        session.restorable_state = validated
        self._set_session_state(session, session.state)
        self._state.set(
            _state_scope(session.definition.identity.object_id),
            "session",
            validated,
            datetime.now(UTC),
        )
        self._publish("WorkspaceStateChanged", session, context)
        return self._session_payload(session)

    def open_tool(
        self,
        session_id: str,
        tool_definition_id: str,
        bounds: Mapping[str, object],
        context: RuntimeContext,
    ) -> dict[str, JSONValue]:
        require_permission(context.permissions, "workspaces.write")
        session = self._session(session_id)
        tool_bounds = _validate_bounds(bounds)
        instance = self._tools.open_workspace_tool(
            tool_definition_id,
            session_id,
            self._active_context(session),
        )
        tools = _state_tools(session.restorable_state)
        for item in tools:
            item["state"] = "background"
        record: dict[str, JSONValue] = {
            "instanceId": instance.object_id,
            "definitionObjectId": tool_definition_id,
            "windowObjectId": f"cosmos.window.tool.{instance.object_id.rsplit('.', 1)[-1]}",
            "bounds": tool_bounds,
            "focusOrder": max((int(item["focusOrder"]) for item in tools), default=0) + 1,
            "state": "active",
            "runtimeState": {},
        }
        tools.append(record)
        session.restorable_state["tools"] = tools
        session.tool_windows[instance.object_id] = self._build_tool_window(session, record)
        return record

    def update_tool(
        self,
        session_id: str,
        instance_id: str,
        changes: Mapping[str, object],
        context: RuntimeContext,
    ) -> dict[str, JSONValue]:
        require_permission(context.permissions, "workspaces.write")
        session = self._session(session_id)
        record = _tool_record(session, instance_id)
        if "bounds" in changes:
            bounds = changes["bounds"]
            if not isinstance(bounds, Mapping):
                raise RuntimeServiceError("validation_failed", "Tool Window bounds must be an object.")
            record["bounds"] = _validate_bounds(bounds)
        if "focusOrder" in changes:
            order = changes["focusOrder"]
            if isinstance(order, bool) or not isinstance(order, int) or order < 0:
                raise RuntimeServiceError(
                    "validation_failed", "Tool Window focus order must be non-negative."
                )
            record["focusOrder"] = order
            for item in _state_tools(session.restorable_state):
                item["state"] = "active" if item["instanceId"] == instance_id else "background"
            self._tools.focus(instance_id, self._active_context(session))
        if "runtimeState" in changes:
            value = changes["runtimeState"]
            if not isinstance(value, Mapping):
                raise RuntimeServiceError("validation_failed", "Tool Runtime State must be an object.")
            runtime_state = {str(key): item for key, item in value.items()}
            record["runtimeState"] = runtime_state
            self._tools.update_state(instance_id, runtime_state, self._active_context(session))
        for item in _state_tools(session.restorable_state):
            session.tool_windows[str(item["instanceId"])] = self._build_tool_window(session, item)
        return record

    def close_tool(self, session_id: str, instance_id: str, context: RuntimeContext) -> dict[str, JSONValue]:
        require_permission(context.permissions, "workspaces.write")
        session = self._session(session_id)
        record = _tool_record(session, instance_id)
        self._tools.close(instance_id, self._active_context(session))
        session.tool_windows.pop(instance_id, None)
        session.restorable_state["tools"] = [
            item for item in _state_tools(session.restorable_state) if item["instanceId"] != instance_id
        ]
        return record

    def close(self, session_id: str, context: RuntimeContext) -> dict[str, JSONValue]:
        require_permission(context.permissions, "workspaces.write")
        session = self._session(session_id)
        self.save_state(session_id, session.restorable_state, context)
        self._tools.close_workspace(session_id, self._active_context(session))
        self._set_session_state(session, "closed")
        payload = self._session_payload(session)
        del self._sessions[session_id]
        self._publish("WorkspaceClosed", session, context)
        return payload

    def _restore_tools(self, session: ActiveWorkspaceSession) -> None:
        for record in sorted(
            _state_tools(session.restorable_state), key=lambda item: int(item["focusOrder"])
        ):
            instance = self._tools.open_workspace_tool(
                str(record["definitionObjectId"]),
                session.object_id,
                self._active_context(session),
                instance_id=str(record["instanceId"]),
                runtime_state=record["runtimeState"] if isinstance(record["runtimeState"], Mapping) else {},
            )
            if record["state"] == "active":
                self._tools.focus(instance.object_id, self._active_context(session))
            session.tool_windows[instance.object_id] = self._build_tool_window(session, record)

    def _load_state(self, definition_id: str, context: RuntimeContext) -> dict[str, JSONValue]:
        require_permission(context.permissions, "runtime_state.read")
        value = self._state.get(_state_scope(definition_id), "session", _empty_state())
        if not isinstance(value, Mapping):
            return _empty_state()
        return _validate_restorable_state(value)

    def _workspace_definition(self, object_id: str, context: RuntimeContext) -> CosmosObject:
        definition = self._objects.get(object_id, context)
        if "Workspace" not in definition.system_tags:
            raise RuntimeServiceError(
                "validation_failed", "The requested Object is not a Workspace definition."
            )
        return definition

    def _validate_room(self, room_id: str, context: RuntimeContext) -> None:
        room = self._objects.get(room_id, context)
        if "Room" not in room.system_tags:
            raise RuntimeServiceError("validation_failed", "Workspace sessions require a Room context.")

    def _active_context(self, session: ActiveWorkspaceSession) -> RuntimeContext:
        selected_object_id = session.restorable_state.get("selectedObjectId")
        if not isinstance(selected_object_id, str):
            return session.context
        try:
            selected = self._validate_selected_object(selected_object_id, session.context)
        except RuntimeServiceError:
            session.restorable_state["selectedObjectId"] = None
            return session.context
        return replace(
            session.context,
            object_id=selected_object_id,
            system_tags=session.context.system_tags | selected.system_tags,
            user_tags=session.context.user_tags | selected.user_tags,
        )

    def _validate_selected_object(
        self,
        object_id: str,
        context: RuntimeContext,
    ) -> CosmosObject:
        selected = self._objects.get(object_id, context)
        if (
            selected.primary_project_id
            and context.project_scope_ids
            and selected.primary_project_id not in context.project_scope_ids
        ):
            raise RuntimeServiceError(
                "validation_failed",
                "Selected Object is outside the Workspace Project scope.",
            )
        return selected

    def _session(self, session_id: str) -> ActiveWorkspaceSession:
        try:
            return self._sessions[session_id]
        except KeyError as error:
            raise RuntimeServiceError(
                "workspace_session_not_found", f"Unknown active Workspace session: {session_id}"
            ) from error

    def _definition_payload(self, definition: CosmosObject) -> dict[str, JSONValue]:
        return {
            **object_payload(definition),
            "icon": definition.properties["icon"],
            "overlay": definition.properties["overlay"],
            "defaultLayout": definition.properties["default_layout"],
            "contextConfiguration": definition.properties["context_configuration"],
            "assignedToolIds": definition.properties["assigned_tool_ids"],
            "themeOverride": definition.properties["theme_override"],
            "sourceProjectId": definition.properties["source_project_id"],
        }

    def _session_payload(self, session: ActiveWorkspaceSession) -> dict[str, JSONValue]:
        return {
            **object_payload(session.object_value),
            "definition": self._definition_payload(session.definition),
            "environmentWindow": {
                **object_payload(session.environment_window),
                "role": "workspace_environment",
            },
            "context": {
                "projectScopeIds": list(session.context.project_scope_ids),
                "focusedProjectId": session.context.focused_project_id,
                "roomId": session.context.room_id,
                "workspaceSessionId": session.object_id,
            },
            "state": session.state,
            "restorableState": session.restorable_state,
        }

    def _publish(self, event_type: str, session: ActiveWorkspaceSession, context: RuntimeContext) -> None:
        self._events.publish(
            RuntimeEvent.create(
                event_type,
                context=ContextSnapshot.capture(context, "cosmos.local-owner"),
                origin_service="WorkspaceService",
                affected_object_ids=(session.object_id, session.definition.identity.object_id),
                metadata=MappingProxyType({"state": session.state}),
            )
        )

    def _set_session_state(self, session: ActiveWorkspaceSession, state: str) -> None:
        properties = dict(session.object_value.properties)
        properties["session_state"] = state
        properties["runtime_state"] = session.restorable_state
        session.object_value = self._objects.contract.build(
            session.object_value.identity,
            session.object_value.system_tags,
            properties,
        )
        window_properties = dict(session.environment_window.properties)
        window_properties["window_state"] = (
            "active" if state == "active" else "closed" if state == "closed" else "inactive"
        )
        session.environment_window = self._objects.contract.build(
            session.environment_window.identity,
            session.environment_window.system_tags,
            window_properties,
        )
        session.state = state

    def _build_tool_window(
        self, session: ActiveWorkspaceSession, record: Mapping[str, JSONValue]
    ) -> CosmosObject:
        definition = self._objects.get(str(record["definitionObjectId"]), session.context)
        return self._objects.contract.build(
            ObjectIdentity(
                object_id=str(record["windowObjectId"]),
                display_name=definition.identity.display_name,
                description="Movable, resizable and closable Tool Window.",
                creator="cosmos.workspace-runtime",
                lifecycle_state="active",
                created_at=datetime.now(UTC),
            ),
            frozenset({"System", "ToolWindow", "Window"}),
            {
                "window_role": "tool",
                "parent_window_id": session.environment_window.identity.object_id,
                "bounds": record["bounds"],
                "window_state": record["state"],
                "focus_order": record["focusOrder"],
            },
        )


def _workspace_context(
    definition: CosmosObject,
    inherited: RuntimeContext,
    room_id: str,
    session_id: str,
) -> RuntimeContext:
    configuration = definition.properties["context_configuration"]
    if not isinstance(configuration, Mapping):
        configuration = {}
    source_project_id = str(definition.properties["source_project_id"])
    default_scopes = inherited.project_scope_ids or (source_project_id,)
    raw_scopes = configuration.get("projectScopeIds", default_scopes)
    scopes = tuple(str(value) for value in raw_scopes) if isinstance(raw_scopes, (list, tuple)) else ()
    default_focus = inherited.focused_project_id or source_project_id
    raw_focus = configuration.get("focusedProjectId", default_focus)
    focus = str(raw_focus) if raw_focus else None
    try:
        return replace(
            inherited,
            project_scope_ids=scopes,
            focused_project_id=focus,
            room_id=room_id,
            workspace_session_id=session_id,
            tool_instance_id=None,
        )
    except ValueError as error:
        raise RuntimeServiceError("validation_failed", str(error)) from error


def _empty_state() -> dict[str, JSONValue]:
    return {
        "tools": [],
        "selectedObjectId": None,
        "filters": {},
        "camera": {},
        "panels": {},
    }


def _validate_restorable_state(value: Mapping[str, object]) -> dict[str, JSONValue]:
    tools_value = value.get("tools", [])
    if not isinstance(tools_value, list):
        raise RuntimeServiceError("validation_failed", "Workspace Tool state must be an array.")
    tools: list[dict[str, JSONValue]] = []
    seen: set[str] = set()
    for raw in tools_value:
        if not isinstance(raw, Mapping):
            raise RuntimeServiceError("validation_failed", "Workspace Tool records must be objects.")
        if (
            any(
                not isinstance(raw.get(key), str) or not str(raw.get(key)).strip()
                for key in (
                    "instanceId",
                    "definitionObjectId",
                    "windowObjectId",
                )
            )
            or isinstance(raw.get("focusOrder"), bool)
            or not isinstance(raw.get("focusOrder"), int)
        ):
            raise RuntimeServiceError("validation_failed", "Workspace Tool records are incomplete.")
        instance_id = str(raw["instanceId"])
        if not instance_id or instance_id in seen:
            raise RuntimeServiceError("validation_failed", "Workspace Tool Instance IDs must be unique.")
        seen.add(instance_id)
        bounds = raw["bounds"]
        if not isinstance(bounds, Mapping):
            raise RuntimeServiceError("validation_failed", "Tool Window bounds must be an object.")
        runtime_state = raw.get("runtimeState", {})
        if not isinstance(runtime_state, Mapping):
            raise RuntimeServiceError("validation_failed", "Tool Runtime State must be an object.")
        tools.append(
            {
                "instanceId": instance_id,
                "definitionObjectId": str(raw["definitionObjectId"]),
                "windowObjectId": str(raw["windowObjectId"]),
                "bounds": _validate_bounds(bounds),
                "focusOrder": int(raw["focusOrder"]),
                "state": "active" if raw.get("state") == "active" else "background",
                "runtimeState": {str(key): item for key, item in runtime_state.items()},
            }
        )
    return {
        "tools": tools,
        "selectedObjectId": value.get("selectedObjectId")
        if isinstance(value.get("selectedObjectId"), str)
        else None,
        "filters": dict(value.get("filters", {})) if isinstance(value.get("filters"), Mapping) else {},
        "camera": dict(value.get("camera", {})) if isinstance(value.get("camera"), Mapping) else {},
        "panels": dict(value.get("panels", {})) if isinstance(value.get("panels"), Mapping) else {},
    }


def _validate_bounds(value: Mapping[str, object]) -> dict[str, JSONValue]:
    result: dict[str, JSONValue] = {}
    for key in ("x", "y", "width", "height"):
        item = value.get(key)
        if isinstance(item, bool) or not isinstance(item, (int, float)) or not math.isfinite(item):
            raise RuntimeServiceError("validation_failed", f"Tool Window {key} must be a finite number.")
        result[key] = float(item)
    if float(result["width"]) <= 0 or float(result["height"]) <= 0:
        raise RuntimeServiceError("validation_failed", "Tool Window size must be positive.")
    return result


def _state_tools(state: dict[str, JSONValue]) -> list[dict[str, JSONValue]]:
    tools = state.get("tools")
    if not isinstance(tools, list):
        raise RuntimeServiceError("validation_failed", "Workspace Tool state must be an array.")
    return tools  # type: ignore[return-value]


def _tool_record(session: ActiveWorkspaceSession, instance_id: str) -> dict[str, JSONValue]:
    try:
        return next(
            item for item in _state_tools(session.restorable_state) if item["instanceId"] == instance_id
        )
    except StopIteration as error:
        raise RuntimeServiceError(
            "tool_instance_not_found", f"Tool Instance is not contained by this Workspace: {instance_id}"
        ) from error


def _state_scope(definition_id: str) -> str:
    return f"workspace:{definition_id}"
