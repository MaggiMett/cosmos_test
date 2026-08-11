import pytest

from cosmos.runtime import ContextSnapshot, JobPriority, JobRequest, RuntimeContext


def test_job_request_captures_context_and_service_ownership() -> None:
    snapshot = ContextSnapshot.capture(RuntimeContext(project_scope_ids=("project-a",)), "user")

    request = JobRequest.create(
        "repository-analysis",
        priority=JobPriority.USER_INITIATED,
        context=snapshot,
        creating_service="project-service",
    )

    assert request.context is snapshot
    assert request.creating_service == "project-service"


def test_non_service_identity_cannot_create_job_request() -> None:
    with pytest.raises(ValueError, match="only by a Runtime Service"):
        JobRequest.create(
            "invalid",
            priority=JobPriority.BACKGROUND,
            context=ContextSnapshot.capture(RuntimeContext(), "user"),
            creating_service="extension.example",
        )
