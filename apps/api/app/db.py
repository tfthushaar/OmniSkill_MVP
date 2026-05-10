from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings


def _build_engine_url(raw: str) -> str:
    """
    Normalise the DATABASE_URL so it always uses the correct driver.

    - sqlite://  → unchanged (uses built-in sqlite3)
    - postgresql:// or postgres:// → postgresql+psycopg:// (psycopg v3)
    - postgresql+psycopg:// → unchanged (already correct)
    """
    if raw.startswith("sqlite"):
        return raw
    if raw.startswith("postgres://"):
        raw = raw.replace("postgres://", "postgresql://", 1)
    if raw.startswith("postgresql://"):
        return raw.replace("postgresql://", "postgresql+psycopg://", 1)
    return raw


def _engine_kwargs(url: str) -> dict:
    if url.startswith("sqlite"):
        return {"connect_args": {"check_same_thread": False}}
    return {}


_url = _build_engine_url(settings.database_url)
engine = create_engine(_url, **_engine_kwargs(_url))


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
