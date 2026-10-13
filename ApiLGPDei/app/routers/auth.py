from fastapi import APIRouter, Cookie, Depends, Response

from app.config import settings
from app.dependencies import get_current_user
from app.models.user import PublicUser
from app.services.auth_service import LoginBody, RegisterBody, login_user, register_user
from app.services.session_service import link_sessions_for_token
from app.utils.cookies import AUTH_COOKIE, SESSION_COOKIE, delete_cookie, set_cookie

auth_router = APIRouter(prefix="/auth", tags=["auth"])


def set_auth_cookie(response: Response, token: str) -> None:
    set_cookie(response, AUTH_COOKIE, token, settings.jwt_expires_days * 24 * 3600)


def clear_auth_cookies(response: Response) -> None:
    delete_cookie(response, AUTH_COOKIE)
    delete_cookie(response, SESSION_COOKIE)


@auth_router.post("/register")
async def register(
    body: RegisterBody,
    response: Response,
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
):
    result = await register_user(body)
    set_auth_cookie(response, result["token"])
    if session_token:
        await link_sessions_for_token(session_token, result["user"]["id"])
    return {"user": result["user"]}


@auth_router.post("/login")
async def login(
    body: LoginBody,
    response: Response,
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
):
    result = await login_user(body)
    set_auth_cookie(response, result["token"])
    if session_token:
        await link_sessions_for_token(session_token, result["user"]["id"])
    return {"user": result["user"]}


@auth_router.get("/me")
async def me(user: PublicUser = Depends(get_current_user)):
    return {"user": user.model_dump()}


@auth_router.post("/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"ok": True}
