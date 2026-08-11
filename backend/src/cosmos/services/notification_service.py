from __future__ import annotations

from collections import deque
from contextlib import suppress
from dataclasses import dataclass
from datetime import UTC, datetime
from threading import Lock

from cosmos.domain import CosmosObject, ObjectIdentity
from cosmos.domain.objects import JSONValue
from cosmos.runtime import EventDispatcher, RuntimeContext, RuntimeEvent
from cosmos.services.companion_service import COMPANION_ID
from cosmos.services.errors import RuntimeServiceError, require_permission
from cosmos.services.object_service import CreateObjectCommand, ObjectService
from cosmos.services.serialization import object_payload

NOTIFICATION_CATEGORIES = frozenset({"Tasks", "Discoveries", "Suggestions", "Projects", "System"})


@dataclass(frozen=True, slots=True)
class CreateNotificationCommand:
    title: str
    message: str
    category: str
    source_object_id: str = ""
    destination_object_id: str = ""
    primary_project_id: str | None = None


class NotificationService:
    """Owns temporary Notification Objects presented by the Companion."""

    def __init__(self, objects: ObjectService) -> None:
        self._objects = objects
        self._handled_event_ids: deque[str] = deque(maxlen=2048)
        self._event_lock = Lock()

    def connect(self, events: EventDispatcher) -> None:
        events.subscribe(
            "notification-service.job-attention",
            frozenset({"JobCompleted", "JobFailed"}),
            self._on_job_attention,
        )

    def create(
        self,
        command: CreateNotificationCommand,
        context: RuntimeContext,
    ) -> CosmosObject:
        require_permission(context.permissions, "notifications.write")
        title = command.title.strip()
        message = command.message.strip()
        if not title or not message:
            raise RuntimeServiceError(
                "validation_failed", "Notification title and message must not be empty."
            )
        if command.category not in NOTIFICATION_CATEGORIES:
            raise RuntimeServiceError("validation_failed", "Unknown Notification category.")
        if command.source_object_id:
            self._objects.get(command.source_object_id, context)
        if command.destination_object_id:
            self._objects.get(command.destination_object_id, context)
        value = self._objects.create(
            CreateObjectCommand(
                identity=ObjectIdentity.create(
                    title,
                    description=message,
                    creator="cosmos.notification-service",
                    lifecycle_state="active",
                ),
                system_tags=frozenset({"Notification"}),
                properties={
                    "message": message,
                    "category": command.category,
                    "source_object_id": command.source_object_id,
                    "destination_object_id": command.destination_object_id,
                    "read": False,
                    "created_at": datetime.now(UTC).isoformat(),
                },
                primary_project_id=command.primary_project_id,
            ),
            context,
        )
        self._sync_companion_indicator(context)
        return value

    def list(self, context: RuntimeContext) -> list[dict[str, JSONValue]]:
        require_permission(context.permissions, "notifications.read")
        values = self._objects.list(context, system_tag="Notification")
        return [self._payload(value) for value in reversed(values)]

    def mark_read(
        self,
        notification_id: str,
        read: bool,
        context: RuntimeContext,
    ) -> dict[str, JSONValue]:
        require_permission(context.permissions, "notifications.write")
        value = self._objects.get(notification_id, context)
        if "Notification" not in value.system_tags:
            raise RuntimeServiceError("notification_not_found", "Notification not found.")
        updated = self._objects.update_properties(notification_id, {"read": read}, context)
        self._sync_companion_indicator(context)
        return self._payload(updated)

    def _sync_companion_indicator(self, context: RuntimeContext) -> None:
        if self._objects.repository.get(COMPANION_ID) is None:
            return
        available = any(
            not bool(value.properties["read"])
            for value in self._objects.list(context, system_tag="Notification")
        )
        companion = self._objects.get(COMPANION_ID, context)
        if companion.properties["notification_available"] != available:
            self._objects.update_properties(
                COMPANION_ID,
                {"notification_available": available},
                context,
            )

    def _on_job_attention(self, event: RuntimeEvent) -> None:
        with self._event_lock:
            if event.event_id in self._handled_event_ids:
                return
            self._handled_event_ids.append(event.event_id)
        try:
            category = str(event.metadata.get("category", "Background work"))
            failed = event.event_type == "JobFailed"
            destination = event.context.context.object_id or ""
            if destination and self._objects.repository.get(destination) is None:
                destination = ""
            self.create(
                CreateNotificationCommand(
                    title=f"{category} {'needs attention' if failed else 'complete'}",
                    message=(
                        "Background work could not complete. Its state was preserved for review."
                        if failed
                        else "Background work completed and its result is ready to review."
                    ),
                    source_object_id=destination,
                    destination_object_id=destination,
                    category="System" if failed else "Tasks",
                    primary_project_id=event.context.context.focused_project_id,
                ),
                event.context.context,
            )
        except Exception:
            with self._event_lock, suppress(ValueError):
                self._handled_event_ids.remove(event.event_id)
            raise

    @staticmethod
    def _payload(value: CosmosObject) -> dict[str, JSONValue]:
        return {
            **object_payload(value),
            "category": value.properties["category"],
            "message": value.properties["message"],
            "sourceObjectId": value.properties["source_object_id"],
            "destinationObjectId": value.properties["destination_object_id"],
            "read": value.properties["read"],
            "createdAt": value.properties["created_at"],
            "primaryProjectId": value.primary_project_id,
        }
