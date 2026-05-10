import os
from dataclasses import dataclass


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    app_name: str = "Omni-Skill API"
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./omniskill.db")
    secret_key: str = os.getenv("SECRET_KEY", "dev-secret-change-me")
    token_expire_minutes: int = int(os.getenv("TOKEN_EXPIRE_MINUTES", "10080"))
    admin_invite_code: str = os.getenv("ADMIN_INVITE_CODE", "omni-admin-dev")
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    upload_dir: str = os.getenv("UPLOAD_DIR", "uploads")
    cors_origins: list[str] = None  # type: ignore[assignment]

    def __post_init__(self) -> None:
        origins = os.getenv(
            "CORS_ORIGINS",
            f"{self.frontend_url},http://127.0.0.1:3000,http://localhost:3000",
        )
        object.__setattr__(self, "cors_origins", _split_csv(origins))


settings = Settings()

