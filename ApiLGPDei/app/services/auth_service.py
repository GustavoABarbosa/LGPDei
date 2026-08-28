import bcrypt
from pydantic import BaseModel, EmailStr, Field

from app.models.user import PublicUser, User
from app.utils.http_error import HttpError
from app.utils.jwt import create_access_token


class RegisterBody(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def to_public_user(user: User) -> PublicUser:
    return PublicUser(id=str(user.id), name=user.name, email=user.email)


async def register_user(body: RegisterBody) -> dict:
    existing = await User.find_one(User.email == body.email)
    if existing:
        raise HttpError(409, "E-mail já cadastrado")

    user = User(
        name=body.name.strip(),
        email=body.email.lower(),
        password_hash=hash_password(body.password),
    )
    await user.insert()

    return {
        "user": to_public_user(user).model_dump(),
        "token": create_access_token(str(user.id)),
    }


async def login_user(body: LoginBody) -> dict:
    user = await User.find_one(User.email == body.email.lower())
    if not user or not verify_password(body.password, user.password_hash):
        raise HttpError(401, "Credenciais inválidas")

    return {
        "user": to_public_user(user).model_dump(),
        "token": create_access_token(str(user.id)),
    }


async def get_user_by_id(user_id: str) -> PublicUser:
    from beanie import PydanticObjectId

    try:
        oid = PydanticObjectId(user_id)
    except Exception as exc:
        raise HttpError(401, "Não autorizado") from exc

    user = await User.get(oid)
    if not user:
        raise HttpError(401, "Não autorizado")

    return to_public_user(user)
