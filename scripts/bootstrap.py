"""Create an isolated development environment for Cosmos."""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VENV = ROOT / ".venv"


def run(command: list[str]) -> None:
    print(f"> {' '.join(command)}", flush=True)
    subprocess.run(command, cwd=ROOT, check=True)


def venv_python() -> Path:
    relative = Path("Scripts/python.exe") if os.name == "nt" else Path("bin/python")
    return VENV / relative


def main() -> None:
    created = False
    if not VENV.exists():
        run([sys.executable, "-m", "venv", str(VENV)])
        created = True

    if created:
        run(
            [
                str(venv_python()),
                "-m",
                "pip",
                "install",
                "--upgrade",
                "pip",
                "setuptools>=75",
                "wheel>=0.45,<1",
            ]
        )
    run([str(venv_python()), "-m", "pip", "install", "--no-build-isolation", "-e", ".[dev]"])

    pnpm = shutil.which("pnpm")
    if pnpm is None:
        raise SystemExit("pnpm is required. Install pnpm or enable it through Corepack.")

    run([pnpm, "--dir", "frontend", "install", "--config.confirmModulesPurge=false"])


if __name__ == "__main__":
    main()
