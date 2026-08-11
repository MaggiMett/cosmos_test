from __future__ import annotations

import json
from dataclasses import dataclass

from cosmos.extensions.discovery import ExtensionPackageCandidate
from cosmos.extensions.manifests import ExtensionManifest, ManifestValidationError
from cosmos.runtime import Registry


SUPPORTED_RUNTIME_API_VERSIONS = frozenset({"1"})
KNOWN_PERMISSIONS = frozenset(
    f"{resource}.{action}"
    for resource in (
        "objects",
        "tags",
        "projects",
        "relationships",
        "runtime_state",
        "tools",
        "workspaces",
        "resources",
        "knowledge",
        "drafts",
        "reviews",
        "jobs",
        "journeyman",
        "notifications",
    )
    for action in ("read", "write")
)


@dataclass(frozen=True, slots=True)
class ExtensionValidationResult:
    candidate: ExtensionPackageCandidate
    manifest: ExtensionManifest | None
    errors: tuple[str, ...]

    @property
    def valid(self) -> bool:
        return self.manifest is not None and not self.errors


class ExtensionValidator:
    """Static V1 package validation; never executes or registers Extension code."""

    def __init__(self, registry: Registry) -> None:
        self._registry = registry

    def validate(self, candidate: ExtensionPackageCandidate) -> ExtensionValidationResult:
        try:
            raw = json.loads(candidate.manifest_path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError) as error:
            return ExtensionValidationResult(candidate, None, (f"Manifest could not be read as JSON: {error}",))
        if not isinstance(raw, dict):
            return ExtensionValidationResult(candidate, None, ("Extension manifest root must be an object.",))
        try:
            manifest = ExtensionManifest.from_mapping(raw)
        except (ManifestValidationError, TypeError, ValueError) as error:
            return ExtensionValidationResult(candidate, None, (str(error),))

        errors: list[str] = []
        if manifest.runtime_api_version not in SUPPORTED_RUNTIME_API_VERSIONS:
            errors.append(f"Unsupported Extension runtime API version: {manifest.runtime_api_version}")
        unknown_permissions = manifest.permissions - KNOWN_PERMISSIONS
        if unknown_permissions:
            errors.append("Unknown Extension permissions: " + ", ".join(sorted(unknown_permissions)))
        if manifest.extension_id in manifest.dependencies:
            errors.append("Extension must not depend on itself.")
        try:
            self._registry.resolve(manifest.extension_id)
        except KeyError:
            pass
        else:
            errors.append(f"Registry component ID already exists: {manifest.extension_id}")

        return ExtensionValidationResult(candidate, manifest, tuple(errors))
