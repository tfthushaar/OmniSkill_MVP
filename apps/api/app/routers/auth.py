from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.config import settings
from app.db import get_session
from app.deps import get_current_user
from app.models import Profile, User, UserRole
from app.schemas import AuthResponse, LoginRequest, MeResponse, RegisterRequest
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(tags=["auth"])


@router.post("/auth/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, session: Session = Depends(get_session)) -> AuthResponse:
    existing = session.exec(select(User).where(User.email == payload.email.lower())).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    role = UserRole.admin if payload.admin_invite_code and payload.admin_invite_code == settings.admin_invite_code else UserRole.member
    user = User(email=payload.email.lower(), password_hash=hash_password(payload.password), role=role)
    session.add(user)
    session.commit()
    session.refresh(user)
    token = create_access_token(user.id or 0, user.role.value)
    return AuthResponse(access_token=token, user=user)


@router.post("/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest, session: Session = Depends(get_session)) -> AuthResponse:
    user = session.exec(select(User).where(User.email == payload.email.lower())).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token(user.id or 0, user.role.value)
    return AuthResponse(access_token=token, user=user)


@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)) -> MeResponse:
    profile = session.exec(select(Profile).where(Profile.user_id == current_user.id)).first()
    return MeResponse(user=current_user, profile=profile)

