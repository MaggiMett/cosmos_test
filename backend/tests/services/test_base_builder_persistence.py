from pathlib import Path

import pytest

from cosmos.bootstrap import CosmosRuntime
from cosmos.config import RuntimeSettings
from cosmos.runtime import RuntimeContext
from cosmos.services.base_builder_persistence import BaseBuilderActivateCommand, BaseBuilderPersistCommand, BaseBuilderPersistenceService
from cosmos.services.errors import RuntimeServiceError


def _document(room_id: str = "room.main") -> dict:
    return {
        "activeRoomId": room_id,
        "base": {
            "rooms": [{"roomId": room_id}],
            "entryRoomId": room_id,
            "revision": {"revisionId": "builder:1"},
        },
    }


def test_validates_existing_base_target_and_document_references(tmp_path: Path) -> None:
    runtime = CosmosRuntime.build(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))
    runtime.initialize()
    service = BaseBuilderPersistenceService(runtime.objects)
    base = runtime.objects.repository.list(system_tag="Base")[0]
    owner = RuntimeContext(permissions=frozenset({"objects.read", "objects.write"}))

    service.validate_target(BaseBuilderPersistCommand(base.identity.object_id, _document()), owner)


def test_persists_builder_document_with_compare_and_swap_revision(tmp_path: Path) -> None:
    runtime = CosmosRuntime.build(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))
    runtime.initialize()
    service = BaseBuilderPersistenceService(runtime.objects)
    base = runtime.objects.repository.list(system_tag="Base")[0]
    owner = RuntimeContext(permissions=frozenset({"objects.read", "objects.write"}))

    saved = service.persist(BaseBuilderPersistCommand(base.identity.object_id, _document()), owner)
    assert saved["revisionId"] == "builder:1"
    assert runtime.objects.get(base.identity.object_id, owner).properties["builder_document"] == saved

    changed = _document()
    changed["base"]["revision"]["revisionId"] = "builder:2"
    with pytest.raises(RuntimeServiceError, match="changed since it was loaded"):
        service.persist(BaseBuilderPersistCommand(base.identity.object_id, changed), owner)
    saved_again = service.persist(
        BaseBuilderPersistCommand(base.identity.object_id, changed, expected_revision_id="builder:1"), owner
    )
    assert saved_again["revisionId"] == "builder:2"


def test_exposes_only_saved_documents_as_activation_candidates(tmp_path: Path) -> None:
    runtime = CosmosRuntime.build(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))
    runtime.initialize()
    service = BaseBuilderPersistenceService(runtime.objects)
    base = runtime.objects.repository.list(system_tag="Base")[0]
    owner = RuntimeContext(permissions=frozenset({"objects.read", "objects.write"}))

    with pytest.raises(RuntimeServiceError, match="no saved document"):
        service.activation_candidate(base.identity.object_id, owner)

    saved = service.persist(BaseBuilderPersistCommand(base.identity.object_id, _document()), owner)
    candidate = service.activation_candidate(base.identity.object_id, owner)
    assert candidate == {
        "baseObjectId": base.identity.object_id,
        "revisionId": saved["revisionId"],
        "document": saved["document"],
    }


def test_activation_requires_the_exact_saved_revision_and_is_separate_from_save(tmp_path: Path) -> None:
    runtime = CosmosRuntime.build(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))
    runtime.initialize()
    service = BaseBuilderPersistenceService(runtime.objects)
    base = runtime.objects.repository.list(system_tag="Base")[0]
    owner = RuntimeContext(permissions=frozenset({"objects.read", "objects.write"}))

    saved = service.persist(BaseBuilderPersistCommand(base.identity.object_id, _document()), owner)
    assert runtime.objects.get(base.identity.object_id, owner).properties["active_builder_document"] == {}

    with pytest.raises(RuntimeServiceError, match="changed before activation"):
        service.activate(BaseBuilderActivateCommand(base.identity.object_id, "builder:stale"), owner)

    active = service.activate(BaseBuilderActivateCommand(base.identity.object_id, str(saved["revisionId"])), owner)
    assert active["revisionId"] == saved["revisionId"]
    assert active["document"] == saved["document"]


def test_rejects_unknown_room_reference_before_persistence(tmp_path: Path) -> None:
    runtime = CosmosRuntime.build(RuntimeSettings(runtime_path=tmp_path / "Runtime", port=0))
    runtime.initialize()
    service = BaseBuilderPersistenceService(runtime.objects)
    base = runtime.objects.repository.list(system_tag="Base")[0]
    document = _document()
    document["activeRoomId"] = "room.missing"

    with pytest.raises(RuntimeServiceError, match="unknown Room"):
        service.validate_target(
            BaseBuilderPersistCommand(base.identity.object_id, document),
            RuntimeContext(permissions=frozenset({"objects.read", "objects.write"})),
        )
