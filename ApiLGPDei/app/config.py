from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

PLACEHOLDER_SECRET_PREFIXES = ("change-me", "your-", "replace-me", "dev-only")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: Literal["development", "production", "test"] = "development"
    port: int = 3334
    mongodb_uri: str = "mongodb://127.0.0.1:27017/lgpdei"
    session_secret: str
    jwt_secret: str
    jwt_expires_days: int = 7
    session_ttl_hours: int = 72
    anthropic_api_key: str
    anthropic_model: str = "claude-haiku-5-5"
    cors_origins: str = "http://localhost:3000"
    # Web and API on different sites need SameSite=None, which browsers only accept with Secure.
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    cookie_secure: bool = True
    rate_limit_auth_per_minute: int = 10
    rate_limit_sessions_per_hour: int = 5
    rate_limit_messages_per_hour: int = 30
    rate_limit_uploads_per_hour: int = 10
    max_files_per_session: int = 10
    max_file_size_mb: int = 5
    max_extracted_text_chars: int = 50000
    pageindex_min_chars: int = 8000
    max_retrieved_chars: int = 24000
    max_corpus_retrieved_chars: int = 16000
    # warn | block — heuristic only; does not claim perfect PII filtering
    pii_mode: Literal["off", "warn", "block"] = "warn"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024

    @property
    def csrf_required(self) -> bool:
        return self.cookie_samesite == "none"

    @staticmethod
    def _is_weak_secret(value: str) -> bool:
        lowered = value.strip().lower()
        if len(value) < 32:
            return True
        return any(lowered.startswith(prefix) for prefix in PLACEHOLDER_SECRET_PREFIXES)

    @field_validator("session_secret", "jwt_secret")
    @classmethod
    def secrets_min_length(cls, value: str) -> str:
        if len(value) < 32:
            raise ValueError("must be at least 32 characters")
        return value

    @model_validator(mode="after")
    def reject_placeholder_secrets_in_production(self) -> "Settings":
        if self.app_env == "production":
            for name, value in (
                ("SESSION_SECRET", self.session_secret),
                ("JWT_SECRET", self.jwt_secret),
            ):
                if self._is_weak_secret(value):
                    raise ValueError(
                        f"{name} must not be a placeholder or short secret in production"
                    )
        return self


settings = Settings()  # type: ignore[call-arg]
