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
        if manifest.runtime_kind is not None and manifest.runtime_kind.value == "web":
            allowed_web_configuration = {"sandbox"}
            unknown_configuration = set(manifest.runtime_configuration) - allowed_web_configuration
            if unknown_configuration:
                errors.append(
                    "Unknown Web runtime configuration: " + ", ".join(sorted(unknown_configuration))
                )
            sandbox = manifest.runtime_configuration.get("sandbox", [])
            allowed_sandbox = {
                "forms",
                "modals",
                "popups",
                "same-origin",
                "scripts",
            }
            if not isinstance(sandbox, list) or not all(isinstance(item, str) for item in sandbox):
                errors.append("Web runtime sandbox must be an array of capability names.")
            else:
                unknown_sandbox = set(sandbox) - allowed_sandbox
                if unknown_sandbox:
                    errors.append(
                        "Unknown Web sandbox capabilities: " + ", ".join(sorted(unknown_sandbox))
                    )
        if manifest.extension_id in manifest.dependencies:
            errors.append("Extension must not depend on itself.")
        try:
            self._registry.resolve(manifest.extension_id)
        except KeyError:
            pass
        else:
            errors.append(f"Registry component ID already exists: {manifest.extension_id}")

        return ExtensionValidationResult(candidate, manifest, tuple(errors))
