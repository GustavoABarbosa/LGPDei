from datetime import datetime

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, Header, Request, Response
from pydantic import BaseModel

from app.config import settings
from app.consent import CONSENT_VERSION
from app.dependencies import get_owned_session, get_optional_session_token, get_optional_user
from app.middleware.rate_limit import limiter
from app.models import AssessmentSession
from app.models.user import PublicUser
from app.services.session_service import (
    delete_sessions,
    get_session_detail,
    list_sessions_for_token,
    list_sessions_for_user,
)
from app.utils.cookies import SESSION_COOKIE, set_cookie
from app.utils.http_error import HttpError
from app.utils.session_token import generate_session_token, hash_session_token, session_expires_at
from app.utils.time import utcnow

sessions_router = APIRouter(prefix="/sessions", tags=["sessions"])


class CreateSessionBody(BaseModel):
    locale: str = "pt"
    consent: bool = False


class UpdateSessionBody(BaseModel):
    title: str


def locale_from_header(accept_language: str | None, override: str | None = None) -> str:
    if override and override in ("pt", "en"):
        return override
    if accept_language and accept_language.lower().startswith("en"):
        return "en"
    return "pt"


async def guest_consent_at(token_hash: str, consent: bool) -> datetime:
    """New guest sessions inherit the consent this browser already gave for the current terms."""
    if consent:
        return utcnow()

    consented = await AssessmentSession.find_one(
        AssessmentSession.session_token_hash == token_hash,
        AssessmentSession.consent_version == CONSENT_VERSION,
    )
    if not consented or not consented.consent_at:
        raise HttpError(400, "É necessário aceitar os termos de uso e a política de privacidade")
    return consented.consent_at


@sessions_router.post("")
@limiter.limit(lambda: f"{settings.rate_limit_sessions_per_hour}/hour")
async def create_session(
    request: Request,
    response: Response,
    body: CreateSessionBody | None = None,
    accept_language: str | None = Header(default=None),
    session_token: str | None = Depends(get_optional_session_token),
    user: PublicUser | None = Depends(get_optional_user),
):
    body = body or CreateSessionBody()
    locale = locale_from_header(accept_language, body.locale)
    token = session_token or generate_session_token()
    token_hash = hash_session_token(token)
    now = utcnow()

    session = AssessmentSession(
        title="Nova sessão" if locale == "pt" else "New session",
        session_token_hash=token_hash,
        user_id=PydanticObjectId(user.id) if user else None,
        expires_at=None if user else session_expires_at(),
        created_at=now,
        updated_at=now,
    )
    if not user:
        session.consent_version = CONSENT_VERSION
        session.consent_at = await guest_consent_at(token_hash, body.consent)
    await session.insert()

    set_cookie(response, SESSION_COOKIE, token, settings.session_ttl_hours * 3600)

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
    session.updated_at = utcnow()
    await session.save()
    return await get_session_detail(session)


@sessions_router.delete("/{session_id}")
async def delete_session(session: AssessmentSession = Depends(get_owned_session)):
    await delete_sessions([session.id])
    return {"ok": True}
