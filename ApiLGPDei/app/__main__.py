from pathlib import Path

import uvicorn

from app.config import settings

# Access log without client IP addresses.
LOG_CONFIG = str(Path(__file__).with_name("log_config.json"))


def main() -> None:
    uvicorn.run("app.main:app", reload=True, port=settings.port, log_config=LOG_CONFIG)


if __name__ == "__main__":
    main()
