from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


EXTENSION_CATEGORY_ROOTS = (
    "user-tools",
    "system-tools",
    "entities",
    "capability-bundles",
    "themes",
    "workspace-blueprints",
    "object-blueprints",
    "capture-templates",
    "providers",
    "integrations",
)


@dataclass(frozen=True, slots=True)
class ExtensionPackageCandidate:
    category_root: str
    package_path: Path
    manifest_path: Path


class ExtensionDiscovery:
    """Read-only discovery of Extension package candidates.

    Discovery deliberately does not parse manifests, execute package code, or
    register components. Those responsibilities belong to later lifecycle
    phases.
    """

    def __init__(self, extensions_path: Path) -> None:
        self._extensions_path = Path(extensions_path)

    def discover(self) -> tuple[ExtensionPackageCandidate, ...]:
        candidates: list[ExtensionPackageCandidate] = []
        for category_root in EXTENSION_CATEGORY_ROOTS:
            root = self._extensions_path / category_root
            if not root.is_dir():
                continue
            for package_path in sorted(root.iterdir(), key=lambda path: path.name):
                if not package_path.is_dir():
                    continue
                manifest_path = package_path / "manifest.json"
                if not manifest_path.is_file():
                    continue
                candidates.append(
                    ExtensionPackageCandidate(
                        category_root=category_root,
                        package_path=package_path,
                        manifest_path=manifest_path,
                    )
                )
        return tuple(candidates)
