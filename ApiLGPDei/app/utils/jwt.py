from datetime import timedelta

import jwt

from app.config import settings
from app.utils.http_error import HttpError
from app.utils.time import utcnow


def create_access_token(user_id: str, token_version: int) -> str:
    payload = {
        "sub": user_id,
        "ver": token_version,
        "exp": utcnow() + timedelta(days=settings.jwt_expires_days),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_access_token(token: str) -> tuple[str, int]:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HttpError(401, "Token inválido") from exc

    user_id = payload.get("sub")
    token_version = payload.get("ver")
    if not user_id or not isinstance(token_version, int):
        raise HttpError(401, "Token inválido")
    return str(user_id), token_version
