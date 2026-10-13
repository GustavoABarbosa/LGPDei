from fastapi import Response

from app.config import settings

AUTH_COOKIE = "auth_token"
SESSION_COOKIE = "session_token"


def set_cookie(response: Response, key: str, value: str, max_age: int) -> None:
    response.set_cookie(
        key=key,
        value=value,
        httponly=True,
        samesite=settings.cookie_samesite,
        secure=settings.cookie_secure,
        max_age=max_age,
    )


def delete_cookie(response: Response, key: str) -> None:
    response.delete_cookie(
        key=key,
        path="/",
        httponly=True,
        samesite=settings.cookie_samesite,
        secure=settings.cookie_secure,
    )
