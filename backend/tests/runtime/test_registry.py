import pytest

from cosmos.runtime import Registry, RegistryEntry, RegistryStatus


def entry(component_id: str = "cosmos.provider.test") -> RegistryEntry:
    return RegistryEntry(
        component_id=component_id,
        display_name="Test Provider",
        category="provider",
        version="1.0.0",
        runtime_api_version="1",
        source_extension_id="cosmos.extension.test-provider",
    )


def test_registry_rejects_duplicate_identity() -> None:
    registry = Registry()
    registry.register(entry())

    with pytest.raises(ValueError, match="Duplicate"):
        registry.register(entry())


def test_registration_and_activation_are_separate() -> None:
    registry = Registry()

    registered = registry.register(entry())
    active = registry.activate(registered.component_id)

    assert registered.status is RegistryStatus.REGISTERED
    assert active.status is RegistryStatus.ACTIVE
