import re

import bcrypt
from beanie import PydanticObjectId
from pydantic import BaseModel, EmailStr, Field, field_validator
from pymongo.errors import DuplicateKeyError

from app.consent import CONSENT_VERSION
from app.models.user import PublicUser, User
from app.utils.http_error import HttpError
from app.utils.jwt import create_access_token, decode_access_token
from app.utils.time import utcnow

PASSWORD_PATTERN = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,128}$"
)


class RegisterBody(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    consent: bool = False
    adopt_guest_sessions: bool = False

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if not PASSWORD_PATTERN.fullmatch(value):
            raise ValueError(
                "A senha deve ter pelo menos 8 caracteres, "
                "com letra maiúscula, minúscula e símbolo"
            )
        return value


class LoginBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    adopt_guest_sessions: bool = False


class UpdateProfileBody(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    email: EmailStr | None = None


class PasswordBody(BaseModel):
    password: str = Field(min_length=1, max_length=128)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def to_public_user(user: User) -> PublicUser:
    return PublicUser(id=str(user.id), name=user.name, email=user.email)


def issue_token(user: User) -> str:
    return create_access_token(str(user.id), user.token_version)


async def save_unique_email(user: User) -> None:
    try:
        await user.save()
    except DuplicateKeyError as exc:
        raise HttpError(409, "E-mail já cadastrado") from exc


async def register_user(body: RegisterBody) -> User:
    if not body.consent:
        raise HttpError(400, "É necessário aceitar os termos de uso e a política de privacidade")

    user = User(
        name=body.name.strip(),
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        consent_version=CONSENT_VERSION,
        consent_at=utcnow(),
    )
    await save_unique_email(user)
    return user


async def login_user(body: LoginBody) -> User:
    user = await User.find_one(User.email == body.email.lower())
    if not user or not verify_password(body.password, user.password_hash):
        raise HttpError(401, "Credenciais inválidas")
    return user


async def get_user_from_token(token: str) -> User:
    user_id, token_version = decode_access_token(token)
    try:
        oid = PydanticObjectId(user_id)
    except Exception as exc:
        raise HttpError(401, "Não autorizado") from exc

    user = await User.get(oid)
    if not user or user.token_version != token_version:
        raise HttpError(401, "Não autorizado")
    return user


async def revoke_tokens(user: User) -> None:
    user.token_version += 1
    await user.save()


async def update_profile(user: User, body: UpdateProfileBody) -> bool:
    """Returns True when the e-mail changed, which revokes the user's existing tokens."""
    email_changed = False
    if body.name is not None:
        name = body.name.strip()
        if len(name) < 2:
            raise HttpError(400, "Nome inválido")
        user.name = name

    if body.email is not None:
        email = body.email.lower()
        if email != user.email:
            user.email = email
            user.token_version += 1
            email_changed = True

    await save_unique_email(user)
    return email_changed


def confirm_password(user: User, password: str) -> None:
    if not verify_password(password, user.password_hash):
        raise HttpError(403, "Senha incorreta")
