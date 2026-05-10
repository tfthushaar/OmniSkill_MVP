from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, delete, select

from app.db import get_session
from app.deps import require_admin
from app.models import (
    AuditLog,
    EvidenceClaim,
    ResumeBullet,
    SkillCard,
    User,
    VerificationReview,
    VerificationStatus,
    utc_now,
)
from app.schemas import EvidenceRead, ReviewRequest
from app.services.passport import build_resume_bullet, build_skill_card, confidence_for_level

router = APIRouter(prefix="/admin", tags=["admin"])


def _claim_or_404(session: Session, claim_id: int) -> EvidenceClaim:
    claim = session.get(EvidenceClaim, claim_id)
    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidence not found")
    return claim


@router.get("/evidence/pending", response_model=list[EvidenceRead])
def pending_evidence(_: User = Depends(require_admin), session: Session = Depends(get_session)) -> list[EvidenceClaim]:
    return session.exec(
        select(EvidenceClaim)
        .where(EvidenceClaim.status.in_([VerificationStatus.submitted, VerificationStatus.under_review, VerificationStatus.needs_more_info]))
        .order_by(EvidenceClaim.submitted_at.asc())
    ).all()


@router.post("/evidence/{claim_id}/approve", response_model=EvidenceRead)
def approve_evidence(
    claim_id: int,
    payload: ReviewRequest,
    reviewer: User = Depends(require_admin),
    session: Session = Depends(get_session),
) -> EvidenceClaim:
    claim = _claim_or_404(session, claim_id)
    claim.status = VerificationStatus.approved
    claim.verification_level = payload.verification_level
    claim.confidence = confidence_for_level(payload.verification_level)
    claim.reviewer_notes = payload.notes
    claim.limitations = "Verified facts support this card; unsupported personality or employability claims are intentionally excluded."
    claim.reviewed_at = utc_now()
    claim.updated_at = utc_now()

    session.exec(delete(SkillCard).where(SkillCard.evidence_claim_id == claim.id))
    session.exec(delete(ResumeBullet).where(ResumeBullet.evidence_claim_id == claim.id))
    session.add(build_skill_card(claim))
    session.add(build_resume_bullet(claim))
    session.add(
        VerificationReview(
            evidence_claim_id=claim.id or 0,
            reviewer_id=reviewer.id or 0,
            decision=VerificationStatus.approved,
            verification_level=payload.verification_level,
            notes=payload.notes,
        )
    )
    session.add(AuditLog(actor_user_id=reviewer.id, action="evidence.approve", target_type="evidence_claim", target_id=claim.id))
    session.commit()
    session.refresh(claim)
    return claim


@router.post("/evidence/{claim_id}/reject", response_model=EvidenceRead)
def reject_evidence(
    claim_id: int,
    payload: ReviewRequest,
    reviewer: User = Depends(require_admin),
    session: Session = Depends(get_session),
) -> EvidenceClaim:
    claim = _claim_or_404(session, claim_id)
    claim.status = VerificationStatus.rejected
    claim.reviewer_notes = payload.notes
    claim.reviewed_at = utc_now()
    claim.updated_at = utc_now()
    session.add(
        VerificationReview(
            evidence_claim_id=claim.id or 0,
            reviewer_id=reviewer.id or 0,
            decision=VerificationStatus.rejected,
            verification_level=1,
            notes=payload.notes,
        )
    )
    session.add(AuditLog(actor_user_id=reviewer.id, action="evidence.reject", target_type="evidence_claim", target_id=claim.id))
    session.commit()
    session.refresh(claim)
    return claim


@router.post("/evidence/{claim_id}/request-info", response_model=EvidenceRead)
def request_more_info(
    claim_id: int,
    payload: ReviewRequest,
    reviewer: User = Depends(require_admin),
    session: Session = Depends(get_session),
) -> EvidenceClaim:
    claim = _claim_or_404(session, claim_id)
    claim.status = VerificationStatus.needs_more_info
    claim.reviewer_notes = payload.notes
    claim.updated_at = utc_now()
    session.add(
        VerificationReview(
            evidence_claim_id=claim.id or 0,
            reviewer_id=reviewer.id or 0,
            decision=VerificationStatus.needs_more_info,
            verification_level=1,
            notes=payload.notes,
        )
    )
    session.add(AuditLog(actor_user_id=reviewer.id, action="evidence.request_info", target_type="evidence_claim", target_id=claim.id))
    session.commit()
    session.refresh(claim)
    return claim

