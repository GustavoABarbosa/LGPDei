from datetime import timedelta

import jwt

from app.config import settings
from app.utils.http_error import HttpError
from app.utils.time import utcnow


def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": utcnow() + timedelta(days=settings.jwt_expires_days),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_access_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HttpError(401, "Token inválido")
        return str(user_id)
    except jwt.PyJWTError as exc:
        raise HttpError(401, "Token inválido") from exc
