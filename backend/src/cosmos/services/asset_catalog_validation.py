from __future__ import annotations

import hashlib
import re
import struct
import zlib
from pathlib import PurePosixPath

from cosmos.domain.objects import JSONValue
from cosmos.services.errors import RuntimeServiceError

_ID = re.compile(r"^[a-z0-9]+(?:[._-][a-z0-9]+)+$")
_SYMBOL = re.compile(r"^[a-z0-9]+(?:[._-][a-z0-9]+)*$")
_SEMVER = re.compile(
    r"^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)"
    r"(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$"
)
_FORMAT_FACTS = {
    "png": ("image", "image/png"),
    "webp": ("image", "image/webp"),
    "svg": ("vector", "image/svg+xml"),
}
_VISUAL_REQUIRED = {
    "schemaVersion",
    "id",
    "version",
    "kind",
    "format",
    "mimeType",
    "path",
    "sha256",
    "byteSize",
    "width",
    "height",
}
_VISUAL_OPTIONAL = {
    "colorSpace",
    "alpha",
    "density",
    "accessibilityDescription",
}
_ENTRY_REQUIRED = {
    "schemaVersion",
    "id",
    "version",
    "visualAssetRef",
    "displayName",
    "description",
    "category",
    "scope",
    "origin",
    "systemTags",
    "userTags",
    "perspective",
    "orientation",
    "scaleClass",
    "creator",
    "provenance",
    "license",
    "compatibleTemplates",
    "compatibleSurfaceTypes",
    "compatibleVisualObjectTypes",
    "deprecated",
}
_ENTRY_OPTIONAL = {
    "subCategory",
    "theme",
    "thumbnailRef",
    "previewRef",
    "layerPreviewRef",
    "replacement",
}
_SVG_FORBIDDEN = (
    re.compile(r"<!doctype\b", re.IGNORECASE),
    re.compile(r"<!entity\b", re.IGNORECASE),
    re.compile(
        r"<\s*(?:script|foreignObject|iframe|object|embed|audio|video|"
        r"animate|animateMotion|animateTransform|set)\b",
        re.IGNORECASE,
    ),
    re.compile(r"\son[a-z][a-z0-9:_-]*\s*=", re.IGNORECASE),
    re.compile(r"\bjavascript\s*:", re.IGNORECASE),
    re.compile(r"@import\b", re.IGNORECASE),
    re.compile(r"\burl\(\s*(['\"]?)(?!#)[^)]+\1\s*\)", re.IGNORECASE),
    re.compile(r"\b(?:href|xlink:href)\s*=\s*(['\"])(?!#)[\s\S]*?\1", re.IGNORECASE),
)


def validate_asset_catalog_promotion(
    visual_asset_value: object,
    catalog_entry_value: object,
    original_bytes: bytes,
) -> tuple[dict[str, JSONValue], dict[str, JSONValue]]:
    visual_asset = _object(visual_asset_value, "visualAsset")
    catalog_entry = _object(catalog_entry_value, "catalogEntry")
    _strict_fields(visual_asset, _VISUAL_REQUIRED, _VISUAL_OPTIONAL, "visualAsset")
    _strict_fields(catalog_entry, _ENTRY_REQUIRED, _ENTRY_OPTIONAL, "catalogEntry")
    _validate_visual_asset(visual_asset, original_bytes)
    _validate_catalog_entry(catalog_entry, visual_asset)
    return visual_asset, catalog_entry


def expected_visual_asset_path(visual_asset: dict[str, JSONValue]) -> str:
    return (
        f"visual-assets/{visual_asset['id']}/{visual_asset['version']}/"
        f"original.{visual_asset['format']}"
    )


def _validate_visual_asset(value: dict[str, JSONValue], original_bytes: bytes) -> None:
    if value["schemaVersion"] != 1:
        _invalid("visualAsset.schemaVersion must be 1.")
    asset_id = _namespaced_id(value["id"], "visualAsset.id")
    version = _semver(value["version"], "visualAsset.version")
    asset_format = _string(value["format"], "visualAsset.format")
    facts = _FORMAT_FACTS.get(asset_format)
    if facts is None:
        _invalid("Only static PNG, WebP and SVG Visual Assets are supported.")
    if value["kind"] != facts[0] or value["mimeType"] != facts[1]:
        _invalid("Visual Asset kind, format and MIME type do not agree.")
    byte_size = _positive_integer(value["byteSize"], "visualAsset.byteSize", maximum=16_777_216)
    width = _positive_integer(value["width"], "visualAsset.width", maximum=8192)
    height = _positive_integer(value["height"], "visualAsset.height", maximum=8192)
    digest = _string(value["sha256"], "visualAsset.sha256").lower()
    if not re.fullmatch(r"[a-f0-9]{64}", digest):
        _invalid("visualAsset.sha256 must be a lowercase SHA-256 digest.")
    if len(original_bytes) != byte_size or hashlib.sha256(original_bytes).hexdigest() != digest:
        _invalid("Original bytes do not match the declared Visual Asset digest and byte size.")
    expected_path = f"visual-assets/{asset_id}/{version}/original.{asset_format}"
    path = _relative_path(value["path"], "visualAsset.path")
    if path != expected_path:
        _invalid(f'visualAsset.path must be the canonical Resource path "{expected_path}".')
    detected_width, detected_height, detected_alpha = _inspect_static_media(asset_format, original_bytes)
    if (width, height) != (detected_width, detected_height):
        _invalid("Original bytes do not match the declared Visual Asset dimensions.")
    if "alpha" in value and value["alpha"] is not detected_alpha:
        _invalid("Original bytes do not match the declared Visual Asset transparency.")
    if "colorSpace" in value and value["colorSpace"] not in {"srgb", "display-p3", "unknown"}:
        _invalid("visualAsset.colorSpace is invalid.")
    if "density" in value:
        density = value["density"]
        if isinstance(density, bool) or not isinstance(density, (int, float)) or not 0 < density <= 8:
            _invalid("visualAsset.density must be greater than 0 and at most 8.")
    if "accessibilityDescription" in value:
        _bounded_string(value["accessibilityDescription"], "visualAsset.accessibilityDescription", 500)


def _validate_catalog_entry(
    value: dict[str, JSONValue],
    visual_asset: dict[str, JSONValue],
) -> None:
    if value["schemaVersion"] != 1:
        _invalid("catalogEntry.schemaVersion must be 1.")
    _namespaced_id(value["id"], "catalogEntry.id")
    _semver(value["version"], "catalogEntry.version")
    reference = _exact_reference(value["visualAssetRef"], "catalogEntry.visualAssetRef")
    if reference != (visual_asset["id"], visual_asset["version"]):
        _invalid("catalogEntry.visualAssetRef must reference the promoted Visual Asset exactly.")
    _bounded_string(value["displayName"], "catalogEntry.displayName", 200)
    _bounded_string(value["description"], "catalogEntry.description", 4000)
    _namespaced_id(value["category"], "catalogEntry.category")
    if "subCategory" in value:
        _namespaced_id(value["subCategory"], "catalogEntry.subCategory")
    if value["scope"] not in {"personal", "theme"}:
        _invalid('Normal user import allows only "personal" or "theme" scope.')
    if value["origin"] != "imported":
        _invalid('Normal file import requires "imported" origin.')
    if value["scope"] == "theme" and "theme" not in value:
        _invalid("Theme scope requires an explicit Theme association.")
    if "theme" in value:
        _namespaced_id(value["theme"], "catalogEntry.theme")
    _unique_strings(value["systemTags"], "catalogEntry.systemTags", namespaced=True)
    _unique_strings(value["userTags"], "catalogEntry.userTags")
    _symbol(value["perspective"], "catalogEntry.perspective")
    _symbol(value["orientation"], "catalogEntry.orientation")
    _symbol(value["scaleClass"], "catalogEntry.scaleClass")
    _creator(value["creator"])
    _provenance(value["provenance"])
    _license(value["license"])
    _versioned_references(value["compatibleTemplates"], "catalogEntry.compatibleTemplates")
    _unique_strings(value["compatibleSurfaceTypes"], "catalogEntry.compatibleSurfaceTypes", symbols=True)
    _unique_strings(
        value["compatibleVisualObjectTypes"],
        "catalogEntry.compatibleVisualObjectTypes",
        symbols=True,
    )
    if value["deprecated"] is not False or "replacement" in value:
        _invalid("A newly imported Catalog Entry must be active and cannot declare a replacement.")
    for field in ("thumbnailRef", "previewRef", "layerPreviewRef"):
        if field in value:
            _exact_reference(value[field], f"catalogEntry.{field}")


def _inspect_static_media(asset_format: str, content: bytes) -> tuple[int, int, bool]:
    if asset_format == "png":
        return _inspect_png(content)
    if asset_format == "webp":
        return _inspect_webp(content)
    return _inspect_svg(content)


def _inspect_png(content: bytes) -> tuple[int, int, bool]:
    if not content.startswith(b"\x89PNG\r\n\x1a\n"):
        _invalid("The PNG signature is invalid.")
    offset = 8
    dimensions: tuple[int, int] | None = None
    alpha = False
    saw_data = False
    saw_end = False
    while offset < len(content):
        if offset + 12 > len(content):
            _invalid("The PNG contains a truncated chunk.")
        length = struct.unpack_from(">I", content, offset)[0]
        chunk_type = content[offset + 4 : offset + 8]
        data_start = offset + 8
        crc_start = data_start + length
        if crc_start + 4 > len(content):
            _invalid("The PNG contains a truncated chunk.")
        expected_crc = struct.unpack_from(">I", content, crc_start)[0]
        if zlib.crc32(content[offset + 4 : crc_start]) & 0xFFFFFFFF != expected_crc:
            _invalid("The PNG contains an invalid chunk checksum.")
        if chunk_type == b"IHDR":
            if offset != 8 or length != 13 or dimensions is not None:
                _invalid("The PNG header is invalid.")
            width, height = struct.unpack_from(">II", content, data_start)
            color_type = content[data_start + 9]
            dimensions = (width, height)
            alpha = color_type in {4, 6}
        elif chunk_type == b"IDAT":
            saw_data = True
        elif chunk_type == b"tRNS":
            alpha = True
        elif chunk_type == b"IEND":
            if length != 0 or crc_start + 4 != len(content):
                _invalid("The PNG end marker is invalid.")
            saw_end = True
        offset = crc_start + 4
    if dimensions is None or 0 in dimensions or not saw_data or not saw_end:
        _invalid("The PNG is missing required image data.")
    return dimensions[0], dimensions[1], alpha


def _inspect_webp(content: bytes) -> tuple[int, int, bool]:
    if len(content) < 20 or content[:4] != b"RIFF" or content[8:12] != b"WEBP":
        _invalid("The WebP signature is invalid.")
    if struct.unpack_from("<I", content, 4)[0] + 8 != len(content):
        _invalid("The WebP RIFF size is invalid.")
    offset = 12
    width: int | None = None
    height: int | None = None
    alpha = False
    saw_image = False
    while offset < len(content):
        if offset + 8 > len(content):
            _invalid("The WebP contains a truncated chunk header.")
        chunk_type = content[offset : offset + 4]
        length = struct.unpack_from("<I", content, offset + 4)[0]
        data_start = offset + 8
        next_offset = data_start + length + length % 2
        if next_offset > len(content):
            _invalid("The WebP contains a truncated chunk.")
        payload = content[data_start : data_start + length]
        if chunk_type == b"VP8X":
            if len(payload) != 10:
                _invalid("The WebP extended header is invalid.")
            if payload[0] & 0x02:
                _invalid("Animated WebP files are not supported.")
            alpha = alpha or bool(payload[0] & 0x10)
            width = int.from_bytes(payload[4:7], "little") + 1
            height = int.from_bytes(payload[7:10], "little") + 1
        elif chunk_type == b"VP8 ":
            if len(payload) < 10 or payload[3:6] != b"\x9d\x01\x2a":
                _invalid("The WebP VP8 frame header is invalid.")
            width = width or (struct.unpack_from("<H", payload, 6)[0] & 0x3FFF)
            height = height or (struct.unpack_from("<H", payload, 8)[0] & 0x3FFF)
            saw_image = True
        elif chunk_type == b"VP8L":
            if len(payload) < 5 or payload[0] != 0x2F:
                _invalid("The WebP lossless frame header is invalid.")
            bits = int.from_bytes(payload[1:5], "little")
            width = width or ((bits & 0x3FFF) + 1)
            height = height or (((bits >> 14) & 0x3FFF) + 1)
            alpha = alpha or bool((bits >> 28) & 1)
            saw_image = True
        elif chunk_type in {b"ANIM", b"ANMF"}:
            _invalid("Animated WebP files are not supported.")
        elif chunk_type == b"ALPH":
            alpha = True
        offset = next_offset
    if width is None or height is None or width <= 0 or height <= 0 or not saw_image:
        _invalid("The WebP is missing required image data.")
    return width, height, alpha


def _inspect_svg(content: bytes) -> tuple[int, int, bool]:
    try:
        source = content.removeprefix(b"\xef\xbb\xbf").decode("utf-8")
    except UnicodeDecodeError:
        _invalid("The SVG is not valid UTF-8.")
    if any(pattern.search(source) for pattern in _SVG_FORBIDDEN):
        raise RuntimeServiceError(
            "unsafe_svg",
            "The SVG contains active or externally referenced content and cannot be stored.",
        )
    root = re.match(
        r"^(?:\s|<\?xml[\s\S]*?\?>|<!--[\s\S]*?-->)*<svg\b([^>]*)>",
        source,
        re.IGNORECASE,
    )
    if root is None or (
        not root.group(0).rstrip().endswith("/>")
        and re.search(r"</svg\s*>(?:\s|<!--[\s\S]*?-->)*$", source, re.IGNORECASE) is None
    ):
        _invalid("The SVG root element is missing or not closed.")
    attributes = root.group(1)
    view_box = _svg_view_box(_xml_attribute(attributes, "viewBox"))
    width = _svg_length(_xml_attribute(attributes, "width")) or (view_box[0] if view_box else None)
    height = _svg_length(_xml_attribute(attributes, "height")) or (view_box[1] if view_box else None)
    if width is None or height is None or width <= 0 or height <= 0:
        _invalid("The SVG needs positive integer dimensions or a valid integer viewBox.")
    return width, height, True


def _svg_length(value: str | None) -> int | None:
    if value is None:
        return None
    match = re.fullmatch(r"\+?(\d+)(?:px)?", value.strip(), re.IGNORECASE)
    return int(match.group(1)) if match and int(match.group(1)) > 0 else None


def _svg_view_box(value: str | None) -> tuple[int, int] | None:
    if value is None:
        return None
    parts = re.split(r"[\s,]+", value.strip())
    if len(parts) != 4:
        return None
    try:
        width = float(parts[2])
        height = float(parts[3])
    except ValueError:
        return None
    if not width.is_integer() or not height.is_integer() or width <= 0 or height <= 0:
        return None
    return int(width), int(height)


def _xml_attribute(attributes: str, name: str) -> str | None:
    match = re.search(
        rf"(?:^|\s){re.escape(name)}\s*=\s*(['\"])(.*?)\1",
        attributes,
        re.IGNORECASE,
    )
    return match.group(2) if match else None


def _creator(value: JSONValue) -> None:
    creator = _object(value, "catalogEntry.creator")
    _strict_fields(creator, {"name"}, {"id", "url"}, "catalogEntry.creator")
    _bounded_string(creator["name"], "catalogEntry.creator.name", 200)
    if "id" in creator:
        _namespaced_id(creator["id"], "catalogEntry.creator.id")
    for field in ("url",):
        if field in creator:
            _bounded_string(creator[field], f"catalogEntry.creator.{field}", 2000)


def _provenance(value: JSONValue) -> None:
    provenance = _object(value, "catalogEntry.provenance")
    _strict_fields(
        provenance,
        {"kind"},
        {"source", "sourceRef", "notes"},
        "catalogEntry.provenance",
    )
    if provenance["kind"] != "imported":
        _invalid('File import provenance kind must be "imported".')
    for field, maximum in (("source", 1000), ("sourceRef", 500), ("notes", 2000)):
        if field in provenance:
            _bounded_string(provenance[field], f"catalogEntry.provenance.{field}", maximum)


def _license(value: JSONValue) -> None:
    license_value = _object(value, "catalogEntry.license")
    _strict_fields(
        license_value,
        {"expression"},
        {"attribution", "url"},
        "catalogEntry.license",
    )
    _bounded_string(license_value["expression"], "catalogEntry.license.expression", 500)
    if "attribution" in license_value:
        _bounded_string(license_value["attribution"], "catalogEntry.license.attribution", 1000)
    if "url" in license_value:
        _bounded_string(license_value["url"], "catalogEntry.license.url", 2000)


def _versioned_references(value: JSONValue, field: str) -> None:
    if not isinstance(value, list) or len(value) > 128:
        _invalid(f"{field} must be an array with at most 128 items.")
    seen: set[tuple[str, str]] = set()
    for index, item in enumerate(value):
        reference = _object(item, f"{field}[{index}]")
        _strict_fields(reference, {"id", "versionRange"}, set(), f"{field}[{index}]")
        pair = (
            _namespaced_id(reference["id"], f"{field}[{index}].id"),
            _bounded_string(reference["versionRange"], f"{field}[{index}].versionRange", 100),
        )
        if pair in seen:
            _invalid(f"{field} must not contain duplicates.")
        seen.add(pair)


def _exact_reference(value: JSONValue, field: str) -> tuple[str, str]:
    reference = _object(value, field)
    _strict_fields(reference, {"id", "version"}, set(), field)
    return (
        _namespaced_id(reference["id"], f"{field}.id"),
        _semver(reference["version"], f"{field}.version"),
    )


def _unique_strings(
    value: JSONValue,
    field: str,
    *,
    namespaced: bool = False,
    symbols: bool = False,
) -> None:
    if not isinstance(value, list) or len(value) > 128 or any(not isinstance(item, str) for item in value):
        _invalid(f"{field} must be an array of at most 128 strings.")
    if len(set(value)) != len(value):
        _invalid(f"{field} must not contain duplicates.")
    for item in value:
        if namespaced:
            _namespaced_id(item, field)
        elif symbols:
            _symbol(item, field)
        elif not item or len(item) > 128:
            _invalid(f"{field} contains an invalid value.")


def _object(value: object, field: str) -> dict[str, JSONValue]:
    if not isinstance(value, dict) or any(not isinstance(key, str) for key in value):
        _invalid(f"{field} must be an object.")
    return value


def _strict_fields(
    value: dict[str, JSONValue],
    required: set[str],
    optional: set[str],
    field: str,
) -> None:
    missing = required - value.keys()
    unknown = value.keys() - required - optional
    if missing:
        _invalid(f"{field} is missing required fields: {', '.join(sorted(missing))}.")
    if unknown:
        _invalid(f"{field} contains unsupported fields: {', '.join(sorted(unknown))}.")


def _namespaced_id(value: JSONValue, field: str) -> str:
    text = _string(value, field)
    if len(text) > 200 or _ID.fullmatch(text) is None:
        _invalid(f"{field} must be a namespaced identifier.")
    return text


def _symbol(value: JSONValue, field: str) -> str:
    text = _string(value, field)
    if len(text) > 120 or _SYMBOL.fullmatch(text) is None:
        _invalid(f"{field} must be a symbol.")
    return text


def _semver(value: JSONValue, field: str) -> str:
    text = _string(value, field)
    if _SEMVER.fullmatch(text) is None:
        _invalid(f"{field} must be a semantic version.")
    return text


def _relative_path(value: JSONValue, field: str) -> str:
    text = _string(value, field)
    path = PurePosixPath(text)
    if (
        "\\" in text
        or "://" in text
        or text.startswith("/")
        or ".." in path.parts
        or "." in path.parts
        or len(text) > 500
    ):
        _invalid(f"{field} must be a safe relative Resource path.")
    return text


def _positive_integer(value: JSONValue, field: str, *, maximum: int) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or not 0 < value <= maximum:
        _invalid(f"{field} must be an integer between 1 and {maximum}.")
    return value


def _bounded_string(value: JSONValue, field: str, maximum: int) -> str:
    text = _string(value, field)
    if len(text) > maximum:
        _invalid(f"{field} exceeds {maximum} characters.")
    return text


def _string(value: JSONValue, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        _invalid(f"{field} must be a non-empty string.")
    return value


def _invalid(message: str) -> None:
    raise RuntimeServiceError("validation_failed", message)
