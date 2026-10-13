from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 3334
    mongodb_uri: str = "mongodb://127.0.0.1:27017/lgpdei"
    session_secret: str
    jwt_secret: str
    jwt_expires_days: int = 7
    session_ttl_hours: int = 72
    anthropic_api_key: str
    anthropic_model: str = "claude-haiku-4-5"
    cors_origins: str = "http://localhost:3000"
    # Web and API on different sites need SameSite=None, which browsers only accept with Secure.
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    cookie_secure: bool = False
    rate_limit_sessions_per_hour: int = 5
    rate_limit_messages_per_hour: int = 30
    rate_limit_uploads_per_hour: int = 10
    max_files_per_session: int = 10
    max_file_size_mb: int = 5
    max_extracted_text_chars: int = 50000

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024


settings = Settings()  # type: ignore[call-arg]
