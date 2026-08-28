import hashlib
import hmac
import secrets
from datetime import datetime, timedelta

from app.config import settings


def hash_session_token(token: str) -> str:
    return hmac.new(
        settings.session_secret.encode(),
        token.encode(),
        hashlib.sha256,
    ).hexdigest()


def generate_session_token() -> str:
    return secrets.token_urlsafe(32)


def session_expires_at() -> datetime:
    return datetime.utcnow() + timedelta(hours=settings.session_ttl_hours)
