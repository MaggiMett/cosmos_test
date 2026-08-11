from __future__ import annotations

import base64
import hashlib
import mimetypes
import os
import sqlite3
import tempfile
from datetime import UTC, datetime
from pathlib import Path

from cosmos.domain.objects import JSONValue
from cosmos.persistence import AssetCatalogRepository, SQLitePersistence
from cosmos.runtime import ContextSnapshot, EventDispatcher, RuntimeContext, RuntimeEvent
from cosmos.services.asset_catalog_validation import (
    expected_visual_asset_path,
    validate_asset_catalog_promotion,
)
from cosmos.services.errors import RuntimeServiceError, require_permission
from cosmos.services.object_service import ObjectService
from cosmos.services.project_service import ProjectService

_TEXT_EXTENSIONS = {
    ".css",
    ".csv",
    ".html",
    ".ini",
    ".js",
    ".json",
    ".jsx",
    ".md",
    ".markdown",
    ".py",
    ".toml",
    ".ts",
    ".tsx",
    ".txt",
    ".vue",
    ".xml",
    ".yaml",
    ".yml",
}
_IMAGE_EXTENSIONS = {".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"}
_MAX_TEXT_BYTES = 1_000_000
_MAX_IMAGE_BYTES = 5_000_000


class ResourceService:
    """Authoritative project-scoped physical file command boundary."""

    def __init__(
        self,
        projects: ProjectService,
        objects: ObjectService,
        events: EventDispatcher,
        persistence: SQLitePersistence,
        asset_catalog: AssetCatalogRepository,
        runtime_path: Path,
    ) -> None:
        self._projects = projects
        self._objects = objects
        self._events = events
        self._persistence = persistence
        self._asset_catalog = asset_catalog
        self._runtime_resource_root = Path(runtime_path) / "Resources"

    def promote_visual_asset(
        self,
        visual_asset_value: object,
        catalog_entry_value: object,
        original_bytes: bytes,
        context: RuntimeContext,
    ) -> dict[str, JSONValue]:
        """Persist one validated static resource and its immutable catalog metadata."""
        require_permission(context.permissions, "resources.write")
        visual_asset, catalog_entry = validate_asset_catalog_promotion(
            visual_asset_value,
            catalog_entry_value,
            original_bytes,
        )
        resource_path = expected_visual_asset_path(visual_asset)
        final_path = self._resolve_asset_resource(resource_path)
        final_path.parent.mkdir(parents=True, exist_ok=True)

        existing_resource = final_path.is_file()
        if existing_resource and _file_hash(final_path) != visual_asset["sha256"]:
            raise RuntimeServiceError(
                "resource_conflict",
                "The canonical Visual Asset Resource path already contains different bytes.",
            )

        staged_path = None if existing_resource else self._stage_asset_bytes(final_path, original_bytes)
        finalized = False
        try:
            with self._persistence.connect() as connection:
                connection.execute("BEGIN")
                self._asset_catalog.insert_promotion(
                    visual_asset,
                    catalog_entry,
                    resource_path,
                    datetime.now(UTC),
                    connection,
                )
                if staged_path is not None:
                    self._finalize_staged_asset(staged_path, final_path)
                    finalized = True
                connection.commit()
        except sqlite3.IntegrityError as error:
            if finalized:
                final_path.unlink(missing_ok=True)
            raise RuntimeServiceError(
                "asset_catalog_conflict",
                "The Visual Asset or Catalog Entry identity and version already exists.",
            ) from error
        except OSError as error:
            if finalized:
                final_path.unlink(missing_ok=True)
            raise RuntimeServiceError(
                "asset_storage_failed",
                "The original asset bytes could not be stored. The draft was not cataloged; retry is safe.",
            ) from error
        finally:
            if staged_path is not None:
                staged_path.unlink(missing_ok=True)

        self._publish_asset_promoted(visual_asset, catalog_entry, context)
        return self._catalog_payload(visual_asset, catalog_entry, resource_path)

    def list_asset_catalog(self, context: RuntimeContext) -> list[dict[str, JSONValue]]:
        require_permission(context.permissions, "resources.read")
        return [
            self._catalog_payload(
                record["visualAsset"],
                record["catalogEntry"],
                str(record["resourcePath"]),
            )
            for record in self._asset_catalog.list_catalog()
        ]

    def read_visual_asset(
        self,
        asset_id: str,
        version: str,
        context: RuntimeContext,
    ) -> tuple[bytes, str, str]:
        require_permission(context.permissions, "resources.read")
        record = self._asset_catalog.get_visual_asset(asset_id, version)
        if record is None:
            raise RuntimeServiceError(
                "visual_asset_not_found",
                f'Visual Asset "{asset_id}@{version}" is not cataloged.',
            )
        visual_asset = record["visualAsset"]
        if not isinstance(visual_asset, dict):
            raise RuntimeServiceError("resource_invalid", "Stored Visual Asset metadata is invalid.")
        path = self._resolve_asset_resource(str(record["resourcePath"]))
        if not path.is_file():
            raise RuntimeServiceError(
                "resource_not_found",
                f'The original Resource for Visual Asset "{asset_id}@{version}" is missing.',
            )
        try:
            content = path.read_bytes()
        except OSError as error:
            raise RuntimeServiceError(
                "resource_not_found",
                f'The original Resource for Visual Asset "{asset_id}@{version}" cannot be read.',
            ) from error
        digest = hashlib.sha256(content).hexdigest()
        if digest != visual_asset.get("sha256"):
            raise RuntimeServiceError(
                "resource_invalid",
                f'The original Resource for Visual Asset "{asset_id}@{version}" failed integrity validation.',
            )
        return content, str(visual_asset["mimeType"]), digest

    def tree(self, context: RuntimeContext, query: str = "") -> dict[str, JSONValue]:
        require_permission(context.permissions, "resources.read")
        project_id, root = self._root(context)
        needle = query.strip().casefold()
        return {
            "projectId": project_id,
            "rootName": "Files",
            "query": query.strip(),
            "tree": self._directory_node(root, root, needle),
        }

    def read(self, relative_path: str, context: RuntimeContext) -> dict[str, JSONValue]:
        require_permission(context.permissions, "resources.read")
        project_id, root = self._root(context)
        path = self._resolve(root, relative_path)
        if not path.is_file():
            raise RuntimeServiceError("resource_not_found", f"Project file not found: {relative_path}")
        stat = path.stat()
        suffix = path.suffix.casefold()
        metadata = self._metadata(path, root)
        if suffix in _TEXT_EXTENSIONS:
            if stat.st_size > _MAX_TEXT_BYTES:
                return self._unsupported(project_id, metadata, "Text preview exceeds the 1 MB limit.")
            try:
                content = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                return self._unsupported(project_id, metadata, "File is not valid UTF-8 text.")
            return {
                "projectId": project_id,
                "metadata": metadata,
                "contentType": "text",
                "content": content,
                "dataUrl": None,
                "editable": True,
                "supported": True,
                "message": None,
            }
        if suffix in _IMAGE_EXTENSIONS and stat.st_size <= _MAX_IMAGE_BYTES:
            mime_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
            encoded = base64.b64encode(path.read_bytes()).decode("ascii")
            return {
                "projectId": project_id,
                "metadata": metadata,
                "contentType": "image",
                "content": None,
                "dataUrl": f"data:{mime_type};base64,{encoded}",
                "editable": False,
                "supported": True,
                "message": None,
            }
        return self._unsupported(project_id, metadata, "Preview is unavailable for this file type.")

    def create(self, relative_path: str, content: str, context: RuntimeContext) -> dict[str, JSONValue]:
        require_permission(context.permissions, "resources.write")
        project_id, root = self._root(context)
        path = self._resolve(root, relative_path)
        if path.exists():
            raise RuntimeServiceError("resource_exists", f"Project file already exists: {relative_path}")
        if not path.parent.is_dir():
            raise RuntimeServiceError("validation_failed", "The destination directory does not exist.")
        self._atomic_write(path, content)
        self._publish("ResourceCreated", project_id, relative_path, context)
        return self.read(relative_path, context)

    def edit(
        self,
        relative_path: str,
        content: str,
        expected_hash: str,
        context: RuntimeContext,
    ) -> dict[str, JSONValue]:
        require_permission(context.permissions, "resources.write")
        project_id, root = self._root(context)
        path = self._resolve(root, relative_path)
        if not path.is_file():
            raise RuntimeServiceError("resource_not_found", f"Project file not found: {relative_path}")
        if path.suffix.casefold() not in _TEXT_EXTENSIONS:
            raise RuntimeServiceError("validation_failed", "Only supported UTF-8 text files can be edited.")
        current_hash = _file_hash(path)
        if not expected_hash or current_hash != expected_hash:
            raise RuntimeServiceError(
                "resource_conflict", "The Project file changed after it was opened. Reload before saving."
            )
        self._atomic_write(path, content)
        self._publish("ResourceUpdated", project_id, relative_path, context)
        return self.read(relative_path, context)

    def move(
        self,
        source_path: str,
        destination_path: str,
        context: RuntimeContext,
    ) -> dict[str, JSONValue]:
        require_permission(context.permissions, "resources.write")
        project_id, root = self._root(context)
        source = self._resolve(root, source_path)
        destination = self._resolve(root, destination_path)
        if not source.is_file():
            raise RuntimeServiceError("resource_not_found", f"Project file not found: {source_path}")
        if destination.exists():
            raise RuntimeServiceError("resource_exists", f"Destination already exists: {destination_path}")
        if not destination.parent.is_dir():
            raise RuntimeServiceError("validation_failed", "The destination directory does not exist.")
        source.replace(destination)
        self._publish(
            "ResourceMoved",
            project_id,
            destination_path,
            context,
            {"sourcePath": source_path},
        )
        return self.read(destination_path, context)

    def delete(self, relative_path: str, context: RuntimeContext) -> dict[str, JSONValue]:
        require_permission(context.permissions, "resources.write")
        project_id, root = self._root(context)
        path = self._resolve(root, relative_path)
        if not path.is_file():
            raise RuntimeServiceError("resource_not_found", f"Project file not found: {relative_path}")
        path.unlink()
        self._publish("ResourceDeleted", project_id, relative_path, context)
        return {"projectId": project_id, "path": _normalize_relative(relative_path), "deleted": True}

    def _root(self, context: RuntimeContext) -> tuple[str, Path]:
        project_id = context.focused_project_id
        if project_id is None or project_id not in context.project_scope_ids:
            raise RuntimeServiceError(
                "project_context_required", "Files requires one focused Project in Runtime Context."
            )
        project = self._objects.get(project_id, context)
        if "Project" not in project.system_tags:
            raise RuntimeServiceError("validation_failed", "Focused Context Object is not a Project.")
        paths = self._projects.prepared_structures(project_id, context)
        root = paths.get("Files")
        if root is None:
            raise RuntimeServiceError("resource_root_not_found", "Project Files root is unavailable.")
        resolved = root.resolve()
        if not resolved.is_dir():
            raise RuntimeServiceError("resource_root_not_found", "Project Files root is unavailable.")
        return project_id, resolved

    def _catalog_payload(
        self,
        visual_asset: object,
        catalog_entry: object,
        resource_path: str,
    ) -> dict[str, JSONValue]:
        if not isinstance(visual_asset, dict) or not isinstance(catalog_entry, dict):
            raise RuntimeServiceError("resource_invalid", "Stored Asset Catalog metadata is invalid.")
        path = self._resolve_asset_resource(resource_path)
        available = path.is_file()
        if available:
            try:
                available = _file_hash(path) == visual_asset.get("sha256")
            except OSError:
                available = False
        return {
            "visualAsset": visual_asset,
            "catalogEntry": catalog_entry,
            "resource": {
                "available": available,
                "contentPath": (
                    f"/asset-catalog/visual-assets/{visual_asset['id']}/"
                    f"versions/{visual_asset['version']}/content"
                ),
            },
        }

    def _resolve_asset_resource(self, resource_path: str) -> Path:
        root = self._runtime_resource_root.resolve()
        candidate = (root / Path(resource_path)).resolve()
        if candidate == root or root not in candidate.parents:
            raise RuntimeServiceError(
                "resource_invalid",
                "Stored Visual Asset Resource path escaped the Runtime Resource root.",
            )
        return candidate

    @staticmethod
    def _stage_asset_bytes(final_path: Path, content: bytes) -> Path:
        descriptor, temporary_name = tempfile.mkstemp(prefix=f".{final_path.name}.", dir=final_path.parent)
        temporary = Path(temporary_name)
        try:
            with os.fdopen(descriptor, "wb") as stream:
                stream.write(content)
                stream.flush()
                os.fsync(stream.fileno())
        except Exception:
            temporary.unlink(missing_ok=True)
            raise
        return temporary

    @staticmethod
    def _finalize_staged_asset(staged_path: Path, final_path: Path) -> None:
        os.replace(staged_path, final_path)

    def _publish_asset_promoted(
        self,
        visual_asset: dict[str, JSONValue],
        catalog_entry: dict[str, JSONValue],
        context: RuntimeContext,
    ) -> None:
        self._events.publish(
            RuntimeEvent.create(
                "AssetCatalogEntryCreated",
                context=ContextSnapshot.capture(context, "cosmos.local-owner"),
                origin_service="ResourceService",
                affected_object_ids=(),
                metadata={
                    "visualAssetId": visual_asset["id"],
                    "visualAssetVersion": visual_asset["version"],
                    "catalogEntryId": catalog_entry["id"],
                    "catalogEntryVersion": catalog_entry["version"],
                },
            )
        )

    @staticmethod
    def _resolve(root: Path, relative_path: str) -> Path:
        if not isinstance(relative_path, str) or "\x00" in relative_path:
            raise RuntimeServiceError("validation_failed", "Project file path is invalid.")
        normalized = relative_path.strip().replace("\\", "/")
        candidate_relative = Path(normalized)
        if not normalized or candidate_relative.is_absolute() or ".." in candidate_relative.parts:
            raise RuntimeServiceError("validation_failed", "Project file path must remain relative.")
        candidate = (root / candidate_relative).resolve()
        if candidate == root or root not in candidate.parents:
            raise RuntimeServiceError("validation_failed", "Project file path escaped the active Project.")
        return candidate

    def _directory_node(self, directory: Path, root: Path, query: str) -> dict[str, JSONValue]:
        children: list[dict[str, JSONValue]] = []
        for child in sorted(directory.iterdir(), key=lambda item: (not item.is_dir(), item.name.casefold())):
            try:
                resolved = child.resolve()
            except OSError:
                continue
            if resolved != root and root not in resolved.parents:
                continue
            if child.is_dir():
                node = self._directory_node(child, root, query)
                if not query or node["children"]:
                    children.append(node)
            elif child.is_file() and (not query or query in child.name.casefold()):
                children.append({**self._metadata(child, root), "children": None})
        return {
            "name": directory.name,
            "path": "" if directory == root else directory.relative_to(root).as_posix(),
            "type": "directory",
            "children": children,
        }

    @staticmethod
    def _metadata(path: Path, root: Path) -> dict[str, JSONValue]:
        stat = path.stat()
        return {
            "name": path.name,
            "path": path.relative_to(root).as_posix(),
            "type": "file",
            "sizeBytes": stat.st_size,
            "modifiedAt": datetime.fromtimestamp(stat.st_mtime, UTC).isoformat(),
            "extension": path.suffix.casefold(),
            "mimeType": mimetypes.guess_type(path.name)[0],
            "editable": path.suffix.casefold() in _TEXT_EXTENSIONS,
            "contentHash": _file_hash(path),
        }

    @staticmethod
    def _unsupported(project_id: str, metadata: dict[str, JSONValue], message: str) -> dict[str, JSONValue]:
        return {
            "projectId": project_id,
            "metadata": metadata,
            "contentType": "binary",
            "content": None,
            "dataUrl": None,
            "editable": False,
            "supported": False,
            "message": message,
        }

    @staticmethod
    def _atomic_write(path: Path, content: str) -> None:
        if not isinstance(content, str):
            raise RuntimeServiceError("validation_failed", "Project file content must be text.")
        descriptor, temporary_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
        temporary = Path(temporary_name)
        try:
            with os.fdopen(descriptor, "w", encoding="utf-8", newline="") as stream:
                stream.write(content)
                stream.flush()
                os.fsync(stream.fileno())
            os.replace(temporary, path)
        finally:
            if temporary.exists():
                temporary.unlink()

    def _publish(
        self,
        event_type: str,
        project_id: str,
        relative_path: str,
        context: RuntimeContext,
        extra: dict[str, JSONValue] | None = None,
    ) -> None:
        self._events.publish(
            RuntimeEvent.create(
                event_type,
                context=ContextSnapshot.capture(context, "cosmos.local-owner"),
                origin_service="ResourceService",
                affected_object_ids=(project_id,),
                metadata={"path": _normalize_relative(relative_path), **(extra or {})},
            )
        )


def _file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _normalize_relative(value: str) -> str:
    return Path(value.replace("\\", "/")).as_posix()
