from cosmos.domain import CosmosObject
from cosmos.domain.objects import JSONValue


def object_payload(value: CosmosObject) -> dict[str, JSONValue]:
    return {
        "objectId": value.identity.object_id,
        "displayName": value.identity.display_name,
        "description": value.identity.description,
        "systemTags": sorted(value.system_tags),
        "userTags": sorted(value.user_tags),
    }
