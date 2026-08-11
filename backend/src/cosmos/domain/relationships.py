from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from enum import StrEnum
from uuid import uuid4


class RelationshipType(StrEnum):
    RELATED = "Related"


@dataclass(frozen=True, slots=True)
class Relationship:
    relationship_id: str
    project_id: str
    relationship_type: RelationshipType
    endpoint_a_id: str
    endpoint_b_id: str
    created_at: datetime

    @classmethod
    def create(cls, project_id: str, endpoint_a_id: str, endpoint_b_id: str) -> Relationship:
        if endpoint_a_id == endpoint_b_id:
            raise ValueError("A Relationship requires two distinct Object endpoints.")
        return cls(
            relationship_id=str(uuid4()),
            project_id=project_id,
            relationship_type=RelationshipType.RELATED,
            endpoint_a_id=endpoint_a_id,
            endpoint_b_id=endpoint_b_id,
            created_at=datetime.now(UTC),
        )
