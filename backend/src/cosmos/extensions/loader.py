from __future__ import annotations

from dataclasses import dataclass

from cosmos.extensions.discovery import ExtensionDiscovery
from cosmos.extensions.registrar import ExtensionRegistrar
from cosmos.extensions.validation import ExtensionValidator
from cosmos.runtime import RuntimeContext


@dataclass(frozen=True, slots=True)
class ExtensionLoadFailure:
    package: str
    errors: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class ExtensionLoadReport:
    loaded: tuple[str, ...]
    failures: tuple[ExtensionLoadFailure, ...]


class ExtensionLoader:
    """Coordinates package ingestion without letting one Extension abort the batch."""

    def __init__(
        self,
        discovery: ExtensionDiscovery,
        validator: ExtensionValidator,
        registrar: ExtensionRegistrar,
    ) -> None:
        self._discovery = discovery
        self._validator = validator
        self._registrar = registrar

    def load(self, context: RuntimeContext) -> ExtensionLoadReport:
        loaded: list[str] = []
        failures: list[ExtensionLoadFailure] = []
        for candidate in self._discovery.discover():
            result = self._validator.validate(candidate)
            if not result.valid or result.manifest is None:
                failures.append(ExtensionLoadFailure(candidate.package_path.name, result.errors))
                continue
            try:
                self._registrar.register_tool(result.manifest, context)
            except Exception as error:  # isolate one package from the remaining startup batch
                failures.append(ExtensionLoadFailure(candidate.package_path.name, (str(error),)))
                continue
            loaded.append(result.manifest.extension_id)
        return ExtensionLoadReport(tuple(loaded), tuple(failures))
