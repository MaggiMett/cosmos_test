from datetime import UTC, datetime
from pathlib import Path

from cosmos.bootstrap import CosmosRuntime
from cosmos.config import RuntimeSettings
from cosmos.domain import ObjectIdentity
from cosmos.runtime import RegistryEntry, RuntimeContext
from cosmos.services import (
    PREPARED_AREAS,
    CreateNotificationCommand,
    CreateObjectCommand,
    CreateProjectCommand,
    RuntimeServiceError,
)


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
                "tags.read",
                "tags.write",
                "notifications.read",
                "notifications.write",
            }
        )
    )


def test_startup_creates_only_documented_system_projects_and_physical_prepared_structures(
    tmp_path: Path,
) -> None:
    runtime = CosmosRuntime.build(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))
    runtime.initialize()

    projects = runtime.objects.list(owner_context(), system_tag="Project")

    assert [project.identity.display_name for project in projects] == [
        "Knowledge Workspace",
        "Creation Workspace",
        "Graphics Workspace",
    ]
    assert all(project.system_tags == {"Node", "Project", "ProjectRoot", "System"} for project in projects)
    for project in projects:
        prepared = runtime.projects.prepared_structures(project.identity.object_id, owner_context())
        assert set(prepared) == set(PREPARED_AREAS)
        assert all(path.is_dir() for path in prepared.values())

    user_project = runtime.projects.create(
        CreateProjectCommand(
            display_name="A New World",
            description="A prepared user Project.",
            vision="Create a coherent new world.",
            color="#34d399",
            x=1400.0,
            y=220.0,
        ),
        owner_context(),
    )
    assert user_project.system_tags == {"Node", "Project", "ProjectRoot"}
    assert all(
        path.is_dir()
        for path in runtime.projects.prepared_structures(
            user_project.identity.object_id, owner_context()
        ).values()
    )


def test_nodes_relationships_camera_and_companion_share_runtime_contracts(tmp_path: Path) -> None:
    runtime = CosmosRuntime.build(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))
    runtime.initialize()
    context = owner_context()
    project = runtime.objects.list(context, system_tag="Project")[0]
    child = runtime.objects.create(
        CreateObjectCommand(
            identity=ObjectIdentity(
                object_id="cosmos.object.test-node",
                display_name="Test Node",
                description="A service integration node.",
                creator="cosmos.test",
                lifecycle_state="active",
                created_at=datetime.now(UTC),
            ),
            system_tags=frozenset({"Node"}),
            properties={
                "position_x": -540.0,
                "position_y": 30.0,
                "parent_object_id": project.identity.object_id,
                "hierarchy_level": "Object",
                "skin": "Star",
            },
            primary_project_id=project.identity.object_id,
        ),
        context,
    )
    relationship = runtime.relationships.create_related(
        project.identity.object_id,
        project.identity.object_id,
        child.identity.object_id,
        context,
    )

    moved = runtime.cosmos_map.move_node(child.identity.object_id, -510.0, 60.0, context)
    camera = runtime.cosmos_map.update_camera(-720.0, -80.0, 1.0, context)
    snapshot = runtime.cosmos_map.snapshot(context)

    assert moved.properties["position_x"] == -510.0
    assert camera == {"x": -720.0, "y": -80.0, "zoom": 1.0}
    assert snapshot["focusedProjectId"] == project.identity.object_id
    assert {connection["provenance"] for connection in snapshot["connections"]} == {
        "structural",
        "semantic",
    }
    assert any(
        connection["relationshipId"] == relationship.relationship_id for connection in snapshot["connections"]
    )
    assert snapshot["companion"]["systemTags"] == ["Companion", "Entity", "System"]
    assert runtime.companion.reply(
        "Where am I?",
        RuntimeContext(
            project_scope_ids=(project.identity.object_id,),
            focused_project_id=project.identity.object_id,
        ),
    ).message.startswith("You are focused")


def test_base_uses_tagged_rooms_slots_workspaces_cockpit_companion_and_pet(tmp_path: Path) -> None:
    runtime = CosmosRuntime.build(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))
    runtime.initialize()

    snapshot = runtime.base.snapshot(owner_context())

    assert snapshot["base"]["systemTags"] == ["Base", "System"]
    assert [(room["slug"], len(room["workspaceSlots"])) for room in snapshot["rooms"]] == [
        ("main", 2),
        ("workshop", 4),
    ]
    assert all(slot["workspace"] is not None for slot in snapshot["rooms"][0]["workspaceSlots"])
    assert all(slot["workspace"] is None for slot in snapshot["rooms"][1]["workspaceSlots"])
    assert [workspace["displayName"] for workspace in snapshot["unassignedWorkspaces"]] == [
        "Graphics Workspace"
    ]
    assert snapshot["cockpit"]["roomId"] == "cosmos.room.main"
    assert snapshot["door"]["roomAId"] == "cosmos.room.main"
    assert snapshot["door"]["roomBId"] == "cosmos.room.workshop"
    assert snapshot["companion"]["objectId"] == "cosmos.entity.companion.default"
    assert snapshot["pet"]["systemTags"] == ["Entity", "Pet", "System"]


def test_workspace_open_resolves_capability_tools_and_materializes_default_layout(tmp_path: Path) -> None:
    runtime = CosmosRuntime.build(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))
    runtime.initialize()
    context = owner_context()
    runtime.objects.create(
        CreateObjectCommand(
            identity=ObjectIdentity(
                object_id="cosmos.workspace.declarative-test",
                display_name="Declarative Test Workspace",
                description="Test-only declarative Workspace.",
                creator="cosmos.tests",
                lifecycle_state="active",
                created_at=datetime.now(UTC),
            ),
            system_tags=frozenset({"Workspace"}),
            properties={
                "icon": "Test",
                "overlay": "",
                "default_layout": {
                    "tools": [
                        {
                            "toolId": "cosmos.tool.files",
                            "bounds": {"x": 20, "y": 30, "width": 500, "height": 400},
                            "state": "active",
                        }
                    ]
                },
                "context_configuration": {},
                "assigned_tool_ids": ["cosmos.tool.archive"],
                "tool_requirements": [{"capabilities": ["search", "preview"]}],
                "theme_override": "",
                "source_project_id": "cosmos.project.system.knowledge",
            },
        ),
        context,
    )

    opened = runtime.workspaces.open("cosmos.workspace.declarative-test", "cosmos.room.main", context)

    assert opened["resolvedToolIds"] == ["cosmos.tool.archive", "cosmos.tool.files"]
    default_tool = opened["restorableState"]["tools"][0]
    assert default_tool["definitionObjectId"] == "cosmos.tool.files"
    assert default_tool["bounds"] == {"x": 20.0, "y": 30.0, "width": 500.0, "height": 400.0}


def test_workspace_sessions_restore_contained_tool_instances_and_layout(tmp_path: Path) -> None:
    runtime = CosmosRuntime.build(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))
    runtime.initialize()
    context = owner_context()
    tool = runtime.objects.create(
        CreateObjectCommand(
            identity=ObjectIdentity(
                object_id="cosmos.tool.test",
                display_name="Test Tool",
                description="A test-only Tool definition.",
                creator="cosmos.tests",
                lifecycle_state="active",
                created_at=datetime.now(UTC),
            ),
            system_tags=frozenset({"Tool"}),
            properties={
                "category": "UserTool",
                "component_id": "cosmos.tool.test",
                "version": "1.0.0",
                "entry_point": "tests:tool",
                "icon": "Test",
                "capabilities": [],
                "permissions": [],
                "minimum_window_size": {"width": 320, "height": 240},
            },
        ),
        context,
    )
    runtime.registry.register(
        RegistryEntry(
            component_id=tool.identity.object_id,
            display_name=tool.identity.display_name,
            category="tool",
            version="1.0.0",
            runtime_api_version="1",
            source_extension_id="cosmos.tests",
            entry_point="tests:tool",
            object_id=tool.identity.object_id,
        )
    )
    runtime.registry.activate(tool.identity.object_id)

    opened = runtime.workspaces.open("cosmos.workspace.knowledge", "cosmos.room.main", context)
    record = runtime.workspaces.open_tool(
        str(opened["objectId"]),
        tool.identity.object_id,
        {"x": 120, "y": 90, "width": 520, "height": 420},
        context,
    )
    runtime.workspaces.update_tool(
        str(opened["objectId"]),
        str(record["instanceId"]),
        {"bounds": {"x": 180, "y": 110, "width": 560, "height": 440}, "focusOrder": 3},
        context,
    )
    runtime.workspaces.close(str(opened["objectId"]), context)

    restored = runtime.workspaces.open("cosmos.workspace.knowledge", "cosmos.room.main", context)
    restored_tool = restored["restorableState"]["tools"][0]

    assert restored["systemTags"] == ["System", "WorkspaceSession"]
    assert restored["environmentWindow"]["role"] == "workspace_environment"
    assert restored_tool["instanceId"] == record["instanceId"]
    assert restored_tool["bounds"] == {"x": 180.0, "y": 110.0, "width": 560.0, "height": 440.0}


def test_object_interaction_tags_selection_collisions_and_notifications_use_runtime_services(
    tmp_path: Path,
) -> None:
    runtime = CosmosRuntime.build(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))
    runtime.initialize()
    context = owner_context()
    projects = runtime.objects.list(context, system_tag="Project")
    selected = projects[0]

    updated = runtime.object_interactions.update(
        selected.identity.object_id,
        {
            "displayName": "Knowledge Constellation",
            "description": "An edited Project Object.",
            "userTags": ["Reference", "Long term"],
            "properties": {
                "vision": "Keep verified knowledge connected.",
                "project_color": "#38bdf8",
                "skin": "Star",
            },
        },
        context,
    )
    runtime.cosmos_map.select(selected.identity.object_id, context)
    notification = runtime.notifications.create(
        CreateNotificationCommand(
            title="Project updated",
            message="The Project Object was saved.",
            category="Projects",
            source_object_id=selected.identity.object_id,
            destination_object_id=selected.identity.object_id,
            primary_project_id=selected.identity.object_id,
        ),
        context,
    )

    assert updated["displayName"] == "Knowledge Constellation"
    assert updated["userTags"] == ["Long term", "Reference"]
    assert {action["id"] for action in updated["actions"]} == {
        "open",
        "appearance",
        "connections",
        "configuration",
    }
    assert runtime.cosmos_map.snapshot(context)["selectedObjectId"] == selected.identity.object_id
    assert runtime.companion.get_default(context).properties["notification_available"] is True
    assert runtime.notifications.list(context)[0]["destinationObjectId"] == selected.identity.object_id

    runtime.notifications.mark_read(notification.identity.object_id, True, context)
    assert runtime.companion.get_default(context).properties["notification_available"] is False

    try:
        runtime.object_interactions.update(
            selected.identity.object_id,
            {
                "displayName": "Must Not Persist",
                "properties": {"vision": 42},
            },
            context,
        )
    except RuntimeServiceError as error:
        assert error.code == "validation_failed"
    else:
        raise AssertionError("Invalid Object Property values must be rejected.")
    assert (
        runtime.objects.get(selected.identity.object_id, context).identity.display_name
        == "Knowledge Constellation"
    )

    try:
        runtime.cosmos_map.move_node(
            selected.identity.object_id,
            float(projects[1].properties["position_x"]),
            float(projects[1].properties["position_y"]),
            context,
        )
    except RuntimeServiceError as error:
        assert error.code == "node_position_conflict"
    else:
        raise AssertionError("Overlapping Nodes must be rejected by CosmosMapService.")
