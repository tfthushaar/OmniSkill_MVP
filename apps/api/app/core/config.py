import os
from dataclasses import dataclass, field


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    app_name: str = "Omni-Skill API"
    database_url: str = field(default_factory=lambda: os.getenv("DATABASE_URL", "sqlite:///./omniskill.db"))
    secret_key: str = field(default_factory=lambda: os.getenv("SECRET_KEY", "dev-secret-change-in-production"))
    token_expire_minutes: int = field(default_factory=lambda: int(os.getenv("TOKEN_EXPIRE_MINUTES", "10080")))
    admin_invite_code: str = field(default_factory=lambda: os.getenv("ADMIN_INVITE_CODE", ""))
    frontend_url: str = field(default_factory=lambda: os.getenv("FRONTEND_URL", "http://localhost:3000"))
    upload_dir: str = field(default_factory=lambda: os.getenv("UPLOAD_DIR", "uploads"))
    # Seed first admin on startup (optional – set both or neither)
    seed_admin_email: str = field(default_factory=lambda: os.getenv("SEED_ADMIN_EMAIL", ""))
    seed_admin_password: str = field(default_factory=lambda: os.getenv("SEED_ADMIN_PASSWORD", ""))
    cors_origins: list[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        origins = os.getenv(
            "CORS_ORIGINS",
            f"{self.frontend_url},http://127.0.0.1:3000,http://localhost:3000",
        )
        object.__setattr__(self, "cors_origins", _split_csv(origins))


settings = Settings()
