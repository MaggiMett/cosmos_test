from pathlib import Path

import pytest

from cosmos.bootstrap import CosmosRuntime
from cosmos.config import RuntimeSettings
from cosmos.runtime import RuntimeContext
from cosmos.services import RuntimeServiceError


def owner_context() -> RuntimeContext:
    return RuntimeContext(
        permissions=frozenset(
            {
                "objects.read",
                "objects.write",
                "projects.read",
                "projects.write",
                "relationships.read",
                "relationships.write",
                "runtime_state.read",
                "runtime_state.write",
                "tools.read",
                "tools.write",
                "workspaces.read",
                "workspaces.write",
                "resources.read",
                "resources.write",
                "knowledge.read",
                "knowledge.write",
                "drafts.read",
                "drafts.write",
                "reviews.read",
                "reviews.write",
                "jobs.read",
                "jobs.write",
                "journeyman.read",
                "journeyman.write",
            }
        )
    )


@pytest.fixture
def active_runtime(tmp_path: Path):
    runtime = CosmosRuntime.build(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))
    runtime.initialize()
    try:
        yield runtime
    finally:
        runtime.shutdown()


def workspace_context(runtime: CosmosRuntime) -> RuntimeContext:
    owner = owner_context()
    session = runtime.workspaces.open("cosmos.workspace.creation", "cosmos.room.main", owner)
    return runtime.workspaces.context(str(session["objectId"]), owner)


def test_core_tool_catalog_and_workspace_assignments(active_runtime: CosmosRuntime) -> None:
    definitions = active_runtime.tools.definitions(owner_context())
    creation = active_runtime.workspaces.definition("cosmos.workspace.creation", owner_context())

    assert {item["componentKey"] for item in definitions} == {
        "archive",
        "capture",
        "files",
        "journeyman",
        "review",
    }
    assert "cosmos.tool.journeyman" in creation["assignedToolIds"]
    assert all(item["minimumSize"]["width"] > 0 for item in definitions)


def test_files_are_project_scoped_and_conflict_safe(active_runtime: CosmosRuntime) -> None:
    context = workspace_context(active_runtime)

    created = active_runtime.resources.create("notes.md", "first", context)
    updated = active_runtime.resources.edit(
        "notes.md", "second", str(created["metadata"]["contentHash"]), context
    )
    moved = active_runtime.resources.move("notes.md", "renamed.md", context)

    assert updated["content"] == "second"
    assert moved["metadata"]["path"] == "renamed.md"
    with pytest.raises(RuntimeServiceError, match="remain relative"):
        active_runtime.resources.read("../outside.txt", context)
    with pytest.raises(RuntimeServiceError, match="changed after it was opened"):
        active_runtime.resources.edit("renamed.md", "third", "stale", context)
    assert active_runtime.resources.delete("renamed.md", context)["deleted"] is True


def test_capture_recovers_drafts_preserves_source_and_versions_knowledge(
    active_runtime: CosmosRuntime,
) -> None:
    context = workspace_context(active_runtime)
    draft = active_runtime.knowledge.save_draft(
        "draft-one", mode="rant", content="Original thought", attachments=[], context=context
    )
    assert active_runtime.knowledge.list_drafts(context) == [draft]

    submission = active_runtime.knowledge.submit_capture(
        mode="rant",
        content="Original thought\nwith durable detail",
        attachments=[],
        context=context,
        draft_id="draft-one",
    )
    job = active_runtime.jobs.wait(str(submission["job"]["jobId"]))
    knowledge_id = str(submission["knowledge"]["objectId"])
    processed = active_runtime.knowledge.get(knowledge_id, context)
    edited = active_runtime.knowledge.edit(
        knowledge_id,
        title="Refined thought",
        content="Edited content",
        summary="Inline Archive edit",
        context=context,
    )

    assert job["status"] == "completed"
    assert processed["original_source"]["content"].startswith("Original thought")
    assert processed["processed_status"] == "processed"
    assert len(processed["versions"]) == 2
    assert edited["current_version"] == 3
    assert len(edited["versions"]) == 3
    assert active_runtime.knowledge.list_drafts(context) == []


def test_review_decisions_and_journeyman_tasks_remain_independent(
    active_runtime: CosmosRuntime,
) -> None:
    context = workspace_context(active_runtime)
    project_id = context.focused_project_id
    assert project_id is not None
    review = active_runtime.reviews.create_candidate(
        title="Confirm architecture",
        summary="One mature decision is ready.",
        reason="User authority is required.",
        category="ArchitectureDecision",
        source_tool="Journeyman",
        affected_project_ids=[project_id],
        affected_object_ids=[],
        related_knowledge_ids=[],
        evidence=[{"source": "verification"}],
        confidence=0.9,
        available_actions=["accept", "reject", "postpone"],
        context=context,
    )
    decided = active_runtime.reviews.decide(
        str(review["objectId"]), action="accept", note="Approved", context=context
    )
    task = active_runtime.journeyman.create_task("Plan the next implementation slice", context)

    assert decided["review_state"] == "accepted"
    assert decided["decision_history"][0]["note"] == "Approved"
    assert task["task_state"] == "awaiting_provider"
    assert task["provider_id"] == ""
    assert "JourneymanTask" in task["systemTags"]
    assert "Companion" not in task["systemTags"]
