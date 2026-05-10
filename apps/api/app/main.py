from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select

from app.core.config import settings
from app.db import engine, init_db
from app.models import User, UserRole
from app.routers import admin, auth, connectors, evidence, passport, profiles
from app.schemas import HealthResponse
from app.security import hash_password


def _seed_admin(email: str, password: str) -> None:
    """Create or promote the seed admin user if it doesn't already exist as admin."""
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == email.lower())).first()
        if user:
            if user.role == UserRole.admin:
                return  # already admin, nothing to do
            user.role = UserRole.admin
            user.password_hash = hash_password(password)
            session.add(user)
            session.commit()
        else:
            new_user = User(
                email=email.lower(),
                password_hash=hash_password(password),
                role=UserRole.admin,
            )
            session.add(new_user)
            session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    init_db()
    if settings.seed_admin_email and settings.seed_admin_password:
        _seed_admin(settings.seed_admin_email, settings.seed_admin_password)
    yield


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_path = Path(settings.upload_dir)
upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service=settings.app_name)


app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(evidence.router)
app.include_router(admin.router)
app.include_router(passport.router)
app.include_router(connectors.router)
