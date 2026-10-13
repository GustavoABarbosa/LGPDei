from datetime import datetime

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

from app.agents.schemas import AssessmentOutput
from app.utils.time import utcnow


class AssessmentSession(Document):
    title: str = "Nova sessão"
    context_summary: str | None = None
    session_token_hash: Indexed(str)  # type: ignore[valid-type]
    user_id: PydanticObjectId | None = None
    expires_at: datetime
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
    expires_at: datetime

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
    expires_at: datetime

    class Settings:
        name = "messages"
        indexes = [
            IndexModel([("expires_at", 1)], expireAfterSeconds=0),
        ]
