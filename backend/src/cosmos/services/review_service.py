from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from cosmos.domain import CosmosObject, ObjectIdentity
from cosmos.domain.objects import JSONValue
from cosmos.runtime import RuntimeContext
from cosmos.services.errors import RuntimeServiceError, require_permission
from cosmos.services.object_service import CreateObjectCommand, ObjectService
from cosmos.services.serialization import object_payload

DECISIONS = frozenset({"accept", "reject", "postpone", "dismiss", "request_more_evidence"})


class ReviewService:
    """Persistent mature-decision queue; review never invents domain mutations."""

    def __init__(self, objects: ObjectService) -> None:
        self._objects = objects

    def create_candidate(
        self,
        *,
        title: str,
        summary: str,
        reason: str,
        category: str,
        source_tool: str,
        affected_project_ids: list[str],
        affected_object_ids: list[str],
        related_knowledge_ids: list[str],
        evidence: list[JSONValue],
        confidence: float,
        available_actions: list[str],
        context: RuntimeContext,
        urgency: str = "normal",
    ) -> dict[str, JSONValue]:
        require_permission(context.permissions, "reviews.write")
        if not title.strip() or not reason.strip():
            raise RuntimeServiceError("validation_failed", "Review title and reason are required.")
        if not 0 <= confidence <= 1:
            raise RuntimeServiceError("validation_failed", "Review confidence must be between 0 and 1.")
        actions = [action for action in available_actions if action in DECISIONS]
        if not actions:
            raise RuntimeServiceError("validation_failed", "Review requires at least one valid action.")
        value = self._objects.create(
            CreateObjectCommand(
                identity=ObjectIdentity(
                    object_id=f"cosmos.review.{uuid4()}",
                    display_name=title.strip(),
                    description=summary.strip(),
                    creator="cosmos.review-service",
                    lifecycle_state="active",
                    created_at=datetime.now(UTC),
                ),
                system_tags=frozenset({"ReviewItem", "System"}),
                properties={
                    "review_category": category,
                    "summary": summary,
                    "review_reason": reason,
                    "source_tool": source_tool,
                    "affected_project_ids": affected_project_ids,
                    "affected_object_ids": affected_object_ids,
                    "related_knowledge_ids": related_knowledge_ids,
                    "evidence": evidence,
                    "confidence": confidence,
                    "available_actions": actions,
                    "review_state": "open",
                    "decision_history": [],
                    "urgency": urgency,
                },
                primary_project_id=affected_project_ids[0] if affected_project_ids else None,
            ),
            context,
        )
        return _payload(value)

    def list(self, context: RuntimeContext, *, include_resolved: bool = False) -> list[dict[str, JSONValue]]:
        require_permission(context.permissions, "reviews.read")
        values = []
        for value in self._objects.list(context, system_tag="ReviewItem"):
            if not _visible(value, context):
                continue
            if include_resolved or value.properties["review_state"] in {"open", "postponed"}:
                values.append(_payload(value))
        return values

    def get(self, review_id: str, context: RuntimeContext) -> dict[str, JSONValue]:
        require_permission(context.permissions, "reviews.read")
        return _payload(self._review(review_id, context))

    def decide(
        self,
        review_id: str,
        *,
        action: str,
        note: str,
        context: RuntimeContext,
    ) -> dict[str, JSONValue]:
        require_permission(context.permissions, "reviews.write")
        value = self._review(review_id, context)
        normalized = action.strip().casefold()
        if normalized not in DECISIONS or normalized not in value.properties["available_actions"]:
            raise RuntimeServiceError("validation_failed", f"Action is not available: {action}")
        if value.properties["review_state"] not in {"open", "postponed"}:
            raise RuntimeServiceError("review_resolved", "This Review item has already been resolved.")
        state = {
            "accept": "accepted",
            "reject": "rejected",
            "postpone": "postponed",
            "dismiss": "dismissed",
            "request_more_evidence": "awaiting_evidence",
        }[normalized]
        history = list(value.properties["decision_history"])
        history.append(
            {
                "action": normalized,
                "note": note.strip(),
                "actor": "cosmos.local-owner",
                "decidedAt": datetime.now(UTC).isoformat(),
            }
        )
        updated = self._objects.update_properties(
            review_id,
            {"review_state": state, "decision_history": history},
            context,
        )
        return _payload(updated)

    def _review(self, review_id: str, context: RuntimeContext) -> CosmosObject:
        value = self._objects.get(review_id, context)
        if "ReviewItem" not in value.system_tags or not _visible(value, context):
            raise RuntimeServiceError("review_not_found", f"Review item not found: {review_id}")
        return value


def _visible(value: CosmosObject, context: RuntimeContext) -> bool:
    projects = {str(item) for item in value.properties["affected_project_ids"]}
    return (
        not context.project_scope_ids
        or not projects
        or bool(projects.intersection(context.project_scope_ids))
    )


def _payload(value: CosmosObject) -> dict[str, JSONValue]:
    return {**object_payload(value), **dict(value.properties)}
