from datetime import datetime

from beanie import Document, Indexed
from pydantic import BaseModel, EmailStr, Field

from app.utils.time import utcnow


class User(Document):
    name: str
    email: Indexed(EmailStr, unique=True)  # type: ignore[valid-type]
    password_hash: str
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "users"


class PublicUser(BaseModel):
    id: str
    name: str
    email: EmailStr
