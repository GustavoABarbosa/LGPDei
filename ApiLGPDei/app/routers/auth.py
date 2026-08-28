from fastapi import APIRouter, Cookie, Depends, Response

from app.dependencies import get_current_user
from app.models.user import PublicUser
from app.services.auth_service import LoginBody, RegisterBody, login_user, register_user

auth_router = APIRouter(prefix="/auth", tags=["auth"])

AUTH_COOKIE = "auth_token"
AUTH_MAX_AGE = 7 * 24 * 3600


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=AUTH_COOKIE,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=AUTH_MAX_AGE,
    )


@auth_router.post("/register")
async def register(body: RegisterBody, response: Response):
    result = await register_user(body)
    set_auth_cookie(response, result["token"])
    return {"user": result["user"]}


@auth_router.post("/login")
async def login(body: LoginBody, response: Response):
    result = await login_user(body)
    set_auth_cookie(response, result["token"])
    return {"user": result["user"]}


@auth_router.get("/me")
async def me(user: PublicUser = Depends(get_current_user)):
    return {"user": user.model_dump()}


@auth_router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key=AUTH_COOKIE)
    return {"ok": True}
