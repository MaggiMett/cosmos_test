from __future__ import annotations

from collections.abc import Callable, Mapping
from concurrent.futures import Future, ThreadPoolExecutor
from datetime import UTC, datetime
from threading import Lock

from cosmos.domain.objects import JSONValue
from cosmos.persistence import JobRepository, PersistedJob
from cosmos.runtime import (
    ContextSnapshot,
    EventDispatcher,
    JobPriority,
    JobRequest,
    JobStatus,
    RuntimeContext,
    RuntimeEvent,
)
from cosmos.services.errors import RuntimeServiceError, require_permission

ProgressReporter = Callable[[float], None]
JobHandler = Callable[[Mapping[str, JSONValue], RuntimeContext, ProgressReporter], JSONValue]


class JobService:
    """Persistent asynchronous Job lifecycle and completed-fact Event owner."""

    def __init__(self, repository: JobRepository, events: EventDispatcher) -> None:
        self._repository = repository
        self._events = events
        self._handlers: dict[str, JobHandler] = {}
        self._executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="cosmos-job")
        self._futures: dict[str, Future[None]] = {}
        self._lock = Lock()

    def register_handler(self, category: str, handler: JobHandler) -> None:
        if category in self._handlers:
            raise ValueError(f"Job handler is already registered: {category}")
        self._handlers[category] = handler

    def initialize(self) -> None:
        recoverable = self._repository.list(
            (JobStatus.CREATED.value, JobStatus.QUEUED.value, JobStatus.RUNNING.value)
        )
        for job in recoverable:
            if job.resumable and job.category in self._handlers:
                self._repository.update(
                    job.job_id,
                    status=JobStatus.QUEUED.value,
                    progress=job.progress,
                    updated_at=datetime.now(UTC),
                )
                self._schedule(job.job_id)
            else:
                self._repository.update(
                    job.job_id,
                    status=JobStatus.FAILED.value,
                    progress=job.progress,
                    error="Interrupted Job requires an explicit retry.",
                    updated_at=datetime.now(UTC),
                )

    def create(
        self,
        category: str,
        payload: Mapping[str, JSONValue],
        context: RuntimeContext,
        *,
        creating_service: str,
        priority: JobPriority = JobPriority.BACKGROUND,
        resumable: bool = False,
    ) -> dict[str, JSONValue]:
        require_permission(context.permissions, "jobs.write")
        if category not in self._handlers:
            raise RuntimeServiceError("validation_failed", f"No Job handler is registered for {category}.")
        snapshot = ContextSnapshot.capture(context, "cosmos.local-owner")
        request = JobRequest.create(
            category,
            priority=priority,
            context=snapshot,
            creating_service=creating_service,
            resumable=resumable,
        )
        now = datetime.now(UTC)
        persisted = PersistedJob(
            job_id=request.job_id,
            category=category,
            priority=priority.value,
            status=JobStatus.QUEUED.value,
            context=_context_payload(context),
            creating_service=creating_service,
            payload={str(key): value for key, value in payload.items()},
            result=None,
            error=None,
            progress=0.0,
            resumable=resumable,
            created_at=now,
            updated_at=now,
        )
        self._repository.insert(persisted)
        self._publish("JobCreated", persisted, context)
        self._publish("JobQueued", persisted, context)
        self._schedule(request.job_id)
        return _job_payload(persisted)

    def get(self, job_id: str, context: RuntimeContext) -> dict[str, JSONValue]:
        require_permission(context.permissions, "jobs.read")
        value = self._repository.get(job_id)
        if value is None:
            raise RuntimeServiceError("job_not_found", f"Job not found: {job_id}")
        return _job_payload(value)

    def list(self, context: RuntimeContext) -> list[dict[str, JSONValue]]:
        require_permission(context.permissions, "jobs.read")
        return [_job_payload(value) for value in self._repository.list()]

    def cancel(self, job_id: str, context: RuntimeContext) -> dict[str, JSONValue]:
        require_permission(context.permissions, "jobs.write")
        value = self._repository.get(job_id)
        if value is None:
            raise RuntimeServiceError("job_not_found", f"Job not found: {job_id}")
        if value.status in {
            JobStatus.COMPLETED.value,
            JobStatus.FAILED.value,
            JobStatus.CANCELLED.value,
        }:
            return _job_payload(value)
        with self._lock:
            future = self._futures.get(job_id)
            if future is not None:
                future.cancel()
        self._repository.update(
            job_id,
            status=JobStatus.CANCELLED.value,
            progress=value.progress,
            updated_at=datetime.now(UTC),
        )
        cancelled = self._repository.get(job_id)
        assert cancelled is not None
        self._publish("JobCancelled", cancelled, context)
        return _job_payload(cancelled)

    def wait(self, job_id: str, timeout: float = 5.0) -> dict[str, JSONValue]:
        with self._lock:
            future = self._futures.get(job_id)
        if future is not None:
            future.result(timeout=timeout)
        value = self._repository.get(job_id)
        if value is None:
            raise RuntimeServiceError("job_not_found", f"Job not found: {job_id}")
        return _job_payload(value)

    def shutdown(self) -> None:
        self._executor.shutdown(wait=True, cancel_futures=False)

    def _schedule(self, job_id: str) -> None:
        future = self._executor.submit(self._run, job_id)
        with self._lock:
            self._futures[job_id] = future

    def _run(self, job_id: str) -> None:
        value = self._repository.get(job_id)
        if value is None or value.status == JobStatus.CANCELLED.value:
            return
        context = _context_from_payload(value.context)
        handler = self._handlers[value.category]
        self._repository.update(
            job_id,
            status=JobStatus.RUNNING.value,
            progress=max(value.progress, 0.01),
            updated_at=datetime.now(UTC),
        )
        running = self._repository.get(job_id)
        assert running is not None
        self._publish("JobStarted", running, context)

        def report(progress: float) -> None:
            current = self._repository.get(job_id)
            if current is None or current.status == JobStatus.CANCELLED.value:
                return
            normalized = min(0.99, max(current.progress, float(progress)))
            self._repository.update(
                job_id,
                status=JobStatus.RUNNING.value,
                progress=normalized,
                updated_at=datetime.now(UTC),
            )

        try:
            result = handler(value.payload, context, report)
            current = self._repository.get(job_id)
            if current is None or current.status == JobStatus.CANCELLED.value:
                return
            self._repository.update(
                job_id,
                status=JobStatus.COMPLETED.value,
                progress=1.0,
                result=result,
                updated_at=datetime.now(UTC),
            )
            completed = self._repository.get(job_id)
            assert completed is not None
            self._publish("JobCompleted", completed, context)
        except Exception as error:
            self._repository.update(
                job_id,
                status=JobStatus.FAILED.value,
                progress=running.progress,
                error=str(error),
                updated_at=datetime.now(UTC),
            )
            failed = self._repository.get(job_id)
            assert failed is not None
            self._publish("JobFailed", failed, context)
        finally:
            with self._lock:
                self._futures.pop(job_id, None)

    def _publish(self, event_type: str, value: PersistedJob, context: RuntimeContext) -> None:
        self._events.publish(
            RuntimeEvent.create(
                event_type,
                context=ContextSnapshot.capture(context, "cosmos.local-owner"),
                origin_service="JobService",
                affected_object_ids=(value.job_id,),
                metadata={"category": value.category, "status": value.status},
            )
        )


def _context_payload(context: RuntimeContext) -> dict[str, JSONValue]:
    return {
        "projectScopeIds": list(context.project_scope_ids),
        "focusedProjectId": context.focused_project_id,
        "roomId": context.room_id,
        "workspaceSessionId": context.workspace_session_id,
        "toolInstanceId": context.tool_instance_id,
        "objectId": context.object_id,
        "knowledgeId": context.knowledge_id,
        "systemTags": sorted(context.system_tags),
        "userTags": sorted(context.user_tags),
        "permissions": sorted(context.permissions),
    }


def _context_from_payload(value: Mapping[str, JSONValue]) -> RuntimeContext:
    return RuntimeContext(
        project_scope_ids=tuple(str(item) for item in value.get("projectScopeIds", [])),
        focused_project_id=_optional_string(value.get("focusedProjectId")),
        room_id=_optional_string(value.get("roomId")),
        workspace_session_id=_optional_string(value.get("workspaceSessionId")),
        tool_instance_id=_optional_string(value.get("toolInstanceId")),
        object_id=_optional_string(value.get("objectId")),
        knowledge_id=_optional_string(value.get("knowledgeId")),
        system_tags=frozenset(str(item) for item in value.get("systemTags", [])),
        user_tags=frozenset(str(item) for item in value.get("userTags", [])),
        permissions=frozenset(str(item) for item in value.get("permissions", [])),
    )


def _optional_string(value: JSONValue) -> str | None:
    return value if isinstance(value, str) and value else None


def _job_payload(value: PersistedJob) -> dict[str, JSONValue]:
    return {
        "jobId": value.job_id,
        "category": value.category,
        "priority": value.priority,
        "status": value.status,
        "progress": value.progress,
        "result": value.result,
        "error": value.error,
        "resumable": value.resumable,
        "createdAt": value.created_at.isoformat(),
        "updatedAt": value.updated_at.isoformat(),
    }
