from __future__ import annotations

import uvicorn

from cosmos.api.application import create_app
from cosmos.config import RuntimeSettings


def main() -> None:
    settings = RuntimeSettings.from_environment()
    uvicorn.run(
        create_app(settings),
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level,
    )


if __name__ == "__main__":
    main()
