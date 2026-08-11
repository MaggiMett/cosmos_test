from __future__ import annotations

import re
from collections.abc import Mapping
from dataclasses import dataclass
from enum import StrEnum
from typing import Any

from cosmos.runtime.tool_adapters import ToolRuntimeKind, tool_entry_point_error


class ManifestValidationError(ValueError):
    pass


class ExtensionCategory(StrEnum):
    USER_TOOL = "user-tool"
    SYSTEM_TOOL = "system-tool"
    ENTITY = "entity"
    CAPABILITY_BUNDLE = "capability-bundle"
    THEME = "theme"
    WORKSPACE_BLUEPRINT = "workspace-blueprint"
    OBJECT_BLUEPRINT = "object-blueprint"
    CAPTURE_TEMPLATE = "capture-template"
    PROVIDER = "provider"
    INTEGRATION = "integration"


class ExtensionRuntimeKind(StrEnum):
    NATIVE = "native"
    WEB = "web"
    SERVICE = "service"
    DESKTOP = "desktop"
    COMMAND = "command"


_ID_PATTERN = re.compile(r"^[a-z0-9]+(?:[.-][a-z0-9]+)+$")


@dataclass(frozen=True, slots=True)
class ExtensionManifest:
    extension_id: str
    display_name: str
    version: str
    category: ExtensionCategory
    runtime_api_version: str
    runtime_kind: ExtensionRuntimeKind | None
    permissions: frozenset[str]
    capabilities: frozenset[str]
    dependencies: tuple[str, ...]
    entry_points: Mapping[str, str]

    @classmethod
    def from_mapping(cls, value: Mapping[str, Any]) -> ExtensionManifest:
        required = {"id", "display_name", "version", "category", "runtime_api_version"}
        missing = sorted(required.difference(value))
        if missing:
            raise ManifestValidationError(f"Manifest fields are required: {', '.join(missing)}")

        extension_id = str(value["id"])
        if not _ID_PATTERN.fullmatch(extension_id):
            raise ManifestValidationError("Extension ID must be a lowercase dotted or hyphenated namespace.")

        try:
            category = ExtensionCategory(str(value["category"]))
        except ValueError as error:
            raise ManifestValidationError(f"Unsupported Extension category: {value['category']}") from error

        entry_points = value.get("entry_points", {})
        if not isinstance(entry_points, Mapping):
            raise ManifestValidationError("entry_points must be an object.")

        runtime_kind_value = value.get("runtime_kind")
        try:
            runtime_kind = (
                ExtensionRuntimeKind(str(runtime_kind_value)) if runtime_kind_value is not None else None
            )
        except ValueError as error:
            raise ManifestValidationError(f"Unsupported Extension runtime kind: {runtime_kind_value}") from error

        if category in {ExtensionCategory.USER_TOOL, ExtensionCategory.SYSTEM_TOOL}:
            if runtime_kind is None:
                raise ManifestValidationError("Tool Extensions require a runtime_kind.")
            tool_entry_point = entry_points.get("tool")
            if not isinstance(tool_entry_point, str):
                raise ManifestValidationError("Tool Extensions require entry_points.tool.")
            error = tool_entry_point_error(ToolRuntimeKind(runtime_kind.value), tool_entry_point)
            if error is not None:
                raise ManifestValidationError(error)

        return cls(
            extension_id=extension_id,
            display_name=str(value["display_name"]),
            version=str(value["version"]),
            category=category,
            runtime_api_version=str(value["runtime_api_version"]),
            runtime_kind=runtime_kind,
            permissions=frozenset(str(item) for item in value.get("permissions", [])),
            capabilities=frozenset(str(item) for item in value.get("capabilities", [])),
            dependencies=tuple(str(item) for item in value.get("dependencies", [])),
            entry_points={str(key): str(item) for key, item in entry_points.items()},
        )
