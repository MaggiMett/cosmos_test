from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from uuid import uuid4

from cosmos.runtime.context import ContextSnapshot


class JobStatus(StrEnum):
    CREATED = "created"
    QUEUED = "queued"
    SCHEDULED = "scheduled"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobPriority(StrEnum):
    USER_INITIATED = "user_initiated"
    INTERACTIVE = "interactive"
    BACKGROUND = "background"
    MAINTENANCE = "maintenance"


@dataclass(frozen=True, slots=True)
class JobRequest:
    job_id: str
    category: str
    priority: JobPriority
    context: ContextSnapshot
    creating_service: str
    resumable: bool = False

    @classmethod
    def create(
        cls,
        category: str,
        *,
        priority: JobPriority,
        context: ContextSnapshot,
        creating_service: str,
        resumable: bool = False,
    ) -> JobRequest:
        if not creating_service.endswith("-service"):
            raise ValueError("Jobs may be created only by a Runtime Service identity.")
        return cls(
            job_id=str(uuid4()),
            category=category,
            priority=priority,
            context=context,
            creating_service=creating_service,
            resumable=resumable,
        )
