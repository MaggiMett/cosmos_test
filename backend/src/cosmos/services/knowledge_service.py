from __future__ import annotations

import re
from collections.abc import Mapping
from dataclasses import replace
from datetime import UTC, datetime
from uuid import uuid4

from cosmos.domain import CosmosObject, ObjectIdentity
from cosmos.domain.objects import JSONValue
from cosmos.persistence import (
    CaptureDraftRecord,
    CaptureDraftRepository,
    KnowledgeVersionRecord,
    KnowledgeVersionRepository,
    SQLitePersistence,
)
from cosmos.runtime import RuntimeContext
from cosmos.services.errors import RuntimeServiceError, require_permission
from cosmos.services.job_service import JobService, ProgressReporter
from cosmos.services.object_service import CreateObjectCommand, ObjectService
from cosmos.services.serialization import object_payload

PROCESSING_JOB = "Knowledge Processing"
CAPTURE_MODES = frozenset({"quick", "rant", "form", "file"})


class KnowledgeService:
    """Capture, immutable source preservation, versioning and Archive queries."""

    def __init__(
        self,
        persistence: SQLitePersistence,
        objects: ObjectService,
        versions: KnowledgeVersionRepository,
        drafts: CaptureDraftRepository,
        jobs: JobService,
    ) -> None:
        self._persistence = persistence
        self._objects = objects
        self._versions = versions
        self._drafts = drafts
        self._jobs = jobs
        jobs.register_handler(PROCESSING_JOB, self._process)

    def save_draft(
        self,
        draft_id: str,
        *,
        mode: str,
        content: str,
        attachments: list[JSONValue],
        context: RuntimeContext,
    ) -> dict[str, JSONValue]:
        require_permission(context.permissions, "drafts.write")
        workspace_id = _workspace_id(context)
        normalized_mode = _capture_mode(mode)
        _validate_attachments(attachments)
        existing = self._drafts.get(draft_id)
        if existing is not None and existing.workspace_session_id != workspace_id:
            raise RuntimeServiceError("capture_draft_not_found", f"Capture draft not found: {draft_id}")
        value = CaptureDraftRecord(
            draft_id=draft_id,
            project_id=context.focused_project_id,
            workspace_session_id=workspace_id,
            mode=normalized_mode,
            content=content,
            attachments=attachments,
            updated_at=datetime.now(UTC),
        )
        self._drafts.save(value)
        return _draft_payload(value)

    def list_drafts(self, context: RuntimeContext) -> list[dict[str, JSONValue]]:
        require_permission(context.permissions, "drafts.read")
        return [_draft_payload(value) for value in self._drafts.list_for_workspace(_workspace_id(context))]

    def delete_draft(self, draft_id: str, context: RuntimeContext) -> None:
        require_permission(context.permissions, "drafts.write")
        existing = self._drafts.get(draft_id)
        if existing is None or existing.workspace_session_id != _workspace_id(context):
            raise RuntimeServiceError("capture_draft_not_found", f"Capture draft not found: {draft_id}")
        self._drafts.delete(draft_id)

    def submit_capture(
        self,
        *,
        mode: str,
        content: str,
        attachments: list[JSONValue],
        context: RuntimeContext,
        draft_id: str | None = None,
    ) -> dict[str, JSONValue]:
        require_permission(context.permissions, "knowledge.write")
        normalized_mode = _capture_mode(mode)
        _validate_attachments(attachments)
        if not content.strip() and not attachments:
            raise RuntimeServiceError("validation_failed", "Capture requires content or an attachment.")
        now = datetime.now(UTC)
        knowledge_id = f"cosmos.knowledge.{uuid4()}"
        title = _title(content)
        source = {
            "content": content,
            "attachments": attachments,
            "capturedAt": now.isoformat(),
            "mode": normalized_mode,
        }
        project_ids = list(context.project_scope_ids)
        command = CreateObjectCommand(
            identity=ObjectIdentity(
                object_id=knowledge_id,
                display_name=title,
                description="Captured Knowledge awaiting processing.",
                creator="cosmos.capture",
                lifecycle_state="active",
                created_at=now,
            ),
            system_tags=frozenset({"Knowledge", "Capture"}),
            properties={
                "title": title,
                "current_content": content,
                "summary": "",
                "current_version": 1,
                "source_type": "Capture",
                "source_reference": "",
                "original_source": source,
                "project_ids": project_ids,
                "attachments": attachments,
                "capture_mode": normalized_mode,
                "submitted_at": now.isoformat(),
                "inherited_context": _context_payload(context),
                "processed_status": "stored",
                "author": "cosmos.local-owner",
            },
            primary_project_id=context.focused_project_id,
        )
        value = self._objects.build(command, context)
        version = KnowledgeVersionRecord(
            knowledge_id=knowledge_id,
            version_number=1,
            title=title,
            content=content,
            summary="",
            source_type="Capture",
            source_reference="",
            author="cosmos.local-owner",
            metadata={"captureMode": normalized_mode, "attachments": attachments},
            created_at=now,
        )
        with self._persistence.connect() as connection:
            self._objects.repository.insert(value, connection)
            self._versions.append(version, connection)
        self._objects.publish_created(value, context)
        job = self._jobs.create(
            PROCESSING_JOB,
            {"knowledgeId": knowledge_id},
            replace(
                context,
                object_id=knowledge_id,
                knowledge_id=knowledge_id,
                system_tags=context.system_tags | value.system_tags,
                user_tags=context.user_tags | value.user_tags,
            ),
            creating_service="knowledge-service",
            resumable=True,
        )
        if draft_id is not None:
            existing = self._drafts.get(draft_id)
            if existing is not None and existing.workspace_session_id == _workspace_id(context):
                self._drafts.delete(draft_id)
        return {"knowledge": self._knowledge_payload(value), "job": job}

    def list(self, context: RuntimeContext, query: str = "") -> list[dict[str, JSONValue]]:
        require_permission(context.permissions, "knowledge.read")
        needle = query.casefold().strip()
        values = []
        for value in self._objects.list(context, system_tag="Knowledge"):
            if not _visible(value, context):
                continue
            haystack = " ".join(
                (
                    value.identity.display_name,
                    str(value.properties["current_content"]),
                    str(value.properties["summary"]),
                )
            ).casefold()
            if not needle or needle in haystack:
                values.append(self._knowledge_payload(value))
        return values

    def get(self, knowledge_id: str, context: RuntimeContext) -> dict[str, JSONValue]:
        require_permission(context.permissions, "knowledge.read")
        value = self._knowledge(knowledge_id, context)
        return self._knowledge_payload(value, include_versions=True)

    def edit(
        self,
        knowledge_id: str,
        *,
        title: str,
        content: str,
        summary: str,
        context: RuntimeContext,
    ) -> dict[str, JSONValue]:
        require_permission(context.permissions, "knowledge.write")
        value = self._knowledge(knowledge_id, context)
        if not title.strip():
            raise RuntimeServiceError("validation_failed", "Knowledge title must not be empty.")
        version_number = int(value.properties["current_version"]) + 1
        properties = dict(value.properties)
        properties.update(
            {
                "title": title.strip(),
                "current_content": content,
                "summary": summary,
                "current_version": version_number,
                "processed_status": "edited",
            }
        )
        updated = self._objects.contract.build(
            value.identity,
            value.system_tags,
            properties,
            user_tags=value.user_tags,
            primary_project_id=value.primary_project_id,
        )
        version = KnowledgeVersionRecord(
            knowledge_id=knowledge_id,
            version_number=version_number,
            title=title.strip(),
            content=content,
            summary=summary,
            source_type=str(value.properties["source_type"]),
            source_reference=str(value.properties["source_reference"]),
            author="cosmos.local-owner",
            metadata={"reason": "inline-edit"},
            created_at=datetime.now(UTC),
        )
        with self._persistence.connect() as connection:
            self._objects.repository.replace_properties(updated, connection)
            self._versions.append(version, connection)
        detailed = self._objects.update_details(
            knowledge_id,
            display_name=title.strip(),
            description=summary,
            context=context,
        )
        return self._knowledge_payload(detailed, include_versions=True)

    def _knowledge(self, knowledge_id: str, context: RuntimeContext) -> CosmosObject:
        value = self._objects.get(knowledge_id, context)
        if "Knowledge" not in value.system_tags or not _visible(value, context):
            raise RuntimeServiceError("knowledge_not_found", f"Knowledge not found: {knowledge_id}")
        return value

    def _process(
        self,
        payload: Mapping[str, JSONValue],
        context: RuntimeContext,
        report: ProgressReporter,
    ) -> JSONValue:
        knowledge_id = str(payload["knowledgeId"])
        value = self._objects.repository.get(knowledge_id)
        if value is None:
            raise RuntimeServiceError("knowledge_not_found", f"Knowledge not found: {knowledge_id}")
        report(0.35)
        content = str(value.properties["current_content"])
        words = re.findall(r"[\w'-]+", content.casefold())
        keywords = sorted({word for word in words if len(word) >= 6})[:8]
        summary = " ".join(content.strip().split())[:240]
        title = _title(content)
        version_number = int(value.properties["current_version"]) + 1
        properties = dict(value.properties)
        properties.update(
            {
                "title": title,
                "summary": summary,
                "current_version": version_number,
                "processed_status": "processed",
                "object_ids": list(value.properties["object_ids"]),
            }
        )
        updated = self._objects.contract.build(
            value.identity,
            value.system_tags,
            properties,
            user_tags=value.user_tags,
            primary_project_id=value.primary_project_id,
        )
        version = KnowledgeVersionRecord(
            knowledge_id=knowledge_id,
            version_number=version_number,
            title=title,
            content=content,
            summary=summary,
            source_type=str(value.properties["source_type"]),
            source_reference=str(value.properties["source_reference"]),
            author="cosmos.knowledge-processor",
            metadata={"wordCount": len(words), "keywords": keywords},
            created_at=datetime.now(UTC),
        )
        with self._persistence.connect() as connection:
            self._objects.repository.replace_properties(updated, connection)
            self._versions.append(version, connection)
        report(0.9)
        return {"knowledgeId": knowledge_id, "version": version_number, "keywords": keywords}

    def _knowledge_payload(
        self, value: CosmosObject, *, include_versions: bool = False
    ) -> dict[str, JSONValue]:
        payload: dict[str, JSONValue] = {
            **object_payload(value),
            "primaryProjectId": value.primary_project_id,
            **dict(value.properties),
        }
        if include_versions:
            payload["versions"] = [
                _version_payload(item) for item in self._versions.list(value.identity.object_id)
            ]
        return payload


def _visible(value: CosmosObject, context: RuntimeContext) -> bool:
    project_ids = {str(item) for item in value.properties.get("project_ids", [])}
    return not context.project_scope_ids or bool(project_ids.intersection(context.project_scope_ids))


def _workspace_id(context: RuntimeContext) -> str:
    if not context.workspace_session_id:
        raise RuntimeServiceError("validation_failed", "Capture requires an active Workspace session.")
    return context.workspace_session_id


def _capture_mode(mode: str) -> str:
    normalized = mode.strip().casefold()
    if normalized not in CAPTURE_MODES:
        raise RuntimeServiceError("validation_failed", f"Unsupported Capture mode: {mode}")
    return normalized


def _validate_attachments(attachments: list[JSONValue]) -> None:
    if len(attachments) > 10:
        raise RuntimeServiceError("validation_failed", "Capture supports at most ten attachments.")
    if sum(len(str(value)) for value in attachments) > 7_000_000:
        raise RuntimeServiceError("validation_failed", "Capture attachments exceed the Version 1 limit.")


def _title(content: str) -> str:
    first_line = next((line.strip() for line in content.splitlines() if line.strip()), "Untitled Capture")
    return first_line[:100]


def _context_payload(context: RuntimeContext) -> dict[str, JSONValue]:
    return {
        "projectScopeIds": list(context.project_scope_ids),
        "focusedProjectId": context.focused_project_id,
        "roomId": context.room_id,
        "workspaceSessionId": context.workspace_session_id,
    }


def _draft_payload(value: CaptureDraftRecord) -> dict[str, JSONValue]:
    return {
        "draftId": value.draft_id,
        "projectId": value.project_id,
        "workspaceSessionId": value.workspace_session_id,
        "mode": value.mode,
        "content": value.content,
        "attachments": value.attachments,
        "updatedAt": value.updated_at.isoformat(),
    }


def _version_payload(value: KnowledgeVersionRecord) -> dict[str, JSONValue]:
    return {
        "version": value.version_number,
        "title": value.title,
        "content": value.content,
        "summary": value.summary,
        "sourceType": value.source_type,
        "sourceReference": value.source_reference,
        "author": value.author,
        "metadata": value.metadata,
        "createdAt": value.created_at.isoformat(),
    }
