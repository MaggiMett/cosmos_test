from pathlib import Path

from cosmos.extensions import ExtensionDiscovery


def test_discovery_finds_manifest_packages_in_known_category_roots(tmp_path: Path) -> None:
    extensions = tmp_path / "extensions"
    first = extensions / "user-tools" / "example.alpha"
    second = extensions / "integrations" / "example.git"
    first.mkdir(parents=True)
    second.mkdir(parents=True)
    (first / "manifest.json").write_text("{}", encoding="utf-8")
    (second / "manifest.json").write_text("{}", encoding="utf-8")

    candidates = ExtensionDiscovery(extensions).discover()

    assert [(candidate.category_root, candidate.package_path.name) for candidate in candidates] == [
        ("user-tools", "example.alpha"),
        ("integrations", "example.git"),
    ]
    assert all(candidate.manifest_path.name == "manifest.json" for candidate in candidates)


def test_discovery_ignores_files_unknown_roots_and_directories_without_manifest(tmp_path: Path) -> None:
    extensions = tmp_path / "extensions"
    incomplete = extensions / "user-tools" / "incomplete"
    unknown = extensions / "unknown" / "example"
    incomplete.mkdir(parents=True)
    unknown.mkdir(parents=True)
    (extensions / "user-tools" / "README.txt").write_text("not a package", encoding="utf-8")
    (unknown / "manifest.json").write_text("{}", encoding="utf-8")

    assert ExtensionDiscovery(extensions).discover() == ()


def test_discovery_is_read_only_and_does_not_parse_manifest(tmp_path: Path) -> None:
    package = tmp_path / "extensions" / "providers" / "broken.manifest"
    package.mkdir(parents=True)
    manifest = package / "manifest.json"
    manifest.write_text("not-json", encoding="utf-8")

    candidates = ExtensionDiscovery(tmp_path / "extensions").discover()

    assert len(candidates) == 1
    assert candidates[0].manifest_path == manifest
    assert manifest.read_text(encoding="utf-8") == "not-json"
