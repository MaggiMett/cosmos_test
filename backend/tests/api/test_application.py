from pathlib import Path

from starlette.testclient import TestClient

from cosmos.api import create_app
from cosmos.config import RuntimeSettings


def test_foundation_api_health_and_readiness(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)

    with TestClient(create_app(settings)) as client:
        health = client.get("/health")
        readiness = client.get("/ready")

    assert health.status_code == 200
    assert health.json() == {"service": "cosmos", "status": "ok", "version": "1.0.0"}
    assert readiness.status_code == 200
    assert readiness.json() == {"service": "cosmos", "status": "ready"}
    assert settings.database_path.exists()


def test_theme_runtime_state_uses_existing_persistence_and_survives_restart(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    state = {
        "schemaVersion": 1,
        "activeThemeId": "cosmos.theme.aurora",
        "lastKnownGoodThemeId": "cosmos.theme.cosmos",
    }

    with TestClient(create_app(settings)) as client:
        empty = client.get("/runtime-state/theme")
        saved = client.put("/runtime-state/theme", json={**state, "tokens": {"unsafe": "value"}})

    with TestClient(create_app(settings)) as restarted_client:
        restored = restarted_client.get("/runtime-state/theme")

    assert empty.status_code == 200
    assert empty.json() == {
        "schemaVersion": 1,
        "activeThemeId": None,
        "lastKnownGoodThemeId": None,
    }
    assert saved.status_code == 200
    assert saved.json() == state
    assert restored.status_code == 200
    assert restored.json() == state
    assert "tokens" not in restored.json()


def test_theme_runtime_state_rejects_incomplete_activation_records(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)

    with TestClient(create_app(settings)) as client:
        response = client.put(
            "/runtime-state/theme",
            json={
                "schemaVersion": 1,
                "activeThemeId": "cosmos.theme.aurora",
                "lastKnownGoodThemeId": None,
            },
        )
        restored = client.get("/runtime-state/theme")

    assert response.status_code == 422
    assert response.json()["code"] == "validation_failed"
    assert restored.json()["activeThemeId"] is None


def test_cosmos_map_api_restores_state_and_handles_companion_without_ai(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)

    with TestClient(create_app(settings)) as client:
        initial = client.get("/cosmos/map")
        camera = client.put("/cosmos/camera", json={"x": 0, "y": 140, "zoom": 1})
        focused = client.get("/cosmos/map")
        companion = client.post("/companion/messages", json={"message": "Hello"})
        invalid = client.put("/cosmos/camera", json={"x": 0, "y": 0, "zoom": 9})

    assert initial.status_code == 200
    assert len(initial.json()["projects"]) == 3
    assert camera.json() == {"x": 0.0, "y": 140.0, "zoom": 1.0}
    assert focused.json()["focusedProjectId"] == "cosmos.project.system.creation"
    assert companion.json() == {
        "message": "Hello. I'm here with you in Cosmos.",
        "mode": "deterministic",
    }
    assert invalid.status_code == 422
    assert invalid.json()["code"] == "validation_failed"


def test_base_api_exposes_main_room_and_workshop_without_parallel_models(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)

    with TestClient(create_app(settings)) as client:
        response = client.get("/base")

    assert response.status_code == 200
    assert response.json()["base"]["objectId"] == "cosmos.base.default"
    assert [room["slug"] for room in response.json()["rooms"]] == ["main", "workshop"]


def test_workspace_api_opens_persists_and_closes_temporary_sessions(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)

    with TestClient(create_app(settings)) as client:
        definition = client.get("/workspaces/cosmos.workspace.knowledge")
        opened = client.post(
            "/workspaces/cosmos.workspace.knowledge/sessions",
            json={"roomId": "cosmos.room.main"},
        )
        session_id = opened.json()["objectId"]
        saved = client.put(
            f"/workspace-sessions/{session_id}",
            json={
                "restorableState": {
                    "tools": [],
                    "selectedObjectId": None,
                    "filters": {"scope": "all"},
                    "camera": {},
                    "panels": {},
                }
            },
        )
        closed = client.delete(f"/workspace-sessions/{session_id}")
        missing = client.get(f"/workspace-sessions/{session_id}")

    assert definition.status_code == 200
    assert definition.json()["displayName"] == "Knowledge Workspace"
    assert opened.status_code == 201
    assert opened.json()["state"] == "active"
    assert saved.json()["restorableState"]["filters"] == {"scope": "all"}
    assert closed.json()["state"] == "closed"
    assert missing.status_code == 404


def test_core_tool_api_is_session_scoped_and_journeyman_is_its_own_tool(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)

    with TestClient(create_app(settings)) as client:
        tools = client.get("/tools")
        opened = client.post(
            "/workspaces/cosmos.workspace.creation/sessions",
            json={"roomId": "cosmos.room.main"},
        )
        session_id = opened.json()["objectId"]
        created = client.post(
            f"/workspace-sessions/{session_id}/files",
            json={"path": "sprint.md", "content": "Sprint 5"},
        )
        read = client.get(f"/workspace-sessions/{session_id}/files/content", params={"path": "sprint.md"})
        capture = client.post(
            f"/workspace-sessions/{session_id}/capture/submissions",
            json={"mode": "quick", "content": "API Knowledge", "attachments": []},
        )
        journey = client.post(
            f"/workspace-sessions/{session_id}/journeyman/tasks",
            json={"objective": "Plan a verified change"},
        )

    definitions = {item["componentKey"]: item for item in tools.json()}
    assert tools.status_code == 200
    assert definitions["journeyman"]["objectId"] == "cosmos.tool.journeyman"
    assert definitions["journeyman"]["category"] == "SystemTool"
    assert created.status_code == 201
    assert read.json()["content"] == "Sprint 5"
    assert capture.status_code == 201
    assert journey.status_code == 201
    assert journey.json()["task_state"] == "awaiting_provider"
    assert "Companion" not in journey.json()["systemTags"]


def test_object_interaction_api_persists_selection_metadata_tags_and_properties(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)

    with TestClient(create_app(settings)) as client:
        selected = client.put(
            "/cosmos/selection",
            json={"objectId": "cosmos.project.system.knowledge"},
        )
        details = client.get("/objects/cosmos.project.system.knowledge")
        updated = client.put(
            "/objects/cosmos.project.system.knowledge",
            json={
                "displayName": "Knowledge Constellation",
                "description": "Edited through the Object Window contract.",
                "userTags": ["Reference"],
                "properties": {
                    "vision": "A connected source of truth.",
                    "project_color": "#38bdf8",
                    "skin": "Star",
                },
            },
        )
        snapshot = client.get("/cosmos/map")
        notifications = client.get("/notifications")

    assert selected.json() == {"objectId": "cosmos.project.system.knowledge"}
    assert details.status_code == 200
    assert updated.json()["userTags"] == ["Reference"]
    assert updated.json()["properties"]["vision"] == "A connected source of truth."
    assert snapshot.json()["selectedObjectId"] == "cosmos.project.system.knowledge"
    assert notifications.json() == []


def test_workspace_context_scopes_object_interaction_and_restores_selection(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)

    with TestClient(create_app(settings)) as client:
        opened = client.post(
            "/workspaces/cosmos.workspace.knowledge/sessions",
            json={"roomId": "cosmos.room.main"},
        )
        session_id = opened.json()["objectId"]
        knowledge_object_id = client.post(
            f"/workspace-sessions/{session_id}/capture/submissions",
            json={"mode": "quick", "content": "Knowledge scoped Object", "attachments": []},
        ).json()["knowledge"]["objectId"]
        creation_session_id = client.post(
            "/workspaces/cosmos.workspace.creation/sessions",
            json={"roomId": "cosmos.room.main"},
        ).json()["objectId"]
        creation_object_id = client.post(
            f"/workspace-sessions/{creation_session_id}/capture/submissions",
            json={"mode": "quick", "content": "Creation scoped Object", "attachments": []},
        ).json()["knowledge"]["objectId"]
        selected = client.put(
            f"/workspace-sessions/{session_id}",
            json={
                "restorableState": {
                    "tools": [],
                    "selectedObjectId": knowledge_object_id,
                    "filters": {},
                    "camera": {},
                    "panels": {},
                }
            },
        )
        visible = client.get(
            f"/objects/{knowledge_object_id}",
            params={"workspaceSessionId": session_id},
        )
        outside_scope = client.get(
            f"/objects/{creation_object_id}",
            params={"workspaceSessionId": session_id},
        )

    assert selected.json()["restorableState"]["selectedObjectId"] == knowledge_object_id
    assert visible.status_code == 200
    assert outside_scope.status_code == 404


def test_background_job_attention_reaches_companion_notifications(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)
    app = create_app(settings)

    with TestClient(app) as client:
        opened = client.post(
            "/workspaces/cosmos.workspace.knowledge/sessions",
            json={"roomId": "cosmos.room.main"},
        )
        session_id = opened.json()["objectId"]
        capture = client.post(
            f"/workspace-sessions/{session_id}/capture/submissions",
            json={"mode": "quick", "content": "Integrated background work", "attachments": []},
        )
        app.state.runtime.jobs.wait(capture.json()["job"]["jobId"])
        notifications = client.get("/notifications")
        companion = client.get("/cosmos/map")

    notification = notifications.json()[0]
    assert notification["displayName"] == "Knowledge Processing complete"
    assert notification["category"] == "Tasks"
    assert notification["destinationObjectId"] == capture.json()["knowledge"]["objectId"]
    assert companion.json()["companion"]["notificationAvailable"] is True


def test_companion_uses_room_context_instead_of_stale_cosmos_focus(tmp_path: Path) -> None:
    settings = RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0)

    with TestClient(create_app(settings)) as client:
        reply = client.post(
            "/companion/messages",
            json={"message": "Where am I?", "roomId": "cosmos.room.main"},
        )

    assert reply.status_code == 200
    assert reply.json()["message"] == "You are in the current Base Room."
