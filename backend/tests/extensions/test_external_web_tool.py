from pathlib import Path

from cosmos.bootstrap import CosmosRuntime, RuntimeSettings
from cosmos.runtime import RuntimeContext


REPOSITORY_EXTENSIONS = Path(__file__).resolve().parents[3] / "extensions"


def test_repository_web_extension_loads_through_complete_external_tool_pipeline(tmp_path: Path) -> None:
    runtime = CosmosRuntime.build(
        RuntimeSettings(
            runtime_path=tmp_path / "Runtime",
            extensions_path=REPOSITORY_EXTENSIONS,
            port=0,
        )
    )
    runtime.initialize()
    context = RuntimeContext(
        permissions=frozenset(
            {
                "objects.read",
                "tools.read",
                "tools.write",
                "runtime_state.read",
                "workspaces.write",
            }
        )
    )

    definitions = runtime.tools.definitions(
        context,
        required_capabilities=frozenset({"example", "web"}),
    )

    assert [definition["objectId"] for definition in definitions] == ["cosmos.example.web-tool"]
    definition = definitions[0]
    assert definition["runtimeKind"] == "web"
    assert definition["runtimeConfiguration"] == {
        "sandbox": ["forms", "modals", "popups", "same-origin", "scripts"]
    }
    assert definition["entryPoint"] == "https://example.com/"

    workspace = runtime.workspaces.open("cosmos.workspace.creation", "cosmos.room.main", context)
    instance = runtime.tools.open_workspace_tool(
        "cosmos.example.web-tool",
        str(workspace["objectId"]),
        context,
    )

    assert instance.definition_object_id == "cosmos.example.web-tool"
    assert instance.workspace_session_id == workspace["objectId"]
