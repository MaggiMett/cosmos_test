from __future__ import annotations

import hashlib
import json
import re
import sqlite3
from datetime import UTC, datetime

from cosmos.domain.objects import JSONValue
from cosmos.persistence import SQLitePersistence, ThemePackageRepository
from cosmos.runtime import RuntimeContext
from cosmos.services.errors import RuntimeServiceError, require_permission

_ID = re.compile(r"^[a-z0-9]+(?:[._-][a-z0-9]+)+$")
_SEMVER = re.compile(
    r"^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)"
    r"(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$"
)
_DIGEST = re.compile(r"^[a-f0-9]{64}$")
_INPUT_FIELDS = {
    "schemaVersion",
    "packageId",
    "packageVersion",
    "manifestDigest",
    "manifest",
    "source",
}


class ThemePackageService:
    """Persistent installation boundary; Runtime registration remains frontend-owned."""

    def __init__(
        self,
        persistence: SQLitePersistence,
        repository: ThemePackageRepository,
    ) -> None:
        self._persistence = persistence
        self._repository = repository

    def list_installed(self, context: RuntimeContext) -> list[dict[str, JSONValue]]:
        require_permission(context.permissions, "resources.read")
        return [record for record in self._repository.list()]

    def install_prevalidated(
        self,
        value: object,
        context: RuntimeContext,
    ) -> dict[str, JSONValue]:
        require_permission(context.permissions, "resources.write")
        record = validate_prevalidated_install_record(value)
        installed_at = datetime.now(UTC)
        try:
            with self._persistence.connect() as connection:
                connection.execute("BEGIN")
                self._repository.insert(record, installed_at, connection)
                connection.commit()
        except sqlite3.IntegrityError as error:
            raise RuntimeServiceError(
                "theme_package_conflict",
                f'Theme Package "{record["packageId"]}@{record["packageVersion"]}" is already installed.',
            ) from error
        return {
            **record,
            "installedAt": installed_at.isoformat(),
            "updatedAt": installed_at.isoformat(),
        }


def canonical_manifest_digest(manifest: dict[str, JSONValue]) -> str:
    encoded = json.dumps(
        manifest,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def validate_prevalidated_install_record(value: object) -> dict[str, JSONValue]:
    payload = _object(value, "Theme Package")
    if set(payload) != _INPUT_FIELDS:
        _invalid("Theme Package install record has missing or unsupported fields.")
    if payload["schemaVersion"] != 1:
        _invalid("Theme Package schemaVersion must be 1.")

    package_id = _namespaced_id(payload["packageId"], "packageId")
    package_version = _semver(payload["packageVersion"], "packageVersion")
    manifest = _object(payload["manifest"], "manifest")
    if manifest.get("schemaVersion") != 1:
        _invalid("Theme Manifest schemaVersion must be 1.")
    theme_id = _namespaced_id(manifest.get("themeId"), "manifest.themeId")
    manifest_version = _semver(manifest.get("version"), "manifest.version")
    if package_version != manifest_version:
        _invalid("packageVersion must equal manifest.version.")
    display_name = _bounded_string(manifest.get("displayName"), "manifest.displayName", 120)
    description = manifest.get("description")
    if description is not None:
        description = _bounded_string(description, "manifest.description", 2000)
    author = manifest.get("author")
    if author is not None:
        author = _object(author, "manifest.author")

    digest = _string(payload["manifestDigest"], "manifestDigest")
    if _DIGEST.fullmatch(digest) is None or canonical_manifest_digest(manifest) != digest:
        raise RuntimeServiceError(
            "theme_package_integrity_failed",
            "Theme Package manifest digest does not match its canonical manifest payload.",
        )

    source = _object(payload["source"], "source")
    if set(source) != {"kind", "provenance"} or source.get("kind") != "prevalidated":
        _invalid('Theme Package source must declare kind "prevalidated" and provenance.')
    provenance = _bounded_string(source.get("provenance"), "source.provenance", 1000)

    return {
        "schemaVersion": 1,
        "packageId": package_id,
        "packageVersion": package_version,
        "themeId": theme_id,
        "manifestVersion": 1,
        "displayName": display_name,
        "description": description,
        "author": author,
        "installStatus": "installed",
        "source": {"kind": "prevalidated", "provenance": provenance},
        "manifestDigest": digest,
        "manifest": manifest,
    }


def _object(value: object, field: str) -> dict[str, JSONValue]:
    if not isinstance(value, dict) or any(not isinstance(key, str) for key in value):
        _invalid(f"{field} must be an object.")
    return value


def _namespaced_id(value: object, field: str) -> str:
    text = _string(value, field)
    if len(text) > 200 or _ID.fullmatch(text) is None:
        _invalid(f"{field} must be a namespaced identifier.")
    return text


def _semver(value: object, field: str) -> str:
    text = _string(value, field)
    if _SEMVER.fullmatch(text) is None:
        _invalid(f"{field} must be a semantic version.")
    return text


def _bounded_string(value: object, field: str, maximum: int) -> str:
    text = _string(value, field)
    if len(text) > maximum:
        _invalid(f"{field} exceeds {maximum} characters.")
    return text


def _string(value: object, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        _invalid(f"{field} must be a non-empty string.")
    return value


def _invalid(message: str) -> None:
    raise RuntimeServiceError("validation_failed", message)
