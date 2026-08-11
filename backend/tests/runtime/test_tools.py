from cosmos.runtime import RuntimeContext, ToolLifecycleState, ToolRuntime
from cosmos.services import create_version_one_object_contract


def test_tool_runtime_owns_isolated_workspace_instance_lifecycles() -> None:
    ids = iter(("one", "two"))
    runtime = ToolRuntime(create_version_one_object_contract(), lambda: next(ids))
    context = RuntimeContext(workspace_session_id="workspace-a")

    first = runtime.create("cosmos.tool.files", context, workspace_session_id="workspace-a")
    second = runtime.create("cosmos.tool.archive", context, workspace_session_id="workspace-a")

    assert first.object_id == "cosmos.tool-instance.one"
    assert runtime.get(first.object_id).state is ToolLifecycleState.BACKGROUND
    assert second.state is ToolLifecycleState.ACTIVE
    assert second.execution_mode == "workspace"

    updated = runtime.update_state(first.object_id, {"selection": "object-a"})
    assert updated.runtime_state == {"selection": "object-a"}
    assert runtime.close(second.object_id).state is ToolLifecycleState.DESTROYED
    assert [item.object_id for item in runtime.close_workspace("workspace-a")] == [first.object_id]
    assert runtime.list() == ()


def test_tool_runtime_supports_direct_mode_without_a_workspace() -> None:
    runtime = ToolRuntime(create_version_one_object_contract(), lambda: "direct")

    instance = runtime.create("cosmos.tool.capture", RuntimeContext())

    assert instance.execution_mode == "direct"
    assert instance.workspace_session_id is None
