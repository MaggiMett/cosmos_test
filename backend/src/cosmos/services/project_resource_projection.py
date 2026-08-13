from __future__ import annotations

from cosmos.domain.objects import JSONValue

_HIDDEN_DIRECTORIES = frozenset(
    {
        "__pycache__",
        "build",
        "coverage",
        "dist",
        "node_modules",
    }
)
_HIDDEN_SUFFIXES = ("~", ".tmp", ".temp", ".swp", ".swo", ".bak")


def project_resource_projection(tree_payload: dict[str, JSONValue]) -> dict[str, JSONValue]:
    """Build a presentation-only Project resource hierarchy from a ResourceService tree."""
    project_id = tree_payload.get("projectId")
    tree = tree_payload.get("tree")
    if not isinstance(project_id, str) or not isinstance(tree, dict):
        return {"projectId": project_id, "items": []}

    children = tree.get("children")
    if not isinstance(children, list):
        return {"projectId": project_id, "items": []}

    return {
        "projectId": project_id,
        "items": [item for child in children if (item := _project_entry(child, 0, project_id)) is not None],
    }


def _project_entry(value: object, depth: int, project_id: str) -> dict[str, JSONValue] | None:
    if not isinstance(value, dict):
        return None
    name = value.get("name")
    path = value.get("path")
    entry_type = value.get("type")
    if not isinstance(name, str) or not isinstance(path, str) or _hidden(name, entry_type):
        return None

    if entry_type == "directory":
        raw_children = value.get("children")
        children = (
            [item for child in raw_children if (item := _project_entry(child, depth + 1, project_id)) is not None]
            if isinstance(raw_children, list)
            else []
        )
        if not children:
            return None
        return {
            "projectId": project_id,
            "resourcePath": path,
            "displayName": name,
            "kind": "group",
            "depth": depth,
            "editable": False,
            "children": children,
        }

    if entry_type != "file":
        return None
    return {
        "projectId": project_id,
        "resourcePath": path,
        "displayName": name,
        "kind": "resource",
        "depth": depth,
        "editable": value.get("editable") is True,
        "children": [],
    }


def _hidden(name: str, entry_type: object) -> bool:
    lowered = name.casefold()
    if name.startswith("."):
        return True
    if entry_type == "directory" and lowered in _HIDDEN_DIRECTORIES:
        return True
    return lowered.endswith(_HIDDEN_SUFFIXES)
