from __future__ import annotations

import hashlib
import io
import json
import re
import zipfile
from copy import deepcopy
from datetime import UTC, datetime
from uuid import uuid4

from cosmos.domain import CosmosObject, ObjectIdentity
from cosmos.domain.objects import JSONValue
from cosmos.runtime import RuntimeContext
from cosmos.services.errors import RuntimeServiceError, require_permission
from cosmos.services.object_service import CreateObjectCommand, ObjectService
from cosmos.services.resource_service import ResourceService
from cosmos.services.asset_catalog_validation import expected_visual_asset_path
from cosmos.services.theme_package_service import canonical_manifest_digest

THEME_BUILDER_PROJECT_TAG = "ThemeBuilderProject"
THEME_BUILDER_CONTRACT_VERSION = "1.0.0"
THEME_ENGINE_CONTRACT_VERSION = "1.0.0"
INITIAL_ARTIFACT_VERSION = "0.1.0"
BUILDER_DOCUMENT_PROPERTY = "builder_document"
REVISION_CONFLICT = "theme_builder_project_revision_conflict"

_NAMESPACED_ID = re.compile(r"^[a-z0-9]+(?:[._-][a-z0-9]+)+$")
_SAFE_HEX_COLOR = re.compile(r"^#[0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{3})?(?:[0-9A-Fa-f]{2})?$")
_ALLOWED_PRESENTATION_GROUPS = {
    "world", "map", "base-entry", "base-interior", "room", "workspace",
    "window", "companion", "icon", "node", "connection", "label", "status", "ambient",
}
_ALLOWED_BINDING_FITS = {"contain", "cover", "fill", "none"}
_ALLOWED_BINDING_ALIGNMENTS = {
    "center", "top", "right", "bottom", "left", "top-left", "top-right", "bottom-left", "bottom-right",
}

_SEMVER = re.compile(
    r"^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)"
    r"(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$"
)


class ThemeBuilderService:
    """Authoritative Object-Service boundary for versioned Theme Builder projects."""

    def __init__(self, objects: ObjectService, resources: ResourceService) -> None:
        self._objects = objects
        self._resources = resources

    def create(
        self,
        *,
        name: str,
        description: str,
        author: str,
        context: RuntimeContext,
    ) -> dict[str, JSONValue]:
        require_permission(context.permissions, "drafts.write")
        metadata = _metadata(name, description, author)
        identity_suffix = uuid4().hex
        builder_project_id = f"user.theme-builder-project.{identity_suffix}"
        theme_id = f"user.theme.{identity_suffix}"
        package_id = f"user.theme-package.{identity_suffix}"
        now = datetime.now(UTC).isoformat()
        document: dict[str, JSONValue] = {
            "schemaVersion": 1,
            "builderProjectId": builder_project_id,
            "revision": 1,
            "createdAt": now,
            "updatedAt": now,
            "contractVersions": {
                "themeBuilder": THEME_BUILDER_CONTRACT_VERSION,
                "themeEngine": THEME_ENGINE_CONTRACT_VERSION,
            },
            "themeId": theme_id,
            "packageId": package_id,
            "name": metadata["name"],
            "description": metadata["description"],
            "author": metadata["author"],
            "packageType": "full-theme",
            "themeVersion": INITIAL_ARTIFACT_VERSION,
            "packageVersion": INITIAL_ARTIFACT_VERSION,
            "manifestDraft": _manifest_draft(theme_id, metadata),
            "artifacts": {
                "skinPacks": [],
                "roomShells": [],
                "catalogObjects": [],
            },
            "assetRefs": [],
        }
        _validate_document(document, builder_project_id)
        value = self._objects.create(
            CreateObjectCommand(
                identity=ObjectIdentity(
                    object_id=builder_project_id,
                    display_name=str(metadata["name"]),
                    description=str(metadata["description"]),
                    creator="cosmos.theme-builder",
                    lifecycle_state="draft",
                    created_at=datetime.now(UTC),
                ),
                system_tags=frozenset({THEME_BUILDER_PROJECT_TAG}),
                properties={BUILDER_DOCUMENT_PROPERTY: document},
            ),
            context,
        )
        return _document_payload(value)

    def get(self, builder_project_id: str, context: RuntimeContext) -> dict[str, JSONValue]:
        require_permission(context.permissions, "drafts.read")
        return _document_payload(self._project(builder_project_id, context))

    def list(self, context: RuntimeContext) -> list[dict[str, JSONValue]]:
        require_permission(context.permissions, "drafts.read")
        return sorted(
            (
                _document_payload(value)
                for value in self._objects.list(context, system_tag=THEME_BUILDER_PROJECT_TAG)
            ),
            key=lambda document: (str(document["createdAt"]), str(document["builderProjectId"])),
        )

    def save_draft(
        self,
        builder_project_id: str,
        *,
        expected_revision: int,
        name: str,
        description: str,
        author: str,
        asset_refs: list[object],
        artifacts: object | None,
        context: RuntimeContext,
    ) -> dict[str, JSONValue]:
        require_permission(context.permissions, "drafts.write")
        if (
            isinstance(expected_revision, bool)
            or not isinstance(expected_revision, int)
            or expected_revision < 1
        ):
            raise RuntimeServiceError(
                "theme_builder_project_invalid",
                "expectedRevision must be a positive integer.",
            )
        metadata = _metadata(name, description, author)
        value = self._project(builder_project_id, context)
        current = _document_payload(value)
        if current["revision"] != expected_revision:
            raise RuntimeServiceError(
                REVISION_CONFLICT,
                f"Theme Builder Project revision conflict: expected {expected_revision}.",
            )

        validated_asset_refs = self._validated_asset_refs(
            current.get("assetRefs"),
            asset_refs,
            context,
        )

        updated = deepcopy(current)
        updated["revision"] = expected_revision + 1
        updated["updatedAt"] = datetime.now(UTC).isoformat()
        updated["name"] = metadata["name"]
        updated["description"] = metadata["description"]
        updated["author"] = metadata["author"]
        updated["assetRefs"] = validated_asset_refs
        if artifacts is not None:
            updated["artifacts"] = deepcopy(artifacts)
        manifest = updated["manifestDraft"]
        if not isinstance(manifest, dict):
            raise RuntimeServiceError("theme_builder_project_invalid", "Manifest draft is invalid.")
        manifest["displayName"] = metadata["name"]
        manifest["description"] = metadata["description"]
        if metadata["author"]:
            manifest["author"] = {"name": metadata["author"]}
        else:
            manifest.pop("author", None)
        _validate_document(updated, builder_project_id)

        saved = self._objects.compare_and_swap_property(
            builder_project_id,
            property_name=BUILDER_DOCUMENT_PROPERTY,
            expected_value=current,
            replacement_value=updated,
            display_name=str(metadata["name"]),
            description=str(metadata["description"]),
            conflict_code=REVISION_CONFLICT,
            context=context,
        )
        return _document_payload(saved)

    def export_package(
        self,
        builder_project_id: str,
        context: RuntimeContext,
    ) -> tuple[bytes, str]:
        require_permission(context.permissions, "drafts.read")
        require_permission(context.permissions, "resources.read")
        document = self.get(builder_project_id, context)
        artifacts = document.get("artifacts")
        if not isinstance(artifacts, dict):
            _invalid("Builder artifacts are invalid.")
        skin_packs = artifacts.get("skinPacks")
        if not isinstance(skin_packs, list) or not skin_packs:
            raise RuntimeServiceError(
                "theme_builder_export_not_ready",
                "Create at least one Look before exporting this Theme.",
            )
        catalog_records = self._resources.list_asset_catalog(context)
        catalog_by_ref: dict[tuple[str, str], dict[str, JSONValue]] = {}
        for record in catalog_records:
            visual = record.get("visualAsset")
            if not isinstance(visual, dict):
                continue
            asset_id, version = visual.get("id"), visual.get("version")
            if isinstance(asset_id, str) and isinstance(version, str):
                catalog_by_ref[(asset_id, version)] = record

        theme_id = str(document["themeId"])
        exported_assets: list[tuple[dict[str, JSONValue], dict[str, JSONValue], bytes]] = []
        id_map: dict[str, str] = {}
        for index, reference in enumerate(_asset_references(document.get("assetRefs")), start=1):
            source_id, version = str(reference["id"]), str(reference["version"])
            record = catalog_by_ref.get((source_id, version))
            if record is None:
                raise RuntimeServiceError(
                    "theme_builder_export_asset_missing",
                    f'Builder Asset "{source_id}@{version}" is not available in the Asset Catalog.',
                )
            source_visual = record.get("visualAsset")
            source_entry = record.get("catalogEntry")
            if not isinstance(source_visual, dict) or not isinstance(source_entry, dict):
                raise RuntimeServiceError("theme_builder_export_asset_missing", "Builder Asset metadata is unavailable.")
            content, _, _ = self._resources.read_visual_asset(source_id, version, context)
            stable = hashlib.sha256(f"{source_id}@{version}".encode("utf-8")).hexdigest()[:12]
            exported_id = f"{theme_id}.asset.{stable}"
            id_map[source_id] = exported_id
            visual = deepcopy(source_visual)
            visual["id"] = exported_id
            visual["path"] = expected_visual_asset_path(visual)
            entry = deepcopy(source_entry)
            entry["id"] = f"{theme_id}.catalog.{stable}"
            entry["visualAssetRef"] = {"id": exported_id, "version": version}
            entry["scope"] = "theme"
            entry["theme"] = theme_id
            entry["origin"] = "imported"
            exported_assets.append((visual, entry, content))

        hydrated_skin_packs: list[dict[str, JSONValue]] = []
        asset_contracts = [_skin_asset_reference(visual) for visual, _, _ in exported_assets]
        for source_pack in skin_packs:
            if not isinstance(source_pack, dict):
                _invalid("Skin Pack draft is invalid.")
            pack = deepcopy(source_pack)
            pack["assets"] = deepcopy(asset_contracts)
            skins = pack.get("skins")
            if not isinstance(skins, list):
                _invalid("Skin Pack skins are invalid.")
            for skin in skins:
                if not isinstance(skin, dict):
                    _invalid("Skin draft is invalid.")
                _remap_skin_asset_ids(skin, id_map)
            hydrated_skin_packs.append(pack)

        manifest = deepcopy(document["manifestDraft"])
        if not isinstance(manifest, dict):
            _invalid("Manifest draft is invalid.")
        if not str(manifest.get("description", "")).strip():
            manifest.pop("description", None)
        manifest["groups"] = [
            "world", "map", "base-entry", "base-interior", "room", "workspace",
            "window", "companion", "icon", "node", "connection", "label", "status", "ambient",
        ]
        manifest["packRefs"] = [
            {"id": str(pack["packId"]), "versionRange": str(pack["version"])}
            for pack in hydrated_skin_packs
        ]
        manifest.setdefault(
            "defaultCompositionRef",
            {"id": "core.composition.base.default", "versionRange": "^1.0.0"},
        )
        manifest_bytes = _canonical_json_bytes(manifest)
        descriptor: dict[str, JSONValue] = {
            "schemaVersion": 1,
            "packageId": str(document["packageId"]),
            "packageVersion": str(document["packageVersion"]),
            "manifest": {
                "path": "theme-manifest.json",
                "sha256": canonical_manifest_digest(manifest),
            },
            "skinPacks": [],
            "assets": [
                {"visualAsset": visual, "catalogEntry": entry}
                for visual, entry, _ in exported_assets
            ],
        }

        archive_entries: list[tuple[str, bytes]] = [("theme-manifest.json", manifest_bytes)]
        skin_refs: list[dict[str, JSONValue]] = []
        for pack in hydrated_skin_packs:
            path = f'skin-packs/{pack["packId"]}/{pack["version"]}/skin-pack.json'
            payload = _canonical_json_bytes(pack)
            skin_refs.append({"path": path, "sha256": hashlib.sha256(payload).hexdigest()})
            archive_entries.append((path, payload))
        descriptor["skinPacks"] = skin_refs
        archive_entries.extend((str(visual["path"]), content) for visual, _, content in exported_assets)
        archive_entries.append(("cosmos-theme-package.json", _canonical_json_bytes(descriptor)))

        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for path, content in sorted(archive_entries, key=lambda item: item[0]):
                info = zipfile.ZipInfo(path, date_time=(1980, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o600 << 16
                archive.writestr(info, content)
        safe_name = re.sub(r"[^A-Za-z0-9._-]+", "-", str(document["name"])).strip("-.") or "cosmos-theme"
        return buffer.getvalue(), f"{safe_name}-{document['packageVersion']}.zip"

    def _validated_asset_refs(
        self,
        current_value: JSONValue | None,
        proposed_value: list[object],
        context: RuntimeContext,
    ) -> list[JSONValue]:
        current = _asset_references(current_value)
        proposed = _asset_references(proposed_value)
        current_keys = {(str(item["id"]), str(item["version"])) for item in current}
        added_keys = {
            (str(item["id"]), str(item["version"]))
            for item in proposed
            if (str(item["id"]), str(item["version"])) not in current_keys
        }
        if not added_keys:
            return proposed

        catalog: dict[tuple[str, str], tuple[bool, bool]] = {}
        for record in self._resources.list_asset_catalog(context):
            entry = record.get("catalogEntry")
            resource = record.get("resource")
            if not isinstance(entry, dict) or not isinstance(resource, dict):
                continue
            reference = entry.get("visualAssetRef")
            if not isinstance(reference, dict):
                continue
            asset_id = reference.get("id")
            version = reference.get("version")
            if isinstance(asset_id, str) and isinstance(version, str):
                catalog[(asset_id, version)] = (
                    entry.get("deprecated") is not True,
                    resource.get("available") is True,
                )

        for key in sorted(added_keys):
            state = catalog.get(key)
            if state is None:
                raise RuntimeServiceError(
                    "theme_builder_asset_reference_invalid",
                    f'Visual Asset "{key[0]}@{key[1]}" is not cataloged.',
                )
            if not all(state):
                raise RuntimeServiceError(
                    "theme_builder_asset_reference_unavailable",
                    f'Visual Asset "{key[0]}@{key[1]}" is not currently usable.',
                )
        return proposed

    def _project(self, builder_project_id: str, context: RuntimeContext) -> CosmosObject:
        try:
            value = self._objects.get(builder_project_id, context)
        except RuntimeServiceError as error:
            if error.code == "object_not_found":
                raise RuntimeServiceError(
                    "theme_builder_project_not_found",
                    f"Theme Builder Project not found: {builder_project_id}",
                ) from error
            raise
        if THEME_BUILDER_PROJECT_TAG not in value.system_tags:
            raise RuntimeServiceError(
                "theme_builder_project_not_found",
                f"Theme Builder Project not found: {builder_project_id}",
            )
        return value


def _manifest_draft(theme_id: str, metadata: dict[str, str]) -> dict[str, JSONValue]:
    manifest: dict[str, JSONValue] = {
        "schemaVersion": 1,
        "themeId": theme_id,
        "version": INITIAL_ARTIFACT_VERSION,
        "displayName": metadata["name"],
        "description": metadata["description"],
        "packageKind": "full-theme",
        "compatibility": {
            "themeEngine": f"^{THEME_ENGINE_CONTRACT_VERSION}",
            "cosmos": "^1.0.0",
        },
        "groups": [],
        "packRefs": [],
        "tokens": {},
        "systemTerms": {},
    }
    if metadata["author"]:
        manifest["author"] = {"name": metadata["author"]}
    return manifest


def _metadata(name: str, description: str, author: str) -> dict[str, str]:
    normalized = {
        "name": name.strip(),
        "description": description.strip(),
        "author": author.strip(),
    }
    if not normalized["name"]:
        raise RuntimeServiceError("theme_builder_project_invalid", "Theme name must not be empty.")
    if len(normalized["name"]) > 120:
        raise RuntimeServiceError("theme_builder_project_invalid", "Theme name is too long.")
    if len(normalized["description"]) > 2000:
        raise RuntimeServiceError("theme_builder_project_invalid", "Theme description is too long.")
    if len(normalized["author"]) > 120:
        raise RuntimeServiceError("theme_builder_project_invalid", "Theme author is too long.")
    return normalized


def _document_payload(value: CosmosObject) -> dict[str, JSONValue]:
    document = deepcopy(value.properties.get(BUILDER_DOCUMENT_PROPERTY))
    if not isinstance(document, dict):
        raise RuntimeServiceError("theme_builder_project_invalid", "Builder document is unavailable.")
    _validate_document(document, value.identity.object_id)
    return document


def _validate_document(document: dict[str, JSONValue], expected_id: str) -> None:
    required = {
        "schemaVersion",
        "builderProjectId",
        "revision",
        "createdAt",
        "updatedAt",
        "contractVersions",
        "themeId",
        "packageId",
        "name",
        "description",
        "author",
        "packageType",
        "themeVersion",
        "packageVersion",
        "manifestDraft",
        "artifacts",
        "assetRefs",
    }
    if set(document) != required or document.get("schemaVersion") != 1:
        _invalid("Builder document fields are invalid.")
    if document.get("builderProjectId") != expected_id:
        _invalid("Builder Project identity is inconsistent.")
    for key in ("builderProjectId", "themeId", "packageId"):
        value = document.get(key)
        if not isinstance(value, str) or not _NAMESPACED_ID.fullmatch(value):
            _invalid(f"{key} must be a namespaced ID.")
    revision = document.get("revision")
    if isinstance(revision, bool) or not isinstance(revision, int) or revision < 1:
        _invalid("Builder Project revision must be a positive integer.")
    for key in ("createdAt", "updatedAt"):
        value = document.get(key)
        if not isinstance(value, str):
            _invalid(f"{key} must be an ISO timestamp.")
        try:
            datetime.fromisoformat(value)
        except ValueError:
            _invalid(f"{key} must be an ISO timestamp.")
    versions = document.get("contractVersions")
    if versions != {
        "themeBuilder": THEME_BUILDER_CONTRACT_VERSION,
        "themeEngine": THEME_ENGINE_CONTRACT_VERSION,
    }:
        _invalid("Builder contract versions are invalid.")
    for key in ("name", "description", "author"):
        if not isinstance(document.get(key), str):
            _invalid(f"{key} must be a string.")
    _metadata(str(document["name"]), str(document["description"]), str(document["author"]))
    if document.get("packageType") not in {"full-theme", "group-pack"}:
        _invalid("packageType is invalid.")
    for key in ("themeVersion", "packageVersion"):
        value = document.get(key)
        if not isinstance(value, str) or not _SEMVER.fullmatch(value):
            _invalid(f"{key} must be a semantic version.")
    artifacts = document.get("artifacts")
    if not isinstance(artifacts, dict) or set(artifacts) != {
        "skinPacks",
        "roomShells",
        "catalogObjects",
    }:
        _invalid("Builder artifact collections are invalid.")
    if any(not isinstance(artifacts[key], list) for key in artifacts):
        _invalid("Builder artifact collections must be arrays.")
    asset_refs = _asset_references(document.get("assetRefs"))
    _validate_skin_packs(artifacts["skinPacks"], asset_refs)
    manifest = document.get("manifestDraft")
    if not isinstance(manifest, dict):
        _invalid("Manifest draft must be an object.")
    if (
        manifest.get("schemaVersion") != 1
        or manifest.get("themeId") != document.get("themeId")
        or manifest.get("version") != document.get("themeVersion")
        or manifest.get("displayName") != document.get("name")
        or manifest.get("description") != document.get("description")
        or manifest.get("packageKind") != document.get("packageType")
    ):
        _invalid("Manifest draft metadata is inconsistent with its Builder Project.")
    author = manifest.get("author")
    expected_author = document.get("author")
    if expected_author and author != {"name": expected_author}:
        _invalid("Manifest draft author is inconsistent with its Builder Project.")
    if not expected_author and author is not None:
        _invalid("Manifest draft author is inconsistent with its Builder Project.")


def _invalid(message: str) -> None:
    raise RuntimeServiceError("theme_builder_project_invalid", message)


def _asset_references(value: object) -> list[JSONValue]:
    if not isinstance(value, list):
        _invalid("assetRefs must be an array.")
    normalized: list[JSONValue] = []
    identities: set[tuple[str, str]] = set()
    for item in value:
        if not isinstance(item, dict) or set(item) != {"id", "version"}:
            _invalid("Each Builder Asset Reference must contain only id and version.")
        asset_id = item.get("id")
        version = item.get("version")
        if not isinstance(asset_id, str) or not _NAMESPACED_ID.fullmatch(asset_id):
            _invalid("Builder Asset Reference id must be namespaced.")
        if not isinstance(version, str) or not _SEMVER.fullmatch(version):
            _invalid("Builder Asset Reference version must be semantic.")
        identity = (asset_id, version)
        if identity in identities:
            raise RuntimeServiceError(
                "theme_builder_asset_reference_duplicate",
                f'Duplicate Builder Asset Reference: "{asset_id}@{version}".',
            )
        identities.add(identity)
        normalized.append({"id": asset_id, "version": version})
    return normalized


def _validate_skin_packs(value: list[object], asset_refs: list[JSONValue]) -> None:
    referenced_assets: dict[str, int] = {}
    for reference in asset_refs:
        asset_id = str(reference["id"])
        referenced_assets[asset_id] = referenced_assets.get(asset_id, 0) + 1
    pack_ids: set[str] = set()
    skin_ids: set[str] = set()
    for pack in value:
        if not isinstance(pack, dict):
            _invalid("Each Skin Pack draft must be an object.")
        allowed_pack_fields = {
            "$schema",
            "schemaVersion",
            "packId",
            "version",
            "packageKind",
            "displayName",
            "description",
            "compatibility",
            "dependencies",
            "assets",
            "skins",
            "license",
            "author",
        }
        if not set(pack).issubset(allowed_pack_fields):
            _invalid("Skin Pack draft fields are invalid.")
        _required_fields(
            pack,
            {
                "schemaVersion",
                "packId",
                "version",
                "packageKind",
                "displayName",
                "compatibility",
                "assets",
                "skins",
            },
            "Skin Pack draft",
        )
        if pack.get("schemaVersion") != 1 or pack.get("packageKind") not in {"skin-pack", "single-skin"}:
            _invalid("Skin Pack draft contract is invalid.")
        pack_id = _namespaced(pack.get("packId"), "Skin Pack id")
        _semantic_version(pack.get("version"), "Skin Pack version")
        _nonempty_string(pack.get("displayName"), "Skin Pack displayName")
        if pack_id in pack_ids:
            _invalid(f'Duplicate Skin Pack id: "{pack_id}".')
        pack_ids.add(pack_id)
        if pack.get("assets") != []:
            _invalid("Builder Skin Pack drafts must not persist asset bytes or package asset metadata.")
        compatibility = pack.get("compatibility")
        if not isinstance(compatibility, dict) or not isinstance(compatibility.get("themeEngine"), str):
            _invalid("Skin Pack compatibility is invalid.")
        skins = pack.get("skins")
        if not isinstance(skins, list) or not skins:
            _invalid("Skin Pack drafts must contain at least one Skin.")
        if pack.get("packageKind") == "single-skin" and len(skins) != 1:
            _invalid("single-skin drafts must contain exactly one Skin.")
        for skin in skins:
            _validate_skin(skin, referenced_assets, skin_ids)


def _validate_skin(value: object, referenced_assets: dict[str, int], skin_ids: set[str]) -> None:
    if not isinstance(value, dict):
        _invalid("Each Skin draft must be an object.")
    allowed = {
        "skinId",
        "version",
        "displayName",
        "target",
        "assetBindings",
        "tokens",
        "materials",
        "stateVariants",
        "systemTerms",
        "boundsOverrides",
        "animations",
    }
    if not set(value).issubset(allowed):
        _invalid("Skin draft fields are invalid.")
    _required_fields(
        value,
        {
            "skinId",
            "version",
            "displayName",
            "target",
            "assetBindings",
            "tokens",
            "materials",
            "stateVariants",
        },
        "Skin draft",
    )
    skin_id = _namespaced(value.get("skinId"), "Skin id")
    if skin_id in skin_ids:
        _invalid(f'Duplicate Skin id: "{skin_id}".')
    skin_ids.add(skin_id)
    _semantic_version(value.get("version"), "Skin version")
    _nonempty_string(value.get("displayName"), "Skin displayName")
    target = value.get("target")
    if not isinstance(target, dict) or set(target) - {
        "presentationGroup",
        "templateRef",
        "rendererRef",
        "targetRoles",
    }:
        _invalid("Skin target is invalid.")
    if target.get("presentationGroup") not in _ALLOWED_PRESENTATION_GROUPS:
        _invalid("Skin presentationGroup is invalid.")
    template_ref = target.get("templateRef")
    if not isinstance(template_ref, dict) or set(template_ref) != {"id", "versionRange"}:
        _invalid("Builder Skin draft requires an exact target Template reference.")
    _namespaced(template_ref.get("id"), "Target Template id")
    _semantic_version(template_ref.get("versionRange"), "Target Template version")
    bindings = value.get("assetBindings")
    if not isinstance(bindings, list):
        _invalid("Skin assetBindings must be an array.")
    binding_ids: set[str] = set()
    for binding in bindings:
        _validate_asset_binding(binding, referenced_assets, binding_ids)
    if not isinstance(value.get("tokens"), dict):
        _invalid("Skin tokens must be an object.")
    materials = value.get("materials")
    if not isinstance(materials, list):
        _invalid("Skin materials must be an array.")
    material_channels: set[str] = set()
    for material in materials:
        _validate_material(material, referenced_assets, material_channels)
    variants = value.get("stateVariants")
    if not isinstance(variants, list):
        _invalid("Skin stateVariants must be an array.")
    for variant in variants:
        if not isinstance(variant, dict) or set(variant) - {
            "stateId",
            "assetBindingIds",
            "tokenOverrides",
            "materialOverrides",
            "animationId",
        }:
            _invalid("Skin State Variant is invalid.")
        _symbol(variant.get("stateId"), "State Variant id")
        references = variant.get("assetBindingIds", [])
        if not isinstance(references, list) or any(item not in binding_ids for item in references):
            _invalid("State Variant references an unknown Asset Binding.")
        overrides = variant.get("materialOverrides", [])
        if not isinstance(overrides, list):
            _invalid("State Variant materialOverrides must be an array.")


def _validate_asset_binding(
    value: object,
    referenced_assets: dict[str, int],
    binding_ids: set[str],
) -> None:
    if not isinstance(value, dict) or set(value) - {
        "bindingId",
        "slotId",
        "assetId",
        "fit",
        "alignment",
        "opacity",
        "tint",
        "states",
    }:
        _invalid("Skin Asset Binding is invalid.")
    _required_fields(value, {"bindingId", "slotId", "assetId"}, "Skin Asset Binding")
    binding_id = _namespaced(value.get("bindingId"), "Asset Binding id")
    if binding_id in binding_ids:
        _invalid(f'Duplicate Asset Binding id: "{binding_id}".')
    binding_ids.add(binding_id)
    _namespaced(value.get("slotId"), "Asset Binding slotId")
    asset_id = _namespaced(value.get("assetId"), "Asset Binding assetId")
    if referenced_assets.get(asset_id) != 1:
        _invalid(f'Skin Asset Binding must use one exact Builder Asset Reference for "{asset_id}".')
    fit = value.get("fit")
    if fit is not None and fit not in _ALLOWED_BINDING_FITS:
        _invalid("Skin Asset Binding fit is invalid.")
    alignment = value.get("alignment")
    if alignment is not None and alignment not in _ALLOWED_BINDING_ALIGNMENTS:
        _invalid("Skin Asset Binding alignment is invalid.")
    opacity = value.get("opacity")
    if opacity is not None and (
        isinstance(opacity, bool)
        or not isinstance(opacity, (int, float))
        or not 0 <= opacity <= 1
    ):
        _invalid("Skin Asset Binding opacity must be between 0 and 1.")
    tint = value.get("tint")
    if tint is not None and (not isinstance(tint, str) or not _SAFE_HEX_COLOR.fullmatch(tint)):
        _invalid("Skin Asset Binding tint must be a safe hex color.")
    states = value.get("states", [])
    if not isinstance(states, list):
        _invalid("Asset Binding states must be an array.")
    seen_states: set[str] = set()
    for state in states:
        normalized_state = _symbol(state, "Asset Binding state")
        if normalized_state in seen_states:
            _invalid("Asset Binding states must be unique.")
        seen_states.add(normalized_state)


def _validate_material(
    value: object,
    referenced_assets: dict[str, int],
    channel_ids: set[str],
) -> None:
    if not isinstance(value, dict) or set(value) != {"channelId", "parameters"}:
        _invalid("Skin Material fields are invalid.")
    channel_id = _namespaced(value.get("channelId"), "Material channelId")
    if channel_id in channel_ids:
        _invalid(f'Duplicate Material channel: "{channel_id}".')
    channel_ids.add(channel_id)
    if channel_id != "core.material.dom-surface":
        _invalid(f'Unsupported renderer Material channel: "{channel_id}".')
    parameters = value.get("parameters")
    if not isinstance(parameters, dict) or not parameters:
        _invalid("Skin Material parameters must be a non-empty object.")
    allowed = {
        "core.material.fill",
        "core.material.stroke",
        "core.material.opacity",
        "core.material.texture-ref",
    }
    if not set(parameters).issubset(allowed):
        _invalid("Skin Material contains an unsupported renderer parameter.")
    for parameter_id, parameter_value in parameters.items():
        if parameter_id in {"core.material.fill", "core.material.stroke"}:
            if not isinstance(parameter_value, str) or not _SAFE_HEX_COLOR.fullmatch(parameter_value):
                _invalid(f"{parameter_id} must be a safe hex color.")
        elif parameter_id == "core.material.opacity":
            if (
                isinstance(parameter_value, bool)
                or not isinstance(parameter_value, (int, float))
                or not 0 <= parameter_value <= 1
            ):
                _invalid("core.material.opacity must be between 0 and 1.")
        elif parameter_id == "core.material.texture-ref":
            asset_id = _namespaced(parameter_value, "core.material.texture-ref")
            if referenced_assets.get(asset_id) != 1:
                _invalid(
                    f'Skin Material texture-ref must use one exact Builder Asset Reference for "{asset_id}".'
                )


def _required_fields(value: dict[object, object], required: set[str], label: str) -> None:
    if not required.issubset(value):
        _invalid(f"{label} fields are incomplete.")


def _namespaced(value: object, label: str) -> str:
    if not isinstance(value, str) or not _NAMESPACED_ID.fullmatch(value):
        _invalid(f"{label} must be namespaced.")
    return value


def _symbol(value: object, label: str) -> str:
    if not isinstance(value, str) or not re.fullmatch(r"^[a-z0-9]+(?:[._-][a-z0-9]+)*$", value):
        _invalid(f"{label} must be a symbol.")
    return value


def _semantic_version(value: object, label: str) -> str:
    if not isinstance(value, str) or not _SEMVER.fullmatch(value):
        _invalid(f"{label} must be semantic.")
    return value


def _nonempty_string(value: object, label: str) -> str:
    if not isinstance(value, str) or not value.strip():
        _invalid(f"{label} must not be empty.")
    return value


def _canonical_json_bytes(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _skin_asset_reference(visual: dict[str, JSONValue]) -> dict[str, JSONValue]:
    result: dict[str, JSONValue] = {
        "assetId": str(visual["id"]),
        "kind": visual["kind"],
        "format": visual["format"],
        "mimeType": visual["mimeType"],
        "path": visual["path"],
        "sha256": visual["sha256"],
        "byteSize": visual["byteSize"],
        "width": visual["width"],
        "height": visual["height"],
    }
    for key in ("colorSpace", "alpha", "density", "accessibilityDescription"):
        if key in visual:
            result[key] = visual[key]
    return result


def _remap_skin_asset_ids(skin: dict[str, JSONValue], id_map: dict[str, str]) -> None:
    bindings = skin.get("assetBindings")
    if isinstance(bindings, list):
        for binding in bindings:
            if isinstance(binding, dict) and isinstance(binding.get("assetId"), str):
                binding["assetId"] = id_map.get(str(binding["assetId"]), str(binding["assetId"]))
    materials = skin.get("materials")
    if isinstance(materials, list):
        _remap_materials(materials, id_map)
    variants = skin.get("stateVariants")
    if isinstance(variants, list):
        for variant in variants:
            if isinstance(variant, dict) and isinstance(variant.get("materialOverrides"), list):
                _remap_materials(variant["materialOverrides"], id_map)


def _remap_materials(materials: list[object], id_map: dict[str, str]) -> None:
    for material in materials:
        if not isinstance(material, dict):
            continue
        parameters = material.get("parameters")
        if not isinstance(parameters, dict):
            continue
        texture = parameters.get("core.material.texture-ref")
        if isinstance(texture, str):
            parameters["core.material.texture-ref"] = id_map.get(texture, texture)
