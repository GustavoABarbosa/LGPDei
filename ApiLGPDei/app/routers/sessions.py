from datetime import datetime

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, Header, Request, Response
from pydantic import BaseModel

from app.agents.prompts import WELCOME_MESSAGE
from app.dependencies import get_owned_session, get_optional_session_token, get_optional_user
from app.middleware.rate_limit import limiter
from app.models import AssessmentSession, Message, SessionDocument
from app.models.user import PublicUser
from app.services.session_service import (
    get_session_detail,
    list_sessions_for_token,
    list_sessions_for_user,
)
from app.utils.http_error import HttpError
from app.utils.session_token import generate_session_token, hash_session_token, session_expires_at

sessions_router = APIRouter(prefix="/sessions", tags=["sessions"])


class CreateSessionBody(BaseModel):
    locale: str = "pt"


class UpdateSessionBody(BaseModel):
    title: str


def locale_from_header(accept_language: str | None, override: str | None = None) -> str:
    if override and override in ("pt", "en"):
        return override
    if accept_language and accept_language.lower().startswith("en"):
        return "en"
    return "pt"


@sessions_router.post("")
@limiter.limit("5/hour")
async def create_session(
    request: Request,
    response: Response,
    body: CreateSessionBody | None = None,
    accept_language: str | None = Header(default=None),
    user: PublicUser | None = Depends(get_optional_user),
):
    locale = locale_from_header(accept_language, body.locale if body else None)
    token = generate_session_token()
    now = datetime.utcnow()

    session = AssessmentSession(
        title="Nova sessão" if locale == "pt" else "New session",
        session_token_hash=hash_session_token(token),
        user_id=PydanticObjectId(user.id) if user else None,
        expires_at=session_expires_at(),
        created_at=now,
        updated_at=now,
    )
    await session.insert()

    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=72 * 3600,
    )

    return await get_session_detail(session)


@sessions_router.get("")
async def list_sessions(
    session_token: str | None = Depends(get_optional_session_token),
    user: PublicUser | None = Depends(get_optional_user),
):
    if user:
        sessions = await list_sessions_for_user(user)
    elif session_token:
        sessions = await list_sessions_for_token(session_token)
    else:
        return {"sessions": []}

    return {
        "sessions": [
            {
                "id": str(s.id),
                "title": s.title,
                "createdAt": s.created_at.isoformat(),
                "updatedAt": s.updated_at.isoformat(),
            }
            for s in sessions
        ]
    }


@sessions_router.get("/{session_id}")
async def get_session(session: AssessmentSession = Depends(get_owned_session)):
    return await get_session_detail(session)


@sessions_router.patch("/{session_id}")
async def update_session(
    body: UpdateSessionBody,
    session: AssessmentSession = Depends(get_owned_session),
):
    title = body.title.strip()[:48]
    if not title:
        raise HttpError(400, "Título inválido")

    session.title = title
    session.updated_at = datetime.utcnow()
    await session.save()
    return await get_session_detail(session)


@sessions_router.delete("/{session_id}")
async def delete_session(session: AssessmentSession = Depends(get_owned_session)):
    await Message.find(Message.session_id == session.id).delete()
    await SessionDocument.find(SessionDocument.session_id == session.id).delete()
    await session.delete()
    return {"ok": True}
