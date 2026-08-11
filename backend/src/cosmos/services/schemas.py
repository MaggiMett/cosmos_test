from cosmos.domain import ObjectContract, PropertyDefinition, PropertyKind, PropertySchema


def create_version_one_object_contract() -> ObjectContract:
    contract = ObjectContract()
    contract.register_system_tag(
        "Project",
        PropertySchema(
            "cosmos.schema.project",
            1,
            (
                PropertyDefinition("vision", PropertyKind.STRING, ""),
                PropertyDefinition("project_color", PropertyKind.STRING, "#8b5cf6"),
            ),
        ),
    )
    contract.register_system_tag(
        "Node",
        PropertySchema(
            "cosmos.schema.node",
            1,
            (
                PropertyDefinition("position_x", PropertyKind.NUMBER, 0.0),
                PropertyDefinition("position_y", PropertyKind.NUMBER, 0.0),
                PropertyDefinition("parent_object_id", PropertyKind.STRING, ""),
                PropertyDefinition("hierarchy_level", PropertyKind.STRING, "Object"),
                PropertyDefinition("skin", PropertyKind.STRING, "Star"),
            ),
        ),
    )
    contract.register_system_tag("ProjectRoot")
    contract.register_system_tag("Domain")
    contract.register_system_tag("Cluster")
    contract.register_system_tag("Detail")
    contract.register_system_tag("System")
    contract.register_system_tag(
        "Entity",
        PropertySchema(
            "cosmos.schema.entity",
            1,
            (
                PropertyDefinition("runtime_scope", PropertyKind.STRING, "Global"),
                PropertyDefinition("avatar_id", PropertyKind.STRING, "cosmos.avatar.companion.astronaut"),
                PropertyDefinition("behaviour_profile_id", PropertyKind.STRING, "cosmos.behaviour.calm"),
                PropertyDefinition("runtime_state", PropertyKind.STRING, "Idle"),
                PropertyDefinition("visible", PropertyKind.BOOLEAN, True),
            ),
        ),
    )
    contract.register_system_tag(
        "Companion",
        PropertySchema(
            "cosmos.schema.companion",
            1,
            (
                PropertyDefinition(
                    "personality_profile_id", PropertyKind.STRING, "cosmos.personality.default"
                ),
                PropertyDefinition("notification_available", PropertyKind.BOOLEAN, False),
            ),
        ),
    )
    contract.register_system_tag(
        "Base",
        PropertySchema(
            "cosmos.schema.base",
            1,
            (PropertyDefinition("main_room_id", PropertyKind.STRING, ""),),
        ),
    )
    contract.register_system_tag(
        "Room",
        PropertySchema(
            "cosmos.schema.room",
            1,
            (
                PropertyDefinition("base_object_id", PropertyKind.STRING, ""),
                PropertyDefinition("room_slug", PropertyKind.STRING, ""),
                PropertyDefinition("room_order", PropertyKind.INTEGER, 0),
                PropertyDefinition("atmosphere", PropertyKind.STRING, "Calm"),
            ),
        ),
    )
    contract.register_system_tag(
        "Door",
        PropertySchema(
            "cosmos.schema.door",
            1,
            (
                PropertyDefinition("base_object_id", PropertyKind.STRING, ""),
                PropertyDefinition("room_a_id", PropertyKind.STRING, ""),
                PropertyDefinition("room_b_id", PropertyKind.STRING, ""),
            ),
        ),
    )
    contract.register_system_tag(
        "Cockpit",
        PropertySchema(
            "cosmos.schema.cockpit",
            1,
            (
                PropertyDefinition("base_object_id", PropertyKind.STRING, ""),
                PropertyDefinition("room_id", PropertyKind.STRING, ""),
            ),
        ),
    )
    contract.register_system_tag(
        "Workspace",
        PropertySchema(
            "cosmos.schema.workspace",
            1,
            (
                PropertyDefinition("icon", PropertyKind.STRING, "Workspace"),
                PropertyDefinition("overlay", PropertyKind.STRING, "Desk"),
                PropertyDefinition("default_layout", PropertyKind.OBJECT, {}),
                PropertyDefinition("context_configuration", PropertyKind.OBJECT, {}),
                PropertyDefinition("assigned_tool_ids", PropertyKind.ARRAY, []),
                PropertyDefinition("tool_requirements", PropertyKind.ARRAY, []),
                PropertyDefinition("theme_override", PropertyKind.STRING, ""),
                PropertyDefinition("source_project_id", PropertyKind.STRING, ""),
            ),
        ),
    )
    contract.register_system_tag(
        "WorkspaceSlot",
        PropertySchema(
            "cosmos.schema.workspace-slot",
            1,
            (
                PropertyDefinition("room_id", PropertyKind.STRING, ""),
                PropertyDefinition("workspace_definition_id", PropertyKind.STRING, ""),
                PropertyDefinition("placement", PropertyKind.STRING, ""),
                PropertyDefinition("slot_skin", PropertyKind.STRING, "Workbench"),
            ),
        ),
    )
    contract.register_system_tag(
        "Pet",
        PropertySchema(
            "cosmos.schema.pet",
            1,
            (PropertyDefinition("base_object_id", PropertyKind.STRING, ""),),
        ),
    )
    contract.register_system_tag(
        "Tool",
        PropertySchema(
            "cosmos.schema.tool",
            1,
            (
                PropertyDefinition("category", PropertyKind.STRING, "UserTool"),
                PropertyDefinition("component_id", PropertyKind.STRING, ""),
                PropertyDefinition("version", PropertyKind.STRING, "1.0.0"),
                PropertyDefinition("entry_point", PropertyKind.STRING, ""),
                PropertyDefinition("runtime_kind", PropertyKind.STRING, "native"),
                PropertyDefinition("icon", PropertyKind.STRING, "Tool"),
                PropertyDefinition("capabilities", PropertyKind.ARRAY, []),
                PropertyDefinition("permissions", PropertyKind.ARRAY, []),
                PropertyDefinition("minimum_window_size", PropertyKind.OBJECT, {}),
            ),
        ),
    )
    contract.register_system_tag(
        "WorkspaceSession",
        PropertySchema(
            "cosmos.schema.workspace-session",
            1,
            (
                PropertyDefinition("workspace_definition_id", PropertyKind.STRING, ""),
                PropertyDefinition("room_id", PropertyKind.STRING, ""),
                PropertyDefinition("runtime_state", PropertyKind.OBJECT, {}),
                PropertyDefinition("session_state", PropertyKind.STRING, "created"),
            ),
        ),
    )
    contract.register_system_tag(
        "ToolInstance",
        PropertySchema(
            "cosmos.schema.tool-instance",
            1,
            (
                PropertyDefinition("tool_definition_id", PropertyKind.STRING, ""),
                PropertyDefinition("workspace_session_id", PropertyKind.STRING, ""),
                PropertyDefinition("execution_mode", PropertyKind.STRING, "workspace"),
                PropertyDefinition("runtime_state", PropertyKind.OBJECT, {}),
                PropertyDefinition("lifecycle_state", PropertyKind.STRING, "created"),
            ),
        ),
    )
    contract.register_system_tag(
        "Window",
        PropertySchema(
            "cosmos.schema.window",
            1,
            (
                PropertyDefinition("window_role", PropertyKind.STRING, "tool"),
                PropertyDefinition("parent_window_id", PropertyKind.STRING, ""),
                PropertyDefinition("bounds", PropertyKind.OBJECT, {}),
                PropertyDefinition("window_state", PropertyKind.STRING, "inactive"),
                PropertyDefinition("focus_order", PropertyKind.INTEGER, 0),
            ),
        ),
    )
    contract.register_system_tag("EnvironmentWindow")
    contract.register_system_tag("ToolWindow")
    contract.register_system_tag(
        "Knowledge",
        PropertySchema(
            "cosmos.schema.knowledge",
            1,
            (
                PropertyDefinition("title", PropertyKind.STRING, ""),
                PropertyDefinition("current_content", PropertyKind.STRING, ""),
                PropertyDefinition("summary", PropertyKind.STRING, ""),
                PropertyDefinition("current_version", PropertyKind.INTEGER, 1),
                PropertyDefinition("source_type", PropertyKind.STRING, "Manual"),
                PropertyDefinition("source_reference", PropertyKind.STRING, ""),
                PropertyDefinition("original_source", PropertyKind.OBJECT, {}),
                PropertyDefinition("project_ids", PropertyKind.ARRAY, []),
                PropertyDefinition("object_ids", PropertyKind.ARRAY, []),
                PropertyDefinition("resource_refs", PropertyKind.ARRAY, []),
                PropertyDefinition("review_history", PropertyKind.ARRAY, []),
                PropertyDefinition("processed_status", PropertyKind.STRING, "stored"),
                PropertyDefinition("author", PropertyKind.STRING, "cosmos.local-owner"),
            ),
        ),
    )
    contract.register_system_tag(
        "Capture",
        PropertySchema(
            "cosmos.schema.capture",
            1,
            (
                PropertyDefinition("capture_mode", PropertyKind.STRING, "quick"),
                PropertyDefinition("attachments", PropertyKind.ARRAY, []),
                PropertyDefinition("submitted_at", PropertyKind.STRING, ""),
                PropertyDefinition("inherited_context", PropertyKind.OBJECT, {}),
            ),
        ),
    )
    contract.register_system_tag(
        "ReviewItem",
        PropertySchema(
            "cosmos.schema.review-item",
            1,
            (
                PropertyDefinition("review_category", PropertyKind.STRING, "RuntimeDecision"),
                PropertyDefinition("summary", PropertyKind.STRING, ""),
                PropertyDefinition("review_reason", PropertyKind.STRING, ""),
                PropertyDefinition("source_tool", PropertyKind.STRING, ""),
                PropertyDefinition("affected_project_ids", PropertyKind.ARRAY, []),
                PropertyDefinition("affected_object_ids", PropertyKind.ARRAY, []),
                PropertyDefinition("related_knowledge_ids", PropertyKind.ARRAY, []),
                PropertyDefinition("evidence", PropertyKind.ARRAY, []),
                PropertyDefinition("confidence", PropertyKind.NUMBER, 0.0),
                PropertyDefinition("available_actions", PropertyKind.ARRAY, []),
                PropertyDefinition("review_state", PropertyKind.STRING, "open"),
                PropertyDefinition("decision_history", PropertyKind.ARRAY, []),
                PropertyDefinition("urgency", PropertyKind.STRING, "normal"),
            ),
        ),
    )
    contract.register_system_tag(
        "JourneymanTask",
        PropertySchema(
            "cosmos.schema.journeyman-task",
            1,
            (
                PropertyDefinition("objective", PropertyKind.STRING, ""),
                PropertyDefinition("task_state", PropertyKind.STRING, "planning"),
                PropertyDefinition("plan", PropertyKind.ARRAY, []),
                PropertyDefinition("task_context", PropertyKind.OBJECT, {}),
                PropertyDefinition("events", PropertyKind.ARRAY, []),
                PropertyDefinition("result", PropertyKind.OBJECT, {}),
                PropertyDefinition("job_id", PropertyKind.STRING, ""),
                PropertyDefinition("provider_id", PropertyKind.STRING, ""),
            ),
        ),
    )
    contract.register_system_tag(
        "Notification",
        PropertySchema(
            "cosmos.schema.notification",
            1,
            (
                PropertyDefinition("message", PropertyKind.STRING, ""),
                PropertyDefinition("category", PropertyKind.STRING, "System"),
                PropertyDefinition("source_object_id", PropertyKind.STRING, ""),
                PropertyDefinition("destination_object_id", PropertyKind.STRING, ""),
                PropertyDefinition("read", PropertyKind.BOOLEAN, False),
                PropertyDefinition("created_at", PropertyKind.STRING, ""),
            ),
        ),
    )
    contract.register_system_tag(
        "ThemeBuilderProject",
        PropertySchema(
            "cosmos.schema.theme-builder-project",
            1,
            (PropertyDefinition("builder_document", PropertyKind.OBJECT, {}),),
        ),
    )
    return contract
