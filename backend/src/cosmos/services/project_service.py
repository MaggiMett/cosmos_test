from __future__ import annotations

import shutil
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

from cosmos.domain import CosmosObject, ObjectIdentity
from cosmos.persistence.repositories import prepared_structure_rows
from cosmos.persistence.sqlite import SQLitePersistence
from cosmos.runtime import ContextSnapshot, EventDispatcher, RuntimeContext, RuntimeEvent
from cosmos.services.errors import RuntimeServiceError, require_permission
from cosmos.services.object_service import CreateObjectCommand, ObjectService

PREPARED_AREAS = ("Knowledge", "Files", "Themes", "Workspaces", "Templates", "Extensions")


@dataclass(frozen=True, slots=True)
class ProjectSeed:
    object_id: str
    display_name: str
    description: str
    vision: str
    color: str
    x: float
    y: float


@dataclass(frozen=True, slots=True)
class CreateProjectCommand:
    display_name: str
    description: str
    vision: str
    color: str
    x: float
    y: float
    system: bool = False


SYSTEM_PROJECTS = (
    ProjectSeed(
        "cosmos.project.system.knowledge",
        "Knowledge Workspace",
        "The Version 1 System Project for durable knowledge work.",
        "Provide the Knowledge Workspace capabilities of Cosmos.",
        "#7dd3fc",
        -720.0,
        -80.0,
    ),
    ProjectSeed(
        "cosmos.project.system.creation",
        "Creation Workspace",
        "The Version 1 System Project for creation and Journeyman.",
        "Provide the Creation Workspace capabilities of Cosmos.",
        "#c4b5fd",
        0.0,
        140.0,
    ),
    ProjectSeed(
        "cosmos.project.system.graphics",
        "Graphics Workspace",
        "The Version 1 System Project for visual creation.",
        "Provide the Graphics Workspace capabilities of Cosmos.",
        "#f9a8d4",
        730.0,
        -100.0,
    ),
)


class ProjectService:
    def __init__(
        self,
        runtime_path: Path,
        persistence: SQLitePersistence,
        objects: ObjectService,
        events: EventDispatcher,
    ) -> None:
        self._runtime_path = runtime_path.resolve()
        self._persistence = persistence
        self._objects = objects
        self._events = events

    def ensure_version_one_system_projects(self, context: RuntimeContext) -> tuple[CosmosObject, ...]:
        return tuple(self._ensure_seed(seed, context) for seed in SYSTEM_PROJECTS)

    def create(self, command: CreateProjectCommand, context: RuntimeContext) -> CosmosObject:
        if not command.display_name.strip() or not command.vision.strip():
            raise RuntimeServiceError(
                "validation_failed", "A Project requires both a display name and a Vision."
            )
        identity = ObjectIdentity.create(
            command.display_name,
            description=command.description,
            creator="cosmos.local-owner",
        )
        return self._create_project(
            identity,
            command.vision,
            command.color,
            command.x,
            command.y,
            command.system,
            context,
        )

    def prepared_structures(self, project_id: str, context: RuntimeContext) -> dict[str, Path]:
        require_permission(context.permissions, "projects.read")
        with self._persistence.connect() as connection:
            return prepared_structure_rows(connection, project_id)

    def _ensure_seed(self, seed: ProjectSeed, context: RuntimeContext) -> CosmosObject:
        existing = self._objects.repository.get(seed.object_id)
        if existing is not None:
            self._restore_prepared_structure(existing.identity.object_id)
            return existing

        return self._create_project(
            ObjectIdentity(
                object_id=seed.object_id,
                display_name=seed.display_name,
                description=seed.description,
                creator="cosmos.runtime",
                lifecycle_state="active",
                created_at=datetime.now(UTC),
            ),
            seed.vision,
            seed.color,
            seed.x,
            seed.y,
            True,
            context,
        )

    def _create_project(
        self,
        identity: ObjectIdentity,
        vision: str,
        color: str,
        x: float,
        y: float,
        system: bool,
        context: RuntimeContext,
    ) -> CosmosObject:
        require_permission(context.permissions, "projects.write")
        object_id = identity.object_id
        staging_root = self._runtime_path / "Projects" / ".staging" / object_id
        final_root = self._runtime_path / "Projects" / object_id
        if staging_root.exists():
            shutil.rmtree(staging_root)
        for area in PREPARED_AREAS:
            (staging_root / ".cosmos" / area).mkdir(parents=True, exist_ok=True)

        value = self._objects.build(
            CreateObjectCommand(
                identity=identity,
                system_tags=frozenset(
                    {"Project", "Node", "ProjectRoot", "System"}
                    if system
                    else {"Project", "Node", "ProjectRoot"}
                ),
                properties={
                    "vision": vision,
                    "project_color": color,
                    "position_x": x,
                    "position_y": y,
                    "parent_object_id": "",
                    "hierarchy_level": "ProjectRoot",
                    "skin": "Star",
                },
            ),
            context,
        )

        try:
            with self._persistence.connect() as connection:
                self._objects.repository.insert(value, connection)
                connection.executemany(
                    """
                    INSERT INTO prepared_structures (project_id, area_name, physical_path)
                    VALUES (?, ?, ?)
                    """,
                    ((object_id, area, str(final_root / ".cosmos" / area)) for area in PREPARED_AREAS),
                )
            final_root.parent.mkdir(parents=True, exist_ok=True)
            staging_root.replace(final_root)
        except Exception:
            self._objects.repository.delete(object_id)
            if staging_root.exists():
                shutil.rmtree(staging_root)
            raise

        self._objects.publish_created(value, context)
        self._events.publish(
            RuntimeEvent.create(
                "ProjectCreated",
                context=ContextSnapshot.capture(context, "cosmos.runtime"),
                origin_service="ProjectService",
                affected_object_ids=(object_id,),
                metadata={"system": system},
            )
        )
        return value

    def _restore_prepared_structure(self, project_id: str) -> None:
        with self._persistence.connect() as connection:
            paths = prepared_structure_rows(connection, project_id)
        if set(paths) != set(PREPARED_AREAS):
            raise RuntimeServiceError(
                "prepared_structure_invalid", f"Project has incomplete Prepared Structures: {project_id}"
            )
        for path in paths.values():
            path.mkdir(parents=True, exist_ok=True)
