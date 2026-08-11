from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
from datetime import UTC, datetime
from enum import StrEnum
from types import MappingProxyType
from typing import TypeAlias
from uuid import uuid4

JSONScalar: TypeAlias = str | int | float | bool | None
JSONValue: TypeAlias = JSONScalar | list["JSONValue"] | dict[str, "JSONValue"]


class ObjectContractError(ValueError):
    pass


class PropertyKind(StrEnum):
    STRING = "string"
    INTEGER = "integer"
    NUMBER = "number"
    BOOLEAN = "boolean"
    OBJECT = "object"
    ARRAY = "array"
    NULL = "null"


@dataclass(frozen=True, slots=True)
class PropertyDefinition:
    """One required property and its explicit default."""

    name: str
    kind: PropertyKind
    default: JSONValue

    def __post_init__(self) -> None:
        if not self.name:
            raise ObjectContractError("Property names must not be empty.")
        if not _matches_kind(self.default, self.kind):
            raise ObjectContractError(f"Default for {self.name!r} does not match {self.kind.value}.")

    def validate(self, value: JSONValue) -> None:
        if not _matches_kind(value, self.kind):
            raise ObjectContractError(f"Property {self.name!r} must be {self.kind.value}.")


@dataclass(frozen=True, slots=True)
class PropertySchema:
    schema_id: str
    version: int
    properties: tuple[PropertyDefinition, ...]

    def __post_init__(self) -> None:
        if not self.schema_id:
            raise ObjectContractError("Property Schema IDs must not be empty.")
        if self.version < 1:
            raise ObjectContractError("Property Schema versions start at 1.")
        names = [definition.name for definition in self.properties]
        if len(names) != len(set(names)):
            raise ObjectContractError(f"Property Schema {self.schema_id!r} contains duplicate properties.")


@dataclass(frozen=True, slots=True)
class ObjectIdentity:
    object_id: str
    display_name: str
    description: str
    creator: str
    lifecycle_state: str
    created_at: datetime

    @classmethod
    def create(
        cls,
        display_name: str,
        *,
        description: str = "",
        creator: str = "cosmos.runtime",
        lifecycle_state: str = "active",
    ) -> ObjectIdentity:
        return cls(
            object_id=str(uuid4()),
            display_name=display_name,
            description=description,
            creator=creator,
            lifecycle_state=lifecycle_state,
            created_at=datetime.now(UTC),
        )


@dataclass(frozen=True, slots=True)
class CosmosObject:
    identity: ObjectIdentity
    system_tags: frozenset[str]
    schema_ids: tuple[str, ...]
    properties: MappingProxyType[str, JSONValue]
    user_tags: frozenset[str] = frozenset()
    primary_project_id: str | None = None


class ObjectContract:
    """Composes complete Object state from additive System Tag schemas."""

    def __init__(self) -> None:
        self._schemas_by_tag: dict[str, tuple[PropertySchema, ...]] = {}

    def register_system_tag(self, tag: str, *schemas: PropertySchema) -> None:
        if not tag:
            raise ObjectContractError("System Tags must not be empty.")
        if tag in self._schemas_by_tag:
            raise ObjectContractError(f"System Tag already registered: {tag}")
        self._schemas_by_tag[tag] = tuple(schemas)

    def build(
        self,
        identity: ObjectIdentity,
        system_tags: frozenset[str],
        properties: dict[str, JSONValue] | None = None,
        *,
        user_tags: frozenset[str] = frozenset(),
        primary_project_id: str | None = None,
    ) -> CosmosObject:
        if not system_tags:
            raise ObjectContractError("Every Object requires at least one System Tag.")

        unknown = system_tags.difference(self._schemas_by_tag)
        if unknown:
            raise ObjectContractError(f"Unknown System Tags: {', '.join(sorted(unknown))}")

        definitions: dict[str, PropertyDefinition] = {}
        schemas: dict[str, PropertySchema] = {}
        for tag in sorted(system_tags):
            for schema in self._schemas_by_tag[tag]:
                schemas[schema.schema_id] = schema
                for definition in schema.properties:
                    existing = definitions.get(definition.name)
                    if existing is not None and existing != definition:
                        raise ObjectContractError(
                            f"Incompatible definitions for composed property {definition.name!r}."
                        )
                    definitions[definition.name] = definition

        supplied = properties or {}
        unexpected = supplied.keys() - definitions.keys()
        if unexpected:
            raise ObjectContractError(f"Properties have no active schema: {', '.join(sorted(unexpected))}")

        complete: dict[str, JSONValue] = {}
        for name, definition in definitions.items():
            value = supplied.get(name, definition.default)
            definition.validate(value)
            complete[name] = deepcopy(value)

        return CosmosObject(
            identity=identity,
            system_tags=frozenset(system_tags),
            schema_ids=tuple(sorted(schemas)),
            properties=MappingProxyType(complete),
            user_tags=frozenset(user_tags),
            primary_project_id=primary_project_id,
        )


def _matches_kind(value: JSONValue, kind: PropertyKind) -> bool:
    if kind is PropertyKind.STRING:
        return isinstance(value, str)
    if kind is PropertyKind.INTEGER:
        return isinstance(value, int) and not isinstance(value, bool)
    if kind is PropertyKind.NUMBER:
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if kind is PropertyKind.BOOLEAN:
        return isinstance(value, bool)
    if kind is PropertyKind.OBJECT:
        return isinstance(value, dict)
    if kind is PropertyKind.ARRAY:
        return isinstance(value, list)
    return value is None
