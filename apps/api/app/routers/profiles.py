from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db import get_session
from app.deps import get_current_user
from app.models import AuditLog, Profile, User, utc_now
from app.schemas import ProfileRead, ProfileUpsert

router = APIRouter(tags=["profiles"])


@router.patch("/profile", response_model=ProfileRead)
def upsert_profile(
    payload: ProfileUpsert,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Profile:
    username = payload.username.lower()
    existing_username = session.exec(select(Profile).where(Profile.username == username)).first()
    if existing_username and existing_username.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")

    profile = session.exec(select(Profile).where(Profile.user_id == current_user.id)).first()
    if not profile:
        profile = Profile(user_id=current_user.id or 0)
        session.add(profile)

    profile.name = payload.name.strip()
    profile.username = username
    profile.headline = payload.headline.strip()
    profile.college = payload.college.strip()
    profile.graduation_year = payload.graduation_year
    profile.bio = payload.bio.strip()
    profile.role_identity = payload.role_identity.strip()
    profile.visibility_public = payload.visibility_public
    profile.updated_at = utc_now()
    session.add(AuditLog(actor_user_id=current_user.id, action="profile.upsert", target_type="profile"))
    session.commit()
    session.refresh(profile)
    return profile


@router.get("/profile", response_model=ProfileRead)
def get_profile(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)) -> Profile:
    profile = session.exec(select(Profile).where(Profile.user_id == current_user.id)).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile

