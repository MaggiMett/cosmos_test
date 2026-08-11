from __future__ import annotations

import math
from datetime import UTC, datetime

from cosmos.domain import CosmosObject
from cosmos.domain.objects import JSONValue
from cosmos.persistence import RuntimeStateRepository
from cosmos.runtime import RuntimeContext
from cosmos.services.companion_service import CompanionService
from cosmos.services.errors import RuntimeServiceError, require_permission
from cosmos.services.object_service import ObjectService
from cosmos.services.relationship_service import RelationshipService
from cosmos.services.serialization import object_payload

CAMERA_SCOPE = "cosmos.map"
CAMERA_KEY = "camera"
SELECTION_KEY = "selection"
DEFAULT_CAMERA: dict[str, JSONValue] = {"x": 0.0, "y": -180.0, "zoom": 0.5}


class CosmosMapService:
    def __init__(
        self,
        objects: ObjectService,
        relationships: RelationshipService,
        state: RuntimeStateRepository,
        companion: CompanionService,
    ) -> None:
        self._objects = objects
        self._relationships = relationships
        self._state = state
        self._companion = companion

    def snapshot(self, context: RuntimeContext) -> dict[str, JSONValue]:
        projects = self._objects.list(context, system_tag="Project")
        nodes = self._objects.list(context, system_tag="Node")
        camera = self.camera(context)
        focused = _focused_project(projects, camera)
        relationships = self._relationships.list(context)
        companion = self._companion.get_default(context)

        project_payloads = []
        node_ids = {node.identity.object_id for node in nodes}
        for project in projects:
            project_nodes = [
                node
                for node in nodes
                if node.identity.object_id == project.identity.object_id
                or node.primary_project_id == project.identity.object_id
            ]
            project_payloads.append(_project_payload(project, project_nodes))

        connections: list[dict[str, JSONValue]] = []
        for node in nodes:
            parent_id = str(node.properties.get("parent_object_id", ""))
            if parent_id and parent_id in node_ids:
                connections.append(
                    {
                        "objectId": f"cosmos.connection.structural.{node.identity.object_id}",
                        "systemTags": ["Connection"],
                        "provenance": "structural",
                        "endpointAId": parent_id,
                        "endpointBId": node.identity.object_id,
                        "relationshipId": None,
                    }
                )
        for relationship in relationships:
            connections.append(
                {
                    "objectId": f"cosmos.connection.relationship.{relationship.relationship_id}",
                    "systemTags": ["Connection"],
                    "provenance": "semantic",
                    "endpointAId": relationship.endpoint_a_id,
                    "endpointBId": relationship.endpoint_b_id,
                    "relationshipId": relationship.relationship_id,
                }
            )

        return {
            "camera": camera,
            "focusedProjectId": focused.identity.object_id if focused else None,
            "selectedObjectId": self.selection(context),
            "projects": project_payloads,
            "connections": connections,
            "companion": {
                **object_payload(companion),
                "notificationAvailable": companion.properties["notification_available"],
            },
        }

    def camera(self, context: RuntimeContext) -> dict[str, JSONValue]:
        require_permission(context.permissions, "runtime_state.read")
        value = self._state.get(CAMERA_SCOPE, CAMERA_KEY, DEFAULT_CAMERA)
        return dict(value) if isinstance(value, dict) else dict(DEFAULT_CAMERA)

    def update_camera(self, x: float, y: float, zoom: float, context: RuntimeContext) -> dict[str, JSONValue]:
        require_permission(context.permissions, "runtime_state.write")
        if not all(math.isfinite(value) for value in (x, y, zoom)):
            raise RuntimeServiceError("validation_failed", "Camera values must be finite numbers.")
        if not 0.35 <= zoom <= 2.4:
            raise RuntimeServiceError("validation_failed", "Camera zoom must be between 0.35 and 2.4.")
        value: dict[str, JSONValue] = {"x": x, "y": y, "zoom": zoom}
        self._state.set(CAMERA_SCOPE, CAMERA_KEY, value, datetime.now(UTC))
        return value

    def selection(self, context: RuntimeContext) -> str | None:
        require_permission(context.permissions, "runtime_state.read")
        value = self._state.get(CAMERA_SCOPE, SELECTION_KEY, None)
        return value if isinstance(value, str) else None

    def select(self, object_id: str | None, context: RuntimeContext) -> str | None:
        require_permission(context.permissions, "runtime_state.write")
        if object_id is not None:
            value = self._objects.get(object_id, context)
            if "Node" not in value.system_tags:
                raise RuntimeServiceError("validation_failed", "Only map Node Objects may be selected.")
        self._state.set(CAMERA_SCOPE, SELECTION_KEY, object_id, datetime.now(UTC))
        return object_id

    def move_node(self, object_id: str, x: float, y: float, context: RuntimeContext) -> CosmosObject:
        if not math.isfinite(x) or not math.isfinite(y):
            raise RuntimeServiceError("validation_failed", "Node positions must be finite numbers.")
        node = self._objects.get(object_id, context)
        if "Node" not in node.system_tags:
            raise RuntimeServiceError("validation_failed", "Only Node Objects have map positions.")
        for candidate in self._objects.list(context, system_tag="Node"):
            if candidate.identity.object_id == object_id:
                continue
            distance = math.hypot(
                float(candidate.properties["position_x"]) - x,
                float(candidate.properties["position_y"]) - y,
            )
            minimum = _minimum_node_distance(node, candidate)
            if distance < minimum:
                raise RuntimeServiceError(
                    "node_position_conflict", "Node position would overlap another Node."
                )
        return self._objects.update_properties(object_id, {"position_x": x, "position_y": y}, context)


def _focused_project(projects: tuple[CosmosObject, ...], camera: dict[str, JSONValue]) -> CosmosObject | None:
    x = float(camera["x"])
    y = float(camera["y"])
    nearest = min(
        projects,
        key=lambda project: math.hypot(
            float(project.properties["position_x"]) - x,
            float(project.properties["position_y"]) - y,
        ),
        default=None,
    )
    if nearest is None:
        return None
    distance = math.hypot(
        float(nearest.properties["position_x"]) - x,
        float(nearest.properties["position_y"]) - y,
    )
    return nearest if distance <= 280.0 else None


def _project_payload(project: CosmosObject, nodes: list[CosmosObject]) -> dict[str, JSONValue]:
    return {
        **object_payload(project),
        "vision": project.properties["vision"],
        "color": project.properties["project_color"],
        "x": project.properties["position_x"],
        "y": project.properties["position_y"],
        "nodes": [_node_payload(node) for node in nodes],
    }


def _node_payload(node: CosmosObject) -> dict[str, JSONValue]:
    return {
        **object_payload(node),
        "x": node.properties["position_x"],
        "y": node.properties["position_y"],
        "parentObjectId": node.properties["parent_object_id"],
        "hierarchyLevel": node.properties["hierarchy_level"],
        "skin": node.properties["skin"],
    }


def _minimum_node_distance(left: CosmosObject, right: CosmosObject) -> float:
    left_root = "ProjectRoot" in left.system_tags
    right_root = "ProjectRoot" in right.system_tags
    if left_root and right_root:
        return 440.0
    if left_root or right_root:
        return 140.0
    return 78.0
