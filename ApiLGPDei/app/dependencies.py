from beanie import PydanticObjectId
from fastapi import Cookie, Depends, Request

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


async def get_optional_account(
    auth_token: str | None = Cookie(default=None, alias="auth_token"),
) -> User | None:
    if not auth_token:
        return None
    try:
        return await get_user_from_token(auth_token)
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

    # Account-owned sessions require a matching JWT — session_token alone is not enough.
    if session.user_id is not None:
        if user and str(session.user_id) == user.id:
            return session
        raise HttpError(403, "Acesso negado à sessão")

    if session_token and session.session_token_hash == hash_session_token(session_token):
        return session

    raise HttpError(403, "Acesso negado à sessão")


async def get_consented_session(
    session: AssessmentSession = Depends(get_owned_session),
    account: User | None = Depends(get_optional_account),
) -> AssessmentSession:
    """Guests and accounts must have accepted the current terms before sending data."""
    if session.user_id is None:
        if session.consent_version != CONSENT_VERSION:
            raise HttpError(
                403,
                "É necessário aceitar os termos de uso e a política de privacidade",
            )
        return session

    if not account or str(account.id) != str(session.user_id):
        raise HttpError(403, "Acesso negado à sessão")

    if account.consent_version != CONSENT_VERSION:
        raise HttpError(
            403,
            "É necessário aceitar novamente os termos de uso e a política de privacidade",
        )
    return session


def require_csrf_header_if_needed(request: Request) -> None:
    """No-op helper kept for tests; middleware enforces CSRF when SameSite=none."""
    _ = request
