from __future__ import annotations

from collections.abc import Mapping
from dataclasses import replace
from datetime import UTC, datetime
from uuid import uuid4

from cosmos.domain import CosmosObject, ObjectIdentity
from cosmos.domain.objects import JSONValue
from cosmos.runtime import (
    ProviderDefinition,
    ProviderInvocation,
    ProviderRequest,
    ProviderRuntime,
    RuntimeContext,
)
from cosmos.services.errors import RuntimeServiceError, require_permission
from cosmos.services.job_service import JobService, ProgressReporter
from cosmos.services.object_service import CreateObjectCommand, ObjectService
from cosmos.services.serialization import object_payload

JOURNEYMAN_JOB = "Journeyman Execution"


class _JourneymanCompiler:
    def compile(self, request: ProviderRequest, provider: ProviderDefinition) -> ProviderInvocation:
        return ProviderInvocation(
            payload={
                "objective": request.objective,
                "context": dict(request.authorized_context_package),
                "preferences": dict(request.preferences),
            },
            timeout_seconds=request.timeout_seconds,
        )


class JourneymanService:
    """Independent planning and development-assistance Tool service."""

    def __init__(
        self,
        objects: ObjectService,
        providers: ProviderRuntime,
        jobs: JobService,
    ) -> None:
        self._objects = objects
        self._providers = providers
        self._jobs = jobs
        self._compiler = _JourneymanCompiler()
        jobs.register_handler(JOURNEYMAN_JOB, self._execute)

    def create_task(self, objective: str, context: RuntimeContext) -> dict[str, JSONValue]:
        require_permission(context.permissions, "journeyman.write")
        if not objective.strip():
            raise RuntimeServiceError("validation_failed", "Journeyman objective must not be empty.")
        task_id = f"cosmos.journeyman-task.{uuid4()}"
        task_context = _context_payload(context)
        plan: list[JSONValue] = [
            {"step": "Understand the objective and authorized context", "state": "ready"},
            {"step": "Plan the development assistance", "state": "ready"},
            {"step": "Execute through an available Provider", "state": "pending"},
            {"step": "Validate and report the result", "state": "pending"},
        ]
        now = datetime.now(UTC)
        request = _provider_request(objective.strip(), task_context)
        try:
            adapter = self._providers.select(request)
            state = "queued"
            provider_id = adapter.definition.provider_id
            events: list[JSONValue] = [
                _event("PlanCreated", "A development-assistance plan is ready."),
                _event("ProviderSelected", f"Selected {adapter.definition.display_name}."),
            ]
        except LookupError:
            state = "awaiting_provider"
            provider_id = ""
            events = [
                _event("PlanCreated", "A development-assistance plan is ready."),
                _event(
                    "ProviderUnavailable",
                    "No active Provider with the development capability is available.",
                ),
            ]
        value = self._objects.create(
            CreateObjectCommand(
                identity=ObjectIdentity(
                    object_id=task_id,
                    display_name=objective.strip()[:100],
                    description="Journeyman planning and execution task.",
                    creator="cosmos.journeyman",
                    lifecycle_state="active",
                    created_at=now,
                ),
                system_tags=frozenset({"JourneymanTask", "System"}),
                properties={
                    "objective": objective.strip(),
                    "task_state": state,
                    "plan": plan,
                    "task_context": task_context,
                    "events": events,
                    "result": {},
                    "job_id": "",
                    "provider_id": provider_id,
                },
                primary_project_id=context.focused_project_id,
            ),
            context,
        )
        if state == "queued":
            job = self._jobs.create(
                JOURNEYMAN_JOB,
                {"taskId": task_id},
                replace(
                    context,
                    object_id=task_id,
                    system_tags=context.system_tags | value.system_tags,
                    user_tags=context.user_tags | value.user_tags,
                ),
                creating_service="journeyman-service",
                resumable=False,
            )
            value = self._objects.update_properties(
                task_id,
                {"job_id": str(job["jobId"])},
                context,
            )
        return _payload(value)

    def list(self, context: RuntimeContext) -> list[dict[str, JSONValue]]:
        require_permission(context.permissions, "journeyman.read")
        return [
            _payload(value)
            for value in self._objects.list(context, system_tag="JourneymanTask")
            if _visible(value, context)
        ]

    def get(self, task_id: str, context: RuntimeContext) -> dict[str, JSONValue]:
        require_permission(context.permissions, "journeyman.read")
        return _payload(self._task(task_id, context))

    def cancel(self, task_id: str, context: RuntimeContext) -> dict[str, JSONValue]:
        require_permission(context.permissions, "journeyman.write")
        value = self._task(task_id, context)
        job_id = str(value.properties["job_id"])
        if job_id:
            self._jobs.cancel(job_id, context)
        events = list(value.properties["events"])
        events.append(_event("TaskCancelled", "The user cancelled this task."))
        return _payload(
            self._objects.update_properties(
                task_id,
                {"task_state": "cancelled", "events": events},
                context,
            )
        )

    def _task(self, task_id: str, context: RuntimeContext) -> CosmosObject:
        value = self._objects.get(task_id, context)
        if "JourneymanTask" not in value.system_tags or not _visible(value, context):
            raise RuntimeServiceError("journeyman_task_not_found", f"Journeyman task not found: {task_id}")
        return value

    def _execute(
        self,
        payload: Mapping[str, JSONValue],
        context: RuntimeContext,
        report: ProgressReporter,
    ) -> JSONValue:
        task_id = str(payload["taskId"])
        value = self._objects.repository.get(task_id)
        if value is None:
            raise RuntimeServiceError("journeyman_task_not_found", f"Journeyman task not found: {task_id}")
        events = list(value.properties["events"])
        events.append(_event("ExecutionStarted", "Provider execution started."))
        self._objects.update_properties(
            task_id,
            {"task_state": "executing", "events": events},
            context,
        )
        report(0.2)
        try:
            request = _provider_request(str(value.properties["objective"]), value.properties["task_context"])
            result = self._providers.execute(request, self._compiler)
            report(0.8)
            current = self._objects.repository.get(task_id)
            assert current is not None
            completed_events = list(current.properties["events"])
            completed_events.append(_event("ExecutionCompleted", "Provider execution completed."))
            result_payload: dict[str, JSONValue] = {
                "output": result.output,
                "metadata": dict(result.metadata),
            }
            self._objects.update_properties(
                task_id,
                {
                    "task_state": "completed",
                    "events": completed_events,
                    "result": result_payload,
                    "provider_id": result.provider_id,
                },
                context,
            )
            return {"taskId": task_id, "providerId": result.provider_id, "result": result_payload}
        except Exception as error:
            current = self._objects.repository.get(task_id)
            if current is not None:
                failed_events = list(current.properties["events"])
                failed_events.append(_event("ExecutionFailed", str(error)))
                self._objects.update_properties(
                    task_id,
                    {"task_state": "failed", "events": failed_events},
                    context,
                )
            raise


def _provider_request(objective: str, context: JSONValue) -> ProviderRequest:
    package = context if isinstance(context, Mapping) else {}
    return ProviderRequest(
        objective=objective,
        required_capabilities=frozenset({"development"}),
        authorized_context_package=package,
        preferences={},
        privacy_constraints=frozenset({"project-scoped"}),
    )


def _context_payload(context: RuntimeContext) -> dict[str, JSONValue]:
    return {
        "projectScopeIds": list(context.project_scope_ids),
        "focusedProjectId": context.focused_project_id,
        "roomId": context.room_id,
        "workspaceSessionId": context.workspace_session_id,
    }


def _event(event_type: str, message: str) -> dict[str, JSONValue]:
    return {"type": event_type, "message": message, "timestamp": datetime.now(UTC).isoformat()}


def _visible(value: CosmosObject, context: RuntimeContext) -> bool:
    task_context = value.properties["task_context"]
    projects = (
        {str(item) for item in task_context.get("projectScopeIds", [])}
        if isinstance(task_context, dict)
        else set()
    )
    return not context.project_scope_ids or bool(projects.intersection(context.project_scope_ids))


def _payload(value: CosmosObject) -> dict[str, JSONValue]:
    return {**object_payload(value), **dict(value.properties)}
