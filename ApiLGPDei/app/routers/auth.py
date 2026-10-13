import json
from contextlib import suppress

from fastapi import APIRouter, Cookie, Depends, Request, Response

from app.config import settings
from app.dependencies import get_current_account, get_current_user, get_optional_session_token
from app.middleware.rate_limit import limiter
from app.models.user import PublicUser, User
from app.services.account_service import delete_account, export_account
from app.services.auth_service import (
    LoginBody,
    PasswordBody,
    RegisterBody,
    UpdateProfileBody,
    confirm_password,
    get_user_from_token,
    issue_token,
    login_user,
    register_user,
    revoke_tokens,
    to_public_user,
    update_profile,
)
from app.services.session_service import link_sessions_for_token
from app.utils.cookies import AUTH_COOKIE, SESSION_COOKIE, delete_cookie, set_cookie
from app.utils.http_error import HttpError

auth_router = APIRouter(prefix="/auth", tags=["auth"])

def auth_rate_limit() -> str:
    return f"{settings.rate_limit_auth_per_minute}/minute"


def set_auth_cookie(response: Response, user: User) -> None:
    set_cookie(response, AUTH_COOKIE, issue_token(user), settings.jwt_expires_days * 24 * 3600)


def clear_auth_cookies(response: Response) -> None:
    delete_cookie(response, AUTH_COOKIE)
    delete_cookie(response, SESSION_COOKIE)


async def sign_in(response: Response, user: User, session_token: str | None) -> dict:
    set_auth_cookie(response, user)
    if session_token:
        await link_sessions_for_token(session_token, str(user.id))
    return {"user": to_public_user(user).model_dump()}


@auth_router.post("/register")
@limiter.limit(auth_rate_limit)
async def register(
    request: Request,
    body: RegisterBody,
    response: Response,
    session_token: str | None = Depends(get_optional_session_token),
):
    return await sign_in(response, await register_user(body), session_token)


@auth_router.post("/login")
@limiter.limit(auth_rate_limit)
async def login(
    request: Request,
    body: LoginBody,
    response: Response,
    session_token: str | None = Depends(get_optional_session_token),
):
    return await sign_in(response, await login_user(body), session_token)


@auth_router.get("/me")
async def me(user: PublicUser = Depends(get_current_user)):
    return {"user": user.model_dump()}


@auth_router.patch("/me")
@limiter.limit(auth_rate_limit)
async def update_me(
    request: Request,
    body: UpdateProfileBody,
    response: Response,
    user: User = Depends(get_current_account),
):
    if await update_profile(user, body):
        set_auth_cookie(response, user)
    return {"user": to_public_user(user).model_dump()}


@auth_router.delete("/me")
@limiter.limit(auth_rate_limit)
async def delete_me(
    request: Request,
    body: PasswordBody,
    response: Response,
    user: User = Depends(get_current_account),
):
    confirm_password(user, body.password)
    await delete_account(user)
    clear_auth_cookies(response)
    return {"ok": True}


@auth_router.get("/me/export")
@limiter.limit(auth_rate_limit)
async def export_me(request: Request, user: User = Depends(get_current_account)):
    data = await export_account(user)
    return Response(
        content=json.dumps(data, ensure_ascii=False, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": 'attachment; filename="lgpdei-meus-dados.json"'},
    )


@auth_router.post("/logout")
async def logout(
    response: Response,
    auth_token: str | None = Cookie(default=None, alias=AUTH_COOKIE),
):
    if auth_token:
        with suppress(HttpError):
            await revoke_tokens(await get_user_from_token(auth_token))
    clear_auth_cookies(response)
    return {"ok": True}
