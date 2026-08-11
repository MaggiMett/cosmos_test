from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime

from cosmos.domain.objects import JSONValue
from cosmos.persistence.sqlite import SQLitePersistence


@dataclass(frozen=True, slots=True)
class KnowledgeVersionRecord:
    knowledge_id: str
    version_number: int
    title: str
    content: str
    summary: str
    source_type: str
    source_reference: str
    author: str
    metadata: dict[str, JSONValue]
    created_at: datetime


class KnowledgeVersionRepository:
    def __init__(self, persistence: SQLitePersistence) -> None:
        self._persistence = persistence

    def append(
        self,
        value: KnowledgeVersionRecord,
        connection: sqlite3.Connection | None = None,
    ) -> None:
        if connection is None:
            with self._persistence.connect() as active:
                self.append(value, active)
            return
        connection.execute(
            """
            INSERT INTO knowledge_versions (
                knowledge_id, version_number, title, content, summary,
                source_type, source_reference, author, metadata_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                value.knowledge_id,
                value.version_number,
                value.title,
                value.content,
                value.summary,
                value.source_type,
                value.source_reference,
                value.author,
                json.dumps(value.metadata, sort_keys=True),
                value.created_at.isoformat(),
            ),
        )

    def list(self, knowledge_id: str) -> tuple[KnowledgeVersionRecord, ...]:
        with self._persistence.connect() as connection:
            rows = connection.execute(
                "SELECT * FROM knowledge_versions WHERE knowledge_id = ? ORDER BY version_number",
                (knowledge_id,),
            ).fetchall()
        return tuple(self._hydrate(row) for row in rows)

    @staticmethod
    def _hydrate(row: sqlite3.Row) -> KnowledgeVersionRecord:
        return KnowledgeVersionRecord(
            knowledge_id=row["knowledge_id"],
            version_number=int(row["version_number"]),
            title=row["title"],
            content=row["content"],
            summary=row["summary"],
            source_type=row["source_type"],
            source_reference=row["source_reference"],
            author=row["author"],
            metadata=json.loads(row["metadata_json"]),
            created_at=datetime.fromisoformat(row["created_at"]),
        )


@dataclass(frozen=True, slots=True)
class CaptureDraftRecord:
    draft_id: str
    project_id: str | None
    workspace_session_id: str
    mode: str
    content: str
    attachments: list[JSONValue]
    updated_at: datetime


class CaptureDraftRepository:
    def __init__(self, persistence: SQLitePersistence) -> None:
        self._persistence = persistence

    def save(self, value: CaptureDraftRecord) -> None:
        with self._persistence.connect() as connection:
            connection.execute(
                """
                INSERT INTO capture_drafts (
                    draft_id, project_id, workspace_session_id, mode,
                    content, attachments_json, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (draft_id) DO UPDATE SET
                    project_id = excluded.project_id,
                    workspace_session_id = excluded.workspace_session_id,
                    mode = excluded.mode,
                    content = excluded.content,
                    attachments_json = excluded.attachments_json,
                    updated_at = excluded.updated_at
                """,
                (
                    value.draft_id,
                    value.project_id,
                    value.workspace_session_id,
                    value.mode,
                    value.content,
                    json.dumps(value.attachments, sort_keys=True),
                    value.updated_at.isoformat(),
                ),
            )

    def get(self, draft_id: str) -> CaptureDraftRecord | None:
        with self._persistence.connect() as connection:
            row = connection.execute(
                "SELECT * FROM capture_drafts WHERE draft_id = ?", (draft_id,)
            ).fetchone()
        return None if row is None else self._hydrate(row)

    def list_for_workspace(self, workspace_session_id: str) -> tuple[CaptureDraftRecord, ...]:
        with self._persistence.connect() as connection:
            rows = connection.execute(
                "SELECT * FROM capture_drafts WHERE workspace_session_id = ? ORDER BY updated_at DESC",
                (workspace_session_id,),
            ).fetchall()
        return tuple(self._hydrate(row) for row in rows)

    def delete(self, draft_id: str) -> None:
        with self._persistence.connect() as connection:
            connection.execute("DELETE FROM capture_drafts WHERE draft_id = ?", (draft_id,))

    @staticmethod
    def _hydrate(row: sqlite3.Row) -> CaptureDraftRecord:
        return CaptureDraftRecord(
            draft_id=row["draft_id"],
            project_id=row["project_id"],
            workspace_session_id=row["workspace_session_id"],
            mode=row["mode"],
            content=row["content"],
            attachments=json.loads(row["attachments_json"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
        )


@dataclass(frozen=True, slots=True)
class PersistedJob:
    job_id: str
    category: str
    priority: str
    status: str
    context: dict[str, JSONValue]
    creating_service: str
    payload: dict[str, JSONValue]
    result: JSONValue
    error: str | None
    progress: float
    resumable: bool
    created_at: datetime
    updated_at: datetime


class JobRepository:
    def __init__(self, persistence: SQLitePersistence) -> None:
        self._persistence = persistence

    def insert(self, value: PersistedJob) -> None:
        with self._persistence.connect() as connection:
            connection.execute(
                """
                INSERT INTO runtime_jobs (
                    job_id, category, priority, status, context_json,
                    creating_service, payload_json, result_json, error,
                    progress, resumable, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    value.job_id,
                    value.category,
                    value.priority,
                    value.status,
                    json.dumps(value.context, sort_keys=True),
                    value.creating_service,
                    json.dumps(value.payload, sort_keys=True),
                    json.dumps(value.result, sort_keys=True) if value.result is not None else None,
                    value.error,
                    value.progress,
                    int(value.resumable),
                    value.created_at.isoformat(),
                    value.updated_at.isoformat(),
                ),
            )

    def update(
        self,
        job_id: str,
        *,
        status: str,
        progress: float,
        result: JSONValue = None,
        error: str | None = None,
        updated_at: datetime,
    ) -> None:
        with self._persistence.connect() as connection:
            connection.execute(
                """
                UPDATE runtime_jobs SET
                    status = ?, progress = ?, result_json = ?, error = ?, updated_at = ?
                WHERE job_id = ?
                """,
                (
                    status,
                    progress,
                    json.dumps(result, sort_keys=True) if result is not None else None,
                    error,
                    updated_at.isoformat(),
                    job_id,
                ),
            )

    def get(self, job_id: str) -> PersistedJob | None:
        with self._persistence.connect() as connection:
            row = connection.execute("SELECT * FROM runtime_jobs WHERE job_id = ?", (job_id,)).fetchone()
        return None if row is None else self._hydrate(row)

    def list(self, statuses: tuple[str, ...] = ()) -> tuple[PersistedJob, ...]:
        with self._persistence.connect() as connection:
            if statuses:
                placeholders = ", ".join("?" for _ in statuses)
                rows = connection.execute(
                    f"SELECT * FROM runtime_jobs WHERE status IN ({placeholders}) ORDER BY created_at",
                    statuses,
                ).fetchall()
            else:
                rows = connection.execute("SELECT * FROM runtime_jobs ORDER BY created_at").fetchall()
        return tuple(self._hydrate(row) for row in rows)

    @staticmethod
    def _hydrate(row: sqlite3.Row) -> PersistedJob:
        return PersistedJob(
            job_id=row["job_id"],
            category=row["category"],
            priority=row["priority"],
            status=row["status"],
            context=json.loads(row["context_json"]),
            creating_service=row["creating_service"],
            payload=json.loads(row["payload_json"]),
            result=json.loads(row["result_json"]) if row["result_json"] is not None else None,
            error=row["error"],
            progress=float(row["progress"]),
            resumable=bool(row["resumable"]),
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
        )
