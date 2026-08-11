from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from cosmos.domain import CosmosObject, ObjectIdentity
from cosmos.domain.objects import JSONValue
from cosmos.runtime import RuntimeContext
from cosmos.services.object_service import CreateObjectCommand, ObjectService

FILES_TOOL_ID = "cosmos.tool.files"
ARCHIVE_TOOL_ID = "cosmos.tool.archive"
CAPTURE_TOOL_ID = "cosmos.tool.capture"
REVIEW_TOOL_ID = "cosmos.tool.review"
JOURNEYMAN_TOOL_ID = "cosmos.tool.journeyman"


@dataclass(frozen=True, slots=True)
class CoreToolDefinition:
    object_id: str
    display_name: str
    description: str
    component_id: str
    icon: str
    capabilities: tuple[str, ...]
    permissions: tuple[str, ...]
    minimum_width: int
    minimum_height: int
    category: str = "UserTool"


CORE_TOOLS = (
    CoreToolDefinition(
        FILES_TOOL_ID,
        "Files",
        "Browse and manage files inside the active Cosmos Project.",
        "files",
        "Files",
        ("project-files", "preview", "search"),
        ("resources.read", "resources.write"),
        700,
        440,
    ),
    CoreToolDefinition(
        ARCHIVE_TOOL_ID,
        "Archive",
        "Browse, search and edit durable Knowledge and Objects inline.",
        "archive",
        "Archive",
        ("knowledge-browse", "knowledge-edit", "object-edit", "search"),
        ("knowledge.read", "knowledge.write", "objects.read", "objects.write"),
        720,
        460,
    ),
    CoreToolDefinition(
        CAPTURE_TOOL_ID,
        "Capture",
        "Preserve ideas immediately and submit them to Knowledge Service.",
        "capture",
        "Capture",
        ("quick-capture", "rant", "form", "attachments", "draft-recovery"),
        ("knowledge.write", "drafts.read", "drafts.write"),
        560,
        440,
    ),
    CoreToolDefinition(
        REVIEW_TOOL_ID,
        "Review",
        "Present mature discoveries and preserve user decisions.",
        "review",
        "Review",
        ("review-queue", "evidence", "decisions"),
        ("reviews.read", "reviews.write"),
        680,
        440,
    ),
    CoreToolDefinition(
        JOURNEYMAN_TOOL_ID,
        "Journeyman",
        "Plan and orchestrate observable development work.",
        "journeyman",
        "Journeyman",
        ("planning", "development", "provider-orchestration", "validation"),
        ("journeyman.read", "journeyman.write", "jobs.read", "jobs.write"),
        680,
        500,
        "SystemTool",
    ),
)


class CoreToolCatalog:
    def __init__(self, objects: ObjectService) -> None:
        self._objects = objects

    def ensure_version_one(self, context: RuntimeContext) -> tuple[CosmosObject, ...]:
        return tuple(self._ensure(definition, context) for definition in CORE_TOOLS)

    def _ensure(self, definition: CoreToolDefinition, context: RuntimeContext) -> CosmosObject:
        properties: dict[str, JSONValue] = {
            "category": definition.category,
            "component_id": definition.component_id,
            "version": "1.0.0",
            "entry_point": f"@cosmos/frontend-runtime:{definition.component_id}",
            "icon": definition.icon,
            "capabilities": list(definition.capabilities),
            "permissions": list(definition.permissions),
            "minimum_window_size": {
                "width": definition.minimum_width,
                "height": definition.minimum_height,
            },
        }
        existing = self._objects.repository.get(definition.object_id)
        if existing is not None:
            changes = {
                key: value for key, value in properties.items() if existing.properties.get(key) != value
            }
            return (
                self._objects.update_properties(definition.object_id, changes, context)
                if changes
                else existing
            )
        return self._objects.create(
            CreateObjectCommand(
                identity=ObjectIdentity(
                    object_id=definition.object_id,
                    display_name=definition.display_name,
                    description=definition.description,
                    creator="cosmos.runtime",
                    lifecycle_state="active",
                    created_at=datetime.now(UTC),
                ),
                system_tags=frozenset({"System", "Tool"}),
                properties=properties,
            ),
            context,
        )
