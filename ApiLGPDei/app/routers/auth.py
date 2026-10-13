from fastapi import APIRouter, Cookie, Depends, Response

from app.dependencies import get_current_user
from app.models.user import PublicUser
from app.services.auth_service import LoginBody, RegisterBody, login_user, register_user
from app.services.session_service import link_sessions_for_token

auth_router = APIRouter(prefix="/auth", tags=["auth"])

AUTH_COOKIE = "auth_token"
SESSION_COOKIE = "session_token"
AUTH_MAX_AGE = 7 * 24 * 3600


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=AUTH_COOKIE,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=AUTH_MAX_AGE,
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(key=AUTH_COOKIE, path="/", samesite="lax")
    response.delete_cookie(key=SESSION_COOKIE, path="/", samesite="lax")


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
