from fastapi import Cookie, Depends

from app.models import AssessmentSession
from app.models.user import PublicUser
from app.services.auth_service import get_user_by_id
from app.utils.http_error import HttpError
from app.utils.jwt import decode_access_token
from app.utils.session_token import hash_session_token


async def get_session_token(session_token: str | None = Cookie(default=None)) -> str:
    if not session_token:
        raise HttpError(401, "Sessão não autenticada")
    return session_token


async def get_optional_session_token(
    session_token: str | None = Cookie(default=None),
) -> str | None:
    return session_token


async def get_current_user(
    auth_token: str | None = Cookie(default=None, alias="auth_token"),
) -> PublicUser:
    if not auth_token:
        raise HttpError(401, "Não autorizado")
    user_id = decode_access_token(auth_token)
    return await get_user_by_id(user_id)


async def get_optional_user(
    auth_token: str | None = Cookie(default=None, alias="auth_token"),
) -> PublicUser | None:
    if not auth_token:
        return None
    try:
        user_id = decode_access_token(auth_token)
        return await get_user_by_id(user_id)
    except HttpError:
        return None


async def get_owned_session(
    session_id: str,
    session_token: str | None = Depends(get_optional_session_token),
    user: PublicUser | None = Depends(get_optional_user),
) -> AssessmentSession:
    from beanie import PydanticObjectId

    try:
        oid = PydanticObjectId(session_id)
    except Exception as exc:
        raise HttpError(404, "Sessão não encontrada") from exc

    session = await AssessmentSession.get(oid)
    if not session:
        raise HttpError(404, "Sessão não encontrada")

    if user and session.user_id and str(session.user_id) == user.id:
        return session

    if session_token and session.session_token_hash == hash_session_token(session_token):
        return session

    raise HttpError(403, "Acesso negado à sessão")
