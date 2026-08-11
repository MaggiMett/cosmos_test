"""Run the complete Cosmos development verification gate."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VENV_PYTHON = ROOT / ".venv" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")


def run(command: list[str], *, cwd: Path = ROOT) -> None:
    print(f"> {' '.join(command)}", flush=True)
    subprocess.run(command, cwd=cwd, check=True)


def frontend_tool(name: str) -> str:
    executable = f"{name}.cmd" if os.name == "nt" else name
    path = ROOT / "frontend" / "node_modules" / ".bin" / executable
    if not path.exists():
        raise SystemExit("Frontend dependencies missing. Run: python scripts/bootstrap.py")
    return str(path)


def main() -> None:
    if not VENV_PYTHON.exists():
        raise SystemExit("Development environment missing. Run: python scripts/bootstrap.py")

    python = str(VENV_PYTHON)
    run([python, "scripts/check_repo_hygiene.py"])
    run([python, "-m", "ruff", "format", "--check", "backend", "scripts"])
    run([python, "-m", "ruff", "check", "backend", "scripts"])
    run([python, "-m", "pytest"])
    run([python, "-m", "build", "--no-isolation"])
    frontend = ROOT / "frontend"
    run([frontend_tool("vue-tsc"), "--noEmit", "-p", "tsconfig.json"], cwd=frontend)
    run([frontend_tool("vitest"), "run", "--environment", "node"], cwd=frontend)
    run(
        [
            frontend_tool("vite"),
            "build",
            "--config",
            "vite.app.config.ts",
            "--configLoader",
            "runner",
        ],
        cwd=frontend,
    )
    run(
        [
            frontend_tool("vite"),
            "build",
            "--config",
            "vite.build.config.ts",
            "--configLoader",
            "runner",
        ],
        cwd=frontend,
    )


if __name__ == "__main__":
    main()
