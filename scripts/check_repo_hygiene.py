"""Verify repository path casing and line endings across platforms."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LF_EXTENSIONS = {
    ".cjs",
    ".js",
    ".json",
    ".jsonc",
    ".md",
    ".mjs",
    ".py",
    ".sh",
    ".sql",
    ".toml",
    ".ts",
    ".tsx",
    ".vue",
    ".yaml",
    ".yml",
}


def tracked_paths() -> list[str]:
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=ROOT,
        check=False,
        capture_output=True,
    )
    if result.returncode == 0:
        return [entry.decode("utf-8") for entry in result.stdout.split(b"\0") if entry]

    excluded = {".git", "node_modules", ".venv", ".pytest_cache", "__pycache__", ".runtime", ".artifacts", "dist"}
    return [
        path.relative_to(ROOT).as_posix()
        for path in ROOT.rglob("*")
        if path.is_file() and not any(part in excluded for part in path.relative_to(ROOT).parts)
    ]


def actual_component(parent: Path, requested: str, cache: dict[Path, dict[str, str]]) -> str | None:
    directory = parent.resolve()
    if directory not in cache:
        try:
            cache[directory] = {name.casefold(): name for name in os.listdir(directory)}
        except OSError:
            return None
    return cache[directory].get(requested.casefold())


def casing_mismatch(path: str, cache: dict[Path, dict[str, str]]) -> str | None:
    parent = ROOT
    actual_parts: list[str] = []
    for expected in Path(path).parts:
        actual = actual_component(parent, expected, cache)
        if actual is None:
            return f"missing tracked path: {path}"
        actual_parts.append(actual)
        parent /= actual
    actual_path = "/".join(actual_parts)
    if actual_path != path:
        return f"path casing mismatch: tracked '{path}', disk '{actual_path}'"
    return None


def crlf_violation(path: str) -> str | None:
    file_path = ROOT / path
    if file_path.suffix.lower() not in LF_EXTENSIONS or not file_path.is_file():
        return None
    try:
        data = file_path.read_bytes()
    except OSError as exc:
        return f"unable to read tracked text file '{path}': {exc}"
    if b"\r\n" in data:
        return f"CRLF found in LF-normalized tracked file: {path}"
    return None


def main() -> None:
    errors: list[str] = []
    cache: dict[Path, dict[str, str]] = {}
    for path in tracked_paths():
        mismatch = casing_mismatch(path, cache)
        if mismatch is not None:
            errors.append(mismatch)
            continue
        violation = crlf_violation(path)
        if violation is not None:
            errors.append(violation)

    if errors:
        for error in errors:
            print(f"repo-hygiene: {error}")
        raise SystemExit(f"Repository hygiene check failed with {len(errors)} issue(s).")

    print("Repository hygiene check passed.")


if __name__ == "__main__":
    main()
