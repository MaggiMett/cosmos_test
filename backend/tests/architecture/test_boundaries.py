import ast
from pathlib import Path

SOURCE = Path(__file__).parents[2] / "src" / "cosmos"


def imported_cosmos_modules(path: Path) -> set[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    modules: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            modules.update(alias.name for alias in node.names if alias.name.startswith("cosmos"))
        elif isinstance(node, ast.ImportFrom) and node.module and node.module.startswith("cosmos"):
            modules.add(node.module)
    return modules


def test_domain_has_no_outward_runtime_dependencies() -> None:
    forbidden = (
        "cosmos.api",
        "cosmos.extensions",
        "cosmos.persistence",
        "cosmos.runtime",
        "cosmos.services",
    )

    violations: list[str] = []
    for path in (SOURCE / "domain").rglob("*.py"):
        for module in imported_cosmos_modules(path):
            if module.startswith(forbidden):
                violations.append(f"{path.relative_to(SOURCE)} -> {module}")

    assert violations == []
