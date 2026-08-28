import uvicorn

from app.config import settings


def main() -> None:
    uvicorn.run("app.main:app", reload=True, port=settings.port)


if __name__ == "__main__":
    main()
