from datetime import datetime

from beanie import Document, Indexed
from pydantic import BaseModel, EmailStr, Field

from app.utils.time import utcnow


class User(Document):
    name: str
    email: Indexed(EmailStr, unique=True)  # type: ignore[valid-type]
    password_hash: str
    consent_version: str
    consent_at: datetime
    # Embedded in the JWT; incrementing it revokes every token issued before.
    token_version: int = 0
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "users"


class PublicUser(BaseModel):
    id: str
    name: str
    email: EmailStr
