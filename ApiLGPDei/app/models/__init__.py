from datetime import datetime

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

from app.agents.schemas import AssessmentOutput
from app.utils.time import utcnow

# MongoDB's TTL monitor only removes documents whose expires_at is a date, so sessions owned by
# an account (expires_at=None) are kept until the user deletes them.


class AssessmentSession(Document):
    title: str = "Nova sessão"
    context_summary: str | None = None
    session_token_hash: Indexed(str)  # type: ignore[valid-type]
    user_id: PydanticObjectId | None = None
    # Guest consent; account sessions rely on the consent stored on the User.
    consent_version: str | None = None
    consent_at: datetime | None = None
    expires_at: datetime | None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "assessment_sessions"
        indexes = [
            IndexModel([("expires_at", 1)], expireAfterSeconds=0),
        ]


class SessionDocument(Document):
    session_id: Indexed(PydanticObjectId)  # type: ignore[valid-type]
    file_name: str
    mime_type: str
    extracted_text: str
    order: int = 0
    uploaded_at: datetime = Field(default_factory=utcnow)
    # Copied from the session so MongoDB's TTL monitor deletes it together with the session.
    expires_at: datetime | None

    class Settings:
        name = "session_documents"
        indexes = [
            IndexModel([("expires_at", 1)], expireAfterSeconds=0),
        ]


class Message(Document):
    session_id: Indexed(PydanticObjectId)  # type: ignore[valid-type]
    role: str
    content: str
    message_type: str = "chat"
    assessment_snapshot: AssessmentOutput | None = None
    attachments: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=utcnow)
    # Copied from the session so MongoDB's TTL monitor deletes it together with the session.
    expires_at: datetime | None

    class Settings:
        name = "messages"
        indexes = [
            IndexModel([("expires_at", 1)], expireAfterSeconds=0),
        ]
