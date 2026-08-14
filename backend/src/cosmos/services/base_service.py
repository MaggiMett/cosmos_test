from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from cosmos.domain import CosmosObject, ObjectIdentity
from cosmos.domain.objects import JSONValue
from cosmos.runtime import RuntimeContext
from cosmos.services.companion_service import CompanionService
from cosmos.services.core_tool_catalog import (
    ARCHIVE_TOOL_ID,
    CAPTURE_TOOL_ID,
    FILES_TOOL_ID,
    JOURNEYMAN_TOOL_ID,
    REVIEW_TOOL_ID,
)
from cosmos.services.object_service import CreateObjectCommand, ObjectService
from cosmos.services.serialization import object_payload

BASE_ID = "cosmos.base.default"
MAIN_ROOM_ID = "cosmos.room.main"
WORKSHOP_ROOM_ID = "cosmos.room.workshop"
DOOR_ID = "cosmos.door.main-workshop"
COCKPIT_ID = "cosmos.base.cockpit"
PET_ID = "cosmos.entity.pet.default"


@dataclass(frozen=True, slots=True)
class SeedObject:
    object_id: str
    display_name: str
    description: str
    system_tags: frozenset[str]
    properties: dict[str, JSONValue]
    primary_project_id: str | None = None


WORKSPACES = (
    SeedObject(
        "cosmos.workspace.knowledge",
        "Knowledge Workspace",
        "The default workplace for research and understanding.",
        frozenset({"Workspace", "System"}),
        {
            "icon": "Knowledge",
            "overlay": "KnowledgeDesk",
            "default_layout": {},
            "context_configuration": {},
            "assigned_tool_ids": [FILES_TOOL_ID, ARCHIVE_TOOL_ID, CAPTURE_TOOL_ID, REVIEW_TOOL_ID],
            "tool_requirements": [],
            "theme_override": "",
            "source_project_id": "cosmos.project.system.knowledge",
        },
        "cosmos.project.system.knowledge",
    ),
    SeedObject(
        "cosmos.workspace.creation",
        "Creation Workspace",
        "The default workplace for creation and implementation.",
        frozenset({"Workspace", "System"}),
        {
            "icon": "Creation",
            "overlay": "CreationWorkbench",
            "default_layout": {},
            "context_configuration": {},
            "assigned_tool_ids": [
                FILES_TOOL_ID,
                ARCHIVE_TOOL_ID,
                CAPTURE_TOOL_ID,
                REVIEW_TOOL_ID,
                JOURNEYMAN_TOOL_ID,
            ],
            "tool_requirements": [{"capabilities": ["markdown", "collaboration", "web"]}],
            "theme_override": "",
            "source_project_id": "cosmos.project.system.creation",
        },
        "cosmos.project.system.creation",
    ),
    SeedObject(
        "cosmos.workspace.graphics",
        "Graphics Workspace",
        "The default workplace for visual creation.",
        frozenset({"Workspace", "System"}),
        {
            "icon": "Graphics",
            "overlay": "GraphicsDesk",
            "default_layout": {},
            "context_configuration": {},
            "assigned_tool_ids": [FILES_TOOL_ID, ARCHIVE_TOOL_ID, CAPTURE_TOOL_ID, REVIEW_TOOL_ID],
            "tool_requirements": [{"capabilities": ["design", "prototyping", "web"]}],
            "theme_override": "",
            "source_project_id": "cosmos.project.system.graphics",
        },
        "cosmos.project.system.graphics",
    ),
)

SLOTS = (
    SeedObject(
        "cosmos.workspace-slot.main.knowledge",
        "Knowledge Workspace",
        "The rear-left Workspace Slot in the Main Room.",
        frozenset({"WorkspaceSlot", "System"}),
        {
            "room_id": MAIN_ROOM_ID,
            "workspace_definition_id": "cosmos.workspace.knowledge",
            "placement": "rear_left",
            "slot_skin": "KnowledgeDesk",
        },
    ),
    SeedObject(
        "cosmos.workspace-slot.main.creation",
        "Creation Workspace",
        "The rear-right Workspace Slot in the Main Room.",
        frozenset({"WorkspaceSlot", "System"}),
        {
            "room_id": MAIN_ROOM_ID,
            "workspace_definition_id": "cosmos.workspace.creation",
            "placement": "rear_right",
            "slot_skin": "CreationWorkbench",
        },
    ),
    *tuple(
        SeedObject(
            f"cosmos.workspace-slot.workshop.{index}",
            "Empty Workspace Slot",
            f"Unassigned Workspace Slot {index} in the Workshop.",
            frozenset({"WorkspaceSlot", "System"}),
            {
                "room_id": WORKSHOP_ROOM_ID,
                "workspace_definition_id": "",
                "placement": placement,
                "slot_skin": "WorkshopBench",
            },
        )
        for index, placement in enumerate(("left_rear", "left_front", "right_rear", "right_front"), start=1)
    ),
)


class BaseService:
    def __init__(self, objects: ObjectService, companion: CompanionService) -> None:
        self._objects = objects
        self._companion = companion

    def ensure_default(self, context: RuntimeContext) -> CosmosObject:
        base = self._ensure(
            SeedObject(
                BASE_ID,
                "Base",
                "The owner's permanent home inside Cosmos.",
                frozenset({"Base", "System"}),
                {"main_room_id": MAIN_ROOM_ID, "builder_document": {}, "active_builder_document": {}},
            ),
            context,
        )
        self._ensure(
            SeedObject(
                MAIN_ROOM_ID,
                "Main Room",
                "The permanent central hub of the Base.",
                frozenset({"Room", "System"}),
                {
                    "base_object_id": BASE_ID,
                    "room_slug": "main",
                    "room_order": 0,
                    "atmosphere": "Welcoming",
                },
            ),
            context,
        )
        self._ensure(
            SeedObject(
                WORKSHOP_ROOM_ID,
                "Workshop",
                "The additional Version 1 Room with four configurable Workspace Slots.",
                frozenset({"Room", "System"}),
                {
                    "base_object_id": BASE_ID,
                    "room_slug": "workshop",
                    "room_order": 1,
                    "atmosphere": "Practical",
                },
            ),
            context,
        )
        for seed in WORKSPACES:
            self._ensure(seed, context)
        for seed in SLOTS:
            self._ensure(seed, context)
        self._ensure(
            SeedObject(
                DOOR_ID,
                "Workshop Door",
                "The bidirectional doorway between the Main Room and Workshop.",
                frozenset({"Door", "System"}),
                {"base_object_id": BASE_ID, "room_a_id": MAIN_ROOM_ID, "room_b_id": WORKSHOP_ROOM_ID},
            ),
            context,
        )
        self._ensure(
            SeedObject(
                COCKPIT_ID,
                "Cockpit",
                "The open cockpit passage and panoramic Cosmos view.",
                frozenset({"Cockpit", "System"}),
                {"base_object_id": BASE_ID, "room_id": MAIN_ROOM_ID},
            ),
            context,
        )
        self._ensure(
            SeedObject(
                PET_ID,
                "Base Pet",
                "The calm atmospheric resident of the Base.",
                frozenset({"Entity", "Pet", "System"}),
                {
                    "runtime_scope": "Base",
                    "avatar_id": "cosmos.avatar.pet.default",
                    "behaviour_profile_id": "cosmos.behaviour.calm",
                    "runtime_state": "Idle",
                    "visible": True,
                    "base_object_id": BASE_ID,
                },
            ),
            context,
        )
        return base

    def snapshot(self, context: RuntimeContext) -> dict[str, JSONValue]:
        base = self._objects.get(BASE_ID, context)
        companion = self._companion.get_default(context)
        values = self._objects.list(context)
        rooms = sorted(
            (value for value in values if "Room" in value.system_tags),
            key=lambda value: int(value.properties["room_order"]),
        )
        workspaces = {value.identity.object_id: value for value in values if "Workspace" in value.system_tags}
        slots = [value for value in values if "WorkspaceSlot" in value.system_tags]
        door = next(value for value in values if "Door" in value.system_tags)
        cockpit = next(value for value in values if "Cockpit" in value.system_tags)
        pet = next(value for value in values if "Pet" in value.system_tags)
        room_payloads: list[dict[str, JSONValue]] = []
        for room in rooms:
            room_slots = []
            for slot in slots:
                if slot.properties["room_id"] != room.identity.object_id:
                    continue
                workspace_id = str(slot.properties["workspace_definition_id"])
                workspace = workspaces.get(workspace_id)
                room_slots.append(
                    {
                        **object_payload(slot),
                        "placement": slot.properties["placement"],
                        "skin": slot.properties["slot_skin"],
                        "workspace": _workspace_payload(workspace) if workspace else None,
                    }
                )
            room_payloads.append(
                {
                    **object_payload(room),
                    "slug": room.properties["room_slug"],
                    "order": room.properties["room_order"],
                    "atmosphere": room.properties["atmosphere"],
                    "workspaceSlots": room_slots,
                }
            )
        active_builder = base.properties.get("active_builder_document", {})
        active_builder_revision = active_builder.get("revisionId") if isinstance(active_builder, dict) else None
        active_builder_document = active_builder.get("document") if isinstance(active_builder, dict) else None
        return {
            "base": object_payload(base),
            "activeBuilder": {
                "revisionId": active_builder_revision if isinstance(active_builder_revision, str) else None,
                "document": active_builder_document if isinstance(active_builder_document, dict) else None,
            },
            "rooms": room_payloads,
            "door": {
                **object_payload(door),
                "roomAId": door.properties["room_a_id"],
                "roomBId": door.properties["room_b_id"],
            },
            "cockpit": {**object_payload(cockpit), "roomId": cockpit.properties["room_id"]},
            "companion": {
                **object_payload(companion),
                "notificationAvailable": companion.properties["notification_available"],
            },
            "pet": object_payload(pet),
            "unassignedWorkspaces": [
                _workspace_payload(workspace)
                for workspace_id, workspace in workspaces.items()
                if all(str(slot.properties["workspace_definition_id"]) != workspace_id for slot in slots)
            ],
        }

    def _ensure(self, seed: SeedObject, context: RuntimeContext) -> CosmosObject:
        existing = self._objects.repository.get(seed.object_id)
        if existing is not None:
            if "Workspace" in seed.system_tags and (
                existing.properties.get("assigned_tool_ids") != seed.properties["assigned_tool_ids"]
                or existing.properties.get("tool_requirements") != seed.properties["tool_requirements"]
                or existing.properties.get("source_project_id") != seed.properties["source_project_id"]
            ):
                return self._objects.update_properties(
                    seed.object_id,
                    {
                        "assigned_tool_ids": seed.properties["assigned_tool_ids"],
                        "tool_requirements": seed.properties["tool_requirements"],
                        "source_project_id": seed.properties["source_project_id"],
                    },
                    context,
                )
            return existing
        return self._objects.create(
            CreateObjectCommand(
                identity=ObjectIdentity(
                    object_id=seed.object_id,
                    display_name=seed.display_name,
                    description=seed.description,
                    creator="cosmos.runtime",
                    lifecycle_state="active",
                    created_at=datetime.now(UTC),
                ),
                system_tags=seed.system_tags,
                properties=seed.properties,
                primary_project_id=seed.primary_project_id,
            ),
            context,
        )


def _workspace_payload(workspace: CosmosObject) -> dict[str, JSONValue]:
    return {
        **object_payload(workspace),
        "icon": workspace.properties["icon"],
        "overlay": workspace.properties["overlay"],
        "sourceProjectId": workspace.properties["source_project_id"],
    }
