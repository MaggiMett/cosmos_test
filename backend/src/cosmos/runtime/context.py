from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime


@dataclass(frozen=True, slots=True)
class RuntimeContext:
    project_scope_ids: tuple[str, ...] = ()
    focused_project_id: str | None = None
    room_id: str | None = None
    workspace_session_id: str | None = None
    tool_instance_id: str | None = None
    object_id: str | None = None
    knowledge_id: str | None = None
    system_tags: frozenset[str] = frozenset()
    user_tags: frozenset[str] = frozenset()
    permissions: frozenset[str] = frozenset()

    def __post_init__(self) -> None:
        if self.focused_project_id and self.focused_project_id not in self.project_scope_ids:
            raise ValueError("Focused Project must be present in the assigned Project scopes.")


@dataclass(frozen=True, slots=True)
class ContextSnapshot:
    context: RuntimeContext
    initiating_user_id: str
    captured_at: datetime

    @classmethod
    def capture(cls, context: RuntimeContext, initiating_user_id: str) -> ContextSnapshot:
        return cls(
            context=context,
            initiating_user_id=initiating_user_id,
            captured_at=datetime.now(UTC),
        )
