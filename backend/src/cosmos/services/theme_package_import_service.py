from __future__ import annotations

import hashlib
import json
import os
import re
import sqlite3
import stat
import tempfile
import zipfile
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path, PurePosixPath

from cosmos.domain.objects import JSONValue
from cosmos.persistence import AssetCatalogRepository, SQLitePersistence, ThemePackageRepository
from cosmos.runtime import RuntimeContext
from cosmos.services.asset_catalog_validation import (
    expected_visual_asset_path,
    validate_asset_catalog_promotion,
)
from cosmos.services.errors import RuntimeServiceError, require_permission
from cosmos.services.theme_package_service import (
    canonical_manifest_digest,
    validate_prevalidated_install_record,
)

THEME_PACKAGE_DESCRIPTOR_PATH = "cosmos-theme-package.json"
THEME_MANIFEST_PATH = "theme-manifest.json"
CORE_THEME_ID = "cosmos.theme.cosmos"
THEME_ENGINE_VERSION = "1.0.0"
COSMOS_VERSION = "1.0.0"

_ID = re.compile(r"^[a-z0-9]+(?:[._-][a-z0-9]+)+$")
_SEMVER = re.compile(
    r"^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)"
    r"(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$"
)
_DIGEST = re.compile(r"^[a-f0-9]{64}$")
_REQUIRED_GROUPS = {
    "world",
    "map",
    "base-entry",
    "base-interior",
    "room",
    "workspace",
    "window",
    "companion",
    "icon",
    "node",
    "connection",
    "label",
    "status",
}
_PRESENTATION_GROUPS = _REQUIRED_GROUPS | {"ambient"}
_TOKEN_TYPES = {
    "color",
    "length",
    "number",
    "duration",
    "shadow",
    "font-family",
    "opacity",
    "string",
    "boolean",
}
_FORBIDDEN_KEYS = {
    "code",
    "eventhandler",
    "eventhandlers",
    "executable",
    "handler",
    "html",
    "javascript",
    "onclick",
    "onerror",
    "python",
    "script",
    "scripts",
    "shader",
    "typescript",
}
_FORBIDDEN_TEXT = (
    re.compile(r"<\s*script\b", re.IGNORECASE),
    re.compile(r"<\s*(?:iframe|object|embed|foreignObject)\b", re.IGNORECASE),
    re.compile(r"\bjavascript\s*:", re.IGNORECASE),
    re.compile(r"\bdata\s*:\s*text/html", re.IGNORECASE),
    re.compile(r"\bon(?:click|error|load|pointer\w*)\s*=", re.IGNORECASE),
)


@dataclass(frozen=True, slots=True)
class ThemePackageImportLimits:
    maximum_archive_bytes: int = 256 * 1024 * 1024
    maximum_uncompressed_bytes: int = 256 * 1024 * 1024
    maximum_asset_bytes: int = 16 * 1024 * 1024
    maximum_metadata_bytes: int = 1024 * 1024
    maximum_files: int = 256


class ThemePackageImportError(RuntimeServiceError):
    def __init__(
        self,
        code: str,
        message: str,
        *,
        package_id: str | None = None,
        package_version: str | None = None,
        theme_id: str | None = None,
        theme_name: str | None = None,
        archive_digest: str | None = None,
        manifest_digest: str | None = None,
        asset_count: int = 0,
    ) -> None:
        super().__init__(code, message)
        self.package_id = package_id
        self.package_version = package_version
        self.theme_id = theme_id
        self.theme_name = theme_name
        self.archive_digest = archive_digest
        self.manifest_digest = manifest_digest
        self.asset_count = asset_count

    def result(self) -> dict[str, JSONValue]:
        return {
            "success": False,
            "packageId": self.package_id,
            "packageVersion": self.package_version,
            "themeId": self.theme_id,
            "themeName": self.theme_name,
            "installStatus": "rejected",
            "diagnostics": [{"code": self.code, "message": str(self)}],
            "assets": {"total": self.asset_count, "installed": 0, "reused": 0},
            "integrity": {
                "status": "rejected",
                "archiveSha256": self.archive_digest,
                "manifestSha256": self.manifest_digest,
            },
            "runtimeRegistration": "not-registered",
        }


@dataclass(slots=True)
class _AssetPromotion:
    visual_asset: dict[str, JSONValue]
    catalog_entry: dict[str, JSONValue]
    content: bytes
    resource_path: str
    final_path: Path
    reused: bool = False
    staged_path: Path | None = None


@dataclass(frozen=True, slots=True)
class _SkinPackArtifact:
    path: str
    digest: str
    skin_pack: dict[str, JSONValue]


class ThemePackageImportService:
    """Quarantines, validates and atomically installs one declarative Theme ZIP."""

    def __init__(
        self,
        persistence: SQLitePersistence,
        package_repository: ThemePackageRepository,
        asset_catalog: AssetCatalogRepository,
        runtime_path: Path,
        limits: ThemePackageImportLimits | None = None,
    ) -> None:
        self._persistence = persistence
        self._package_repository = package_repository
        self._asset_catalog = asset_catalog
        self._resource_root = Path(runtime_path) / "Resources"
        self._quarantine_root = Path(runtime_path) / "Quarantine" / "ThemePackages"
        self.limits = limits or ThemePackageImportLimits()

    @property
    def maximum_archive_bytes(self) -> int:
        return self.limits.maximum_archive_bytes

    def import_archive(
        self,
        archive_bytes: bytes,
        context: RuntimeContext,
    ) -> dict[str, JSONValue]:
        require_permission(context.permissions, "resources.write")
        archive_digest = hashlib.sha256(archive_bytes).hexdigest()
        identity: dict[str, str | None] = {
            "packageId": None,
            "packageVersion": None,
            "themeId": None,
            "themeName": None,
            "manifestDigest": None,
        }
        asset_count = 0
        if len(archive_bytes) > self.limits.maximum_archive_bytes:
            raise ThemePackageImportError(
                "theme_package_too_large",
                "Theme Package archive exceeds the 256 MiB intake limit.",
                archive_digest=archive_digest,
            )

        quarantine_path = self._write_quarantine(archive_bytes)
        try:
            try:
                with zipfile.ZipFile(quarantine_path) as archive:
                    entries = self._inspect_archive(archive)
                    descriptor = self._read_json_entry(
                        archive,
                        entries,
                        THEME_PACKAGE_DESCRIPTOR_PATH,
                        "Theme Package descriptor",
                    )
                    (
                        package_id,
                        package_version,
                        manifest_reference,
                        assets,
                        skin_pack_references,
                    ) = _validate_descriptor(descriptor)
                    identity["packageId"] = package_id
                    identity["packageVersion"] = package_version
                    asset_count = len(assets)

                    manifest = self._read_json_entry(
                        archive,
                        entries,
                        manifest_reference["path"],
                        "Theme Manifest",
                    )
                    _validate_theme_manifest(manifest)
                    theme_id = _required_string(manifest, "themeId", "Theme Manifest")
                    identity["themeId"] = theme_id
                    identity["themeName"] = _required_string(
                        manifest,
                        "displayName",
                        "Theme Manifest",
                    )
                    manifest_digest = canonical_manifest_digest(manifest)
                    identity["manifestDigest"] = manifest_digest
                    self._validate_package_identity(
                        package_id,
                        package_version,
                        manifest,
                        manifest_reference,
                        manifest_digest,
                    )
                    promotions = self._validate_assets(
                        archive,
                        entries,
                        assets,
                        theme_id,
                    )
                    skin_packs = self._validate_skin_packs(
                        archive,
                        entries,
                        skin_pack_references,
                        manifest,
                        promotions,
                    )
                    self._validate_expected_paths(entries, promotions, skin_packs)
            except zipfile.BadZipFile as error:
                raise RuntimeServiceError(
                    "theme_package_archive_invalid",
                    "Theme Package is not a valid ZIP archive.",
                ) from error

            record = validate_prevalidated_install_record(
                {
                    "schemaVersion": 1,
                    "packageId": package_id,
                    "packageVersion": package_version,
                    "manifestDigest": manifest_digest,
                    "manifest": manifest,
                    "source": {
                        "kind": "prevalidated",
                        "provenance": f"theme-package-import:sha256:{archive_digest}",
                    },
                }
            )
            record["skinPacks"] = [
                {
                    "path": artifact.path,
                    "sha256": artifact.digest,
                    "packId": artifact.skin_pack["packId"],
                    "packVersion": artifact.skin_pack["version"],
                    "skinPack": artifact.skin_pack,
                }
                for artifact in skin_packs
            ]
            installed, reused = self._install(record, promotions)
            return {
                "success": True,
                "packageId": package_id,
                "packageVersion": package_version,
                "themeId": theme_id,
                "themeName": identity["themeName"],
                "installStatus": "installed",
                "diagnostics": [],
                "assets": {
                    "total": len(promotions),
                    "installed": installed,
                    "reused": reused,
                },
                "integrity": {
                    "status": "verified",
                    "archiveSha256": archive_digest,
                    "manifestSha256": manifest_digest,
                },
                "runtimeRegistration": "next-startup",
            }
        except ThemePackageImportError:
            raise
        except RuntimeServiceError as error:
            raise ThemePackageImportError(
                error.code,
                str(error),
                package_id=identity["packageId"],
                package_version=identity["packageVersion"],
                theme_id=identity["themeId"],
                theme_name=identity["themeName"],
                archive_digest=archive_digest,
                manifest_digest=identity["manifestDigest"],
                asset_count=asset_count,
            ) from error
        except (OSError, RuntimeError, ValueError) as error:
            raise ThemePackageImportError(
                "theme_package_archive_invalid",
                "Theme Package archive could not be safely inspected.",
                package_id=identity["packageId"],
                package_version=identity["packageVersion"],
                theme_id=identity["themeId"],
                theme_name=identity["themeName"],
                archive_digest=archive_digest,
                manifest_digest=identity["manifestDigest"],
                asset_count=asset_count,
            ) from error
        finally:
            quarantine_path.unlink(missing_ok=True)

    def _write_quarantine(self, content: bytes) -> Path:
        self._quarantine_root.mkdir(parents=True, exist_ok=True)
        descriptor, temporary_name = tempfile.mkstemp(
            prefix="theme-package-",
            suffix=".quarantine",
            dir=self._quarantine_root,
        )
        path = Path(temporary_name)
        try:
            with os.fdopen(descriptor, "wb") as stream:
                stream.write(content)
                stream.flush()
                os.fsync(stream.fileno())
        except Exception:
            path.unlink(missing_ok=True)
            raise
        return path

    def _inspect_archive(self, archive: zipfile.ZipFile) -> dict[str, zipfile.ZipInfo]:
        infos = archive.infolist()
        if len(infos) > self.limits.maximum_files:
            raise RuntimeServiceError(
                "theme_package_too_many_files",
                f"Theme Package contains more than {self.limits.maximum_files} entries.",
            )

        entries: dict[str, zipfile.ZipInfo] = {}
        seen: set[str] = set()
        total_size = 0
        for info in infos:
            path = _validate_archive_path(info.filename, info.is_dir())
            collision_key = path.rstrip("/").casefold()
            if collision_key in seen:
                raise RuntimeServiceError(
                    "theme_package_path_collision",
                    f'Theme Package contains a duplicate or colliding path: "{path}".',
                )
            seen.add(collision_key)
            _validate_zip_entry_type(info)
            if info.flag_bits & 0x1:
                raise RuntimeServiceError(
                    "theme_package_encrypted_entry",
                    "Encrypted Theme Package entries are not supported.",
                )
            if info.compress_type not in {zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED}:
                raise RuntimeServiceError(
                    "theme_package_compression_unsupported",
                    "Theme Package uses an unsupported compression method.",
                )
            if not info.is_dir():
                total_size += info.file_size
                maximum = (
                    self.limits.maximum_metadata_bytes
                    if path in {THEME_PACKAGE_DESCRIPTOR_PATH, THEME_MANIFEST_PATH}
                    else self.limits.maximum_asset_bytes
                )
                if info.file_size > maximum:
                    raise RuntimeServiceError(
                        "theme_package_entry_too_large",
                        f'Theme Package entry "{path}" exceeds its intake limit.',
                    )
                entries[path] = info

        if total_size > self.limits.maximum_uncompressed_bytes:
            raise RuntimeServiceError(
                "theme_package_too_large",
                "Theme Package uncompressed content exceeds the 256 MiB package limit.",
            )
        return entries

    def _read_json_entry(
        self,
        archive: zipfile.ZipFile,
        entries: dict[str, zipfile.ZipInfo],
        path: str,
        label: str,
    ) -> dict[str, JSONValue]:
        info = entries.get(path)
        if info is None:
            code = {
                THEME_PACKAGE_DESCRIPTOR_PATH: "theme_package_descriptor_missing",
                THEME_MANIFEST_PATH: "theme_package_manifest_missing",
            }.get(path, "theme_package_skin_pack_missing")
            raise RuntimeServiceError(code, f"{label} is missing from the package root.")
        content = _read_bounded(archive, info, self.limits.maximum_metadata_bytes)
        try:
            value = json.loads(content.decode("utf-8-sig"), object_pairs_hook=_unique_json_object)
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as error:
            raise RuntimeServiceError(
                "theme_package_json_invalid",
                f"{label} is not valid unambiguous UTF-8 JSON.",
            ) from error
        if not isinstance(value, dict):
            raise RuntimeServiceError(
                "theme_package_json_invalid",
                f"{label} must contain one JSON object.",
            )
        return value

    def _validate_package_identity(
        self,
        package_id: str,
        package_version: str,
        manifest: dict[str, JSONValue],
        manifest_reference: dict[str, str],
        manifest_digest: str,
    ) -> None:
        theme_id = _required_string(manifest, "themeId", "Theme Manifest")
        theme_version = _required_string(manifest, "version", "Theme Manifest")
        if package_version != theme_version:
            raise RuntimeServiceError(
                "theme_package_identity_mismatch",
                "Package version must equal Theme Manifest version.",
            )
        if manifest_reference["path"] != THEME_MANIFEST_PATH:
            raise RuntimeServiceError(
                "theme_package_manifest_path_invalid",
                f'Theme Manifest must use the package-root path "{THEME_MANIFEST_PATH}".',
            )
        if manifest_reference["sha256"] != manifest_digest:
            raise RuntimeServiceError(
                "theme_package_integrity_failed",
                "Theme Package manifest digest does not match the canonical Theme Manifest.",
            )
        if theme_id == CORE_THEME_ID:
            raise RuntimeServiceError(
                "theme_package_core_conflict",
                "Installed Theme Packages cannot overwrite the code-native Cosmos Core Theme.",
            )
        if self._package_repository.exists(package_id, package_version):
            raise RuntimeServiceError(
                "theme_package_conflict",
                f'Theme Package "{package_id}@{package_version}" is already installed.',
            )

    def _validate_assets(
        self,
        archive: zipfile.ZipFile,
        entries: dict[str, zipfile.ZipInfo],
        assets: list[dict[str, JSONValue]],
        theme_id: str,
    ) -> list[_AssetPromotion]:
        promotions: list[_AssetPromotion] = []
        asset_ids: set[tuple[object, object]] = set()
        entry_ids: set[tuple[object, object]] = set()
        resource_paths: set[str] = set()
        for index, item in enumerate(assets):
            if set(item) != {"visualAsset", "catalogEntry"}:
                raise RuntimeServiceError(
                    "theme_package_descriptor_invalid",
                    f"assets[{index}] must contain visualAsset and catalogEntry only.",
                )
            visual_value = item["visualAsset"]
            catalog_value = item["catalogEntry"]
            if not isinstance(visual_value, dict) or not isinstance(catalog_value, dict):
                raise RuntimeServiceError(
                    "theme_package_descriptor_invalid",
                    f"assets[{index}] declarations must be objects.",
                )
            resource_path_value = visual_value.get("path")
            if not isinstance(resource_path_value, str):
                raise RuntimeServiceError(
                    "theme_package_descriptor_invalid",
                    f"assets[{index}].visualAsset.path must be a string.",
                )
            info = entries.get(resource_path_value)
            if info is None:
                raise RuntimeServiceError(
                    "theme_package_asset_missing",
                    f'Declared Theme asset "{resource_path_value}" is missing.',
                )
            content = _read_bounded(archive, info, self.limits.maximum_asset_bytes)
            visual_asset, catalog_entry = validate_asset_catalog_promotion(
                visual_value,
                catalog_value,
                content,
            )
            if catalog_entry.get("scope") != "theme" or catalog_entry.get("theme") != theme_id:
                raise RuntimeServiceError(
                    "theme_package_asset_scope_invalid",
                    "Imported Theme assets must use theme scope and reference the package Theme ID.",
                )
            asset_key = (visual_asset["id"], visual_asset["version"])
            entry_key = (catalog_entry["id"], catalog_entry["version"])
            resource_path = expected_visual_asset_path(visual_asset)
            if asset_key in asset_ids or entry_key in entry_ids or resource_path.casefold() in resource_paths:
                raise RuntimeServiceError(
                    "theme_package_asset_conflict",
                    "Theme Package contains duplicate Asset Catalog identities or Resource paths.",
                )
            asset_ids.add(asset_key)
            entry_ids.add(entry_key)
            resource_paths.add(resource_path.casefold())
            promotions.append(
                _AssetPromotion(
                    visual_asset=visual_asset,
                    catalog_entry=catalog_entry,
                    content=content,
                    resource_path=resource_path,
                    final_path=self._resolve_resource(resource_path),
                )
            )
        return promotions

    def _validate_skin_packs(
        self,
        archive: zipfile.ZipFile,
        entries: dict[str, zipfile.ZipInfo],
        references: list[dict[str, str]],
        manifest: dict[str, JSONValue],
        promotions: list[_AssetPromotion],
    ) -> list[_SkinPackArtifact]:
        artifacts: list[_SkinPackArtifact] = []
        identities: set[tuple[str, str]] = set()
        manifest_refs = [
            _versioned_ref(value, f"packRefs[{index}]")
            for index, value in enumerate(_list(manifest["packRefs"], "packRefs"))
        ]
        available_assets = {
            str(promotion.visual_asset["id"]): promotion.visual_asset for promotion in promotions
        }
        for index, reference in enumerate(references):
            path = reference["path"]
            skin_pack = self._read_json_entry(
                archive,
                entries,
                path,
                f"SkinPack {index + 1}",
            )
            digest = canonical_manifest_digest(skin_pack)
            if digest != reference["sha256"]:
                raise RuntimeServiceError(
                    "theme_package_skin_pack_integrity_failed",
                    f'SkinPack artifact "{path}" failed canonical digest validation.',
                )
            _validate_skin_pack(skin_pack)
            pack_id = _required_string(skin_pack, "packId", "SkinPack")
            pack_version = _required_string(skin_pack, "version", "SkinPack")
            if not any(
                item["id"] == pack_id and _version_satisfies(pack_version, item["versionRange"])
                for item in manifest_refs
            ):
                raise RuntimeServiceError(
                    "theme_package_skin_pack_unreferenced",
                    f'SkinPack "{pack_id}@{pack_version}" is not referenced by the Theme Manifest.',
                )
            identity = (pack_id, pack_version)
            if identity in identities:
                raise RuntimeServiceError(
                    "theme_package_skin_pack_conflict",
                    "Theme Package contains duplicate SkinPack identities.",
                )
            identities.add(identity)
            _validate_skin_pack_asset_closure(skin_pack, available_assets)
            artifacts.append(_SkinPackArtifact(path=path, digest=digest, skin_pack=skin_pack))
        return artifacts

    def _validate_expected_paths(
        self,
        entries: dict[str, zipfile.ZipInfo],
        promotions: list[_AssetPromotion],
        skin_packs: list[_SkinPackArtifact],
    ) -> None:
        allowed = {
            THEME_PACKAGE_DESCRIPTOR_PATH,
            THEME_MANIFEST_PATH,
            *(promotion.resource_path for promotion in promotions),
            *(artifact.path for artifact in skin_packs),
        }
        unexpected = sorted(set(entries) - allowed)
        if unexpected:
            root_manifests = [path for path in unexpected if PurePosixPath(path).name == THEME_MANIFEST_PATH]
            if root_manifests:
                raise RuntimeServiceError(
                    "theme_package_manifest_conflict",
                    "Theme Package contains multiple competing Theme Manifest files.",
                )
            raise RuntimeServiceError(
                "theme_package_unexpected_file",
                f'Theme Package contains an undeclared file: "{unexpected[0]}".',
            )

    def _resolve_resource(self, resource_path: str) -> Path:
        root = self._resource_root.resolve()
        candidate = (root / Path(resource_path)).resolve()
        if candidate == root or root not in candidate.parents:
            raise RuntimeServiceError(
                "asset_path_escape",
                "Theme Package Asset Resource path escaped the Runtime Resource root.",
            )
        return candidate

    def _install(
        self,
        record: dict[str, JSONValue],
        promotions: list[_AssetPromotion],
    ) -> tuple[int, int]:
        self._classify_existing_assets(promotions)
        new_promotions = [promotion for promotion in promotions if not promotion.reused]
        for promotion in new_promotions:
            promotion.staged_path = self._stage_resource(promotion)

        installed_at = datetime.now(UTC)
        finalized: list[Path] = []
        try:
            with self._persistence.connect() as connection:
                connection.execute("BEGIN")
                self._package_repository.insert(record, installed_at, connection)
                for promotion in new_promotions:
                    self._asset_catalog.insert_promotion(
                        promotion.visual_asset,
                        promotion.catalog_entry,
                        promotion.resource_path,
                        installed_at,
                        connection,
                    )
                for promotion in new_promotions:
                    if promotion.staged_path is None:
                        continue
                    os.replace(promotion.staged_path, promotion.final_path)
                    promotion.staged_path = None
                    finalized.append(promotion.final_path)
                connection.commit()
        except sqlite3.IntegrityError as error:
            for path in finalized:
                path.unlink(missing_ok=True)
            raise RuntimeServiceError(
                "theme_package_conflict",
                "Theme Package or one of its Asset Catalog identities is already installed.",
            ) from error
        except sqlite3.Error as error:
            for path in finalized:
                path.unlink(missing_ok=True)
            raise RuntimeServiceError(
                "theme_package_storage_failed",
                "Theme Package metadata could not be committed; no package was installed.",
            ) from error
        except OSError as error:
            for path in finalized:
                path.unlink(missing_ok=True)
            raise RuntimeServiceError(
                "theme_package_storage_failed",
                "Theme Package Resources could not be installed; no package was committed.",
            ) from error
        finally:
            for promotion in new_promotions:
                if promotion.staged_path is not None:
                    promotion.staged_path.unlink(missing_ok=True)
        return len(new_promotions), len(promotions) - len(new_promotions)

    def _classify_existing_assets(self, promotions: list[_AssetPromotion]) -> None:
        for promotion in promotions:
            visual = promotion.visual_asset
            catalog = promotion.catalog_entry
            existing_visual = self._asset_catalog.get_visual_asset(
                str(visual["id"]),
                str(visual["version"]),
            )
            existing_catalog = self._asset_catalog.get_catalog_entry(
                str(catalog["id"]),
                str(catalog["version"]),
            )
            if existing_visual is None and existing_catalog is None:
                if promotion.final_path.exists() and _file_hash(promotion.final_path) != visual["sha256"]:
                    raise RuntimeServiceError(
                        "resource_conflict",
                        "Canonical Theme asset path already contains different bytes.",
                    )
                continue
            if (
                existing_visual is None
                or existing_catalog is None
                or existing_visual.get("visualAsset") != visual
                or existing_visual.get("resourcePath") != promotion.resource_path
                or existing_catalog.get("visualAsset") != visual
                or existing_catalog.get("catalogEntry") != catalog
                or existing_catalog.get("resourcePath") != promotion.resource_path
                or not promotion.final_path.is_file()
                or _file_hash(promotion.final_path) != visual["sha256"]
            ):
                raise RuntimeServiceError(
                    "theme_package_asset_conflict",
                    "Existing Asset Catalog identity does not match the Theme Package declaration.",
                )
            promotion.reused = True

    @staticmethod
    def _stage_resource(promotion: _AssetPromotion) -> Path | None:
        if promotion.final_path.exists():
            return None
        promotion.final_path.parent.mkdir(parents=True, exist_ok=True)
        descriptor, temporary_name = tempfile.mkstemp(
            prefix=f".{promotion.final_path.name}.",
            dir=promotion.final_path.parent,
        )
        path = Path(temporary_name)
        try:
            with os.fdopen(descriptor, "wb") as stream:
                stream.write(promotion.content)
                stream.flush()
                os.fsync(stream.fileno())
        except Exception:
            path.unlink(missing_ok=True)
            raise
        return path


def _validate_descriptor(
    value: dict[str, JSONValue],
) -> tuple[
    str,
    str,
    dict[str, str],
    list[dict[str, JSONValue]],
    list[dict[str, str]],
]:
    required_fields = {
        "schemaVersion",
        "packageId",
        "packageVersion",
        "manifest",
        "assets",
    }
    if not required_fields.issubset(value) or set(value) - (required_fields | {"skinPacks"}):
        raise RuntimeServiceError(
            "theme_package_descriptor_invalid",
            "Theme Package descriptor has missing or unsupported fields.",
        )
    if value["schemaVersion"] != 1:
        raise RuntimeServiceError(
            "theme_package_contract_unsupported",
            "Theme Package descriptor schemaVersion is not supported.",
        )
    package_id = _namespaced_id(value["packageId"], "packageId")
    package_version = _semver(value["packageVersion"], "packageVersion")
    manifest_value = value["manifest"]
    if not isinstance(manifest_value, dict) or set(manifest_value) != {"path", "sha256"}:
        raise RuntimeServiceError(
            "theme_package_descriptor_invalid",
            "Theme Package manifest reference requires path and sha256.",
        )
    manifest_path = _string(manifest_value["path"], "manifest.path")
    manifest_digest = _digest(manifest_value["sha256"], "manifest.sha256")
    assets_value = value["assets"]
    if not isinstance(assets_value, list) or any(not isinstance(item, dict) for item in assets_value):
        raise RuntimeServiceError(
            "theme_package_descriptor_invalid",
            "Theme Package assets must be an array of declaration objects.",
        )
    skin_pack_values = value.get("skinPacks", [])
    if not isinstance(skin_pack_values, list) or any(not isinstance(item, dict) for item in skin_pack_values):
        raise RuntimeServiceError(
            "theme_package_descriptor_invalid",
            "Theme Package skinPacks must be an array of artifact references.",
        )
    skin_pack_references: list[dict[str, str]] = []
    seen_paths: set[str] = set()
    for index, item in enumerate(skin_pack_values):
        if set(item) != {"path", "sha256"}:
            raise RuntimeServiceError(
                "theme_package_descriptor_invalid",
                f"skinPacks[{index}] requires path and sha256 only.",
            )
        path = _validate_archive_path(_string(item["path"], f"skinPacks[{index}].path"), False)
        digest = _digest(item["sha256"], f"skinPacks[{index}].sha256")
        if path in {THEME_PACKAGE_DESCRIPTOR_PATH, THEME_MANIFEST_PATH} or path.casefold() in seen_paths:
            raise RuntimeServiceError(
                "theme_package_skin_pack_conflict",
                "Theme Package contains a duplicate or reserved SkinPack artifact path.",
            )
        seen_paths.add(path.casefold())
        skin_pack_references.append({"path": path, "sha256": digest})
    return (
        package_id,
        package_version,
        {"path": manifest_path, "sha256": manifest_digest},
        assets_value,
        skin_pack_references,
    )


def _validate_theme_manifest(value: dict[str, JSONValue]) -> None:
    required = {
        "schemaVersion",
        "themeId",
        "version",
        "displayName",
        "packageKind",
        "compatibility",
        "groups",
        "packRefs",
        "tokens",
        "systemTerms",
    }
    optional = {
        "$schema",
        "description",
        "defaultCompositionRef",
        "dependencies",
        "author",
        "license",
        "metadata",
    }
    _strict_fields(value, required, optional, "Theme Manifest")
    if "$schema" in value:
        _bounded_string(value["$schema"], "$schema", 2000)
    if value["schemaVersion"] != 1:
        raise RuntimeServiceError(
            "theme_package_contract_unsupported",
            "Theme Manifest schemaVersion is not supported.",
        )
    _namespaced_id(value["themeId"], "themeId")
    _semver(value["version"], "version")
    _bounded_string(value["displayName"], "displayName", 120)
    if "description" in value:
        _bounded_string(value["description"], "description", 2000)
    if value["packageKind"] != "full-theme":
        raise RuntimeServiceError(
            "theme_package_kind_unsupported",
            "Theme Package import currently accepts full-theme manifests only.",
        )
    compatibility = _object(value["compatibility"], "compatibility")
    _strict_fields(compatibility, {"themeEngine"}, {"cosmos"}, "compatibility")
    if not _version_satisfies(THEME_ENGINE_VERSION, _string(compatibility["themeEngine"], "themeEngine")):
        raise RuntimeServiceError(
            "theme_package_incompatible",
            f"Theme Package is incompatible with Theme Engine {THEME_ENGINE_VERSION}.",
        )
    if "cosmos" in compatibility and not _version_satisfies(
        COSMOS_VERSION,
        _string(compatibility["cosmos"], "cosmos"),
    ):
        raise RuntimeServiceError(
            "theme_package_incompatible",
            f"Theme Package is incompatible with Cosmos {COSMOS_VERSION}.",
        )
    groups = value["groups"]
    if (
        not isinstance(groups, list)
        or not groups
        or any(group not in _PRESENTATION_GROUPS for group in groups)
        or len(set(groups)) != len(groups)
        or not _REQUIRED_GROUPS.issubset(groups)
    ):
        raise RuntimeServiceError(
            "theme_package_manifest_invalid",
            "Full Theme Manifest must declare every required presentation group exactly once.",
        )
    _versioned_refs(value["packRefs"], "packRefs")
    if "defaultCompositionRef" not in value:
        raise RuntimeServiceError(
            "theme_package_manifest_invalid",
            "Full Theme Manifest requires defaultCompositionRef.",
        )
    _versioned_ref(value["defaultCompositionRef"], "defaultCompositionRef")
    _dependencies(value.get("dependencies", []))
    _tokens(value["tokens"])
    _system_terms(value["systemTerms"])
    if "author" in value:
        author = _object(value["author"], "author")
        _strict_fields(author, {"name"}, {"url"}, "author")
        _bounded_string(author["name"], "author.name", 120)
        if "url" in author:
            _bounded_string(author["url"], "author.url", 2000)
    if "license" in value:
        _bounded_string(value["license"], "license", 200)
    if "metadata" in value:
        metadata = _object(value["metadata"], "metadata")
        _strict_fields(metadata, set(), {"createdAt", "updatedAt", "keywords"}, "metadata")
        for field in ("createdAt", "updatedAt"):
            if field in metadata:
                timestamp = _bounded_string(metadata[field], f"metadata.{field}", 100)
                try:
                    datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                except ValueError as error:
                    raise RuntimeServiceError(
                        "theme_package_manifest_invalid",
                        f"metadata.{field} must be an ISO 8601 date-time.",
                    ) from error
        if "keywords" in metadata:
            keywords = metadata["keywords"]
            if (
                not isinstance(keywords, list)
                or len(keywords) > 32
                or any(not isinstance(keyword, str) for keyword in keywords)
                or len(set(keywords)) != len(keywords)
            ):
                raise RuntimeServiceError(
                    "theme_package_manifest_invalid",
                    "metadata.keywords must contain at most 32 unique strings.",
                )
            for index, keyword in enumerate(keywords):
                text = _bounded_string(keyword, f"metadata.keywords[{index}]", 40)
                if not text.strip():
                    raise RuntimeServiceError(
                        "theme_package_manifest_invalid",
                        f"metadata.keywords[{index}] must not be empty.",
                    )
    _reject_executable_content(value)


def _validate_skin_pack(value: dict[str, JSONValue]) -> None:
    _reject_executable_content(value)
    try:
        _validate_skin_pack_contract(value)
    except RuntimeServiceError as error:
        if error.code in {
            "theme_package_incompatible",
            "theme_package_executable_content",
            "theme_package_skin_pack_schema_invalid",
        }:
            raise
        raise RuntimeServiceError(
            "theme_package_skin_pack_schema_invalid",
            f"SkinPack schema validation failed: {error}",
        ) from error


def _validate_skin_pack_contract(value: dict[str, JSONValue]) -> None:
    required = {
        "schemaVersion",
        "packId",
        "version",
        "packageKind",
        "displayName",
        "compatibility",
        "assets",
        "skins",
    }
    optional = {"$schema", "description", "dependencies", "license", "author"}
    _strict_fields(value, required, optional, "SkinPack")
    if value["schemaVersion"] != 1:
        raise RuntimeServiceError(
            "theme_package_skin_pack_schema_invalid",
            "SkinPack schemaVersion is not supported.",
        )
    _namespaced_id(value["packId"], "SkinPack.packId")
    _semver(value["version"], "SkinPack.version")
    if value["packageKind"] not in {"skin-pack", "single-skin"}:
        _skin_pack_invalid("SkinPack.packageKind is invalid.")
    _bounded_string(value["displayName"], "SkinPack.displayName", 120)
    if "description" in value:
        _bounded_string(value["description"], "SkinPack.description", 2000)
    compatibility = _object(value["compatibility"], "SkinPack.compatibility")
    _strict_fields(compatibility, {"themeEngine"}, {"cosmos"}, "SkinPack.compatibility")
    if not _version_satisfies(
        THEME_ENGINE_VERSION,
        _version_range(compatibility["themeEngine"], "SkinPack.compatibility.themeEngine"),
    ):
        raise RuntimeServiceError(
            "theme_package_incompatible",
            f"SkinPack is incompatible with Theme Engine {THEME_ENGINE_VERSION}.",
        )
    if "cosmos" in compatibility:
        _version_range(compatibility["cosmos"], "SkinPack.compatibility.cosmos")
    if "dependencies" in value:
        _versioned_refs(value["dependencies"], "SkinPack.dependencies")
    assets = _list(value["assets"], "SkinPack.assets", maximum=4096)
    for index, asset in enumerate(assets):
        _validate_skin_asset(_object(asset, f"SkinPack.assets[{index}]"), index)
    skins = _list(value["skins"], "SkinPack.skins", minimum=1, maximum=4096)
    if value["packageKind"] == "single-skin" and len(skins) != 1:
        _skin_pack_invalid("single-skin packages must contain exactly one Skin.")
    for index, skin in enumerate(skins):
        _validate_skin(_object(skin, f"SkinPack.skins[{index}]"), index)
    for field, maximum in (("license", 200), ("author", 120), ("$schema", 2000)):
        if field in value:
            _bounded_string(value[field], f"SkinPack.{field}", maximum)


def _validate_skin_asset(value: dict[str, JSONValue], index: int) -> None:
    required = {
        "assetId",
        "kind",
        "format",
        "mimeType",
        "path",
        "sha256",
        "byteSize",
        "width",
        "height",
    }
    optional = {
        "colorSpace",
        "alpha",
        "density",
        "accessibilityDescription",
        "media",
    }
    field = f"SkinPack.assets[{index}]"
    _strict_fields(value, required, optional, field)
    _namespaced_id(value["assetId"], f"{field}.assetId")
    kind = _enum(value["kind"], {"image", "vector", "video"}, f"{field}.kind")
    format_value = _enum(value["format"], {"png", "webp", "svg", "webm", "mp4"}, f"{field}.format")
    mime_type = _enum(
        value["mimeType"],
        {"image/png", "image/webp", "image/svg+xml", "video/webm", "video/mp4"},
        f"{field}.mimeType",
    )
    _validate_archive_path(_string(value["path"], f"{field}.path"), False)
    _digest(value["sha256"], f"{field}.sha256")
    _integer(value["byteSize"], f"{field}.byteSize", 1, 64 * 1024 * 1024)
    _integer(value["width"], f"{field}.width", 1, 8192)
    _integer(value["height"], f"{field}.height", 1, 8192)
    expected = {
        "png": ("image", "image/png"),
        "webp": ("image", "image/webp"),
        "svg": ("vector", "image/svg+xml"),
        "webm": ("video", "video/webm"),
        "mp4": ("video", "video/mp4"),
    }[format_value]
    if (kind, mime_type) != expected:
        _skin_pack_invalid(f"{field} media kind, format and MIME type do not agree.")
    if kind != "video" and int(value["byteSize"]) > 16 * 1024 * 1024:
        _skin_pack_invalid(f"{field}.byteSize exceeds the static asset limit.")
    if "colorSpace" in value:
        _enum(value["colorSpace"], {"srgb", "display-p3", "unknown"}, f"{field}.colorSpace")
    if "alpha" in value and not isinstance(value["alpha"], bool):
        _skin_pack_invalid(f"{field}.alpha must be a boolean.")
    if "density" in value:
        _number(value["density"], f"{field}.density", minimum=0, maximum=8, exclusive_minimum=True)
    if "accessibilityDescription" in value:
        _bounded_string(value["accessibilityDescription"], f"{field}.accessibilityDescription", 500)
    if kind == "video":
        _validate_skin_media(_object(value.get("media"), f"{field}.media"), field)
    elif "media" in value:
        _skin_pack_invalid(f"{field}.media is valid only for video assets.")


def _validate_skin_media(value: dict[str, JSONValue], field: str) -> None:
    required = {
        "posterAssetId",
        "reducedMotionAssetId",
        "loop",
        "autoplay",
        "muted",
        "playbackRate",
        "lazyLoad",
    }
    _strict_fields(value, required, set(), f"{field}.media")
    _namespaced_id(value["posterAssetId"], f"{field}.media.posterAssetId")
    _namespaced_id(value["reducedMotionAssetId"], f"{field}.media.reducedMotionAssetId")
    for name in ("loop", "autoplay", "muted"):
        if not isinstance(value[name], bool):
            _skin_pack_invalid(f"{field}.media.{name} must be a boolean.")
    _number(value["playbackRate"], f"{field}.media.playbackRate", minimum=0.25, maximum=4)
    _enum(value["lazyLoad"], {"eager", "viewport", "on-demand"}, f"{field}.media.lazyLoad")
    if value["autoplay"] is True and value["muted"] is not True:
        _skin_pack_invalid(f"{field}.media autoplay requires muted playback.")


def _validate_skin(value: dict[str, JSONValue], index: int) -> None:
    required = {
        "skinId",
        "version",
        "displayName",
        "target",
        "assetBindings",
        "tokens",
        "materials",
        "stateVariants",
    }
    optional = {"systemTerms", "boundsOverrides", "animations"}
    field = f"SkinPack.skins[{index}]"
    _strict_fields(value, required, optional, field)
    _namespaced_id(value["skinId"], f"{field}.skinId")
    _semver(value["version"], f"{field}.version")
    _bounded_string(value["displayName"], f"{field}.displayName", 120)
    _validate_skin_target(_object(value["target"], f"{field}.target"), field)
    bindings = _list(value["assetBindings"], f"{field}.assetBindings", maximum=512)
    for binding_index, binding in enumerate(bindings):
        _validate_asset_binding(_object(binding, f"{field}.assetBindings[{binding_index}]"), field)
    _tokens(value["tokens"])
    materials = _list(value["materials"], f"{field}.materials", maximum=128)
    for material_index, material in enumerate(materials):
        _validate_material(_object(material, f"{field}.materials[{material_index}]"), field)
    variants = _list(value["stateVariants"], f"{field}.stateVariants", maximum=128)
    for variant_index, variant in enumerate(variants):
        _validate_state_variant(_object(variant, f"{field}.stateVariants[{variant_index}]"), field)
    if "systemTerms" in value:
        _system_terms(value["systemTerms"])
    if "boundsOverrides" in value:
        for bound_index, bound in enumerate(_list(value["boundsOverrides"], f"{field}.boundsOverrides")):
            _validate_bounds_override(_object(bound, f"{field}.boundsOverrides[{bound_index}]"), field)
    if "animations" in value:
        for animation_index, animation in enumerate(_list(value["animations"], f"{field}.animations")):
            _validate_animation(_object(animation, f"{field}.animations[{animation_index}]"), field)


def _validate_skin_target(value: dict[str, JSONValue], field: str) -> None:
    _strict_fields(
        value, {"presentationGroup"}, {"templateRef", "rendererRef", "targetRoles"}, f"{field}.target"
    )
    _enum(value["presentationGroup"], _PRESENTATION_GROUPS, f"{field}.target.presentationGroup")
    for name in ("templateRef", "rendererRef"):
        if name in value:
            _versioned_ref(value[name], f"{field}.target.{name}")
    if "targetRoles" in value:
        roles = _list(value["targetRoles"], f"{field}.target.targetRoles")
        _unique_namespaced_ids(roles, f"{field}.target.targetRoles")


def _validate_asset_binding(value: dict[str, JSONValue], field: str) -> None:
    required = {"bindingId", "slotId", "assetId"}
    optional = {"fit", "alignment", "opacity", "tint", "states"}
    _strict_fields(value, required, optional, f"{field}.assetBinding")
    for name in required:
        _namespaced_id(value[name], f"{field}.assetBinding.{name}")
    if "fit" in value:
        _enum(value["fit"], {"contain", "cover", "fill", "none"}, f"{field}.assetBinding.fit")
    if "alignment" in value:
        _enum(
            value["alignment"],
            {
                "center",
                "top",
                "right",
                "bottom",
                "left",
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
            },
            f"{field}.assetBinding.alignment",
        )
    if "opacity" in value:
        _number(value["opacity"], f"{field}.assetBinding.opacity", minimum=0, maximum=1)
    if "tint" in value:
        _bounded_string(value["tint"], f"{field}.assetBinding.tint", 100)
    if "states" in value:
        _unique_symbols(
            _list(value["states"], f"{field}.assetBinding.states"), f"{field}.assetBinding.states"
        )


def _validate_material(value: dict[str, JSONValue], field: str) -> None:
    _strict_fields(value, {"channelId", "parameters"}, set(), f"{field}.material")
    _namespaced_id(value["channelId"], f"{field}.material.channelId")
    parameters = _object(value["parameters"], f"{field}.material.parameters")
    if len(parameters) > 128:
        _skin_pack_invalid(f"{field}.material.parameters exceeds 128 properties.")
    for name, parameter in parameters.items():
        _namespaced_id(name, f"{field}.material.parameters key")
        _validate_json_value(parameter, f"{field}.material.parameters.{name}")


def _validate_state_variant(value: dict[str, JSONValue], field: str) -> None:
    optional = {"assetBindingIds", "tokenOverrides", "materialOverrides", "animationId"}
    _strict_fields(value, {"stateId"}, optional, f"{field}.stateVariant")
    _symbol(value["stateId"], f"{field}.stateVariant.stateId")
    if "assetBindingIds" in value:
        _unique_namespaced_ids(
            _list(value["assetBindingIds"], f"{field}.stateVariant.assetBindingIds"),
            f"{field}.stateVariant.assetBindingIds",
        )
    if "tokenOverrides" in value:
        _tokens(value["tokenOverrides"])
    if "materialOverrides" in value:
        for material in _list(value["materialOverrides"], f"{field}.stateVariant.materialOverrides"):
            _validate_material(_object(material, f"{field}.stateVariant.materialOverride"), field)
    if "animationId" in value:
        _namespaced_id(value["animationId"], f"{field}.stateVariant.animationId")


def _validate_skin_pack_asset_closure(
    skin_pack: dict[str, JSONValue],
    available_assets: dict[str, dict[str, JSONValue]],
) -> None:
    declared_assets = _list(skin_pack["assets"], "SkinPack.assets")
    local_assets: dict[str, dict[str, JSONValue]] = {}
    for index, value in enumerate(declared_assets):
        asset = _object(value, f"SkinPack.assets[{index}]")
        asset_id = str(asset["assetId"])
        if asset_id in local_assets:
            _skin_pack_invalid(f'SkinPack declares duplicate assetId "{asset_id}".')
        visual = available_assets.get(asset_id)
        if visual is None:
            raise RuntimeServiceError(
                "theme_package_skin_pack_asset_missing",
                f'SkinPack asset "{asset_id}" is not declared in the package Asset Catalog batch.',
            )
        comparable = {
            "kind": "kind",
            "format": "format",
            "mimeType": "mimeType",
            "path": "path",
            "sha256": "sha256",
            "byteSize": "byteSize",
            "width": "width",
            "height": "height",
            "colorSpace": "colorSpace",
            "alpha": "alpha",
            "density": "density",
            "accessibilityDescription": "accessibilityDescription",
        }
        if any(asset.get(left) != visual.get(right) for left, right in comparable.items()):
            raise RuntimeServiceError(
                "theme_package_skin_pack_asset_mismatch",
                f'SkinPack asset "{asset_id}" does not match its validated Visual Asset.',
            )
        local_assets[asset_id] = asset

    for skin_value in _list(skin_pack["skins"], "SkinPack.skins"):
        skin = _object(skin_value, "SkinPack.skin")
        binding_ids: set[str] = set()
        for binding_value in _list(skin["assetBindings"], "Skin.assetBindings"):
            binding = _object(binding_value, "Skin.assetBinding")
            binding_id = str(binding["bindingId"])
            if binding_id in binding_ids:
                _skin_pack_invalid(f'Skin "{skin["skinId"]}" contains duplicate binding IDs.')
            binding_ids.add(binding_id)
            if str(binding["assetId"]) not in local_assets:
                raise RuntimeServiceError(
                    "theme_package_skin_pack_asset_missing",
                    f'Skin binding "{binding_id}" references an undeclared package asset.',
                )
        for variant_value in _list(skin["stateVariants"], "Skin.stateVariants"):
            variant = _object(variant_value, "Skin.stateVariant")
            for binding_id in _list(variant.get("assetBindingIds", []), "StateVariant.assetBindingIds"):
                if binding_id not in binding_ids:
                    _skin_pack_invalid(f'StateVariant references unknown binding "{binding_id}".')
    for asset in local_assets.values():
        media = asset.get("media")
        if isinstance(media, dict):
            for name in ("posterAssetId", "reducedMotionAssetId"):
                if str(media[name]) not in local_assets:
                    raise RuntimeServiceError(
                        "theme_package_skin_pack_asset_missing",
                        f'Video fallback "{media[name]}" is not declared by the SkinPack.',
                    )


def _validate_bounds_override(value: dict[str, JSONValue], field: str) -> None:
    _strict_fields(value, {"boundsId", "role", "shape"}, set(), f"{field}.boundsOverride")
    _namespaced_id(value["boundsId"], f"{field}.boundsOverride.boundsId")
    _enum(value["role"], {"visual", "effect", "label"}, f"{field}.boundsOverride.role")
    _validate_shape(_object(value["shape"], f"{field}.boundsOverride.shape"), field)


def _validate_shape(value: dict[str, JSONValue], field: str) -> None:
    shape_type = value.get("type")
    if shape_type == "rect":
        _strict_fields(value, {"type", "x", "y", "width", "height"}, {"radius"}, f"{field}.shape")
        for name in ("x", "y"):
            _number(value[name], f"{field}.shape.{name}")
        for name in ("width", "height"):
            _number(value[name], f"{field}.shape.{name}", minimum=0, exclusive_minimum=True)
        if "radius" in value:
            _number(value["radius"], f"{field}.shape.radius", minimum=0)
        return
    if shape_type == "ellipse":
        _strict_fields(value, {"type", "cx", "cy", "rx", "ry"}, set(), f"{field}.shape")
        for name in ("cx", "cy"):
            _number(value[name], f"{field}.shape.{name}")
        for name in ("rx", "ry"):
            _number(value[name], f"{field}.shape.{name}", minimum=0, exclusive_minimum=True)
        return
    if shape_type == "polygon":
        _strict_fields(value, {"type", "points"}, set(), f"{field}.shape")
        points = _list(value["points"], f"{field}.shape.points", minimum=3, maximum=128)
        for point in points:
            item = _object(point, f"{field}.shape.point")
            _strict_fields(item, {"x", "y"}, set(), f"{field}.shape.point")
            _number(item["x"], f"{field}.shape.point.x")
            _number(item["y"], f"{field}.shape.point.y")
        return
    _skin_pack_invalid(f"{field}.shape has an unsupported type.")


def _validate_animation(value: dict[str, JSONValue], field: str) -> None:
    required = {"animationId", "durationMs", "iterations", "reducedMotion", "keyframes"}
    optional = {"substituteAnimationId"}
    _strict_fields(value, required, optional, f"{field}.animation")
    _namespaced_id(value["animationId"], f"{field}.animation.animationId")
    _integer(value["durationMs"], f"{field}.animation.durationMs", 0, 600000)
    iterations = value["iterations"]
    if iterations != "infinite":
        _integer(iterations, f"{field}.animation.iterations", 1, 1000)
    reduced_motion = _enum(
        value["reducedMotion"],
        {"disable", "freeze-first", "freeze-last", "substitute"},
        f"{field}.animation.reducedMotion",
    )
    if reduced_motion == "substitute":
        _namespaced_id(value.get("substituteAnimationId"), f"{field}.animation.substituteAnimationId")
    keyframes = _list(value["keyframes"], f"{field}.animation.keyframes", minimum=2, maximum=128)
    for keyframe in keyframes:
        item = _object(keyframe, f"{field}.animation.keyframe")
        _strict_fields(item, {"offset", "values"}, set(), f"{field}.animation.keyframe")
        _number(item["offset"], f"{field}.animation.keyframe.offset", minimum=0, maximum=1)
        values = _object(item["values"], f"{field}.animation.keyframe.values")
        if len(values) > 32 or any(
            not isinstance(entry, (str, int, float, bool)) or entry is None for entry in values.values()
        ):
            _skin_pack_invalid(f"{field}.animation keyframe values are invalid.")


def _tokens(value: JSONValue) -> None:
    tokens = _object(value, "tokens")
    for token_id, token_value in tokens.items():
        _namespaced_id(token_id, "token ID")
        token = _object(token_value, f"tokens.{token_id}")
        _strict_fields(token, {"type", "value"}, {"description"}, f"tokens.{token_id}")
        token_type = token["type"]
        if token_type not in _TOKEN_TYPES:
            raise RuntimeServiceError(
                "theme_package_manifest_invalid",
                f'Theme token "{token_id}" has an unsupported type.',
            )
        typed_value = token["value"]
        if token_type in {"number", "opacity"}:
            if isinstance(typed_value, bool) or not isinstance(typed_value, (int, float)):
                raise RuntimeServiceError(
                    "theme_package_manifest_invalid",
                    f'Theme token "{token_id}" requires a numeric value.',
                )
        elif token_type == "boolean":
            if not isinstance(typed_value, bool):
                raise RuntimeServiceError(
                    "theme_package_manifest_invalid",
                    f'Theme token "{token_id}" requires a boolean value.',
                )
        elif not isinstance(typed_value, str) or len(typed_value) > 1000:
            raise RuntimeServiceError(
                "theme_package_manifest_invalid",
                f'Theme token "{token_id}" requires a bounded string value.',
            )
        if "description" in token:
            _bounded_string(token["description"], f"tokens.{token_id}.description", 500)


def _system_terms(value: JSONValue) -> None:
    terms = _object(value, "systemTerms")
    for key, translations_value in terms.items():
        if not key.startswith("system.") or _ID.fullmatch(key) is None:
            raise RuntimeServiceError(
                "theme_package_manifest_invalid",
                f'Invalid system term key "{key}".',
            )
        translations = _object(translations_value, f"systemTerms.{key}")
        if not translations:
            raise RuntimeServiceError(
                "theme_package_manifest_invalid",
                f'System term "{key}" requires at least one locale.',
            )
        for locale, translation in translations.items():
            if re.fullmatch(r"[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*", locale) is None:
                raise RuntimeServiceError(
                    "theme_package_manifest_invalid",
                    f'System term "{key}" has an invalid locale.',
                )
            _bounded_string(translation, f"systemTerms.{key}.{locale}", 200)


def _dependencies(value: JSONValue) -> None:
    if not isinstance(value, list):
        raise RuntimeServiceError(
            "theme_package_manifest_invalid",
            "dependencies must be an array.",
        )
    for index, dependency_value in enumerate(value):
        dependency = _object(dependency_value, f"dependencies[{index}]")
        _strict_fields(
            dependency,
            {"id", "versionRange", "kind"},
            {"optional"},
            f"dependencies[{index}]",
        )
        _namespaced_id(dependency["id"], f"dependencies[{index}].id")
        _version_range(dependency["versionRange"], f"dependencies[{index}].versionRange")
        if dependency["kind"] not in {
            "theme",
            "skin-pack",
            "template-pack",
            "renderer-pack",
        }:
            raise RuntimeServiceError(
                "theme_package_manifest_invalid",
                f"dependencies[{index}].kind is invalid.",
            )
        if "optional" in dependency and not isinstance(dependency["optional"], bool):
            raise RuntimeServiceError(
                "theme_package_manifest_invalid",
                f"dependencies[{index}].optional must be boolean.",
            )


def _versioned_refs(value: JSONValue, field: str) -> None:
    if not isinstance(value, list):
        raise RuntimeServiceError("theme_package_manifest_invalid", f"{field} must be an array.")
    seen: set[tuple[str, str]] = set()
    for index, item in enumerate(value):
        reference = _versioned_ref(item, f"{field}[{index}]")
        pair = (reference["id"], reference["versionRange"])
        if pair in seen:
            raise RuntimeServiceError(
                "theme_package_manifest_invalid",
                f"{field} must not contain duplicate references.",
            )
        seen.add(pair)


def _versioned_ref(value: JSONValue, field: str) -> dict[str, str]:
    reference = _object(value, field)
    _strict_fields(reference, {"id", "versionRange"}, set(), field)
    return {
        "id": _namespaced_id(reference["id"], f"{field}.id"),
        "versionRange": _version_range(reference["versionRange"], f"{field}.versionRange"),
    }


def _version_satisfies(version: str, range_value: str) -> bool:
    normalized = range_value.strip()
    if normalized in {"*", "latest"}:
        return True
    operator = normalized[0] if normalized[:1] in {"^", "~"} else ""
    candidate = normalized[1:] if operator else normalized
    parsed_version = _parse_version(version)
    parsed_candidate = _parse_version(candidate)
    if parsed_version is None or parsed_candidate is None or parsed_version < parsed_candidate:
        return False
    if not operator:
        return parsed_version == parsed_candidate
    if operator == "~":
        return parsed_version[:2] == parsed_candidate[:2]
    if parsed_candidate[0] > 0:
        return parsed_version[0] == parsed_candidate[0]
    if parsed_candidate[1] > 0:
        return parsed_version[:2] == parsed_candidate[:2]
    return parsed_version == parsed_candidate


def _parse_version(value: str) -> tuple[int, int, int] | None:
    match = _SEMVER.fullmatch(value)
    if match is None:
        return None
    return int(match[1]), int(match[2]), int(match[3])


def _version_range(value: JSONValue, field: str) -> str:
    text = _string(value, field)
    normalized = text.strip()
    candidate = normalized[1:] if normalized[:1] in {"^", "~"} else normalized
    if normalized not in {"*", "latest"} and _SEMVER.fullmatch(candidate) is None:
        raise RuntimeServiceError(
            "theme_package_manifest_invalid",
            f"{field} contains an unsupported semantic version range.",
        )
    return text


def _reject_executable_content(value: JSONValue) -> None:
    if isinstance(value, str):
        if any(pattern.search(value) for pattern in _FORBIDDEN_TEXT):
            raise RuntimeServiceError(
                "theme_package_executable_content",
                "Theme Manifest contains executable or active content.",
            )
        return
    if isinstance(value, list):
        for entry in value:
            _reject_executable_content(entry)
        return
    if isinstance(value, dict):
        for key, entry in value.items():
            normalized = key.replace("-", "").replace("_", "").replace(".", "").lower()
            if normalized in _FORBIDDEN_KEYS:
                raise RuntimeServiceError(
                    "theme_package_executable_content",
                    "Theme Manifest contains a forbidden executable property.",
                )
            _reject_executable_content(entry)


def _validate_archive_path(value: str, directory: bool) -> str:
    if not value or "\x00" in value or "\\" in value:
        raise RuntimeServiceError(
            "theme_package_path_invalid",
            "Theme Package entry path is invalid.",
        )
    normalized = value[:-1] if directory and value.endswith("/") else value
    path = PurePosixPath(normalized)
    if (
        not normalized
        or normalized.startswith("/")
        or re.match(r"^[A-Za-z]:", normalized)
        or "://" in normalized
        or "?" in normalized
        or "#" in normalized
        or any(part in {"", ".", ".."} for part in path.parts)
        or path.as_posix() != normalized
    ):
        raise RuntimeServiceError(
            "theme_package_path_invalid",
            f'Theme Package entry path "{value}" is not a safe relative path.',
        )
    return f"{normalized}/" if directory else normalized


def _validate_zip_entry_type(info: zipfile.ZipInfo) -> None:
    mode = (info.external_attr >> 16) & 0xFFFF
    entry_type = stat.S_IFMT(mode)
    if entry_type and entry_type not in {stat.S_IFREG, stat.S_IFDIR}:
        raise RuntimeServiceError(
            "theme_package_link_forbidden",
            f'Theme Package entry "{info.filename}" is a link or unsupported filesystem object.',
        )


def _read_bounded(archive: zipfile.ZipFile, info: zipfile.ZipInfo, maximum: int) -> bytes:
    with archive.open(info) as stream:
        content = stream.read(maximum + 1)
        if len(content) > maximum or stream.read(1):
            raise RuntimeServiceError(
                "theme_package_entry_too_large",
                f'Theme Package entry "{info.filename}" exceeds its intake limit.',
            )
    if len(content) != info.file_size:
        raise RuntimeServiceError(
            "theme_package_archive_invalid",
            f'Theme Package entry "{info.filename}" size does not match its archive metadata.',
        )
    return content


def _unique_json_object(pairs: list[tuple[str, JSONValue]]) -> dict[str, JSONValue]:
    result: dict[str, JSONValue] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"Duplicate JSON property: {key}")
        result[key] = value
    return result


def _strict_fields(
    value: dict[str, JSONValue],
    required: set[str],
    optional: set[str],
    field: str,
) -> None:
    missing = required - value.keys()
    unknown = value.keys() - required - optional
    if missing or unknown:
        raise RuntimeServiceError(
            "theme_package_manifest_invalid",
            f"{field} has missing or unsupported fields.",
        )


def _object(value: object, field: str) -> dict[str, JSONValue]:
    if not isinstance(value, dict) or any(not isinstance(key, str) for key in value):
        raise RuntimeServiceError(
            "theme_package_manifest_invalid",
            f"{field} must be an object.",
        )
    return value


def _list(
    value: object,
    field: str,
    *,
    minimum: int = 0,
    maximum: int | None = None,
) -> list[JSONValue]:
    if not isinstance(value, list) or len(value) < minimum or (maximum is not None and len(value) > maximum):
        _skin_pack_invalid(f"{field} must be an array with an allowed item count.")
    return value


def _enum(value: object, allowed: set[str], field: str) -> str:
    if not isinstance(value, str) or value not in allowed:
        _skin_pack_invalid(f"{field} contains an unsupported value.")
    return value


def _integer(value: object, field: str, minimum: int, maximum: int) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or not minimum <= value <= maximum:
        _skin_pack_invalid(f"{field} must be an integer in the allowed range.")
    return value


def _number(
    value: object,
    field: str,
    *,
    minimum: float | None = None,
    maximum: float | None = None,
    exclusive_minimum: bool = False,
) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        _skin_pack_invalid(f"{field} must be a number.")
    number = float(value)
    if minimum is not None and (number < minimum or (exclusive_minimum and number == minimum)):
        _skin_pack_invalid(f"{field} is below the allowed range.")
    if maximum is not None and number > maximum:
        _skin_pack_invalid(f"{field} is above the allowed range.")
    return number


def _symbol(value: object, field: str) -> str:
    text = _string(value, field)
    if len(text) > 120 or re.fullmatch(r"^[a-z0-9]+(?:[._-][a-z0-9]+)*$", text) is None:
        _skin_pack_invalid(f"{field} must be a symbol identifier.")
    return text


def _unique_namespaced_ids(values: list[JSONValue], field: str) -> None:
    resolved = [_namespaced_id(value, f"{field} item") for value in values]
    if len(set(resolved)) != len(resolved):
        _skin_pack_invalid(f"{field} must contain unique values.")


def _unique_symbols(values: list[JSONValue], field: str) -> None:
    resolved = [_symbol(value, f"{field} item") for value in values]
    if len(set(resolved)) != len(resolved):
        _skin_pack_invalid(f"{field} must contain unique values.")


def _validate_json_value(value: JSONValue, field: str, depth: int = 0) -> None:
    if depth > 16:
        _skin_pack_invalid(f"{field} exceeds the maximum JSON nesting depth.")
    if value is None or isinstance(value, (bool, int, float)):
        return
    if isinstance(value, str):
        if len(value) > 1000:
            _skin_pack_invalid(f"{field} exceeds 1000 characters.")
        return
    if isinstance(value, list):
        if len(value) > 128:
            _skin_pack_invalid(f"{field} exceeds 128 items.")
        for index, entry in enumerate(value):
            _validate_json_value(entry, f"{field}[{index}]", depth + 1)
        return
    if isinstance(value, dict):
        if len(value) > 128 or any(not isinstance(key, str) for key in value):
            _skin_pack_invalid(f"{field} contains an invalid JSON object.")
        for key, entry in value.items():
            _validate_json_value(entry, f"{field}.{key}", depth + 1)
        return
    _skin_pack_invalid(f"{field} contains a non-JSON value.")


def _skin_pack_invalid(message: str) -> None:
    raise RuntimeServiceError("theme_package_skin_pack_schema_invalid", message)


def _required_string(value: dict[str, JSONValue], key: str, field: str) -> str:
    return _string(value.get(key), f"{field}.{key}")


def _namespaced_id(value: object, field: str) -> str:
    text = _string(value, field)
    if len(text) > 200 or _ID.fullmatch(text) is None:
        raise RuntimeServiceError(
            "theme_package_manifest_invalid",
            f"{field} must be a namespaced identifier.",
        )
    return text


def _semver(value: object, field: str) -> str:
    text = _string(value, field)
    if _SEMVER.fullmatch(text) is None:
        raise RuntimeServiceError(
            "theme_package_manifest_invalid",
            f"{field} must be a semantic version.",
        )
    return text


def _digest(value: object, field: str) -> str:
    text = _string(value, field)
    if _DIGEST.fullmatch(text) is None:
        raise RuntimeServiceError(
            "theme_package_integrity_failed",
            f"{field} must be a lower-case SHA-256 digest.",
        )
    return text


def _bounded_string(value: object, field: str, maximum: int) -> str:
    text = _string(value, field)
    if len(text) > maximum:
        raise RuntimeServiceError(
            "theme_package_manifest_invalid",
            f"{field} exceeds {maximum} characters.",
        )
    return text


def _string(value: object, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise RuntimeServiceError(
            "theme_package_manifest_invalid",
            f"{field} must be a non-empty string.",
        )
    return value


def _file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()
