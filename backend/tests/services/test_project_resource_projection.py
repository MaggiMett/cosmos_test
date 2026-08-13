from cosmos.services.project_resource_projection import project_resource_projection


def test_projects_visible_resources_without_promoting_files_to_cosmos_objects() -> None:
    result = project_resource_projection(
        {
            "projectId": "project.alpha",
            "tree": {
                "name": "Files",
                "path": "",
                "type": "directory",
                "children": [
                    {
                        "name": "Lore",
                        "path": "Lore",
                        "type": "directory",
                        "children": [
                            {
                                "name": "Dwarfs.md",
                                "path": "Lore/Dwarfs.md",
                                "type": "file",
                                "editable": True,
                            }
                        ],
                    },
                    {"name": "map.png", "path": "map.png", "type": "file", "editable": False},
                ],
            },
        }
    )

    assert result == {
        "projectId": "project.alpha",
        "items": [
            {
                "projectId": "project.alpha",
                "resourcePath": "Lore",
                "displayName": "Lore",
                "kind": "group",
                "depth": 0,
                "editable": False,
                "children": [
                    {
                        "projectId": "project.alpha",
                        "resourcePath": "Lore/Dwarfs.md",
                        "displayName": "Dwarfs.md",
                        "kind": "resource",
                        "depth": 1,
                        "editable": True,
                        "children": [],
                    }
                ],
            },
            {
                "projectId": "project.alpha",
                "resourcePath": "map.png",
                "displayName": "map.png",
                "kind": "resource",
                "depth": 0,
                "editable": False,
                "children": [],
            },
        ],
    }


def test_filters_noise_and_omits_groups_left_empty_by_filtering() -> None:
    result = project_resource_projection(
        {
            "projectId": "project.alpha",
            "tree": {
                "children": [
                    {"name": ".git", "path": ".git", "type": "directory", "children": []},
                    {
                        "name": "node_modules",
                        "path": "node_modules",
                        "type": "directory",
                        "children": [{"name": "x.js", "path": "node_modules/x.js", "type": "file"}],
                    },
                    {
                        "name": "Generated",
                        "path": "Generated",
                        "type": "directory",
                        "children": [{"name": "draft.tmp", "path": "Generated/draft.tmp", "type": "file"}],
                    },
                    {"name": "README.md", "path": "README.md", "type": "file", "editable": True},
                ]
            },
        }
    )

    assert [item["resourcePath"] for item in result["items"]] == ["README.md"]


def test_invalid_tree_degrades_to_empty_projection() -> None:
    assert project_resource_projection({"projectId": "project.alpha", "tree": None}) == {
        "projectId": "project.alpha",
        "items": [],
    }
