import pytest

from cosmos.domain import (
    ObjectContract,
    ObjectContractError,
    ObjectIdentity,
    PropertyDefinition,
    PropertyKind,
    PropertySchema,
)


def test_system_tags_compose_complete_properties_without_creating_user_tags() -> None:
    contract = ObjectContract()
    contract.register_system_tag(
        "Object",
        PropertySchema(
            schema_id="cosmos.object.v1",
            version=1,
            properties=(PropertyDefinition("visibility", PropertyKind.STRING, "visible"),),
        ),
    )
    contract.register_system_tag(
        "Node",
        PropertySchema(
            schema_id="cosmos.node.v1",
            version=1,
            properties=(PropertyDefinition("placement", PropertyKind.OBJECT, {}),),
        ),
    )

    cosmos_object = contract.build(
        ObjectIdentity.create("A visible name"),
        frozenset({"Object", "Node"}),
    )

    assert cosmos_object.schema_ids == ("cosmos.node.v1", "cosmos.object.v1")
    assert dict(cosmos_object.properties) == {"placement": {}, "visibility": "visible"}
    assert cosmos_object.user_tags == frozenset()


def test_composed_schemas_reject_incompatible_property_definitions() -> None:
    contract = ObjectContract()
    contract.register_system_tag(
        "First",
        PropertySchema("first.v1", 1, (PropertyDefinition("state", PropertyKind.STRING, "static"),)),
    )
    contract.register_system_tag(
        "Second",
        PropertySchema("second.v1", 1, (PropertyDefinition("state", PropertyKind.BOOLEAN, False),)),
    )

    with pytest.raises(ObjectContractError, match="Incompatible definitions"):
        contract.build(ObjectIdentity.create("Invalid"), frozenset({"First", "Second"}))


def test_active_schema_rejects_invalid_property_type() -> None:
    contract = ObjectContract()
    contract.register_system_tag(
        "Tool",
        PropertySchema("tool.v1", 1, (PropertyDefinition("enabled", PropertyKind.BOOLEAN, False),)),
    )

    with pytest.raises(ObjectContractError, match="must be boolean"):
        contract.build(
            ObjectIdentity.create("Tool"),
            frozenset({"Tool"}),
            {"enabled": "yes"},
        )
