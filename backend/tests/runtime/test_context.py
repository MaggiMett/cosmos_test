import pytest

from cosmos.runtime import RuntimeContext


def test_context_keeps_multiple_project_scopes_and_optional_focus() -> None:
    context = RuntimeContext(project_scope_ids=("project-a", "project-b"), focused_project_id="project-b")

    assert context.project_scope_ids == ("project-a", "project-b")
    assert context.focused_project_id == "project-b"


def test_context_does_not_allow_focus_to_replace_assigned_scope() -> None:
    with pytest.raises(ValueError, match="assigned Project scopes"):
        RuntimeContext(project_scope_ids=("project-a",), focused_project_id="project-b")
