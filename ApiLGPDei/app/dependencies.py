from beanie import PydanticObjectId
from fastapi import Cookie, Depends

from app.consent import CONSENT_VERSION
from app.models import AssessmentSession
from app.models.user import PublicUser, User
from app.services.auth_service import get_user_from_token, to_public_user
from app.utils.http_error import HttpError
from app.utils.session_token import hash_session_token


async def get_optional_session_token(
    session_token: str | None = Cookie(default=None),
) -> str | None:
    return session_token


async def get_current_account(
    auth_token: str | None = Cookie(default=None, alias="auth_token"),
) -> User:
    if not auth_token:
        raise HttpError(401, "Não autorizado")
    return await get_user_from_token(auth_token)


async def get_current_user(user: User = Depends(get_current_account)) -> PublicUser:
    return to_public_user(user)


async def get_optional_user(
    auth_token: str | None = Cookie(default=None, alias="auth_token"),
) -> PublicUser | None:
    if not auth_token:
        return None
    try:
        return to_public_user(await get_user_from_token(auth_token))
    except HttpError:
        return None


async def get_owned_session(
    session_id: str,
    session_token: str | None = Depends(get_optional_session_token),
    user: PublicUser | None = Depends(get_optional_user),
) -> AssessmentSession:
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


async def get_consented_session(
    session: AssessmentSession = Depends(get_owned_session),
) -> AssessmentSession:
    """Guests must have accepted the current terms on the session before sending data to it."""
    if session.user_id is None and session.consent_version != CONSENT_VERSION:
        raise HttpError(403, "É necessário aceitar os termos de uso e a política de privacidade")
    return session
