from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session, select

from app.db import get_session
from app.deps import get_current_user
from app.models import Profile, User
from app.schemas import PassportResponse
from app.services.passport import passport_for_user
from app.services.pdf import build_passport_pdf

router = APIRouter(prefix="/passport", tags=["passport"])


@router.get("/me", response_model=PassportResponse)
def my_passport(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)) -> dict:
    try:
        return passport_for_user(session, current_user.id or 0)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/public/{username}", response_model=PassportResponse)
def public_passport(username: str, session: Session = Depends(get_session)) -> dict:
    profile = session.exec(select(Profile).where(Profile.username == username.lower())).first()
    if not profile or not profile.visibility_public:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Passport not found")
    try:
        return passport_for_user(session, profile.user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/export-pdf")
def export_pdf(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)) -> Response:
    try:
        passport = passport_for_user(session, current_user.id or 0)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    profile = passport["profile"]
    pdf = build_passport_pdf(passport)
    filename = f"omniskill-{profile.username or current_user.id}.pdf"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

