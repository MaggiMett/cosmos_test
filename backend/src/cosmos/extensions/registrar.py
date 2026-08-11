from __future__ import annotations

from datetime import UTC, datetime

from cosmos.domain import ObjectIdentity
from cosmos.extensions.manifests import ExtensionCategory, ExtensionManifest
from cosmos.runtime import Registry, RegistryEntry, RegistryStatus, RuntimeContext
from cosmos.services.errors import RuntimeServiceError, require_permission
from cosmos.services.object_service import CreateObjectCommand, ObjectService


class ExtensionRegistrar:
    """Registers validated Extension manifests into existing Cosmos Object and Registry systems."""

    def __init__(self, objects: ObjectService, registry: Registry) -> None:
        self._objects = objects
        self._registry = registry

    def register_tool(self, manifest: ExtensionManifest, context: RuntimeContext) -> RegistryEntry:
        if manifest.category not in {ExtensionCategory.USER_TOOL, ExtensionCategory.SYSTEM_TOOL}:
            raise RuntimeServiceError("validation_failed", "Extension is not a Tool Extension.")
        if manifest.runtime_kind is None:
            raise RuntimeServiceError("validation_failed", "Tool Extension runtime kind is required.")

        entry_point = manifest.entry_points["tool"]
        tool = self._ensure_tool_object(manifest, entry_point, context)
        try:
            entry = self._registry.register(
                RegistryEntry(
                    component_id=manifest.extension_id,
                    display_name=manifest.display_name,
                    category="tool",
                    version=manifest.version,
                    runtime_api_version=manifest.runtime_api_version,
                    source_extension_id=manifest.extension_id,
                    capabilities=manifest.capabilities,
                    permissions=manifest.permissions,
                    entry_point=entry_point,
                    object_id=tool.identity.object_id,
                )
            )
        except ValueError as error:
            raise RuntimeServiceError("extension_already_registered", str(error)) from error
        return self._registry.activate(entry.component_id)

    def disable_tool(self, extension_id: str, context: RuntimeContext) -> RegistryEntry:
        require_permission(context.permissions, "tools.write")
        entry = self._tool_entry(extension_id)
        return self._registry.disable(entry.component_id)

    def enable_tool(self, extension_id: str, context: RuntimeContext) -> RegistryEntry:
        require_permission(context.permissions, "tools.write")
        entry = self._tool_entry(extension_id)
        return self._registry.activate(entry.component_id)

    def _tool_entry(self, extension_id: str) -> RegistryEntry:
        try:
            entry = self._registry.resolve(extension_id)
        except KeyError as error:
            raise RuntimeServiceError(
                "extension_not_found", f"Tool Extension not found: {extension_id}"
            ) from error
        if entry.category != "tool" or entry.source_extension_id != extension_id:
            raise RuntimeServiceError("extension_not_found", f"Tool Extension not found: {extension_id}")
        return entry

    def _ensure_tool_object(
        self, manifest: ExtensionManifest, entry_point: str, context: RuntimeContext
    ):
        existing = self._objects.repository.get(manifest.extension_id)
        if existing is not None:
            if "Tool" not in existing.system_tags:
                raise RuntimeServiceError(
                    "extension_object_conflict",
                    f"Extension Object is not a Tool: {manifest.extension_id}",
                )
            return existing
        return self._objects.create(
            CreateObjectCommand(
                identity=ObjectIdentity(
                    object_id=manifest.extension_id,
                    display_name=manifest.display_name,
                    description=f"Tool Extension {manifest.display_name}",
                    creator=manifest.extension_id,
                    lifecycle_state="active",
                    created_at=datetime.now(UTC),
                ),
                system_tags=frozenset({"Tool"}),
                properties={
                    "category": "SystemTool" if manifest.category is ExtensionCategory.SYSTEM_TOOL else "UserTool",
                    "component_id": manifest.extension_id,
                    "version": manifest.version,
                    "entry_point": entry_point,
                    "runtime_kind": manifest.runtime_kind.value,
                    "icon": "Extension",
                    "capabilities": sorted(manifest.capabilities),
                    "permissions": sorted(manifest.permissions),
                    "minimum_window_size": {"width": 320, "height": 240},
                },
            ),
            context,
        )
