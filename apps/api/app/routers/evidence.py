from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlmodel import Session, select

from app.core.config import settings
from app.db import get_session
from app.deps import get_current_user
from app.models import AuditLog, EvidenceClaim, EvidenceFile, User
from app.schemas import EvidenceCreate, EvidenceDetail, EvidenceFileRead, EvidenceRead, UploadUrlResponse

router = APIRouter(tags=["evidence"])


def _claim_for_user(session: Session, claim_id: int, user_id: int) -> EvidenceClaim:
    claim = session.get(EvidenceClaim, claim_id)
    if not claim or claim.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidence not found")
    return claim


@router.post("/evidence", response_model=EvidenceRead, status_code=status.HTTP_201_CREATED)
def create_evidence(
    payload: EvidenceCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> EvidenceClaim:
    claim = EvidenceClaim(user_id=current_user.id or 0, **payload.model_dump())
    session.add(claim)
    session.add(AuditLog(actor_user_id=current_user.id, action="evidence.submit", target_type="evidence_claim"))
    session.commit()
    session.refresh(claim)
    return claim


@router.get("/evidence", response_model=list[EvidenceRead])
def list_evidence(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)) -> list[EvidenceClaim]:
    return session.exec(
        select(EvidenceClaim).where(EvidenceClaim.user_id == current_user.id).order_by(EvidenceClaim.submitted_at.desc())
    ).all()


@router.get("/evidence/{claim_id}", response_model=EvidenceDetail)
def get_evidence(
    claim_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> EvidenceDetail:
    claim = _claim_for_user(session, claim_id, current_user.id or 0)
    files = session.exec(select(EvidenceFile).where(EvidenceFile.evidence_claim_id == claim.id)).all()
    return EvidenceDetail(**EvidenceRead.model_validate(claim).model_dump(), files=files)


@router.post("/evidence/{claim_id}/files", response_model=EvidenceFileRead, status_code=status.HTTP_201_CREATED)
async def upload_evidence_file(
    claim_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> EvidenceFile:
    claim = _claim_for_user(session, claim_id, current_user.id or 0)
    upload_root = Path(settings.upload_dir)
    upload_root.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename or "proof").suffix
    storage_name = f"{uuid4().hex}{suffix}"
    storage_path = upload_root / storage_name
    storage_path.write_bytes(await file.read())
    record = EvidenceFile(
        evidence_claim_id=claim.id or 0,
        user_id=current_user.id or 0,
        file_name=file.filename or storage_name,
        content_type=file.content_type or "",
        storage_path=str(storage_path),
    )
    session.add(record)
    session.add(AuditLog(actor_user_id=current_user.id, action="evidence.file_upload", target_type="evidence_claim", target_id=claim.id))
    session.commit()
    session.refresh(record)
    return record


@router.post("/files/upload-url", response_model=UploadUrlResponse)
def upload_url() -> UploadUrlResponse:
    return UploadUrlResponse(
        upload_url="/evidence/{claim_id}/files",
        note="The local MVP stores proof files through multipart uploads on the evidence-specific endpoint.",
    )

